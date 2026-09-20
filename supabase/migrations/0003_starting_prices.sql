-- Starting prices: blazer $1,200, bag $1,000, both $2,000.
-- Run this in projects where 0001 has already been applied (0001 only seeds new rows).
-- Keep in sync with src/data/spots.ts (startingPrice).

update public.spots set starting_price = 1200, updated_at = now() where id = 'blazer';
update public.spots set starting_price = 1000, updated_at = now() where id = 'bag';
update public.spots set starting_price = 2000, updated_at = now() where id = 'both';
