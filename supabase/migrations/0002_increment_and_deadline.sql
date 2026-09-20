-- Bidding closes 25 Sep 2026, 23:59 Singapore time (was 30 Sep).
-- Run this in projects where 0001 has already been applied (0001 only seeds new rows).
-- Keep in sync with src/data/spots.ts (BIDDING_ENDS_AT).

-- min_increment only exists in projects created before bids switched to doubling (0004).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'spots' and column_name = 'min_increment'
  ) then
    update public.spots set min_increment = 100, updated_at = now();
  end if;
end $$;

update public.spots
set ends_at    = '2026-09-25 23:59:59+08',
    updated_at = now();
