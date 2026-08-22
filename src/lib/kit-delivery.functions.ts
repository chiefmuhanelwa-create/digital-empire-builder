import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { KIT_FILES, KIT_OWNER_SLUGS } from "@/lib/products.functions";
import { TOOLS, pathTools, toolsWithWorkbooks } from "@/lib/kit-catalog";

// ── FOUNDATION KIT DELIVERY REPORT ──────────────────────────────────────────
//
// The offer is only as real as what actually reaches the buyer, and until now
// nobody could answer "are the workbooks even in the bucket?" without opening
// the Supabase dashboard and counting by eye. Two things had already gone wrong
// exactly this way:
//
//   • getKitFileUrl 403'd for Accelerator buyers for weeks, because the owner
//     list was written before the Accelerator existed.
//   • The receipt email told buyers to start at a "2-minute Readiness
//     Scorecard" that had not been on the path for two rebuilds.
//
// Both were invisible because nothing checked. This checks — every deliverable,
// against the live bucket and the live database, on demand.
//
// Read-only. It never repairs anything, because a repair that runs itself is a
// repair nobody understands the next time it fires.

const FOUNDATION_SLUG = "called-expert-foundation-kit";
const COURSE_SLUG = "called-expert-foundation-kit";

export type CheckLevel = "ok" | "warn" | "fail";

export interface Check {
  id: string;
  label: string;
  level: CheckLevel;
  detail: string;
  /** What to do about it. Empty when nothing is wrong. */
  fix?: string;
}

