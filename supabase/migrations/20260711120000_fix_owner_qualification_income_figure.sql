-- Fix: the owner's seeded qualification record (20260615100000_seed_owner_qualification.sql)
-- hardcoded monthly_income_value = 300000 (R300,000+/month), sourced only from the
-- published Contentpreneur book. That figure is unverified per the business's own
-- fact-lock rules (see nochill-knowledge-base/W/processes/ndivhuwo-twin/00-source-data/00-daat-audit.md
-- Fact-Conflict Log) and contradicts this same original migration's own header comment,
-- which cites "R600K+ annual" — R300,000/month annualizes to R3.6M, not R600K.
--
-- Correcting to a defensible monthly-equivalent of the one figure that IS verified:
-- R600,000 in Meta payouts over 12 months (2023) = R50,000/month average.
-- This is a QA/test seed for the owner's own account (unlocks the premium checkout
-- gate for internal testing) — not customer-facing data — but should still match the
-- business's own verified-figures standard for consistency.

UPDATE public.client_stewardship_applications
SET monthly_income_value = 50000  -- R50,000/month, verified monthly-equivalent of R600K/yr Meta payout
WHERE email = 'chiefmuhanelwa@gmail.com'
  AND determined_routing_status = 'QUALIFIED_FOR_CORE_PROGRAM'
  AND monthly_income_value = 300000;
