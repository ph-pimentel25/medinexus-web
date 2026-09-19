-- Pacote gerado das migrações novas; executar uma vez em homologação.
-- Não usar este pacote depois de aplicar os mesmos arquivos individualmente.

-- 20260916020000_professional_documents.sql
-- Apply after the existing MediNexus schema. No backfill changes old documents.
begin;
create or replace function public.set_doctor_specialties(p_doctor_id uuid, p_specialty_ids uuid[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from doctors where id = p_doctor_id and user_id = auth.uid()) then
    raise exception 'Somente o médico pode alterar suas especialidades';
  end if;
  if cardinality(p_specialty_ids) < 1 or p_specialty_ids is null then raise exception 'Selecione uma especialidade'; end if;
  if exists(select 1 from unnest(p_specialty_ids) x where not exists(select 1 from specialties s where s.id=x)) then raise exception 'Especialidade inválida'; end if;
  perform 1 from doctors where id=p_doctor_id for update;
  delete from doctor_specialties where doctor_id=p_doctor_id;
  insert into doctor_specialties(doctor_id,specialty_id) select p_doctor_id,x from (select distinct unnest(p_specialty_ids) x) ids;
end $$;
revoke all on function public.set_doctor_specialties(uuid,uuid[]) from public;
grant execute on function public.set_doctor_specialties(uuid,uuid[]) to authenticated;

create table if not exists public.doctor_signatures (
  doctor_id uuid primary key references public.doctors(id),
  image_data text not null check (image_data like 'data:image/png;base64,%' and length(image_data) < 200000),
  authorized_at timestamptz not null default now(),
  authorized_by uuid not null references auth.users(id)
);
alter table public.doctor_signatures enable row level security;
create policy signature_owner_read on public.doctor_signatures for select to authenticated using (authorized_by=auth.uid());
create policy signature_owner_revoke on public.doctor_signatures for delete to authenticated using (authorized_by=auth.uid());
grant select, delete on public.doctor_signatures to authenticated;
create or replace function public.authorize_doctor_signature(p_doctor_id uuid, p_image text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from doctors where id=p_doctor_id and user_id=auth.uid()) then raise exception 'Médico não autorizado'; end if;
  insert into doctor_signatures(doctor_id,image_data,authorized_at,authorized_by) values(p_doctor_id,p_image,now(),auth.uid())
  on conflict(doctor_id) do update set image_data=excluded.image_data,authorized_at=now(),authorized_by=auth.uid();
end $$;
revoke all on function public.authorize_doctor_signature(uuid,text) from public;
grant execute on function public.authorize_doctor_signature(uuid,text) to authenticated;

alter table public.medical_documents add column if not exists signature_image text;
alter table public.medical_documents add column if not exists signature_authorized_at timestamptz;
alter table public.medical_documents add column if not exists certification_required boolean not null default false;
alter table public.medical_documents add column if not exists certificate_subject text;
alter table public.medical_documents add column if not exists certificate_issuer text;
alter table public.medical_documents add column if not exists certificate_serial text;
alter table public.medical_documents add column if not exists certificate_verified_at timestamptz;
alter table public.medical_documents add column if not exists identity_snapshot jsonb;

create or replace function public.guard_certified_document()
returns trigger language plpgsql security definer set search_path = public as $$
declare signature_row doctor_signatures; appt appointments; doc doctors;
begin
  if TG_OP='INSERT' then
    select * into doc from doctors where id=new.doctor_id;
    if auth.uid() is null or doc.user_id is distinct from auth.uid() then raise exception 'Emissão permitida somente ao médico responsável'; end if;
    select * into appt from appointments where id=new.appointment_id;
    if not found or appt.doctor_id is distinct from new.doctor_id or appt.patient_id is distinct from new.patient_id or appt.clinic_id is distinct from new.clinic_id then raise exception 'Documento não corresponde à consulta'; end if;
    select * into signature_row from doctor_signatures where doctor_id=new.doctor_id and authorized_by=auth.uid();
    new.signature_image := signature_row.image_data;
    new.signature_authorized_at := signature_row.authorized_at;
    new.certification_required := true;
    new.status := 'draft'; new.signature_status := 'pending';
    new.released_to_patient := false; new.released_at := null; new.issued_at := null;
    new.signed_at := null; new.signed_pdf_url := null; new.document_hash := null;
    new.certificate_subject := null; new.certificate_issuer := null; new.certificate_serial := null; new.certificate_verified_at := null;
    new.signature_provider := null; new.signature_validation_url := null;
    new.created_by := auth.uid();
    new.doctor_name := doc.name; new.doctor_crm := doc.crm; new.doctor_crm_state := doc.crm_state;
    new.identity_snapshot := jsonb_build_object(
      'patient', (select jsonb_build_object('full_name',full_name,'cpf',cpf,'birth_date',birth_date,'phone',phone,'health_plan_operator',health_plan_operator) from patients where id=new.patient_id),
      'doctor', jsonb_build_object('name',doc.name,'crm',doc.crm,'crm_state',doc.crm_state),
      'clinic', (select jsonb_build_object('trade_name',trade_name,'legal_name',legal_name,'address_street',address_street,'address_number',address_number,'address_complement',address_complement,'address_city',address_city,'address_state',address_state,'address_neighborhood',address_neighborhood) from clinics where id=new.clinic_id)
    );
  elsif old.certification_required then
    if auth.role() is distinct from 'service_role' then
      if not exists(select 1 from doctors where id=old.doctor_id and user_id=auth.uid()) then raise exception 'Médico não autorizado'; end if;
      if (to_jsonb(new) - 'status' - 'cancelled_at' - 'cancelled_reason' - 'updated_at') is distinct from (to_jsonb(old) - 'status' - 'cancelled_at' - 'cancelled_reason' - 'updated_at')
        or new.status is distinct from old.status and new.status <> 'cancelled' then
        raise exception 'Documento preservado. Crie uma nova versão ou use o serviço de certificação';
      end if;
    end if;
    if new.status='cancelled' then new.released_to_patient := false; new.cancelled_at := coalesce(new.cancelled_at,now()); end if;
    if new.status='issued' and (new.signature_status is distinct from 'signed' or new.certificate_verified_at is null or new.signed_pdf_url is null or new.document_hash is null or new.certificate_serial is null) then raise exception 'Certificação ICP-Brasil ainda pendente'; end if;
    if new.released_to_patient and new.status <> 'issued' then raise exception 'Documento não certificado não pode ser liberado'; end if;
  end if;
  return new;
end $$;
alter table public.medical_documents enable row level security;
create policy certified_document_read on public.medical_documents for select to authenticated using (
 certification_required and (exists(select 1 from doctors where id=doctor_id and user_id=auth.uid()) or (patient_id=auth.uid() and released_to_patient and status='issued'))
);
create policy certified_document_read_guard on public.medical_documents as restrictive for select to authenticated using (
 not certification_required or exists(select 1 from doctors where id=doctor_id and user_id=auth.uid()) or (patient_id=auth.uid() and released_to_patient and status='issued')
);
create policy certified_document_anonymous_guard on public.medical_documents as restrictive for select to anon using(not certification_required);
create trigger enforce_certification before insert or update on public.medical_documents for each row execute function public.guard_certified_document();
commit;


-- 20260916030000_profiles_reviews.sql
begin;
create table if not exists public.patient_preferences (
  patient_id uuid primary key references public.patients(id),
  avatar_path text,
  whatsapp_consent boolean not null default false,
  email_consent boolean not null default false,
  consent_updated_at timestamptz not null default now(),
  check(avatar_path is null or split_part(avatar_path,'/',1)=patient_id::text)
);
alter table public.patient_preferences enable row level security;
create policy own_preferences on public.patient_preferences for all to authenticated using(patient_id=auth.uid()) with check(patient_id=auth.uid());
grant select,insert,update,delete on public.patient_preferences to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('patient-avatars','patient-avatars',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy own_avatar_read on storage.objects for select to authenticated using(bucket_id='patient-avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy own_avatar_insert on storage.objects for insert to authenticated with check(bucket_id='patient-avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy own_avatar_delete on storage.objects for delete to authenticated using(bucket_id='patient-avatars' and (storage.foldername(name))[1]=auth.uid()::text);

create table public.care_reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id),
  author_id uuid not null references auth.users(id),
  target_kind text not null check(target_kind in ('doctor','clinic','patient')),
  target_id uuid not null,
  rating integer not null check(rating between 1 and 5),
  comment text not null default '' check(length(comment)<=1200),
  anonymous boolean not null default true,
  created_at timestamptz not null default now(),
  unique(appointment_id,author_id,target_kind)
);
alter table public.care_reviews enable row level security;
create policy own_review_read on public.care_reviews for select to authenticated using(author_id=auth.uid());
-- Writes go through the RPC, which derives the target from a completed consultation.
grant select on public.care_reviews to authenticated;
create or replace function public.submit_care_review(p_appointment_id uuid,p_target_kind text,p_rating integer,p_comment text,p_anonymous boolean)
returns uuid language plpgsql security definer set search_path=public as $$
declare a appointments; target uuid; review_id uuid;
begin
 select * into a from appointments where id=p_appointment_id;
 if not found or a.status <> 'completed' then raise exception 'Avalie apenas consultas concluídas'; end if;
 if p_target_kind in ('doctor','clinic') and a.patient_id=auth.uid() then
   target := case when p_target_kind='doctor' then a.doctor_id else a.clinic_id end;
 elsif p_target_kind='patient' and exists(select 1 from doctors where id=a.doctor_id and user_id=auth.uid() and is_active=true) then
   target := a.patient_id;
   if coalesce(trim(p_comment),'') <> '' then raise exception 'Avaliações de pacientes usam apenas a nota de pontualidade e comunicação, sem dados clínicos'; end if;
 else raise exception 'Você não pode avaliar esta consulta'; end if;
 if target is null then raise exception 'Perfil não encontrado'; end if;
 insert into care_reviews(appointment_id,author_id,target_kind,target_id,rating,comment,anonymous)
 values(a.id,auth.uid(),p_target_kind,target,p_rating,trim(coalesce(p_comment,'')),p_anonymous) returning id into review_id;
 return review_id;
end $$;
revoke all on function public.submit_care_review(uuid,text,integer,text,boolean) from public;
grant execute on function public.submit_care_review(uuid,text,integer,text,boolean) to authenticated;
create or replace function public.read_care_reviews(p_target_kind text,p_target_id uuid)
returns table(id uuid,rating integer,comment text,author_name text,created_at timestamptz)
language plpgsql stable security definer set search_path=public as $$
begin
 if p_target_kind not in ('doctor','clinic','patient') then raise exception 'Tipo inválido'; end if;
 if p_target_kind='patient' and not exists(select 1 from doctors where user_id=auth.uid() and is_active=true) then raise exception 'Avaliações de pacientes são restritas à área médica'; end if;
 return query select r.id,r.rating,r.comment,case when r.anonymous then 'Avaliação anônima' else coalesce(nullif(split_part(p.full_name,' ',1),''),'Usuário') end,r.created_at
 from care_reviews r left join profiles p on p.id=r.author_id where r.target_kind=p_target_kind and r.target_id=p_target_id order by r.created_at desc limit 100;
end $$;
revoke all on function public.read_care_reviews(text,uuid) from public;
grant execute on function public.read_care_reviews(text,uuid) to anon,authenticated;
commit;


-- 20260916040000_notifications.sql
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


-- 20260916050000_discovery_quota.sql
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


-- 20260916060000_doctor_offices.sql
begin;
alter table public.doctors add column if not exists address_zipcode text;
alter table public.doctors add column if not exists address_street text;
alter table public.doctors add column if not exists address_number text;
alter table public.doctors add column if not exists address_complement text;
alter table public.doctors add column if not exists address_neighborhood text;
alter table public.doctors add column if not exists address_city text;
alter table public.doctors add column if not exists address_state text;
alter table public.doctors add column if not exists latitude double precision;
alter table public.doctors add column if not exists longitude double precision;
commit;


-- 20260916070000_native_booking.sql
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