export const kitDeliveryReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admins only.");

    const checks: Check[] = [];

    // ── 1. The product row itself ──────────────────────────────────────────
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("id,slug,title,price_cents,currency,status,is_free")
      .eq("slug", FOUNDATION_SLUG)
      .maybeSingle();

    if (!product) {
      checks.push({
        id: "product",
        label: "Product row",
        level: "fail",
        detail: `No product with slug ${FOUNDATION_SLUG}.`,
        fix: "Nothing can be bought. Seed the row before anything else here matters.",
      });
    } else {
      // The enum is draft | published | archived — "active" was a guess and TS caught it.
      const live = product.status === "published";
      checks.push({
        id: "product",
        label: "Product row",
        level: live ? "ok" : "fail",
        detail: `${product.title} · ${(product.price_cents / 100).toLocaleString()} ${product.currency} · status "${product.status}"`,
        fix: live ? undefined : "Status is not live, so checkout will refuse the sale.",
      });
    }

    // ── 2. Every workbook, against the actual bucket ───────────────────────
    const { data: objects, error: listErr } = await supabaseAdmin.storage
      .from("product-files")
      .list("", { limit: 1000 });

    if (listErr) {
      checks.push({
        id: "bucket",
        label: "product-files bucket",
        level: "fail",
        detail: listErr.message,
        fix: "The bucket could not be listed, so no download can be verified.",
      });
    } else {
      const present = new Set((objects ?? []).map((o) => o.name));
      const missing = Object.entries(KIT_FILES).filter(([, f]) => !present.has(f));

      checks.push({
        id: "workbooks",
        label: "Workbook files",
        level: missing.length === 0 ? "ok" : "fail",
        detail:
          missing.length === 0
            ? `All ${Object.keys(KIT_FILES).length} files present in product-files.`
            : `MISSING: ${missing.map(([k, f]) => `${k} → ${f}`).join(", ")}`,
        fix:
          missing.length === 0
            ? undefined
            : "A buyer clicking these gets an error. Upload the files or remove the entries from KIT_FILES.",
      });
    }

    // ── 3. Workbooks nothing links to ──────────────────────────────────────
    // A file in KIT_FILES that no tool references is paid-for content the buyer
    // has no way of reaching.
    const referenced = new Set(toolsWithWorkbooks().map((t) => t.pdfKey));
    const orphaned = Object.keys(KIT_FILES).filter((k) => !referenced.has(k));
    checks.push({
      id: "orphans",
      label: "Unreachable workbooks",
      level: orphaned.length === 0 ? "ok" : "warn",
      detail:
        orphaned.length === 0
          ? "Every whitelisted file is reachable from a tool."
          : `No tool links to: ${orphaned.join(", ")}`,
      fix:
        orphaned.length === 0
          ? undefined
          : "The buyer paid for these and cannot reach them. Attach a pdfKey to a tool, or drop them.",
    });

    // ── 4. The course ──────────────────────────────────────────────────────
    if (product) {
      const { data: modules } = await supabaseAdmin
        .from("modules")
        .select("id,unlock_week, lessons:lessons(id,body_md)")
        .eq("product_id", product.id);

      const lessons = (modules ?? []).flatMap(
        (m: { lessons?: { id: string; body_md: string | null }[] }) => m.lessons ?? [],
      );
      const dripped = (modules ?? []).filter(
        (m: { unlock_week: number | null }) => (m.unlock_week ?? 1) > 1,
      ).length;
      const empty = lessons.filter((l) => !l.body_md || l.body_md.trim().length < 40).length;

      checks.push({
        id: "course",
        label: "Course lessons",
        level: lessons.length === 0 ? "fail" : empty > 0 ? "warn" : "ok",
        detail: `${lessons.length} lessons across ${(modules ?? []).length} modules · ${empty} with little or no text`,
        fix:
          lessons.length === 0
            ? "The kit advertises a course and there is none."
            : empty > 0
              ? "Lessons with no text render as an empty page to somebody who has paid."
              : undefined,
      });

      checks.push({
        id: "drip",
        label: "Drip",
        level: dripped === 0 ? "ok" : "warn",
        detail: dripped === 0 ? "Everything opens on day one." : `${dripped} modules still gated behind unlock_week`,
        fix:
          dripped === 0
            ? undefined
            : "The sales page says everything opens on day one. Apply the migration that clears unlock_week, or change the page.",
      });
    }

    // ── 5. The path resolves ───────────────────────────────────────────────
    const path = pathTools();
    const gaps = path
      .map((t, i) => (t.path === i + 1 ? null : `${t.slug} is at ${t.path}, expected ${i + 1}`))
      .filter(Boolean) as string[];
    checks.push({
      id: "path",
      label: "The path",
      level: path.length === 0 ? "fail" : gaps.length ? "fail" : "ok",
      detail:
        path.length === 0
          ? "No tools carry a path number."
          : `${path.length} steps: ${path.map((t) => t.name).join(" → ")}`,
      fix: gaps.length ? `Numbering is not contiguous: ${gaps.join("; ")}` : undefined,
    });

    // ── 6. Who can actually download ───────────────────────────────────────
    const { data: owners } = await supabaseAdmin
      .from("products")
      .select("slug")
      .in("slug", KIT_OWNER_SLUGS);
    const knownOwners = new Set((owners ?? []).map((o: { slug: string }) => o.slug));
    const phantom = KIT_OWNER_SLUGS.filter((s) => !knownOwners.has(s));
    checks.push({
      id: "owners",
      label: "Tiers that unlock downloads",
      level: phantom.length === 0 ? "ok" : "warn",
      detail: `${KIT_OWNER_SLUGS.join(", ")}`,
      fix: phantom.length ? `These slugs have no product row: ${phantom.join(", ")}` : undefined,
    });

    // ── 7. How many people are relying on this ─────────────────────────────
    if (product) {
      const { count } = await supabaseAdmin
        .from("product_grants")
        .select("id", { count: "exact", head: true })
        .eq("product_id", product.id)
        .is("revoked_at", null);
      checks.push({
        id: "grants",
        label: "Live grants",
        level: "ok",
        detail: `${count ?? 0} people currently hold the Foundation Kit.`,
      });
    }

    const worst: CheckLevel = checks.some((c) => c.level === "fail")
      ? "fail"
      : checks.some((c) => c.level === "warn")
        ? "warn"
        : "ok";

    return { worst, checks, toolCount: TOOLS.length };
  });
