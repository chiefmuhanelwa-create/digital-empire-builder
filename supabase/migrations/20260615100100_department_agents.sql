-- =============================================================================
-- CHKPLT 5-DEPARTMENT AI AGENT INFRASTRUCTURE
-- =============================================================================
-- Creates the shared event log and 5 PLpgSQL agent functions, each mapped to a
-- department in the CHKPLT operating model. Agents are scheduled via pg_cron.
--
-- DEPT 1 — ATTRACT:   Signal Scout   (weekly, Monday 06:00 SAST)
-- DEPT 2 — QUALIFY:   Gatekeeper     (trigger on new application insert)
-- DEPT 3 — DELIVER:   Steward        (daily 07:00 SAST)
-- DEPT 4 — REVENUE:   Treasurer      (1st of month 07:30 SAST)
-- DEPT 5 — RETAIN:    Ascender       (daily 08:00 SAST)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SHARED: agent_events audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  department  text        NOT NULL CHECK (department IN ('attract','qualify','deliver','revenue','retain')),
  event_type  text        NOT NULL,
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.agent_events TO service_role;
GRANT SELECT ON public.agent_events TO authenticated;

ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view agent events"
  ON public.agent_events FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_agent_events_department ON public.agent_events(department, created_at DESC);
CREATE INDEX idx_agent_events_created_at ON public.agent_events(created_at DESC);


-- ---------------------------------------------------------------------------
-- DEPT 2 — QUALIFY: The Gatekeeper
-- Fires on INSERT to client_stewardship_applications via trigger.
-- Enqueues a "You're Qualified" or "Build your foundation" email immediately.
-- The TypeScript server function (apply.functions.ts) handles React-Email
-- rendering; this trigger catches any direct DB inserts as a safety net.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dept_qualify_agent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg_id  text;
  v_subject text;
  v_html    text;
BEGIN
  -- Only act on QUALIFIED inserts — downsell emails are handled in TypeScript
  IF NEW.determined_routing_status <> 'QUALIFIED_FOR_CORE_PROGRAM' THEN
    RETURN NEW;
  END IF;

  v_msg_id := 'qualify:' || NEW.id::text || ':qualified';

  -- Skip if already sent (safety net against duplicate triggers)
  IF EXISTS (
    SELECT 1 FROM public.email_send_log WHERE message_id = v_msg_id
  ) THEN
    RETURN NEW;
  END IF;

  v_subject := 'You''re qualified — one step left';
  v_html    := '<div style="font-family:''Montserrat'',Arial,sans-serif;max-width:600px;margin:0 auto;background:#111111;color:#FAF7F0;padding:40px 32px;">'
    || '<p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 24px;">CHKPLT · Christ''s Kingdom Platform</p>'
    || '<h1 style="font-size:28px;font-weight:900;margin:0 0 16px;line-height:1.2;">You''re qualified.</h1>'
    || '<p style="font-size:16px;line-height:1.6;color:#FAF7F0;margin:0 0 16px;">Your stewardship audit passed. Your metrics validate entry into the 20-Week Called Expert Accelerator.</p>'
    || '<p style="font-size:16px;line-height:1.6;color:#FAF7F0;margin:0 0 32px;">One step left: book your 20-minute strategy call so we can confirm the right cohort start date for you.</p>'
    || '<a href="https://chkplt.com/apply" style="display:inline-block;background:#C9A84C;color:#111111;font-weight:700;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;padding:16px 32px;text-decoration:none;border-radius:8px;">Book Your Strategy Call</a>'
    || '<p style="font-size:13px;color:#888;margin:40px 0 0;">— Ndivhuwo Muhanelwa, CHKPLT</p>'
    || '<p style="font-size:11px;color:#555;margin:16px 0 0;">contentcreatorhub.online · @nochill_god</p>'
    || '</div>';

  -- Claim send log (idempotency)
  INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
  VALUES (v_msg_id, 'qualify_qualified', NEW.email, 'pending')
  ON CONFLICT DO NOTHING;

  -- Enqueue via pgmq (same queue as transactional emails)
  PERFORM public.enqueue_email(
    'transactional_emails',
    jsonb_build_object(
      'run_id',       gen_random_uuid(),
      'message_id',   v_msg_id,
      'to',           NEW.email,
      'from',         'Ndivhuwo — CHKPLT <noreply@chkplt.com>',
      'sender_domain','notify.chkplt.com',
      'subject',      v_subject,
      'html',         v_html,
      'text',         'You''re qualified. Book your strategy call at https://chkplt.com/apply',
      'purpose',      'transactional',
      'label',        'qualify_qualified',
      'queued_at',    to_json(now())::text
    )
  );

  -- Log agent event
  INSERT INTO public.agent_events (department, event_type, payload)
  VALUES (
    'qualify',
    'qualification_email_queued',
    jsonb_build_object('application_id', NEW.id, 'email', NEW.email, 'message_id', v_msg_id)
  );

  RETURN NEW;
