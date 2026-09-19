begin;
-- User-supplied address book. Do not persist Google Places content without its
-- licensing/retention requirements; the discovery provider remains separate.
create table public.external_care_contacts(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(trim(name)) between 2 and 160),
 phone text not null default '' check(length(phone)<=40),
 address text not null default '' check(length(address)<=400),
 specialty text not null default '' check(length(specialty)<=120),
 website text not null default '' check(website='' or (length(website)<=500 and website ~ '^https://[^[:space:]]+$')),
 created_at timestamptz not null default now()
);
alter table public.external_care_contacts enable row level security;
revoke all on public.external_care_contacts from anon,authenticated;
grant select,insert,update,delete on public.external_care_contacts to authenticated;
create policy own_external_contacts on public.external_care_contacts for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid() and exists(select 1 from patients where id=auth.uid()));
commit;
