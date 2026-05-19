CREATE TABLE public.auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.users(id),
  title TEXT NOT NULL,
  description TEXT,
  starting_price NUMERIC(14, 2) NOT NULL CHECK (starting_price > 0),
  current_price NUMERIC(14, 2) NOT NULL,
  min_increment NUMERIC(14, 2) NOT NULL DEFAULT 1 CHECK (min_increment > 0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'ended', 'cancelled')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ NOT NULL,
  winner_id UUID REFERENCES public.users(id),
  winning_bid_id UUID,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (start_time IS NULL OR end_time > start_time)
);

CREATE TRIGGER auctions_updated_at
  BEFORE UPDATE ON public.auctions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.auction_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX auctions_status_end_time_idx ON public.auctions(status, end_time);
CREATE INDEX auctions_seller_id_idx ON public.auctions(seller_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'auction-images',
  'auction-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