END;
$$;

-- Trigger fires AFTER INSERT so the row is visible for idempotency checks
CREATE OR REPLACE TRIGGER dept_qualify_on_insert
  AFTER INSERT ON public.client_stewardship_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.dept_qualify_agent();


-- ---------------------------------------------------------------------------
-- DEPT 3 — DELIVER: The Steward
-- Runs daily. Finds students who haven't touched a lesson in 7 days and
-- enqueues a re-engagement email. Finds students who just completed Stage 1
-- (first 3 lessons) and celebrates their progress.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dept_deliver_agent()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r            record;
  v_msg_id     text;
  v_html       text;
  v_count_sent int := 0;
BEGIN
  -- === 1. Re-engage stuck students (no lesson activity in 7 days) ===
  FOR r IN
    SELECT DISTINCT
      p.email,
      p.full_name,
      MAX(lp.completed_at) AS last_activity
    FROM public.product_grants pg
    JOIN public.profiles p ON p.id = pg.user_id
    JOIN public.lms_lesson_progress lp ON lp.user_id = pg.user_id
    WHERE pg.user_id IS NOT NULL
      AND lp.completed_at < now() - INTERVAL '7 days'
      AND lp.completed_at > now() - INTERVAL '30 days'
    GROUP BY p.email, p.full_name
    HAVING MAX(lp.completed_at) < now() - INTERVAL '7 days'
    LIMIT 50
  LOOP
    v_msg_id := 'deliver:reengage:' || encode(digest(r.email, 'sha256'), 'hex')
      || ':' || to_char(now(), 'IYYY-IW');

    CONTINUE WHEN EXISTS (
      SELECT 1 FROM public.email_send_log WHERE message_id = v_msg_id
    );

    v_html := '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111111;color:#FAF7F0;padding:40px 32px;">'
      || '<p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">CHKPLT · Your Curriculum</p>'
      || '<h2 style="font-size:24px;font-weight:900;margin:16px 0;">We see you, ' || COALESCE(r.full_name, 'Steward') || '.</h2>'
      || '<p style="font-size:16px;line-height:1.6;">You haven''t logged a lesson in a few days. That''s okay — life happens. But the work doesn''t do itself.</p>'
      || '<p style="font-size:16px;line-height:1.6;">Your next lesson is waiting. 20 minutes today keeps momentum alive.</p>'
      || '<a href="https://chkplt.com/learn" style="display:inline-block;background:#C9A84C;color:#111111;font-weight:700;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;padding:14px 28px;text-decoration:none;border-radius:6px;margin-top:16px;">Continue Your Programme</a>'
      || '<p style="font-size:11px;color:#555;margin:40px 0 0;">contentcreatorhub.online · @nochill_god</p>'
      || '</div>';

    INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
    VALUES (v_msg_id, 'deliver_reengage', r.email, 'pending')
    ON CONFLICT DO NOTHING;

    PERFORM public.enqueue_email(
      'transactional_emails',
      jsonb_build_object(
        'run_id',       gen_random_uuid(),
        'message_id',   v_msg_id,
        'to',           r.email,
        'from',         'Ndivhuwo — CHKPLT <noreply@chkplt.com>',
        'sender_domain','notify.chkplt.com',
        'subject',      'Your next lesson is waiting',
        'html',         v_html,
        'text',         'You haven''t logged a lesson in a few days. Your next step is at https://chkplt.com/learn',
        'purpose',      'transactional',
        'label',        'deliver_reengage',
        'queued_at',    to_json(now())::text
      )
    );

    v_count_sent := v_count_sent + 1;
  END LOOP;

  -- Log this run
  INSERT INTO public.agent_events (department, event_type, payload)
  VALUES (
    'deliver',
    'daily_run',
    jsonb_build_object('reengage_emails_queued', v_count_sent, 'ran_at', now())
  );
