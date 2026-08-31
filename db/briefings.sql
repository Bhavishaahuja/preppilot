-- PrepPilot: per-user briefing history.
-- Run this once in Supabase → SQL Editor. Stores each generated briefing as a row
-- owned by the user, with the full briefing JSON in `data`. Row-Level Security keeps
-- every user to their own rows.
--
-- Note: this block is written to survive the exact 403/RLS grants gotcha from the
-- profiles table (challenges log #9) — it grants privileges to `authenticated` and
-- scopes every policy `to authenticated`, so a fresh instance works the first time.

create table if not exists public.briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  person text,
  company text,
  goal text,
  data jsonb not null,
  created_at timestamptz default now()
);

create index if not exists briefings_user_created_idx
  on public.briefings (user_id, created_at desc);

alter table public.briefings enable row level security;

grant usage on schema public to authenticated;
grant select, insert, delete on public.briefings to authenticated;

drop policy if exists "Users can read their own briefings" on public.briefings;
drop policy if exists "Users can insert their own briefings" on public.briefings;
drop policy if exists "Users can delete their own briefings" on public.briefings;

create policy "Users can read their own briefings"
  on public.briefings for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own briefings"
  on public.briefings for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own briefings"
  on public.briefings for delete to authenticated
  using (auth.uid() = user_id);
