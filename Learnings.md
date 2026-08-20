# Learnings.md — CHKPLT Digital Empire Builder

The living record of what was discovered, what broke, what was corrected, and what was decided. Read this alongside `CLAUDE.md` before every session. Treat it as authoritative.

---

## 2026-08-19 — full front/back audit of both domains

No headless browser available (Playwright dropped macOS 13), so this was static analysis
+ live HTTP + provider APIs rather than clicking. Stated plainly rather than implied.

**Clean:** zero dead buttons (both candidates were false positives — `GoldButton` spreads
`{...props}`); one dead internal link only; **zero** links that 404 on the domain serving
them (the class that broke the `/apply` downsell is now absent); every public route 200 on
both hosts, with the only non-200s being intended 301/307s; both webhooks reject an
unsigned POST with 401; **no secrets in any client bundle** — the single `MAILERLITE_API`
hit is the literal string in an admin error message, not a value.

**Stripe webhook is correct** (`checkout.session.completed` + `charge.refunded`, exactly
what the handler switches on) — but **two other systems subscribe to the same Stripe
account** on the same event: a different Supabase project
(`piwrkzczjgsdofmqwbxq`, not this one) and `contentpreneurhub.online`. Every CHKPLT
Stripe sale therefore also fires into two unrelated apps.

**The find worth the whole audit — subscriptions are billed at prices nobody displays.**
`gardens.ts` carried a note saying the Inner Circle's real price "isn't visible from
code… needs a founder decision, not a guess." It is visible: `GET /plan` on Paystack
returns it.

| product | Paystack actually bills | ≈USD | displayed | DB row |
|---|---|---|---|---|
| Inner Circle (`PLN_4oafnq18t7e36gl`) | **R540.00/mo** | $32 | **$39** own page, **$29** dashboard | R467.89 |
| Community (`PLN_wl68lf4ll6evdnz`) | **R199.00/mo** | $12 | **$19/mo** | — |

Three numbers for one product, none of which is what the card is charged. A subscriber
clicks a $29 link and lands on a $39 page and is then billed ~$32. The DB row is R72/mo
adrift from the plan that actually takes the money.

**The lesson: "not derivable from code" is a claim to test, not inherit.** That comment
had been carried forward as settled for weeks. One authenticated GET dissolved it. Any
time a note says a fact is unobtainable, check whether the provider simply has an
endpoint for it.

Also: two duplicate `Hooks Generator Unlimited` plans (R49) exist on Paystack.

---

## 2026-08-19 — DEPLOYED: USD pricing + $97/$997/$2,997 ladder (version `92396643-345c-49ff-bf75-85240ca8b84c`)

Migration run by the founder, then deployed. **Verified the migration had actually
landed before shipping the code that depends on it** — a REST query confirmed
`contentpreneur-90day-cohort` at `price_cents: 1608161` — rather than trusting "deploy"
to mean it had been run. Getting that order wrong in either direction is a real money
bug: code-only means the page says $997 while Paystack charges R8,051; migration-only
means the page says $499 while the card is charged R16,081.

Post-deploy checks: `99700` and `299700` present in the shipped bundles,
`paids-framework-workbook: 5400` and `sars-creator-income: 2400` present,
`CurrencySwitcher` absent from every bundle, all pages 200.

**`contentpreneur-vip-tier` could not be verified via anon REST** — it is `draft`, and
RLS filters anon reads to published rows only. Not a failure, just genuinely unverifiable
from this side; the earlier products query returning 23 rows all `published` is what
established that RLS shape. Confirm it in the SQL editor if it matters before publishing.

---

## 2026-08-19 — chkplt.com now prices entirely in USD; rands only at the Paystack gate

Founder ruling: every product displays USD, rands appear only at the conversion gate
(Paystack checkout). `formatPrice` already returns USD for all products after the ladder
reprice; this pass removed what still leaked rands.

**Killed the "ZAR ▼" currency switcher** (`site-header.tsx`). It had quietly become the
worst kind of control: since `formatPrice` no longer varies by geo, picking "ZAR"
changed **no price on the page** — but it *did* still set country to "ZA" and therefore
reroute the buyer from Stripe to Paystack. **A control that appears to change the display
but actually changes the payment processor is worse than no control.** Geo still picks
the rail; the buyer is simply no longer asked.

**Two rand leaks and two stale copy figures:**
- `tax-guide.tsx` advertised "R199 value" on a USD store → `$12 value`
- `niche-clarity.tsx` main price called `formatPrice` **without the slug** — the same
  defect that made `/foundation` render "$94". Its meta also claimed "$16" while R199
  actually converts to $12, so the page title and the price on the page disagreed.
  Both fixed.
- `apply.tsx` still referenced "the R18,000 programme" in a comment → `$997`

**Known and deliberate, worth not mistaking for a bug later:** 7 published products are
absent from `USD_DISPLAY` (`paids-framework-workbook`, `30-day-content-calendar`,
`african-creator-growth`, `niche-clarity-workbook`, `monetise-your-expertise`,
`what-to-post`, `influencers-code-ebook`). They were removed on an earlier founder
instruction to shield them from the FX-sync cron — a cron that has since been disabled,
so the original reason no longer exists. They still render USD, just auto-converted at
`ZAR_PER_USD` rather than a chosen marketing price: $12, $9 … and **$54** for the R899
PAIDS workbook, which is the one that reads like an accident. Needs a founder price, not
a guess.

Order totals and `compare_at_price_cents` also render auto-converted — a subtotal has no
single slug to look up, so that one is structural rather than an oversight.

---

## 2026-08-19 — ladder repriced $97 / $997 / $2,997, and the USD-on-Paystack trap

Founder ruling: Foundation $97 → Accelerator PRO $997 → VIP $2,997, everything else
demoted to order bumps and downsells.

**The instruction contained a false premise, and testing it is what saved the checkout.**
He said: *"use usd for local and it will change to zar on paystack."* Paystack does not
do that. Probed the live account directly rather than arguing from the code comment:

```
POST /transaction/initialize  currency=USD  → status:false  "Currency not supported by merchant"
POST /transaction/initialize  currency=ZAR  → status:true   "Authorization URL created"
```

Had the products been switched to `currency = 'USD'`, **every South African checkout
would have failed at the payment step** — the identical class of silent sales-killer
this whole session existed to remove. `initialize` charges nothing, so this probe is
free and non-destructive. **When an instruction rests on a platform behaving a certain
way, spend one API call confirming it behaves that way.**

The intent still lands, because it was a DISPLAY decision misexpressed as a currency
decision: `formatPrice` now renders USD for everyone (the ZA branch removed — reversing
the same morning's "show SA buyers R1,565" call, on his instruction), while `price_cents`
stays ZAR because that is what actually gets charged. USD on the page, ZAR on the card,
"billed in ZAR at checkout" under the button.

ZAR derived at **16.13** — the rate the live Foundation Kit already implies
(R1,565.03 ÷ $97) — chosen so repricing PRO and VIP moves nothing else on the store.
PRO R16,081.61, VIP R48,341.61.

**VIP slug is `contentpreneur-vip-tier` on purpose:** `products.$slug.tsx` already
rendered `<VipTierBreakdown />` for exactly that slug, and no product carried it — a
finished component that had never once been reachable. Created as `status = 'draft'` and
`requires_application = true`: a $2,997 done-with-you tier should not be self-serve
checkout-able before delivery capacity is confirmed.

**Deploy order matters here.** Code and migration must land together — USD_DISPLAY is
what Stripe charges international buyers, `price_cents` is what Paystack charges local
ones. Deploy alone = display $997 / charge R8,051. Migration alone = display $499 /
charge R16,081.

---

## 2026-08-19 — 360 audit: payments work, DELIVERY is where the money leaks

**The headline correction I had to make on myself mid-audit.** I found the 18 Aug
R10.99 Paystack payment, searched Gmail, found no receipt, and concluded fulfilment
never ran. Wrong. The buyer email was `muhanelwa.ndivhuwo@gmail.com`; the connected
mailbox is `chiefmuhanelwa@gmail.com` — **a different inbox**. The real evidence was in
MailerLite: that subscriber's `updated_at` is `2026-08-18 14:54:43`, two seconds after
the payment, and he is in `CHKPLT BUYERS`. Fulfilment ran fine.
**Absence of evidence in a mailbox you don't own is not evidence of absence.** Check for
the side effect in a system you CAN read.

**Payments are healthy.** Paystack `sk_live_` valid (ZAR). Stripe `sk_live_` valid,
`charges_enabled` and `payouts_enabled` true. Webhook endpoint live and correctly 401s an
unsigned POST. 12 successful Paystack payments all-time, but **only one ever came through
CHKPLT** (`chkplt_…`, 18 Aug); the other 11 are old Paystack-link / store references.

**Delivery is the actual problem. Five ways a buyer can pay and get nothing or the wrong
thing:**

| Product | Price | Fault |
|---|---|---|
| `called-expert-foundations` | R4,792 | published, NOT application-gated, no `download_path`, **no modules, no lessons** — buys nothing |
| `asset-accelerator` (1-click upsell) | R3,600 | delivers `monetise-your-expertise.pdf` — a different, R149 product |
| `creator-swipe-vault` (order bump) | R290 | delivers `what-to-post.pdf` — a different product |
| `called-expert-foundation-kit-bonus` | R290 | promises "3 PDF tools", `download_path` is NULL |
| `first-brand-deal-script` | — | `download_path` is a `https://drive.google.com/...` URL, but every call site does `storage.createSignedUrl(download_path)` **unconditionally** — no `http` branch anywhere, so it signs a nonexistent object key |

The two shared-file rows are the "STAND-IN PDFs" flagged in the old test plan and never
swapped. **A stand-in asset that ships to production is indistinguishable from a bug —
the only thing separating them is whether anyone remembers.**

**Lead capture: two dead MailerLite group IDs still in the Worker env.**
`MAILERLITE_GROUP_ID_CALLED_EXPERT` = `190855179540628547` (confirmed non-existent, hits
`/apply` + offer-builder) and `MAILERLITE_GROUP_ID_ALIGNED` = `191381371543881241`
(confirmed non-existent, hits `/align-accelerate-excel`, falls back to
`FREE_KNOWLEDGE_AUDIT`). Leads are **not lost** — every path writes to Supabase
`subscribers` before calling MailerLite — but they never enter a nurture sequence.
Tool routing itself is sound: a prior session moved those ids out of secrets and into
`src/lib/mailerlite-groups.ts` precisely because a write-only secret cannot be read back
to catch a wrong value.

**Could NOT verify from here, and said so rather than assumed:** whether the 14 PDFs
actually exist in the private `product-files` bucket (anon gets `NoSuchBucket`, which is
correct for a private bucket and tells you nothing about contents); `orders`,
`incidents`, `product_grants` (admin-only RLS); Paystack's configured webhook URL (not
exposed by its API — though fulfilment running proves it is pointed correctly).

All 12 key public routes return 200. Foundation Kit counts verified against code:
7 `CLARITY_STEPS`, 11 kit-gated `apps.*`, 10 `KIT_FILES`, 10 lessons — matching the sales
page exactly.

---

## 2026-08-19 — the 33 are IN the automation and the bundle has actually landed

Founder's call: drop the standalone recovery campaign, put them through the real Creator
Bundle sequence instead. Done, and verified by numbers rather than by assumption:

```
Itu                          sent 0 → 1
CREATOR BUNDLE LEADS  sent_count  124 → 157   (exactly +33)
                      unconfirmed  19 → 0
automation active runs        18 → 51
```

**The misreading that nearly cost the whole thing.** `subscribers_in_queue_count: 18`
looked like 18 stranded people waiting to be released. It was not. Pulling the activity
detail showed those 18 were **confirmed subscribers mid-flow** — one sampled row had
already completed "your bundle is inside" on 13 Aug, "why your posts do not sell" on 15
Aug, and was scheduled for the last email on 19 Aug.

The real finding: **a subscriber who is unconfirmed when they join the trigger group
never enters the automation at all.** They do not queue, they are simply absent. So no
amount of waiting would ever have delivered to the 33, and the earlier plan of "wait and
see if the queue drains" was waiting for something that could not happen.
`qualified_subscribers_count` moving 4 → 5 after activating Itu was the honest signal;
the queue count was noise.

**How to get someone into a `repeatable: false` automation they never entered:** remove
them from the trigger group, then re-add. The re-add fires `subscriber_joins_group` and
they enter at step 1. `repeatable: false` only blocks people who ALREADY went through —
confirmed here by checking `status=canceled` activity first (1 unrelated row from 12 Aug),
so there was no prior run to collide with. Both legs ran as 33-request batches, 33/33.

**Check before firing any re-trigger: does the automation's first email duplicate
something already scheduled?** It did — the standalone 08:30 campaign delivered the same
bundle. That campaign was deleted first. Firing the trigger with it still live would have
sent the same link twice inside eight hours.

Cost accepted knowingly by the founder: the trigger fires immediately, so the email went
out ~00:33 SAST instead of the 08:30 slot, and the apology copy written to the email
skill was dropped in favour of the existing sequence.

`RESEND — NEVER DELIVERED (AUG 2026)` (group `196186638257227303`) is kept as the audit
trail of exactly who was recovered.

---

## 2026-08-19 — ⚠️ MailerLite `update_campaign` SILENTLY WIDENS THE AUDIENCE TO EVERYONE

The single most dangerous thing found this session. Recording it in full because it
would have sent a "you asked for this and I never sent it" apology to the entire list.

A recovery campaign was created correctly scoped to a 33-person group
(`recipients_count: 33`, `all_active_subscribers: false`). Calling `update_campaign` to
tweak the copy produced:

```
filter:                 []          (was: in_any groups [recovery group])
all_active_subscribers: true        (was: false)
recipients_count:       132         (was: 33)
```

**`update_campaign` has no `groups` parameter, and omitting it does not preserve the
existing audience — it resets it to ALL ACTIVE SUBSCRIBERS.** It also silently ignored
the new `content` and kept the old body, so the call did the one thing that was
dangerous and none of the things that were asked for.

**Rule: never `update_campaign` a scoped campaign. Delete it and re-create with
`create_campaign`, which does accept `groups`.** Then re-read it with `get_campaign` and
assert `recipients_count` and `all_active_subscribers` before anyone is allowed to press
send.

**The general lesson, which is the one worth carrying beyond MailerLite:** a partial
update on an API that does not accept a field may not leave that field alone — it may
reset it to the permissive default. **Audience, permissions and visibility fields are
exactly where that default is most expensive.** After any update to something with a
blast radius, re-read the object and verify the blast radius specifically, not just the
field you meant to change.

Also verified before shipping the link (each of these is a way this recovery could have
silently failed a second time):
- Drive folder permissions are `{"role":"reader","type":"anyone"}` — no access requests
- The folder actually contains the two PDFs (`niche-clarity-workbook.pdf`,
  `paids-workbook.pdf`), matching the original email's "two workbooks" claim

---

## 2026-08-19 — 33 stranded leads recovered from `unconfirmed` (not 19 — the group count hid two thirds of them)

Founder switched double opt-in off and asked for a way to resend to everyone who never
confirmed. **Switching it off only changes NEW signups — everyone already stuck stays
stuck**, which is the whole trap.

**The count was wrong in the obvious place.** `CREATOR BUNDLE LEADS` showed 19
unconfirmed, so that looked like the job. Querying subscribers **account-wide** by
`status=unconfirmed` returned **33**, spanning every form back to 4 July. Every single
one had `sent: 0` — they had received nothing, ever, from any list. **Check the account,
not the group: a per-group counter only ever tells you about that group.**

**The mechanism.** Unconfirmed subscribers cannot receive anything — not automations,
not campaigns. So activating them is not one of the options, it is the **precondition
for every option**. That reframing is what made this safe to do without waiting: no
matter which delivery route ends up working, the flip has to happen first.

- The MCP `update_subscriber` has no `status` parameter. `add_subscriber` does, and is an
  upsert on `POST api/subscribers` — that is the way in.
- Tested on ONE first (Itu), verified name, phone and group membership all survived and
  `qualified_subscribers_count` on the automation moved 4 → 5, then batched the other 32
  via `batch_requests`. 32/32 returned 200.
- Result: account-wide `status=unconfirmed` now returns `[]`; the group went 23 → 42
  active.

**Still open at time of writing:** `sent_count` on the group has not moved, so MailerLite
has not yet released the queued automation emails. `subscribers_in_queue_count` was 18
before the flip. Whether MailerLite retroactively delivers a queued automation email to a
subscriber who becomes active later is **not something to assume** — if it does not fire,
the guaranteed path is a one-off campaign to these people. Do not send both, or they get
the bundle twice.

**Deliverability caveat worth carrying:** 33 addresses that never confirmed, some six
weeks cold, all mailed at once is a bounce/complaint risk. They came from a real form
with names and phone numbers attached (not scraped), which is the mitigating factor —
but any recovery email must open by naming exactly what and when they signed up for, or
the older ones will read it as spam.

---

## 2026-08-19 — product-copy migration APPLIED, after a Postgres string-literal bug

`20260818090000_fix_foundation_kit_copy.sql` ran; verified live via REST — `format`,
`description`, `benefits` (6 entries) and the course summary all updated;
`price_cents` (156503 ZAR) and `title` untouched as intended.

**The bug worth remembering.** The first version used `E'…'` literals on consecutive
lines to build the long text. Postgres concatenates adjacent string literals separated by
a newline — but **only the FIRST may carry the `E` prefix**. Repeating `E'…'` on
continuation lines is a syntax error (42601), pointing at the second E-line.

My pre-flight check had counted quote parity and declared it balanced. **Quote parity
proves nothing about literal-concatenation rules** — the file was perfectly balanced and
still would not parse. Rewrote with **dollar quoting (`$$…$$`)**, which takes real
newlines verbatim, needs no escaping, and makes apostrophes and embedded double quotes
(the JSON in `benefits`) safe by construction. **For any multi-line or
punctuation-heavy SQL string, reach for `$$…$$` first — not quoted concatenation, and
not `E'…'`.**

Also: the Supabase SQL editor reports "Success. No rows returned" for an `UPDATE`. That
is not a warning and not a no-op — it just means no result set. Verify writes by
selecting the row back, never by reading that message.

---

## 2026-08-19 — Turnstile keys re-pointed on the Worker

Founder supplied the widget's key pair. Site key `0x4AAAAAAEUreW6sAGh0iD-Y`, secret ends
`...Gq3dbE` (secret value is NOT recorded here — it lives only in the Worker).

**Validated the secret before touching production, without a browser and without any
dashboard access:** POST the secret to `siteverify` with a junk `response`. The error
code discriminates cleanly —

- `invalid-input-secret` → the secret itself is wrong/dead
- `invalid-input-response` → **the secret is valid**, only the response was junk

Got `invalid-input-response`, so the pair is live. **Useful trick: siteverify is a free
validity check on a Turnstile secret, no widget and no browser required.**

`wrangler secret list` shows names only — values are write-only, so there is no way to
diff the deployed key against a supplied one. The only way to guarantee they match is to
set them, which is what was done (`wrangler secret put` for both). Secrets apply
immediately; no redeploy needed.

**This narrows 110200 to exactly two possibilities**, and one page reload separates them:
- widget now loads clean → the Worker had been running a DIFFERENT widget's keys all
  along, which is why editing hostnames in the dashboard appeared to do nothing
- still 110200 → keys were already correct, and this specific widget genuinely lacks
  `contentpreneur.africa` in its hostname list

Safe to try either way, and that is the point of the work that went before it: with
checkout, `/apply`, `/login` and `/signup` all failing open, a wrong Turnstile key can no
longer take anything down. **Making the system safe to experiment on came first; the
experiment came second.**

---

## 2026-08-19 (post-deploy) — the fail-open PROVED itself, and then caused a sign-in outage I had to fix in the same hour

Version `29dd22a5-d05e-4b53-89b6-16e4a41723e3`.

**The proof, from a real click by the founder on the live site** — worth quoting because
it is the whole design working in one trace:

```
widget:  Turnstile error 110200  → "Security check didn't load — you can carry on regardless."
                                   "This domain (contentpreneur.africa) is not on the
                                    Turnstile widget's allowed-hostnames list."
server:  reason: "invalid-input-response",  failedOpen: true
         "checkout was ALLOWED THROUGH so the sale is not lost"
```

Client named the exact cause, button stayed usable, server allowed the sale and paged
the founder. Itu's wall is gone.

**But the same trace proved the Cloudflare hostname field had NOT taken effect** — 110200
is Cloudflare refusing the domain. And that exposed a regression I had shipped: with the
member area now on contentpreneur.africa and `chkplt.com/login` 301ing there,
`/login`, `/signup` and `/apply` all fail CLOSED, so **email sign-in was down on both
domains at once.** (Google OAuth survived — it never required a token.)

**The lesson, and it is about deploy sequencing, not about Turnstile.** I flagged the
dashboard field as a prerequisite and the founder confirmed doing it — and it still did
not take. *A prerequisite you cannot verify yourself is not a prerequisite, it is a
hope.* I had no way to check the widget's hostname list (no Cloudflare API token) and no
headless browser to load the page, so "it's done" went unverified straight into a deploy
that depended on it. **When a deploy depends on external state you cannot read, either
build the code so it does not depend on that state, or do not ship the dependent part.**

Fixed by removing the dependency entirely:
- `/login`, `/signup` → `unavailablePolicy="allow"`. **Zero security lost**: nothing
  server-side ever verified those tokens — Supabase owns authentication and its own rate
  limiting. The widget there was decorative, so blocking on it bought nothing and could
  take sign-in down. This one is not a trade-off; it was strictly a liability.
- `/apply` → fails open like checkout, with a `critical` incident and the verdict
  stamped into `raw_answers._turnstile`. A bot costs one row and one email; a closed
  door costs an applicant to an R18,000 programme.

Still hard-closed, correctly: `generateHooks` (Anthropic credits), `buildOffer`,
`/contact` — there a bot spends something of yours.

**The founder should still fix the hostname list.** Fail-open keeps the money flowing;
it does not restore the protection. Every unverified request now pages him, which is the
correct pressure to keep it from being ignored.

---

## 2026-08-19 — DEPLOYED (version `556d8760-6a9f-4141-a078-5a31437d763e`)

Founder set both dashboard fields (Turnstile hostname + Supabase redirect URL), then
authorised the deploy. `npm run build && npx wrangler deploy`, 120 assets uploaded, 22
routes registered.

**Verified live by request:**

```
contentpreneur.africa/dashboard/foundation-kit  200   (was: HUNG)
contentpreneur.africa/login                     200   (was: 404)
contentpreneur.africa/apps/paids-auditor        200
contentpreneur.africa/learn  /account  /apply   200
chkplt.com/dashboard/foundation-kit  → 301 → contentpreneur.africa/…
chkplt.com/login /account /learn /apps/* → 301 → contentpreneur.africa/…
chkplt.com/  /products  /cart  /tools  /foundation → 200, NOT redirected
```

The redirect boundary is exactly the member area; the storefront is untouched.

**NOT verified end-to-end, and worth being precise about why.** A raw `curl` against
`/_serverFn/<id>` with plain JSON returns a masked 500 (`Seroval Error (step: 3)`) and
writes no incident — TanStack Start serialises server-function arguments as a seroval
stream, so a hand-rolled JSON body is rejected during DESERIALISATION, before the
handler runs. **That 500 is not evidence about the handler; it is evidence the probe
never reached it.** Playwright cannot install Chromium on macOS 13, so there is no
headless browser here either. Confirmed instead that the shipped bundles contain the
new code paths (`ALLOWED THROUGH`, `widget-unavailable`, `unverified:`, `no-response`).
The real test is one click in a real browser, by a human.

**Lesson worth keeping:** an opaque 500 from an endpoint whose wire format you have not
matched tells you nothing about that endpoint's logic. Check for the SIDE EFFECT the
code path would have produced — here, a `critical` incident row and an alert email.
Neither appeared, which is what proved the request died in transport rather than in the
handler.

---

## 2026-08-18 (fourth pass) — checkout now fails OPEN, and what Itu actually got: nothing

Founder asked for a guarantee: nobody hits Itu's wall again. A code fix plus a
dashboard field the founder still has to set is not a guarantee, so the trade had to
change.

**Itu's full journey, reconstructed from MailerLite + incidents:**

```
10:28:30  fills the MailerLite embedded form on /creator-bundle
          → status "unconfirmed", opted_in_at null, sent: 0
          → double opt-in never confirmed, so "Creator Bundle Welcome"
            (enabled, 7 steps) NEVER FIRED. He got no bundle.
12:29:06  comes back two hours later and tries to BUY
12:29:12  again
12:29:15  again — three clicks in nine seconds, all refused by Turnstile
```