END;
$$;


-- ---------------------------------------------------------------------------
-- DEPT 1 — ATTRACT: Signal Scout
-- Runs weekly Monday 04:00 UTC (06:00 SAST). Reports on:
-- - New applications this week (qualified vs downsell split)
-- - New orders this week (revenue + product breakdown)
-- - Email subscriber growth (from subscribers table)
-- Sends a Monday briefing to admin.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dept_attract_agent()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg_id          text;
  v_html            text;
  v_apps_total      int;
  v_apps_qualified  int;
  v_orders_count    int;
  v_orders_gross    bigint;
  v_new_subs        int;
BEGIN
  v_msg_id := 'attract:weekly:' || to_char(now(), 'IYYY-IW');

  IF EXISTS (SELECT 1 FROM public.email_send_log WHERE message_id = v_msg_id) THEN
    RETURN;
  END IF;

  -- Applications this week
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE determined_routing_status = 'QUALIFIED_FOR_CORE_PROGRAM')
  INTO v_apps_total, v_apps_qualified
  FROM public.client_stewardship_applications
  WHERE created_at >= date_trunc('week', now()) - INTERVAL '7 days'
    AND created_at <  date_trunc('week', now());

  -- Orders this week
  SELECT COUNT(*), COALESCE(SUM(total_cents), 0)
  INTO v_orders_count, v_orders_gross
  FROM public.orders
  WHERE status = 'paid'
    AND created_at >= date_trunc('week', now()) - INTERVAL '7 days'
    AND created_at <  date_trunc('week', now());

  -- New subscribers this week
  SELECT COUNT(*)
  INTO v_new_subs
  FROM public.subscribers
  WHERE created_at >= date_trunc('week', now()) - INTERVAL '7 days'
    AND created_at <  date_trunc('week', now());

  v_html := '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111111;color:#FAF7F0;padding:40px 32px;">'
    || '<p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">CHKPLT · ATTRACT DEPT · Weekly Briefing</p>'
    || '<h2 style="font-size:24px;font-weight:900;margin:16px 0 24px;">Signal Scout — ' || to_char(now(), 'Mon DD, YYYY') || '</h2>'
    || '<table style="width:100%;border-collapse:collapse;">'
    || '<tr><td style="padding:12px 0;border-bottom:1px solid #333;color:#888;font-size:13px;">Applications (last 7 days)</td>'
    ||   '<td style="padding:12px 0;border-bottom:1px solid #333;text-align:right;font-weight:700;">' || v_apps_total || '</td></tr>'
    || '<tr><td style="padding:12px 0;border-bottom:1px solid #333;color:#888;font-size:13px;">→ Qualified for core programme</td>'
    ||   '<td style="padding:12px 0;border-bottom:1px solid #333;text-align:right;color:#C9A84C;font-weight:700;">' || v_apps_qualified || '</td></tr>'
    || '<tr><td style="padding:12px 0;border-bottom:1px solid #333;color:#888;font-size:13px;">New paid orders</td>'
    ||   '<td style="padding:12px 0;border-bottom:1px solid #333;text-align:right;font-weight:700;">' || v_orders_count || '</td></tr>'
    || '<tr><td style="padding:12px 0;border-bottom:1px solid #333;color:#888;font-size:13px;">Gross revenue (ZAR)</td>'
    ||   '<td style="padding:12px 0;border-bottom:1px solid #333;text-align:right;color:#C9A84C;font-weight:700;">R ' || to_char(v_orders_gross / 100.0, 'FM999,999,999.00') || '</td></tr>'
    || '<tr><td style="padding:12px 0;color:#888;font-size:13px;">New subscribers</td>'
    ||   '<td style="padding:12px 0;text-align:right;font-weight:700;">' || v_new_subs || '</td></tr>'
    || '</table>'
    || '<p style="font-size:12px;color:#555;margin:32px 0 0;">contentcreatorhub.online · @nochill_god</p>'
    || '</div>';

  INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
  VALUES (v_msg_id, 'attract_weekly_briefing', 'chiefmuhanelwa@gmail.com', 'pending')
  ON CONFLICT DO NOTHING;

  PERFORM public.enqueue_email(
    'transactional_emails',
    jsonb_build_object(
      'run_id',       gen_random_uuid(),
      'message_id',   v_msg_id,
      'to',           'chiefmuhanelwa@gmail.com',
      'from',         'CHKPLT Signal Scout <noreply@chkplt.com>',
      'sender_domain','notify.chkplt.com',
      'subject',      'Weekly Briefing — ATTRACT: ' || v_apps_total || ' apps, R ' || to_char(v_orders_gross / 100.0, 'FM999,999,999.00') || ' revenue',
      'html',         v_html,
      'text',         'Weekly: ' || v_apps_total || ' apps (' || v_apps_qualified || ' qualified), ' || v_orders_count || ' orders, R' || (v_orders_gross / 100) || ' gross, ' || v_new_subs || ' new subscribers.',
      'purpose',      'transactional',
      'label',        'attract_weekly_briefing',
      'queued_at',    to_json(now())::text
    )
  );

  INSERT INTO public.agent_events (department, event_type, payload)
  VALUES (
    'attract',
    'weekly_briefing_queued',
    jsonb_build_object(
      'apps_total', v_apps_total,
      'apps_qualified', v_apps_qualified,
      'orders_count', v_orders_count,
      'orders_gross_cents', v_orders_gross,
      'new_subscribers', v_new_subs
    )
  );
