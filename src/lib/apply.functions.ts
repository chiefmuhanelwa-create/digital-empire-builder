import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  evaluateRecommendationTree,
  type RecommendationResult,
} from "@/utils/evaluator";
import { addToMailerLiteGroup } from "@/lib/mailerlite";

const SITE_NAME = "CHKPLT";
const ROOT_DOMAIN = "chkplt.com";
const SENDER_DOMAIN = "notify.chkplt.com";

function qualifiedHtml(name: string): string {
  return `<div style="font-family:'Montserrat',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0F172A;color:#F8FAFC;padding:40px 32px;">
<p style="color:#F59E0B;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 24px;">CHKPLT · Christ's Kingdom Platform</p>
<h1 style="font-size:28px;font-weight:900;margin:0 0 16px;line-height:1.2;">You're qualified, ${name}.</h1>
<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Your stewardship audit passed. Your metrics validate entry into the 90-Day Contentpreneur Accelerator PRO.</p>
<p style="font-size:16px;line-height:1.6;margin:0 0 32px;">One step left: create your account and we'll confirm your cohort start date.</p>
<a href="https://${ROOT_DOMAIN}/signup" style="display:inline-block;background:#F59E0B;color:#0F172A;font-weight:700;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;padding:16px 32px;text-decoration:none;border-radius:8px;">Create Your Account</a>
<p style="font-size:13px;color:#94A3B8;margin:40px 0 0;">— Ndivhuwo Muhanelwa, CHKPLT</p>
<p style="font-size:11px;color:#64748B;margin:16px 0 0;">contentcreatorhub.online · @nochill_god</p>
</div>`;
}

function downsellHtml(name: string, focusPillars: string, targetModules: string): string {
  return `<div style="font-family:'Montserrat',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0F172A;color:#F8FAFC;padding:40px 32px;">
<p style="color:#EA580C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 24px;">CHKPLT · Stewardship Diagnostic</p>
<h1 style="font-size:28px;font-weight:900;margin:0 0 16px;line-height:1.2;">Your results are in, ${name}.</h1>
<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">You're not ready for the core programme yet — and that's not a failure. It means we caught your structural gap before you paid $970 for something you'd struggle to execute.</p>
<p style="font-size:16px;line-height:1.6;margin:0 0 8px;"><strong>Your immediate priority:</strong><br>${focusPillars}</p>
<p style="font-size:16px;line-height:1.6;margin:0 0 32px;"><strong>What to study:</strong><br>${targetModules}</p>
<a href="https://${ROOT_DOMAIN}/products/called-expert-foundation-kit" style="display:inline-block;background:#F59E0B;color:#0F172A;font-weight:700;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;padding:16px 32px;text-decoration:none;border-radius:9999px;">Get the Foundation Kit — $97</a>
<p style="font-size:13px;color:#94A3B8;margin:40px 0 0;">— Ndivhuwo Muhanelwa, CHKPLT</p>
<p style="font-size:11px;color:#64748B;margin:16px 0 0;">contentcreatorhub.online · @nochill_god</p>
</div>`;
}

