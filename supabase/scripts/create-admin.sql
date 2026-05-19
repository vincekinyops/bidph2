-- Create a local admin (run manually in Supabase Studio SQL — NOT part of seed.sql)
--
-- Security: Never put admin users in seed.sql. Predictable seeded credentials
-- (e.g. password123) are fine for mock bidders/sellers in local dev only; an
-- attacker who discovers a seeded admin email could take over the platform.
--
-- 1. Change v_email and v_pass below
-- 2. Run once in local Supabase SQL editor
-- 3. Do NOT run against production unless you understand the risk

DO $admin$
DECLARE
  v_id    UUID := gen_random_uuid();
  v_email TEXT := 'you@example.com';
  v_pass  TEXT := 'choose-a-strong-local-password';
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, recovery_sent_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_id, 'authenticated', 'authenticated', v_email,
    crypt(v_pass, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('email', v_email),
    now(), now(),
    '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_id, v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', v_email),
    'email', now(), now(), now()
  );

  UPDATE public.users
  SET role = 'admin', kyc_status = 'approved'
  WHERE id = v_id;
END;
$admin$;

-- Or, if you already registered via the app:
-- UPDATE public.users SET role = 'admin', kyc_status = 'approved' WHERE email = 'you@example.com';
