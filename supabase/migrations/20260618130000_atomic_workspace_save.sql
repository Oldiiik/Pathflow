create or replace function public.save_workspace_atomic(
  p_user_id uuid,
  p_memory jsonb,
  p_objects jsonb,
  p_roadmap jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  insert into public.workspaces (user_id, memory)
  values (p_user_id, coalesce(p_memory, '{}'::jsonb))
  on conflict (user_id) do update
    set memory = excluded.memory
  returning id into v_workspace_id;

  delete from public.workspace_objects
  where workspace_id = v_workspace_id;

  insert into public.workspace_objects (
    id,
    workspace_id,
    user_id,
    kind,
    data,
    evidence,
    source
  )
  select
    item->>'id',
    v_workspace_id,
    p_user_id,
    item->>'kind',
    coalesce(item->'data', '{}'::jsonb),
    coalesce(item->'evidence', '{}'::jsonb),
    coalesce(nullif(item->>'source', ''), 'user')
  from jsonb_array_elements(coalesce(p_objects, '[]'::jsonb)) as item;

  delete from public.roadmap_tasks
  where workspace_id = v_workspace_id;

  insert into public.roadmap_tasks (
    id,
    workspace_id,
    user_id,
    label,
    status,
    priority,
    context
  )
  select
    item->>'id',
    v_workspace_id,
    p_user_id,
    item->>'label',
    coalesce(nullif(item->>'status', ''), 'todo'),
    coalesce(nullif(item->>'priority', ''), 'medium'),
    coalesce(nullif(item->>'context', ''), 'Task')
  from jsonb_array_elements(coalesce(p_roadmap, '[]'::jsonb)) as item;

  return v_workspace_id;
end;
$$;

revoke all on function public.save_workspace_atomic(uuid, jsonb, jsonb, jsonb) from public;
revoke all on function public.save_workspace_atomic(uuid, jsonb, jsonb, jsonb) from anon;
revoke all on function public.save_workspace_atomic(uuid, jsonb, jsonb, jsonb) from authenticated;
grant execute on function public.save_workspace_atomic(uuid, jsonb, jsonb, jsonb) to service_role;
