create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  field text not null default '',
  region text not null default '',
  avoid text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  memory jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'system')),
  text text not null,
  result_kinds text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_objects (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('university', 'majorFit', 'gapRadar', 'opportunity', 'portfolio')),
  data jsonb not null,
  evidence jsonb not null default '{}'::jsonb,
  source text not null default 'user' check (source in ('user', 'mock', 'ai', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roadmap_tasks (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  context text not null default 'Task',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  pipeline text not null,
  model text,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  status text not null check (status in ('ok', 'fallback', 'error')),
  used_fallback boolean not null default false,
  error_message text,
  latency_ms integer,
  created_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

drop trigger if exists workspace_objects_set_updated_at on public.workspace_objects;
create trigger workspace_objects_set_updated_at
before update on public.workspace_objects
for each row execute function public.set_updated_at();

drop trigger if exists roadmap_tasks_set_updated_at on public.roadmap_tasks;
create trigger roadmap_tasks_set_updated_at
before update on public.roadmap_tasks
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_messages enable row level security;
alter table public.workspace_objects enable row level security;
alter table public.roadmap_tasks enable row level security;
alter table public.ai_pipeline_runs enable row level security;

drop policy if exists "profiles are owned by user" on public.profiles;
create policy "profiles are owned by user"
on public.profiles for all
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "workspaces are owned by user" on public.workspaces;
create policy "workspaces are owned by user"
on public.workspaces for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "workspace messages are owned by user" on public.workspace_messages;
create policy "workspace messages are owned by user"
on public.workspace_messages for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "workspace objects are owned by user" on public.workspace_objects;
create policy "workspace objects are owned by user"
on public.workspace_objects for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "roadmap tasks are owned by user" on public.roadmap_tasks;
create policy "roadmap tasks are owned by user"
on public.roadmap_tasks for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "pipeline runs are owned by user" on public.ai_pipeline_runs;
create policy "pipeline runs are owned by user"
on public.ai_pipeline_runs for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index if not exists workspaces_user_id_idx on public.workspaces(user_id);
create index if not exists workspace_messages_workspace_id_created_at_idx on public.workspace_messages(workspace_id, created_at);
create index if not exists workspace_objects_workspace_id_kind_idx on public.workspace_objects(workspace_id, kind);
create index if not exists roadmap_tasks_workspace_id_status_idx on public.roadmap_tasks(workspace_id, status);
create index if not exists ai_pipeline_runs_user_id_created_at_idx on public.ai_pipeline_runs(user_id, created_at desc);
