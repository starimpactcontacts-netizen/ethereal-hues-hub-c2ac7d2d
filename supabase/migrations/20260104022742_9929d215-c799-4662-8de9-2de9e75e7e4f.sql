-- Add bio column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN bio text DEFAULT NULL;

-- Add a check constraint for max length
ALTER TABLE public.profiles 
ADD CONSTRAINT bio_max_length CHECK (char_length(bio) <= 200);