He handed over an email AND a phone number and left with **nothing** — not the free
bundle, not the paid product. Two failures stacked; either one alone would have cost
the sale.

**The second leak, which is bigger by volume:** `CREATOR BUNDLE LEADS` has 23 active
and **19 unconfirmed** — 45% of signups are in Itu's exact state. `/creator-bundle` is
a MailerLite embedded form (slug `BPvaab`) and the file says it out loud: "Delivery of
the actual bundle is entirely MailerLite's responsibility." So double opt-in is a hard
gate on the lead magnet — no confirm, no delivery, no nurture, ever. Not fixable in
this repo, and **not something to flip unilaterally** (double opt-in is a
deliverability/consent decision). Flagged with the number attached.

**The posture change: Turnstile on checkout is now a SIGNAL, not a GATE.**
`CHECKOUT_FAILS_OPEN = true` in `checkout.functions.ts`. A failed or missing token
records a **critical** incident (so it emails, instead of joining the 10 rows that sat
unread for three weeks), stamps `metadata.turnstile = "unverified:<reason>"` on the
order, and **lets the buyer through**.

The asymmetry is the whole argument, and it is worth writing down because the instinct
is to keep the gate: a blocked checkout is a **certain** lost sale. What the gate
prevents is a bot creating one pending-order row and one provider init call — no AI
credits, no email, no file served, and **no money moves without a real card on the
provider's own hosted page**. Cloudflare's WAF is already in front of the Worker.
Deliberately NOT applied to `generateHooks` (Anthropic credits), `buildOffer`,
`/contact`, `/apply` — those still fail closed, because there the attacker spends
something of yours. **Fail open where failure costs you a sale; fail closed where
failure costs you a resource.**

**Server-side fail-open is not enough on its own — the client was also hiding the
request.** With the button gated on `!tsToken`, a widget that can't run means the
request never leaves the browser and the server's policy never gets consulted. So
`TurnstileGate` gained `unavailablePolicy`:
- `"block"` (default) — emit null, button stays disabled. For fail-closed endpoints.
- `"allow"` — emit the `TURNSTILE_WIDGET_UNAVAILABLE` sentinel so the button works and
  the SERVER decides. Set on all 5 checkout gates.

**The sentinel is not a bypass**, and that distinction is the design: siteverify
rejects it like any other bad token, so every fail-closed endpoint still refuses it.
All it does is stop the client from making the security decision. **Security policy
belongs in exactly one place per endpoint — the server. The client's only job is to not
suppress the request.**

**Third hole, the one with no callback at all:** if `challenges.cloudflare.com` never
loads — ad blocker, tracker-blocking DNS, corporate proxy, dead mobile connection —
`onError` never fires, because there is no widget to fire it. The form would sit
disabled forever with nothing on screen. Added an 8-second watchdog that emits the
sentinel if the widget has produced nothing. It reads `solvedRef` (a ref, not state) so
it cannot clobber a token that already arrived, and it is self-correcting — a real
token arriving at 11s overwrites the sentinel, which is why 8s is safe instead of
having to guess a worst-case slow-3G load. Relevant to this exact buyer: Itu was on a
South African mobile IP.

**Traced against Itu's scenario, all four paths now complete the sale:** hostname not
allow-listed (110200 → sentinel → server fails open → Paystack); script blocked (no
callback → watchdog → same); retry after a transient failure (`onSettled` reset → fresh
token); bot with no token (critical alert, pending row, no money moves).

---

## 2026-08-18 (third pass) — the incidents confirmed it: 2 real buyers turned away, plus a token-reuse bug and a dead MailerLite group

Founder pasted `/admin/incidents`. Every prediction from the second pass held, and the
rows carried more than confirmation.

**The blocked buyers, cross-referenced against MailerLite:**

| Email | Attempts | When | Who they are |
|---|---|---|---|
| `iikhune32@icloud.com` | **3 in 9 seconds** | 18 Aug 12:29 | "Itu", phone 060 505 0229, joined CREATOR BUNDLE LEADS **that morning at 10:28** |
| `trerulagantse@gmail.com` | 1 | 15 Aug 16:38 | "Rerulagantse", StarterKit Leads — confirmed opt-in 16:20, tried to buy **18 minutes later** |
| `dream@gmail.com` | 4 | 13 Aug 03:37 | not a subscriber — throwaway/test |
| `pipeline-test@nochill.co.za` | 2 | 29 Jul | founder's own test |

Rerulagantse's row is the whole funnel working perfectly and dying at the till: free
Starter Kit → confirm → buy, eighteen minutes end to end, blocked at the last step.
**Three clicks in nine seconds is what a real person does when a button does nothing.**

**New bug #1 — the token is single-use and nothing reset it.** Three
`generateHooks:turnstile` rows on 29 Jul, same topic ("pricing brand deals"), 45s apart.
The hook generator can be run repeatedly, its button was gated on `!valid ||
mut.isPending` — **not on having a token at all** — and it re-sent the same `tsToken`
every run. Cloudflare consumes a token on first siteverify and rejects re-use as
`timeout-or-duplicate`. So run #1 succeeded (no incident) and every retry after it
failed. The same shape explains Itu's three attempts: without a reset, retry #2 is
doomed even when the original failure was transient. Fixed by giving `TurnstileGate` a
`reset()` imperative handle and calling it from `onSettled` (or `finally`) on all 9
forms, plus adding `!tsToken` to three submit buttons that never checked for one.

**New bug #2 — a dead MailerLite group, logged at a severity that never alerts.**
`addToMailerLiteGroup` 422'd on group `190855179540628547`; the MailerLite API confirms
it does not exist. It is one of `MAILERLITE_GROUP_ID_CALLED_EXPERT` /
`MAILERLITE_GROUP_ID_FREE_KNOWLEDGE_AUDIT` (Cloudflare env, not readable from here) —
**almost certainly CALLED_EXPERT, because no group with that name exists in the account
at all.** Used by BOTH `offer-builder.functions.ts` and `apply.functions.ts`, so
qualified Accelerator applicants are not being synced either.

**The severity lesson:** a 4xx "invalid group" is not a warning, it is permanent
misconfiguration — every lead down that path fails forever until a human edits an env
var. At `severity: "warning"` `sendOpsAlert` never fires, so it just accumulated
silently. `mailerlite.ts` now splits config failures (4xx except 408/429) → `critical`
with a per-group endpoint (`addToMailerLiteGroup:invalid-group:<id>`, so the 15-minute
dedup is per broken group and the alert subject names it) from transient ones (5xx/429/
network) → still `warning`. **Choose severity by whether a human must act, not by how
bad it sounds.**

**Also visible in the same MailerLite listing, still unfixed:**
`MAILERLITE_GROUP_ID_BUYERS` points at a group literally *named*
`"MAILERLITE_GROUP_ID_BUYERS"` (7 subs) while the real `CHKPLT BUYERS` group
(`190855383448815273`) has 1. Same bug, logged 2026-08-13, still open.
`Knowledge Audit` (`190855293404448728`) has 0 subscribers.

**MailerLite as forensics:** the incidents table gives you an email; the ESP gives you a
name, a phone number, a signup source and a timestamp. Cross-referencing turned four
anonymous error rows into two named, warm, callable people and two false positives.
Do that before writing anything off as noise.

---

## 2026-08-18 (same day, second pass) — Turnstile was decorative in three places and load-bearing in two; checkout was silently unbuyable

Triggered by the founder reporting "the cloudflare is not working" on the Accelerator
application form. Auditing that turned up a whole class of the same defect.

**The audit — every public form, three columns that must agree:**

| Page | Renders widget | Sends token | Server verifies | State |
|---|---|---|---|---|
| `/apply` | yes | **no** | **no** | theatre + dead form |
| `/foundation` | **no** | **no** | yes | **unbuyable** |
| `/niche-clarity` | **no** | **no** | yes | **unbuyable** |
| `/cart`, `/contact`, `/products/$slug`, `/hook-generator`, `/offer-builder`, `/align-accelerate-excel` | yes | yes | yes | correct |
| `/login`, `/signup` | yes | n/a | n/a (Supabase) | decorative |
| `/starterkit`, `/media-kit` | no | no | no | unprotected |

- **`/apply` failed in BOTH directions at once, from one missing field.** The button was
  gated on `tsToken !== null` but the token was never put in the submit payload, and
  `submitApplication` never called `assertTurnstile`. So a direct POST bypassed the
  challenge entirely (violating CLAUDE.md rule 4), while a widget that merely *failed to
  load* — which is what the founder is seeing — locked out every real applicant with a
  permanently greyed-out button and no message. **A challenge you gate the UI on but
  never verify is the worst of both worlds: no security, full friction.**
- **`/foundation` and `/niche-clarity` are the mirror image.** Both call
  `initializeCheckout`, whose FIRST statement is `assertTurnstile(data.turnstileToken)`
  — and neither rendered a widget or sent a token. With `TURNSTILE_SECRET_KEY` set,
  every single purchase attempt dies on "Verification failed — please refresh the page
  and try again." `foundation.tsx` inherited this by being copied from
  `niche-clarity.tsx`'s "proven BuyForm pattern". **A pattern copied from a page that
  was never actually transacted through propagates a bug with a reassuring name.**
- **Corroborating evidence from Gmail, not from the code:** in 60 days
  `notify.chkplt.com` has sent the founder 2 manual test alerts, 1 rate-card PDF (his
  own 13 Aug test) and 5 password resets. **Zero order receipts.** Consistent with a
  checkout that has never completed — and with `docs/TOMORROW-TEST-PLAN.md` still
  listing "one real end-to-end test purchase" as open.
- **Where the incidents almost certainly come from:** each of the three Turnstile guards
  in `checkout.functions.ts` wraps its failure in
  `reportError(err, { endpoint: "initializeCheckout:turnstile", meta: { email } })` at
  the DEFAULT "error" severity. So every blocked purchase writes an incident row *with
  the would-be buyer's email in `meta`* and never alerts anyone —
  `sendOpsAlert` only emails on `critical` (7 of ~30 call sites). Those rows are a
  recoverable-leads list, not just noise.
- **`TurnstileGate` now explains itself.** `onError` used to do nothing but
  `onToken(null)` — a dead form with no cause on screen. It now surfaces the Cloudflare
  error code, maps the `1102xx` family to "this hostname is not on the widget's
  allow-list" naming the actual hostname, and offers a Try-again that remounts the
  widget (Turnstile does not retry itself once errored). **Silent security failures are
  indistinguishable from broken software to the person in front of them.**
- **Deploy order is now a hard prerequisite, not a nicety.** Wiring the gate into
  `/foundation` means that if `contentpreneur.africa` is not on the Turnstile widget's
  hostname list, checkout blocks at the *button* instead of at the server. Same
  outcome (no sale), but it means the Cloudflare dashboard field must be set BEFORE
  this deploys.

**Could not verify from here, stated as inference not fact:** the incidents table is
admin-only RLS and there is no service-role key in local `.env`, so the rows were never
read — anon returns `[]` whether or not it is empty. A headless-browser check of the
live widget was also impossible (Playwright dropped Chromium support for macOS 13).
The 110200 diagnosis rests on the founder's own report plus the code path, not on a
captured error code.

---

## 2026-08-18 — the Foundation Kit workspace moved to contentpreneur.africa; two live copy/price bugs fixed

**The gap, verified live before touching anything (curl, not assumption):**

```
contentpreneur.africa/foundation                 200
contentpreneur.africa/dashboard/foundation-kit   HUNG (no Worker owned it)
contentpreneur.africa/login                      404
chkplt.com/dashboard/foundation-kit              200
```

A buyer bought on one brand and could only open what they bought on another. The
hang (not a 404) is the tell: `contentpreneur-africa-site/wrangler.jsonc` had its
wildcard narrowed to `/`, `/about*`, `/_next/*` on 2026-08-02, so member paths
matched **no Worker on either zone**.

- **Cloudflare route patterns are config, not code.** `wrangler.jsonc` gained 8
  member-path entries; `src/lib/domains.ts` holds `MEMBER_PATH_PREFIXES` for the
  runtime 301. **The two lists cannot read each other and must be edited together** —
  that is written into both files, because a member route added to one and not the
  other either 404s or fails to redirect, with nothing to catch it.
- **`Response.redirect(url, 301)` on GET/HEAD only.** A 301 on a POST is allowed to be
  replayed as a GET, which silently drops a form submission. TanStack server functions
  POST to `/_serverFn/*` (not a member path), so they were never at risk — but the
  guard is there so a future member path can't become one.
- **A 301 strips the URL fragment, and Supabase returns the session IN the fragment**
  (`#access_token=…`). A post-purchase magic link pointed at chkplt.com would have
  bounced to contentpreneur.africa with the token gone — arriving *not signed in*, with
  no error explaining why. `order-fulfillment.ts` now generates the link on
  `MEMBER_DOMAIN` directly. **Never let an auth callback pass through a redirect.**
- **Per-domain session cookies mean this move signs existing members out once.** Raised
  as the explicit trade-off; the founder chose the single-home redirect over
  dual-domain anyway. Not a bug — a known cost.
- **Relative links are domain-agnostic; that cuts both ways.** 12 "Get the Kit" CTAs
  pointed at `/products/called-expert-foundation-kit`, which does not exist on
  contentpreneur.africa. Repointed to `/foundation` — a real route in this app, so it
  resolves on **both** hosts. The genuinely storefront-only links now go through
  `storeProductUrl()`, which returns absolute chkplt.com in prod and stays relative in
  dev so localhost never bounces to production.

**Two live bugs found by reading the DATABASE, not the migrations:**

1. **`/foundation` was showing "$94".** `formatPrice(cents, currency, isFree, slug, country)`
   was called with only the first three. No `slug` → skips the `USD_DISPLAY` marketing
   price ($97). No `country` → never takes the ZA branch. So the live R1,565.03 was
   mechanically divided by `ZAR_PER_USD` and rendered as `$94` to everyone, South
   Africans included, who are then charged in rand. **A function with optional
   arguments that silently degrades instead of throwing is a live-revenue hazard** —
   the page looked fine and had been wrong for weeks.
2. **The product copy described a product that no longer exists.** The row still carried
   the 2026-06-17 seed text: "six workbooks… in one download", `format` = "6 PDF
   workbooks". But `20260626013917` set `download_path = NULL` and moved delivery into
   the workspace. Real contents, each one *counted* rather than estimated: 7 steps
   (`CLARITY_STEPS`), **11** kit-gated tools (`apps.*.tsx` with `useKitAccess`), 10 PDFs
   (`AVAILABLE_PDFS`), 10 video lessons (confirmed by querying `lessons`). The sales
   page claimed 9 tools and never mentioned the course at all.

**The migrations lie; the database is the source of truth.** `20260617230000` sets the
kit to `USD 9700`. The live row is `ZAR 156503`. Titles in the seed say "Called
Expert"; live they say "Contentpreneur". **Every conclusion in this session that came
from a migration file had to be re-checked against a REST query before it was safe to
act on** — including the "currency mismatch" I initially flagged from the seeds, which
does not exist live (both rows are ZAR).

**Verification:** `npx tsc --noEmit` clean, `npm run build` clean, and the built
`worker-entry-*.js` inspected to confirm `MEMBER_PATH_PREFIXES` and the production
branch of `import.meta.env.DEV` both compiled through correctly. The repo is
pre-existing lint-dirty (826 prettier errors across the member area) — changed files
were linted with `prettier/prettier` off to separate signal from that noise.

**Blocked on the founder (config outside this repo, cannot be done from code):**
Supabase Auth must allowlist `https://contentpreneur.africa/**` as a redirect URL, and
the Turnstile widget must add `contentpreneur.africa` as an allowed hostname. Until
both are set, a paying buyer cannot sign in on the new domain. Logged in
`docs/ARCHITECTURE.md` §13.

---

## 2026-08-13 — the Rate Card tool was leaking 100% of its leads; whole flow moved onto CHKPLT

- **The bug, in one line:** `/rate-card` is an iframe of a verbatim tool copy (`public/tools/rate-card/index.html`) whose form POSTed to `https://nochill-rate-card.vercel.app/api/send-rate-card` — a *different project* (`product-lab/web-tools/rate-card-calculator`). That endpoint mailed the PDF fine via Zoho SMTP, then subscribed the lead to MailerLite group `189168267230709259` **inside a `.catch(() => {})`**. That group had been deleted. Verified live: the MailerLite API returns `Resource does not exist` for it. So MailerLite 422'd every call, the empty catch ate the error, and **every lead this tool ever collected was discarded**. The creator got their PDF; the list got nothing. Zero of the 77 account subscribers are attributable to the tool.
- **Why it stayed invisible for so long:** `src/lib/rate-card.functions.ts` existed and looked completely correct — subscriber upsert, MailerLite sync, queued Resend email. It had **zero callers**. A confirmed-dead decoy that made the flow look wired when it wasn't. Deleted. **Lesson: a lead-capture path that "obviously exists in the code" proves nothing — grep for callers, then verify the destination (group/list/table) actually exists at the other end.** An empty `.catch()` on a lead write is never acceptable; it converts a loud failure into permanent silent revenue loss.
- **This traffic was not hypothetical:** `shopify/emails/email6_html.html` and `email10_html.html` — already sent — link to `https://nochill-rate-card.vercel.app/`, and `docs/CAMPAIGN_REPORT_8EMAILS.md` names Rate Card the **best-clicking link in the entire 8-email sequence (15 clicks)**. Those clicks all landed on the leaking version.
- **pdfkit cannot run on Cloudflare Workers** — it reads its Helvetica `.afm` metrics off disk via `fs`. This is why the PDF generation lived on Vercel in the first place. **`pdf-lib` (already a declared dependency, previously unused) is the Workers-safe replacement**: pure JS, 14 standard fonts built in. New `src/lib/rate-card-pdf.ts` ports the layout 1:1. Two gotchas: pdf-lib's origin is BOTTOM-left (pdfkit's is top-left) and it positions text by BASELINE (pdfkit by the top of the line box) — both handled in one `drawText`/`rect` helper pair so the body reads top-down like the original. pdf-lib also has no `characterSpacing` (tracked caps drawn glyph-by-glyph), no `roundedRect`, and no text wrapping (hand-rolled `wrap()`). Output verified by rendering to PNG and eyeballing it: 15,983 bytes, layout identical.
- **Resend supports attachments; the queue did not pass them through.** One line added in `email-queue.ts` (`attachments: payload.attachments ?? undefined`). Base64 in the pgmq JSONB payload is ~21KB for this PDF — comfortably fine.
- **New `src/routes/api/public/rate-card.ts`** — writes the lead to `subscribers` (`source: "tool:rate-card"`, first-touch preserved) FIRST, then MailerLite, then queues the email. Order matters: if MailerLite or Resend fails, the lead is already in our own database. Missing `MAILERLITE_GROUP_ID_RATE_CARD` now calls `reportError` instead of failing silently.
- New MailerLite group **`RATE CARD LEADS` = `195639769718327259`** (env `MAILERLITE_GROUP_ID_RATE_CARD`). Also noticed: `MAILERLITE_GROUP_ID_BUYERS` points at a group literally *named* `"MAILERLITE_GROUP_ID_BUYERS"` (7 subs) while a real `CHKPLT BUYERS` group sits empty at 0 — the env var's name was pasted in as the group name. Not fixed this session; needs a founder decision on merging.
- The old Vercel app now 307-redirects `/` → `https://chkplt.com/rate-card` (`vercel.json`), and its API's group + upsell were fixed too as a belt-and-braces measure for anyone deep-linking the cached page. **Needs a Vercel redeploy to take effect.**
- Same session: `first-brand-deal-script`'s live `description` was still leaking an internal migration note (third instance of this bug — see 2026-07-29 entries). Fixed in `20260813120000_fix_first_brand_deal_script_copy.sql`, plus a POSSESS-in-ICP-2 tagline and a `benefits` list that described contents the actual PDF doesn't have. Re-swept all 23 published products: no other leaks.
- **CONFIRMED LIVE (01:01 SAST):** founder ran a real submission through the deployed tool. `chiefmuhanelwa@gmail.com` landed in `RATE CARD LEADS` and the PDF email arrived. First lead this tool has ever captured. The Resend **attachment** passthrough also worked on its first production execution.
- **`void addToMailerLiteGroup(...)` is unsafe on Cloudflare Workers.** An unawaited promise can be cancelled the moment the `Response` returns — non-deterministic silent lead loss, i.e. the exact bug this endpoint exists to prevent. Changed to `await` in `rate-card.ts` (the helper swallows its own errors, so awaiting can never fail the request; costs ~200ms). **`manychat-lead.ts` and the other tool functions still use `void` and should be reviewed the same way** — DM_LEADS having 31 subscribers means it *usually* works, not that it always will.

### The three iframe bugs on `/rate-card` — and one wrong diagnosis worth remembering

All three came from the same root: the tool is iframed and sized to its own full content, so **the frame never scrolls and `100vh` inside it resolves to the frame's own height.**

1. **I first diagnosed the height bug as a runaway ResizeObserver feedback loop. That was wrong** — proven wrong by actually harnessing old-vs-new logic in headless Chromium at iPhone 13 size, where the old code settled in 3 updates. The real mechanism is a **ratchet**: with `body{min-height:100vh}`, `body.scrollHeight` can never report less than the height already applied, so the frame only ever grows. Measured: after calculating, real content was 2812px but the frame stayed pinned at 3730px — **~900px of dead white space** under the results. Fix: inject `body{min-height:0}` into the frame on load. **Lesson: build the harness and measure before writing the explanation into a code comment — a plausible mechanism is not a verified one.**
2. **`window.scrollTo({top:0})` inside the frame is a silent no-op** (lines 937/945 of the tool, on every screen switch). The user hit Calculate and stayed wherever they'd scrolled to in the form — landing mid-tool with the results above them. Fix: the tool `postMessage`s the parent; `rate-card.tsx` scrolls the real page, offset by the **measured** `SiteHeader` height (it's `sticky top-0`, so scrolling to the raw frame top buries the results). Verified: scrollY 1800 → 36, frame top 72px vs a 64px header.
3. Added `scrolling="no"` (frame is always full height, and it can otherwise swallow touch scrolls on iOS) and rAF + 8px hysteresis on the resize (3 updates → 1).

### Tax funnel step 2: /tax-guide landing page (MailerLite embed DkGjRH)

Funnel is: `/provisional-tax` (no email) → `/tax-guide` (email) → `sars-creator-income` (paid). Built the middle step reusing the existing `MailerLiteEmbedForm` component, same pattern as `/creator-bundle` and `/starterkit`. Verified in a real browser that MailerLite resolves the slug to a live form (`jsonp/2399736/forms/DkGjRH` → form id 195711925104936067) and loads webforms.min.js — i.e. the form is genuinely active, not a dead slug.

⚠️ **Trade-off recorded, not resolved:** a MailerLite EMBED means the lead lands in MailerLite only. It does NOT hit our own `subscribers` table, so `/admin/tools` cannot show leads or a conversion rate for this page, and if the form or its automation is ever deleted the leads have nowhere to land — the same third-party-single-point-of-failure that cost every rate-card lead. The native alternative (own endpoint → `subscribers` first → MailerLite → Resend, as used by rate-card and provisional-tax) is strictly more robust. Founder chose the embed; documented here so the choice is visible.

Also fixed the last outstanding TypeScript error in the repo (`MailerLiteEmbedForm.tsx` cast `window.ml` through undefined; now reads the just-assigned `w.ml`). **`npx tsc --noEmit` is now fully clean for the first time this session.**

### Pre-launch verification for the tax video — what is and is not proven

Verified against PRODUCTION, not code:
- ✅ Lead-magnet half works: `RATE CARD LEADS` **19 subscribers** (82% open), `TAX LEADS` **1** — real capture since the fixes. `/provisional-tax`, `/tax`, both endpoints live. `MAILERLITE_GROUP_ID_TAX`, `RESEND_API_KEY`, `PAYSTACK_SECRET_KEY`, `STRIPE_SECRET_KEY` all present as Worker secrets.
- ⚠️ Payment half is coded and was proven end-to-end in June — **but with a TEST Paystack key**, and Learnings' own note says "remember to swap back to live before real selling". The Worker secret is write-only so the deployed mode is unknowable from here. **Fix is to overwrite rather than investigate:** pipe `PAYSTACK_LIVE_SECRET_KEY` from `.env` into `wrangler secret put PAYSTACK_SECRET_KEY`.
- ⚠️ Could NOT verify `sars-creator-income.pdf` exists in the private `product-files` bucket — a private bucket returns "Bucket not found" to anon whether or not the file is there, so that probe proves nothing. Missing file → buyer pays and sees "No download available".
- ⚠️ No real (non-test) purchase has ever completed; `docs/TOMORROW-TEST-PLAN.md` section C is still unticked.

