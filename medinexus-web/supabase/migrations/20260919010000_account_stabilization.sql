-- Additive stabilization. Apply once AFTER the 17/09 and 18/09 packages.
-- Existing verification is grandfathered for MVP compatibility, NOT proof of CRM/CNPJ validation.
begin;

alter table public.doctors add column verification_status text;
alter table public.clinics add column verification_status text;
update public.doctors set verification_status='verified';
update public.clinics set verification_status='verified';
alter table public.doctors alter column verification_status set default 'pending', alter column verification_status set not null;
alter table public.clinics alter column verification_status set default 'pending', alter column verification_status set not null;
alter table public.doctors add constraint doctor_verification_status_valid check(verification_status in ('pending','verified','rejected','suspended'));
alter table public.clinics add constraint clinic_verification_status_valid check(verification_status in ('pending','verified','rejected','suspended'));

create function public.guard_professional_verification() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if TG_OP='INSERT' then
   new.verification_status:='pending';
 elsif new.verification_status is distinct from old.verification_status and
       auth.role() is distinct from 'service_role' and current_setting('role',true) not in ('none','postgres') then
   raise exception 'A verificação só pode ser alterada pela administração autorizada';
 end if;
 return new;
end $$;
create trigger guard_doctor_verification before insert or update on public.doctors for each row execute function public.guard_professional_verification();
create trigger guard_clinic_verification before insert or update on public.clinics for each row execute function public.guard_professional_verification();

-- Independent of mutable user_metadata and editable profile fields.
create table public.account_registration_locks (
 user_id uuid primary key references auth.users(id) on delete cascade,
 account_type text not null check(account_type in ('patient','doctor','clinic')),
 created_at timestamptz not null default now()
);
alter table public.account_registration_locks enable row level security;
revoke all on public.account_registration_locks from public,anon,authenticated;
grant select on public.account_registration_locks to authenticated;
grant all on public.account_registration_locks to service_role;
create policy own_account_registration_read on public.account_registration_locks for select to authenticated using(user_id=auth.uid());

-- Same precedence as legacy role resolution; no old relationship is removed.
insert into public.account_registration_locks(user_id,account_type)
select u.id,case
 when exists(select 1 from doctors d where d.user_id=u.id) or exists(select 1 from clinic_members m where m.user_id=u.id and coalesce(m.member_role,m.role)='doctor' and m.doctor_id is not null) then 'doctor'
 when exists(select 1 from clinics c where c.user_id=u.id or c.created_by=u.id) or exists(select 1 from clinic_members m where m.user_id=u.id and coalesce(m.member_role,m.role) in ('owner','admin')) then 'clinic'
 when exists(select 1 from patients p where p.id=u.id) then 'patient'
 when (select p.role::text from profiles p where p.id=u.id) in ('doctor','clinic','clinic_admin') then case when (select p.role::text from profiles p where p.id=u.id)='doctor' then 'doctor' else 'clinic' end
 when coalesce(u.raw_user_meta_data->'medinexus_registration'->>'accountType',u.raw_user_meta_data->>'role') in ('doctor','clinic','clinic_admin') then case when coalesce(u.raw_user_meta_data->'medinexus_registration'->>'accountType',u.raw_user_meta_data->>'role')='doctor' then 'doctor' else 'clinic' end
 else 'patient' end
from auth.users u;

create function public.capture_registration_type() returns trigger language plpgsql security definer set search_path=public as $$
declare chosen text;
begin
 chosen:=coalesce(new.raw_user_meta_data->'medinexus_registration'->>'accountType',new.raw_user_meta_data->>'role','patient');
 chosen:=case when chosen='doctor' then 'doctor' when chosen in ('clinic','clinic_admin') then 'clinic' else 'patient' end;
 insert into account_registration_locks(user_id,account_type) values(new.id,chosen) on conflict(user_id) do nothing;
 return new;
end $$;
create trigger medinexus_capture_registration after insert on auth.users for each row execute function public.capture_registration_type();

create function public.assert_registration_type(p_user uuid,p_expected text) returns void language plpgsql security definer set search_path=public as $$
declare chosen text;
begin
 if p_user is null then return; end if;
 -- Serialize ownership changes against simultaneous completion requests.
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,917));
 select account_type into chosen from account_registration_locks where user_id=p_user;
 if chosen is null then
   -- A legacy Auth trigger can create the profile before our AFTER INSERT trigger.
   -- Capture the original signup metadata once, never subsequent metadata changes.
   select case when coalesce(raw_user_meta_data->'medinexus_registration'->>'accountType',raw_user_meta_data->>'role')='doctor' then 'doctor'
      when coalesce(raw_user_meta_data->'medinexus_registration'->>'accountType',raw_user_meta_data->>'role') in ('clinic','clinic_admin') then 'clinic' else 'patient' end
   into chosen from auth.users where id=p_user;
   if chosen is null then raise exception 'Conta de autenticação não encontrada'; end if;
   insert into account_registration_locks(user_id,account_type) values(p_user,chosen);
 end if;
 if chosen is distinct from p_expected then raise exception 'O tipo originalmente escolhido para esta conta não pode ser alterado'; end if;
