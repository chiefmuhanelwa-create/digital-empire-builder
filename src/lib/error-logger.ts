/**
 * CHKPLT centralized error reporter.
 *
 * Drop this anywhere — server functions, webhook handlers, server routes,
 * cron jobs, even client components if needed. Always swallows its own
 * failures so it never masks the original error.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface ErrorContext {
  userId?: string;
  orderId?: string;
  endpoint?: string;
  severity?: "info" | "warning" | "error" | "critical";
  meta?: Record<string, unknown>;
}

export async function reportError(
  error: Error | unknown,
  context: ErrorContext = {},
): Promise<void> {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack ?? "" : "";

  // 1. Structured console log — captured by TanStack server-function-logs.
  console.error(
    `[CHKPLT ERROR] [${timestamp}] [Endpoint: ${context.endpoint ?? "unknown"}]`,
    {
      message: errorMessage,
      context,
      stack: errorStack,
    },
  );

  // 2. Persist to the incidents table for in-dashboard admin triage.
  try {
    await supabaseAdmin.from("incidents").insert({
      message: errorMessage.slice(0, 2000),
      endpoint: context.endpoint ?? null,
      severity: context.severity ?? "error",
      user_id: context.userId ?? null,
      meta: {
        ...(context.meta ?? {}),
        order_id: context.orderId ?? null,
        stack: errorStack.slice(0, 4000),
      },
    });
  } catch (dbErr) {
    // Never let the reporter swallow or escalate the original error.
    console.error("[CHKPLT ERROR] incident insert failed", dbErr);
  }

  // 3. FUTURE EXPANSION SLOT — paste one of these to activate external alerts:
  //   Sentry.captureException(error, { extra: context });
  //   logtail.error(errorMessage, { ...context, stack: errorStack });
}
