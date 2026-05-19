-- Wallet helpers and allocation RPCs

CREATE OR REPLACE FUNCTION public.get_wallet_for_user(p_user_id UUID)
RETURNS public.wallets
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.wallets WHERE user_id = p_user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_committed_exposure(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(highest.amount), 0)
  FROM public.auctions a
  CROSS JOIN LATERAL (
    SELECT b.amount, b.user_id
    FROM public.bids b
    WHERE b.auction_id = a.id
    ORDER BY b.amount DESC, b.created_at DESC
    LIMIT 1
  ) highest
  WHERE a.status = 'active' AND highest.user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_high_bid_on_auction(
  p_user_id UUID,
  p_auction_id UUID
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(highest.amount, 0)
  FROM (
    SELECT b.amount, b.user_id
    FROM public.bids b
    WHERE b.auction_id = p_auction_id
    ORDER BY b.amount DESC, b.created_at DESC
    LIMIT 1
  ) highest
  WHERE highest.user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.allocate_to_bidding(p_amount NUMERIC)
RETURNS public.wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_wallet public.wallets;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  IF v_wallet.idle_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient idle balance';
  END IF;

  UPDATE public.wallets
  SET
    idle_balance = idle_balance - p_amount,
    bidding_balance = bidding_balance + p_amount
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  INSERT INTO public.wallet_transactions (
    wallet_id, type, amount, status, idle_after, bidding_after
  ) VALUES (
    v_wallet.id, 'allocate_to_bidding', p_amount, 'completed',
    v_wallet.idle_balance, v_wallet.bidding_balance
  );

  RETURN v_wallet;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_to_idle(p_amount NUMERIC)
RETURNS public.wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_wallet public.wallets;
  v_committed NUMERIC;
  v_available NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
  v_committed := public.get_user_committed_exposure(v_user_id);
  v_available := v_wallet.bidding_balance - v_committed;
  IF p_amount > v_available THEN
    RAISE EXCEPTION 'Cannot release funds committed to active high bids (available: %)', v_available;
  END IF;

  UPDATE public.wallets
  SET
    bidding_balance = bidding_balance - p_amount,
    idle_balance = idle_balance + p_amount
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  INSERT INTO public.wallet_transactions (
    wallet_id, type, amount, status, idle_after, bidding_after
  ) VALUES (
    v_wallet.id, 'release_to_idle', p_amount, 'completed',
    v_wallet.idle_balance, v_wallet.bidding_balance
  );

  RETURN v_wallet;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_cash_in_webhook(
  p_external_id TEXT,
  p_event_type TEXT,
  p_payload JSONB,
  p_user_id UUID,
  p_amount NUMERIC,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS public.wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets;
  v_txn public.wallet_transactions;
  v_event_id UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  INSERT INTO public.payment_events (provider, external_id, event_type, payload)
  VALUES ('paymongo', p_external_id, p_event_type, p_payload)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    SELECT wallet_transaction_id INTO v_txn
    FROM public.payment_events pe
    JOIN public.wallet_transactions wt ON wt.id = pe.wallet_transaction_id
    WHERE pe.external_id = p_external_id;
    RETURN v_txn;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = p_user_id AND kyc_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'KYC must be approved for cash-in';
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  UPDATE public.wallets
  SET idle_balance = idle_balance + p_amount
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  INSERT INTO public.wallet_transactions (
    wallet_id, type, amount, status, reference_id, idempotency_key,
    metadata, idle_after, bidding_after
  ) VALUES (
    v_wallet.id, 'cash_in', p_amount, 'completed', p_external_id, p_idempotency_key,
    p_payload, v_wallet.idle_balance, v_wallet.bidding_balance
  )
  RETURNING * INTO v_txn;

  UPDATE public.payment_events
  SET processed_at = now(), wallet_transaction_id = v_txn.id
  WHERE external_id = p_external_id;

  RETURN v_txn;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_cash_out(p_amount NUMERIC)
RETURNS public.wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user public.users;
  v_wallet public.wallets;
  v_txn public.wallet_transactions;
  v_min NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_user FROM public.users WHERE id = v_user_id;
  IF v_user.kyc_status != 'approved' THEN
    RAISE EXCEPTION 'KYC must be approved for cash-out';
  END IF;
  IF v_user.gcash_mobile IS NULL OR v_user.gcash_mobile = '' THEN
    RAISE EXCEPTION 'GCash mobile number required';
  END IF;

  SELECT (value->>'min_cash_out')::NUMERIC INTO v_min
  FROM public.platform_settings WHERE key = 'limits';
  IF p_amount < COALESCE(v_min, 100) THEN
    RAISE EXCEPTION 'Amount below minimum cash-out';
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
  IF v_wallet.idle_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient idle balance';
  END IF;

  UPDATE public.wallets
  SET idle_balance = idle_balance - p_amount
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  INSERT INTO public.wallet_transactions (
    wallet_id, type, amount, status, metadata, idle_after, bidding_after
  ) VALUES (
    v_wallet.id, 'cash_out', p_amount, 'pending',
    jsonb_build_object('gcash_mobile', v_user.gcash_mobile),
    v_wallet.idle_balance, v_wallet.bidding_balance
  )
  RETURNING * INTO v_txn;

  RETURN v_txn;
END;
$$;

-- Dev helper: simulate cash-in without PayMongo (local only — restrict in production)
CREATE OR REPLACE FUNCTION public.dev_simulate_cash_in(p_amount NUMERIC)
RETURNS public.wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF current_setting('app.settings.environment', true) = 'production' THEN
    RAISE EXCEPTION 'Not available in production';
  END IF;
  RETURN public.process_cash_in_webhook(
    'dev-' || gen_random_uuid()::TEXT,
    'dev.cash_in',
    jsonb_build_object('source', 'dev_simulate_cash_in'),
    v_user_id,
    p_amount,
    'dev-' || gen_random_uuid()::TEXT
  );
END;
$$;