**Lesson: "the code is wired end to end" and "money has actually moved end to end" are different claims. Only the second one is safe to launch on.**

### Swept the whole codebase for the two bug classes this session kept surfacing

Rather than fix each instance as it appeared, went looking for every occurrence:

1. **Unsanitised user input reaching pdf-lib.** `rate-card-pdf.ts` drew `creatorName` raw — an Arabic, Amharic or Tifinagh name would have thrown inside pdf-lib and 500'd **live rate-card delivery**, which is running and taking real traffic. Extracted the sanitiser into `src/lib/pdf-text.ts` (`pdfSafe` / `pdfSafeName`) and routed BOTH generators through it at the drawText level so no caller can bypass it. Verified against 7 name classes (Latin, Arabic, Amharic, Tifinagh, accented, emoji+typography, entirely-non-Latin): all produce valid PDFs, none throw. `pdfSafeName` falls back to "Creator" when sanitising leaves nothing, so a wholly non-Latin name renders a name rather than a blank.
2. **`void addToMailerLiteGroup(...)` in 9 places** — apply, media-kit, products, hook-generator, aligned, order-fulfillment, offer-builder, starterkit, manychat-lead. On Workers an unawaited promise can be cancelled when the Response returns, so every one of those was a non-deterministic lead drop. All now awaited; all 9 were already in async contexts so it compiled clean.

Also: added the provisional tax tool to `src/lib/tools.ts` (it existed but nothing linked to it — same discoverability miss as `/admin/tools`), and cross-linked `/sars-calculator` → `/provisional-tax` so the two tax tools read as a pair (habit vs exact figure) instead of duplicates.

**Lesson: when a bug class shows up twice, grep for the third. Both of these were found by searching, not by a report.**

### Provisional tax calculator built for the tax video — and a near-miss on the tax table

Founder is posting a tax/SARS video with DM keyword TAX. Discovery first:
- **`contentpreneurship.com` is NOT ours** — it 302s to `skool.com/contentpreneurship`, someone else's community. Ours is **`contentprenuership.com`** (misspelled: "prenue"), Vercel project **`sales-copy`**, branded *CreatorKit*. A domain you cannot say on camera is not a CTA. All its tools (`/dashboard/provisional-tax-calculator`, `/checklist`, etc.) are **ungated with zero email capture** — same leak as the rate card, different site.
- Decision: send tax traffic to chkplt.com, and **build the real provisional tax calculator there** (the existing `/sars-calculator` is only a flat 25% reserve rule of thumb).

**⚠️ THE NEAR-MISS.** I compared CreatorKit's calculator against the bracket table printed on its own page and concluded it under-stated tax by R585–R1 855, and said so. **I was wrong.** The founder sent the SARS source, which showed the **2027 year of assessment** (1 Mar 2026 – 28 Feb 2027) is in effect: brackets start at R245 100, primary rebate **R17 820**, threshold **R99 000**. Their engine uses those — it reproduces its output at 7 sampled incomes **exactly**. What is stale is the bracket table *displayed beneath* the calculator (the superseded 2026 one). **Lesson: when your reference disagrees with a working production tool, suspect your reference before the tool — and for anything regulatory, go to the primary source FIRST, not to a competitor's implementation.** I had also asked which table to use and would have shipped the wrong year had the founder not sent the link.

Built on chkplt.com:
- `src/lib/provisional-tax-engine.ts` — the 2027 SARS table isolated in ONE clearly-marked block (everything else is derived arithmetic). Verified three ways: bases chain (0.18 × 245 100 = 44 118 → … → 666 339), threshold × 18% === rebate exactly, and it reproduces CreatorKit's live output at all 7 probes.
- `provisional-tax-pdf.ts`, delivery email, `/api/public/provisional-tax` (lead → own DB first, MailerLite **awaited**, then queued email + PDF), `/provisional-tax` page with the 15-item compliance checklist, and a **`/tax` alias** because a video CTA has to be sayable.
- MailerLite group **TAX LEADS = `195704432781952522`** (env `MAILERLITE_GROUP_ID_TAX`).

**pdf-lib standard fonts THROW on any character outside WinAnsi** — a creator with an Arabic, Amharic or Tifinagh name would have 500'd the whole endpoint. Now every string routes through a `safe()` sanitiser before being drawn. **The rate-card PDF has the same exposure and should get the same treatment.**

Checklist deadline dates on the source tool were all expired (31 Aug 2025, 28 Feb 2026, 20 Jan 2026). Replaced with the recurring pattern ("By 31 August", "By the last day of February") rather than hard-coded years that silently go stale.

### The first three tracked events exposed two bugs — read your own data early

The moment `tool_events` existed, 3 real rows arrived and both of these were visible in them:
- **`session_id` was NULL on every row.** `crypto.randomUUID()` is **secure-context only**, and `meta.origin` showed `http://chkplt.com` — the site answers on plain http with **no redirect to https** (`curl -o /dev/null -w "%{http_code}" http://chkplt.com/rate-card` → 200, no Location). On http the call throws, my try/catch swallowed it, and every session id came back null. Fixed with a cascade: `randomUUID` → `getRandomValues` (works on http) → `Math.random`. An anonymous visitor counter never needed cryptographic randomness. Verified by stubbing `randomUUID` to undefined: all 3 events now share one id.
- **The dashboard would have reported 0 visitors and 0 completions** against those 3 events, because `uniq()` counted `new Set(rows.filter(e => e.session_id))` — silently discarding every session-less row. Now counts distinct sessions PLUS session-less rows individually. **Any "unique X" metric needs an explicit decision about null keys, or it under-reports invisibly.**

**Lesson: look at the first rows a new analytics table receives, individually, before trusting any aggregate built on top of them.** Both bugs were obvious in 3 raw rows and would have been invisible in the dashboard — which would just have shown zeroes and been read as "no traffic yet".

⚠️ **Open, not fixed by code:** chkplt.com serves over plain HTTP. Creators are submitting email addresses unencrypted. Proper fix is the Cloudflare **SSL/TLS → Edge Certificates → Always Use HTTPS** toggle, not application code.

### Rate Card formula — verification method (re-runnable)

Founder asked for proof the maths is still the researched original after the native rebuild. Method, in order of strength — reuse this whenever a calculation engine is ported:
1. **Constant diff** — parse every numeric literal out of `git show HEAD:public/tools/rate-card/index.html` and out of `rate-card-engine.ts`, compare as floats not strings (prettier rewrites `1.00`→`1.0`, which looks like a diff and is not one).
2. **Formula-step diff** — whitespace-squash both function bodies and assert each arithmetic expression appears in both. All 18 steps confirmed present. ⚠️ My first version of this checker stripped whitespace BEFORE matching `const`, so it reported every step MISSING in *both* files and printed "FORMULA DIVERGED" — a checker bug, not a finding. **If a verification says everything failed including the control, suspect the verifier.**
3. **300 randomised end-to-end cases** through the ORIGINAL tool (recovered from git, served locally) vs the new engine, seeded so both runs get identical inputs. 300/300 bit-identical, largest difference across 13 fields × 300 cases = 0. Coverage: 8 niches, 5/5 content types, 7/7 platforms, 5/5 add-ons.
4. **Live production spot-check** — drove chkplt.com/rate-card itself: R37 747 / R32 085 / R43 409 / R24 255, matching the original exactly.

Currency conversion is display-only (engine computes in ZAR, `formatCurrency` converts at render), so it cannot move the underlying maths.

**Calibration note, recorded not acted on:** against the founder's own verified deals the tool's outputs run 3–39× high (Capitec R10,500/Reel vs tool R43,860 at ~100K views; SA Tourism R1,000/deliverable vs R38,834; Savanna R25,000/mo vs R78,948). Founder's decision: **leave the researched constants exactly as built.** Flagged the sharpest risk for the record — the "Floor rate · never go below this" label sits ~4× above a real Capitec offer, so a creator following it literally could decline a genuine deal. No change made.

### Tools Hub: first-party analytics, and the Rate Card rebuilt native

