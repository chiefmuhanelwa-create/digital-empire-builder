-- =============================================================================
-- Same failure pattern as creator-starter-bundle (fixed 20260729210000): the
-- original bulk-import migration's own internal authoring notes were saved
-- directly into the customer-facing `description` column and never replaced
-- with real copy before the product went live. Founder caught this one via a
-- real screenshot from their own phone — "The Content Creator Starter System"
-- was showing "(Source PDF not found anywhere accessible to this migration —
-- needs sourcing before publish. NAME COLLISION FLAG: ...)" to real shoppers.
-- A follow-up sweep of every product for the same note patterns found one
-- more: sars-creator-income had an identical leaked note. Both products'
-- `long_description`/`benefits` were already real, correct content — only the
-- short `description` field needed fixing, using that real content as the
-- source (not inventing anything new).
-- =============================================================================

update public.products set
  description = 'Three broken systems — no focus in your content, no strategy in your growth, no product to sell — replaced with one working system, on paper, in 30 days.',
  updated_at = now()
where slug = 'content-creator-starter-system';

update public.products set
  description = 'The tax conversation nobody has with creators before the SARS letter arrives — what''s taxable, what you can deduct, and how provisional tax actually works for content income.',
  updated_at = now()
where slug = 'sars-creator-income';
