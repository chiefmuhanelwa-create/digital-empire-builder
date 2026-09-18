/**
 * GET /api/public/instagram-lookup?username=xyz
 *
 * Fills the rate card from a username instead of asking a creator to find their own numbers.
 * Returns followers, average views and average interactions — the three fields the engine
 * needs — plus the engagement rate those imply.
 *
 * ⚠️ TWO DIFFERENT DENOMINATORS, AND THEY MUST NOT BE CONFUSED.
 * Instagram gives REACH only to the account that owns the token. For anybody else you get
 * followers and per-post likes/comments, so the engagement rate here is
 *   (likes + comments) / followers
 * A reach-based ER is a different number and is always much higher. Every response says
 * which one it is, and the UI must print it.
 *
 * The CPE band is NOT computed here. It comes from rate-card-engine.ts, which is the single
 * place that owns pricing — a second copy of the ladder is how two tools start quoting
 * different prices for the same account.
 *
 * Uses business_discovery, which reads only public Business/Creator accounts. Personal
 * accounts are unreadable by anyone through the API — a platform rule, not a missing setting.
 */

import { createFileRoute } from "@tanstack/react-router";
import { getCpeTier } from "@/lib/rate-card-engine";

const GV = "v21.0";

/** Public route, so it spends the founder's own quota. Small burst per caller. */
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;

function overLimit(ip: string) {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  if (HITS.size > 5000) HITS.clear();
  return recent.length > MAX_PER_WINDOW;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return 0;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export const Route = createFileRoute("/api/public/instagram-lookup")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const username = (url.searchParams.get("username") ?? "")
          .trim()
          .replace(/^@/, "")
          .toLowerCase();

        const ip = request.headers.get("cf-connecting-ip")
          ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
          ?? "unknown";
        if (overLimit(ip)) {
          return json({ error: "Too many lookups. Wait a minute and try again." }, 429);
        }

        if (!username || !/^[a-z0-9._]{1,30}$/.test(username)) {
          return json({ error: "Give me an Instagram username." }, 400);
        }

        const token = process.env.FB_PAGE_TOKEN;
        const igUserId = process.env.INSTAGRAM_USER_ID;
        if (!token || !igUserId) {
          return json({
            error: "Lookup is not configured.",
            how: "FB_PAGE_TOKEN and INSTAGRAM_USER_ID must be set. business_discovery lives on graph.facebook.com and needs a Page token, not an Instagram-login token.",
          }, 503);
        }

        const fields =
          `business_discovery.username(${username})` +
          `{username,followers_count,media_count,profile_picture_url,` +
          `media.limit(25){like_count,comments_count,timestamp,media_product_type}}`;

        try {
          const r = await fetch(
            `https://graph.facebook.com/${GV}/${igUserId}?fields=${encodeURIComponent(fields)}&access_token=${token}`,
            { cache: "no-store" },
          );
          const body: any = await r.json();

          if (body.error) {
            const m = String(body.error.message ?? "");
            const personal = /cannot be found|does not exist|not a business/i.test(m);
            return json({
              error: personal ? `@${username} could not be read.` : "Instagram refused the lookup.",
              how: personal
                ? "It has to be a public Business or Creator account. Personal accounts are not readable by anyone through the API."
                : m.slice(0, 200),
            }, 404);
          }

          const bd = body.business_discovery ?? {};
          const posts: any[] = bd.media?.data ?? [];
          const followers = Number(bd.followers_count ?? 0);
          if (!posts.length || !followers) {
            return json({ error: `@${username} has nothing public to measure.` }, 404);
          }

          const inter = posts.map((p) => (p.like_count ?? 0) + (p.comments_count ?? 0));
          const avgInteractions = Math.round(inter.reduce((a, c) => a + c, 0) / posts.length);
          const medInteractions = Math.round(median(inter));

          const er = (avgInteractions / followers) * 100;
          const erMedian = (medInteractions / followers) * 100;

          // Views are NOT available for another account. The rate card needs a views figure
          // for the CPM path, so it is left null and the creator supplies it from their own
          // analytics — an empty slot beats a plausible filler.
          return json({
            username: bd.username ?? username,
            profilePicture: bd.profile_picture_url ?? null,
            followers,
            mediaCount: bd.media_count ?? null,
            postsAnalysed: posts.length,
            interactions: avgInteractions,
            interactionsMedian: medInteractions,
            views: null,
            viewsNote:
              "Reach and views are private to the account that owns them. Fill this in from your own Instagram analytics, last 30 days.",
            engagementRate: Number(er.toFixed(3)),
            engagementRateMedian: Number(erMedian.toFixed(3)),
            denominator: "followers",
            denominatorNote:
              "Engagement rate here is (likes + comments) / followers. A reach-based rate is a different number and is always much higher — never compare the two.",
            // Straight from the pricing engine, so there is exactly one ladder.
            cpe: getCpeTier(er),
          });
        } catch (e: any) {
          return json({ error: e?.message ?? "Lookup failed." }, 500);
        }
      },
    },
  },
});
