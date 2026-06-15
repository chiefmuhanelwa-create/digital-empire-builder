-- =============================================================================
-- SEED CURRICULUM: Called Expert Accelerator PRO (contentpreneur-90day-cohort)
-- 7 modules · 30 lessons — full Kingdom Contentpreneur Transformation System™
-- Idempotent: skips insert if the module already exists (checks by title).
-- =============================================================================

DO $$
DECLARE
  v_product_id uuid;
  v_m1 uuid; v_m2 uuid; v_m3 uuid; v_m4 uuid;
  v_m5 uuid; v_m6 uuid; v_m7 uuid;
BEGIN
  -- Resolve product
  SELECT id INTO v_product_id FROM public.products
  WHERE slug = 'contentpreneur-90day-cohort' LIMIT 1;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'Product contentpreneur-90day-cohort not found — run product seed first.';
  END IF;

  -- -------------------------------------------------------------------------
  -- MODULE 1: STAGE 1 — Foundation: MS×TS×SS (Weeks 1–2)
  -- -------------------------------------------------------------------------
  INSERT INTO public.modules (id, product_id, title, summary, sort_order)
  VALUES (gen_random_uuid(), v_product_id,
    'Stage 1: Foundation — MS×TS×SS',
    'Right Mindset + Core Skills + Essential Tools installed. MS × TS × SS = multiplication, not addition. Any zero = zero result.',
    1)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_m1;

  IF v_m1 IS NULL THEN
    SELECT id INTO v_m1 FROM public.modules
    WHERE product_id = v_product_id AND sort_order = 1 LIMIT 1;
  END IF;

  INSERT INTO public.lessons (module_id, slug, title, summary, body_md, sort_order) VALUES
  (v_m1, 'mindset-3cs-assessment', 'The 3Cs Mindset Assessment',
    'Score yourself on Create, Collaborate, Contribute. Find your mindset baseline.',
    E'## The 3Cs Mindset Assessment\n\n**Proverbs 4:7** — *"Wisdom is the principal thing; therefore get wisdom."*\n\n### The Three Questions\n\n**Create:** Do you believe your knowledge has value worth paying for?\n\n**Collaborate:** Do you see other creators as threats or complements?\n\n**Contribute:** Do you serve without needing reciprocity?\n\n### Scoring\n- 1–3: Scarcity mindset\n- 4–6: Mixed — awareness is growing\n- 7–10: Abundance — you\'re ready to build\n\n### Your Assignment\nScore yourself honestly in each C (1–10). Total out of 30.\n\nIf you scored below 70% — that\'s not a failure. That\'s your starting point. Write a one-paragraph improvement plan for your lowest score before moving to Lesson 2.\n\n**Completion:** Score 70+/100 OR documented improvement plan.',
    1),

  (v_m1, 'mindset-salary-trap', 'Breaking the Salary Trap Mindset',
    'The old model is broken. Reframe your relationship with income, expertise, and time.',
    E'## Breaking the Salary Trap Mindset\n\n### The Old Model\nSchool → Job → Salary → Retirement → Death\n\nThis model worked when one company employed you for 40 years. That company no longer exists.\n\n### The New Model\nVision → Asset Build → Recurring Revenue → Freedom → Legacy\n\nYou are not building a job. You are building an asset that works when you sleep.\n\n### The Reframe\n**"Your knowledge is worth more than your salary."**\n\nYour salary is someone else\'s calculation of your minimum acceptable number. Your knowledge — packaged correctly — is your own calculation of your maximum possible value.\n\n### Your Assignment\nWrite your Vision Statement:\n\n*"By [specific date] I will [specific outcome] for [specific person] using [specific asset]."*\n\nExample: "By December 2026 I will generate R15,000/month helping corporate finance professionals monetise their expertise through an online course — without quitting their jobs."\n\nPaste yours in the community. Make it specific. Vague visions produce vague results.',
    2),

  (v_m1, 'mindset-10-shadow-fears', 'The 10 Shadow Fears',
    'Name what is actually holding you back. Until you name it, it runs you.',
    E'## The 10 Shadow Fears\n\nEvery Called Expert stalls for one of ten reasons. None of them are logical. All of them are survivable.\n\n| Fear | The Whisper |\n|------|-------------|\n| SF1 — Wasted Life | "What if this was all for nothing?" |\n| SF2 — Financial Ceiling | "What if I never break through?" |\n| SF3 — Imposter Syndrome | "What if I\'m not qualified enough?" |\n| SF4 — Generational Poverty | "What if I can\'t change my family\'s story?" |\n| SF5 — Insignificance | "What if nobody cares what I know?" |\n| SF6 — Wrong Path Terror | "What if I\'m on the wrong mountain?" |\n| SF7 — Public Failure | "What if I fail publicly?" |\n| SF8 — Spiritual Crisis | "What if this isn\'t God\'s will?" |\n| SF9 — Platform Dependency | "What if they take it all away again?" |\n| SF10 — Legacy Void | "What if I leave nothing?" |\n\n### The Framework\n1. **Name the fear** — say it out loud or write it\n2. **Locate it in your story** — when did this start? What happened?\n3. **Uproot it with proof** — find one piece of evidence that contradicts the fear\n\n### Your Assignment\nIdentify your #1 shadow fear. Write 3 sentences:\n1. The fear (verbatim — say what it actually says)\n2. Where it came from\n3. One proof point that says it\'s a liar',
    3),

  (v_m1, 'skillset-7-core-skills', 'The 7 Core Contentpreneur Skills',
    'Self-audit against the seven skills that determine your ceiling. Your lowest score is your biggest constraint.',
    E'## The 7 Core Contentpreneur Skills\n\nRate yourself 1–10 in each. Be honest. The gaps are not shameful — they\'re your curriculum.\n\n| # | Skill | What It Means |\n|---|-------|---------------|\n| 1 | **Packaging** | Turning knowledge into products people pay for |\n| 2 | **Storytelling** | Making people feel something with information |\n| 3 | **Selling** | Communicating value so clearly "no" feels irrational |\n| 4 | **System-building** | Creating processes that work without your daily input |\n| 5 | **Copywriting** | Words that convert: hooks, captions, emails, sales pages |\n| 6 | **Video production** | Camera presence, editing, audio quality |\n| 7 | **Community building** | Creating belonging, not just audience |\n\n### The Rule\nYour lowest score is your biggest constraint. Fix that first.\n\nIf your Packaging score is a 3, buying a better camera is irrelevant. If your Storytelling is a 9 but your Selling is a 2, you\'re giving away results for free.\n\n### Your Assignment\nScore each skill. Circle your lowest two. Name one specific action you will take in the next 7 days to move each one up by 1 point.',
    4),

  (v_m1, 'skillset-upgrade-sequence', 'The Upgrade Sequence',
    'Why most creators fail: they buy tools first. The right sequence is Mindset → Skillset → Toolset.',
    E'## The Upgrade Sequence\n\n**Most creators do this:** Buy tools first → get overwhelmed → blame the tools → quit.\n\n**The right sequence:**\n1. **Mindset** (MS) — believe the work is possible and worth doing\n2. **Skillset** (SS) — build real skill (this creates evidence that fights the shadow fears)\n3. **Toolset** (TS) — now tools amplify what you can already do\n\nWhen you reverse the sequence, tools become procrastination. A R5,000 camera does not make you a better storyteller. Telling 100 stories makes you a better storyteller.\n\n**The multiplication:** MS × TS × SS. Not MS + TS + SS.\n\nIf any of the three is zero, the result is zero. All three must be active and growing simultaneously. But the sequence of *investment* matters — mindset first, then skill, then tool.',
    5),

  (v_m1, 'toolset-essential-setup', 'Essential Tools Setup',
    'The minimum viable toolstack. Set this up before Week 3 or nothing else moves.',
    E'## Essential Tools Setup\n\n| Category | Tool | Cost |\n|----------|------|------|\n| Content Creation | CapCut / Canva Pro | Free / R150/mo |\n| AI Assistant | Claude + ChatGPT Plus | R200/mo + R350/mo |\n| Email Marketing | MailerLite | Free to 1K subscribers |\n| Landing Pages | CHKPLT (you own it) | Already built |\n| Automation | Make.com | R200/mo |\n| Community | WhatsApp | Free |\n| Analytics | Native platform analytics | Free |\n\n### The Asset Funnel (must be live before Week 3)\n\n```\nLead Magnet Landing Page\n  → Email Sequence (5 emails minimum)\n  → Product Page\n  → Thank You / Access Delivered\n```\n\n**This funnel must be live — not planned, not drafted — before you move to Stage 2.**\n\n### Stage 1 Checkpoint — Both Required\n- ✅ 3Cs Mindset score 70+/100 OR improvement plan documented\n- ✅ All 7 skills self-assessed + growth plan for your lowest two\n- ✅ All tools installed + basic funnel live',
    6)
  ON CONFLICT (module_id, slug) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- MODULE 2: STAGE 2 — Self-Awareness: SWOT Analysis (Week 3)
  -- -------------------------------------------------------------------------
  INSERT INTO public.modules (id, product_id, title, summary, sort_order)
  VALUES (gen_random_uuid(), v_product_id,
    'Stage 2: Self-Awareness — SWOT Analysis',
    'Know your exact strengths, weaknesses, opportunities, and threats as a Called Expert.',
    2)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_m2;

  IF v_m2 IS NULL THEN
    SELECT id INTO v_m2 FROM public.modules
    WHERE product_id = v_product_id AND sort_order = 2 LIMIT 1;
  END IF;

  INSERT INTO public.lessons (module_id, slug, title, summary, body_md, sort_order) VALUES
  (v_m2, 'swot-called-expert', 'The Called Expert SWOT',
    'A SWOT framework built for contentpreneurs — not generic business strategy.',
    E'## The Called Expert SWOT\n\n**Proverbs 27:23** — *"Know the state of your flocks, give careful attention to your herds."*\n\nThis is not the generic business SWOT. This is the version built for someone who has expertise, has an audience (even a small one), and is trying to monetise — without starting from zero.\n\n### Strengths (what you already have)\n- Existing credentials, expertise, years of domain experience\n- Audience — even 500 people who know you is an asset\n- Relationships — your professional network is your first market\n- Content already created — what can be packaged right now?\n\n### Weaknesses (what is limiting you)\n- Skills gaps — which of the 7 skills is below 6/10?\n- Platform dependency — is your audience only on rented land?\n- Pricing paralysis — are you charging based on fear or value?\n- Time constraints — how many hours per week are genuinely available?\n\n### Opportunities (what you are ignoring)\n- Monetisation channels currently active but unused (run a PAIDS audit)\n- Underserved sub-niche within your expertise\n- Collaboration potential — who in your network serves adjacent needs?\n- Content you can repurpose into products today\n\n### Threats (what could break you)\n- Platform changes — algorithm shifts, account suspension (Instagram, August 2025: 780K followers gone in 24 hours)\n- Competitor positioning — who else is in your space and what do they charge?\n- Economic pressures — SARS obligations, tool costs, data costs\n- Personal blockers — imposter syndrome specific to your professional sector\n\n### Your Assignment\nComplete a full SWOT document. Minimum 3 points per quadrant. Be specific — not "I\'m good at my job" but "I have 12 years of ICU nursing experience and nobody is teaching ICU nurses how to monetise their clinical knowledge online."',
    1),

  (v_m2, 'swot-3-strategic-priorities', 'The 3 Strategic Priorities',
    'Distil your SWOT into the single most important actions for this quarter.',
    E'## The 3 Strategic Priorities\n\nAfter your SWOT is complete, you have a list. Lists do not build businesses — decisions do.\n\nFrom your full SWOT, extract the single biggest:\n\n1. **Strength to amplify this quarter** — "I will leverage my [strength] to [specific outcome] by [date]."\n2. **Weakness to address this quarter** — "I will improve [weakness] by [specific action] by [date]."\n3. **Opportunity to activate this quarter** — "I will act on [opportunity] by [specific step] by [date]."\n\n**The rule:** One priority per quadrant. Not three. One. The person who tries to fix all their weaknesses at once fixes none of them.\n\n### Stage 2 Checkpoint — Both Required\n- ✅ Full SWOT document completed (minimum 3 points per quadrant)\n- ✅ 3 strategic priorities named, dated, and shared in the community',
    2)
  ON CONFLICT (module_id, slug) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- MODULE 3: STAGE 3 — Content Strategy: 4Es Framework (Week 4)
  -- -------------------------------------------------------------------------
  INSERT INTO public.modules (id, product_id, title, summary, sort_order)
  VALUES (gen_random_uuid(), v_product_id,
    'Stage 3: Content Strategy — 4Es Framework',
    'Clear content path, message, and platform strategy. Know what to post, why, and in what ratio.',
    3)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_m3;

  IF v_m3 IS NULL THEN
    SELECT id INTO v_m3 FROM public.modules
    WHERE product_id = v_product_id AND sort_order = 3 LIMIT 1;
  END IF;

  INSERT INTO public.lessons (module_id, slug, title, summary, body_md, sort_order) VALUES
  (v_m3, 'content-4e-ratios', 'The 4E Ratios',
    'Educate 35% · Entertain 30% · Encourage 20% · Earn 15%. Violate this and trust breaks.',
    E'## The 4E Ratios\n\n**Ecclesiastes 3:1** — *"There is a time for everything, and a season for every activity."*\n\n| E | Ratio | Purpose |\n|---|-------|---------|\n| Educate | 35% | Framework teaching, how-tos, breakdowns |\n| Entertain | 30% | Stories, behind-the-scenes, relatable struggles |\n| Encourage | 20% | Transformation proof, testimonials, wins |\n| Earn | 15% | CTAs, product mentions, offers |\n\n**If Earn exceeds 20% — trust breaks.** Your audience will smell the pitch before you make it and disengage.\n\n**If Earn = 0% — it\'s a hobby.** You are running a charity. Content without a product attached to it is a donation of your time.\n\nThe ratio matters because it *earns the right* to sell. Every Educate and Entertain post is a trust deposit. Earn posts are withdrawals. Keep the account full.\n\n### Your Assignment\nAudit your last 10 posts. Categorise each as E, E, E, or E. What\'s your current ratio? What needs to shift?',
    1),

  (v_m3, 'content-called-expert-ratio', 'Called Expert Content Ratio (4E Adjusted)',
    'ICP 1 audiences respond differently. The ratios shift for professionals with existing credibility.',
    E'## Called Expert Content Ratio\n\nThe standard 4E ratio is built for ICP 2 (content creators). Called Experts (ICP 1) are a different audience — they are professionals who already know things. They respond to credentialled frameworks, not entertainment-first content.\n\n**Called Expert Adjusted Ratios:**\n- 50% **Educate** — they want frameworks, systems, and credentialled knowledge\n- 25% **Encourage** — proof it works for professionals exactly like them\n- 15% **Earn** — clear, specific, respectful CTAs\n- 10% **Entertain** — humanising stories, behind the scenes\n\n**Why the shift?** The Called Expert is not scrolling to be entertained. They are on LinkedIn or a podcast looking for answers to problems they already know they have. Give them the answer — fast, structured, credentialled. The entertainment can wait.',
    2),

  (v_m3, 'content-niche-statement', 'Niche Statement Formula',
    'Write the one sentence that makes your ICP say "that\'s me."',
    E'## Niche Statement Formula\n\n**Format:**\n\n*"I help [specific person] achieve [specific outcome] through [specific method] in [specific timeframe]."*\n\n### Why Specificity Wins\n- "I help people make money online" — ignored\n- "I help SA nurses generate R10,000/month from their clinical knowledge through digital courses — without quitting their jobs" — they DM you immediately\n\nBroadness is a protection mechanism. "I help everyone" means you are afraid of losing someone. But broad messaging loses everyone because no one feels spoken to.\n\n### Your Assignment\nWrite 3 versions of your niche statement. Test each one on a real person from your target audience (not your best friend — an actual potential client). Pick the one that makes them say "that\'s me."\n\n**The test:** If they say "oh, do you mean like [their specific situation]?" — you\'ve hit the target.',
    3),

  (v_m3, 'content-30day-calendar', 'The 30-Day Content Calendar',
    'Build a full month using 4E ratios before a single post goes live.',
    E'## The 30-Day Content Calendar\n\n### The Weekly Structure (using 4E ratios)\n- **Mondays:** Educate — framework breakdown or how-to\n- **Tuesdays:** Entertain — story or behind-the-scenes\n- **Wednesdays:** Educate — system breakdown or process walkthrough\n- **Thursdays:** Encourage — transformation proof or client win\n- **Fridays:** Earn — product mention or soft CTA\n- **Weekends:** Rest OR bonus Encourage\n\n### Why Build 30 Days in Advance?\nCreators who plan 30 days ahead post consistently. Creators who decide "what to post today" post sporadically. Sporadically is invisible.\n\nConsistency beats quality at the start. A 6/10 post published every day beats a 10/10 post published once a month.\n\n### Stage 3 Checkpoint — Both Required\n- ✅ 30-day content calendar built with 4E ratios\n- ✅ Niche statement confirmed — tested on at least 2 real people from your ICP',
    4)
  ON CONFLICT (module_id, slug) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- MODULE 4: STAGE 4 — Audience Building: Social Media / The Ocean (Weeks 5–8)
  -- -------------------------------------------------------------------------
  INSERT INTO public.modules (id, product_id, title, summary, sort_order)
  VALUES (gen_random_uuid(), v_product_id,
    'Stage 4: Audience Building — Social Media / The Ocean',
    'Consistent follower growth on one primary platform. Move fish from the river into your tank.',
    4)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_m4;

  IF v_m4 IS NULL THEN
    SELECT id INTO v_m4 FROM public.modules
    WHERE product_id = v_product_id AND sort_order = 4 LIMIT 1;
  END IF;

  INSERT INTO public.lessons (module_id, slug, title, summary, body_md, sort_order) VALUES
  (v_m4, 'audience-river-fish-tank', 'The River–Fish–Tank Model',
    'Every piece of content has one job: move fish from the river into your tank.',
    E'## The River–Fish–Tank Model\n\n**Luke 5:4** — *"Launch out into the deep and let down your nets."*\n\n| Element | What It Is | Who Controls It |\n|---------|-----------|------------------|\n| River | Social platforms (Instagram, TikTok, LinkedIn) | The platform controls it |\n| Fish | Your audience | Free, moving, unowned |\n| Bait | Your content | You control it |\n| Tank | Email list, WhatsApp, CHKPLT | You own it |\n\n**The lesson Instagram taught in August 2025:**\n\n780,000 followers. Gone in 24 hours. No warning. No appeal. No recovery timeline.\n\nThat was the river. Rented land.\n\nThe tank — 4,895 email subscribers — was untouched. That\'s owned land.\n\n**The goal of every piece of content:** Move fish from the river into your tank. Not just views. Not just likes. Movement.\n\n### Your Assignment\nAudit your current platform presence. What percentage of your audience is in your tank (email, WhatsApp, owned platform) vs. the river (Instagram, TikTok, LinkedIn, Facebook)?',
    1),

  (v_m4, 'audience-hslfcta-formula', 'The Hook–Story–Lesson–Framework–CTA Formula',
    'Every piece of content follows this exact arc. Learn it once, apply it forever.',
    E'## The Hook–Story–Lesson–Framework–CTA Formula\n\nEvery piece of content — short or long, video or text — follows this structure:\n\n1. **Hook** (0–3 sec) — Stop the scroll. Pattern interrupt. One sentence maximum.\n2. **Story** (3–40 sec) — One specific real moment. Date. Amount. What happened.\n3. **Lesson** (15–30 sec) — One clear takeaway extracted from the story.\n4. **Framework** (if long-form) — The repeatable system behind the lesson.\n5. **CTA** (5 sec) — ONE action. Comment a word. DM a keyword. Click the link.\n\n**The hard rule:** ONE call to action. Not "like, comment, share, follow, and click the link in bio." One.\n\n### Why This Works\nThe story earns the right to teach. The lesson earns the right to present a framework. The framework earns the right to sell. Skip any step and you are either a teacher without an audience or a salesperson without trust.\n\n### Your Assignment\nWrite one piece of content using this formula before moving to the next lesson. It does not have to be perfect. It has to be done.',
    2),

  (v_m4, 'audience-racub-hook-formula', 'The R×A×C×U^B Hook Formula',
    'The four elements of a scroll-stopping hook. Build every opener from this formula.',
    E'## The R×A×C×U^B Hook Formula\n\n- **R = Relevant** — speaks to one specific person\'s specific situation\n- **A = Aware** — matches their current problem awareness level\n- **C = Clear Outcome** — specific, believable result stated explicitly\n- **U^B = Unique^Broadened** — pattern interrupt that still reaches a wide audience\n\n### The 4 Hook Types (Only These)\n\n1. **Information Gap** — "Here\'s what brands never tell creators about pricing"\n2. **Desired Result** — "How to turn one brand deal into 18 months of retainer income"\n3. **Undesired Result** — "What saying yes to R2,500 deals is actually costing you"\n4. **A-to-B Transformation** — "From 0 brand deals to R100K — the exact path"\n\n**No other hook types.** These four have been tested across 3M+ followers and R800,000+ in affiliate and brand deal revenue. They work. Use them.\n\n### Your Assignment\nWrite one hook using each of the 4 types for your niche. Test two of them as posts this week. Note which gets more comments.',
    3),

  (v_m4, 'audience-manychat-keywords', 'The ManyChat Keyword System',
    'Set up automated DM delivery before your next post. This is the mechanism that moves fish to tank.',
    E'## The ManyChat Keyword System\n\nSet this up BEFORE your next post. Without it, you are broadcasting with no mechanism to capture.\n\n| Keyword | Delivers | Use on |\n|---------|----------|--------|\n| GUIDE | Free Expertise-to-Income Starter Guide | Framework posts |\n| START | 7-Day Called Expert Challenge | Transformation story posts |\n| PAIDS | Free PAIDS Income Map PDF | Income stream posts |\n| MEDIA | Free Media Kit + Rate Card | Brand deal posts |\n| SYSTEM | Free Content Architecture Template | Systems/DARES posts |\n\n### How to Set It Up\n1. Create your ManyChat account (free plan works)\n2. Connect your Instagram / Facebook page\n3. Create a keyword trigger for each keyword above\n4. Connect each trigger to a DM flow that delivers the lead magnet\n5. Connect the DM flow to your MailerLite email sequence\n\n**The flow:** Post → comment "DM me GUIDE" → viewer DMs the keyword → ManyChat sends the lead magnet → email sequence starts → you own that subscriber.\n\n### Stage 4 Checkpoint — All Three Required\n- ✅ 4+ weeks of consistent content published on chosen platform\n- ✅ ManyChat keywords set up and tested (DM yourself to confirm delivery)\n- ✅ Email list growing — even 50 subscribers is proof the mechanism works',
    4),

  (v_m4, 'audience-4-scripting-principles', 'The 4 Scripting Principles',
    'Every script, every time. Violate any of these and you lose attention.',
    E'## The 4 Scripting Principles\n\n**Every script. Every time. No exceptions.**\n\n1. **Negativity wins** — attack the problem or the broken system, never the person. "The education system lied to you" lands. "You\'ve been doing it wrong" doesn\'t.\n\n2. **You format** — every sentence addresses "you" directly. Never "people" or "they" or "creators" — always "you." When the viewer hears "you," their brain stops filtering and pays attention.\n\n3. **Short and simple** — one idea per sentence. Active voice. Ruthless brevity. Cut every word that does not earn its place.\n\n4. **Audible flow** — read aloud at delivery speed before filming. Rewrite every sentence you stumble on. If you can\'t say it smoothly, your audience can\'t follow it.\n\n### The Test\nBefore filming: read your script out loud at the speed you will deliver it. Every stumble = rewrite. If you finish the read and it feels smooth, it\'s ready to film.',
    5)
  ON CONFLICT (module_id, slug) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- MODULE 5: STAGE 5 — Community Creation: 3Cs Strategy (Weeks 9–12)
  -- -------------------------------------------------------------------------
  INSERT INTO public.modules (id, product_id, title, summary, sort_order)
  VALUES (gen_random_uuid(), v_product_id,
    'Stage 5: Community Creation — 3Cs Strategy',
    'Convert followers into owned community. The tank becomes your most valuable asset.',
    5)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_m5;

  IF v_m5 IS NULL THEN
    SELECT id INTO v_m5 FROM public.modules
    WHERE product_id = v_product_id AND sort_order = 5 LIMIT 1;
  END IF;

  INSERT INTO public.lessons (module_id, slug, title, summary, body_md, sort_order) VALUES
  (v_m5, 'community-3cs-progression', 'The 3Cs Progression',
    'Create → Collaborate → Contribute. Three stages of community-building. You cannot skip.',
    E'## The 3Cs Progression\n\n**Proverbs 27:17** — *"Iron sharpens iron, so one person sharpens another."*\n\n| Stage | Phase | Audience Size | What You Do |\n|-------|-------|--------------|-------------|\n| C1 — Create | Foundation | 0–10K | Build before reaching out. 30+ pieces of content. Prove the concept. |\n| C2 — Collaborate | Multiplication | 10K–50K | Strategic partnerships where both parties gain. You bring value to the table. |\n| C3 — Contribute | Legacy | 50K+ | Systematic service to the community. "For children\'s children." |\n\n**The iron rule:** You must BE iron before you can sharpen or be sharpened. No collaboration from a position of zero.\n\nThe biggest mistake: approaching influencers or brands before you have built anything. You are asking them to invest in a promise. Build first. The collaboration opportunities find you.\n\n**"I am because we are"** — Ubuntu is the operating system of this stage. You are not building an audience. You are building a community of people who make each other better.',
    1),

  (v_m5, 'community-building-the-tank', 'Building the Tank',
    'Email list → WhatsApp → CHKPLT → Website. Priority order matters. Start with what you own most.',
    E'## Building the Tank\n\n### Priority Order\n\n1. **Email list** — primary tank. You own the data. Platform can\'t suspend it. Monetisation rate highest of all channels.\n2. **WhatsApp community** — SA-first. Your audience is WhatsApp-native. Highest open rate of any channel.\n3. **CHKPLT** — the platform you own at `/learn`. Students become community.\n4. **Website** — content tank. Builds long-term SEO and off-platform credibility.\n\n### The Lead Magnet Formula\n\nSolves one specific painful problem for ICP 1. Not "sign up for updates."\n\n**Bad:** "Join my newsletter"\n**Good:** "Get the 23-Point Called Expert Business Readiness Diagnostic"\n\nSpecificity = conversion. The more specific the problem you solve with the lead magnet, the higher the conversion rate.\n\n### Your Assignment\nCreate or review your lead magnet. Does it solve one specific problem for one specific person? Can you name the person and the problem in one sentence?\n\nIf not — rebuild it before running any more traffic.',
    2),

  (v_m5, 'community-seeds-conversion', 'The SEEDS Conversion Sequence',
    'Signal → Engagement → Education → Decision → Success. The ethical sales pipeline.',
    E'## The SEEDS Conversion Sequence\n\nSEEDS replaces manipulation-based sales funnels. Every stage serves the customer first.\n\n| Stage | What\'s Happening | What to Give |\n|-------|-----------------|---------------|\n| **Signal** | They find you | Hook strong enough to stop the scroll |\n| **Engagement** | They interact | Two-way value — reply, acknowledge, respond |\n| **Education** | They consume your knowledge | Complete frameworks with real proof |\n| **Decision** | They\'re weighing buying | Social proof, specific outcome, removed risk |\n| **Success** | They buy and get a result | Deliver, over-deliver, turn them into a story |\n\n**The covenant:** Every person who pays R18,000 should receive more than R18,000 in value. That is not marketing. That is stewardship.\n\n### Stage 5 Checkpoint — All Three Required\n- ✅ Owned community (email + WhatsApp) at 100+ engaged members\n- ✅ Lead magnet live and converting\n- ✅ ManyChat → email sequence → community pipeline tested end-to-end',
    3)
  ON CONFLICT (module_id, slug) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- MODULE 6: STAGE 6 — Business Model: DARES Framework (Weeks 13–16)
  -- -------------------------------------------------------------------------
  INSERT INTO public.modules (id, product_id, title, summary, sort_order)
  VALUES (gen_random_uuid(), v_product_id,
    'Stage 6: Business Model — DARES Framework',
    'First digital asset live and generating income. From content job to content business.',
    6)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_m6;

  IF v_m6 IS NULL THEN
    SELECT id INTO v_m6 FROM public.modules
    WHERE product_id = v_product_id AND sort_order = 6 LIMIT 1;
  END IF;

  INSERT INTO public.lessons (module_id, slug, title, summary, body_md, sort_order) VALUES
  (v_m6, 'dares-what-it-means', 'What DARES Means',
    'The 5 principles that separate a content business from a content job.',
    E'## What DARES Means\n\n**Proverbs 13:22** — *"A good person leaves an inheritance for their children\'s children."*\n\n| Letter | Principle | Without It |\n|--------|-----------|------------|\n| **D** Digital | Products and delivery fully online | Capped by geography and physical presence |\n| **A** Automated | Systems run without your daily input | Every rand requires personal hustle |\n| **R** Recurring | Monthly income without re-selling | Perpetual hunting, never harvesting |\n| **E** Evergreen | Products sell indefinitely | Working for every sale as if it\'s the first |\n| **S** Scalable | Revenue grows without proportional time cost | You hit a ceiling when you run out of hours |\n\n**The question that reveals whether you have a business:** Can you take 30 days off and still earn?\n\nIf the answer is no — you have a job that pays you directly. You do not have a business. DARES is the blueprint to change that answer.',
    1),

  (v_m6, 'dares-oth-ll-mfm-progression', 'OTH → LL → MFM Income Progression',
    'One-Time Hustle → Legacy Loop → Money Flow Mode. The path from trading time to owning assets.',
    E'## OTH → LL → MFM Income Progression\n\n| Stage | What It Is | Example |\n|-------|-----------|----------|\n| **OTH** One-Time Hustle | Work once, paid once | Brand deal, speaking gig, consultation |\n| **LL** Legacy Loop | Create once, paid repeatedly | Course, book, membership, template |\n| **MFM** Money Flow Mode | Money works for you | Investment, licensing, subscription revenue |\n\n### The Transition Sequence\n1. Use OTH income (brand deals, freelance) to fund survival and early asset creation\n2. Build your first LL asset (course, ebook, template)\n3. Use LL income to reduce time spent on OTH\n4. Stack LL assets — each one adds a revenue stream without adding hours\n5. Automate delivery → now you have MFM beginning\n\n**The proof:** R23,000 from one affiliate link (March 2019, AdMarula, Mr Price). One link. One post. Paid repeatedly as long as people clicked. That\'s LL in its simplest form.\n\n**Goal by end of programme:** 30% OTH / 50% LL / 20% MFM',
    2),

  (v_m6, 'dares-self-audit', 'DARES Audit',
    'Score yourself 0–10 in each dimension. Your total reveals your business stage.',
    E'## DARES Audit\n\nScore yourself 0–10 in each dimension. Be honest.\n\n| Dimension | The Question |\n|-----------|-------------|\n| **Digital** | Can anyone globally buy and receive your product without your involvement? |\n| **Automated** | Do sales happen without you personally handling them? |\n| **Recurring** | Do you have monthly income that continues without reselling? |\n| **Evergreen** | Will your products still sell in 3 years? |\n| **Scalable** | Can you 10x revenue without 10x hours? |\n\n### What Your Score Means\n- **0–25:** You have a content job, not a business. Start building your first LL asset now.\n- **26–40:** You\'re in transition. Accelerate LL asset creation. Every week counts.\n- **41–50:** You have a true content business. Focus on MFM — let money work for you.\n\n### Your Assignment\nScore each dimension. Write your total. Set a target score for Week 20 (end of programme). Name the one action that would move your lowest-scoring dimension up by 3 points.',
    3),

  (v_m6, 'dares-72-hour-product-protocol', 'Build Your First Digital Product: 72-Hour Protocol',
    'From idea to live product in 72 hours. Imperfect and live beats perfect and planned.',
    E'## The 72-Hour Product Protocol\n\n**Hour 0–24: Build the Minimum Viable Product**\n- Write the content. Do not design it yet.\n- Write the sales page (headline → problem → solution → proof → offer → CTA).\n- Set up the payment link (Paystack / CHKPLT / Selar).\n\n**Hour 24–48: Schedule the Launch**\n- Write 5 posts: tease → tease → reveal → proof → close\n- Write the launch email to your list\n- Set up product delivery (upload to CHKPLT or Selar)\n\n**Hour 48–72: Launch**\n- Send the email\n- Post the content\n- Go LIVE to announce (if you have audience)\n- Respond to every comment and DM for 24 hours\n\n**The rule:** Imperfect and LIVE beats perfect and PLANNED.\n\nThe Influencer\'s Code sold 6,000+ copies at R250 each. It was not perfect on day one. It was live on day one. That\'s the difference.\n\n### Stage 6 Checkpoint — All Three Required\n- ✅ At least one digital product live on CHKPLT or Selar\n- ✅ Automated delivery confirmed — purchase → access granted without a manual step\n- ✅ DARES score 30+ (up from your starting score)',
    4)
  ON CONFLICT (module_id, slug) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- MODULE 7: STAGE 7 — Revenue System: PAIDS Framework (Weeks 17–20)
  -- -------------------------------------------------------------------------
  INSERT INTO public.modules (id, product_id, title, summary, sort_order)
  VALUES (gen_random_uuid(), v_product_id,
    'Stage 7: Revenue System — PAIDS Framework',
    '3+ income streams active. R10K/month minimum demonstrable. Graduation.',
    7)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_m7;

  IF v_m7 IS NULL THEN
    SELECT id INTO v_m7 FROM public.modules
    WHERE product_id = v_product_id AND sort_order = 7 LIMIT 1;
  END IF;

  INSERT INTO public.lessons (module_id, slug, title, summary, body_md, sort_order) VALUES
  (v_m7, 'paids-5-streams', 'The 5 Income Streams',
    'Products · Affiliates/Ads · Information · Deals · Services. One stream is a job. Five is a business.',
    E'## The 5 Income Streams\n\n**Ecclesiastes 11:2** — *"Invest in seven ventures, yes, in eight; you do not know what disaster may come upon the land."*\n\n| Stream | What It Is | SA Starting Point |\n|--------|-----------|-------------------|\n| **P** Products | Digital goods you own | R99–R1,997 ebooks, templates, courses |\n| **A** Affiliates/Ads | Commission for recommending | AdMarula, OfferForge, Canva affiliate |\n| **I** Information | Coaching, consulting, courses | R997–R18,000 programmes |\n| **D** Deals | Brand partnerships, speaking | R3,000–R100K+ per campaign |\n| **S** Services | Done-for-you work | R5K–R25K/month retainers |\n\n**One income stream is a job. Five streams is a business.**\n\nWhen AdSense was disabled in December 2024 — R180,000/year gone overnight — income did not drop to zero. That is what PAIDS protects against.\n\nWhen Instagram suspended 780K followers in August 2025 — the D and S streams (brand deals and retainers) were unaffected because they were contractual, not algorithmic.\n\n**The goal of this stage:** Activate a minimum of 3 streams before graduation.',
    1),

  (v_m7, 'paids-activation-sequence', 'The PAIDS Activation Sequence',
    'In what order do you build the streams? This sequence prevents overwhelm and guarantees early income.',
    E'## The PAIDS Activation Sequence\n\nDo not try to build all 5 streams at once. This is the proven order:\n\n1. **Start with S (Services)** — fastest first income. No product required. Offer one thing you can do for someone else right now.\n2. **Document everything from S** → build **P** (first ebook, template, or guide from what you learned doing services)\n3. **Add A (Affiliates)** to content about tools you already use and recommend\n4. **Build audience through P + A** → unlock **D** (brands want audiences, not individuals)\n5. **Productise your 1:1 knowledge** → scale with **I** (courses, coaching programmes)\n\n**Time horizon:** 12–18 months from first S income to all 5 streams active.\n\n**The proof path:** R350 first brand deal (2017) → R23,000 affiliate day (2019) → R50,000 first big month (2021) → R600,000+ in 12 months (2023) → R300K+/month (2026). PAIDS built in sequence. Not overnight.',
    2),

  (v_m7, 'paids-affiliate-stack-sa', 'The Affiliate Income Stack (SA-Specific)',
    'The SA affiliate platforms that actually pay. With verified proof numbers.',
    E'## The Affiliate Income Stack (SA-Specific)\n\n| Platform | Type | Proof |\n|----------|------|-------|\n| **AdMarula** | SA retail affiliate (Mr Price, Superbalist, Takealot) | R23,000 in ONE day (March 2019). R38,070+ total from one campaign. |\n| **OfferForge** | CPA affiliate network | R3,000/month consistent from products genuinely used |\n| **Canva Pro** | 80% commission year 1 per referral | Active, high-converting for creator audience |\n| **MailerLite** | 30% recurring commission | Every subscriber you refer pays you monthly |\n| **Meta Reels** | Ad revenue share | ~R600,000 in 12 months (2023). Requires qualifying engagement threshold. |\n| **Google AdSense** | Display advertising | R180,000/year (disabled December 2024). Demonstrates revenue dependency risk. |\n\n**The lesson:** Total A-stream proof: R800,000+ across all years and platforms. When one stream gets disabled, the others absorb the loss. That is PAIDS working as designed.\n\n**How to start:** Pick ONE affiliate programme for a tool you already use. Add the link to your next 5 pieces of content about that tool. Track clicks and conversions for 30 days. Reinvest earnings into higher-converting traffic.',
    3),

  (v_m7, 'paids-product-ladder', 'The Product Ladder: Price Ascension',
    'Free → R499 → R1,997 → R18,000 → R45,000. Every level is the same person at a different stage.',
    E'## The Product Ladder: Price Ascension\n\n```\nFree lead magnet (R0)\n  → Low-ticket product (R199–R499)\n  → Mid-ticket course (R997–R1,997)\n  → High-ticket programme (R18,000 PIF / R6,500×3)\n  → VIP tier (R45,000)\n```\n\n**Every level serves the same person at a different readiness and investment stage.**\n\nThe Called Expert who buys a R250 ebook today becomes the R18,000 programme client in 12 months — if you serve them well at every level.\n\n**The Influencer\'s Code:** 6,000+ copies at R250 = R1,500,000 in total sales. That is the bottom of the ladder. The same buyer, at a different stage of readiness, is worth R18,000 at the top.\n\n### The Upgrade Trigger\nYou do not need to pitch the next level. You need to serve the current level so well that they ask for the next level. That is the Called Expert difference — the product quality does the selling.',
    4),

  (v_m7, 'paids-sars-25-percent-rule', 'The 25% SARS Reserve Rule',
    'Non-negotiable. This lesson cost R207,879.20 to learn the hard way. You don\'t have to.',
    E'## The 25% SARS Reserve Rule\n\n**This is non-negotiable.**\n\nEvery rand received = 25% goes directly to a SARS savings account before you touch it.\n\n### The Story Behind the Rule\n\n2020–2022. Income was coming in. Brand deals, affiliates, digital products. No payslip. No employer deducting PAYE. No one telling me how much to set aside.\n\n**The SARS assessment arrived:**\n- Original assessment: R207,879.20\n- Base undeclared income tax: R146,185.51\n- Penalties: approximately R61,694\n\nThome-Lee Wright (tax practitioner) advised filing amended eFiling returns rather than the Voluntary Disclosure Programme (VDP) — standard eFiling gave better payment terms and penalty objection rights.\n\n**SARS waived R45,705.06 in penalties** via the objection process.\n**Final amount paid: R162,174.14** — ~R17,000/month over 11 months.\n**Professional fees: R30,000.**\n\n**Total cost of not tracking income: R192,174.14 + 11 months of stress.**\n\n### The Rule in Practice\nEvery payment processed through CHKPLT automatically calculates:\n`tax_reserve_cents = ROUND(total_cents × 0.25)`\n\nThis is stored separately in the audit ledger. It is not yours to spend.\n\n**SARS reference:** 2990409167. This is a real number. From a real assessment. Pay your tax before you spend anything else.',
    5),

  (v_m7, 'paids-graduation-covenant', 'Graduation — The Called Expert Covenant',
    'Week 20. The checklist that confirms transformation, not just completion.',
    E'## Graduation — The Called Expert Covenant\n\n**By Week 20, a student who has done the work should be able to confirm:**\n\n- ✅ All 7 MS×TS×SS skills rated 7+ (up from starting scores)\n- ✅ 60+ days of consistent content published on primary platform\n- ✅ Owned community (email + WhatsApp) at 500+ engaged members\n- ✅ At least 1 LL asset (digital product) generating income\n- ✅ 3+ PAIDS streams active and documented\n- ✅ R10,000/month demonstrable revenue (with receipts)\n- ✅ SARS reserve system operational — 25% set aside from every payment\n- ✅ Post-programme review call with Ndivhuwo booked\n\n### The Review Call\nThis is not optional. The programme ends with a direct conversation to confirm:\n1. What changed from Week 1 to Week 20\n2. What the next 90 days look like\n3. Whether VIP tier is the right next step\n\n**"Go create. Go produce. Go serve. Go be fruitful."**\n\n*"153 fish. No net broken." — John 21:11*\n\nYou came to the right side. This is what happens when you do.*',
    6)
  ON CONFLICT (module_id, slug) DO NOTHING;

END;
$$;
