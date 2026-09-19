-- Validate new records only; never rewrite an existing/signed medical document.
begin;
create or replace function public.validate_new_document_content()
returns trigger language plpgsql set search_path=public as $$
declare item jsonb; medications jsonb; rendered text:='';
begin
 if new.document_type<>'medical_certificate' then
   if new.days_off is not null or exists(
     select 1 from jsonb_path_query(coalesce(new.content,'{}'::jsonb),'$.** ? (@.type() == "object").keyvalue()') entry
     where entry->>'key' in ('days_off','rest_days','leave_days','medical_leave_days','rest_period','leave_period')
       and entry->'value'<>'null'::jsonb and entry->>'value'<>''
   ) then raise exception 'Dias e períodos de afastamento pertencem exclusivamente ao atestado médico'; end if;
 end if;
 if new.document_type='prescription' then
   medications:=case when new.content ? 'medications' then new.content->'medications' else jsonb_build_array(new.content) end;
   if jsonb_typeof(medications) is distinct from 'array' then raise exception 'Lista de medicamentos inválida'; end if;
   if jsonb_array_length(medications)<1 or jsonb_array_length(medications)>50 then raise exception 'Informe de 1 a 50 medicamentos'; end if;
   for item in select value from jsonb_array_elements(medications) loop
     if jsonb_typeof(item) is distinct from 'object' or length(trim(coalesce(item->>'medication_name','')))<2 or length(trim(coalesce(item->>'medication_use','')))<2 then
       raise exception 'Informe o nome do medicamento e a posologia';
     end if;
     rendered:=concat_ws(E'\n\n',nullif(rendered,''),concat_ws(E'\n',trim(item->>'medication_name'),
       'Posologia: '||trim(item->>'medication_use'),
       case when nullif(trim(item->>'dosage'),'') is not null then 'Dosagem: '||trim(item->>'dosage') end,
       case when nullif(trim(item->>'route'),'') is not null then 'Via: '||trim(item->>'route') end,
       case when nullif(trim(item->>'duration'),'') is not null then 'Duração: '||trim(item->>'duration') end,
       case when nullif(trim(item->>'quantity'),'') is not null then 'Quantidade: '||trim(item->>'quantity') end));
   end loop;
   new.plain_text:=concat_ws(E'\n\n',rendered,case when nullif(trim(new.content->>'notes'),'') is not null then 'Orientações: '||trim(new.content->>'notes') end);
   new.purpose:=null;
 end if;
 return new;
end $$;
create trigger validate_document_content before insert on public.medical_documents for each row execute function public.validate_new_document_content();
commit;
