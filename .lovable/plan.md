Two fixes:

### 1. CTA text — `src/routes/index.tsx` line 209
Change the 7-Stage Curriculum section CTA text to match the hero:
- From: `Audit your equation & apply for Cohort 01`
- To: `Apply for Cohort 1 Now`

### 2. Footer top whitespace — `src/components/site-header.tsx` line 181
The `SiteFooter` has `mt-32`, creating a large gap between the "Contentpreneur" signature section and the footer.
- Change `<footer className="border-t border-border/60 mt-32">` → `<footer className="border-t border-border/60">`