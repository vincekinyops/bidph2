-- Require approved KYC before placing bids (enforced server-side)

CREATE OR REPLACE FUNCTION public.place_bid_v2(
  p_auction_id UUID,
  p_amount NUMERIC
)
RETURNS public.bids
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user public.users;
  v_auction public.auctions;
  v_wallet public.wallets;
  v_bid public.bids;
  v_committed NUMERIC;
  v_old_high NUMERIC;
  v_delta NUMERIC;
  v_min_bid NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Bid amount must be positive';
  END IF;

  SELECT * INTO v_user FROM public.users WHERE id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  IF v_user.kyc_status != 'approved' THEN
    RAISE EXCEPTION 'KYC verification required before bidding';
  END IF;

  SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;
  IF v_auction.status != 'active' THEN
    RAISE EXCEPTION 'Auction is not active';
  END IF;
  IF now() >= v_auction.end_time THEN
    RAISE EXCEPTION 'Auction has ended';
  END IF;
  IF v_auction.seller_id = v_user_id THEN
    RAISE EXCEPTION 'Seller cannot bid on own auction';
  END IF;

  v_min_bid := v_auction.current_price + v_auction.min_increment;
  IF p_amount < v_min_bid THEN
    RAISE EXCEPTION 'Bid must be at least %', v_min_bid;
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;

  v_committed := public.get_user_committed_exposure(v_user_id);
  v_old_high := public.get_user_high_bid_on_auction(v_user_id, p_auction_id);
  v_delta := p_amount - v_old_high;

  IF v_wallet.bidding_balance < v_committed + v_delta THEN
    RAISE EXCEPTION 'Insufficient bidding funds. Committed: %, delta: %, balance: %',
      v_committed, v_delta, v_wallet.bidding_balance;
  END IF;

  INSERT INTO public.bids (auction_id, user_id, amount)
  VALUES (p_auction_id, v_user_id, p_amount)
  RETURNING * INTO v_bid;

  UPDATE public.auctions
  SET current_price = p_amount, updated_at = now()
  WHERE id = p_auction_id;

  RETURN v_bid;
END;
$$;
