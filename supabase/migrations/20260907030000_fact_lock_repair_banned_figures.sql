-- =============================================================================
-- FACT-LOCK REPAIR — five live product pages carrying disproven figures.
--
-- Found 2026-09-07 by sweeping https://chkplt.com against the audited claim
-- ledger (~/.claude/skills/nochill-script/references/PROOF.md, rebuilt
-- 2026-09-07). Five products were selling on numbers the evidence killed.
-- One of them attached the word "verified" to a figure that is not
-- reconstructable from any record.
--
-- This is the same class of failure as 20260729210000 / 20260729230000 /
-- 20260813120000 — copy shipped without a ledger check — except these are
-- proof claims rather than authoring notes, which makes them worse: they are
-- the reason a shopper believes the product.
--
-- WHAT WAS WRONG                          WHAT THE RECORD ACTUALLY SHOWS
--   R132,500 undercharging                disproven across 681 records (D-52)
--   "first fifty brand deals"             19 named brands, 23 agencies
--   R25,000/mo Savanna x4 = R100,000      R45,000 quoted, 2020. No Savanna figure survives
--   "R800,000 verified" (ads+affiliates)  not reconstructable. R453,710.37 lifetime bank-confirmed
--   R600,000 from Meta over 12 months     $22,180.93 remitted, 2021-2025
--   "the brand that paid R50,000"         Flying Fish is CONTRACTED, not received
--   R207,879                              R207,879.20
--
-- Replacements use only bank-confirmed, platform-exported or signed-document
-- figures. The R15,000 -> R45,000 costing story replaces every killed
-- escalation claim: it is verified (April 2020), it is a better sales line
-- because the costing sheet can be shown, and it needs no caveat.
--
-- The first-deal figure is deliberately NOT reintroduced. Per 20260813120000
-- the published book states it two incompatible ways.
-- =============================================================================

UPDATE products SET long_description =
'A R6,000 salary bought my first phone in 2014. Everything after that — R453,710 in bank-confirmed receipts across eight years — was built from there. This is the starter system: the exact first moves so you don''t waste your first 90 days guessing.'
WHERE slug = 'creator-starter-system';

UPDATE products SET long_description =
'For years I opened every pitch with "I''m a creator with X followers." That''s a CV nobody asked for. No wonder I got ghosted.

My standing rate was R15,000. I quoted it because it was my number, not because I had ever worked it out. In April 2020 I costed a job properly for the first time — scope, usage, exclusivity, the lot. It came to R45,000. Same account, same week. Nothing about my audience had changed. My pitch did.

Discovery is a myth. Pitching is the job. Most creators either pitch too low and get underpaid, or never pitch at all and earn nothing. This removes both problems — the exact scripts I wish I''d had, every one under 150 words, because brands reply to clear pitches, not long ones.

Fill in the brackets. Send it this week.'
WHERE slug = 'first-brand-deal-script';

UPDATE products SET long_description =
'One income stream is a job with a different boss. This workbook maps all five PAIDS streams for your own business: Products (what you create and own — zero cost per extra sale), Ads & Affiliates (the networks that are bank-confirmed in my own records — AdMarula R41,562 received, OfferForge R36,050 across ten payments, Meta $22,180 remitted), Information (coaching and consulting priced properly, not R500/hour), Deals (brand partnerships and licensing — the rarest stream, the highest single payout), and Services (done-for-you work at your highest margin).

One month of affiliate commission was 41.6% of everything that channel ever paid me. That is not a business. That is a spike. One deal falling through should never break your month again.'
WHERE slug = 'paids-framework-workbook';

UPDATE products SET long_description =
'Built by someone who slept in campus bathrooms in Pretoria and later had $22,180 remitted from Meta between 2021 and 2025 — with the transfer records to prove it. A 9-lesson course teaching the complete "Making Money Flow" system: how your Personal Brand feeds your Community, your Community feeds your Social Media, and your Social Media feeds your PAIDS income streams.'
WHERE slug = 'personal-branding-blueprint-course';

UPDATE products SET long_description =
'Nobody told me. Not the accountant, not the brand that contracted me at R50,000, not the platform that remitted $22,180 over four years. Nobody said "you know this is taxable from rand one?" — until SARS sent a bill for R207,879.20. This guide is the conversation nobody had before that letter arrived.'
WHERE slug = 'sars-creator-income';
