begin;
-- Preserve historical free-text records. All new prescriptions use the existing
-- structured medical_documents flow and its certification/content guards.
create or replace function public.guard_legacy_prescription_write() returns trigger language plpgsql set search_path=public as $$
begin
 raise exception 'Receitas anteriores são preservadas. Crie uma nova receita em Documentos da consulta';
end $$;
create trigger preserve_legacy_prescription before insert or update or delete on public.prescriptions for each row execute function public.guard_legacy_prescription_write();
commit;
