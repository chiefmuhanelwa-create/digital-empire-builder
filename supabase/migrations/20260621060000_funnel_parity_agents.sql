-- Funnel-parity automation (matches the GHL blueprint: abandoned-cart recovery +
-- post-purchase welcome drip), plus a one-line fix to the re-engagement agent.
-- All in-DB via enqueue_email (no HTTP, so no Cloudflare/key issues). Apply in the
-- Supabase SQL Editor or via `supabase db push`.

-- ===========================================================================
-- FIX: re-engagement agent queried a non-existent table (lms_lesson_progress).
-- The real table is lesson_progress(lesson_id, user_id, completed_at).
-- ===========================================================================
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
  FOR r IN
    SELECT DISTINCT
      p.email,
      p.full_name,
      MAX(lp.completed_at) AS last_activity
    FROM public.product_grants pg
    JOIN public.profiles p ON p.id = pg.user_id
    JOIN public.lesson_progress lp ON lp.user_id = pg.user_id     -- FIXED table name
    WHERE pg.user_id IS NOT NULL
      AND lp.completed_at < now() - INTERVAL '7 days'
      AND lp.completed_at > now() - INTERVAL '30 days'
    GROUP BY p.email, p.full_name
    HAVING MAX(lp.completed_at) < now() - INTERVAL '7 days'
    LIMIT 50
  LOOP
    v_msg_id := 'deliver:reengage:' || encode(digest(r.email, 'sha256'), 'hex')
      || ':' || to_char(now(), 'IYYY-IW');
    CONTINUE WHEN EXISTS (SELECT 1 FROM public.email_send_log WHERE message_id = v_msg_id);

    v_html := '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111111;color:#FAF7F0;padding:40px 32px;">'
      || '<p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">CHKPLT · Your Curriculum</p>'
      || '<h2 style="font-size:24px;font-weight:900;margin:16px 0;">We see you, ' || COALESCE(r.full_name, 'Steward') || '.</h2>'
      || '<p style="font-size:16px;line-height:1.6;">You haven''t logged a lesson in a few days. That''s okay — life happens. But the work doesn''t do itself.</p>'
      || '<p style="font-size:16px;line-height:1.6;">Your next lesson is waiting. 20 minutes today keeps momentum alive.</p>'
      || '<a href="https://chkplt.com/learn" style="display:inline-block;background:#C9A84C;color:#111111;font-weight:700;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;padding:14px 28px;text-decoration:none;border-radius:6px;margin-top:16px;">Continue Your Programme</a>'
      || '<p style="font-size:11px;color:#555;margin:40px 0 0;">contentcreatorhub.online · @nochill_god</p>'
      || '</div>';

    INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
    VALUES (v_msg_id, 'deliver_reengage', r.email, 'pending') ON CONFLICT DO NOTHING;

    PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
      'run_id', gen_random_uuid(), 'message_id', v_msg_id, 'to', r.email,
      'from', 'Ndivhuwo — CHKPLT <noreply@chkplt.com>', 'sender_domain', 'notify.chkplt.com',
      'subject', 'Your next lesson is waiting', 'html', v_html,
      'text', 'You haven''t logged a lesson in a few days. Your next step is at https://chkplt.com/learn',
      'purpose', 'transactional', 'label', 'deliver_reengage', 'queued_at', to_json(now())::text));
    v_count_sent := v_count_sent + 1;
  END LOOP;

  INSERT INTO public.agent_events (department, event_type, payload)
  VALUES ('deliver', 'daily_run', jsonb_build_object('reengage_emails_queued', v_count_sent, 'ran_at', now()));
END;
$$;

-- ===========================================================================
-- NEW: ABANDONED-CART RECOVERY. Pending orders >30min old (and <7 days) that
-- never became 'paid' → one recovery email back to the product page. Deduped
-- per order via email_send_log. Runs hourly.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.dept_recover_agent()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r        record;
  v_msg_id text;
  v_html   text;
  v_url    text;
  v_count  int := 0;
BEGIN
  FOR r IN
    SELECT o.id, o.email, o.customer_name,
           o.metadata->>'product_slug' AS product_slug,
           o.total_cents, o.currency
    FROM public.orders o
    WHERE o.status = 'pending'
      AND o.created_at < now() - INTERVAL '30 minutes'
      AND o.created_at > now() - INTERVAL '7 days'
      AND o.email IS NOT NULL
    LIMIT 100
  LOOP
    v_msg_id := 'recover:cart:' || r.id::text;
    CONTINUE WHEN EXISTS (SELECT 1 FROM public.email_send_log WHERE message_id = v_msg_id);

    v_url := 'https://chkplt.com/products/' || COALESCE(r.product_slug, '');
    v_html := '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111111;color:#FAF7F0;padding:40px 32px;">'
      || '<p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">CHKPLT</p>'
      || '<h2 style="font-size:24px;font-weight:900;margin:16px 0;">You left something behind, ' || COALESCE(NULLIF(split_part(r.customer_name, ' ', 1), ''), 'friend') || '.</h2>'
      || '<p style="font-size:16px;line-height:1.6;">You started checkout but didn''t finish. No stress — your spot is still here.</p>'
      || '<p style="font-size:16px;line-height:1.6;">Most people who hesitate never start. Don''t be most people. Finish what you began.</p>'
      || '<a href="' || v_url || '" style="display:inline-block;background:#C9A84C;color:#111111;font-weight:700;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;padding:14px 28px;text-decoration:none;border-radius:6px;margin-top:16px;">Complete Your Order</a>'
      || '<p style="font-size:11px;color:#555;margin:40px 0 0;">contentcreatorhub.online · @nochill_god</p>'
      || '</div>';

    INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
    VALUES (v_msg_id, 'recover_cart', r.email, 'pending') ON CONFLICT DO NOTHING;

    PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
      'run_id', gen_random_uuid(), 'message_id', v_msg_id, 'to', r.email,
      'from', 'Ndivhuwo — CHKPLT <noreply@chkplt.com>', 'sender_domain', 'notify.chkplt.com',
      'subject', 'You left something behind', 'html', v_html,
      'text', 'You started checkout but didn''t finish. Complete your order: ' || v_url,
      'purpose', 'transactional', 'label', 'recover_cart', 'queued_at', to_json(now())::text));
    v_count := v_count + 1;
  END LOOP;

  INSERT INTO public.agent_events (department, event_type, payload)
  VALUES ('revenue', 'recover_run', jsonb_build_object('recovery_emails_queued', v_count, 'ran_at', now()));
