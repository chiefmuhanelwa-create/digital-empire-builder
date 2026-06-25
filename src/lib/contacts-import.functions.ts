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

    type ErrRow = {
      row: number;
      email: string | null;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      reason: string;
      detail: string;
    };
    const errors: ErrRow[] = [];
    const cleaned: Array<z.infer<typeof ContactRowSchema> & { source: string }> = [];

    const classifyZod = (issue: { path: (string | number)[]; message: string }): string => {
      const field = String(issue.path[0] ?? "");
      const msg = issue.message.toLowerCase();
      if (field === "email") {
        if (msg.includes("required") || msg.includes("expected string")) return "Missing Email";
        if (msg.includes("email")) return "Invalid Email Format";
        if (msg.includes("at most")) return "Email Too Long";
        return "Invalid Email";
      }
      if (field === "phone" && msg.includes("at most")) return "Phone Too Long";
      if ((field === "first_name" || field === "last_name") && msg.includes("at most"))
        return "Name Too Long";
      return `Invalid ${field || "Row"}`;
    };

    data.rows.forEach((raw, idx) => {
      const rawEmail = raw.email ?? raw.Email ?? raw.EMAIL;
      const rawFirst = raw.first_name ?? raw.firstName ?? raw["First Name"] ?? raw.name ?? null;
      const rawLast = raw.last_name ?? raw.lastName ?? raw["Last Name"] ?? null;
      const rawPhone = raw.phone ?? raw.Phone ?? raw.mobile ?? null;
      const parsed = ContactRowSchema.safeParse({
        email: rawEmail,
        first_name: rawFirst,
        last_name: rawLast,
        phone: rawPhone,
        source: raw.source ?? "legacy_import",
      });
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        errors.push({
          row: idx,
          email: typeof rawEmail === "string" ? rawEmail : null,
          first_name: typeof rawFirst === "string" ? rawFirst : null,
          last_name: typeof rawLast === "string" ? rawLast : null,
          phone: typeof rawPhone === "string" ? rawPhone : null,
          reason: classifyZod(issue ?? { path: [], message: "Invalid row" }),
          detail: issue?.message ?? "Invalid row",
        });
        return;
      }
      cleaned.push({ ...parsed.data, source: parsed.data.source || "legacy_import" });
    });

    // De-dupe by email (already lowercased at validation). A single Postgres upsert
    // rejects a batch that targets the same conflict key twice ("ON CONFLICT DO UPDATE
    // command cannot affect row a second time"). Last occurrence wins.
    const deduped = Array.from(new Map(cleaned.map((c) => [c.email, c])).values());

    if (deduped.length === 0) {
      return { inserted: 0, updated: 0, tagged: 0, errors };
    }

    // Upsert subscribers
    const { data: upserted, error: upErr } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        deduped.map((c) => ({
          email: c.email,
          first_name: c.first_name || null,
          last_name: c.last_name || null,
          phone: c.phone || null,
          source: c.source,
        })),
        { onConflict: "email" },
      )
      .select("id,email,created_at,updated_at");
    if (upErr) {
      // Whole batch failed — flag every cleaned row so the operator can re-upload them.
      const code = (upErr as any).code as string | undefined;
      const reason =
        code === "57014" || /timeout/i.test(upErr.message)
          ? "Database Timeout"
          : code === "23505"
            ? "Duplicate Email Conflict"
            : "Database Error";
      deduped.forEach((c) =>
        errors.push({
          row: -1,
          email: c.email,
          first_name: c.first_name ?? null,
          last_name: c.last_name ?? null,
          phone: c.phone ?? null,
          reason,
          detail: upErr.message.slice(0, 300),
        }),
      );
      return { inserted: 0, updated: 0, tagged: 0, errors };
    }

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
        errors.push({
          row: -1,
          email: null,
          first_name: null,
          last_name: null,
          phone: null,
          reason: "Tagging Failed",
          detail: tErr.message.slice(0, 300),
        });
      } else {
        tagged = count ?? tagRows.length;
      }
    }

    return { inserted, updated, tagged, errors };
  });
