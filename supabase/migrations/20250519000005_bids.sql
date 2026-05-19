CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bids_auction_created_idx ON public.bids(auction_id, amount DESC, created_at DESC);
CREATE INDEX bids_user_id_idx ON public.bids(user_id);

ALTER TABLE public.auctions
  ADD CONSTRAINT auctions_winning_bid_id_fkey
  FOREIGN KEY (winning_bid_id) REFERENCES public.bids(id);

ALTER TABLE public.payouts
  ADD CONSTRAINT payouts_auction_id_fkey
  FOREIGN KEY (auction_id) REFERENCES public.auctions(id);