end $$;

create function public.guard_registration_type() returns trigger language plpgsql security definer set search_path=public as $$
declare expected text;
begin
 if TG_TABLE_NAME='profiles' then
   expected:=case when new.role::text='doctor' then 'doctor' when new.role::text in ('clinic','clinic_admin') then 'clinic' when new.role::text='patient' then 'patient' else null end;
   -- Auth may insert a default patient profile before completing a professional signup.
   if TG_OP='INSERT' and (expected='patient' or expected is null) then return new; end if;
   if TG_OP='UPDATE' and new.role is not distinct from old.role then return new; end if;
   if expected is null then raise exception 'Tipo de conta inválido'; end if;
   perform public.assert_registration_type(new.id,expected);
 elsif TG_TABLE_NAME='patients' then
   if TG_OP='INSERT' or new.id is distinct from old.id then perform public.assert_registration_type(new.id,'patient'); end if;
 elsif TG_TABLE_NAME='doctors' then
   if TG_OP='INSERT' or new.user_id is distinct from old.user_id then perform public.assert_registration_type(new.user_id,'doctor'); end if;
 elsif TG_TABLE_NAME='clinics' then
   if TG_OP='INSERT' or new.user_id is distinct from old.user_id or new.created_by is distinct from old.created_by then
     perform public.assert_registration_type(new.user_id,'clinic');
     perform public.assert_registration_type(new.created_by,'clinic');
   end if;
 elsif TG_TABLE_NAME='clinic_members' then
   if TG_OP='UPDATE' and new.user_id is not distinct from old.user_id and new.member_role is not distinct from old.member_role and new.role is not distinct from old.role then return new; end if;
   expected:=case when coalesce(new.member_role,new.role)='doctor' then 'doctor' when coalesce(new.member_role,new.role) in ('owner','admin') then 'clinic' else null end;
   if expected is not null then perform public.assert_registration_type(new.user_id,expected); end if;
 end if;
 return new;
end $$;
create trigger preserve_profile_account_type before insert or update on public.profiles for each row execute function public.guard_registration_type();
create trigger preserve_patient_account_type before insert or update on public.patients for each row execute function public.guard_registration_type();
create trigger preserve_doctor_account_type before insert or update on public.doctors for each row execute function public.guard_registration_type();
create trigger preserve_clinic_account_type before insert or update on public.clinics for each row execute function public.guard_registration_type();
create trigger preserve_member_account_type before insert or update on public.clinic_members for each row execute function public.guard_registration_type();

create function public.is_structurally_valid_cnpj(p_value text) returns boolean language plpgsql immutable set search_path=public as $$
declare digits text; base_length integer; weight integer; total integer; remainder integer; position integer;
begin
 if p_value is null or p_value ~ '[^0-9./[:space:]-]' then return false; end if;
 digits:=regexp_replace(p_value,'[^0-9]','','g');
 if length(digits)<>14 or digits=repeat(left(digits,1),14) then return false; end if;
 for base_length in 12..13 loop
   weight:=base_length-7;total:=0;
   for position in 1..base_length loop
     total:=total+substring(digits,position,1)::integer*weight;
     weight:=case when weight=2 then 9 else weight-1 end;
   end loop;
   remainder:=total%11;
   if substring(digits,base_length+1,1)::integer<>(case when remainder<2 then 0 else 11-remainder end) then return false; end if;
 end loop;
 return true;
end $$;
create function public.guard_clinic_cnpj() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if TG_OP='INSERT' or new.cnpj is distinct from old.cnpj then
   if not public.is_structurally_valid_cnpj(new.cnpj) then raise exception 'Informe um CNPJ válido com 14 dígitos (validação estrutural)'; end if;
   new.cnpj:=regexp_replace(new.cnpj,'[^0-9]','','g');
 end if;
 return new;
end $$;
create trigger validate_clinic_cnpj before insert or update on public.clinics for each row execute function public.guard_clinic_cnpj();

revoke all on function public.capture_registration_type() from public,anon,authenticated;
revoke all on function public.assert_registration_type(uuid,text) from public,anon,authenticated;
revoke all on function public.guard_registration_type() from public,anon,authenticated;
revoke all on function public.guard_professional_verification() from public,anon,authenticated;
revoke all on function public.guard_clinic_cnpj() from public,anon,authenticated;
revoke all on function public.is_structurally_valid_cnpj(text) from public,anon,authenticated;
commit;
