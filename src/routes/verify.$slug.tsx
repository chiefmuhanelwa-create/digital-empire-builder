import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { verifyCertificate } from "@/lib/certificates.functions";

export const Route = createFileRoute("/verify/$slug")({
  loader: ({ params }) => verifyCertificate({ data: { slug: params.slug } }),
  head: () => ({
    meta: [
      { title: "Verify a certificate — Contentpreneur Africa" },
      // Credentials should be checkable by anyone holding the link, not
      // enumerable from search.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: VerifyPage,
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function VerifyPage() {
  const result = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#3B3A35] flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-xl px-5 py-16">
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#8A6B12]">
          Certificate verification
        </p>

        {!result.found ? (
          <div className="mt-6 rounded-xl border border-[#C8C5B6] bg-white p-8 shadow-sm">
            <h1 className="font-display text-2xl font-black text-[#1C1C1C]">
              No certificate found
            </h1>
            <p className="mt-3 text-[#605E56] leading-relaxed">
              This link does not match a certificate we have issued. Check the
              address, or ask the holder to send it again.
            </p>
          </div>
        ) : (
          <div
            className={`mt-6 rounded-xl border bg-white p-8 shadow-sm ${
              result.revoked ? "border-[#B3261E]" : "border-[#C9A84C]"
            }`}
          >
            <span
              className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
                result.revoked
                  ? "bg-[#B3261E] text-white"
                  : "bg-[#C9A84C] text-[#1C1C1C]"
              }`}
            >
              {result.revoked ? "Revoked" : "Valid"}
            </span>

            <h1 className="mt-5 font-display text-[2rem] font-black leading-tight text-[#1C1C1C]">
              {result.holderName}
            </h1>
            <p className="mt-1 text-lg font-bold text-[#8A6B12]">
              {result.levelTitle}
            </p>

            <dl className="mt-6 border-t border-[#E2E0D6] pt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[#8C8A80]">Level</dt>
                <dd className="font-bold text-[#1C1C1C]">{result.level} of 5</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#8C8A80]">Issued</dt>
                <dd className="font-bold text-[#1C1C1C]">
                  {formatDate(result.issuedAt)}
                </dd>
              </div>
              {result.revoked && result.revokedAt ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-[#8C8A80]">Revoked</dt>
                  <dd className="font-bold text-[#B3261E]">
                    {formatDate(result.revokedAt)}
                  </dd>
                </div>
              ) : null}
            </dl>

            {result.revoked ? (
              <p className="mt-6 text-sm text-[#B3261E] leading-relaxed">
                This certificate has been withdrawn and should not be relied on.
              </p>
            ) : (
              <p className="mt-6 text-sm text-[#605E56] leading-relaxed">
                Certification is awarded on evidence of shipped work — a
                published asset, an owned audience, and proof of payment — not on
                course completion.
              </p>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
