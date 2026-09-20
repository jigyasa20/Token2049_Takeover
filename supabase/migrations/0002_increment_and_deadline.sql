-- Minimum raise is now $100 and bidding closes 25 Sep 2026, 23:59 Singapore time.
-- Run this in projects where 0001 has already been applied (0001 only seeds new rows).
-- Keep in sync with src/data/spots.ts (minIncrement, BIDDING_ENDS_AT).

update public.spots
set min_increment = 100,
    ends_at       = '2026-09-25 23:59:59+08',
    updated_at    = now();
