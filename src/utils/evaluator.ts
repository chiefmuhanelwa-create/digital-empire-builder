export interface ClientAssessmentPayload {
  total_followers: number;
  engagement_rate: number | null;
  posts_consistently_4x: boolean;
  owns_email_list: boolean;
  email_subscribers_count: number;
  has_products_for_sale: boolean;
  monthly_income_value: number;
  income_streams_count: number;
  largest_stream_percentage: number;
}

export type RoutingStatus = "QUALIFIED_FOR_CORE_PROGRAM" | "REDIRECT_TO_DOWNSELL";

export interface RecommendationResult {
  status: RoutingStatus;
  recommendedPackage: string;
  focusPillars: string;
  targetModules: string;
  vulnerabilityTag:
    | "STAGE_1_DISCOVERY"
    | "STAGE_2_AWARENESS"
    | "STAGE_3_CONSIDERATION"
    | "STAGE_4_CONVERSION"
    | "STAGE_5_COMMUNITY";
}

export const evaluateRecommendationTree = (
  answers: ClientAssessmentPayload,
): RecommendationResult => {
  if (answers.total_followers < 1000 || !answers.posts_consistently_4x) {
    return {
      status: "REDIRECT_TO_DOWNSELL",
      recommendedPackage: "Foundation Package",
      focusPillars:
        "Stage 1 Focus (MS×SS×TS Foundation + SWOT + 4Es Content Strategy)",
      targetModules: "Modules 0–3 of Masterclass & Foundation Worksheets",
      vulnerabilityTag: "STAGE_1_DISCOVERY",
    };
  }

  if (!answers.owns_email_list || answers.email_subscribers_count < 100) {
    return {
      status: "REDIRECT_TO_DOWNSELL",
      recommendedPackage: "Audience Building Package",
      focusPillars:
        "Stage 4 Focus (Email list building priority, Lead magnet creation, Landing pages)",
      targetModules: "Modules 3–4 & Lead Magnet Blueprint",
      vulnerabilityTag: "STAGE_2_AWARENESS",
    };
  }

  if (!answers.has_products_for_sale || answers.monthly_income_value < 5000) {
    return {
      status: "REDIRECT_TO_DOWNSELL",
      recommendedPackage: "Monetization Package",
      focusPillars:
        "Stage 6 DARES Product Architecture + Stage 7 PAIDS Revenue Preparation",
      targetModules: "Modules 4–5 & Product Creation Prep Frameworks",
      vulnerabilityTag: "STAGE_3_CONSIDERATION",
    };
  }

  if (
    answers.income_streams_count < 3 ||
    answers.largest_stream_percentage > 40
  ) {
    return {
      status: "REDIRECT_TO_DOWNSELL",
      recommendedPackage: "Diversification Package",
      focusPillars:
        "Stage 7 PAIDS Asset Tracking Optimization & Funnel Hardening",
      targetModules: "Modules 6–7 & PAIDS Tracking Toolsets",
      vulnerabilityTag: "STAGE_4_CONVERSION",
    };
  }

  return {
    status: "QUALIFIED_FOR_CORE_PROGRAM",
    recommendedPackage: "Scale Package",
    focusPillars: "Stage 5 Community Engagement + Advanced Retention Systems",
    targetModules: "Advanced Modules & Community Playbook",
    vulnerabilityTag: "STAGE_5_COMMUNITY",
  };
};
