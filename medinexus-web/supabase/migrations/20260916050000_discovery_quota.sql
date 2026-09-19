begin;
create table public.discovery_quota(user_id uuid primary key references auth.users(id),window_start timestamptz not null default now(),requests integer not null default 0);
alter table public.discovery_quota enable row level security;
create or replace function public.consume_discovery_quota() returns boolean language plpgsql security definer set search_path=public as $$
declare count_requests integer;
begin
 if auth.uid() is null then return false; end if;
 insert into discovery_quota(user_id,requests) values(auth.uid(),1) on conflict(user_id) do update set
 requests=case when discovery_quota.window_start<now()-interval '10 minutes' then 1 else discovery_quota.requests+1 end,
 window_start=case when discovery_quota.window_start<now()-interval '10 minutes' then now() else discovery_quota.window_start end
 returning requests into count_requests;
 return count_requests<=20;
end $$;
revoke all on function public.consume_discovery_quota() from public;
grant execute on function public.consume_discovery_quota() to authenticated;
commit;
