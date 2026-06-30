import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { getToolCoaching } from "@/lib/tool-ai.functions";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

/**
 * "AI coach" block for an interactive tool. Sends the user's own answers to
 * Claude and renders a personalised recommendation. Kit-gated server-side.
 */
export function AiCoach({ tool, getPayload, label = "Get AI coaching on my answers" }: {
  tool: string;
  getPayload: () => string;
  label?: string;
}) {
  const fn = useServerFn(getToolCoaching);
  const mut = useMutation({
    mutationFn: fn,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-2xl border border-[var(--nx-gold)]/40 bg-[var(--bg-surface)] p-5 mt-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-[var(--nx-gold-deep)]" />
        <span className="nx-label">Your AI coach</span>
      </div>
      {!mut.data && (
        <>
          <p className="text-sm text-[var(--text-dim)] mt-1">Get a personalised read on YOUR answers — what's strong, the one gap, and your next move.</p>
          <button onClick={() => mut.mutate({ data: { tool, payload: getPayload().slice(0, 3900) } })} disabled={mut.isPending}
            className="cta-glow inline-flex items-center gap-2 mt-3 disabled:opacity-50">
            <Sparkles className="size-4" /> {mut.isPending ? "Thinking…" : label}
          </button>
        </>
      )}
      {mut.data && (
        <div className="mt-2 text-[15px] text-[var(--text-body)] leading-relaxed whitespace-pre-line">{mut.data.coaching}</div>
      )}
    </div>
  );
}