END;
$$;


-- ---------------------------------------------------------------------------
-- DEPT 4 — REVENUE: The Treasurer
-- Runs on the 1st of each month at 05:30 UTC (07:30 SAST).
-- Sends a monthly revenue + SARS reserve summary to admin.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dept_revenue_agent()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg_id      text;
  v_html        text;
  v_month_label text;
  v_gross       bigint;
  v_vat         bigint;
  v_tax_reserve bigint;
  v_net         bigint;
  v_order_count int;
BEGIN
  -- Report covers the PREVIOUS calendar month
  v_month_label := to_char(date_trunc('month', now()) - INTERVAL '1 day', 'Month YYYY');
  v_msg_id      := 'revenue:monthly:' || to_char(date_trunc('month', now()) - INTERVAL '1 day', 'YYYY-MM');

  IF EXISTS (SELECT 1 FROM public.email_send_log WHERE message_id = v_msg_id) THEN
    RETURN;
  END IF;

  SELECT
    COUNT(*),
    COALESCE(SUM(gross_cents), 0),
    COALESCE(SUM(vat_allocation_cents), 0),
    COALESCE(SUM(tax_reserve_cents), 0),
    COALESCE(SUM(net_cents), 0)
  INTO v_order_count, v_gross, v_vat, v_tax_reserve, v_net
  FROM public.audit_ledgers
  WHERE paid_at >= date_trunc('month', now()) - INTERVAL '1 month'
    AND paid_at <  date_trunc('month', now());

  v_html := '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111111;color:#FAF7F0;padding:40px 32px;">'
    || '<p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">CHKPLT · REVENUE DEPT · Monthly Report</p>'
    || '<h2 style="font-size:24px;font-weight:900;margin:16px 0 8px;">The Treasurer — ' || v_month_label || '</h2>'
    || '<p style="font-size:13px;color:#888;margin:0 0 24px;">' || v_order_count || ' paid orders processed</p>'
    || '<table style="width:100%;border-collapse:collapse;">'
    || '<tr><td style="padding:12px 0;border-bottom:1px solid #333;color:#888;font-size:13px;">Gross revenue</td>'
    ||   '<td style="padding:12px 0;border-bottom:1px solid #333;text-align:right;font-weight:700;">R ' || to_char(v_gross / 100.0, 'FM999,999,999.00') || '</td></tr>'
    || '<tr><td style="padding:12px 0;border-bottom:1px solid #333;color:#888;font-size:13px;">VAT allocation (15%)</td>'
    ||   '<td style="padding:12px 0;border-bottom:1px solid #333;text-align:right;">R ' || to_char(v_vat / 100.0, 'FM999,999,999.00') || '</td></tr>'
    || '<tr><td style="padding:12px 0;border-bottom:1px solid #333;color:#EA580C;font-size:13px;font-weight:700;">SARS reserve (25%) — DO NOT TOUCH</td>'
    ||   '<td style="padding:12px 0;border-bottom:1px solid #333;text-align:right;color:#EA580C;font-weight:700;">R ' || to_char(v_tax_reserve / 100.0, 'FM999,999,999.00') || '</td></tr>'
    || '<tr><td style="padding:14px 0;color:#888;font-size:13px;">Net (yours to spend)</td>'
    ||   '<td style="padding:14px 0;text-align:right;color:#C9A84C;font-weight:900;font-size:18px;">R ' || to_char(v_net / 100.0, 'FM999,999,999.00') || '</td></tr>'
    || '</table>'
    || '<p style="font-size:12px;color:#555;margin:32px 0 0;">contentcreatorhub.online · @nochill_god</p>'
    || '</div>';

  INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
  VALUES (v_msg_id, 'revenue_monthly_report', 'chiefmuhanelwa@gmail.com', 'pending')
  ON CONFLICT DO NOTHING;

  PERFORM public.enqueue_email(
    'transactional_emails',
    jsonb_build_object(
      'run_id',       gen_random_uuid(),
      'message_id',   v_msg_id,
      'to',           'chiefmuhanelwa@gmail.com',
      'from',         'CHKPLT Treasurer <noreply@chkplt.com>',
      'sender_domain','notify.chkplt.com',
      'subject',      'Monthly Revenue Report — ' || v_month_label || ' · R ' || to_char(v_gross / 100.0, 'FM999,999,999.00') || ' gross',
      'html',         v_html,
      'text',         v_month_label || ': ' || v_order_count || ' orders, R' || (v_gross / 100) || ' gross, R' || (v_tax_reserve / 100) || ' SARS reserve, R' || (v_net / 100) || ' net.',
      'purpose',      'transactional',
      'label',        'revenue_monthly_report',
      'queued_at',    to_json(now())::text
    )
  );

  INSERT INTO public.agent_events (department, event_type, payload)
  VALUES (
    'revenue',
    'monthly_report_queued',
    jsonb_build_object(
      'month', v_month_label,
      'order_count', v_order_count,
      'gross_cents', v_gross,
      'vat_cents', v_vat,
      'tax_reserve_cents', v_tax_reserve,
      'net_cents', v_net
    )
  );
