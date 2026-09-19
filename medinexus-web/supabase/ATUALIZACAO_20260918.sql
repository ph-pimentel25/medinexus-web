-- Atualização de 18/09/2026: executar APÓS ATUALIZACAO_20260917.sql.
-- As migrations 30000 a 90000 abaixo ainda não foram aplicadas pelo assistente.
-- Executar uma vez em homologação. Não executar se já aplicou os mesmos arquivos.
-- Uma transação: qualquer erro desfaz este pacote inteiro.
begin;

-- 20260917030000_doctor_photos.sql
alter table public.doctors add column if not exists photo_path text;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('doctor-photos','doctor-photos',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;

create or replace function public.can_manage_doctor_photo(p_doctor_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select auth.uid() is not null and exists(select 1 from doctors d where d.id=p_doctor_id and (
 d.user_id=auth.uid() or exists(select 1 from clinics c where c.id=d.clinic_id and (c.user_id=auth.uid() or c.created_by=auth.uid()))
 or exists(select 1 from clinic_members m where m.clinic_id=d.clinic_id and m.user_id=auth.uid() and coalesce(m.member_role,m.role) in ('owner','admin'))));
$$;
revoke all on function public.can_manage_doctor_photo(uuid) from public;
grant execute on function public.can_manage_doctor_photo(uuid) to authenticated;
create policy doctor_photo_read on storage.objects for select to anon,authenticated using(bucket_id='doctor-photos');
create policy doctor_photo_upload on storage.objects for insert to authenticated with check(bucket_id='doctor-photos' and exists(select 1 from public.doctors d where d.id::text=(storage.foldername(name))[1] and public.can_manage_doctor_photo(d.id)));
create policy doctor_photo_remove on storage.objects for delete to authenticated using(bucket_id='doctor-photos' and exists(select 1 from public.doctors d where d.id::text=(storage.foldername(name))[1] and public.can_manage_doctor_photo(d.id)) and not exists(select 1 from public.doctors d where d.photo_path=name));

create or replace function public.validate_doctor_photo() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.photo_path is not null and (split_part(new.photo_path,'/',1)<>new.id::text or not exists(select 1 from storage.objects o where o.bucket_id='doctor-photos' and o.name=new.photo_path)) then raise exception 'Envie uma foto válida para este médico'; end if;
 if new.doctor_completed and new.photo_path is null then raise exception 'A foto é obrigatória para concluir o perfil médico'; end if;
 return new;
end $$;
create trigger require_doctor_photo before insert or update of photo_path,doctor_completed on public.doctors for each row execute function public.validate_doctor_photo();
create or replace function public.set_doctor_photo(p_doctor_id uuid,p_path text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.can_manage_doctor_photo(p_doctor_id) then raise exception 'Sem permissão para editar este perfil'; end if;
 if nullif(trim(p_path),'') is null then raise exception 'A foto do médico é obrigatória'; end if;
 update doctors set photo_path=p_path where id=p_doctor_id;
end $$;
revoke all on function public.set_doctor_photo(uuid,text) from public;
grant execute on function public.set_doctor_photo(uuid,text) to authenticated;

-- 20260917040000_patient_availability.sql
alter table public.appointments add column if not exists coverage_status text not null default 'not_applicable' check(coverage_status in ('not_applicable','catalog_match','confirmation_required','accepted','rejected'));
alter table public.appointments add column if not exists health_plan_id uuid references public.health_plans(id);
alter table public.appointments add column if not exists health_plan_snapshot jsonb;
alter table public.appointments add column if not exists availability_match text check(availability_match in ('exact','nearby'));

-- Text entered manually never becomes an accepted catalog plan by name matching.
create or replace function public.doctor_plan_coverage(p_doctor uuid,p_patient uuid)
returns text language sql stable security definer set search_path=public as $$
 select case
 when p.default_health_plan_id is null then case when nullif(trim(coalesce(p.health_plan_product_name,'')),'') is not null then 'confirmation_required' else 'not_applicable' end
 when d.clinic_id is not null and exists(select 1 from clinic_health_plans c where c.clinic_id=d.clinic_id and c.health_plan_id=p.default_health_plan_id)
 and (not exists(select 1 from doctor_health_plans h where h.doctor_id=d.id) or exists(select 1 from doctor_health_plans h where h.doctor_id=d.id and h.health_plan_id=p.default_health_plan_id)) then 'catalog_match'
 when d.clinic_id is null and exists(select 1 from doctor_health_plans h where h.doctor_id=d.id and h.health_plan_id=p.default_health_plan_id) then 'catalog_match'
 else 'not_applicable' end from doctors d cross join patients p where d.id=p_doctor and p.id=p_patient;
$$;
revoke all on function public.doctor_plan_coverage(uuid,uuid) from public;

create or replace function public.match_patient_availability(p_search_id uuid)
returns table(doctor_id uuid,doctor_name text,photo_path text,crm text,crm_state text,clinic_id uuid,clinic_name text,city text,state text,neighborhood text,distance_km double precision,start_at timestamptz,end_at timestamptz,duration_minutes integer,match_kind text,difference_minutes integer,appointment_mode text,coverage text,private_price_cents integer)
language plpgsql stable security definer set search_path=public as $$
declare pref patient_search_preferences; first_day date; last_day date; today date:=(now() at time zone 'America/Sao_Paulo')::date;
begin
 select * into pref from patient_search_preferences s where s.id=p_search_id and s.patient_id=auth.uid();
 if not found or auth.uid() is null then raise exception 'Busca não encontrada'; end if;
 first_day:=greatest(coalesce(pref.preferred_start_date,today),today);
 last_day:=coalesce(pref.preferred_end_date,first_day+20);
 if last_day<first_day or last_day-first_day>90 or first_day>today+365 then raise exception 'Escolha um período futuro de até 90 dias'; end if;
 if not exists(select 1 from patient_search_time_windows w where w.search_preference_id=pref.id and w.weekday between 0 and 6 and w.end_time::time>w.start_time::time) then raise exception 'Informe ao menos uma faixa de disponibilidade válida'; end if;
 if not exists(select 1 from generate_series(first_day::timestamp,last_day::timestamp,interval '1 day') day join patient_search_time_windows w on w.search_preference_id=pref.id and w.weekday=extract(dow from day) and w.end_time::time>w.start_time::time) then raise exception 'Os dias da semana selecionados não ocorrem no período informado'; end if;
 return query
 with desired as materialized (
   select (day::date+w.start_time::time) at time zone 'America/Sao_Paulo' as starts,
          (day::date+w.end_time::time) at time zone 'America/Sao_Paulo' as ends
   from generate_series(first_day::timestamp,last_day::timestamp,interval '1 day') day
   join patient_search_time_windows w on w.search_preference_id=pref.id and w.weekday=extract(dow from day) and w.end_time::time>w.start_time::time
 ), candidates as materialized (
   select d.*,c.trade_name,coalesce(c.address_city,d.address_city) as local_city,coalesce(c.address_state,d.address_state) as local_state,
    coalesce(c.address_neighborhood,d.address_neighborhood) as local_neighborhood,
    coalesce(d.private_price_cents,c.base_private_price_cents) as price,
    d.accepts_private_consultation is true and (d.clinic_id is null or c.accepts_private_consultation is true) as private_ok,
    public.doctor_plan_coverage(d.id,auth.uid()) as plan_coverage,
    case when p.latitude is not null and p.longitude is not null and coalesce(c.latitude,d.latitude) is not null and coalesce(c.longitude,d.longitude) is not null then
     6371*acos(least(1.0,greatest(-1.0,sin(radians(p.latitude))*sin(radians(coalesce(c.latitude,d.latitude)))+cos(radians(p.latitude))*cos(radians(coalesce(c.latitude,d.latitude)))*cos(radians(coalesce(c.longitude,d.longitude)-p.longitude))))) end as km
   from doctors d left join clinics c on c.id=d.clinic_id join profiles p on p.id=auth.uid()
   where d.is_active=true and d.photo_path is not null and (d.clinic_id is null or c.is_active=true)
   and (pref.preferred_clinic_id is null or pref.preferred_clinic_id=d.clinic_id)
   and exists(select 1 from doctor_specialties ds where ds.doctor_id=d.id and ds.specialty_id=pref.specialty_id)
 ), eligible as materialized (
   select c.*,case when pref.accepts_private_consultation is not true and c.plan_coverage in ('catalog_match','confirmation_required') then 'health_plan' else 'private' end as mode
   from candidates c where (pref.preferred_clinic_id is not null or c.km<=coalesce(pref.max_radius_km,10))
   and ((pref.accepts_private_consultation is not true and c.plan_coverage in ('catalog_match','confirmation_required')) or c.private_ok)
 ), opening as (
   select c.id,c.clinic_id,c.average_consultation_minutes,
   greatest(5,least(240,coalesce(c.average_consultation_minutes,a.slot_minutes,30))) as duration,
   (day::date+a.start_time::time) at time zone 'America/Sao_Paulo' as starts,
   (day::date+a.end_time::time) at time zone 'America/Sao_Paulo' as ends
   from eligible c join doctor_availability a on a.doctor_id=c.id and a.is_active=true
   cross join generate_series(greatest(today,first_day-7)::timestamp,(last_day+7)::timestamp,interval '1 day') day
   where coalesce(a.weekday,a.day_of_week)=extract(dow from day) and a.end_time::time>a.start_time::time
 ), possible as (
   select o.id,o.duration,t as starts,t+make_interval(mins=>o.duration) as ends from opening o
   cross join lateral (
     select x as t from generate_series(o.starts,o.ends-make_interval(mins=>o.duration),interval '5 minutes') x
     union select d.starts from desired d where d.starts>=o.starts and d.starts+make_interval(mins=>o.duration)<=o.ends
   ) times where t>now()
 ), scored as (
   select s.*,nearest.delta from possible s cross join lateral (
     select min(greatest(extract(epoch from(d.starts-s.starts)),extract(epoch from(s.ends-d.ends)),0)/60)::integer as delta from desired d
   ) nearest where nearest.delta is not null and not exists(select 1 from appointments a where a.doctor_id=s.id and a.status in ('pending','confirmed') and coalesce(a.confirmed_start_at,a.requested_start_at)<s.ends and coalesce(a.confirmed_end_at,a.requested_end_at)>s.starts)
 ), best as (
   select distinct on(s.id) s.* from scored s order by s.id,s.delta,s.starts
 )
 select c.id,c.name::text,c.photo_path,c.crm::text,c.crm_state::text,c.clinic_id,coalesce(c.trade_name,'Consultório particular')::text,
 c.local_city::text,c.local_state::text,c.local_neighborhood::text,c.km::double precision,b.starts,b.ends,b.duration,
 case when b.delta=0 then 'exact' else 'nearby' end,b.delta,c.mode,
 case when c.mode='health_plan' then c.plan_coverage else 'not_applicable' end,
 case when c.mode='private' then c.price else null end
 from best b join eligible c on c.id=b.id order by b.delta,c.km nulls last,b.starts,c.id limit 100;
end $$;
revoke all on function public.match_patient_availability(uuid) from public;
grant execute on function public.match_patient_availability(uuid) to authenticated;

create or replace function public.request_matched_appointment(p_search_id uuid,p_doctor_id uuid,p_start_at timestamptz,p_accept_nearby boolean default false,p_accept_private boolean default false)
returns uuid language plpgsql security definer set search_path=public as $$
declare pref patient_search_preferences; slot record; result uuid;
begin
 if not exists(select 1 from patients where id=auth.uid()) then raise exception 'Complete seu cadastro de paciente'; end if;
 select * into pref from patient_search_preferences where id=p_search_id and patient_id=auth.uid() for share;
 if not found then raise exception 'Busca não encontrada'; end if;
 perform pg_advisory_xact_lock(hashtext(p_doctor_id::text));
 select * into slot from public.match_patient_availability(p_search_id) m where m.doctor_id=p_doctor_id and m.start_at=p_start_at;
 if not found then raise exception 'O horário mudou ou foi ocupado. Atualize sua busca'; end if;
 if slot.match_kind='nearby' and p_accept_nearby is distinct from true then raise exception 'Confirme que pode comparecer no horário alternativo'; end if;
 if slot.appointment_mode='private' and pref.accepts_private_consultation is not true and p_accept_private is distinct from true then raise exception 'Seu plano não está aceito. Confirme que deseja consulta particular'; end if;
 if exists(select 1 from appointments where patient_id=auth.uid() and doctor_id=p_doctor_id and specialty_id=pref.specialty_id and status in ('pending','confirmed')) then raise exception 'Você já possui uma solicitação ativa para este profissional'; end if;
 insert into appointments(patient_id,doctor_id,clinic_id,specialty_id,requested_start_at,requested_end_at,status,patient_confirmation_status,appointment_mode,auto_suggested,appointment_duration_minutes,availability_match)
 values(auth.uid(),p_doctor_id,slot.clinic_id,pref.specialty_id,slot.start_at,slot.end_at,'pending','not_requested',slot.appointment_mode,true,slot.duration_minutes,slot.match_kind) returning id into result;
 return result;
end $$;
revoke all on function public.request_matched_appointment(uuid,uuid,timestamptz,boolean,boolean) from public;
grant execute on function public.request_matched_appointment(uuid,uuid,timestamptz,boolean,boolean) to authenticated;

-- Applies also to direct inserts and the native booking RPC: clients cannot
-- manufacture plan acceptance, bypass photo requirements or book closed hours.
create or replace function public.guard_patient_booking_rules() returns trigger language plpgsql security definer set search_path=public as $$
declare d doctors; p patients; starts timestamptz; ends timestamptz;
begin
 if TG_OP='INSERT' then
  if new.patient_id=auth.uid() then new.status:='pending';new.confirmed_start_at:=null;new.confirmed_end_at:=null;end if;
  select * into d from doctors where id=new.doctor_id;
  if d.id is null or d.is_active is not true or d.photo_path is null then raise exception 'O médico precisa concluir o perfil com foto antes de receber agendamentos'; end if;
  if new.clinic_id is distinct from d.clinic_id or (d.clinic_id is not null and not exists(select 1 from clinics where id=d.clinic_id and is_active=true)) then raise exception 'Local de atendimento indisponível'; end if;
  if not exists(select 1 from doctor_specialties where doctor_id=d.id and specialty_id=new.specialty_id) then raise exception 'Especialidade não atendida por este médico'; end if;
  starts:=coalesce(new.confirmed_start_at,new.requested_start_at);ends:=coalesce(new.confirmed_end_at,new.requested_end_at);
  if starts is null or ends is null or starts<=now() or ends<=starts or not exists(
   select 1 from doctor_availability a where a.doctor_id=d.id and a.is_active=true
   and coalesce(a.weekday,a.day_of_week)=extract(dow from starts at time zone 'America/Sao_Paulo')
   and (starts at time zone 'America/Sao_Paulo')::date=(ends at time zone 'America/Sao_Paulo')::date
   and ends-starts=make_interval(mins=>greatest(5,least(240,coalesce(d.average_consultation_minutes,a.slot_minutes,30))))
   and (starts at time zone 'America/Sao_Paulo')::time>=a.start_time::time and (ends at time zone 'America/Sao_Paulo')::time<=a.end_time::time
  ) then raise exception 'Horário fora da disponibilidade do médico'; end if;
  select * into p from patients where id=new.patient_id;
  if new.appointment_mode='health_plan' then
   new.coverage_status:=public.doctor_plan_coverage(d.id,new.patient_id);
   if new.coverage_status is null or new.coverage_status='not_applicable' then raise exception 'Plano não aceito para esta consulta'; end if;
   new.health_plan_id:=p.default_health_plan_id;
   new.health_plan_snapshot:=jsonb_build_object('operator',p.health_plan_operator,'plan',p.health_plan_product_name,'catalog_id',p.default_health_plan_id);
  elsif new.appointment_mode='private' then
   if d.accepts_private_consultation is not true or (d.clinic_id is not null and not exists(select 1 from clinics where id=d.clinic_id and accepts_private_consultation=true)) then raise exception 'Consulta particular não disponível'; end if;
   new.coverage_status:='not_applicable';new.health_plan_id:=null;new.health_plan_snapshot:=null;
  else raise exception 'Modalidade inválida'; end if;
 else
  if old.patient_id=auth.uid() and (
   new.patient_id is distinct from old.patient_id or new.doctor_id is distinct from old.doctor_id or new.clinic_id is distinct from old.clinic_id or new.specialty_id is distinct from old.specialty_id
   or new.coverage_status is distinct from old.coverage_status or new.health_plan_id is distinct from old.health_plan_id or new.health_plan_snapshot is distinct from old.health_plan_snapshot or new.appointment_mode is distinct from old.appointment_mode
   or new.requested_start_at is distinct from old.requested_start_at or new.requested_end_at is distinct from old.requested_end_at or new.confirmed_start_at is distinct from old.confirmed_start_at or new.confirmed_end_at is distinct from old.confirmed_end_at
   or (new.status is distinct from old.status and new.status not in ('cancelled','cancelled_by_patient'))
  ) then raise exception 'Solicite alterações à equipe. Não é permitido alterar horário, modalidade ou convênio diretamente'; end if;
 end if;
 if new.appointment_mode='health_plan' and new.status='confirmed' and new.coverage_status in ('confirmation_required','rejected') then raise exception 'Confirme a aceitação do plano antes de confirmar a consulta'; end if;
 return new;
end $$;
create trigger booking_business_rules before insert or update on public.appointments for each row execute function public.guard_patient_booking_rules();

create or replace function public.resolve_appointment_coverage(p_appointment_id uuid,p_accepted boolean)
returns void language plpgsql security definer set search_path=public as $$
declare a appointments;
begin
 select * into a from appointments where id=p_appointment_id for update;
 if not found or auth.uid() is null or a.patient_id=auth.uid() then raise exception 'Sem permissão para confirmar este plano'; end if;
 if not (exists(select 1 from doctors d where d.id=a.doctor_id and d.user_id=auth.uid() and d.is_active=true)
 or exists(select 1 from clinics c where c.id=a.clinic_id and (c.user_id=auth.uid() or c.created_by=auth.uid()))
 or exists(select 1 from clinic_members m where m.clinic_id=a.clinic_id and m.user_id=auth.uid() and coalesce(m.member_role,m.role) in ('owner','admin'))) then raise exception 'Sem permissão para confirmar este plano'; end if;
 if a.status<>'pending' or a.appointment_mode<>'health_plan' or a.coverage_status not in ('confirmation_required','accepted','rejected') or p_accepted is null then raise exception 'Esta solicitação não está aguardando análise de convênio'; end if;
 update appointments set coverage_status=case when p_accepted then 'accepted' else 'rejected' end where id=a.id;
end $$;
revoke all on function public.resolve_appointment_coverage(uuid,boolean) from public;
grant execute on function public.resolve_appointment_coverage(uuid,boolean) to authenticated;
-- Keep the secondary native doctor-first flow compatible with autonomous offices.
create or replace function public.get_doctor_booking_slots(p_doctor_id uuid,p_specialty_id uuid)
returns table(start_at timestamptz,end_at timestamptz,clinic_id uuid)
language sql stable security definer set search_path=public as $$
 with windows as (
 select d.clinic_id,day::date as local_day,a.start_time::time as starts,a.end_time::time as ends,
 greatest(5,least(240,coalesce(d.average_consultation_minutes,a.slot_minutes,30))) as duration
 from doctors d join doctor_availability a on a.doctor_id=d.id and a.is_active=true
 left join clinics c on c.id=d.clinic_id
 cross join generate_series((now() at time zone 'America/Sao_Paulo')::date, (now() at time zone 'America/Sao_Paulo')::date+20,interval '1 day') day
 where d.id=p_doctor_id and d.is_active=true and auth.uid() is not null and d.photo_path is not null and (d.clinic_id is null or c.is_active=true)
 and coalesce(a.weekday,a.day_of_week)=extract(dow from day)
 and exists(select 1 from doctor_specialties ds where ds.doctor_id=d.id and ds.specialty_id=p_specialty_id)
 ), slots as (
 select w.clinic_id,slot as starts_at,slot+make_interval(mins=>w.duration) as ends_at from windows w
 cross join lateral generate_series((w.local_day+w.starts) at time zone 'America/Sao_Paulo',((w.local_day+w.ends) at time zone 'America/Sao_Paulo')-make_interval(mins=>w.duration),make_interval(mins=>w.duration)) slot
 )
 select distinct s.starts_at,s.ends_at,s.clinic_id from slots s where s.starts_at>now() and not exists(
 select 1 from appointments a where a.doctor_id=p_doctor_id and a.status in ('pending','confirmed') and coalesce(a.confirmed_start_at,a.requested_start_at)<s.ends_at and coalesce(a.confirmed_end_at,a.requested_end_at)>s.starts_at)
 order by s.starts_at limit 40;
$$;
revoke all on function public.get_doctor_booking_slots(uuid,uuid) from public;
grant execute on function public.get_doctor_booking_slots(uuid,uuid) to authenticated;

create or replace function public.request_doctor_booking(p_doctor_id uuid,p_specialty_id uuid,p_start_at timestamptz)
returns uuid language plpgsql security definer set search_path=public as $$
declare slot record; result uuid;
begin
 if not exists(select 1 from patients where id=auth.uid()) then raise exception 'Complete seu cadastro de paciente'; end if;
 perform pg_advisory_xact_lock(hashtext(p_doctor_id::text));
 select * into slot from get_doctor_booking_slots(p_doctor_id,p_specialty_id) where start_at=p_start_at;
 if not found then raise exception 'Horário indisponível. Atualize a agenda'; end if;
 if not exists(select 1 from doctors where id=p_doctor_id and accepts_private_consultation=true) or (slot.clinic_id is not null and not exists(select 1 from clinics where id=slot.clinic_id and accepts_private_consultation=true)) then raise exception 'Este fluxo é para consultas particulares. Consulte convênios na plataforma web'; end if;
 if exists(select 1 from appointments where patient_id=auth.uid() and doctor_id=p_doctor_id and specialty_id=p_specialty_id and status in ('pending','confirmed')) then raise exception 'Você já possui uma solicitação ativa para este profissional'; end if;
 insert into appointments(patient_id,doctor_id,clinic_id,specialty_id,requested_start_at,requested_end_at,status,patient_confirmation_status,appointment_mode,auto_suggested,appointment_duration_minutes)
 values(auth.uid(),p_doctor_id,slot.clinic_id,p_specialty_id,slot.start_at,slot.end_at,'pending','not_requested','private',false,extract(epoch from(slot.end_at-slot.start_at))::integer/60) returning id into result;
 return result;
end $$;
revoke all on function public.request_doctor_booking(uuid,uuid,timestamptz) from public;
grant execute on function public.request_doctor_booking(uuid,uuid,timestamptz) to authenticated;


-- 20260917050000_health_plan_catalog.sql
alter table public.health_plans add column if not exists catalog_key text;
alter table public.health_plans add column if not exists source_url text;
alter table public.health_plans add column if not exists catalog_scope text;
create unique index if not exists health_plans_catalog_key on public.health_plans(catalog_key) where catalog_key is not null;
-- Reference catalog, not a statement of eligibility, coverage or current sale.
-- Never merge variants, legacy IDs or regional Unimed cooperatives by name.
insert into health_plans(name,operator_name,plan_type,catalog_key,source_url,catalog_scope) values
('Prestige Empresarial/PME AHO QP COP','SulAmérica Saúde','Saúde','sulamerica-469529131','https://www.sulamerica.com.br/saude/Proposta_Saude_PMEMais.pdf','ANS 469529131; ambulatorial/hospitalar, apartamento com coparticipação. Referência documental histórica; confira a carteirinha e contrato'),
('Executivo Empresarial/PME AHO QP COP','SulAmérica Saúde','Saúde','sulamerica-469530135','https://www.sulamerica.com.br/saude/Proposta_Saude_PMEMais.pdf','ANS 469530135; ambulatorial/hospitalar, apartamento com coparticipação. Referência documental histórica; confira a carteirinha e contrato'),
('Especial 100 Empresarial/PME AHO QP COP','SulAmérica Saúde','Saúde','sulamerica-469531133','https://www.sulamerica.com.br/saude/Proposta_Saude_PMEMais.pdf','ANS 469531133; ambulatorial/hospitalar, apartamento com coparticipação. Referência documental histórica; confira a carteirinha e contrato'),
('Clássico Empresarial/PME AHO QP COP','SulAmérica Saúde','Saúde','sulamerica-469532131','https://www.sulamerica.com.br/saude/Proposta_Saude_PMEMais.pdf','ANS 469532131; ambulatorial/hospitalar, apartamento com coparticipação. Referência documental histórica; confira a carteirinha e contrato'),
('Exato Empresarial/PME AHO QP COP','SulAmérica Saúde','Saúde','sulamerica-469535136','https://www.sulamerica.com.br/saude/Proposta_Saude_PMEMais.pdf','ANS 469535136; ambulatorial/hospitalar, apartamento com coparticipação. Referência documental histórica; confira a carteirinha e contrato'),
('Ouro Pro Copar Q','Porto Saúde','Saúde','porto-ouro-pro-copar-q','https://www.portoseguro.com.br/porto%20seguro-saude/','Categoria conforme identificação na carteirinha'),
('Prata Pro Copar E','Porto Saúde','Saúde','porto-prata-pro-copar-e','https://www.portoseguro.com.br/porto%20seguro-saude/','Categoria conforme identificação na carteirinha'),
('Diamante Pro Copar Q','Porto Saúde','Saúde','porto-diamante-pro-copar-q','https://www.portoseguro.com.br/porto%20seguro-saude/','Categoria conforme identificação na carteirinha'),
('Amil S380 MG','Amil','Saúde','amil-s380-mg','https://galeria.amil.com.br/corretor/materiais/80550_281202023083537_manual_de_vendas_amil_pme_-_dezembro_2023_%28v57%29.pdf','Variante MG; referência documental 2023, não equivale a outras regiões'),
('Amil S450 MG','Amil','Saúde','amil-s450-mg','https://galeria.amil.com.br/corretor/materiais/80550_281202023083537_manual_de_vendas_amil_pme_-_dezembro_2023_%28v57%29.pdf','Variante MG; referência documental 2023, não equivale a outras regiões'),
('Top Nacional Q CE A','Bradesco Saúde','Saúde','bradesco-top-nacional-q-ce-a-443100036','https://www3.bradescoseguros.com.br/upload/br/saude/443100036_Plano_Top_FE_Nac_Quarto_sem_copart_versao_a3.pdf','Variante do regulamento 443100036; não equivale a outros planos Top'),
('Nosso Plano','Hapvida','Saúde','hapvida-nosso-plano','https://www2.hapvida.com.br/planos-de-saude-individuais','Categoria; conferir região, acomodação e contrato'),
('Nosso Médico','Hapvida','Saúde','hapvida-nosso-medico','https://www2.hapvida.com.br/planos-de-saude-individuais','Categoria; conferir região e contrato'),
('Mix','Hapvida','Saúde','hapvida-mix','https://www2.hapvida.com.br/planos-de-saude-individuais','Categoria; conferir região, acomodação e contrato'),
('Pleno','Hapvida','Saúde','hapvida-pleno','https://www2.hapvida.com.br/planos-de-saude-individuais','Categoria; conferir região, acomodação e contrato')
on conflict(catalog_key) where catalog_key is not null do nothing;

create or replace function public.normalize_patient_catalog_plan() returns trigger language plpgsql set search_path=public as $$
declare plan health_plans;
begin
 if new.default_health_plan_id is not null then
  select * into plan from health_plans where id=new.default_health_plan_id;
  if not found then raise exception 'Plano cadastrado inválido'; end if;
  new.health_plan_operator:=coalesce(plan.operator_name,new.health_plan_operator);
  new.health_plan_product_name:=plan.name;
 end if;
 return new;
end $$;
create trigger normalize_patient_plan before insert or update of default_health_plan_id,health_plan_operator,health_plan_product_name on public.patients for each row execute function public.normalize_patient_catalog_plan();

-- 20260917060000_clinical_summaries.sql
alter table public.patient_preferences add column if not exists clinical_ai_consent boolean not null default false;
create table public.clinical_history_grants(
 patient_id uuid not null references patients(id),doctor_id uuid not null references doctors(id),
 expires_at timestamptz not null,created_at timestamptz not null default now(),primary key(patient_id,doctor_id)
);
alter table public.clinical_history_grants enable row level security;
grant select,insert,update,delete on public.clinical_history_grants to authenticated;
create policy patient_controls_history on public.clinical_history_grants for all to authenticated using(patient_id=auth.uid()) with check(patient_id=auth.uid() and expires_at>now() and expires_at<=now()+interval '90 days' and exists(select 1 from appointments a where a.patient_id=auth.uid() and a.doctor_id=clinical_history_grants.doctor_id));
create or replace function public.has_clinical_history_access(p_patient uuid) returns boolean language sql stable security definer set search_path=public as $$
 select auth.uid() is not null and (p_patient=auth.uid() or exists(select 1 from clinical_history_grants g join doctors d on d.id=g.doctor_id where g.patient_id=p_patient and g.expires_at>now() and d.user_id=auth.uid() and d.is_active=true));
$$;
revoke all on function public.has_clinical_history_access(uuid) from public;
grant execute on function public.has_clinical_history_access(uuid) to authenticated;
-- Restrict legacy broad read policies as well. A treating doctor keeps access to
-- their own note; access to other professionals' notes needs a patient grant.
alter table public.consultation_notes enable row level security;
create policy clinical_note_read_guard on public.consultation_notes as restrictive for select to authenticated using(public.has_clinical_history_access(patient_id) or exists(select 1 from doctors d where d.id=doctor_id and d.user_id=auth.uid()));

-- A shared row does not expose the physician's private_notes column.
revoke select on public.consultation_notes from public,anon,authenticated;
revoke select(private_notes) on public.consultation_notes from public,anon,authenticated;
do $$declare columns_list text;begin
 select string_agg(quote_ident(attname),',') into columns_list from pg_attribute where attrelid='public.consultation_notes'::regclass and attnum>0 and not attisdropped and attname<>'private_notes';
 execute 'grant select('||columns_list||') on public.consultation_notes to authenticated';
end $$;
create or replace function public.read_own_consultation_note(p_appointment_id uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select to_jsonb(n) from consultation_notes n join doctors d on d.id=n.doctor_id where n.appointment_id=p_appointment_id and d.user_id=auth.uid() limit 1;
$$;
revoke all on function public.read_own_consultation_note(uuid) from public;
grant execute on function public.read_own_consultation_note(uuid) to authenticated;
create policy clinical_note_insert_guard on public.consultation_notes as restrictive for insert to authenticated with check(exists(select 1 from appointments a join doctors d on d.id=a.doctor_id where a.id=appointment_id and a.patient_id=consultation_notes.patient_id and a.doctor_id=consultation_notes.doctor_id and a.status='confirmed' and d.user_id=auth.uid()));
create policy clinical_note_update_guard on public.consultation_notes as restrictive for update to authenticated using(exists(select 1 from appointments a join doctors d on d.id=a.doctor_id where a.id=appointment_id and a.patient_id=consultation_notes.patient_id and a.doctor_id=consultation_notes.doctor_id and a.status='confirmed' and d.user_id=auth.uid())) with check(exists(select 1 from appointments a join doctors d on d.id=a.doctor_id where a.id=appointment_id and a.patient_id=consultation_notes.patient_id and a.doctor_id=consultation_notes.doctor_id and a.status='confirmed' and d.user_id=auth.uid()));
create policy clinical_note_delete_guard on public.consultation_notes as restrictive for delete to authenticated using(false);

-- Shared base history must not bypass the explicit patient grant.
alter table public.medical_records enable row level security;
create policy medical_record_shared_read on public.medical_records for select to authenticated using(public.has_clinical_history_access(patient_id));
create policy medical_record_read_guard on public.medical_records as restrictive for select to authenticated using(public.has_clinical_history_access(patient_id));
create policy medical_record_update_guard on public.medical_records as restrictive for update to authenticated using(public.has_clinical_history_access(patient_id)) with check(public.has_clinical_history_access(patient_id));
create policy medical_record_insert_guard on public.medical_records as restrictive for insert to authenticated with check(public.has_clinical_history_access(patient_id));
-- Legacy prescriptions remain original records, never proof of certification.
alter table public.prescriptions enable row level security;
create policy prescription_read_guard on public.prescriptions as restrictive for select to authenticated using(public.has_clinical_history_access(patient_id) or exists(select 1 from doctors d where d.id=doctor_id and d.user_id=auth.uid()));
drop policy certified_document_read_guard on public.medical_documents;
create policy certified_document_read_guard on public.medical_documents as restrictive for select to authenticated using(
 not certification_required or exists(select 1 from doctors d where d.id=doctor_id and d.user_id=auth.uid()) or (public.has_clinical_history_access(patient_id) and released_to_patient and status='issued')
);
create policy shared_document_read on public.medical_documents for select to authenticated using(public.has_clinical_history_access(patient_id) and released_to_patient and status='issued');

create table public.clinical_summary_jobs(
 appointment_id uuid primary key references appointments(id),status text not null default 'queued' check(status in ('queued','processing','done','failed')),
 source_revision integer not null default 0,attempts integer not null default 0,updated_at timestamptz not null default now()
);
alter table public.clinical_summary_jobs enable row level security;
revoke all on public.clinical_summary_jobs from anon,authenticated;
grant all on public.clinical_summary_jobs to service_role;
create table public.clinical_ai_summaries(
 id uuid primary key default gen_random_uuid(),appointment_id uuid not null references appointments(id),patient_id uuid not null references patients(id),doctor_id uuid not null references doctors(id),
 source_revision integer not null default 0,summary text not null check(length(summary) between 1 and 12000),source_hash text not null,model text not null,
 created_at timestamptz not null default now(),reviewed_at timestamptz,reviewed_by uuid references auth.users(id),
 unique(appointment_id,source_hash)
);
alter table public.clinical_ai_summaries enable row level security;
revoke all on public.clinical_ai_summaries from anon,authenticated;
grant select on public.clinical_ai_summaries to authenticated;
grant all on public.clinical_ai_summaries to service_role;
create policy clinical_ai_read on public.clinical_ai_summaries for select to authenticated using((reviewed_at is not null and public.has_clinical_history_access(patient_id)) or exists(select 1 from doctors d where d.id=doctor_id and d.user_id=auth.uid()));
create or replace function public.enqueue_clinical_summary() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.status='completed' and old.status is distinct from new.status then
 insert into clinical_summary_jobs(appointment_id) values(new.id) on conflict do nothing;
 end if;return new;
end $$;
create trigger enqueue_clinical_summary after update of status on appointments for each row execute function public.enqueue_clinical_summary();
-- New documents/notes after completion request a new summary version.
create or replace function public.refresh_clinical_summary_source() returns trigger language plpgsql security definer set search_path=public as $$
declare appt_id uuid;
begin
 appt_id:=case when TG_OP='DELETE' then old.appointment_id else new.appointment_id end;
 if exists(select 1 from appointments where id=appt_id and status='completed') then
  insert into clinical_summary_jobs(appointment_id) values(appt_id) on conflict(appointment_id) do update set
   source_revision=clinical_summary_jobs.source_revision+1,attempts=0,
   status=case when clinical_summary_jobs.status='processing' then 'processing' else 'queued' end,updated_at=now();
 end if;
 if TG_OP='DELETE' then return old;end if;return new;
end $$;
create trigger refresh_summary_notes after insert or update or delete on consultation_notes for each row execute function public.refresh_clinical_summary_source();
create trigger refresh_summary_documents after insert or update or delete on medical_documents for each row execute function public.refresh_clinical_summary_source();
create trigger refresh_summary_legacy after insert or update or delete on prescriptions for each row execute function public.refresh_clinical_summary_source();
create or replace function public.claim_clinical_summary_job() returns setof clinical_summary_jobs language sql security definer set search_path=public as $$
 update clinical_summary_jobs set status='processing',attempts=attempts+1,updated_at=now() where appointment_id in (
 select j.appointment_id from clinical_summary_jobs j join appointments a on a.id=j.appointment_id join patient_preferences p on p.patient_id=a.patient_id
 where j.status='queued' and j.attempts<3 and a.status='completed' and p.clinical_ai_consent=true order by j.updated_at for update of j skip locked limit 1
 ) returning *;
$$;
revoke all on function public.claim_clinical_summary_job() from public;
grant execute on function public.claim_clinical_summary_job() to service_role;
create or replace function public.review_clinical_summary(p_summary_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 update clinical_ai_summaries s set reviewed_at=now(),reviewed_by=auth.uid() where s.id=p_summary_id and s.reviewed_at is null
 and exists(select 1 from clinical_summary_jobs j where j.appointment_id=s.appointment_id and j.source_revision=s.source_revision)
 and exists(select 1 from doctors d where d.id=s.doctor_id and d.user_id=auth.uid() and d.is_active=true);
 if not found then raise exception 'Resumo não disponível para revisão por este médico'; end if;
end $$;
revoke all on function public.review_clinical_summary(uuid) from public;
grant execute on function public.review_clinical_summary(uuid) to authenticated;

create table public.clinical_history_access_log(id uuid primary key default gen_random_uuid(),patient_id uuid references patients(id),actor_id uuid references auth.users(id),created_at timestamptz not null default now());
alter table public.clinical_history_access_log enable row level security;
revoke all on public.clinical_history_access_log from anon,authenticated;
grant all on public.clinical_history_access_log to service_role;
create or replace function public.read_authorized_clinical_history(p_patient_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
 if not public.has_clinical_history_access(p_patient_id) then raise exception 'O paciente precisa autorizar o acesso ao histórico'; end if;
 insert into clinical_history_access_log(patient_id,actor_id) values(p_patient_id,auth.uid());
 select coalesce(jsonb_agg(item order by happened_at desc),'[]'::jsonb) into result from (
 select coalesce(a.confirmed_start_at,a.created_at) as happened_at,jsonb_build_object('id',a.id,'date',coalesce(a.confirmed_start_at,a.created_at),'doctor_name',d.name,
 'ai_summaries',(select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'summary',s.summary,'created_at',s.created_at,'reviewed_at',s.reviewed_at) order by s.created_at desc),'[]'::jsonb) from clinical_ai_summaries s where s.appointment_id=a.id and s.reviewed_at is not null),
 'notes',(select coalesce(jsonb_agg(jsonb_build_object('subjective',n.subjective,'objective',n.objective,'assessment',n.assessment,'plan',n.plan,'summary',n.summary)),'[]'::jsonb) from consultation_notes n where n.appointment_id=a.id),
 'legacy_prescriptions',(select coalesce(jsonb_agg(jsonb_build_object('title',p.title,'content',p.content,'guidance',p.guidance)),'[]'::jsonb) from prescriptions p where p.appointment_id=a.id),
 'documents',(select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'title',m.title,'type',m.document_type,'text',m.plain_text,'issued_at',m.issued_at)),'[]'::jsonb) from medical_documents m where m.appointment_id=a.id and m.status='issued' and m.released_to_patient=true)) as item
 from appointments a join doctors d on d.id=a.doctor_id where a.patient_id=p_patient_id and a.status='completed' order by happened_at desc limit 100
 ) entries;return result;
end $$;
revoke all on function public.read_authorized_clinical_history(uuid) from public;
grant execute on function public.read_authorized_clinical_history(uuid) to authenticated;

-- 20260917070000_external_contacts.sql
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

-- 20260917080000_payment_sandbox.sql
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

-- 20260917090000_legacy_prescriptions_readonly.sql
-- Preserve historical free-text records. All new prescriptions use the existing
-- structured medical_documents flow and its certification/content guards.
create or replace function public.guard_legacy_prescription_write() returns trigger language plpgsql set search_path=public as $$
begin
 raise exception 'Receitas anteriores são preservadas. Crie uma nova receita em Documentos da consulta';
end $$;
create trigger preserve_legacy_prescription before insert or update or delete on public.prescriptions for each row execute function public.guard_legacy_prescription_write();

commit;
