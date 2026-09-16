-- The script body was never persisted as fields — story, receipt, outside
-- voice and mechanism existed only inside the beats JSON, and the loader reset
-- them to empty strings. Opening a saved script therefore lost everything
-- except the hooks. Applied to production 2026-09-16.

alter table public.scripts add column if not exists story text;
alter table public.scripts add column if not exists receipt text;
alter table public.scripts add column if not exists outside_voice text;
alter table public.scripts add column if not exists mechanism text;
alter table public.scripts add column if not exists cta_artifact text;
alter table public.scripts add column if not exists cta_purpose text;
alter table public.scripts add column if not exists generated_from jsonb;

comment on column public.scripts.generated_from is
  'The source rows retrieved when this was drafted, so a generated line stays traceable to the file it came from after the fact.';
