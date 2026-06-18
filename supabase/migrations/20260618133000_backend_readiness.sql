create or replace function public.pathflow_backend_readiness()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'tables', jsonb_build_object(
      'profiles', to_regclass('public.profiles') is not null,
      'workspaces', to_regclass('public.workspaces') is not null,
      'workspace_messages', to_regclass('public.workspace_messages') is not null,
      'workspace_objects', to_regclass('public.workspace_objects') is not null,
      'roadmap_tasks', to_regclass('public.roadmap_tasks') is not null,
      'ai_pipeline_runs', to_regclass('public.ai_pipeline_runs') is not null,
      'ai_usage_daily', to_regclass('public.ai_usage_daily') is not null
    ),
    'functions', jsonb_build_object(
      'reserve_ai_usage_daily',
        to_regprocedure('public.reserve_ai_usage_daily(uuid,date,integer)') is not null,
      'save_workspace_atomic',
        to_regprocedure('public.save_workspace_atomic(uuid,jsonb,jsonb,jsonb)') is not null
    )
  );
$$;

revoke all on function public.pathflow_backend_readiness() from public;
revoke all on function public.pathflow_backend_readiness() from anon;
revoke all on function public.pathflow_backend_readiness() from authenticated;
grant execute on function public.pathflow_backend_readiness() to service_role;
