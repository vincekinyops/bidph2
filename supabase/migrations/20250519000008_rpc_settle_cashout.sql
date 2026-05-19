CREATE OR REPLACE FUNCTION public.settle_auction(p_auction_id UUID)
RETURNS public.auctions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction public.auctions;
  v_winning_bid public.bids;
  v_wallet public.wallets;
  v_fee_pct NUMERIC;
  v_platform_fee NUMERIC;
  v_net NUMERIC;
BEGIN
  SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id FOR UPDATE;

  IF v_auction.status = 'active' AND v_auction.end_time <= now() THEN
    UPDATE public.auctions SET status = 'ended' WHERE id = p_auction_id;
    v_auction.status := 'ended';
  END IF;

  IF v_auction.status NOT IN ('ended') THEN
    RAISE EXCEPTION 'Auction must be ended before settlement';
  END IF;
  IF v_auction.settled_at IS NOT NULL THEN
    RETURN v_auction;
  END IF;

  SELECT * INTO v_winning_bid
  FROM public.bids
  WHERE auction_id = p_auction_id
  ORDER BY amount DESC, created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    UPDATE public.auctions SET settled_at = now() WHERE id = p_auction_id;
    SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id;
    RETURN v_auction;
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_winning_bid.user_id FOR UPDATE;
  IF v_wallet.bidding_balance < v_winning_bid.amount THEN
    RAISE EXCEPTION 'Winner has insufficient bidding balance';
  END IF;

  UPDATE public.wallets
  SET bidding_balance = bidding_balance - v_winning_bid.amount
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  INSERT INTO public.wallet_transactions (
    wallet_id, type, amount, status, reference_id, idle_after, bidding_after
  ) VALUES (
    v_wallet.id, 'auction_payment_debit', v_winning_bid.amount, 'completed',
    p_auction_id::TEXT, v_wallet.idle_balance, v_wallet.bidding_balance
  );

  SELECT (value->>'platform_fee_percent')::NUMERIC / 100 INTO v_fee_pct
  FROM public.platform_settings WHERE key = 'fees';
  v_platform_fee := ROUND(v_winning_bid.amount * COALESCE(v_fee_pct, 0.05), 2);
  v_net := v_winning_bid.amount - v_platform_fee;

  INSERT INTO public.payouts (
    auction_id, seller_id, gross_amount, platform_fee, net_amount, status
  ) VALUES (
    p_auction_id, v_auction.seller_id, v_winning_bid.amount,
    v_platform_fee, v_net, 'pending'
  )
  ON CONFLICT (auction_id) DO NOTHING;

  UPDATE public.auctions
  SET
    winner_id = v_winning_bid.user_id,
    winning_bid_id = v_winning_bid.id,
    settled_at = now(),
    updated_at = now()
  WHERE id = p_auction_id
  RETURNING * INTO v_auction;

  RETURN v_auction;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_auction(p_auction_id UUID)
RETURNS public.auctions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_auction public.auctions;
BEGIN
  SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id FOR UPDATE;
  IF v_auction.seller_id != v_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF v_auction.status IN ('ended', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot cancel auction in status %', v_auction.status;
  END IF;

  UPDATE public.auctions
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_auction_id
  RETURNING * INTO v_auction;

  RETURN v_auction;
END;
$$;
