import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only Anthropic client. The key is a Cloudflare Worker secret
 * (`ANTHROPIC_API_KEY`); never import this from client code.
 *
 * Model default is Opus 4.8 — the most capable model — because the Offer
 * Builder is the funnel's flagship interactive tool and offer quality is the
 * whole value proposition. Swap `OFFER_MODEL` to "claude-sonnet-4-6" if volume
 * makes cost a concern (Sonnet is ~40% the price).
 */
export const OFFER_MODEL = "claude-opus-4-8";
// Cheaper model for high-volume, lower-stakes calls (per-tool coaching blocks).
export const COACH_MODEL = "claude-sonnet-4-6";

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  _client = new Anthropic({ apiKey });
  return _client;
}
