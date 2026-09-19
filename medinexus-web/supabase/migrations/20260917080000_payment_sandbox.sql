begin;
-- Sandbox events never alter a real payment quote or appointment.
create table public.appointment_checkout_sessions(
 id uuid primary key default gen_random_uuid(),quote_id uuid not null unique references appointment_payment_quotes(id),
 environment text not null default 'sandbox' check(environment='sandbox'),
 method text not null check(method in ('pix','card')),gross_cents integer not null check(gross_cents>0),
 status text not null default 'creating' check(status in ('creating','pending','paid_test','cancelled','unknown')),
 provider_reference text unique,checkout_url text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.appointment_checkout_sessions enable row level security;
revoke all on public.appointment_checkout_sessions from anon,authenticated;
grant all on public.appointment_checkout_sessions to service_role;
grant select on public.appointment_checkout_sessions to authenticated;
create policy checkout_patient_read on public.appointment_checkout_sessions for select to authenticated using(exists(select 1 from appointment_payment_quotes q where q.id=quote_id and q.patient_id=auth.uid()));
create table public.payment_webhook_events(id text primary key,session_id uuid not null references appointment_checkout_sessions(id),event text not null,created_at timestamptz not null default now());
alter table public.payment_webhook_events enable row level security;
revoke all on public.payment_webhook_events from anon,authenticated;
grant all on public.payment_webhook_events to service_role;
create or replace function public.apply_sandbox_checkout_event(p_event_id text,p_reference text,p_event text,p_gross_cents integer) returns void language plpgsql security definer set search_path=public as $$
declare session appointment_checkout_sessions;
begin
 if p_event_id is null or length(p_event_id) not between 1 and 200 or p_event not in ('CHECKOUT_CREATED','CHECKOUT_PAID','CHECKOUT_CANCELED','CHECKOUT_EXPIRED') then raise exception 'Evento inválido'; end if;
 select * into session from appointment_checkout_sessions where provider_reference=p_reference for update;
 if not found then raise exception 'Checkout não associado'; end if;
 if p_gross_cents is distinct from session.gross_cents then raise exception 'Valor divergente'; end if;
 if exists(select 1 from payment_webhook_events where id=p_event_id) then return; end if;
 insert into payment_webhook_events(id,session_id,event) values(p_event_id,session.id,p_event);
 update appointment_checkout_sessions set status=case when p_event='CHECKOUT_PAID' then 'paid_test' when status='paid_test' then status when p_event in ('CHECKOUT_CANCELED','CHECKOUT_EXPIRED') then 'cancelled' else status end,updated_at=now() where id=session.id;
end $$;
revoke all on function public.apply_sandbox_checkout_event(text,text,text,integer) from public;
grant execute on function public.apply_sandbox_checkout_event(text,text,text,integer) to service_role;
commit;