async function sendApplicationEmail(
  applicationId: string,
  email: string,
  name: string,
  recommendation: RecommendationResult,
): Promise<void> {
  const isQualified = recommendation.status === "QUALIFIED_FOR_CORE_PROGRAM";
  const label = isQualified ? "qualify_qualified" : "qualify_downsell";
  const messageId = `qualify:${applicationId}:${label}`;

  const { error: claimErr } = await supabaseAdmin.from("email_send_log").insert({
    message_id: messageId,
    template_name: label,
    recipient_email: email,
    status: "pending",
  });
  // 23505 = unique_violation → DB trigger already claimed this slot
  if (claimErr && (claimErr as { code?: string }).code !== "23505") {
    console.error("[apply] failed to claim email log", claimErr);
    return;
  }
  if (claimErr) return; // already claimed by trigger

  const html = isQualified
    ? qualifiedHtml(name)
    : downsellHtml(name, recommendation.focusPillars, recommendation.targetModules);

  const subject = isQualified
    ? "You're qualified — one step left"
    : "Your CHKPLT diagnostic results";

  const text = isQualified
    ? `You're qualified. Create your account at https://${ROOT_DOMAIN}/signup`
    : `Your results: ${recommendation.focusPillars}. Resources at https://${ROOT_DOMAIN}/products`;

  await supabaseAdmin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      run_id: randomUUID(),
      message_id: messageId,
      to: email,
      from: `Ndivhuwo — ${SITE_NAME} <noreply@${SENDER_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: "transactional",
      label,
      queued_at: new Date().toISOString(),
    },
  });
}

const applicationSchema = z.object({
  email: z.string().trim().email().max(255),
  full_name: z.string().trim().min(1).max(120),
  // Module 1
  total_followers: z.number().int().min(0).max(1_000_000_000),
  engagement_rate: z.number().int().min(0).max(100).nullable(),
  posts_consistently_4x: z.boolean(),
  // Module 2
  monthly_income_value: z.number().int().min(0).max(1_000_000_000),
  income_streams_count: z.number().int().min(1).max(10),
  largest_stream_percentage: z.number().int().min(0).max(100),
  has_products_for_sale: z.boolean(),
  product_sales_last_month: z.number().int().min(0).max(1_000_000),
  // Module 3
  owns_email_list: z.boolean(),
  email_subscribers_count: z.number().int().min(0).max(100_000_000),
  has_private_community: z.boolean(),
  community_members_count: z.number().int().min(0).max(100_000_000),
  email_open_rate: z.number().int().min(0).max(100),
  // Module 4
  has_automated_funnels: z.boolean(),
  uses_email_marketing_software: z.boolean(),
  batches_content: z.boolean(),
  runs_without_owner_1_week: z.boolean(),
  has_documented_sops: z.boolean(),
  // Module 5
  has_clear_niche: z.boolean(),
  has_done_swot: z.boolean(),
  primary_e: z.enum(["Entertain", "Educate", "Encourage", "Earn"]),
  abundance_mindset: z.boolean(),
  building_horizon: z.enum(["GENERATIONS", "TODAY"]),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => applicationSchema.parse(input))
  .handler(
    async ({ data }): Promise<RecommendationResult & { applicationId: string }> => {
      const recommendation = evaluateRecommendationTree({
        total_followers: data.total_followers,
        engagement_rate: data.engagement_rate,
        posts_consistently_4x: data.posts_consistently_4x,
        owns_email_list: data.owns_email_list,
        email_subscribers_count: data.email_subscribers_count,
        has_products_for_sale: data.has_products_for_sale,
        monthly_income_value: data.monthly_income_value,
        income_streams_count: data.income_streams_count,
        largest_stream_percentage: data.largest_stream_percentage,
      });

      const { data: row, error } = await supabaseAdmin
        .from("client_stewardship_applications")
        .insert({
          email: data.email,
          full_name: data.full_name,
          follower_count: data.total_followers,
          engagement_rate: data.engagement_rate,
          posts_consistently_4x: data.posts_consistently_4x,
          owns_email_list: data.owns_email_list,
          email_subscribers_count: data.email_subscribers_count,
          has_products_for_sale: data.has_products_for_sale,
          monthly_income_value: data.monthly_income_value,
          income_streams_count: data.income_streams_count,
          largest_stream_percentage: data.largest_stream_percentage,
          determined_routing_status: recommendation.status,
          assigned_package_recommendation: recommendation.recommendedPackage,
          vulnerability_phase_tag: recommendation.vulnerabilityTag,
          raw_answers: data,
        })
        .select("id")
        .single();

      if (error) {
        console.error("submitApplication insert error:", error);
        throw new Error("Could not save your application. Please try again.");
      }

      // Fire-and-forget: email send failure must never block the submit response.
      sendApplicationEmail(row.id, data.email, data.full_name, recommendation).catch(
        (err) => console.error("[apply] sendApplicationEmail failed", err),
      );

      // Sync applicant to MailerLite — qualified → Called Expert group, else → Knowledge Audit nurture.
      const nameParts = data.full_name.trim().split(/\s+/);
      void addToMailerLiteGroup(
        data.email,
        recommendation.status === "QUALIFIED_FOR_CORE_PROGRAM"
          ? process.env.MAILERLITE_GROUP_ID_CALLED_EXPERT
          : process.env.MAILERLITE_GROUP_ID_FREE_KNOWLEDGE_AUDIT,
        { first_name: nameParts[0], last_name: nameParts.slice(1).join(" ") || null },
      );

      return { ...recommendation, applicationId: row.id };
    },
  );
