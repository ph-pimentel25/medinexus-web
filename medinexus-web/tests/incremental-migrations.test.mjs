import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
test('both incremental SQL packages apply together over the previous release without deleting legacy rows',async()=>{
 const db=new PGlite();try{
 // Reuse the previous release fixture; assert the actual SQL Editor packages.
 const source=fs.readFileSync('tests/database.test.mjs','utf8');const fixture=source.match(/await db\.exec\(`([\s\S]*?)`\);/)[1];await db.exec(fixture);
 for(const f of ['20260916020000_professional_documents.sql','20260916030000_profiles_reviews.sql','20260916040000_notifications.sql','20260916050000_discovery_quota.sql','20260916060000_doctor_offices.sql','20260916070000_native_booking.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));
 await db.exec(`alter table profiles add latitude double precision,add longitude double precision;
 alter table doctors add private_price_cents integer,add doctor_completed boolean default false;
 alter table clinics add user_id uuid,add created_by uuid,add latitude double precision,add longitude double precision,add base_private_price_cents integer;
 alter table patients add default_health_plan_id uuid,add health_plan_product_name text;
 alter table appointments add created_at timestamptz default now();
 alter table medical_documents add document_type text,add title text,add plain_text text;
 create table health_plans(id uuid primary key default gen_random_uuid(),name text,operator_name text,plan_type text);
 create table clinic_members(clinic_id uuid,user_id uuid,member_role text,role text);
 create table doctor_health_plans(doctor_id uuid,health_plan_id uuid);
 create table clinic_health_plans(clinic_id uuid,health_plan_id uuid);
 create table patient_search_preferences(id uuid primary key,patient_id uuid,specialty_id uuid,preferred_start_date date,preferred_end_date date,preferred_clinic_id uuid,max_radius_km integer,accepts_private_consultation boolean);
 create table patient_search_time_windows(search_preference_id uuid,weekday integer,start_time time,end_time time);
 create table medical_records(id uuid primary key,patient_id uuid);
 create table consultation_notes(id uuid primary key,appointment_id uuid,patient_id uuid,doctor_id uuid,subjective text,objective text,assessment text,plan text,summary text,private_notes text);
 create table prescriptions(id uuid primary key,appointment_id uuid,patient_id uuid,doctor_id uuid,title text,content text,guidance text);
 insert into prescriptions(id,content) values('00000000-0000-4000-8000-000000000001','Legacy original');`);
 for(const file of ['ATUALIZACAO_20260917.sql','ATUALIZACAO_20260918.sql'])await db.exec(fs.readFileSync('supabase/'+file,'utf8'));
 assert.equal((await db.query('select content from prescriptions')).rows[0].content,'Legacy original');
 assert.equal((await db.query('select commission_enabled from platform_commercial_policy')).rows[0].commission_enabled,false);
 assert.equal((await db.query('select count(*)::int n from health_plans')).rows[0].n,15);
 await assert.rejects(db.query("update prescriptions set content='overwrite'"));
 // Private external contacts cannot be read or modified by another patient.
 await db.exec(`insert into auth.users values('00000000-0000-4000-8000-000000000002'),('00000000-0000-4000-8000-000000000003');
 insert into patients(id) select id from auth.users;grant usage on schema auth to authenticated;grant select on patients to authenticated;`);
 await db.query("select set_config('test.uid',$1,false)",['00000000-0000-4000-8000-000000000002']);await db.exec('set role authenticated');
 await db.query("insert into external_care_contacts(name,phone) values('Meu contato','21999999999')");
 await assert.rejects(db.query("insert into external_care_contacts(name,website) values('Malicious','javascript:alert(1)')"));
 await db.query("select set_config('test.uid',$1,false)",['00000000-0000-4000-8000-000000000003']);
 assert.equal((await db.query('select * from external_care_contacts')).rows.length,0);
 await assert.rejects(db.query("insert into external_care_contacts(name,owner_id) values('forged','00000000-0000-4000-8000-000000000002')"));
 }finally{await db.close();}
});
