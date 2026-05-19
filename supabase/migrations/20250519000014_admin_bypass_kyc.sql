-- Admin: approve KYC without a pending submission (demo / manual override).

CREATE OR REPLACE FUNCTION public.admin_bypass_kyc(p_user_id UUID)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_user.kyc_status = 'approved' THEN
    RETURN v_user;
  END IF;

  UPDATE public.users
  SET kyc_status = 'approved'
  WHERE id = p_user_id;

  UPDATE public.kyc_submissions
  SET
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE user_id = p_user_id AND status = 'pending';

  UPDATE public.users
  SET role = 'seller'
  WHERE id = p_user_id AND role = 'bidder';

  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
  RETURN v_user;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_bypass_kyc(UUID) TO authenticated;
