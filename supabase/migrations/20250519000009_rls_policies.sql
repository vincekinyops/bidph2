ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY users_select_own ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_select_admin ON public.users FOR SELECT USING (public.is_admin());
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (auth.uid() = id);

-- wallets: read own, no direct update
CREATE POLICY wallets_select_own ON public.wallets FOR SELECT USING (auth.uid() = user_id);

-- wallet_transactions
CREATE POLICY wallet_txn_select_own ON public.wallet_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = wallet_id AND w.user_id = auth.uid()
    )
  );

-- payment_events: admin only
CREATE POLICY payment_events_admin ON public.payment_events FOR SELECT USING (public.is_admin());

-- kyc_submissions
CREATE POLICY kyc_insert_own ON public.kyc_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY kyc_select_own ON public.kyc_submissions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY kyc_update_admin ON public.kyc_submissions FOR UPDATE
  USING (public.is_admin());

-- auctions
CREATE POLICY auctions_public_read ON public.auctions FOR SELECT
  USING (status IN ('active', 'ended') OR seller_id = auth.uid() OR public.is_admin());
CREATE POLICY auctions_insert_seller ON public.auctions FOR INSERT
  WITH CHECK (auth.uid() = seller_id);
CREATE POLICY auctions_update_own ON public.auctions FOR UPDATE
  USING (seller_id = auth.uid() OR public.is_admin());

-- auction_images
CREATE POLICY auction_images_read ON public.auction_images FOR SELECT USING (true);
CREATE POLICY auction_images_manage ON public.auction_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.auctions a
      WHERE a.id = auction_id AND (a.seller_id = auth.uid() OR public.is_admin())
    )
  );

-- bids: public read for active/ended auctions
CREATE POLICY bids_select ON public.bids FOR SELECT USING (true);

-- payouts
CREATE POLICY payouts_seller ON public.payouts FOR SELECT
  USING (seller_id = auth.uid() OR public.is_admin());

-- platform_settings: public read
CREATE POLICY platform_settings_read ON public.platform_settings FOR SELECT USING (true);

-- Storage policies
CREATE POLICY kyc_upload_own ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY kyc_read_own ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-documents'
    AND (auth.uid()::TEXT = (storage.foldername(name))[1] OR public.is_admin())
  );

CREATE POLICY auction_images_public_read ON storage.objects FOR SELECT
  USING (bucket_id = 'auction-images');

CREATE POLICY auction_images_upload ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'auction-images' AND auth.role() = 'authenticated');

-- Grants for RPCs
GRANT EXECUTE ON FUNCTION public.allocate_to_bidding(NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_to_idle(NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_bid_v2(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_auction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_cash_out(NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_auction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_committed_exposure(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dev_simulate_cash_in(NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_kyc_submission(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_auction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_expired_auctions() TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.process_cash_in_webhook(TEXT, TEXT, JSONB, UUID, NUMERIC, TEXT) TO service_role;
