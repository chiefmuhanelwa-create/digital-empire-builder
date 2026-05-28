import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  evaluateRecommendationTree,
  type RecommendationResult,
} from "@/utils/evaluator";

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

      // TODO(brevo): dispatch nurture sequence with `vulnerability_phase_tag`
      // as a custom contact variable once the Brevo connector + list IDs are
      // confirmed. Intentionally not awaited to avoid blocking submit.

      return { ...recommendation, applicationId: row.id };
    },
  );
