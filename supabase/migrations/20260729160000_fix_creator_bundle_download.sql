-- =============================================================================
-- Creator Starter Bundle's download_path was a raw Google Drive folder URL —
-- our fulfillment system only knows how to sign files inside our own
-- product-files bucket, so any real customer clicking "Send it to me — free"
-- would hit a hard error, not their bundle. Founder confirmed the right fix:
-- match the same pattern already used successfully for sars-creator-income
-- and content-creator-starter-system — a real "thank-you letter" PDF (in our
-- storage) whose own content links out to the two real Drive files
-- (Niche_Clarity_Workbook.pdf, PAIDS_Workbook_-_MASTER.pdf).
-- =============================================================================

update public.products set
  download_path = 'creator-starter-bundle-thankyou.pdf',
  updated_at = now()
where slug = 'creator-starter-bundle';
