UPDATE auth.users
SET email = 'snakesniperseven@gmail.com',
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE id = '13817084-0581-4f51-9d80-e996dba45631';

UPDATE auth.identities
SET identity_data = jsonb_set(identity_data, '{email}', '"snakesniperseven@gmail.com"'),
    updated_at = now()
WHERE user_id = '13817084-0581-4f51-9d80-e996dba45631' AND provider = 'email';

UPDATE public.profiles
SET email = 'snakesniperseven@gmail.com'
WHERE id = '13817084-0581-4f51-9d80-e996dba45631';