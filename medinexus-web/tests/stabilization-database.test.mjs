import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;

test('stabilization migration preserves legacy records and enforces account type, verification and CNPJ',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create function auth.role() returns text language sql stable as $$select current_setting('test.role',true)$$;
 create table profiles(id uuid primary key,role text,full_name text);
 create table patients(id uuid primary key,full_name text);
 create table doctors(id uuid primary key,user_id uuid,name text,is_active boolean default true);
 create table clinics(id uuid primary key,user_id uuid,created_by uuid,cnpj text,trade_name text,is_active boolean default true);
 create table clinic_members(id uuid primary key,clinic_id uuid,user_id uuid,doctor_id uuid,member_role text,role text);
 insert into auth.users(id) values('${id(1)}'),('${id(2)}'),('${id(3)}');
 insert into profiles(id,role) values('${id(1)}','patient'),('${id(2)}','doctor'),('${id(3)}','clinic_admin');
 insert into patients values('${id(1)}','Legacy patient');
 insert into doctors values('${id(12)}','${id(2)}','Legacy doctor',true);
 insert into clinics values('${id(13)}','${id(3)}','${id(3)}','legacy-invalid','Legacy clinic',true);
 grant usage on schema public,auth to authenticated,service_role;
 grant select,insert,update,delete on all tables in schema public to authenticated,service_role;`);
 await db.exec(fs.readFileSync('supabase/migrations/20260919010000_account_stabilization.sql','utf8'));
 assert.equal((await db.query('select verification_status from doctors')).rows[0].verification_status,'verified');
 assert.equal((await db.query('select verification_status,cnpj from clinics')).rows[0].cnpj,'legacy-invalid');
 assert.equal((await db.query('select verification_status from clinics')).rows[0].verification_status,'verified');
 await db.query("select set_config('test.role','authenticated',false)");await db.exec('set role authenticated');
 for(const [n,role] of [[1,'patient'],[2,'doctor'],[3,'clinic']]){
  await db.query("select set_config('test.uid',$1,false)",[id(n)]);
  assert.equal((await db.query('select account_type from account_registration_locks')).rows[0].account_type,role);
  await assert.rejects(db.query("update account_registration_locks set account_type='doctor'"));
  if(role!=='doctor')await assert.rejects(db.query('insert into doctors(id,user_id) values($1,$2)',[id(100+n),id(n)]));
  if(role!=='clinic')await assert.rejects(db.query("insert into clinics(id,user_id,cnpj) values($1,$2,'11222333000181')",[id(110+n),id(n)]));
  if(role!=='patient')await assert.rejects(db.query('insert into patients(id) values($1)',[id(n)]));
  for(const target of ['patient','doctor','clinic_admin'])if(target!==(role==='clinic'?'clinic_admin':role))await assert.rejects(db.query('update profiles set role=$1 where id=$2',[target,id(n)]));
 }
 await assert.rejects(db.query("update doctors set verification_status='suspended'"));
 await assert.rejects(db.query("update clinics set verification_status='rejected'"));
 await db.query("update clinics set trade_name='Legacy clinic edited' where id=$1",[id(13)]);
 await assert.rejects(db.query("update clinics set cnpj='00000000000000' where id=$1",[id(13)]));
 await db.query("update clinics set cnpj='11.222.333/0001-81' where id=$1",[id(13)]);
 assert.equal((await db.query('select cnpj from clinics')).rows[0].cnpj,'11222333000181');
 await assert.rejects(db.query("insert into clinic_members(id,user_id,member_role) values($1,$2,'owner')",[id(70),id(1)]));
 await db.exec('reset role');
 // Incomplete signups pin their original type even if metadata changes later.
 for(const [n,role] of [[4,'patient'],[5,'doctor'],[6,'clinic_admin']])await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)',[id(n),JSON.stringify({role})]);
 await db.query("update auth.users set raw_user_meta_data='{"+'"role":"clinic_admin"'+"}' where id=$1",[id(4)]);
 await db.exec('set role authenticated');
 await assert.rejects(db.query("insert into clinics(id,user_id,cnpj) values($1,$2,'11222333000181')",[id(14),id(4)]));
 await db.query('insert into patients(id) values($1)',[id(4)]);
 await db.query("insert into doctors(id,user_id,verification_status) values($1,$2,'verified')",[id(15),id(5)]);
 await db.query("insert into clinics(id,user_id,cnpj,verification_status) values($1,$2,'11.222.333/0001-81','verified')",[id(16),id(6)]);
 assert.equal((await db.query('select verification_status from doctors where id=$1',[id(15)])).rows[0].verification_status,'pending');
 assert.equal((await db.query('select verification_status from clinics where id=$1',[id(16)])).rows[0].verification_status,'pending');
 await assert.rejects(db.query('insert into clinics(id,user_id) values($1,$2)',[id(17),id(6)]));
 await db.exec('reset role');await db.query("select set_config('test.role','service_role',false)");await db.exec('set role service_role');
 await db.query("update doctors set verification_status='verified' where id=$1",[id(15)]);
 await assert.rejects(db.query("update doctors set verification_status='invented'"));
 await db.exec('reset role');
 // A default Auth profile trigger must not block doctor/clinic email signup.
 await db.exec(`create function auth.default_profile() returns trigger language plpgsql security definer as $$begin insert into public.profiles(id,role) values(new.id,'patient');return new;end$$;
 create trigger aaa_default_profile after insert on auth.users for each row execute function auth.default_profile();`);
 await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)',[id(8),JSON.stringify({role:'doctor'})]);
 await db.exec('set role authenticated');await db.query('insert into doctors(id,user_id) values($1,$2)',[id(18),id(8)]);
 await db.query("update profiles set role='doctor' where id=$1",[id(8)]);
 }finally{await db.close();}
});
