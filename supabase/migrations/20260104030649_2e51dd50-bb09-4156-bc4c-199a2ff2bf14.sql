-- Add 'judge' and 'dev' roles to the existing app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'judge';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dev';