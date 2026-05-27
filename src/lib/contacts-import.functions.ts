import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const LEGACY_TAG_SLUG = "legacy_prelaunch_may_2026";

const ContactRowSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  first_name: z.string().trim().max(120).optional().nullable(),
  last_name: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  source: z.string().trim().max(60).optional().nullable(),
});

export const importContactsBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        rows: z.array(z.record(z.string(), z.unknown())).min(1).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Admin gate
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admins only.");

    // Resolve tag id once per batch
    const { data: tag, error: tagErr } = await supabaseAdmin
      .from("tags")
      .select("id")
      .eq("slug", LEGACY_TAG_SLUG)
      .maybeSingle();
    if (tagErr || !tag) throw new Error("Legacy import tag missing.");

    const errors: Array<{ row: number; email: string | null; message: string }> = [];
    const cleaned: Array<z.infer<typeof ContactRowSchema> & { source: string }> = [];

    data.rows.forEach((raw, idx) => {
      const parsed = ContactRowSchema.safeParse({
        email: raw.email ?? raw.Email ?? raw.EMAIL,
        first_name: raw.first_name ?? raw.firstName ?? raw["First Name"] ?? raw.name ?? null,
        last_name: raw.last_name ?? raw.lastName ?? raw["Last Name"] ?? null,
        phone: raw.phone ?? raw.Phone ?? raw.mobile ?? null,
        source: raw.source ?? "legacy_import",
      });
      if (!parsed.success) {
        errors.push({
          row: idx,
          email: typeof raw.email === "string" ? raw.email : null,
          message: parsed.error.issues[0]?.message ?? "Invalid row",
        });
        return;
      }
      cleaned.push({ ...parsed.data, source: parsed.data.source || "legacy_import" });
    });

    if (cleaned.length === 0) {
      return { inserted: 0, updated: 0, tagged: 0, errors };
    }

    // Upsert subscribers
    const { data: upserted, error: upErr } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        cleaned.map((c) => ({
          email: c.email,
          first_name: c.first_name || null,
          last_name: c.last_name || null,
          phone: c.phone || null,
          source: c.source,
        })),
        { onConflict: "email" },
      )
      .select("id,email,created_at,updated_at");
    if (upErr) throw new Error(upErr.message);

    let inserted = 0;
    let updated = 0;
    for (const s of upserted ?? []) {
      // Heuristic: created_at == updated_at means freshly inserted
      if (s.created_at === s.updated_at) inserted++;
      else updated++;
    }

    // Apply legacy tag (idempotent)
    const tagRows = (upserted ?? []).map((s) => ({
      subscriber_id: s.id,
      tag_id: tag.id,
    }));
    let tagged = 0;
    if (tagRows.length > 0) {
      const { error: tErr, count } = await supabaseAdmin
        .from("subscriber_tags")
        .upsert(tagRows, {
          onConflict: "subscriber_id,tag_id",
          ignoreDuplicates: true,
          count: "exact",
        });
      if (tErr) {
        errors.push({ row: -1, email: null, message: `Tagging failed: ${tErr.message}` });
      } else {
        tagged = count ?? tagRows.length;
      }
    }

    return { inserted, updated, tagged, errors };
  });
