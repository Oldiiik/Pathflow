create table if not exists public.ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

drop trigger if exists ai_usage_daily_set_updated_at on public.ai_usage_daily;
create trigger ai_usage_daily_set_updated_at
before update on public.ai_usage_daily
for each row execute function public.set_updated_at();

alter table public.ai_usage_daily enable row level security;

drop policy if exists "ai usage is owned by user" on public.ai_usage_daily;
create policy "ai usage is owned by user"
on public.ai_usage_daily for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index if not exists ai_usage_daily_usage_date_idx on public.ai_usage_daily(usage_date);
