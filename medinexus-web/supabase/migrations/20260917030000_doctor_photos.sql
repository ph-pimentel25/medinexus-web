begin;
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
commit;
