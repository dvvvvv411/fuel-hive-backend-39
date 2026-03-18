
create table public.telegram_chat_ids (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null,
  label text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.telegram_chat_id_shops (
  id uuid primary key default gen_random_uuid(),
  telegram_chat_id_id uuid not null references public.telegram_chat_ids(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  unique (telegram_chat_id_id, shop_id)
);

alter table public.telegram_chat_ids enable row level security;
alter table public.telegram_chat_id_shops enable row level security;

create policy "Admins manage telegram_chat_ids" on public.telegram_chat_ids
  for all to authenticated using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins manage telegram_chat_id_shops" on public.telegram_chat_id_shops
  for all to authenticated using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));
