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
