UPDATE auth.users SET email = 'tikitikifunk@proton.me', email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now() WHERE id = '307bf687-d656-4002-95e2-3608fd70e8a4';

UPDATE auth.identities
SET identity_data = jsonb_set(COALESCE(identity_data, '{}'::jsonb), '{email}', '"tikitikifunk@proton.me"'),
    updated_at = now()
WHERE user_id = '307bf687-d656-4002-95e2-3608fd70e8a4' AND provider = 'email';

UPDATE public.profiles SET email = 'tikitikifunk@proton.me' WHERE id = '307bf687-d656-4002-95e2-3608fd70e8a4';