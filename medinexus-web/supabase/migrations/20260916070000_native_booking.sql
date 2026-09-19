begin;
-- Return only free slots, never another patient's identity or appointment record.
create or replace function public.get_doctor_booking_slots(p_doctor_id uuid,p_specialty_id uuid)
returns table(start_at timestamptz,end_at timestamptz,clinic_id uuid)
language sql stable security definer set search_path=public as $$
 with windows as (
 select d.clinic_id,day::date as local_day,a.start_time::time as starts,a.end_time::time as ends,
 greatest(5,least(240,coalesce(d.average_consultation_minutes,a.slot_minutes,30))) as duration
 from doctors d join doctor_availability a on a.doctor_id=d.id and a.is_active=true
 join clinics c on c.id=d.clinic_id and c.is_active=true
 cross join generate_series((now() at time zone 'America/Sao_Paulo')::date, (now() at time zone 'America/Sao_Paulo')::date+20,interval '1 day') day
 where d.id=p_doctor_id and d.is_active=true and auth.uid() is not null
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
 if not exists(select 1 from doctors where id=p_doctor_id and accepts_private_consultation=true) or not exists(select 1 from clinics where id=slot.clinic_id and accepts_private_consultation=true) then raise exception 'Este fluxo é para consultas particulares. Consulte convênios na plataforma web'; end if;
 if exists(select 1 from appointments where patient_id=auth.uid() and doctor_id=p_doctor_id and specialty_id=p_specialty_id and status in ('pending','confirmed')) then raise exception 'Você já possui uma solicitação ativa para este profissional'; end if;
 insert into appointments(patient_id,doctor_id,clinic_id,specialty_id,requested_start_at,requested_end_at,status,patient_confirmation_status,appointment_mode,auto_suggested,appointment_duration_minutes)
 values(auth.uid(),p_doctor_id,slot.clinic_id,p_specialty_id,slot.start_at,slot.end_at,'pending','not_requested','private',false,extract(epoch from(slot.end_at-slot.start_at))::integer/60) returning id into result;
 return result;
end $$;
revoke all on function public.request_doctor_booking(uuid,uuid,timestamptz) from public;
grant execute on function public.request_doctor_booking(uuid,uuid,timestamptz) to authenticated;

-- All clients share the same lock, including the existing web scheduling flow.
create or replace function public.guard_appointment_overlap() returns trigger language plpgsql security definer set search_path=public as $$
declare starts timestamptz; ends timestamptz;
begin
 if new.status not in ('pending','confirmed') or new.doctor_id is null then return new; end if;
 starts:=coalesce(new.confirmed_start_at,new.requested_start_at); ends:=coalesce(new.confirmed_end_at,new.requested_end_at);
 if starts is null or ends is null then return new; end if;
 if ends<=starts then raise exception 'Intervalo de consulta inválido'; end if;
 perform pg_advisory_xact_lock(hashtext(new.doctor_id::text));
 if exists(select 1 from appointments a where a.id is distinct from new.id and a.doctor_id=new.doctor_id and a.status in ('pending','confirmed') and coalesce(a.confirmed_start_at,a.requested_start_at)<ends and coalesce(a.confirmed_end_at,a.requested_end_at)>starts) then raise exception 'Horário já reservado'; end if;
 return new;
end $$;
create trigger prevent_overlapping_booking before insert or update of status,doctor_id,requested_start_at,requested_end_at,confirmed_start_at,confirmed_end_at on appointments for each row execute function guard_appointment_overlap();
commit;
