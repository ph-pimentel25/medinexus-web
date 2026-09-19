-- Somente leitura: execute no SQL Editor antes de escolher o pacote.
select
 to_regclass('public.doctor_signatures') is not null as base_16_assinatura,
 to_regprocedure('public.request_doctor_booking(uuid,uuid,timestamp with time zone)') is not null as base_16_agendamento,
 to_regclass('public.appointment_payment_quotes') is not null as pacote_17_pagamentos,
 to_regprocedure('public.validate_new_document_content()') is not null as pacote_17_documentos,
 to_regprocedure('public.match_patient_availability(uuid)') is not null as pacote_18_disponibilidade,
 to_regclass('public.clinical_ai_summaries') is not null as pacote_18_resumos,
 to_regclass('public.appointment_checkout_sessions') is not null as pacote_18_checkout,
 to_regclass('public.external_care_contacts') is not null as pacote_18_contatos;
