-- Optional schema repair. The app already sends this value explicitly.
-- Run in the Supabase SQL editor for the same project.
BEGIN;
ALTER TABLE public.appointments ALTER COLUMN patient_confirmation_status SET DEFAULT 'not_requested';
COMMIT;
