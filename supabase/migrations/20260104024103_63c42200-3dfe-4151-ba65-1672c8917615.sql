-- Add contact fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN email text,
ADD COLUMN discord text,
ADD COLUMN portfolio_url text;