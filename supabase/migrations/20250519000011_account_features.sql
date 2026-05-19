-- User reference numbers, watchlist, and public profile view

CREATE SEQUENCE IF NOT EXISTS public.user_reference_seq
  START WITH 10000001
  MAXVALUE 99999999
  NO CYCLE;

CREATE OR REPLACE FUNCTION public.generate_reference_number()
RETURNS CHAR(8)
LANGUAGE plpgsql
AS $$
DECLARE
  next_val BIGINT;
  ref CHAR(8);
BEGIN
  next_val := nextval('public.user_reference_seq');
  ref := lpad(next_val::TEXT, 8, '0');
  IF EXISTS (SELECT 1 FROM public.users WHERE reference_number = ref) THEN
    RAISE EXCEPTION 'Reference number collision for %', ref;
  END IF;
  RETURN ref;
END;
$$;

ALTER TABLE public.users
  ADD COLUMN reference_number CHAR(8);

UPDATE public.users
SET reference_number = public.generate_reference_number()
WHERE reference_number IS NULL;

ALTER TABLE public.users
  ALTER COLUMN reference_number SET NOT NULL;

ALTER TABLE public.users
  ADD CONSTRAINT users_reference_number_unique UNIQUE (reference_number);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, kyc_status, reference_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
    'bidder',
    'unverified',
    public.generate_reference_number()
  );
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE VIEW public.user_public_profiles AS
  SELECT id, reference_number FROM public.users;

GRANT SELECT ON public.user_public_profiles TO anon, authenticated;

CREATE TABLE public.watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, auction_id)
);

CREATE INDEX watchlist_items_user_id_idx ON public.watchlist_items (user_id);
CREATE INDEX watchlist_items_auction_id_idx ON public.watchlist_items (auction_id);

ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY watchlist_select_own ON public.watchlist_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY watchlist_insert_own ON public.watchlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY watchlist_delete_own ON public.watchlist_items
  FOR DELETE USING (auth.uid() = user_id);
