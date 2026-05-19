CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  type TEXT NOT NULL CHECK (type IN (
    'cash_in', 'cash_out', 'allocate_to_bidding', 'release_to_idle',
    'auction_payment_debit', 'auction_payout_credit', 'platform_fee'
  )),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference_id TEXT,
  idempotency_key TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  idle_after NUMERIC(14, 2),
  bidding_after NUMERIC(14, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX wallet_transactions_wallet_id_idx ON public.wallet_transactions(wallet_id);
CREATE INDEX wallet_transactions_created_at_idx ON public.wallet_transactions(created_at DESC);

CREATE TABLE public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'paymongo',
  external_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL UNIQUE,
  seller_id UUID NOT NULL REFERENCES public.users(id),
  gross_amount NUMERIC(14, 2) NOT NULL,
  platform_fee NUMERIC(14, 2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(14, 2) NOT NULL,
  provider_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
