-- =============================================================================
-- Found via a full PDF-vs-description audit: what-to-post,
-- 30-day-content-calendar, and monetise-your-expertise each deliver a short
-- 2-page "access guide" PDF that links out to the real content (a Google
-- Drive PDF, Google Sheet, and/or Notion dashboard) rather than being a
-- single self-contained file. Their `format` field claimed a plain "PDF
-- (instant download)", which overstates what the actual downloaded file is
-- — the customer needs to follow the links inside it. Made the format field
-- honest about this instead of implying everything is in one PDF.
-- =============================================================================

update public.products set
  format = 'PDF access guide + linked Google Sheet/Drive resources, instant delivery',
  updated_at = now()
where slug in ('what-to-post', '30-day-content-calendar', 'monetise-your-expertise');
