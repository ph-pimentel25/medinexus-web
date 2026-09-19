// Read-only schema check. No patient records are fetched and no SQL is executed.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Configure o ambiente Supabase antes de verificar o esquema.");
const response = await fetch(url + "/rest/v1/", {
  headers: { apikey: key, Authorization: "Bearer " + key, Accept: "application/openapi+json" },
  signal: AbortSignal.timeout(15000),
});
if (!response.ok) throw new Error(`Não foi possível consultar o esquema (HTTP ${response.status}).`);
const schema = await response.json();
const tables = ["doctor_signatures", "patient_preferences", "care_reviews", "appointment_outbox", "discovery_quota"];
const rpcs = ["set_doctor_specialties", "authorize_doctor_signature", "read_care_reviews", "submit_care_review", "consume_discovery_quota", "get_doctor_booking_slots", "request_doctor_booking"];
const result = {
  tables: Object.fromEntries(tables.map(name => [name, Boolean(schema.definitions?.[name])])),
  functions: Object.fromEntries(rpcs.map(name => [name, Boolean(schema.paths?.["/rpc/" + name])])),
  documentCertificateFields: Boolean(schema.definitions?.medical_documents?.properties?.certification_required),
  doctorAddressFields: Boolean(schema.definitions?.doctors?.properties?.address_zipcode),
  productionTables: Object.fromEntries([
    "appointment_payment_quotes", "platform_commercial_policy", "professional_commercial_terms",
    "clinical_history_grants", "clinical_ai_summaries", "clinical_summary_jobs",
    "appointment_checkout_sessions", "payment_webhook_events", "external_care_contacts",
  ].map(name => [name, Boolean(schema.definitions?.[name])])),
  productionFunctions: Object.fromEntries([
    "prepare_appointment_payment", "set_doctor_photo", "match_patient_availability",
    "request_matched_appointment", "resolve_appointment_coverage", "read_own_consultation_note",
    "read_authorized_clinical_history", "apply_sandbox_checkout_event",
  ].map(name => [name, Boolean(schema.paths?.["/rpc/" + name])])),
  productionColumns: Object.fromEntries([
    ["doctors", "photo_path"], ["appointments", "coverage_status"],
    ["health_plans", "catalog_key"], ["patient_preferences", "clinical_ai_consent"],
  ].map(([table, column]) => [table + "." + column, Boolean(schema.definitions?.[table]?.properties?.[column])])),
};
console.log(JSON.stringify(result, null, 2));
console.log("Verificação de estrutura; não comprova políticas RLS, envio ou certificação real.");
