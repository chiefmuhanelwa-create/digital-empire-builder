import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Download, GraduationCap, MailCheck, FileText } from "lucide-react";

export type DeliveryType =
  | "lms_only"
  | "lms_plus_pdf"
  | "download_only"
  | "not_built_yet";

interface FulfillmentStatesProps {
  deliveryType: DeliveryType;
  productSlug: string;
  productTitle?: string;
  onDownload?: () => void;
  isDownloading?: boolean;
}

/**
 * Reusable fulfillment UI mapping the four delivery_type states defined in
 * CHKPLT's product schema. Mobile-first; never overlaps; clean action blocks.
 */
export function FulfillmentStates({
  deliveryType,
  productSlug,
  productTitle,
  onDownload,
  isDownloading,
}: FulfillmentStatesProps) {
  const shell =
    "mt-10 rounded-md border border-stone-800/60 bg-stone-900 p-6 sm:p-8";
  const eyebrow =
    "font-mono text-[10px] tracking-[0.25em] uppercase text-amber-500";

  if (deliveryType === "lms_only") {
    return (
      <div className={shell}>
        <div className={eyebrow}>Course access granted</div>
        <h3 className="mt-3 font-display text-2xl sm:text-3xl">
          {productTitle ? `${productTitle} is live in your portal.` : "Your course is live in your portal."}
        </h3>
        <p className="mt-3 text-sm text-stone-400">
          This program is delivered entirely inside the learning portal. There is nothing to download.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="bg-amber-500 text-black font-semibold tracking-wide hover:bg-amber-400 transition-all sm:flex-1"
          >
            <Link to="/learn/$slug" params={{ slug: productSlug }}>
              <GraduationCap className="size-4 mr-2" />
              Open the course →
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (deliveryType === "lms_plus_pdf") {
    return (
      <div className={shell}>
        <div className={eyebrow}>Course + Workbook</div>
        <h3 className="mt-3 font-display text-2xl sm:text-3xl">
          Two ways to use what you bought.
        </h3>
        <p className="mt-3 text-sm text-stone-400">
          Download the companion workbook to your device, then step into the lessons when you're ready.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button
            onClick={onDownload}
            disabled={isDownloading}
            className="bg-amber-500 text-black font-semibold tracking-wide hover:bg-amber-400 transition-all w-full"
          >
            <Download className="size-4 mr-2" />
            {isDownloading ? "Preparing…" : "Download workbook"}
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-stone-800/60 hover:border-amber-500/30 transition-all w-full"
          >
            <Link to="/learn/$slug" params={{ slug: productSlug }}>
              <GraduationCap className="size-4 mr-2" />
              Open the course
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (deliveryType === "download_only") {
    return (
      <div className={shell}>
        <div className={eyebrow}>Your download</div>
        <h3 className="mt-3 font-display text-2xl sm:text-3xl">
          {productTitle ?? "Your asset"} is ready.
        </h3>
        <p className="mt-3 text-sm text-stone-400">
          One-click save. Link is valid for 30 minutes — grab a fresh one from your dashboard anytime.
        </p>
        <div className="mt-6">
          <Button
            onClick={onDownload}
            disabled={isDownloading}
            className="w-full bg-amber-500 text-black font-semibold tracking-wide hover:bg-amber-400 transition-all sm:w-auto"
          >
            <FileText className="size-4 mr-2" />
            {isDownloading ? "Preparing secure link…" : "Download now"}
          </Button>
        </div>
      </div>
    );
  }

  // not_built_yet
  return (
    <div className={shell}>
      <div className={eyebrow}>Pre-order confirmed</div>
      <h3 className="mt-3 font-display text-2xl sm:text-3xl">
        Your order is safely confirmed.
      </h3>
      <p className="mt-3 text-sm text-stone-400">
        We're finalising this digital asset and will automatically email you the moment the scroll goes live.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-stone-800/60 bg-stone-950 px-3 py-2 text-xs text-stone-300">
        <MailCheck className="size-4 text-amber-500" />
        We'll email you the link as soon as it ships.
      </div>
    </div>
  );
}
