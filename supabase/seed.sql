-- =============================================================================
-- BidPH demo seed — auction items only (no users, bids, or wallets).
--
-- Local:  pnpm db:seed-items
-- Remote: pnpm db:seed-items:remote   (linked Supabase project)
--
-- Needs at least one registered user. If none are seller/admin, the oldest
-- user is promoted to seller + approved KYC so demo listings can be created.
-- =============================================================================

CREATE TEMP TABLE IF NOT EXISTS _bidph_seed_status (
  outcome TEXT NOT NULL,
  seller_id UUID,
  auctions_inserted INT NOT NULL DEFAULT 0
);

TRUNCATE _bidph_seed_status;

DO $seed$
DECLARE
  v_seller_id UUID;
  v_outcome TEXT;

  c_auction_iphone   UUID := 'a1000001-0000-4000-8000-000000000001';
  c_auction_dunk     UUID := 'a1000002-0000-4000-8000-000000000002';
  c_auction_sony     UUID := 'a1000003-0000-4000-8000-000000000003';
  c_auction_jeepney  UUID := 'a1000004-0000-4000-8000-000000000004';
  c_auction_macbook  UUID := 'a1000005-0000-4000-8000-000000000005';
BEGIN
  SELECT id INTO v_seller_id
  FROM public.users
  WHERE role IN ('seller', 'admin')
  ORDER BY created_at
  LIMIT 1;

  IF v_seller_id IS NULL THEN
    SELECT id INTO v_seller_id
    FROM public.users
    ORDER BY created_at
    LIMIT 1;

    IF v_seller_id IS NULL THEN
      INSERT INTO _bidph_seed_status (outcome, seller_id, auctions_inserted)
      VALUES ('skipped — no users; register at /register first', NULL, 0);
      RETURN;
    END IF;

    UPDATE public.users
    SET role = 'seller', kyc_status = 'approved'
    WHERE id = v_seller_id;

    v_outcome := 'promoted first user to seller and inserted demo auctions';
  ELSE
    v_outcome := 'inserted demo auctions';
  END IF;

  IF EXISTS (SELECT 1 FROM public.auctions WHERE id = c_auction_iphone) THEN
    INSERT INTO _bidph_seed_status (outcome, seller_id, auctions_inserted)
    VALUES ('skipped — demo auctions already exist', v_seller_id, 0);
    RETURN;
  END IF;

  INSERT INTO public.auctions (
    id, seller_id, title, description, starting_price, current_price, min_increment,
    status, start_time, end_time
  ) VALUES
    (
      c_auction_iphone,
      v_seller_id,
      'Apple iPhone 15 Pro 256GB — Space Black',
      'Brand new, sealed box. Official Apple warranty. Metro Manila meetup or LBC shipping.',
      45000, 45000, 500,
      'active',
      now() - interval '2 days',
      now() + interval '3 days'
    ),
    (
      c_auction_dunk,
      v_seller_id,
      'Nike Dunk Low "Panda" — US 9',
      'Worn twice, excellent condition. Comes with original box.',
      5500, 5500, 200,
      'active',
      now() - interval '1 day',
      now() + interval '6 hours'
    ),
    (
      c_auction_sony,
      v_seller_id,
      'Sony WH-1000XM5 — Midnight Blue',
      'Like new, includes case and all accessories. Purchased Dec 2025.',
      12000, 12000, 250,
      'active',
      now() - interval '3 hours',
      now() + interval '5 days'
    ),
    (
      c_auction_jeepney,
      v_seller_id,
      'Vintage Die-cast Jeepney (Limited Edition)',
      'Collector item, 1:24 scale. Still in draft — seller finishing photos.',
      2500, 2500, 100,
      'draft',
      NULL,
      now() + interval '14 days'
    ),
    (
      c_auction_macbook,
      v_seller_id,
      'MacBook Air M2 13" 8GB/256GB — Space Gray',
      'Ended auction for testing history. Minor scratches on lid.',
      38000, 41500, 500,
      'ended',
      now() - interval '10 days',
      now() - interval '1 day'
    );

  INSERT INTO public.auction_images (auction_id, storage_path, sort_order) VALUES
    (c_auction_iphone, 'auction-images/seed/iphone-1.jpg', 0),
    (c_auction_iphone, 'auction-images/seed/iphone-2.jpg', 1),
    (c_auction_dunk, 'auction-images/seed/dunk-1.jpg', 0),
    (c_auction_sony, 'auction-images/seed/sony-1.jpg', 0),
    (c_auction_jeepney, 'auction-images/seed/jeepney-1.jpg', 0),
    (c_auction_macbook, 'auction-images/seed/macbook-1.jpg', 0);

  INSERT INTO _bidph_seed_status (outcome, seller_id, auctions_inserted)
  VALUES (v_outcome, v_seller_id, 5);
END;
$seed$;

SELECT outcome, seller_id, auctions_inserted FROM _bidph_seed_status;

SELECT id, title, status
FROM public.auctions
WHERE id IN (
  'a1000001-0000-4000-8000-000000000001',
  'a1000002-0000-4000-8000-000000000002',
  'a1000003-0000-4000-8000-000000000003',
  'a1000004-0000-4000-8000-000000000004',
  'a1000005-0000-4000-8000-000000000005'
)
ORDER BY title;
