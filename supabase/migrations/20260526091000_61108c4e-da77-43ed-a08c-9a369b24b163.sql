
-- Public bucket for product cover images
insert into storage.buckets (id, name, public)
values ('product-covers', 'product-covers', true)
on conflict (id) do nothing;

-- Public read for covers
create policy "Product covers public read"
on storage.objects for select
using (bucket_id = 'product-covers');

-- Admin write for covers
create policy "Admins manage product-covers"
on storage.objects for all
to authenticated
using (bucket_id = 'product-covers' and public.has_role(auth.uid(), 'admin'))
with check (bucket_id = 'product-covers' and public.has_role(auth.uid(), 'admin'));

-- Admin write for private product files
create policy "Admins manage product-files"
on storage.objects for all
to authenticated
using (bucket_id = 'product-files' and public.has_role(auth.uid(), 'admin'))
with check (bucket_id = 'product-files' and public.has_role(auth.uid(), 'admin'));
