import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CertificateVerdict =
  | { found: false }
  | {
      found: true;
      holderName: string;
      level: number;
      levelTitle: string;
      issuedAt: string;
      revoked: boolean;
      revokedAt: string | null;
    };

type CertificateRow = {
  holder_name: string;
  level: number;
  issued_at: string;
  revoked_at: string | null;
};

export const LEVEL_TITLES: Record<number, string> = {
  1: "Certified Contentpreneur",
  2: "Certified Strategist",
  3: "Certified Coach",
  4: "Licensed Trainer",
  5: "Master Contentpreneur",
};

/**
 * Public certificate verification. Runs server-side under the service role and
 * returns ONLY the fields a stranger needs to check a credential — never
 * user_id, never `evidence` (it carries the holder's revenue figures), never
 * the assessor. See docs/CERTIFICATION-SPEC.md §5-6.
 *
 * A revoked certificate still resolves. That is deliberate: a credential that
 * 404s once withdrawn is indistinguishable from one that never existed, so the
 * revocation has to be visible on the same URL that proved it.
 */
export const verifyCertificate = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ slug: z.string().min(8).max(64) }).parse(input),
  )
  .handler(async ({ data }): Promise<CertificateVerdict> => {
    // `certificates` is created by 20260825130000_certificates.sql and is not in
    // src/integrations/supabase/types.ts yet — those types are generated from the
    // live database, so the table only appears there after the migration is
    // pushed. This narrow cast is the seam until then; delete it and the
    // CertificateRow type once `npx supabase gen types` has been re-run.
    const { data: row, error } = (await (
      supabaseAdmin as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              col: string,
              val: string,
            ) => {
              maybeSingle: () => Promise<{
                data: CertificateRow | null;
                error: { code: string; message: string } | null;
              }>;
            };
          };
        };
      }
    )
      .from("certificates")
      .select("holder_name,level,issued_at,revoked_at")
      .eq("slug", data.slug)
      .maybeSingle());

    if (error) {
      console.error("[verifyCertificate]", data.slug, error.code, error.message);
      return { found: false };
    }
    if (!row) return { found: false };

    return {
      found: true,
      holderName: row.holder_name,
      level: row.level,
      levelTitle: LEVEL_TITLES[row.level] ?? `Level ${row.level}`,
      issuedAt: row.issued_at,
      revoked: row.revoked_at !== null,
      revokedAt: row.revoked_at,
    };
  });
