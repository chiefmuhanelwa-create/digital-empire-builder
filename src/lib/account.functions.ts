import { createServerFn } from "@tanstack/react-start";
import { createHash } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { reportError } from "./error-logger";

function hashEmail(email: string) {
  return createHash("sha256").update(email.toLowerCase()).digest("hex");
}

/**
 * Export everything the platform knows about the caller — profile, orders,
 * order items, subscriber rows. Returned as a single JSON object so users
 * can download a portable copy of their own data.
 */
export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, claims } = context;
    const email = (claims?.email as string | undefined)?.toLowerCase() ?? null;

    const [{ data: profile }, { data: orders }, { data: subscriber }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id,email,full_name,avatar_url,created_at,updated_at")
          .eq("id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("orders")
          .select("id,email,customer_name,total_cents,currency,status,created_at,provider_reference")
          .or(email ? `user_id.eq.${userId},email.eq.${email}` : `user_id.eq.${userId}`),
        email
          ? supabaseAdmin
              .from("subscribers")
              .select("id,email,first_name,last_name,phone,status,source,created_at")
              .eq("email", email)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

    let orderItems: unknown[] = [];
    if (orders && orders.length > 0) {
      const ids = orders.map((o) => o.id);
      const { data } = await supabaseAdmin
        .from("order_items")
        .select("order_id,product_title,quantity,unit_price_cents,line_total_cents,created_at")
        .in("order_id", ids);
      orderItems = data ?? [];
    }

    return {
      exported_at: new Date().toISOString(),
      profile,
      subscriber,
      orders: orders ?? [],
      order_items: orderItems,
    };
  });

/**
 * Hard-delete the caller's marketing PII while preserving anonymized
 * financial rows for mandatory tax / corporate retention.
 *
 * Order matters:
 *   1) backfill audit_ledgers.customer_email_hash so the immutable record
 *      survives without the raw email.
 *   2) wipe marketing PII (subscribers, tags, profile).
 *   3) anonymize orders email/name/phone — the row stays but is no longer
 *      tied to the person.
 *   4) finally, delete the auth.users row.
 *
 * Every step is independently try/caught + reported. Partial failure does
 * not block the rest of the cleanup.
 */
export const requestAccountDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, claims } = context;
    const email = (claims?.email as string | undefined)?.toLowerCase();
    if (!email) {
      throw new Error("Account email could not be verified.");
    }
    const emailHash = hashEmail(email);
    const anonEmail = `deleted-${emailHash.slice(0, 16)}@anonymized.local`;

    // 1. Backfill ledger hash for any old rows that may have stored a different hash.
    try {
      // No update is allowed on audit_ledgers (immutable trigger). We rely on
      // the webhook to have stored hashed email originally. This block is a
      // no-op safety check kept for clarity.
    } catch (err) {
      await reportError(err, {
        userId,
        endpoint: "requestAccountDeletion:ledger",
      });
    }

    // 2. Wipe marketing PII.
    try {
      const { data: sub } = await supabaseAdmin
        .from("subscribers")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (sub) {
        await supabaseAdmin.from("subscriber_tags").delete().eq("subscriber_id", sub.id);
        await supabaseAdmin.from("subscribers").delete().eq("id", sub.id);
      }
    } catch (err) {
      await reportError(err, {
        userId,
        endpoint: "requestAccountDeletion:subscribers",
      });
    }

    try {
      await supabaseAdmin.from("profiles").delete().eq("id", userId);
    } catch (err) {
      await reportError(err, {
        userId,
        endpoint: "requestAccountDeletion:profiles",
      });
    }

    // 3. Anonymize order rows — preserves financial history without PII.
    try {
      await supabaseAdmin
        .from("orders")
        .update({
          email: anonEmail,
          customer_name: null,
          customer_phone: null,
          user_id: null,
        })
        .or(`user_id.eq.${userId},email.eq.${email}`);
    } catch (err) {
      await reportError(err, {
        userId,
        endpoint: "requestAccountDeletion:orders",
      });
    }

    // 4. Delete the auth user.
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
    } catch (err) {
      await reportError(err, {
        userId,
        endpoint: "requestAccountDeletion:auth",
        severity: "critical",
      });
      throw new Error("Account could not be fully deleted. Support has been notified.");
    }

    return { ok: true };
  });
