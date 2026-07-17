# CHKPLT — The 5-Day Email Nurture Sequence (Ready to Paste into MailerLite)

> Reconciles `docs/COVENANT-ENGINE.md` §5.3 (the detailed blueprint draft) with
> `docs/SALES-PIPELINE.md` STEP 6 (the operational summary already in the sales SOP).
> This file is the single canonical copy — paste directly into MailerLite. Nothing in
> this repo can push it live automatically (`src/lib/mailerlite.ts` only adds subscribers
> to a group to *trigger* an automation you build in MailerLite's UI — it does not create
> campaign content via API). Build this sequence once, by hand, in MailerLite → Automations.

**Trigger:** subscriber added to a MailerLite group after a ManyChat keyword delivery
(GUIDE / START / PAIDS / MEDIA / SYSTEM — see `docs/SALES-PIPELINE.md` STEP 4).
**Send time:** 9am SAST. **Minimum gap:** 2 days between emails. **Reply-to:** chiefmuhanelwa@gmail.com.

---

## Email 1 (Day 0) — "Your system is inside 🌱"

**Subject:** Your Content Architecture Template is inside
**Preview text:** Plus — what I actually build here (it's not what you think)

Hey [First Name],

Here's your download: **[LEAD MAGNET LINK]**

Before you open it, three sentences on what this actually is:

I don't teach viral metrics. I build sovereign digital assets — systems that make money whether or not an algorithm feels like showing your post to anyone today. Everything I send you over the next 8 days is built from what actually worked for me, not what sounds good in a webinar.

You're on this list because you commented a keyword or downloaded something specific. That means you're sitting on expertise — a job, a skill, years in a field — and you haven't figured out how to turn it into income yet. That's exactly who this is for.

**Reply to this email and tell me: what's the single biggest skill you want to monetise this year?**

I read every reply myself.

— Ndivhuwo

---

## Email 2 (Day 2) — "The three-part equation killing your reach"

**Subject:** Why your expertise isn't making you money (it's not what you think)
**Preview text:** Mindset × Toolset × Skillset — if one is zero, all of it is zero

Hey [First Name],

Here's a formula: **Mindset × Toolset × Skillset = Digital Asset.**

Notice it's multiplication, not addition. That matters. If any one of the three is at zero, the whole equation is zero — no matter how strong the other two are.

Here's what that looks like in real life: a nurse with 12 years of ICU experience (Skillset: 9/10) buys a R15,000 camera and lighting kit (Toolset: 8/10) — and still posts nothing, because imposter syndrome has her Mindset at zero. "Who am I to teach this? I'm not a content creator." The equation collapses. Nine times eight times zero is still zero.

Most people try to fix this by buying more tools. Wrong lever. Fix Mindset first — believe the knowledge is worth paying for — then build the Skillset (packaging, storytelling, selling), and only then does Toolset actually amplify anything.

**Reply and tell me: which of the three — Mindset, Toolset, or Skillset — is your actual zero right now?**

— Ndivhuwo

---

## Email 3 (Day 4) — "100,000 followers and R47 in my account"

**Subject:** The follower count that meant nothing
**Preview text:** No links today. Just the truth.

[First Name],

I'm not going to sell you anything in this email.

There was a point where the numbers looked good from the outside — a growing audience, brand deals coming in — and my account still sat at **R47**. Lowest point I can remember. Followers don't pay rent.

Later, a different kind of number hit: **Instagram suspended the account in August 2025. 780,000 followers, gone, in 24 hours. No warning, no appeal window, no timeline.**

That's rented land. The algorithm is the landlord. It can evict you with no notice, and there's no court you can appeal to.

What survived that suspension: the email list. Same list you're reading this on right now. Owned land — nobody can suspend it, shadowban it, or change the rules on it overnight.

There's also a tax story I don't tell often — a SARS assessment that hit R207,879.20 because income was coming in with nobody telling me to set 25% aside. That got resolved (down to R162,174.14 after an amended-returns objection), but it cost eleven months of payments and a lesson I'll never unlearn: **untracked income becomes a debt with your name on it.**

No CTA today. Just: protect what you're building. Don't build only on land you don't own.

— Ndivhuwo

---

## Email 4 (Day 6) — "What 90 days of structured building actually looks like"

**Subject:** From unpackaged expertise to her first R25,000
**Preview text:** No hype. Just what she actually did, in order.

[First Name],

Quick story about what's possible when someone stops guessing and installs an actual system.

A corporate professional — 15 years in her field, zero content history — went through the exact 7-stage system I run every cohort through:

1. Mapped her expertise honestly (MS×TS×SS audit — found her real blocker was mindset, not skill)
2. Ran her SWOT and named ONE niche instead of trying to serve everyone
3. Built a 30-day content calendar using the 4E ratios (Educate/Entertain/Encourage/Earn)
4. Picked ONE platform and stopped being mediocre on five
5. Wired one automated lead capture — nothing fancy, just consistent
6. Launched her first paid offer using the 72-hour protocol
7. Landed her first paid advisory engagement: **R25,000** — from a system, not luck

None of this required her to quit her job first. It ran alongside it.

**Reply "SHOW ME" and I'll walk you through exactly which stage you'd start at.**

— Ndivhuwo

---

## Email 5 (Day 8) — "Is this your season?"

**Subject:** The Contentpreneur Accelerator — applications open
**Preview text:** Not for everyone. Read the next line before you click.

[First Name],

This one's a direct invitation, so I'll be direct back.

This is not for beginners looking for a side-hustle trick. It's not for anyone chasing a viral moment. And it's not for anyone who wants to separate their faith from their business strategy — that's not how I operate, and it's not how this room operates either.

This is an implementation room for seasoned professionals — people with real expertise already built — who are ready to install the architecture around it: **The Contentpreneur Accelerator PRO.** 12 weeks. R18,000 once, or R6,500 × 3 if cash flow needs the flex.

If any part of the last 4 emails made you think "that's me" — the application takes 10 minutes: **[APPLY LINK → /apply]**

If it's not your season, no hard feelings — reply and let me know, and I'll keep sending you the free frameworks instead.

— Ndivhuwo

---

## MailerLite Setup Checklist

- [ ] Create one Automation triggered by "subscriber added to group" for each lead-magnet group (`MAILERLITE_GROUP_ID_FREE_*` in `.env.example`)
- [ ] Load these 5 emails in order with delays: Day 0 (instant), Day 2, Day 4, Day 6, Day 8
- [ ] Set sender name "Ndivhuwo Muhanelwa · NOCHILL", reply-to `chiefmuhanelwa@gmail.com`
- [ ] Tag any reply containing "job", "salary", "expertise", "qualification", "teaching", or "professional" → `called-expert-potential` (per `docs/SALES-PIPELINE.md` STEP 6) → route to the Contentpreneur Blueprint sequence
- [ ] Test the full sequence on a personal test email before turning it on for real subscribers
