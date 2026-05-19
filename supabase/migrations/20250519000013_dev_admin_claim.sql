-- Dev-only: promote the signed-in user to admin when their email matches (local / non-production).
-- Called from the web app when VITE_DEV_ADMIN_EMAIL matches; not a substitute for production admin setup.

CREATE OR REPLACE FUNCTION public.claim_dev_admin(p_expected_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_email TEXT;
BEGIN
  IF current_setting('app.settings.environment', true) = 'production' THEN
    RAISE EXCEPTION 'Not available in production';
  END IF;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NULLIF(trim(p_expected_email), '') IS NULL THEN
    RAISE EXCEPTION 'Email required';
  END IF;

  SELECT email INTO v_email FROM public.users WHERE id = v_user_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  IF lower(trim(v_email)) IS DISTINCT FROM lower(trim(p_expected_email)) THEN
    RAISE EXCEPTION 'Email mismatch';
  END IF;

  UPDATE public.users
  SET role = 'admin', kyc_status = 'approved'
  WHERE id = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_dev_admin(TEXT) TO authenticated;
