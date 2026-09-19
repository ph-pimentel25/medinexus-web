begin;
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

commit;
