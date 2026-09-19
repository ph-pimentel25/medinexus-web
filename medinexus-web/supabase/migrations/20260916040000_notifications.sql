begin;
create table public.appointment_outbox (
 id uuid primary key default gen_random_uuid(), appointment_id uuid not null references public.appointments(id),
 channel text not null check(channel in ('email','whatsapp')), kind text not null check(kind in ('requested','confirmed','reminder')),
 event_key text not null, scheduled_start timestamptz, available_at timestamptz not null default now(),
 status text not null default 'queued' check(status in ('queued','processing','accepted','skipped','failed','unknown')),
 attempts integer not null default 0, provider_id text, detail text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(appointment_id,channel,event_key)
);
alter table public.appointment_outbox enable row level security;
-- No client policies: only the server worker reads destination information and dispatches.
create or replace function public.enqueue_appointment_notifications() returns trigger language plpgsql security definer set search_path=public as $$
declare event text; ch text; start_at timestamptz;
begin
 if TG_OP='INSERT' then event:=case when new.status='confirmed' then 'confirmed' else 'requested' end;
 elsif new.status='confirmed' and (old.status is distinct from new.status or old.confirmed_start_at is distinct from new.confirmed_start_at) then event:='confirmed';
 else return new; end if;
 if new.status not in ('pending','confirmed') then return new; end if;
 start_at:=coalesce(new.confirmed_start_at,new.requested_start_at);
 foreach ch in array array['email','whatsapp'] loop
   insert into appointment_outbox(appointment_id,channel,kind,event_key,scheduled_start) values(new.id,ch,event,event||':'||coalesce(start_at::text,'pending'),start_at) on conflict do nothing;
   if event='confirmed' and start_at>now() then
     insert into appointment_outbox(appointment_id,channel,kind,event_key,scheduled_start,available_at) values(new.id,ch,'reminder','reminder:'||start_at::text,start_at,greatest(now()+interval '1 minute',start_at-interval '24 hours')) on conflict do nothing;
   end if;
 end loop;
 return new;
end $$;
create trigger enqueue_patient_messages after insert or update of status,confirmed_start_at on public.appointments for each row execute function public.enqueue_appointment_notifications();
create or replace function public.claim_appointment_messages() returns setof public.appointment_outbox language sql security definer set search_path=public as $$
 update appointment_outbox set status='processing',attempts=attempts+1,updated_at=now() where id in (
 select id from appointment_outbox where status='queued' and available_at<=now() and attempts<3 order by available_at for update skip locked limit 20
 ) returning *;
$$;
revoke all on function public.claim_appointment_messages() from public;
grant execute on function public.claim_appointment_messages() to service_role;
commit;