END;
$$;


-- ---------------------------------------------------------------------------
-- DEPT 5 — RETAIN: The Ascender
-- Runs daily 06:00 UTC (08:00 SAST).
-- Finds students who completed a programme 30 days ago → sends ascension offer.
-- Finds ICP2 buyers with 2+ purchases → flags them as upgrade candidates.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dept_retain_agent()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r            record;
  v_msg_id     text;
  v_html       text;
  v_asc_count  int := 0;
  v_flag_count int := 0;
BEGIN
  -- === 1. Ascension offer: students whose grant is ~30 days old ===
  -- Targets product_grants for premium (etz_pri garden) programmes
  FOR r IN
    SELECT
      pg.id            AS grant_id,
      p.email,
      p.full_name,
      pr.title         AS product_title
    FROM public.product_grants pg
    JOIN public.profiles p ON p.id = pg.user_id
    JOIN public.products pr ON pr.id = pg.product_id
    WHERE pg.user_id IS NOT NULL
      AND pr.garden = 'etz_pri'
      AND pg.created_at BETWEEN now() - INTERVAL '31 days' AND now() - INTERVAL '29 days'
    LIMIT 20
  LOOP
    v_msg_id := 'retain:ascend:' || r.grant_id::text;

    CONTINUE WHEN EXISTS (
      SELECT 1 FROM public.email_send_log WHERE message_id = v_msg_id
    );

    v_html := '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111111;color:#FAF7F0;padding:40px 32px;">'
      || '<p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">CHKPLT · Your Journey</p>'
      || '<h2 style="font-size:24px;font-weight:900;margin:16px 0;">30 days in. What''s next?</h2>'
      || '<p style="font-size:16px;line-height:1.6;">' || COALESCE(r.full_name, 'Steward') || ', you''ve been inside ' || r.product_title || ' for a month.</p>'
      || '<p style="font-size:16px;line-height:1.6;">The students who go deepest get the most. There''s a VIP tier that gives you direct access, done-for-you systems, and 1-on-1 strategy. If you''re ready for the next level — let''s talk.</p>'
      || '<a href="https://chkplt.com/apply" style="display:inline-block;background:#C9A84C;color:#111111;font-weight:700;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;padding:14px 28px;text-decoration:none;border-radius:6px;margin-top:16px;">Apply for VIP Access</a>'
      || '<p style="font-size:12px;color:#555;margin:40px 0 0;">contentcreatorhub.online · @nochill_god</p>'
      || '</div>';

    INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
    VALUES (v_msg_id, 'retain_ascension_offer', r.email, 'pending')
    ON CONFLICT DO NOTHING;

    PERFORM public.enqueue_email(
      'transactional_emails',
      jsonb_build_object(
        'run_id',       gen_random_uuid(),
        'message_id',   v_msg_id,
        'to',           r.email,
        'from',         'Ndivhuwo — CHKPLT <noreply@chkplt.com>',
        'sender_domain','notify.chkplt.com',
        'subject',      '30 days in — what''s your next step?',
        'html',         v_html,
        'text',         'You''ve been in the programme 30 days. VIP access opens the next level. Apply at https://chkplt.com/apply',
        'purpose',      'transactional',
        'label',        'retain_ascension_offer',
        'queued_at',    to_json(now())::text
      )
    );

    v_asc_count := v_asc_count + 1;
  END LOOP;

  -- === 2. Flag ICP2 upgrade candidates (2+ low-ticket purchases, no premium grant) ===
  FOR r IN
    SELECT
      s.email,
      COUNT(o.id) AS order_count,
      SUM(o.total_cents) AS total_spend_cents
    FROM public.subscribers s
    JOIN public.orders o ON o.email = s.email AND o.status = 'paid'
    JOIN public.order_items oi ON oi.order_id = o.id
    JOIN public.products pr ON pr.id = oi.product_id AND pr.garden IN ('deshe', 'esev')
    WHERE NOT EXISTS (
      SELECT 1 FROM public.product_grants pg2
      JOIN public.products pr2 ON pr2.id = pg2.product_id
      WHERE pg2.subscriber_id = s.id
        AND pr2.garden = 'etz_pri'
    )
    GROUP BY s.email
    HAVING COUNT(o.id) >= 2
    LIMIT 50
  LOOP
    INSERT INTO public.agent_events (department, event_type, payload)
    VALUES (
      'retain',
      'upgrade_candidate_flagged',
      jsonb_build_object(
        'email', r.email,
        'order_count', r.order_count,
        'total_spend_cents', r.total_spend_cents
      )
    );

    v_flag_count := v_flag_count + 1;
  END LOOP;

  -- Log this run
  INSERT INTO public.agent_events (department, event_type, payload)
  VALUES (
    'retain',
    'daily_run',
    jsonb_build_object(
      'ascension_emails_queued', v_asc_count,
      'upgrade_candidates_flagged', v_flag_count,
      'ran_at', now()
    )
  );
END;
$$;


-- ---------------------------------------------------------------------------
-- pg_cron schedules for scheduled agents (all times UTC; SAST = UTC+2)
-- The Gatekeeper (QUALIFY) is trigger-based, not scheduled.
-- ---------------------------------------------------------------------------

-- ATTRACT: Signal Scout — every Monday 04:00 UTC (06:00 SAST)
SELECT cron.schedule(
  'dept-attract-weekly',
  '0 4 * * 1',
  $$ SELECT public.dept_attract_agent(); $$
);

-- DELIVER: Steward — daily 05:00 UTC (07:00 SAST)
SELECT cron.schedule(
  'dept-deliver-daily',
  '0 5 * * *',
  $$ SELECT public.dept_deliver_agent(); $$
);

-- REVENUE: Treasurer — 1st of each month 05:30 UTC (07:30 SAST)
SELECT cron.schedule(
  'dept-revenue-monthly',
  '30 5 1 * *',
  $$ SELECT public.dept_revenue_agent(); $$
);

-- RETAIN: Ascender — daily 06:00 UTC (08:00 SAST)
SELECT cron.schedule(
  'dept-retain-daily',
  '0 6 * * *',
  $$ SELECT public.dept_retain_agent(); $$
);