END;
$$;

-- ===========================================================================
-- NEW: POST-PURCHASE WELCOME DRIP (Day 1 / Day 3 / Day 7), anchored to the
-- product grant. Deduped per buyer per step via email_send_log. Runs daily.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.dept_drip_agent()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  step   record;
  r      record;
  v_msg  text;
  v_html text;
  v_count int := 0;
  steps  jsonb := jsonb_build_array(
    jsonb_build_object('day',1,'lo',1,'hi',2,'label','drip_day1','subject','Start here — your first step','body','You''re in. Don''t let this sit. Open Module 1 today and take one action. Momentum beats motivation.'),
    jsonb_build_object('day',3,'lo',3,'hi',4,'label','drip_day3','subject','Did you start yet?','body','Three days in. The ones who win are the ones who showed up this week. 20 minutes today — open your next lesson.'),
    jsonb_build_object('day',7,'lo',7,'hi',8,'label','drip_day7','subject','Don''t forget your bonuses','body','One week in. Make sure you''ve grabbed every download and finished what you started. Your future self is watching.')
  );
BEGIN
  FOR step IN SELECT * FROM jsonb_array_elements(steps) AS s(v)
  LOOP
    FOR r IN
      SELECT DISTINCT p.email, p.full_name, pg.user_id
      FROM public.product_grants pg
      JOIN public.profiles p ON p.id = pg.user_id
      WHERE pg.user_id IS NOT NULL
        AND pg.revoked_at IS NULL
        AND pg.granted_at < now() - ((step.v->>'lo')::int || ' days')::interval
        AND pg.granted_at > now() - ((step.v->>'hi')::int || ' days')::interval
      LIMIT 200
    LOOP
      v_msg := (step.v->>'label') || ':' || r.user_id::text;
      CONTINUE WHEN EXISTS (SELECT 1 FROM public.email_send_log WHERE message_id = v_msg);

      v_html := '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111111;color:#FAF7F0;padding:40px 32px;">'
        || '<p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">CHKPLT</p>'
        || '<h2 style="font-size:24px;font-weight:900;margin:16px 0;">' || (step.v->>'subject') || '</h2>'
        || '<p style="font-size:16px;line-height:1.6;">Hi ' || COALESCE(split_part(r.full_name,' ',1), 'there') || ',</p>'
        || '<p style="font-size:16px;line-height:1.6;">' || (step.v->>'body') || '</p>'
        || '<a href="https://chkplt.com/learn" style="display:inline-block;background:#C9A84C;color:#111111;font-weight:700;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;padding:14px 28px;text-decoration:none;border-radius:6px;margin-top:16px;">Open Your Programme</a>'
        || '<p style="font-size:11px;color:#555;margin:40px 0 0;">contentcreatorhub.online · @nochill_god</p>'
        || '</div>';

      INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
      VALUES (v_msg, step.v->>'label', r.email, 'pending') ON CONFLICT DO NOTHING;

      PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
        'run_id', gen_random_uuid(), 'message_id', v_msg, 'to', r.email,
        'from', 'Ndivhuwo — CHKPLT <noreply@chkplt.com>', 'sender_domain', 'notify.chkplt.com',
        'subject', step.v->>'subject', 'html', v_html,
        'text', (step.v->>'body') || ' https://chkplt.com/learn',
        'purpose', 'transactional', 'label', step.v->>'label', 'queued_at', to_json(now())::text));
      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  INSERT INTO public.agent_events (department, event_type, payload)
  VALUES ('deliver', 'drip_run', jsonb_build_object('drip_emails_queued', v_count, 'ran_at', now()));
END;
$$;

-- ===========================================================================
-- SCHEDULES
-- ===========================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='dept-recover-hourly') THEN PERFORM cron.unschedule('dept-recover-hourly'); END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='dept-drip-daily') THEN PERFORM cron.unschedule('dept-drip-daily'); END IF;
END $$;

SELECT cron.schedule('dept-recover-hourly', '7 * * * *', 'SELECT public.dept_recover_agent();');
SELECT cron.schedule('dept-drip-daily',     '0 8 * * *', 'SELECT public.dept_drip_agent();');
