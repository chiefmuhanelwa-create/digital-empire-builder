import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getKitFileUrl, getWorkbookPdf } from "@/lib/products.functions";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

// THE WORKBOOK DOWNLOAD BUTTON.
//
// The kit has promised "10 PDFs" on the sales page since launch. The server
// function that signs the URLs was written, is correct, and had NO CALLER
// anywhere in the repo — so no buyer has ever been able to reach a single one
// of them. This component is that missing caller.
//
// It fails LOUDLY AND KINDLY on purpose. The files live in a private Supabase
// bucket that cannot be listed from a dev machine, so we cannot prove every
// filename in KIT_FILES actually exists up there. If one is missing, the buyer
// gets a plain sentence and an address to write to — never a raw Postgres or
// storage error, and never a button that silently does nothing.

export function KitDownload({
  pdfKey,
  /** Set for the five path steps: the PDF is generated, not fetched. */
  generatedSlug,
  label = "Download the workbook",
  compact,
}: {
  pdfKey?: string;
  generatedSlug?: string;
  label?: string;
  compact?: boolean;
}) {
  const getUrl = useServerFn(getKitFileUrl);
  const getPdf = useServerFn(getWorkbookPdf);
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      if (generatedSlug) {
        // Rendered on demand — nothing in a bucket to be missing.
        const res = await getPdf({ data: { slug: generatedSlug } });
        const bin = atob(res.base64);
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([buf], { type: "application/pdf" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      const res = await getUrl({ data: { key: pdfKey! } });
      const url = (res as { url?: string })?.url;
      if (!url) throw new Error("no-url");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error(
        "That workbook isn't available yet — email info@nochill.co.za and we'll send it to you directly.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={() => void go()}
        disabled={busy}
        className="inline-flex items-center gap-1.5 text-[15px] font-semibold disabled:opacity-50"
        style={{ color: "#1A4FD6" }}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={() => void go()}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[16px] font-bold disabled:opacity-50"
      style={{ background: "#F4F6FA", color: "#1A4FD6", border: "1px solid #E2E5EB" }}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      {label}
    </button>
  );
}
