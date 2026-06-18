create or replace function public.reserve_ai_usage_daily(
  p_user_id uuid,
  p_usage_date date,
  p_limit integer
)
returns table(allowed boolean, request_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_limit <= 0 then
    return query select false, 0;
    return;
  end if;

  insert into public.ai_usage_daily (user_id, usage_date, request_count)
  values (p_user_id, p_usage_date, 1)
  on conflict (user_id, usage_date) do update
    set request_count = public.ai_usage_daily.request_count + 1
    where public.ai_usage_daily.request_count < p_limit
  returning public.ai_usage_daily.request_count into v_count;

  if v_count is null then
    select public.ai_usage_daily.request_count
      into v_count
      from public.ai_usage_daily
      where user_id = p_user_id
        and usage_date = p_usage_date;

    return query select false, coalesce(v_count, 0);
    return;
  end if;

  return query select true, v_count;
end;
$$;

revoke all on function public.reserve_ai_usage_daily(uuid, date, integer) from public;
revoke all on function public.reserve_ai_usage_daily(uuid, date, integer) from anon;
revoke all on function public.reserve_ai_usage_daily(uuid, date, integer) from authenticated;
grant execute on function public.reserve_ai_usage_daily(uuid, date, integer) to service_role;