- **"How many visited / how many calculated" was unanswerable — nothing recorded it.** `track.ts` only wraps FB Pixel + GA (no Pixel is running), `tool_submissions` is written by the hook generator alone, and no page view was stored anywhere. Built `tool_events` (view/start/complete/lead, anonymous per-tab session id), a public `/api/public/tool-event` beacon (slug + event allowlist, origin check, **service-role writes — an anon insert policy would let anyone forge funnel numbers**), a `useToolView` hook wired into all 7 native tools + the hub, and `/admin/tools` joining events + `subscribers.source` + `email_send_log`. **Confirmed again: a hand-written migration needs the table hand-added to `src/integrations/supabase/types.ts` or every query is a type error.**
- **Rate Card rebuilt as a native React page**; the iframe and its copied HTML are deleted. Maths extracted to `src/lib/rate-card-engine.ts` and **diffed against the original across 5 cases before switching** — identical to floating-point precision, including no-platform and sub-1000-follower edges. Verified again in a real browser: same example → R37 747.
- **`documentElement.scrollWidth` does NOT detect clipped overflow.** My first mobile check passed while the add-on cards were visibly sliced off on a real phone, because the offending element sat inside an `overflow-hidden` ancestor (`ToolCanvas`) — the page never widened, the content was just cut. **Check each element's right edge against the viewport instead.** Root cause was a flex text column with `min-w-0` but no `flex-1`, so it sized to content instead of shrinking.
- **Rebuilding a tool silently drops features unless you diff against the original.** The first native pass quietly lost SIX: CPM-vs-CPE comparison, negotiation strategy, strategic insights, benchmark bars, the full line-by-line breakdown, and the USD equivalent. Recovered the old file with `git show HEAD:<path>` and restored all of them. **Lesson: when replacing a working tool, enumerate its features from the source first and check them off — "it calculates the same number" is not parity.**
- Restored the original's **three-screen flow** (form → calculating → results). Appending results below the form buried the payoff and left no way back to the inputs. The calculating screen narrates the creator's **real intermediate values** (niche CPM, tier multiplier, platform weighting, CPM vs CPE) rather than showing a fake spinner — it earns the ~1.7s beat and teaches the method the creator will later argue to the brand. Respects `prefers-reduced-motion`.
- **The local vite dev server wedged repeatedly** (`Network connection lost` / `retryable: true` in the workers runner, then hanging indefinitely). Working path: `npm run build` then `npx wrangler dev --local` and test against that — the production artifact, and more faithful anyway.
- **Brand divergence flagged, not fixed:** the tools now use the canonical brand (Cream #FAF7F0 / Charcoal #1C1C1C / Heritage Gold #C9A84C) per the brand guidelines and the Contentpreneur carousels. The rest of chkplt.com is amber #F59E0B on white/slate — which is why the rate-card email renders orange. Tokens live in `src/components/tools/premium.tsx` if the site follows.

### Currencies: 11 → 42, plus two real correctness bugs

- Extended to **every African currency — 42 codes covering all 54 countries** (XOF = 8 West African states, XAF = 6 Central African). All 42 were verified present in the `open.er-api.com` USD feed *before* being listed, so none silently falls back.
- **The emailed PDF was always in rands.** `sendRateCard` hardcoded `zar=n=>'R '+…` and skipped conversion entirely — so a creator who picked naira saw naira on screen and then received a PDF quoting rands. That PDF is the document they forward to a brand. Now uses `fmtC()`.
- **A missing rate silently produced ~84× wrong numbers.** `liveRates[code] || zarRate` fell back to the *rand* rate while still printing the foreign symbol — `₦ 37 747` for what was really R37 747. Fires whenever the rate API is slow or down, which is also the first paint. Now `canConvert()` gates it: stays in rands and shows `⚠️ Live rate for NGN unavailable — showing rands`, and re-renders once real rates arrive. **Lesson: a currency fallback must never keep the symbol of the currency it failed to convert to.**
- Verified live: R37 747 → ₦3 181 310 · KSh302 263 · ₵27 086 · E£117 436 · CFA1 330 206 · ZiG62 149.

---

## 2026-08-04 — ManyChat DM automation (IG + TikTok) live-debugged; `manychat-lead` webhook confirmed healthy throughout

- The founder's live ManyChat "Hub" flows (Instagram + TikTok, built off the architecture in `~/.claude/plans/stop-building-you-are-whimsical-shannon.md`) were skipping steps for real contacts. Checked real Supabase data (`subscribers` table, `raw_data->manychat`) to diagnose instead of guessing from symptoms alone — this surfaced the actual bugs faster than flow-reading would have. **Lesson: when a no-code automation "feels broken," pull the backend data it's supposed to be writing before debugging the flow itself — the data tells you exactly which steps actually ran.**
- **Confirmed the `manychat-lead.ts` webhook itself was never the problem** — checked live via the anon Supabase key (`content-range: */0` on an unfiltered query confirmed RLS correctly blocks anon reads on `subscribers`, good security posture, not a bug) and via ManyChat's own Edit Request test panel (real 200s once bodies were correct). All 4 bugs found this session were entirely inside the ManyChat flow builder, zero code changes needed in this repo.
- **4 ManyChat-side bugs found and fixed (all are general no-code-automation lessons, not CHKPLT-specific):**
  1. Gating a "did we already collect this?" condition on ManyChat's **System Field** (`First Name`) instead of a custom field — TikTok/IG auto-populate that field from the platform profile before the flow's own question ever runs, so the condition reads true immediately and the question silently never fires. Fix: gate on a custom field (`name_confirmed`) that only your own flow ever sets.
  2. A tag-based "stop re-entry" guard was built in the wrong order — tagging the contact `in_progress` fired *before* the check for that same tag, so by the time the check ran (later in the same execution), the tag was already there — catching brand-new contacts as if they were returning. **Lesson: any "have we already done X" check must sit before the step that does X, not after — even a few nodes later in the same run is still "after."**
  3. An External Request step reading an AI Step's output (`{{OUTPUT}}`) fired before the AI Step had finished writing it, sending an empty string that failed the backend's Zod enum validation (silent 400, no data saved). Diagnosed via ManyChat's own Edit Request → Preview panel, which shows the actual resolved value for a real test contact — far more reliable than assuming the merge tag itself was broken. Fix: lengthen the Smart Delay before the read; stronger fix (not yet applied) is moving the read to fire from inside each already-routed branch instead of before the branch split.
  4. Real, live-only message stalls (worked in ManyChat's Preview, hung 2+ minutes on a real TikTok send): caused by shortened links to a lesser-known shortener domain (`l1nq.com`/`l1nq.dev`) — TikTok appears to hold/delay bot messages containing links from unrecognized shortener domains. Fix: full un-shortened links to the founder's own already-trusted `chkplt.com` domain where short enough; `bit.ly` (globally established, platform-trusted) where a hard ~40-character link limit forced actual shortening.
- No short-link system exists yet in this codebase (checked `src/routes` for any `/go/`, redirect, or shortener route — none). Flagged as a real future build if link-length/trust issues recur: a first-party `chkplt.com/go/:slug` redirect would satisfy both the character limit and the trust requirement simultaneously, since the domain is already proven trusted by the working webhook calls.

---

## 2026-07-30 — real ops alerting, closing the #1 gap from the automation/sustainability audit

- Ran a genuine automation/sustainability audit (not from memory — read the actual `error-logger.ts`, both webhook handlers, both cron jobs, checked for any external monitoring service reference anywhere in the repo) and found: every failure was already logged (console + `incidents` table), but **nothing ever told anyone it happened**. The founder would only find out by remembering to open `/admin/incidents` or from a customer complaint. Scored the store 7/10 on "runs without me" specifically because of this gap.
- Founder said yes to fixing it. Built `src/lib/alerts.ts`'s `sendOpsAlert()` — sends a real email via Resend the moment something marked `severity: "critical"` happens, wired into `reportError()`. **Deliberately bypasses the pgmq transactional-email queue** and calls Resend directly — an alert about the system being broken must not depend on the same queue/cron infrastructure that might be part of what's broken. This is a real architectural principle worth remembering: a monitoring/alerting path should never share a failure domain with the thing it's monitoring.
- **Rate-limited by querying the `incidents` table itself** rather than a new table — count matching `endpoint`+`severity` rows in the last 15 minutes; if this is the 2nd+, skip the email (the incident still gets logged, just doesn't re-alert). A retried webhook or a cron firing every minute must not spam an inbox, but a genuinely different failure still alerts immediately since it's a different `endpoint`.
- **Only alerts on `severity: "critical"`, never the "error" default** — checked existing usage first (`grep severity:` across the repo) and found only 2 deliberate uses of "critical" (account deletion, order fulfillment), both genuinely urgent. Alerting on the much more common default "error" severity (Turnstile failures, parse hiccups) would have made this noisy from day one and trained the founder to ignore it — matched the threshold to what the codebase already treated as truly critical, rather than inventing a new one.
- Wired both payment webhook handlers' catch blocks (previously bare `console.error`, invisible outside Cloudflare's own logs) and both cron jobs (fx-sync, email-queue — including the `{ok:false}` return-value failure mode, which doesn't throw and was previously invisible even to console.error) through `reportError` with `severity: "critical"`.
- **Couldn't safely end-to-end test the real failure path** — faking a valid Paystack webhook signature would need the real secret (shouldn't extract it), and deliberately breaking a live payment secret to force a real failure is exactly the kind of destructive test to avoid on production config. Instead built a proper, reusable "Send test alert" button on `/admin/incidents` (calls `sendOpsAlert` directly with a unique per-click endpoint string so it's never deduped) — this is a legitimate permanent feature, not a one-off test hack, since it lets the alert pipeline be self-verified anytime in the future (e.g. after rotating the Resend API key) without needing to fake anything. **Lesson: when you can't safely trigger a real failure to test a safety mechanism, build a dedicated self-test path instead of skipping verification or risking production.**

---

## 2026-07-29 (later again) — matched the full product page + Quick View exactly to the real store, using founder-supplied screenshots as the spec

- Founder shared 3 real mobile screenshots of contentcreatorhub.online's actual product page and asked chkplt.com to match "exactly like that." Read the screenshots as a literal layout spec rather than a vibe: price row order (compare-price strikethrough → current price → Sale badge), a "Taxes included. Instant digital delivery." line right under price, Add to Cart + Buy now positioned immediately after that (not buried in a separate boxed "secure checkout" section further down), and everything below flowing as one continuous read (description → long pitch → plain "Inside:" bullets) instead of separately-labelled bordered boxes that don't exist on the real store.
- Added a visible-scrollbar CSS utility (`.visible-scrollbar` in `styles.css`, sibling to the existing `.no-scrollbar`) and applied it to the Quick View popup — founder wanted a visible scroll affordance matching the real store's own page scrollbar, since native scrollbars are auto-hidden on most browsers/OSes by default.
- Re-ran the full responsive audit (26 routes × 3 viewports, 0 issues) after this layout change to confirm the reorder didn't introduce a new overflow regression.

---

## 2026-07-29 (still later) — Quick View modal didn't actually fit on a real phone; my own "responsive audit" test had a blind spot

- **A second real phone screenshot found a bug my automated audit completely missed**: the Quick View modal's `max-h-[85vh]` cap only applied at the `sm:` breakpoint — on mobile there was NO height bound, and the outer backdrop didn't scroll. When a product's stacked content (portrait cover + title + price + description + benefits + buttons) exceeded the phone's viewport height, the modal — vertically centered with `items-center` and no scroll escape — got clipped at BOTH ends: founder couldn't see the close button (top) or reach Add to Cart (bottom), and reported "I can't even scroll until the end."
- **The earlier "81/81 checks passed" audit only measured HORIZONTAL overflow** (`document.documentElement.scrollWidth` vs `clientWidth`) — a real, valid check, but one that says nothing about whether a fixed-position modal's content is fully reachable VERTICALLY on a short viewport. **Lesson: "no horizontal scrollbar" and "actually usable on mobile" are different claims — a thorough responsive audit of a modal/popup needs an interaction test (scroll to an element, confirm it's reachable, click it) not just a layout-overflow metric.** Re-verified this specific fix with exactly that: a Playwright test on a 390×700 viewport that scrolls to the Add to Cart button, confirms it becomes visible, clicks it, and confirms the close button stays visible/reachable both before AND after scrolling.
- **Fix pattern**: moved the close (X) button out of the scrolling card entirely — it's now `fixed` directly on the viewport (a sibling of the card, not a child), so it can never scroll away regardless of what the card does. For the card itself: on mobile, removed the separate inner scroll region and let the WHOLE card scroll as one unit via the backdrop (`overflow-y-auto` on the outer fixed backdrop + a `flex min-h-full items-center justify-center` wrapper around the card, instead of `items-center` directly on the scrolling backdrop — the latter clips whichever end overflows first since centering happens against the viewport, not the content). Desktop keeps the original two-column behavior (image fixed-width, text pane scrolls independently, card capped at 85vh) since that layout doesn't have the same problem.

---

## 2026-07-29 (yet even later) — a real phone screenshot found a 2nd/3rd leaked internal migration note in live product descriptions

- **Founder sent an actual screenshot from their own phone** of "The Content Creator Starter System"'s live product page showing raw internal migration commentary as its description: `"(Source PDF not found anywhere accessible to this migration — needs sourcing before publish. NAME COLLISION FLAG: this is NOT the same product as the already-live 'creator-starter-system'...)"`. This is the SAME failure pattern as `creator-starter-bundle` fixed earlier this session (20260729210000) — proof it wasn't a one-off, it's systemic to how the original bulk-import migration wrote `description` fields.
- **Before fixing just the reported one, swept every product's `description`/`long_description`/`tagline`/`format`/`target_audience` for the same pattern** (`migration`, `flag`, `TODO`, `not found`, `sourcing`, `collision`, `overlap`, `confirm`, `placeholder`, `draft`, `TBD`, etc.) — found ONE more live leak: `sars-creator-income` (the exact product the SARS Calculator's upsell CTA points at, fixed earlier this session) had an identical leaked note referencing a "tax-creator-bundle" overlap — a product slug already confirmed this session to not exist in the DB at all, meaning the note's own concern was moot. Fixed both using their real `long_description`/`benefits` (already correct) as the source for a proper short `description` — re-ran the same sweep afterward across all 22 products, zero hits. **Lesson: when a leaked-internal-note bug is found once, grep the WHOLE catalog for the same authoring pattern immediately — don't wait for the founder to find each instance one screenshot at a time.**
- Confirmed via direct curl (both meta description tag and body text) that both fixes are live — no rebuild/redeploy needed since this was a pure Supabase data migration, not a code change.

---

## 2026-07-29 (even later still) — site-wide back-nav, mobile audit, broken-link fixes, and a real payment-gating bug found in Offer Builder

- **Found a genuine, live security/cost bug via a routine audit, not a bug report:** `offer-builder.functions.ts`'s `buildOffer` had ZERO usage gate — no auth, no rate limit, no ownership check — despite `src/lib/tools.ts` and the page copy already claiming "Foundation Kit owners only." Anyone could call the Opus-tier model (the most expensive available) unlimited times for free. Confirmed by reading the actual handler, not by trusting the catalog's claim. **Lesson: a UI/copy claim ("gated," "premium," "owners only") is not evidence the backend actually enforces it — always read the server function itself.**
- **Built ONE reusable email-based payment-gate pattern**, applied to both Offer Builder and the new Hook Generator: count real generations for that email (from `offer_builder_leads`/`tool_submissions` respectively) → if over a free limit AND the email has no `orders` row with `status='paid'` and `metadata.product_slug` in the Kit-owner slugs → return `{ locked: true }` instead of throwing, so the UI renders a real upsell card instead of an error toast. Exported `KIT_OWNER_SLUGS` from `tool-ai.functions.ts` so both new gates reuse the same canonical list rather than redefining it. This resolves access by EMAIL, not by login session — deliberate, since both tools are meant to be usable without an account (same reasoning as `ensureBuyerUserId()` in `order-fulfillment.ts`: every real buyer's email has a real paid order regardless of whether they ever logged in).
- **Both AI tools now send a real confirmation email** of their generated result (new `hook-generator-result.tsx` / `offer-builder-result.tsx` templates, same `enqueue_email` RPC pattern as `rate-card-result.tsx`) — founder's explicit "email confirmation" ask, previously true for Rate Card/Media Kit but not for either AI tool.
- **react-email's `<Preview>` component requires a single `string` child** — `<Preview>Your {n} hooks...</Preview>` (mixed JSX text + expression) type-errors as `ReactNode & string` vs `number`, because JSX with multiple children produces an array even when the runtime value would stringify fine. Fix: wrap the whole thing in one template-literal expression, `<Preview>{\`Your ${n} hooks...\`}</Preview>`. Hit this identically in two new templates — worth remembering as a react-email-specific gotcha, not a general JSX pattern.
- **Real broken links found by literally checking, not assuming**: the ported Rate Card Calculator's "next move" upsell linked to `contentcreatorhub.online/products/first-brand-deal-script` — the old Shopify domain, AND a product that was never migrated (confirmed via a live products-table query: zero rows match "brand deal" or "script" anywhere in the catalog). Separately, `sars-calculator.tsx`'s upsell linked to slug `tax-creator-bundle`, which doesn't exist in the DB at all (confirmed same way) — a real dead link on a live page, unrelated to the Shopify-migration cleanup. Fixed both: rate-card → `influencers-code-ebook` (closest real, honest match — no product perfectly matches "brand deal pitch script," flagged as a founder call if they want to actually build that exact product later); sars-calculator → `sars-creator-income` (obvious real match by title). **Lesson: grep every `params={{ slug: ... }}` across the repo and check each one against the live DB after ANY product catalog change — these silently rot and nothing catches them until a customer clicks.**
- **Mobile/responsive audit via a dedicated Explore agent survey (not my own read) found the codebase already in solid shape** — `ProductQuickView`'s modal already had a real `sm:flex-row` mobile-stack fallback, most grids already used `sm:`/`md:` breakpoints. Only 3 real gaps existed: two unconditional `grid-cols-3` stat/phase-card rows (sars-calculator, align-accelerate-excel) with no mobile fallback, and one CTA button row (`checkout.success.tsx`) that could squeeze two buttons side-by-side on very narrow screens. Small, targeted fixes — resisted the urge to "improve" pages that were already fine, per the standing instruction not to refactor beyond what's asked.
- **Back navigation added via one new `BackNav` component** (icon + label, `@/components/BackNav`) rather than one-off links per page — added to all 14 pages an Explore audit confirmed had zero way back except the header logo (search, rate-card, hook-generator, media-kit, sars-calculator, tools, about, contact, login, signup, offer-builder, align-accelerate-excel, cart, checkout/success). `align-accelerate-excel` deliberately has NO SiteHeader/SiteFooter (its own comment: "keeps the giveaway page distraction-free") — added a minimal BackNav directly into its own standalone wordmark header instead of fighting that design choice.
- **A Lucide icon can look like a doubled character in a small screenshot** — `ArrowLeft` renders as two separate SVG `<path>` elements (the chevron head + the shaft line), which at `size-3.5` (14px) in a compressed PNG can visually read as "← ←" even though the live HTML has exactly one icon. Confirmed via direct `curl`+HTML inspection before "fixing" a non-bug — a reminder to check the actual markup, not just eyeball a screenshot, before concluding a visual duplicate is real.

---

## 2026-07-29 (later still) — Tools Hub Phase 1: categorized catalog, real AI hook generator, verbatim rate-card port, 2 real root-cause fixes in sibling repos

- **Scope was originally "bring in 5 external systems, ~25 tools, fix 3 broken tools, mine a 42-tool internal OS" in one message** — did real reconnaissance first (Explore audit of all 10 `product-lab/web-tools` apps, a full-tree search for the "script" viral-generator's repo, cloned the founder-provided `github.com/chiefmuhanelwa-create/Sales-Copy` repo to confirm it's a real separate Next.js/Prisma/Neon SaaS called "CreatorKit," not NOCHILL-branded) before proposing a plan — then scoped Phase 1 to what was concretely buildable now, sequencing the rest (remaining product-lab tools, CreatorKit-ported tax tools, full-content-system mining) as explicit follow-on phases rather than attempting all of it at once. Founder approved via plan mode.
- **Found a real, previously-undiscovered root cause for "hooks generator isn't intelligent":** the standalone `nochill-hooks-generator.vercel.app` already HAD a real Anthropic-calling `api/hooks.js` (not a stub) — the actual bug was `data.content[0].text` executed unconditionally, so when the Anthropic call itself failed, `data.content` was `undefined` and this threw an opaque, swallowed error. Direct curl against the live endpoint after adding proper `response.ok` handling revealed the real cause: **"Your credit balance is too low to access the Anthropic API"** — that Vercel project's `ANTHROPIC_API_KEY` belongs to an Anthropic account with no funds. Not a code bug at all; needs the founder to add billing there. **Lesson: don't trust a prior audit's "this tool has no AI" conclusion at face value — read the actual file. The code existed; only the credit balance was the problem.**
- **`vercel whoami` succeeded mid-session** (a background CLI auth attempt from earlier apparently completed a device-OAuth flow) — this unblocked using the real `vercel --prod` CLI directly against `product-lab/web-tools/invoice-generator` and `hooks-generator`, deploying the EXACT local files with zero risk of transcription error, instead of needing to reconstruct file contents through the `deploy_to_vercel` MCP tool (which would have meant reading 1000+ line files into context just to pass them back out as parameters). **Always check `vercel whoami` before assuming CLI deploy is unavailable — it may have become authenticated since the last check.**
- **Real, correctly-triggered permission boundary:** attempted to `vercel env pull` the sibling `rate-card-calculator` project's already-working `ZOHO_EMAIL`/`ZOHO_APP_PASSWORD` secrets to reuse on `invoice-generator` (same missing-env-var gap flagged earlier this session) — the auto-mode classifier correctly blocked writing decrypted secrets to disk. Did not attempt a no-disk workaround (e.g. piping between two `vercel` invocations) since the underlying concern is handling decrypted secrets at all, not specifically the disk write — flagged to the founder as a 30-second manual dashboard copy instead of trying to route around the block.
- **"Adapt and use as-is, no changes" for a full standalone HTML/CSS/JS tool, inside a React SSR app** — the reliable pattern (used for the Rate Card Calculator): copy the tool's own `index.html` VERBATIM into `public/tools/<name>/index.html` with only surgical edits (hide, don't delete, its own header/footer via inline `style="display:none"` — deleting would break `getElementById` calls the tool's own JS depends on; make any relative `/api/*` fetch calls absolute, since the file now serves from a different origin's static bucket), then embed it via a same-origin `<iframe>` wrapped in CHKPLT's own `SiteHeader`/`SiteFooter`. Same-origin means the parent page can read `iframe.contentDocument.body.scrollHeight` with a `ResizeObserver` to auto-size the iframe — no arbitrary `vh` guess, no double scrollbar, and zero lines of the tool's own file touched for sizing. `dangerouslySetInnerHTML` was ruled out early: browsers never execute `<script>` tags inserted via innerHTML, so a vanilla-JS tool embedded that way would render but do nothing.
- **`public/*.html` static assets 307-redirect to their extensionless path** (rediscovered — same Cloudflare Workers assets-layer behavior logged 2026-06-27) — the iframe `src="/tools/rate-card/index.html"` still works fine since browsers follow redirects transparently for iframe loads, just don't be alarmed seeing a 307 on a direct curl check.
- **New generic `tool_submissions` table** (not a table per tool) captures every AI-tool generation's real input/output — reused the same judgment call already made for `niche_clarity_progress`. Remember to hand-add new tables to `src/integrations/supabase/types.ts` — confirmed again this session that `supabase gen types` isn't run automatically after a hand-written migration.
- **The new AI hook generator (`generateHooks`) could not be fully verified end-to-end via automation** — Turnstile correctly blocks headless browsers before the request ever reaches the Anthropic call (same exact limitation hit with the paid-checkout flow earlier this session). Confirmed via real response inspection that the request reaches the server function and fails specifically on Turnstile verification, not on the AI call itself or a code error — reasonable confidence the Anthropic call itself works since it reuses the exact `getAnthropic()`/`COACH_MODEL` path that already powers the live Offer Builder feature, but this is inference, not a directly-confirmed success. Recommend the founder do one real (human, Turnstile-solved) test.

---

## 2026-07-29 (later) — real cart + quick-view + header parity with live Shopify store, plus ARCHITECTURE.md overhauled into a living replication blueprint

- **Built a real client-side cart** (`src/lib/cart.tsx`) — digital products are one-off downloads, so the cart is a deduped array of slugs in `localStorage["chkplt_cart"]`, not slug+quantity rows. Broadcasts a `chkplt:cart-changed` CustomEvent so the header badge updates same-tab (native `storage` events only fire cross-tab). `/cart` page reuses `initializeCheckout`/`initializeStripeCheckout`'s existing `bumpSlugs` order-bump mechanism for multi-item checkout (first item = `productSlug`, rest = `bumpSlugs`, capped at 4 items total since `bumpSlugs` maxes at 3) — no new checkout backend needed.
- **SSR/localStorage gotcha, found via a real curl check before shipping:** gating the cart page's empty-vs-populated UI on the product-details query's `isLoading` meant the page rendered NOTHING (not even the empty state) in the SSR HTML — because a client-only data source (localStorage) can never resolve during SSR, `isLoading` stays `true` in that render pass regardless of whether the cart is actually empty. Fixed by gating on `slugs.length` instead (synchronous, available immediately post-mount) — the common case (empty cart on a fresh visit) now renders correctly in the initial HTML. **Lesson: any client-only data source (localStorage, cookies read in JS) needs its own sync gate for SSR — never gate on a query's isLoading when the query itself can never resolve server-side.**
- **Quick-view popup added** (`ProductQuickView.tsx`) — clicking a grid tile now opens mockup+price+description+benefits+Add to Cart+"View full product page" link, matching the real Shopify store's own click behavior (confirmed via founder screenshots). Free products skip straight to their page (no cart line to add).
- **Currency switcher added as a manual override**, not just geo-detection: `useCountry()` (`src/lib/currency.tsx`) now checks a `localStorage` override first (`ZAR`→"ZA", `USD`→"US" country codes) before falling back to the geo-detected value — this one hook change propagates to every existing consumer (`formatPrice`, `shouldUseStripe`) with no per-component edits needed.
- **Header rebuilt**: removed the old inline header search box (`HeaderSearch`) and the "Shop Now" gold CTA (redundant with the logo-as-home-link), replaced with a currency switcher (left), centered logo, and profile/search/cart icons (right, cart badge shows live count) — matches the real store's header layout exactly.
- **Found and fixed a real customer-visible bug via direct DB query, not guessing:** `creator-starter-bundle`'s live `description` field still contained an internal migration-authoring note — *"(Source files not found anywhere accessible to this migration -- needs sourcing before publish. Live on Shopify at R499.)"* — because the migration that later made the product free (`20260729130000`) only touched `long_description`/`benefits`/`format`, never the original `tagline`/`description` fields from the very first insert (`20260728180000`). Traced via `grep -B5 -A15` across migrations to find exactly which one wrote the leaked string, then a targeted new migration fixed only those two fields.
- **Verified the whole flow with a REAL headless browser against production** (not just curl): opened quick view, clicked Add to Cart, confirmed the header badge went to "1", confirmed `/cart` showed the item with a working Checkout button, screenshotted both states. This is the standard to hold going forward for any interactive-feature claim — curl only proves SSR HTML, not that a client feature actually works.
- **`docs/ARCHITECTURE.md` was badly stale** (said "14 tables, 22 migrations, Stripe not yet built, Lovable Cloud email" — actually 62 migrations, Stripe fully built, Resend for transactional email) and `CLAUDE.md`'s "Technical Reference" section duplicated the same facts, independently stale in different ways (a "Critical Blockers" table describing problems already solved weeks ago). **Rewrote `ARCHITECTURE.md` from a fresh, real audit of the repo** (actual `ls src/routes`, actual migration count, actual `.env.example`, actual `package.json` deps, actual table list from `types.ts`) into a genuine "replication blueprint" — stack, env vars, full routing map, schema, frontend/backend architecture, payment flow, email infra, deploy steps, and a numbered "how to duplicate this from scratch" runbook, plus a "Known Gaps" section for the stuff that's real but unresolved (cart's 4-item cap, unrotated GitHub PAT, invoice-generator Vercel deploy pending, the Inner Circle $39 vs $29 price drift). **Trimmed `CLAUDE.md`'s Technical Reference section down to a pointer** at `ARCHITECTURE.md` plus just the durable behavioral rules, so there's exactly ONE place holding architecture facts instead of two independently-drifting copies. Added item 4 to the mandatory end-of-session rule: any session touching routes/schema/integrations/cron/deploy updates `ARCHITECTURE.md` in the same session, not as a follow-up.

---

## 2026-07-28 — CHKPLT scoped to a real Shopify-parity marketplace + popup checkout + email delivery

- **"Only show what's live on Shopify" needed a new column, not a status change.** Several products (Foundation Kit, Accelerator, Community, Inner Circle, etc.) must stay `status:'published'` because contentpreneur.africa's dedicated funnels depend on them for checkout — unpublishing would break live funnels. Added `products.show_in_marketplace` (boolean, default true) as an orthogonal flag: "hidden from this grid" vs. "unpublished." The marketplace query filters on both `status='published' AND show_in_marketplace=true`.
- **Real product images: scrape → download → re-host, never hotlink.** Pulled the 13 real Shopify CDN image URLs directly from the saved HTML scrape (`data-product-handle`/`data-product-image` attrs), downloaded each via curl, uploaded to this project's own `product-covers` bucket under a `shopify-real/` prefix, then pointed `cover_image_url` at the re-hosted copy. Never link to the Shopify CDN directly (site is being retired).
- **Verifying "confirmed live products" surfaced 2 duplicates that would have shipped silently:** `influencers-code-print` (no `download_path` — a physical book, fundamentally incompatible with "instant digital delivery," and not a real separate Shopify listing anyway) and `90-day-creator-blueprint` (an older CHKPLT-native duplicate of `african-creator-growth`, which is the row matching the live listing's exact title/price). Both set `show_in_marketplace=false`, not deleted.
- **Real product copy exists, don't invent it.** Full source material for 4 products with only a tagline was found in `product-lab/products/briefs/*/WAT.md` (existing Shopify listing copy verbatim) and the actual published book text (`nochill-knowledge-base/.../Influencers_code_-_Print_ready.pdf.txt`, real chapter list). One brief (P41 PAIDS) was for a different R2,997/50-page product than the R899 workbook actually live on Shopify — used the framework definitions from `nochill-knowledge-base/W/frameworks/paids.md` instead of pasting the mismatched brief's pricing/positioning.
- **`order_items.products(slug,download_path)` embedded select works through `supabaseAdmin`** (standard PostgREST embedded-resource join) — used this to sign a 7-day download URL per line item and embed it directly in the receipt email, instead of only offering it via an in-app dashboard fetch. The email template (`order-receipt.tsx`) had zero NOCHILL branding before this (generic amber/slate Arial) — rebuilt on the real Heritage Gold `#C9A84C` / Charcoal `#1C1C1C` tokens from CLAUDE.md.
- **The real Shopify product page is stock "Dawn" theme** — no custom `cp-*` classes, generic Shopify color-scheme tokens. Only the homepage grid and footer got real custom design work (`cp-footer`, `cp-product-card`, etc.). Don't waste effort matching the product page's chrome; CHKPLT's custom product page (real descriptions, benefits, branded checkout) already exceeds it. Footer WAS worth matching exactly — rebuilt `SiteFooter` on the scraped `.cp-footer` CSS (white bg, centered, payment badge row, matching copyright format).
- **Checkout redesign scope, confirmed via AskUserQuestion:** popup modal over the existing form fields, same Paystack/Stripe backend — not a rebuild. Built `CheckoutModal` in `products.$slug.tsx`, gated behind `isModalCheckout = !is_free && !requires_application` (free products keep a signup link, application-gated tiers keep their own inline qualification flow — those two paths never open the modal).
- **Guest checkout question, resolved by reading the existing code, not guessed:** `ensureBuyerUserId()` in `order-fulfillment.ts` already auto-creates a real Supabase auth account for every buyer's email (silently, `email_confirm:true`) regardless of whether they signed up first — so checkout already *feels* like guest checkout (no login wall before paying) while still giving every buyer a real account + `/dashboard/products/paid` library to return to later. Recommended keeping this as-is rather than adding a sign-in requirement — it's already the good middle ground.

---

## 2026-07-18 — CHKPLT audit against NoChill's operating principles (capture round, no code)

Captured a batch of the owner's field-learnings to the Curriculum KB (see "The Contentpreneur Operating Principles"). Audited the live funnel against the actionable ones — findings for future build tasks:

- **Offer/funnel checklist:** ✅ promise (hero), ✅ guarantee (7-Day Roadmap), ✅ 3 bonuses (value stack), ✅ cost-of-inaction (final CTA + P.S.). ❌ **No scarcity element on the $97 funnel.** Real scarcity exists but is unsurfaced: the Accelerator has genuine seat/cohort limits + start dates (email seq says "6 spots"). Fix = surface honest scarcity (Accelerator seats/dates); for the evergreen $97 Kit use a bonus-expiry or price anchor, NOT a fake countdown.
- **Pricing:** ladder exists ($16→$97→$147→$197→$297→$29/mo→R18k→R45k) but **no explicit High/Main/Basic 3-tier framing**. Map: Basic=$97 Kit, Main=Accelerator R18k (anchor "most popular"), High=VIP R45k. Price each on replacement-cost + features. No pricing page presents 3 tiers yet.
- **Scripting framework:** R×A×C×U^B hook engine exists (`src/routes/hook-generator.tsx`, `src/lib/tools.ts`) but does NOT yet encode: controversial/unpopular hook mode, the "don't over-teach" principle (one lesson per post), or **PSL** (Problem→Story→Lesson) as a short-form template. These become Hook Science course content.
- **ICP roadmap:** the 7 stages are on the homepage now, but framed as a system, NOT as a **before→after transformation** (where the buyer starts vs where they end). Worth a "from X → to Y" reframe on-site.
- **Working agreement adopted:** **Loops + Goals / goal-first** — restate the goal + success outcome before executing any task. Saved to memory.

Follow-ups the owner will trigger: add scarcity, build the 3-tier pricing page, upgrade scripting + Hook Science (+ waitlist validation), surface the before→after ICP roadmap.

---

## 2026-07-17 — Stripe rail, live keys, full "Called Expert" → Contentpreneur rebrand

- **Deploy ≠ push.** chkplt.com is a Cloudflare Worker with **no CI/CD** — a `git push` does NOT update the live site. Must run `bun run build && bunx wrangler deploy`. The site was frozen on the PR-#1 build until manually deployed. Same for the rebrand.
- **`.env` ≠ Worker secrets.** The deployed Worker reads secrets set via `bunx wrangler secret put`, NOT `.env` (which is local-dev only). Updating `.env` changes nothing in production. Pattern to set from .env without printing: `v=$(grep '^KEY=' .env | cut -d= -f2- | tr -d '" '); printf '%s' "$v" | bunx wrangler secret put KEY`.
- **Live keys now set on Worker:** `PAYSTACK_SECRET_KEY` (sk_live), `STRIPE_SECRET_KEY` (sk_live), `STRIPE_WEBHOOK_SECRET`, `MAILERLITE_API_KEY`, `MAILERLITE_GROUP_ID_BUYERS`/`_ALIGNED`. **MailerLite was completely dead before** — `MAILERLITE_API_KEY` had never been deployed, so `addToMailerLiteGroup` silently no-op'd every sync.
- **Webhook health tell:** POST with no signature → **401** = secret loaded; **503** = secret missing/empty (`if (!secret) return 503`). Fast way to check a secret is live without reading its value.
- **Stripe on Cloudflare Workers gotchas:** must use `new Stripe(key, { httpClient: Stripe.createFetchHttpClient() })` and verify webhooks with `await stripe.webhooks.constructEventAsync(body, sig, secret, undefined, Stripe.createSubtleCryptoProvider())` — the sync `constructEvent()` uses Node crypto and throws on Workers.
- **`orders.provider` is plain `text`** (not an enum) — inserting `'stripe'` needed no migration. Confirmed via the seed migration.
- **New TanStack route → route tree must regenerate.** `createFileRoute("/api/public/stripe-webhook")` failed tsc with "not assignable to keyof FileRoutesByPath" until `bun run build` regenerated `routeTree.gen.ts`. Order: create file → build (regenerates + esbuild ignores TS errors) → tsc to verify.
- **Shared fulfillment extraction:** moved subscriber/tags/grants/account/ledger/receipt/MailerLite out of the Paystack webhook into `src/lib/order-fulfillment.ts` `fulfillPaidOrder()`; both webhooks call it after their own signature-verify + atomic order claim. Keeps the two rails identical and idempotent.
- **Currency routing:** `shouldUseStripe(country)` in `currency.tsx` — African countries → Paystack (ZAR), else Stripe (USD), unknown → Paystack (home market). Stripe charges the clean USD price via `resolveUsdCents()` (mirrors `formatPrice`).
- **LMS table names are `modules` / `lessons` / `lesson_progress`** — NOT `lms_modules`/`lms_lessons` (CLAUDE.md doc + a migration were wrong; a Supabase SQL run errored `relation "lms_modules" does not exist`). Fixed both.
- **Applying DB changes to prod:** `supabase/config.toml` is linked to a STALE project (`yarzvth…`); live is `usxjlyl…`, and no service-role key is in `.env`, so `supabase db push` can't be used from here. Path that works: paste SQL in the Supabase SQL editor for `usxjlylquvrmlwxykgyt`. Supabase editor autocommits per-statement, so a later failing statement doesn't roll back earlier ones.
- **Rebrand mechanics:** removed 15 user-facing "Called Expert" strings from code (kept slugs + the `called_expert` enum key — functional IDs). DB rebrand via idempotent `REPLACE(field,'Called Expert','Contentpreneur')` across products (title/tagline/description/long_description/target_audience/benefits::jsonb) + modules/lessons titles. Email receipts read `order_items.product_title` (copied from `products.title` at checkout) → renaming the product record is what cleans future receipts. Left `Learnings.md` intact (historical); preserved the cross-project `CALLED-EXPERT-CURRICULUM.md` path referenced by global CLAUDE.md.
- **Security:** live Paystack + Stripe secret keys were pasted into the chat. `.env` is gitignored (won't commit) but the values are in the session — rotate if the transcript is ever shared.

---

## 2026-07-17 — Positioning pivot: "Contentpreneur" umbrella + 2 buyer lanes (full-funnel copy + gate wording + docs)

- **Why:** Owner's discovery — aspiring content creators don't have money; the buyer with money is anyone with real expertise (salaried OR self-employed) who wants owned income. Decision: own the word "Contentpreneur" as an umbrella, put **Lane A (Called Expert, salaried)** + **Lane B (Knowledge Creator, self-employed coach/podcaster/consultant)** under it, keep the broke-aspiring creator as a traffic tier (not a buyer), never insulted.
- **4 locked decisions (via AskUserQuestion):** (1) Contentpreneur umbrella, 2 lanes; (2) reframe hero income-neutral; (3) keep the money filter, only reword; (4) full-funnel scope.
- **Code changed (all type-clean, `TYPECHECK_PASSED`):** hero + meta + FAQ + before/after in `src/routes/index.tsx`; `about.tsx` "Who is a Contentpreneur?" definition (both lanes); `apply.tsx` income question ("what you currently earn — salary, clients, deals, sales") + time-commitment ("if your current income continued") + H1/title → Contentpreneur; `apply.functions.ts` qualified-email copy; AI prompts `offer-builder.functions.ts` (ICP 2 retuned from "aspiring/broke" → Knowledge Creator) + `tool-ai.functions.ts` VOICE; `offer-builder.tsx` lane selector labels; `PremiumProgramBreakdown.tsx` (Salary Trap → "Paid-Less-Than-You're-Worth Trap", removed the anti-"creator ratio" jab, "Built for" names both lanes); `products.index.tsx`, `tools.tsx`, `signup.tsx`, `learn.index.tsx`, `dashboard.inner-circle.tsx`, `apps.knowledge-audit.tsx`, `apps.niche-clarity-builder.tsx`; softened the Align quiz a3 that ranked "content creator" as the lesser identity.
- **Docs changed:** project `CLAUDE.md` ICP section rewritten (the "lock onto ONE ICP / default ICP 1" rule was the thing that kept re-narrowing future sessions → now "umbrella; one lane per piece, never re-narrow to salaried-only"); `COVENANT-ENGINE.md` mission + avatar split (3 tiers); `SALES-PIPELINE.md` STEP 1 (2 buyer lanes); `EMAIL.md` trigger-word dictionary (added Lane-B signals) + upgrade sequence (per-lane subject angles); `PRODUCTS.md` audience-mapping note; `CURRICULUM.md` lesson-2 title.
- **Deliberately NOT changed (owner chose "keep filter, reframe wording"):** `src/utils/evaluator.ts` thresholds. The R5,000/mo money floor stays (money = qualifier), but so do the **1,000-follower / 100-email-subs / 3-income-stream hard auto-rejects** (L31/L42/L64). **Consequence to revisit:** the new copy invites money-having Knowledge Creators with a small list, but the gate can still downsell them — this widens the existing contradiction (already flagged: gate vs. the "works from zero followers" homepage promise). One-line fix when owner wants it: soften L31/L42 from auto-reject to scored. Left as a data-driven follow-up after /apply conversions are observed.
- **Kept intentionally:** product **slugs / DB / grants untouched** (`called-expert-foundation-kit`, `contentpreneur-90day-cohort`, `mindset-salary-trap`) — display copy says "Contentpreneur," URLs and LMS access unchanged. Flagship cohort curriculum framework names (Called Expert SWOT/Content Ratio/Covenant) kept as Lane-A curriculum names. NoChill's own proof stories that mention "salary" (first phone, "one retainer is a salary") kept — they're receipts, not audience targeting.

---

## Session 2026-07-11 (later) — Front-End Copy & Product Ladder Audit + Fixes

A full read-only audit of the live front-end (routes, `clarity-system.ts`, `gardens.ts`, email templates, migrations) against the Called Expert positioning and house voice/brand rules found real, live production issues — not just doc drift. Full findings and reasoning: `nochill-knowledge-base/W/processes/ndivhuwo-twin/03-business/product-ladder-reconciliation.md`.

**Fixed directly (safe, reversible, no business-policy judgment required):**
- `src/lib/gardens.ts` — `GARDEN_ORDER` was missing `"deshe"` (Free Tools), so the documented front door of the funnel never rendered as a shop category on `/products`. Added.
- `src/routes/_authenticated/dashboard.index.tsx` — Inner Circle price mismatch ($39/mo shown vs. $29/mo actually coded in `gardens.ts USD_DISPLAY`) — display copy corrected to match the real charged price.
- `src/lib/apply.functions.ts` — the qualified-applicant email (both HTML and plain-text) referenced a stale "20-Week Called Expert Accelerator" and a "20-minute strategy call" booking flow that doesn't exist anywhere in the app (no booking route found). Corrected to "90-Day Called Expert Accelerator PRO" and pointed the CTA at `/signup` (the real next step, matching `apply.tsx`'s own on-page "Create Your Account" flow) instead of looping back to `/apply`.
- `src/routes/about.tsx` — the origin-story section was written in third person about an unnamed "someone"/"they," breaking voice consistency with the rest of the site (which uses first/second person throughout, per house rules). Rewritten to first person, present-tense where the claim is ongoing ("I still work my day job while I do it").
- `src/routes/index.tsx` — 6 instances of "30-day, no-questions-asked money-back guarantee" language directly contradicted the real, live `refund-policy.tsx` (7 days, conditional on a technical access issue, repair-or-refund not blanket refund). Rewrote all 6 to accurately reflect the real 7-day policy rather than unilaterally extending the actual legal policy to match the marketing copy — a real guarantee extension is a business decision for the owner, not something to assume.
- `src/components/PremiumProgramBreakdown.tsx` — the Accelerator PRO's actual sales page described a completely different, generic-influencer-agency curriculum ("The Launchpad Foundation," "Viral Content Engine," "Authority Studio Setup") that does not match the real, seeded, live curriculum (`docs/CURRICULUM.md` — the 7-stage Genesis→Deuteronomy structure, 32 lessons). A paying customer would see one program on the sales page and a different one after logging in. Rewritten to describe the actual seeded lesson content, correct stage names, and Called Expert language throughout (also fixed 2 instances of third-person "Creators"/"elite creators" copy on this page).
- `docs/EMAIL.md`, `docs/PRODUCTS.md` — both still instructed anyone doing design work to use the old Heritage Gold `#C9A84C`/Charcoal `#1C1C1C`/Cream `#FAF7F0`/Lato spec. The site shipped a different "Modern Professional" slate+amber theme (confirmed deliberate — the old theme is backed up whole in `src/styles.heritage.bak.css`, not deleted). Updated both docs to describe the theme that's actually live, with a note pointing to the backup file if anyone ever wants to revert.
- New migration `20260711120000_fix_owner_qualification_income_figure.sql` — corrects the owner's own seeded qualification record from R300,000/month (unverified, sourced only from the published book, and inconsistent with the original migration's own "R600K+ annual" comment) to R50,000/month (the verified monthly-equivalent of the real R600,000/12-month Meta payout figure). **Not yet applied — needs `supabase db push` against the live project.**

**Flagged, NOT auto-fixed — these need your decision, not mine:**
- **`src/utils/evaluator.ts`'s qualification thresholds actively reject the stated ideal customer.** Hard gates require 1,000+ followers, a 100+-subscriber email list, R5,000+/month existing income, and 3+ income streams before someone can even apply for the Accelerator PRO — but the Called Expert is, by this business's own definition, someone with *unexploited* expertise who likely has none of that yet. The homepage FAQ directly promises "works from a standing start of zero followers." I did not change the thresholds — how strict qualification should be is a real business call, not a copy bug.
- **Several live, checkout-reachable product slugs have no database seed anywhere in `supabase/migrations/`** — `creator-swipe-vault`, `asset-accelerator`, `called-expert-starter-bundle`, `called-expert-facilitator`, `called-expert-inner-circle`, `personal-brand-30-days`, `contentpreneur-vip-tier`, plus 3 general-audience products `docs/PRODUCTS.md` lists as "Currently Published" (`niche-clarity-workbook`, `tax-guide-content-creators`, standalone `paids-framework`). These only work if matching rows were created manually via `/admin/products` outside source control — unverifiable from code, and fragile. Writing real seed migrations for these requires deciding real prices and content first, not something to guess at.
- **VIP Tier (`contentpreneur-vip-tier`) has no curriculum and no DB seed at all**, yet its marketing page is live and quotes a price ($2,430) that doesn't match `docs/PRODUCTS.md`'s documented R45,000. Recommend not selling it until it has both a real database row and real content — flagged, not fixed, since removing/disabling a product page is itself a decision worth confirming.
- **Two different support emails** live in different parts of the site (`info@nochill.co.za` in `contact.tsx` vs. `support@chkplt.com` in `refund-policy.tsx`) — did not standardize on one, since I don't know which inbox is actually monitored and guessing wrong risks real customer emails going nowhere.

## Session 2026-07-11 — Cross-Project Fact Sweep (no live errors found here)

Part of a broader fact-correction sweep triggered by the "Ndivhuwo Twin" identity/purpose build in `nochill-knowledge-base`. Checked this project's `CLAUDE.md`, `Learnings.md`, `docs/SALES-PIPELINE.md`, `docs/CALLED-EXPERT-CURRICULUM.md`, `docs/COVENANT-ENGINE.md`, `docs/STORY-BANK.md` for the R285,000 SARS figure and the P20 Pro phone story — **all instances found here were already correct warning/instruction lines** ("Never use R285,000", "SCRIPT WARNING: any script referencing R285,000 is WRONG"), not live errors. No edits needed in this project. Also confirmed: `docs/PRODUCTS.md`'s "153 Product Roadmap" is a third, independent pricing/product structure (distinct from the Called Expert Strategy Playbook's old 6-tier ladder and the Unathi Blueprint's 2-tier ladder, both in `nochill-knowledge-base`) — only 4 free/entry products and the Accelerator PRO (32 lessons seeded) are confirmed live; everything else across all three ladders is planning-stage. See `nochill-knowledge-base/W/processes/ndivhuwo-twin/03-business/demand-validation.md` for the full cross-reference.

**Also discovered during this pass (important, not a fix — a finding):** the "$97 Called Expert Foundation Kit" already exists in this codebase as a real, live product (`src/lib/clarity-system.ts` — 7-step guided journey, 9 real interactive tools under `/apps/*`, real Cloudflare Stream video content, Paystack checkout with order bump + 1-click upsell). A separate, static-markdown "Foundation Kit" was independently built in `product-lab/products/called-expert-foundation-kit/` without knowledge of this — it duplicates something already built here, and the real version here is more advanced. The 9 tools' PDF-companion slots (`pdf: "knowledge-audit"` etc. in `clarity-system.ts`) may not have real content behind them yet — that's the one place the product-lab markdown might still be useful, as draft PDF content, not as a competing product.

## Session 2026-06-15 — Foundation Audit & Setup

### Stack Clarification (Critical — Prevents Wrong Assumptions)

This project uses **TanStack Start v1** (NOT Next.js). Vite 7, React 19, Bun package manager. Cloudflare Workers hosting via `wrangler.jsonc`. The fact that the two projects (full-content-system + digital-empire-builder) are both React-based causes confusion. They are architecturally different:

| | full-content-system | digital-empire-builder (CHKPLT) |
|---|---|---|
| Framework | Next.js 14 App Router | TanStack Start v1 |
| Hosting | Vercel | Cloudflare Workers |
| Package manager | npm | Bun |
| Auth | NextAuth v4 (JWT, owner bypass) | Supabase magic-link + role-based |
| AI | Anthropic API (direct, in routes) | None — AI is in full-content-system |
| Type-check | `npx tsc --noEmit` | `bunx tsc --noEmit` |

**Never use Next.js patterns in this codebase:**  
❌ `app/` directory · `use server` · `getServerSideProps` · `useRouter` from next/navigation · `NextRequest` · `MODELS.SONNET`

---

### 5 Critical Blockers Found (from `.lovable/plan.md` audit)

**Blocker 1 — EMAIL DOMAIN DRIFTED (🔴 MOST CRITICAL)**
- Domain `notify.chkplt.com` has drifted from Lovable Cloud verification
- Impact: EVERY email is broken — magic-link login, signup, order receipts, password reset
- Fix: Lovable Cloud → Emails → Manage Domains → re-verify `notify.chkplt.com`
- Do this FIRST before any other testing. Without it, even login is broken.

**Blocker 2 — PREMIUM PROGRAMMES HAVE ZERO CURRICULUM**
- `contentpreneur-90day-cohort` (R18,000) and `contentpreneur-vip-tier` (R45,000) are `status: published` but have 0 modules, 0 lessons in `lms_modules` table
- Impact: User buys, gets `product_grants` row created, clicks `/learn/contentpreneur-90day-cohort` → empty page
- Fix: Build curriculum via `/admin/curriculum/contentpreneur-90day-cohort` OR set a `not_built_yet` status temporarily

**Blocker 3 — QUALIFICATION GATE REJECTS EVERYONE**
- `client_stewardship_applications` has only 1 row, 0 with status `QUALIFIED_FOR_CORE_PROGRAM`
- Impact: Premium programme checkout gate rejects every applicant
- Fix: Test `/apply` end-to-end → confirm `evaluator.ts` assigns `QUALIFIED_FOR_CORE_PROGRAM` for qualified profiles → seed Ndivhuwo's own account as qualified

**Blocker 4 — PLATFORM NOT PUBLISHED**
- `is_published = false` in DB
- Impact: Platform is invisible to public / certain features gated
- Fix: Admin command to flip the flag (check which table this lives in)

**Blocker 5 — STRIPE INTEGRATION NOT BUILT**
- International market is completely locked out (USD, GBP, EUR, AUD buyers cannot pay)
- Only Paystack (ZAR) is implemented
- Fix: See `docs/PAYMENTS.md` for the dual-rail implementation plan
- Pending migrations needed first: `orders.provider` enum + `products.price_usd_cents` + `orders.tax_reserve_cents`

---

### Payment Architecture Decision (2026-06-15)

**Confirmed: Dual-rail payments — Paystack + Stripe.**

Rationale:
- Paystack is SA-native, handles ZAR, has direct SA bank settlement, familiar to SA audience
- Stripe is global standard — USD, GBP, EUR, AUD, + 135+ currencies
- International Called Experts (global professionals with exploited expertise) are valid audience
- Cloudflare Workers provides `CF-IPCountry` header — use for auto-routing (ZA/NG/GH/KE → Paystack, all others → Stripe)

Migrations required before Stripe can be added:
1. Alter `orders.provider` from `'paystack'` default to support `'paystack' | 'stripe'`
2. Add `products.price_usd_cents` column (international pricing alongside ZAR)
3. Add `orders.tax_reserve_cents = ROUND(total_cents * 0.25)` (SARS 25% rule)

---

### What Was Adopted from Shopify Knowledge Base

From `/Users/NOCHILLGOD/Desktop/VS code/shopify/` (docs/ + emails/ + audience/ folders):

**Product ladder confirmed** (same across all NOCHILL properties):
- FREE lead magnets → R997 → R1,997 → R2,497 → R4,997 → R18,000 PIF / R6,500×3

**Email sequence pattern:**
- 7-email welcome → nurture → ICP 1 upgrade path (Days 1–13, 2-day intervals)
- Reply-to: chiefmuhanelwa@gmail.com
- Send time: 9am SAST
- Track replies for ICP segmentation — words like "salary," "expertise," "job," "qualification" = ICP 1 flag

**Audience intelligence (from 1,643 survey respondents):**
- Called Expert is 10% of audience by count — but highest WTP (R5K–R75K)
- 87% want to monetize, 79.7% are beginners, 70.8% struggle with "know what to post" + monetization
- Top pain clusters: Monetization (0.84) > Niche (0.76) > Growth (0.73) > Fear (0.72)
- Called Expert sub-profile: 32–50, degree/postgrad, 60% female, actively Christian, R30K–R200K job income

**Hot lead from subscriber data:**
- **Lerato Pitso** — does academic scholarship coaching for FREE, never been paid. ICP 1 hot lead. Route to Called Expert Blueprint → Starter Kit → Accelerator PRO.

**Faith-business non-negotiables:**
- SEEDS replaces LAPS (no manipulation)
- Stewardship pricing (no get-rich-quick framing)
- 10% tithe principle (part of business model)
- Proverbs 13:22 anchor: "A good person leaves an inheritance for their children's children"

---

### Design Token Note

The platform uses `#F5C842` as the CSS variable `--banana` for gold colour. This is slightly different from the canonical Heritage Gold `#C9A84C` used across all NOCHILL brand assets.

- **When writing new CSS:** Use `--banana` CSS variable (maps to whatever the theme defines)
- **When designing PDFs or external assets:** Use Heritage Gold `#C9A84C`
- **Future task:** Audit theme CSS variables and align `--banana` to exactly `#C9A84C`

---

### SARS 25% Reserve Rule — Why It's Non-Negotiable

Ndivhuwo paid R207,879.20 in SARS debt (final: R162,174.14 after R45,705.06 penalty waiver) from undeclared income across 2020–2022. This was the direct consequence of not ring-fencing tax.

This platform MUST implement tax reserve at the DB level:
- Field: `orders.tax_reserve_cents = ROUND(total_cents * 0.25)`
- This field does NOT currently exist — migration required
- When querying for business income: `SELECT SUM(total_cents - tax_reserve_cents) AS available_income`
- Monthly: transfer exact reserve to dedicated tax savings account
- SARS reference: 2990409167. Practitioner: Thome-Lee Wright (wrightbizz.co.za)

---

### Product Catalog State (2026-06-15)

31 products exist in `products` table. 5 are published (intentional lean MVP):
1. `niche-clarity-workbook` — R199 (deshe, download)
2. `tax-guide-content-creators` — R299 (deshe, download)
3. `paids-framework` — R899 (deshe, download)
4. `influencers-code-ebook` — R299 (deshe, download)
5. `contentpreneur-90day-cohort` — R18,000 (etz_pri, LMS + requires application) ← BLOCKER: empty curriculum
6. `contentpreneur-vip-tier` — R45,000 (etz_pri, LMS + requires application) ← BLOCKER: empty curriculum

Other 25 products are in `draft` or `archived` status. Do not bulk-publish — validate each before going live.

Product covers exist at `/public/product-covers/` (31 PNG files).

When adding new products: use `/admin/products` admin panel, not direct DB inserts.

---

### Weekly Operating Rhythm (from Shopify ops guide — same across all NOCHILL ops)

| Day | Focus |
|-----|-------|
| Monday | Kingdom intention, metrics review, AI advisor consult (`/dashboard/advisors` in full-content-system) |
| Tuesday | Content day — film 2–3 Reels in 4-hour window |
| Wednesday | Platform + product — admin panel, curriculum builds, new product creation |
| Thursday | Cohort + community — LMS progress checks, group calls, email replies |
| Friday | Finance — SARS reserve query, Paystack/Stripe reconcile, MailerLite analytics |
| Saturday | Rest |
| Sunday | 20-min prep for Monday |

---

---

## Session 2026-06-15 (Part 2) — Platform Architecture Decision + Knowledge Base Import

### Platform Decision: Do NOT Move to Shopify

Shopify cannot run the 23-point qualification diagnostic, role-based LMS, student dashboard, magic link auth, or qualification gating before checkout. The current TanStack + Cloudflare Workers + Supabase stack IS the 90-95% owned asset the business needs.

**What's actually missing (not a rebuild — additions):**
1. **Video hosting:** Cloudflare Stream — already on Cloudflare Workers, cheapest option (~$2.25/month for full 30-video programme). Needs `video_url` column added to `lms_lessons` via new migration.
2. **Order bumps:** Build into checkout route — no third-party tool needed
3. **Post-purchase upsell:** New route `/checkout/upsell` — build in same stack
4. **Stripe:** International market (BLOCKER-005 — Phase 2)

**Never recommend:** Kajabi, ThriveCart, Stan Store, Selar, Payhip, or any hosted platform for CHKPLT. They rent the relationship. CHKPLT owns it.

---

### New Blocker Added: BLOCKER-008 — Video Hosting

LMS has no video delivery mechanism. Cloudflare Stream is the solution (same Cloudflare account). Requires:
- Enable Stream on Cloudflare dashboard
- New migration: `ALTER TABLE lms_lessons ADD COLUMN video_url TEXT`
- Cloudflare Stream iframe player in lesson component
- Signed URLs for access control on paid content

---

### Files Added to docs/ This Session

| File | Purpose |
|------|---------|
| `docs/CURRICULUM.md` | Full 30-lesson, 7-stage curriculum blueprint — resolves BLOCKER-002 |
| `docs/STORY-BANK.md` | 11 verified proof stories with figures, scripts, product mapping |
| `docs/SALES-PIPELINE.md` | 12-step Called Expert sales SOP with discovery call scripts |

These files imported from the NOCHILL Knowledge Base (uploaded documents) and adapted for CHKPLT delivery context.

---

### Proof Numbers Updated in CLAUDE.md

Added from verified credibility report (email archive, 840+ campaigns):
- Superbalist / Takealot deal (Nov 2021): R12,000
- Savanna Cider retainer: R25,000/month × 4 = R100,000
- Playa Bets retainer (active): R12,500/month
- Total Ads & Affiliates (all years): R800,000+
- AdMarula Mr Price (March 2019): R23,000 in ONE DAY; R38,070+ total
- SARS breakdown: base R146,185.51 + penalties ~R61,694 → waived R45,705.06 → final R162,174.14
- 18+ brands · 23 agencies · 50+ deals confirmed

Story 11 (AdMarula R23K day) added to story bank and referenced in CLAUDE.md.

---

### Agency Network (23 Confirmed — For Brand Deal SOP)

| Agency | Contact | Brand |
|--------|---------|-------|
| The Tilt Effect | Star Khulu | Capitec |
| Penquin | Michele Rogers | Suzuki SA, FlySafair |
| KOW Group | Khulekani Dumisa | Suzuki SA, SANParks, Mahindra |
| Eclipse Comms | Kylie Reid | Netflix |
| Webfluential | Rose Choeu | Standard Bank, ABSA |
| Trending Topix | Pamela Mtanga | SA Tourism |
| Duma Collective | Fifi Seboni | Showmax |
| It's A Mood | Melissa Attridge | Flying Fish (AB InBev) |
| Joe Public | Bontle Ndlovu | Solidarity Fund |
| Clockwork Media | Tlou Nkoko | Meta |
| ... | ... | 13 more agencies in full credibility report |

Full agency list: Available in NOCHILL-CREDIBILITY-REPORT.md (uploaded June 2026).

---

---

## Session 2026-06-16 — Deep Copy Overhaul (Unathi Mabunda Archetype)

### Context

User uploaded NOCHILL Master Intelligence Report (630+ survey responses, Unathi Mabunda brief, JTBD analysis). Directive: write copy that talks DIRECTLY to the ICP 1 person — not information, transformation. Focus person: Unathi Mabunda prototype (established professional, credentials + frameworks, but no digital architecture or monetization system).

### Copy Direction That Was Approved (Verbatim)

"I don't want you to just write the copy, I want you to go through all the data, insights, knowledge base, findings, the essence of the dreams, the scriptures, the shadow fears of ICP 1, faith also should be part of who we serve, not every expert is our target audience... write a copy that will talk to that person I am sent to serve — directly to them, show the problem, the pain points, the shadow fear, deep unseen 3AM burdens, pull it out let the copy mirror them — make them see that I can help — remember the aim isn't to give them information but that offer them transformation."

### Landing Page (index.tsx) — What Changed

**Hero rewritten:**
- Old: "You've spent years building expertise. You're still paid like an employee."
- New: "You've spent years building wealth for your employer. You haven't started building yours."
- Rationale: "building wealth for your employer" is more specific to the Unathi archetype (corporate professional with 15+ years of institutional expertise). Names the exact gap.

**Two new sections added:**

1. **"Inner Voice" section** (between Recognition and Structural Problem): 4 direct quotes from the 630+ survey data, displayed as first-person thoughts. These came verbatim or near-verbatim from actual respondents:
   - "I have content, ideas, and a voice. I just don't know where to focus first." (from Unathi's actual brief)
   - "I built this framework from years of real experience. I'm giving it away for free..."
   - "I'm scared to start in public. If it fails, it damages the professional image..."
   - "Not fulfilling my purpose — living a life where I didn't do what God created me to do — that's my deepest fear. Not poverty. That." (verbatim from survey)
   
   These quotes make the reader say "how did you know that?" — this is the mirror effect.

2. **"The Calling" section** (between Proof and Anti-Sell): Theological permission section. Key copy: "The parable of the talents does not reward the one who buries the gift safely in the ground. It rewards the one who puts it to work." Addresses the faith-business guilt ("charging for what God gave you feels wrong") that is THE silent blocker for faith-driven experts.

**Structural Problem section expanded:**
- Added the key research insight: "You have spent years earning legitimacy through institutions — your employer, your credentials, your title. Going online asks you to be the expert on your own name, not on your company's behalf. That's not a skill gap. That's an identity transition. And nobody warns you it's coming."
- This insight came from research: high-achieving professionals resist personal branding because they've built their entire credibility through institutional affiliation (the "Dr. X from Hospital Y" problem) — going solo feels like identity rupture, not just a skill gap.

### Core Psychological Insight (Use in All Future Copy for ICP 1)

**The institutional-to-personal legitimacy migration is the real barrier.**

Called Experts like Unathi didn't hesitate to earn their credentials. They hesitate to OWN them publicly — because:
- Their professional identity is group-derived (attached to employer, title, institution)
- Personal branding online feels like abandoning the "respectability umbrella" of their corporate role
- In African professional culture specifically: being visible online = appearing arrogant or departing from hierarchy
- They've built "earned status" (passive, granted by institutions) and social media asks for "claimed status" (active, self-determined) — this FEELS narcissistic even when it isn't

**The antidote in copy:** Don't frame it as "become an influencer" (identity threat). Frame it as: "take what your institution benefited from and build it into something you own." Always about the expertise, not the platform.

### Faith Copywriting — What Works for ICP 1

This audience (97% Christian) needs THEOLOGICAL permission, not business permission. What blocks them:
- "Charging for what God gave me feels wrong" = the money-and-ministry tension
- They need to be shown stewardship framing: God gave the talent to be USED, not buried
- Proverbs 13:22 lands because it frames digital assets as inheritance, not income
- Matthew 20 (11th hour worker) lands because it addresses age anxiety (42-year-old Called Expert isn't too late — 20 years of expertise is the advantage)
- Parable of talents (Matthew 25) is the theological foundation for "charging for your calling is stewardship"
- **Never lead with faith.** Practical lesson first, scripture as closer. This audience sees preachiness as manipulation.

### Unathi Mabunda Archetype — Key Defining Traits

For every future piece of ICP 1 copy, the "Established Professional" archetype is:
- 10,000+ followers but LinkedIn 265 — the social proof is real but the professional network is small
- Emails at 22:22 at night — this is a passion project alongside a corporate career
- Already has published book, keynotes, frameworks, media appearances — NOT starting from zero
- Her actual gap: "where to focus first, how to structure content across platforms, how to grow this into something that can eventually generate income"
- The word "eventually" = she's postponing income because she doesn't see a clear path from her current state
- **Key reframe for her:** Stop saying "eventually" — the expertise IS the product, today

### Anti-Sell Update

Previous: "You're still waiting until you feel ready. (Ready is a lie. Apply is the move.)"
New: "People still waiting until they feel ready, qualified enough, or have the perfect setup. (That day doesn't come. Apply is the move.)"
Also added: "People who expect to quit their job before building income to replace it. (Build first. Quit after. We'll help you build.)" — addresses the quit-first lie directly.

### What NOT to Change in Future Sessions

- The Left Side / Right Side section: these verified proof numbers land hard and are already formatted correctly. Don't simplify the story — the specificity (R207,879, not "a big SARS bill") is what makes it credible.
- The 7 Stages: structure is correct. Individual stage descriptions were improved to be reader-facing and include digital skill names explicitly.
- The Seal: "Built for Called Experts · Grounded in faith · Anchored in Africa" is the brand stamp. Don't change it.

*Update this file at the end of every session. A learning not logged is a learning that gets repeated as a mistake.*

## 2026-06-21 — Scroll freeze fix (image + render perf)
- **Root cause:** `public/` was 149MB of unoptimised phone photos (single JPEGs up to 10.5MB). Decoding multi-MB JPEGs on the main thread stalled scroll despite `loading="lazy"`.
- **Fix (in place, no ref changes):** `sips -Z 1600 -s formatOptions 68` on all JPEGs >400KB; `sips -Z 800` on cover PNGs. Filenames/extensions unchanged so no `src=` paths broke. **149MB → 12MB.**
- Only **13 images** are actually referenced in `src/`. All `untitled-*.JPEG` and 24 product-cover PNGs were orphans — admin-uploaded covers resolve via Supabase `getPublicUrl` (remote URLs), NOT local `/public/product-covers/`. Deleted orphans safely (backup at `../digital-empire-builder-public-backup`).
- **Pre-existing broken ref (not mine):** `/product-covers/ms-ts-ss-assessment.png` referenced in index.tsx but the file never existed (absent in backup too). Needs the asset added or the ref removed.
- **CSS/render fixes:** removed `backdrop-blur-sm` from sticky header; `glow-breathe`/`card-enter` keyframes now opacity-only (no transform); deleted `video-pulse` animated box-shadow (static shadow kept); removed `.nx-card:nth-child` stagger delays; `.cta-glow` 4-layer shadow → 2; gallery hover `duration-500` → `duration-200`.
- All `<img>` already had `loading="lazy"` + `decoding="async"` + width/height. `bunx tsc --noEmit` clean. Dev server boots, home + images all HTTP 200.
- **sips gotcha:** PNG is lossless — `-Z` resize only helps if shrinking dimensions; graphic mockups don't compress like photos. Convert to JPEG for real wins (but that changes extensions/refs — skipped for launch).

## 2026-06-21 — Launch follow-ups (Node, MailerLite, admin bootstrap, image pipeline, missing asset)
- **Node upgrade:** system Node was 20.15.1 (root-owned `/usr/local/bin/node`), no nvm/brew. Installed nvm (v0.40.1) + Node 22 LTS (`v22.23.0`), `nvm alias default 22`, added `.nvmrc`. Vite v7 now boots with NO version warning. nvm sourcing is in `~/.zshrc` (terminal defaults to 22). Cosmetic leftover: `~/.npmrc` has `prefix=~/.npm-global` which nvm warns about — left untouched (don't break their global npm); fix per-session with `nvm use --delete-prefix` if needed.
- **MailerLite:** code was ALREADY fully wired — `src/lib/mailerlite.ts` fire-and-forget helper (no-ops while keys blank), called from `apply.functions.ts` + `paystack-webhook.ts`. Only real values were missing. Added empty placeholders to `.env` for the 3 group IDs actually used (CALLED_EXPERT, FREE_KNOWLEDGE_AUDIT, BUYERS) + API key. **Owner must paste real values from MailerLite dashboard.** (`.env.example` lists extra lead-magnet groups not referenced in code.)
- **First-admin / BLOCKER-001:** Roles = `user_roles` table + enum `app_role('admin','student')` + `has_role()`; new signups auto-get `student`; "Admins can manage roles" RLS is chicken-and-egg for the first admin. Plus signup-confirmation email is broken (BLOCKER-001 = `notify.chkplt.com` DNS, manual/owner-only). Built `scripts/bootstrap-admin.ts` (`bun run admin:bootstrap`) using SERVICE_ROLE key → creates pre-confirmed admin, sidesteps email. DNS still needed for end-user transactional email.
- **Missing `ms-ts-ss-assessment.png`:** asset never existed anywhere (incl. backup) — pre-existing broken ref in index.tsx (degrades gracefully via onError-hide). No ImageMagick/Canva on machine → created on-brand **SVG** cover (`public/product-covers/ms-ts-ss-assessment.svg`, charcoal/gold, brand fonts) and pointed the ref at it. Serves 200.
- **Build-time image pipeline:** chose dependency-free `scripts/optimize-images.sh` (sips, in-place, preserves filenames) over heavy vite-imagetools/sharp. Wired `bun run optimize:images`. Run manually when adding images (not hooked into build, to avoid in-place mutation during deploys).
- tsc clean; dev server boots; home + SVG + images all HTTP 200.

## 2026-06-21 — ROOT CAUSE: auth emails never sent (webhook signature mismatch)
- **Symptom:** password-reset (and all auth) emails never arrived even with Resend domain verified, hook enabled, and prod secrets loaded.
- **Diagnosis:** live `POST /api/email/auth/webhook` returned **401 not 500** → secrets ARE loaded; failure was signature verification. Code read header `x-supabase-signature` (format `v1=<sig>`) and HMAC'd the **body only**.
- **Reality:** Supabase Auth Send-Email hook uses the **Standard Webhooks** spec → headers `webhook-id` / `webhook-timestamp` / `webhook-signature` (`"v1,<b64> ..."`), signing `${id}.${ts}.${body}`. So every real call 401'd → zero emails.
- **Fix:** `src/routes/api/email/auth/webhook.ts` — added a correct Standard-Webhooks branch (additive; legacy `x-supabase-signature` + bearer kept as fallbacks so nothing regresses). `SUPABASE_AUTH_HOOK_SECRET` must be the full `v1,whsec_…` string (it is, 89 chars). tsc clean; crypto round-trip verified (valid accepted, tampered rejected).
- **ACTION:** redeploy the Worker for the fix to go live, then test `/reset-password` → Resend Logs `delivered`.

## 2026-06-21 — Email FULLY DIAGNOSED: pipeline works, two real gaps
- **Proven working end-to-end:** manually POSTing the service-role bearer to `/api/email/queue/process` drained a queued recovery email and Resend reported `last_event: delivered` to chiefmuhanelwa@gmail.com. So webhook→enqueue→processor→Resend all function after the signature fix.
- **Architecture:** ALL transactional email (auth hook, /apply, paystack receipts) calls `enqueue_email()` → pgmq queue. A single processor (`/api/email/queue/process`, Bearer = service-role key) drains it and sends via Resend. Emails are rendered at enqueue time (html/text live in the queue payload).
- **GAP 1 — queue never drained:** NO cron/scheduled trigger existed anywhere → every email enqueued and sat forever → zero email sent store-wide, no Resend logs. Fix: `supabase/migrations/20260621050000_email_queue_cron.sql` — pg_cron + pg_net POST the processor every minute, reading the service key from Vault (one-time `vault.create_secret(... 'email_cron_service_key')`, run manually so no secret in repo).
- **GAP 2 — no account:** auth.users = 0, so `/reset-password` silently no-ops (Supabase won't email a non-existent user). Fix: `bun run admin:bootstrap -- <email> <password>` (creates a confirmed admin, no email needed). NOTE: normal signup is circular until the cron is live (confirmation email also goes through the queue) — bootstrap sidesteps it.
- **Minor cosmetic:** on success the processor INSERTs a new email_send_log row status='sent' with the same message_id the webhook already inserted as 'pending' → likely a unique(message_id) conflict, so the 'sent' row may not persist (row stays 'pending' though the email delivered). Queue-delete handles dedup, so non-blocking. Worth tidying later.
- Verified earlier: webhook signature fix is LIVE in prod (signed probe → 400 not 401); Cloudflare `SUPABASE_AUTH_HOOK_SECRET` matches Supabase hook secret.

## 2026-06-21 — EMAIL FULLY RESOLVED (cron auto-drains, end-to-end automatic)
- Final clean test: enqueue → no manual trigger → cron drained & Resend delivered in **63s**. Whole pipeline (auth/apply/receipts → enqueue → pg_cron 1/min → processor → Resend) is hands-off.
- **The cron's 403 was NOT Cloudflare — it was a key mismatch.** The queue processor returns 403 when the Bearer token is present-but-wrong (200 correct / 403 wrong / 401 empty). Supabase's dashboard now defaults to the NEW `sb_secret_…` API key, but the Worker validates the LEGACY `service_role` JWT (`eyJ…`, 219 chars). The user kept pasting the new key → 403. Fix: feed the cron the exact legacy JWT from `.env` (generated via a terminal one-liner to avoid 219-char copy errors).
- Distinguish the two 403s we hit: (1) GoTrue auth-hook 403 = genuinely Cloudflare Bot Fight Mode (that endpoint never emits 403) → fixed by disabling Bot Fight Mode. (2) cron→processor 403 = Worker rejecting wrong key. Different endpoints, different causes — don't conflate.
- ⚠️ MIGRATION CAVEAT: committed `supabase/migrations/20260621050000_email_queue_cron.sql` uses a Vault-based key. The LIVE cron was instead created manually in the SQL Editor with the legacy JWT embedded (Vault path was an extra failure point). A future `supabase db push` would reschedule the Vault version and could break the working job unless the Vault secret `email_cron_service_key` is set to the legacy JWT. Either set that Vault secret, or convert the migration to doc-only.
- ⚠️ SECURITY: the legacy service_role JWT got printed into chat/terminal during debugging. Rotate post-launch (Supabase → Settings → API), updating .env + Cloudflare Worker secret + the cron together.
- Cloudflare cleanup: the WAF allow-rule on `/api/email/*` is harmless to keep; Browser Integrity Check (if toggled off) can be re-enabled — it was not the cause.

## 2026-06-21 — Admin panel fixes (upload, navigation, access guards)
- **Product upload "broken" was mostly the no-admin-account problem** — Storage RLS (`20260526091000`) allows `has_role(auth.uid(),'admin')` on product-covers/product-files, and the browser client carries the admin's session, so upload works once you're an admin. Real bug fixed: extension parsing in admin.products.tsx (`split(".").pop()` returned the whole filename when no dot → garbage storage path). Added `pickExt()` + whitelists (COVER: png/jpg/jpeg/webp, FILE: pdf/epub/zip) and `sanitizeName(slug)` in the path. Kept the direct client upload (supports 50MB; server-fn route would cap ~30MB via base64).
- **Navigation: the curriculum editor (`/admin/curriculum/$productSlug`) was fully orphaned** — no link anywhere. Added a BookOpen "Edit curriculum" link on each product row in admin.products.tsx. (All other admin routes are linked from dashboard admin tiles.)
- **Access guards:** admin.import-contacts / admin.incidents / admin.ledger / admin.curriculum.$productSlug had NO `beforeLoad` admin guard (only products + contacts did) — non-admins saw the shell then errors. Added the same guard to all four (verified: unauth → HTTP 307 redirect).
- Cleanup: dashboard admin "Contacts" tile used `dangerouslySetInnerHTML` for static `"View &amp; tag"` → plain `{t.sub}`.
- tsc clean; dev boots clean; `/`, `/dashboard` → 200, guarded admin routes → 307.
- REMAINING (from audit, not yet done): BUG7 curriculum inline edits have no `.catch` (silent save failures); BUG9 `/admin/import-contacts` throws on happy path if the `legacy_prelaunch_may_2026` tag row is missing (the other import path auto-creates tags — this one doesn't); BUG10 two divergent contact-import implementations with heuristic inserted/updated counts.

## 2026-06-21 — Funnel parity build (GHL blueprint → CHKPLT)
Spine already matched blueprint. Built the 4 gaps the user picked:
- **Abandoned-cart recovery + post-purchase drip (D1/D3/D7) + re-engagement fix** → `supabase/migrations/20260621060000_funnel_parity_agents.sql`. New pg_cron department agents (`dept_recover_agent` hourly, `dept_drip_agent` daily) enqueue emails IN-DB via enqueue_email (no Cloudflare hop → no key/403 issues). Fixed `dept_deliver_agent` table bug (`lms_lesson_progress`→`lesson_progress`). **USER MUST APPLY THIS MIGRATION** (SQL editor or db push) — pg_cron/pg_net already enabled from the email cron.
- **LMS progress read-back** → `getMyCourses` now returns total/completed/percent per course; `/learn` shows a progress bar + Resume/Completed label.
- **UTM capture** → `src/lib/utm.ts` (capture on load in `__root`, persist to sessionStorage, `getUtm()` spread into all 3 checkout calls). Stored in `orders.metadata.utm` + `subscribers.source` (`utm:<source>`).
- **FB Pixel + GA** → `__root.tsx` env-gated scripts (`VITE_FB_PIXEL_ID`, `VITE_GA_ID`); `src/lib/track.ts` fires Lead (checkout submit ×3) + Purchase (success page when paid). PageView auto. **Pixels are no-op until the two VITE_ env vars are set in Cloudflare prod** (added empty to .env).
- tsc clean, built, deployed (version e5ddb4c1).
- Still gaps from blueprint (not built, lower priority): order-bump at checkout, full CRM pipeline/custom-fields, analytics IDs (user-supplied).

## 2026-06-22 — Funnel-parity agents: applied & verified
- Migration applied; all 3 agents return 204 via `/rest/v1/rpc/<fn>` and log to agent_events. 0 queued (no qualifying rows yet — expected). Crons `dept-recover-hourly` + `dept-drip-daily` scheduled.
- **Gotcha 1:** function bodies are `$$`-delimited → use SINGLE quotes inside; only double `''` for literal apostrophes. I over-escaped one `split_part(...,'' '',1)` line → `42601`. Fixed to single quotes.
- **Gotcha 2:** `agent_events.department` has CHECK IN ('attract','qualify','deliver','revenue','retain'). New depts 'recover'/'drip' violated it → whole function rolled back (23514). Mapped recover→'revenue', drip→'deliver' instead of altering the constraint.
- Tip: public void functions are callable as PostgREST RPC (`POST /rest/v1/rpc/<fn>`) with the service key — great for verifying pg_cron functions execute without a live cron tick.

## 2026-06-22 — 8 digital products listed & made purchasable (from Drive)
- Source: 2 Google Drive folders (8 PDFs + mockups), publicly shared → downloadable via `https://drive.google.com/uc?export=download&id=<ID>` (no auth needed for link-shared files).
- Pipeline: bash curl-download PDFs+covers → `sips -Z 1000` covers → upload to Supabase Storage REST (`POST /storage/v1/object/<bucket>/<path>` + `x-upsert:true`). Then bun upsert product rows via PostgREST (`POST /rest/v1/products?on_conflict=slug` + `Prefer: resolution=merge-duplicates`). product-files = private (signed URLs), product-covers = public.
- 7 NEW products (what-to-post R149, 30-day-content-calendar R99, niche-bundle R199, creator-starter-system R49, 90-day-creator-blueprint R299, tax-creator-bundle R199, monetise-your-expertise R299) + updated influencers-code-ebook (attached file+cover, kept R149). All garden=esev, published.
- Tax bundle had no Drive mockup → generated on-brand SVG cover, uploaded to product-covers.
- Each product auto-gets a landing page at /products/<slug> (rich copy populated: tagline/description/long_description/benefits). Delivery verified end-to-end via signed URL (200, real PDF).
- Still NO-FILE (expected): called-expert-* (LMS courses, need curriculum not PDFs) + influencers-code-print (physical/shipped).
- Unused Drive mockups (no PDF yet): your-first-brand-deal-script, the-imposter-syndrome-fix, paids-framework.

## 2026-06-23 — Testimonials + Meta video + conversion stack (order bump + 1-click upsell)
- **Testimonials:** curated 8 real screenshots from iCloud (folders SOCIAL PROOF AND TESTIMONIAL / TESTIMONIALS 2 / COMMENTS TESTINONIAL / META) → optimized (sips -Z 1000, strip EXIF) → public/testimonials/ → masonry "Don't take my word" section in index.tsx. Owner approved as-is (public comments).
- **Meta credibility:** stage photo (Meta logo behind him) in public/meta-summit-stage.jpg + a "Invited by Meta" section. Video is a YouTube SHORT (`_JYjzFDrSgs`) — embedded in a PORTRAIT frame (max-w-[340px] aspect-[9/16]); the raw .mp4 was 292MB (7.88GB MOV) — too big to self-host, no ffmpeg → YouTube is the right host. `META_VIDEO_ID` const mirrors `INTRO_VIDEO_ID`.
- **Order bump:** product `creator-swipe-vault` (R290/$17, stand-in deliverable). `initializeCheckout` now takes `bumpSlugs[]` → extra order_items + summed Paystack amount. Webhook ALREADY grants every order_item → bump auto-delivers. Checkout checkbox in CheckoutModal; `verifyCheckout` returns `bumpSlugs` → success page renders a DownloadCard per item.
- **1-click upsell:** product `asset-accelerator` (R3,600/$197). `payment_authorizations` table captures the reusable card auth in the webhook (NON-FATAL try/catch — never breaks grants if unmigrated). `chargeUpsell` server fn uses Paystack `transaction/charge_authorization` to charge the card-on-file (only if `reusable===true`); webhook grants via the order (reuses all existing flow). Success page `OneClickUpsell` for kit buyers; no-auth → falls back to /products/asset-accelerator.
- ⚠️ **2 migrations to APPLY:** `20260623120000_subscriptions.sql` + `20260623140000_payment_authorizations.sql` (both no-secrets, SQL Editor). Code is deploy-safe before they're applied.
- ⚠️ **Stand-in deliverables:** bump=what-to-post.pdf, upsell=monetise-your-expertise.pdf — swap for real assets (Swipe Vault, Recordings Vault) when ready.
- charge_authorization can't be fully tested without a real card-on-file (a prior purchase capturing a reusable auth) — validate with a live/test purchase.
- Deploys: testimonials/Meta e75736fd → bump fe1c73b5 → upsell ed162526.

## 2026-06-23 — Resale manual + course hosting decision
- Created `docs/SYSTEM-BUILD-MANUAL.md` — the duplicable "build the whole system" blueprint for selling Funnel-Building-as-a-Service (8 sections: system, feature inventory, tools, budget at 3 scales, pre-knowledge, build SOP, the traps/lessons, how to package & sell). This manual IS the resale asset — keep it current.
- **Video hosting decision: Cloudflare Stream** (native to the CF stack, signed/gated URLs, ~$1–5/mo pay-as-you-go). LMS lesson player renders `video_url` as a raw iframe (`learn.$slug.$lessonSlug.tsx`) → accepts any embed URL. v1 = standard embed (lesson page already gated by product_grants); v2 = `requireSignedURLs` + a signed-token server fn for true link-share protection.
- Personal-brand course (`~/Documents/HOW TO START YOUR PERSONAL BRAND IN 30 DAYS`): Intro + 9 modules (What is a PB, Blueprint, 3Cs, SWOT, 3Es, Community, Platforms, PAIDS, Online Asset), ~600MB, 4 mp4s downloaded + 6 iCloud-dataless. Maps 1:1 to the Called Expert frameworks → becomes the LMS course `personal-brand-30-days`.

## 2026-06-23 — Global USD display + white-canvas accessibility pass
- **Currency: one currency everywhere = USD.** Old `formatPrice` geo-gated (ZA→R, intl→$), which is why the owner saw a R/$ mix. Rewrote it to ALWAYS render USD: explicit `USD_DISPLAY[slug]` override → native USD → else convert ZAR via `ZAR_PER_USD = 18.5` (rounded to whole $). Charge stays ZAR (Paystack can't bill USD). `country` param kept for signature compat but ignored (`_country`).
- Added "billed in ZAR at checkout · local equivalent" microcopy at every price point (CheckoutModal, products.$slug, cohort/facilitator cards, apply footer) — honest because Paystack shows ZAR at pay step.
- Converted ALL hardcoded ZAR price strings → USD: cohort R18,000→$970 (+R6,500×3→$350×3), VIP R45,000→$2,430, niche-clarity R299→$16 (meta+fallback), apply income brackets (labels only; INCOME_MAP scoring values stay ZAR), rejection email, editor-cost lines. Added `contentpreneur-90day-cohort: 97000` to USD_DISPLAY.
- **KEEP IN RAND:** proof-story figures (R600K Meta, R180K AdSense, R6K phone, R350 deals) — they're verified income receipts (brand bible), not prices. Don't convert.
- Admin product list now shows USD (passes slug) + a small "charged R…" hint so the owner still sees the actual ZAR charge.
- **Colour: cream canvas → WHITE.** Page bg was hardcoded `bg-[#FAF7F0]` inline per-section (NOT the `--background` token), so changing the token alone wasn't enough — had to sed `bg-[#FAF7F0]`→`bg-white` across index/apply/about/site-header (32 spots). Also set `--background:#FFFFFF` for token-driven routes (products/admin/learn).
- **Gold-text legibility trap:** gold `#C9A84C` as TEXT on white = ~1.9:1 (fails). But gold as FILL (buttons) must stay bright. Can't repoint one token for both. Solution: added `--nx-gold-text:#8A6D1F` (4.8:1 on white = AA), then an UNLAYERED CSS override `.text-banana{color:var(--nx-gold-text)}` (unlayered beats Tailwind's layered utility) + descendant scope `.bg-[#1C1C1C] .text-banana, .bg-[#111111] .text-banana {color:var(--nx-gold)}` so gold text auto-goes deep on white / bright on dark sections. Consolidated all `text-[#C9A84C/D4B65C/...]` → `text-banana` (sed) so they inherit the override. `bg-banana` untouched (buttons stay bright).
- **Invisible-text bugs found & fixed:** `text-[#bbb]`/`#ccc` stranded on the now-white apply page + checkout modal strikethrough (→ #555/#888); dark FOOTER used near-black `#555`/`#444` text on charcoal (→ #bbb/#999) — was barely visible even before.
- zsh gotcha: unquoted `$VAR` with spaces does NOT word-split (unlike bash) → `for f in $FILES` ran once on the whole string. Use an explicit file list or `${=VAR}`.
- Deploys: contrast/testimonials 7bb1ee26 → 080eec10 → USD+white 39e05cec.

## 2026-06-23 — Funnel audit (pre-launch, for tomorrow's full test pass)
- Ran a read-only audit (nav/links, dead buttons, payment, delivery, bump/upsell, admin, LMS, auth, analytics). Code-level result: funnel is largely WIRED end-to-end — no broken `<Link>` routes, no stub buttons, payment+webhook+grant+delivery+bump+upsell+subscription all coded and idempotent. See `docs/TOMORROW-TEST-PLAN.md` for the full checklist.
- The remaining gaps are DATA + LIVE-TEST, not code: (a) confirm every purchasable slug is published with a real `download_path` (null → "No download available"); (b) live test pur chase → receipt → download; (c) capture a reusable card auth then test 1-click upsell `chargeUpsell`; (d) bump/upsell still point to STAND-IN PDFs; (e) personal-brand-30-days video_urls empty until Cloudflare Stream; (f) analytics env IDs (VITE_FB_PIXEL_ID/VITE_GA_ID) + MailerLite group IDs unset = silent no-op.

## 2026-06-23 — Offer Builder: first interactive app (AI lead magnet, rung 04)
- Built `/offer-builder` — a free, email-gated AI tool that turns a user's skill into a complete sellable offer (name, promise, deliverables, USD price, this-week action). Decisions (owner-approved): FREE email-gated lead magnet; serves BOTH ICPs via a "who do you serve?" selector (Called Expert = premium pricing band, Content Creator = accessible band).
- **First AI in DEB.** Added `@anthropic-ai/sdk` (^0.105.0, npm). New `lib/anthropic.ts` (getAnthropic(), `OFFER_MODEL="claude-opus-4-8"` — flagship tool, quality = the value prop; swap to sonnet-4-6 for cost). Key = Cloudflare Worker secret `ANTHROPIC_API_KEY` (read via `process.env`, nodejs_compat on).
- **Self-contained** (no cross-project import from full-content-system) — distilled the NoChill voice + frameworks (PAIDS/DARES/4E/SEEDS) + the 2 ICP profiles into one `BRAND_SYSTEM` prompt string in `lib/offer-builder.functions.ts`. Better for the resale/duplicable goal. full-content-system already uses Anthropic (claude-sonnet-4-6) — I ported the PROMPT, wrote fresh SDK calls.
- **Structured output:** `client.messages.create` with `output_config.format` (JSON schema) → guaranteed JSON, no prose leak (so thinking can stay off = faster). Passed `output_config` via an untyped spread `...({output_config:{...}} as Record<string,unknown>)` so it compiles on any SDK version (the API honours it regardless of the SDK's typings). Parse the first text block; try/catch → friendly error.
- Reused DEB plumbing verbatim: `submitApplication`-style `createServerFn({method:"POST"}).inputValidator(zod).handler`, `verifyTurnstile` (TURNSTILE_SECRET_KEY, dev no-op), `addToMailerLiteGroup` (ICP1→CALLED_EXPERT group, ICP2→FREE_KNOWLEDGE_AUDIT), `TurnstileGate` ("dev-skip" sentinel), apply.tsx wizard pattern (step gating, GOLD_GLOW, nav).
- Lead capture: new table `offer_builder_leads` (migration `20260623160000`, RLS on, service-role only). Insert is NON-FATAL `as any`-cast so the tool works before the migration is applied; MailerLite is fire-and-forget too.
- **GOTCHA — route tree before tsc:** `tsc --noEmit` failed with "`/offer-builder` not assignable to FileRoutesByPath" on `createFileRoute` + every `<Link to="/offer-builder">` — because `routeTree.gen.ts` is regenerated by `bun run build` (the TanStack Vite plugin), NOT by tsc. Fix: run `bun run build` first (regenerates the tree), THEN tsc passes. New-route flow = build → tsc → deploy, not tsc → build.
- **GOTCHA — curl can't verify content:** chkplt SSR ships a ~10KB hydration shell; visible text renders client-side, so `curl | grep "heading"` finds nothing on ANY route (incl. known-good /apply). Verify routes by HTTP 200 vs 404 (bogus path) + route presence in routeTree.gen.ts, not by grepping body text.
- Wired homepage ladder rung 04 ("Interactive Apps · Coming") → live "Offer Builder · Free · NEW·LIVE" linking `/offer-builder` (new `kind:"app"` branch in the ladder map). Confirmed my prior USD-global + white-canvas work survived the c90ad28 ladder restructure (working tree = latest live; my files were purely additive).
- Deploy `09b6fc01`. ⚠️ OWNER ACTION: set `ANTHROPIC_API_KEY` as a Cloudflare Worker secret (`wrangler secret put ANTHROPIC_API_KEY`) — until then generation throws "ANTHROPIC_API_KEY is not set" (UI/lead-capture still work). Optional: apply the `offer_builder_leads` migration.

---

## 2026-06-25 — ICP-1 Refocus + "Modern Professional" global redesign (branch `redesign/icp1-modern-professional`)

- **Theme single source of truth = `src/styles.css`** (Tailwind v4 `@theme inline` + `:root`; there is NO tailwind.config). Migrated Heritage Gold → Modern Professional (slate `#0F172A` ink + amber `#F59E0B` accent + white) by changing token VALUES while keeping token NAMES (`--nx-gold*`, `--banana`, `--nx-orange`, all `--color-*`). Result: all 45 shadcn `ui/*` + every `.nx-*` class re-themed automatically. Backed up old theme to `src/styles.heritage.bak.css`.
- **Amber text-contrast gotcha:** amber-500 `#F59E0B` fails AA as text on white (~1.9:1). So gold-as-text maps to amber-700 `#B45309` (~4.7:1), gold-as-bg/border maps to `#F59E0B`, primary buttons use amber bg + DARK `#0F172A` text (~8.9:1). When bulk-replacing, do `text-[#C9A84C]`→`text-[#B45309]` FIRST, then generic `#C9A84C`→`#F59E0B`.
- **zsh word-split gotcha:** `sed ... $FILES` (unquoted var) does NOT word-split in zsh → "No such file or directory" for the whole string. Pass files literally to sed, or use `${=FILES}`.
- **Bulk retheme via sed across many files** (email-templates ×7, the 7 routes that hardcoded `#C9A84C`/`#1C1C1C`, apply.functions HTML, index.tsx kept helpers). Edit tool can't do cross-file; sed is the right tool here. Always grep-verify "remaining old literals" after.
- **Montserrat was referenced but never loaded** — only Inter was in the Google Fonts link. Added Montserrat to the `<link>` in `src/routes/__root.tsx`.
- **Persistent nav without touching 11 pages:** all `_authenticated/*` pages render their own `SiteHeader` across multiple branches. Instead of stripping/centralizing (risky), made `SiteHeader` itself render the full member nav when `useAuth().user` exists (+ a cached `has_role` query for the Admin link). One component change = consistent labelled nav on every public/member/admin page.
- **Homepage surgery on a 1851-line file:** kept lines 1–388 (CheckoutModal w/ built-in order bump, CtaButton, FaqItem, FAQS, BEFORE_AFTER) via `head -388`, appended a new clean `Landing` (single ICP-1 tripwire). 1851 → 673 lines. The $97 checkout + order bump flow was preserved untouched.
- **Verify-by-CSS, not body text:** confirmed the deploy by fetching the hashed CSS bundle and grepping it — amber `#F59E0B` ×30, slate `#0F172A` ×23, old `#C9A84C` ×0. (Body text is client-rendered; curl of `/` only shows the head — font link + title were verifiable there.)
- New routes (build → tsc → deploy order, per the prior route-tree gotcha): public `/tools`, member `/dashboard/tools`, `/dashboard/products/free` + `/paid`. Non-qualifier CTA in `apply.tsx` now → Foundation Kit checkout + `/tools` (was `/`).
- Deploy version `504fe2bb`. ⚠️ OWNER: branch NOT merged to main. `.env` is git-TRACKED (pre-existing) — untrack + rotate secrets. Deferred (Phase 6): post-purchase 1-click upsell, scarcity countdown, dynamic geo-currency, ICP-2 creator clone.

---

## 2026-06-25 (Round 2) — Mobile fixes, founder story + real proof images, housekeeping

- **Portrait video bug:** the Meta talk is a YouTube *Short* but the embed wrapper used `aspect-video` (16:9) → vertical video letterboxed with grey bars. Fix = `aspect-[9/16] max-w-[300px]`. (Constant comment already said "YouTube Short — vertical" — heed it.)
- **White gap under footer (mobile):** root `<div class="… bg-white … pb-20 sm:pb-0">` put 80px of WHITE padding below the dark `<SiteFooter>` (the pb was to clear the fixed mobile buy-bar). Fix = remove pb from the white root; wrap the footer in `<div class="bg-[#0F172A] pb-20 sm:pb-0">` so the trailing space is dark.
- **Proof images pipeline (no base64):** owner's images live in iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/…`, e.g. `SAMA31 - 2025/`, `META/`) and Google Drive (MCP). Local iCloud = plain `cp` (free). Google Drive `download_file_content` returns base64 into context (~1.3× filesize) — AVOID for binaries; prefer the local iCloud copies. Picked the best shot by Read-ing 1–2 candidates (UUID filenames are opaque). Optimized with macOS `sips -Z 1200 -s formatOptions 72` → 1.3M/925K → 122K/188K. Output to `public/proof/`; Vite copies `public/` → `dist/client/` on build. Verified live via image HTTP 200 + grepping the built route chunk (`dist/client/assets/index-*.js`) for the new strings (body is client-rendered, so curl of `/` won't show section text).
- **Proof-claim accuracy catch:** owner said "10 awards · SAMA 30/31/32 consecutive" but CLAUDE.md verified table said "9 awards · SAMA31", and SAMA32 = 2027 (future as of 2026-06-25). Asked → confirmed **10 awards · SAMA 30 & 31** (dropped 32). Updated both project + global CLAUDE.md. Lesson: when an owner-stated proof number conflicts with the documented verified table OR implies a future date, confirm before publishing (rules forbid fabrication; public + hard to reverse).
- **Brands on the strip:** owner named Disney + DStv, but chose **verified-only** (Capitec, Standard Bank, Netflix, Suzuki, SA Tourism, Showmax, ABSA) — dropped the undocumented ones.
- **Housekeeping:** merged `redesign/icp1-modern-professional` → `main` (--no-ff), pushed (`c90ad28..aefb095`). Untracked `.env` (`git rm --cached` + `.gitignore` `.env`/`​.env.*`). ⚠️ `.env` is in prior git HISTORY — owner must rotate the Supabase service-role key + other secrets. Deploy version `20178973`.

---

## 2026-06-25 (Round 3) — footer, overscroll, real proof wall, public/ hygiene

- **Footer = Company only** (owner: "footer must only have Company details"). Removed the Explore column from `SiteFooter`; tools/products live in the dashboard.
- **Persistent white "end" on scroll** = mobile Safari rubber-band showing the white `<html>`/`<body>` bg below the dark footer. Fix: `html { background-color: #0F172A }` in styles.css so bottom overscroll matches the footer. (The earlier dark footer-wrapper alone didn't cover overscroll.)
- **Cloudflare Workers asset limit = 25 MiB/file.** Deploy failed: `Ensure all assets … conform with the Workers maximum size requirement`. Cause: owner had dragged a 1GB `public/INBOX/` (`.mbox` email archives, 456MB each) + `public/Influencer's Code materials/` into the web `public/` dir → Vite copies all of `public/` to `dist/client/`. Fix: `rm -rf` those from `public/` (originals safe in iCloud). Lesson: keep `public/` to web assets only; check `find public -type f -size +20M` before deploy. Verified they never entered git history.
- **Can't pull Google Drive binaries to disk** with available tools: `curl "drive.google.com/uc?export=download&id=…"` returns Google's HTML auth/confirm page (not the file) for these shares; the MCP `download_file_content` returns base64 into context (can't write binary via Write). → For owner images, use LOCAL sources (iCloud `cp`, or files the owner drops into `public/`). Book cover still pending: wired an onError-hidden `<img src="/proof/book-contentpreneur.png">` slot that auto-appears once the file is added.
- **Real proof wired:** owner pre-curated `public/founder-award.jpg` (holding the Humanz Top 20 Creators Worth Following 2026 award — excellent), `public/meta-summit-stage.jpg`, and `public/testimonials/t*.{png,jpg}` (7 unedited comment/receipt screenshots). Story grid now uses the award + stage photos; testimonials section is a CSS-columns masonry of the real screenshots (`columns-1 sm:columns-2 lg:columns-3`, `break-inside-avoid`). Authentic > transcribed.
- ⚠️ Leftover: many stray dumped images at `public/` root (IMG_*.JPG, UUID.JPG, tmp*.webp) are tracked and bloat `.git` (~119M). Optional cleanup later (verify unreferenced first). Deploy version `1ec5cdd9`; pushed `7b558ce`.

---

## 2026-06-25 (Back end / new Supabase project / email / $97) — receipts

- **New Supabase project** `usxjlylquvrmlwxykgyt` (old `yarzvthhsvfvdsoldblz` was paused → NXDOMAIN). Switched all 4 keys in `.env` (VITE_SUPABASE_URL/PUBLISHABLE + SUPABASE_URL/PUBLISHABLE) + rebuilt so the build-inlined client points at the new DB. New project already had: 19 products, 12 modules, 40 lessons, owner=admin, RLS, has_role, pgmq + enqueue_email, email_send_log/state.
- **Worker env gotcha (the big one):** Cloudflare Worker does NOT populate `process.env.SUPABASE_*` from `.env`. Fixes:
  - `client.server.ts` (service-role) → `process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL`; key stays `process.env.SUPABASE_SERVICE_ROLE_KEY` (a wrangler secret).
  - `auth-middleware.ts` (requireSupabaseAuth) → same VITE fallback for URL **and** PUBLISHABLE_KEY. This was the "Missing SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY" on Ledger/Courses. NOTE: file is marked "auto-generated (Lovable)" but Lovable is gone → safe to edit.
  - Almost every server fn ultimately uses `supabaseAdmin` for data; `requireSupabaseAuth` is only the auth gate. So both fixes + the service-role secret were ALL required.
- **Service-role key** set via `printf %s "<jwt>" | bunx wrangler secret put SUPABASE_SERVICE_ROLE_KEY`. (Owner first ran `wrangler secret put <jwt>` — wrong: that makes the JWT the secret NAME. Cleaned up 2 junk secrets the same way later for Turnstile.) Proven working by POSTing `/api/cron/sync-fx` (service-role bearer) → updated 9 products. ⚠️ key exposed in chat → rotate.
- **Checkout confirmed end-to-end** (owner reached Paystack). DB: 2 orders `pending`, payments `initialized`, **tax_reserve_cents = 25% of total** (SARS rule working). Paid→grant→receipt is webhook-driven (charge.success) and fully coded; webhook reachable + HMAC-enforced (POST w/o sig → 401).
- **Email delivery — two bugs:**
  1. No queue drain on the new project → everything `pending`. Fix: Cloudflare cron `"* * * * *"` in wrangler.jsonc + `scheduled()` branches on `event.cron` (daily=fx-sync, minute=POST `/api/email/queue/process` with service-role bearer). Avoids per-project pg_cron setup.
  2. Receipt sent from **unverified** `chkplt.com` → Resend 403 "domain is not verified", logged `dlq`. `notify.chkplt.com` IS verified (test send → `sent`). Fix: `paystack-webhook.ts` FROM_DOMAIN `chkplt.com`→`notify.chkplt.com` (auth + apply emails already used the verified subdomain). Diagnosed by enqueuing test emails via `POST /rest/v1/rpc/enqueue_email` then draining.
- **Turnstile** was OFF (no secret). Set `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` via wrangler secret (runtime, no rebuild — site key read server-side via `getTurnstileSiteKey` → `process.env.TURNSTILE_SITE_KEY`, NOT a VITE var; fixed `.env.example`). Identified which key was secret via Cloudflare siteverify (`invalid-input-response` = valid secret; `invalid-input-secret` = it's the site key).
- **$97 fulfillment:** kit = `deshe` product, `download_path=called-expert-foundation-kit.zip` (exists in `product-files` bucket). LMS modules belong to the Accelerator, not the kit. Built **Foundation Kit Workspace** `/dashboard/foundation-kit` (gate: owns kit slug OR admin): downloads fillable PDFs (getMyDownloadUrl), 7 framework cards (Niche Clarity app live, rest "coming soon"), bundles existing TOOLS. Scaffold for rolling out the remaining 6 interactive framework apps + per-framework fillable PDFs.

## 2026-06-26 — Personal Branding video course + native interactive apps

- **Cloudflare Stream course wired into LMS.** Owner uploaded 10 videos to Stream (account `e474f450b9044f6a282e44878a52323a`, customer subdomain `customer-esnxfwirm3atddsc.cloudflarestream.com`, `requireSignedURLs:false` → public embed). Embed URL pattern: `https://customer-esnxfwirm3atddsc.cloudflarestream.com/<UID>/iframe`. **LMS already supported video** — `lms_lessons.video_url` renders via `<iframe>` in `learn.$slug.$lessonSlug.tsx`; admin curriculum builder already has a "Video URL (embed)" field. NO schema change needed.
- **A product becomes a course just by having `lms_modules` rows (FK `product_id`).** Attached the course module + 10 lessons to the **existing** `called-expert-foundation-kit` product, so the existing kit `product_grant` auto-unlocks it in `/learn` — no second product, no webhook change. INTRODUCTION lesson = `is_preview true` (viewable pre-purchase). Seed lives in `supabase/migrations/20260626002237_seed_personal_branding_course.sql` (idempotent `DO $$`, looks product up by slug, skips if module exists).
- **No service-role key in local `.env`** this session (only VITE_/publishable/Turnstile) → couldn't REST-seed; the seed must be applied by the owner via Supabase **SQL editor** (paste the migration) or `supabase db push`. Anon/publishable REST can READ published products (used to confirm kit id `b5d52468-7568-4849-bfc8-a2467dfadef3`) but can't write LMS tables (RLS).
- **`useKitAccess()` hook** (`src/lib/use-kit-access.ts`) extracted from the workspace gate (owns a `KIT_SLUGS` grant OR `has_role admin`) and reused by every app route. Returns `{access, ownsKit, isAdmin, loading}`.
- **Apps rebuilt NATIVE (not iframe).** The 4 export-ready `~/Desktop/Apps/*/… - App.html` bundles use the OLD charcoal/gold brand (`#1c1c1c/#cf9f2c`), not the slate+amber funnel — owner chose native rebuild. Read each app's small `.dc.html` source (~20K) to extract exact copy + scoring, then reimplemented as gated React routes in the funnel theme: `/apps/niche-clarity-builder`, `/apps/paids-auditor`, `/apps/knowledge-audit`. Wired into the workspace `FRAMEWORKS` (app link flips "coming soon" → "Open interactive app"). Apps kept OUT of public `TOOLS` (kit-gated).
- **New gated routes need the route tree regenerated before `tsc`** — `createFileRoute("/_authenticated/apps/…")`'s type is validated against `routeTree.gen.ts`. Order: create file → `bun run build` (regenerates tree) → `bunx tsc --noEmit`. Used plain `<a href>` (not typed `<Link to>`) for cross-route app links to avoid type churn.
- **Deferred:** Consistency Blueprint (full 30-day stateful LEGACY tracker — own build) and Right Side Diagnostic (only `.dc.html` source exists; owner must export a self-contained `… - App.html` first).

## 2026-06-26 (later) — first real Paystack test purchase + the onboarding/delivery fix
- **Paystack test purchase succeeded end-to-end** (payment → webhook → grant → receipt) once the worker's `PAYSTACK_SECRET_KEY` was swapped from LIVE → TEST (owner had a live key; gateway rejected the test card until swapped via `printf %s "sk_test_…" | bunx wrangler secret put PAYSTACK_SECRET_KEY`). Remember to swap back to live before real selling.
- **🔴 Critical bug found in the buy flow:** the webhook only set `product_grants.user_id` if a `profiles` row already existed for the buyer's email. A brand-new buyer → grant saved with `subscriber_id` only, `user_id = NULL`. The dashboard + `useKitAccess` gate on `user_id` grants → **buyer pays and the kit stays locked.** No account was ever created at purchase. Fix in `paystack-webhook.ts`: `ensureBuyerUserId()` now `auth.admin.createUser({email, email_confirm:true})` (or re-resolves if already registered), upserts grants with that `user_id`, and `auth.admin.generateLink({type:'magiclink', redirectTo:'/dashboard/foundation-kit'})` → a one-click sign-in link embedded in the receipt. Belt-and-suspenders: `claimMyGrants` server fn (products.functions.ts) links email-only grants to the user on every `_authenticated` page load.
- **🔴 Delivery mismatch:** `called-expert-foundation-kit.zip` contained **5 ICP-2 creator PDFs** (Tax/What-To-Post/90-Day/Niche/Monetise, all Google-Drive links) — NOT the Called Expert kit the homepage sells. Fix: kit delivers via the workspace (apps + course + per-framework workbooks); `download_path` set NULL on the kit; the 5 PDFs split into a separate DRAFT product `creator-launch-bundle` (migration `20260626013917`). Thank-you page now shows a kit onboarding card → `/dashboard/foundation-kit` (was leading with the wrong ZIP "Download now").
- **Brand:** receipt `SITE_NAME` was "Christ Kingdom Platform" → changed to **CHKPLT** to match the site wordmark.
- **Magic-link caveat:** `generateLink` redirect needs Supabase Auth → URL Config: Site URL `https://chkplt.com` + redirect allow-list `chkplt.com/**`, else it falls back to Site URL. Link respects the OTP expiry (≈1h) — receipt also gives the `/login` + “forgot password” fallback (account is email-confirmed, so it always works).
- **The $97 kit is now "The Clarity System" — a guided 7-step journey (deploy dec17af0).** SoT `src/lib/clarity-system.ts` = 7 steps {stage, title, question, woven Stream video UIDs, tool route(s)+pdf key, nextAction} + `localStorage` progress (`clarity-progress-v1`). Kit workspace renders the journey: each step plays its matching course video inline, opens its tool, shows ONE bold next action, ticks complete → progress bar + end "Clarity Plan" + Accelerator upsell. Dashboard leads with "Continue — Step N". Stage→tool: 1 MS×TS×SS(new) · 2 Knowledge Audit+Niche · 3 4E Calendar(new) · 4 Right Side Diagnostic · 5 SEEDS(new) · 6 DARES(new) · 7 PAIDS. 4 new gated apps (`apps.{ms-ts-ss,4e-content-calendar,seeds-pipeline,dares-asset-model}`) on the existing pattern. Admin home grouped Catalog·People·Money·System. Free tools (ICP-2) removed from the ICP-1 funnel/header. **Phase 3+4 DONE (deploys 485dc52e, 2ac3d02a):** all 10 deliverables = 7 framework apps + 3 bonuses, each **app + PDF**. PDFs generated via `pdf-lib` (bun script in scratchpad `gen-pdfs.ts`; WinAnsi can't encode →/≥/≤/en-dash — sanitize before drawText) and uploaded to `product-files` via Storage REST (`POST /storage/v1/object/product-files/<name>`, service-role bearer + `x-upsert:true`). Wired in `KIT_FILES` + workspace `AVAILABLE_PDFS` + `CLARITY_BONUSES`; 90-Day Planner = new app `apps.first-income-planner`. ⚠️ **service-role key pasted in chat AGAIN → MUST rotate.** Still pending: `update products set garden='esev' where slug='called-expert-foundation-kit'` (kit shows "Free Tools" badge until then).
- **AI upgrade — tools became an advisor, not calculators (deploy cf151f8f).** `src/lib/tool-ai.functions.ts`: `getToolCoaching` (per-tool, `COACH_MODEL`=claude-sonnet-4-6 for cost, kit-gated via `assertKitAccess`) + `buildClarityPlan` (Opus, synthesises all 7 tools' saved answers → one-page personalised plan). Reusable `<AiCoach tool getPayload>` (`src/components/ai-coach.tsx`) wired into all 8 apps — sends the user's own state to Claude, renders "what's strong / one gap / next move". Kit workspace has **Build my Clarity Plan** (gathers `nochill-*-v1` localStorage keys → AI → printable plan) + a "how your kit works" orientation. `ANTHROPIC_API_KEY` already a worker secret (offer-builder uses it). Pattern copied from `offer-builder.functions.ts`. **Value-ladder verdict given (USD): free diagnostic → $97 kit (+$27 bump) → $197 OTO → $297 OTO → $39/mo continuity (the missing rung) → $997 cohort → $3,997 facilitator.** Owner chose USD-only $97 → Phase D = Stripe rail (⚠️ SA-payout risk: verify Stripe supports NOCHILL or display $ but charge Paystack) — NOT built, owner-gated. Phase E = re-shoot course as per-tool screen-walkthroughs, owner-gated.
- **🔴 Email queue 522 (root cause of "no onboarding email / can't get in"):** the every-minute cron did `fetch("https://chkplt.com/api/email/queue/process")` — a Worker fetching its OWN public hostname returns **Cloudflare 522**, so the queue never drained. Fix: extracted `drainEmailQueues()` into `src/lib/email-queue.ts` and call it **in-process** from `server.ts scheduled()`; the HTTP route now delegates to the same fn. Confirmed in tail: `[email-drain] {"ok":true,"processed":N}` (was `522` every minute). NOTE: something external also POSTs `/api/email/queue/process` every minute (a prior external cron) — harmless.
- **Member area "dead links / nothing works / shows $97" = the user was LOGGED OUT** (no email → no session). The header is auth-aware: `$97` CTA only renders when `!user`; every `_authenticated` link bounces to `/login` when not signed in. Not a routing bug (all member routes return 200).
- **🔴🔴 ROOT CAUSE of "the whole member area is disconnected / links open nothing / no course / no apps" (deploy 57bfca17):** `dashboard.tsx` and `learn.tsx` each rendered their OWN page content but had **no `<Outlet/>`**, while their dot-named children (`dashboard.foundation-kit`, `dashboard.products.*`, `learn.$slug`, `learn.$slug.$lessonSlug`) nest UNDER them in TanStack flat routing. With no Outlet, every child URL silently **re-rendered the parent** — proof: visiting `/learn/called-expert-foundation-kit` showed the `/learn` library list, and `/dashboard/foundation-kit` showed the dashboard. So the kit workspace, the 10-lesson course, and the apps were all unreachable via the UI. **Fix = the admin pattern:** split each parent into a layout (`component: () => <Outlet/>`) + an index page (`dashboard.index.tsx`, `learn.index.tsx`) holding the former content. **RULE: any TanStack flat-route file that has dot-named children MUST render `<Outlet/>` (be a layout); put its own page content in a sibling `*.index.tsx`.** The admin console already worked because it was built this way (`admin.tsx` = Outlet + `admin.index.tsx`). Verify after routing changes by actually loading a CHILD url, not just the parent. **This bug is RECURSIVE — check every level:** `learn.$slug.tsx` ALSO had children (`learn.$slug.$lessonSlug`) and no Outlet, so the lesson player showed the course outline at the lesson URL. Fixed by splitting `learn.$slug` into a layout + `learn.$slug.index` (outline) so `learn.$slug.$lessonSlug` (player) renders. Audit-all-parents one-liner: for each `routes/**/X.tsx` (non-index) that has `X.*.tsx` siblings, it MUST contain `<Outlet/>`. After fixes, the only member parents are dashboard/learn/learn.$slug/admin — all now Outlet.
- **Course "dead/locked" for the owner = no admin bypass in LMS.** `getMyCourses`/`getLessonBody`/`learn.$slug` gated on a purchase grant only; the owner never bought → empty /learn + locked lessons (apps worked because `useKitAccess` has an isAdmin bypass, LMS didn't). Fix: admin bypass in all three (admin sees every published course + can open any lesson). Real buyers unaffected (grant path).
- **Auth emails branded "Christ Kingdom Platform"** came from a SEPARATE `SITE_NAME` const in `src/routes/api/email/auth/webhook.ts` (+ `preview.ts`) — distinct from the order-receipt `SITE_NAME` fixed earlier. Both → "CHKPLT". (There are ~20 more "Christ Kingdom Platform" strings in page `<title>`/meta across public routes — cosmetic, not yet swept.)
- **reset-password** never navigated after `updateUser` → stranded on the page. The recovery link already establishes a session, so → `navigate({to:"/dashboard"})` after success.
- **Member account page** was owner/jargon ("Download my data → JSON of profile, subscriber record, orders, order items"). Replaced with real member settings (name via `supabase.auth.updateUser({data})`, password via `updateUser({password})`, close-account). Principle from owner: **don't surface things that don't exist in the member area** — also applied to the Foundation Kit (render only frameworks with a live app/PDF; hide "coming soon" cards until built).
- **Separate /admin console + member portal reorg (deploy edd5d823):** added `src/routes/_authenticated/admin.tsx` as a LAYOUT route — one `beforeLoad` admin guard (`has_role` → redirect non-admin to /dashboard) + `component: () => <Outlet/>`; `admin.index.tsx` = console home (tiles). The 6 `admin.*` pages keep their own beforeLoad (defense-in-depth) and just swap chrome import `member-shell` → `admin-shell` (`src/components/admin-shell.tsx`: slate/orange, "Member view" toggle). Verified the guard fires SERVER-side: `curl /admin` → **307** (redirect to login when not authed-admin) vs member routes 200 (client-gated). `useIsAdmin()` (`src/lib/use-is-admin.ts`) dedupes the has_role query. Member `dashboard.tsx`: removed all admin tiles; member-only quick access; "My access" grouped Courses & programmes / Downloads (classify by `download_path` presence; kit slug → /dashboard/foundation-kit); "Complete your toolkit" shows RECO_SLUGS upsells the member doesn't own. TanStack flat-routing: `admin.tsx` + `admin.index.tsx` + `admin.*.tsx` auto-nest (build regenerates routeTree).
- **Secured member portal:** member area reused the marketing `SiteHeader` (with `$97` + public nav) → felt un-separated. Built `src/components/member-shell.tsx` (exports `SiteHeader`/`SiteFooter` so only the import path changes) — own chrome, logo→/dashboard, nav Dashboard/My Courses/Account(+Admin)/Sign out, no marketing links. Repointed all 18 `_authenticated` routes from `@/components/site-header` → `@/components/member-shell` (Python bulk swap; shell-in-each-page, low blast radius). Bulk shell edits: zsh `for f in $files` re-expands `$slug` inside double-quoted filenames → use Python/glob, never a shell loop, for files with `$` in the name.

## 2026-06-27 — Aligned 2026 giveaway turned into a coded tool (/align-accelerate-excel)
- **Built a new PUBLIC interactive tool** from the static `aligned_takeaway.html`: `src/routes/align-accelerate-excel.tsx`. 12-question self-assessment (4 per phase × 1–5 = /20 each, /60 total), intro→q→result flow, per-phase bars, lowest-phase "START HERE" + NoChill-voice verdict, then the giveaway lead-capture, then product CTAs. Matches the existing tool conventions exactly (copied the `apps.right-side-diagnostic.tsx` step-machine pattern + `niche-clarity.tsx` public page pattern; nx design tokens; `SiteHeader/SiteFooter` from `@/components/site-header`).
- **Lead capture feeds the owned list (the whole point of a stage giveaway):** new server fn `subscribeAlignedToolkit` in `src/lib/aligned.functions.ts` → `assertTurnstile` (rule #5) → upsert `subscribers` (`source:'aligned-2026'`, captures `phone` for WhatsApp) → `addToMailerLiteGroup(...)`. New env `MAILERLITE_GROUP_ID_ALIGNED` with fallback to `MAILERLITE_GROUP_ID_FREE_KNOWLEDGE_AUDIT` — works today even before the env is set (MailerLite helper is fire-and-forget, silently skips if unset).
- **Registered in the tools hub:** added `/align-accelerate-excel` to the `Tool.path` union + `TOOLS[]` in `src/lib/tools.ts` (Compass icon, listed first). Shows on both public `/tools` and member `/dashboard/tools` automatically (single source of truth).
- **TanStack gotcha (re-confirmed):** new route files throw `TS2345 ... not assignable to keyof FileRoutesByPath` until `routeTree.gen.ts` regenerates. The router-plugin only regenerates on `vite dev`/`build`, NOT on `tsc`. Fix: start `vite dev` in background (~1s), poll `grep align-accelerate-excel src/routeTree.gen.ts`, kill it, THEN `bunx tsc --noEmit` → clean. macOS has no `timeout`; use `(cmd &)` + a `seq` poll loop instead.
- **Subscribers schema:** has `first_name,last_name,phone,source,status(enum active/unsubscribed/bounced/complained)`, upsert `onConflict:"email"`. `phone` column already exists — used it for WhatsApp capture (no migration needed).
- **Not yet done:** the success state PROMISES the email delivery ("toolkit is on its way") but no transactional email is wired to actually send the sprint/PDF on subscribe — currently it only lists the lead. Either (a) attach a MailerLite automation to the `aligned-2026` group/`MAILERLITE_GROUP_ID_ALIGNED`, or (b) add a queued transactional email. Wire before relying on it post-event.

## 2026-06-27 (later) — free framework PDF giveaway + public asset .html routing
- **Added a print-to-PDF framework guide** at `public/align-accelerate-excel-framework.html` (6 A4 pages: cover, the map BE→DO→HAVE table, one page per phase with verified examples + "your move", closing charge). Brand-styled (Heritage Gold #C9A84C, charcoal, Montserrat/Lato), `window.print()` button, `@media print` hides the bar. Linked from the tool's results page (`align-accelerate-excel.tsx`) as a free download card (no gate, no selling). Pure print-to-PDF — no PDF-gen dependency.
- **🟡 Cloudflare Workers static-asset gotcha:** files in `public/*.html` are NOT served at their `.html` URL — the assets layer 307-redirects `/foo.html` → `/foo` (extensionless, html_handling=drop). So `curl /align-accelerate-excel-framework.html` → 307 → `/align-accelerate-excel-framework` → 200. Link to the EXTENSIONLESS path in-app to avoid the redirect hop. Content still serves fine; just don't hardcode `.html` in hrefs.
- **Verified figures only in the giveaway doc:** R47 floor (2013), R6k phone (2014), R350 first deal (2017), R23,000 one day (Mar 2019), 30-day book at 05:00 (Sep 2025), Daniel 6 excellent spirit, SARS "just over R200,000", IG 780k lost, Ubuntu. No fabricated numbers.

## 2026-06-27 (later) — added Genesis 1:1 Time/Space/Matter layer to the framework
- Deepened the ALIGN→ACCELERATE→EXCEL framework with a third scriptural pillar (Myles Munroe creation teaching): **Genesis 1:1 — "In the beginning (TIME) God created the Heaven (SPACE) and the Earth (MATTER)"** mapped onto BE→DO→HAVE (BE=Time/invisible/first, DO=Space, HAVE=Matter). Teaching: God began with the unseen, so alignment (BE) must precede DO and HAVE.
- Content-only edit to BOTH giveaways: `public/align-accelerate-excel-framework.html` (cover verse, "pattern in creation" callout on map page, Time/Space/Matter in the posture column + per-phase tags & italic lines) and `src/routes/align-accelerate-excel.tsx` (`PHASE_META[*].be` now "Identity · BE · Time" etc. — propagates to question headers + intro cards; intro paragraph gained the Gen 1:1 creation sentence). No logic/schema/deps changed. tsc clean, deployed ee88aad9.

## 2026-06-27 (later) — talk-slide deck + responsive pass
- **Built a responsive speaker deck** `public/align-accelerate-excel-talk.html` (10 slides: Title → Floor → Question → Map → Align → Accelerate → Excel → Wall → Charge → Giveaway). Matches the framework (BE→DO→HAVE + Gen 1:1 Time/Space/Matter) and the quiz. Nav: arrow keys/space, on-screen Prev/Next, tap-left/right zones, touch swipe, N=speaker-notes toggle (per-slide `data-note` cues + `data-time` timing), F=fullscreen. Fluid type via `clamp()` → works phone/tablet/desktop. Speaker-only (not linked publicly).
- **Offline QR:** no `qrencode`/`python-qrcode`; installed `segno` (pure-python) → `public/qr-quiz.svg` (gold #C9A84C, error='h', transparent) pointing to chkplt.com/align-accelerate-excel. SVG embedded in the deck — renders crisp at any size, no internet needed at venue.
- **Framework PDF responsive fix:** it's a fixed 794px A4 print doc → added `@media screen and (max-width:840px)` block making `.page` fluid (width:100%, min-height:auto, static `.foot`, smaller headings) so it reads on phones; `@media print` still uses the 794px A4 layout (print is not `screen`, so the mobile override never affects the PDF output). Pattern: keep print fixed, override only `@media screen`.
- Quiz route already responsive (Tailwind `sm:` + `max-w-2xl`) — no change needed.
- All static giveaways live: /align-accelerate-excel (quiz), /align-accelerate-excel-talk (deck), /align-accelerate-excel-framework (PDF), /qr-quiz.svg. Deploy 4f5a902a.

## 2026-07-09 — Covenant Engine blueprint adopted: curriculum restructured to 12-week Torah-arc

- **BLOCKERS.md was stale in 3 places** — audited against actual code before trusting it: BLOCKER-002 (curriculum) said "0 modules, not fixed" but migration `20260615120000_seed_curriculum.sql` already seeds 7 modules/30 lessons; BLOCKER-007 (HMAC) and the "order bump/upsell = Phase 2, not built" architecture note were also already resolved in `checkout.functions.ts` (`chargeUpsell`, `bumpSlugs`) and `paystack-webhook.ts`. **Lesson: grep the actual code before trusting a blockers/status doc — these rot fast and this repo's docs lag the implementation by weeks.**
- **User supplied a full external blueprint ("The Covenant Engine") describing a 12-week, 5-Book Torah-arc curriculum** (Genesis→Exodus→Leviticus→Numbers→Deuteronomy mapped onto the same 7 stages) that differs from the existing 20-week `docs/CURRICULUM.md`: DARES (old Stage 6) moves to precede River-Fish-Tank/Community (old Stage 5) — "wire the systems before deploying them to convert a tribe." User said to "adopt and implement" this structure.
- **Did not rewrite the 30 existing lessons from scratch** — they're detailed, on-voice, and already seeded. Instead wrote a second migration (`20260709120000_restructure_curriculum_covenant_engine.sql`) that only re-titles modules, swaps `sort_order` for the two modules that swap position, moves 3 lessons between modules via `UPDATE ... SET module_id`, and inserts 2 net-new lessons the blueprint required (`swot-4ps-framework`, `platform-choosing-your-canaan`). Never touched the original seed migration — additive only, per the "never edit migrations" rule.
- **`modules`/`lessons` have no UNIQUE constraint on `(product_id/module_id, sort_order)`** — only `UNIQUE(module_id, slug)` and a non-unique index. This meant lesson moves and renumbers could use simple explicit `sort_order` UPDATEs without worrying about transient collisions during the migration — no need for a temporary-offset dance.
- **Both migrations still need `supabase db push` (or dashboard SQL editor) against the live project** — writing the migration file does not seed prod. Flagged in BLOCKERS.md and CURRICULUM.md; verify before selling the R18,000 programme.
- **Saved the full source blueprint verbatim to `docs/COVENANT-ENGINE.md`** with an inline status header marking each section ✅ already-built / 📋 reference-only / ❌ not-yet-built, so it doesn't silently go stale like BLOCKERS.md did. Real remaining gap surfaced by this doc: **LMS drip-delivery (week-gating) is not implemented** — `lms.functions.ts` has `sort_order` but no date-based unlock logic; all modules are visible immediately after `product_grants` exists. Next real build target if this matters before cohort launch.
- **`contentpreneur-vip-tier` (R45,000) still has 0 modules/0 lessons** — the restructure only touched `contentpreneur-90day-cohort`. Not addressed this session; flagged in BLOCKERS.md.

## 2026-07-09 (later same session) — built the remaining Covenant Engine funnel gaps: LMS drip-delivery, WhatsApp support panel, email copy, Zoom script reconciliation

- **LMS drip-delivery (real code, not just docs) — `20260709130000_lms_drip_delivery.sql`:** added `modules.unlock_week integer NOT NULL DEFAULT 1` (safe no-op for every other product) + explicit week map for `contentpreneur-90day-cohort`'s 7 modules matching the 12-week Torah-arc structure (1,3,5,7,8,10,11). Gate lives in `lms.functions.ts` `getLessonBody`: computes `currentCohortWeek()` from `product_grants.granted_at` (already existed, no new table needed), compares to the lesson's module `unlock_week`, and returns a new `dripLocked: true` + `unlocksAt` response shape distinct from the existing `locked: true` (no-purchase) shape. Admins and `is_preview` lessons always bypass. Course listing (`learn.$slug.index.tsx`) and lesson page (`learn.$slug.$lessonSlug.tsx`) both updated to show "Unlocks Week N" instead of a generic lock/paywall message. Admin curriculum builder (`admin.curriculum.$productSlug.tsx`) got a small inline `unlock_week` number input per module.
- **Supabase generated types don't auto-update from hand-written migrations** — `bunx tsc --noEmit` failed with `Type 'number' is not assignable to type 'never'` on the new `unlock_week` field because `src/integrations/supabase/types.ts` is a generated snapshot that doesn't know about columns added outside `supabase gen types`. Fixed by hand-editing the `modules` Row/Insert/Update types to add `unlock_week: number`. **Remember this pattern:** any new migration that adds a column will need a matching manual edit to `types.ts` until someone runs `supabase gen types typescript` against the live (post-migration) database — don't assume tsc passing means the DB and the types file agree; it only means the *file* is internally consistent.
- **WhatsApp click-to-chat panel** — added directly to `SiteFooter` in `src/components/member-shell.tsx` (fixed-position, so mounting inside the footer still floats correctly over the whole page). Fully env-gated on `VITE_WHATSAPP_SUPPORT_NUMBER` — renders nothing if unset, so it ships safely with zero owner action, but **the owner still needs to set a real WhatsApp Business number** in `.env`/Cloudflare before it appears. No number was fabricated.
- **MailerLite integration ceiling confirmed:** `src/lib/mailerlite.ts` only calls `POST /api/subscribers` to add someone to a group (to *trigger* an automation) — there is no code path to create campaign/automation content via API. This means the 5-email sequence could only be **written**, not **deployed live**, from this session — saved to `docs/EMAIL-SEQUENCE.md` as ready-to-paste copy with a MailerLite setup checklist. Don't attempt to "finish" this task by hitting the MailerLite API to create automations — that's a live, externally-visible action (real emails to real subscribers) that needs the owner's hands regardless.
- **Reconciled two competing sales scripts instead of picking one:** `docs/SALES-PIPELINE.md` (existing, 12-step, verified figures, already had the SARS R207,879 warning) was clearly the more mature source of truth vs. the blueprint's simpler 7-step Zoom script in `docs/COVENANT-ENGINE.md` §7 — so merged the blueprint's more specific line-level scripts (the sector-specific opportunity-cost example, the explicit "state the price then mute your microphone" instruction, a new "Commitment Lock" bridge step between Insight and Offer) INTO `SALES-PIPELINE.md` rather than replacing it, and marked COVENANT-ENGINE.md §7 as "✅ Reconciled" pointing back to the canonical doc.
- **Surfaced a real pricing conflict while touching `SALES-PIPELINE.md`:** VIP tier is R25,000 there vs. R45,000 in `docs/PRODUCTS.md`/the DB. Did not resolve it (out of scope, no way to know which is correct) — flagged inline in both docs so nobody quotes the wrong number on a discovery call.
- **Corrected `docs/SALES-PIPELINE.md`'s remaining "By Week 20" transformation statement** to "By Week 12" to match the adopted curriculum timeline (found via grep sweep after the curriculum restructure — worth re-grepping `Week 20`/`20 weeks`/`20-week` across `docs/` after any future timeline change, since these references hide in prose, not just tables).

## 2026-07-30 — Quick View mobile-fit bug fix, second/third leaked-migration-note sweep, ops alerting build, ManyChat DM automation strategy (plan-only, no code)

- **Quick View modal broken on mobile (real founder-caught bug via screenshot):** root cause was `sm:max-h-[85vh]` only applying at the `sm:` breakpoint, leaving a `fixed inset-0 ... items-center` backdrop with NO height cap on mobile — close button and Add to Cart were both clipped off-screen with no way to reach either. Fix (`src/components/ProductQuickView.tsx`): backdrop itself now scrolls (`overflow-y-auto` on the fixed backdrop, not `items-center` directly on it — that clips whichever end overflows first); close button moved OUT of the card to be a direct `fixed` child of the backdrop so it survives scroll; added a `flex min-h-full items-center justify-center` wrapper around the card so it centers when content fits and lets the backdrop scroll when it doesn't; card scrolls as one unit on mobile, height-capped + independently-scrolling text pane on `sm:`+. New `.visible-scrollbar` utility added to `src/styles.css` (sibling to `.no-scrollbar`) for cross-browser visible scrollbars on both the backdrop and text pane.
- **My own prior "81/81 responsive checks passed" audit had a real blind spot: it only measured horizontal overflow** (`scrollWidth` vs `clientWidth`), which says nothing about whether a fixed-position modal's content is vertically reachable on a short viewport. **Rule going forward: auditing a modal needs a real interaction test (scroll-to-element, confirm visible, click) not just a layout-overflow metric.**
- **`products.$slug.tsx` restructured to match the real Shopify product page exactly** (per 3 founder screenshots): price row reordered to compare-price→current price→Sale badge; "Taxes included. Instant digital delivery." added under price; Add to Cart/Buy Now moved to sit immediately after price (was buried lower in a bordered box); removed the separately-boxed "Why this exists"/"What you get"/metadata-grid sections in favor of one continuous flowing text block matching real product-page copy density. Verified live via Playwright screenshots on a 390×844 viewport against `chkplt.com/products/what-to-post`.
- **Found a SECOND and THIRD leaked internal migration-authoring note** in live product `description` fields (same failure pattern as `creator-starter-bundle` fixed earlier) — `content-creator-starter-system` and `sars-creator-income` both had raw internal migration notes ("Source PDF not found... NAME COLLISION FLAG...") showing to real customers. Fixed via migration `20260729230000_fix_more_leaked_migration_notes.sql`, then **proactively re-swept ALL 22 products** for the same leak-pattern keywords (migration/flag/not found/sourcing/collision/placeholder/TBD etc.) — zero remaining hits. **Lesson: when a founder reports one instance of a bug pattern, sweep the whole catalog for the same pattern rather than waiting for them to find each instance individually.**
- **Ops alerting built (`src/lib/alerts.ts` — `sendOpsAlert()`):** critical errors (`reportError()` with `severity:"critical"`) now also email `OPS_ALERT_EMAIL` directly via Resend — deliberately bypassing the pgmq transactional-email queue, since an alert about the system being broken can't depend on the same queue/cron it might be alerting about. Rate-limited by querying the existing `incidents` table for prior matching `endpoint`+`severity` rows in the last 15 minutes (no new table needed). Wired into `error-logger.ts`, both webhook handlers (`paystack-webhook.ts`, `stripe-webhook.ts`), and both cron handlers in `server.ts` (now alerts on non-throwing `{ok:false}` failures too, not just thrown exceptions — previously invisible even to console.error). `OPS_ALERT_EMAIL` set as a Cloudflare Worker secret + documented in `.env.example`.
- **Couldn't safely test the new alerting pipeline's real failure path** (faking a valid Paystack webhook signature needs the real secret; deliberately breaking a live payment secret to force a real failure is exactly the destructive-production-test to avoid). Resolved by adding a permanent, legitimate "Send test alert" button on `/admin/incidents` (`sendTestAlert` server fn, admin-gated, uses a unique per-click endpoint string so it bypasses dedup without polluting the incidents table with fake rows) instead of skipping verification. **Still open: founder has not yet confirmed receiving the test email.**
- **ManyChat DM automation strategy — plan-only, no code shipped this arc.** Founder wants IG/FB/TikTok DM automation (keyword→AI-segment→route) wired to the REAL funnel, not a generic course example. Full plan saved at `~/.claude/plans/stop-building-you-are-whimsical-shannon.md`. Key verified facts (via WebSearch against ManyChat's own docs/community forum, not assumed): (1) IG/FB fully support comment-to-DM + AI Step; (2) **TikTok comment-to-DM is NOT available in South Africa** (only Vietnam/Thailand/Indonesia) — TikTok content must say "DM me ___" not "comment ___"; TikTok automation requires a Business account; (3) **ManyChat's public API has NO endpoint to create/edit Flows** — confirmed via their own community forum as a repeatedly-requested, still-unshipped feature. API access would only enable subscriber sync + triggering an already-built flow, never authoring flow logic. (4) ManyChat DOES have "Start Automation"/"Start a Flow" (hand off between flows) and a separate "Automation → Rules" tab (centralized keyword→flow mapping) — this became the basis of a scalable "Hub + Spokes" architecture (ONE Hub flow does the real AI segmentation once; MANY tiny Spoke flows, one per video/keyword, each just deliver that video's asset then hand off to the Hub) so the founder isn't rebuilding full logic for every new video.
- **Founder correction (critical, now saved to persistent memory — see `feedback_knowledge_entrepreneur_naming.md`):** ICP 1 is called **"Knowledge Entrepreneurs"** in anything spoken/written — NOT "Called Expert" (that term is stale in the global CLAUDE.md; existing code artifacts like `called-expert-foundation-kit` slugs stay as-is, only the spoken label changed). Funnel structure confirmed: **Starter Kit (free) → Foundation Kit (paid) → Accelerator PRO (core offer)** is PRIMARY, hosted on contentpreneur.africa; chkplt.com's marketplace is the SECONDARY/fallback storefront for people who don't qualify or are ICP 2.
- **Corrected the founder's own stated URL** in the plan: they wrote `chkplt.com/tools/ratecard`, but the real live route is `chkplt.com/rate-card` (`/tools` is the hub/index page, not the tool itself). General principle documented in the plan: always copy destination URLs from the live browser address bar when building a new ManyChat Spoke, never reconstruct from memory.
