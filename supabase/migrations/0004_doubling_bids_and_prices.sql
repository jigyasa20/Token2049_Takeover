-- Bids now double instead of going up in fixed steps, and starting prices are lower:
-- blazer $600, bag $400, both $1,000. The first bid on a spot may match the starting price.
-- Run this in projects where 0001 has already been applied.
-- Keep in sync with src/data/spots.ts (startingPrice, BID_MULTIPLIER).

alter table public.spots add column if not exists bid_multiplier numeric not null default 2;
alter table public.spots drop constraint if exists spots_bid_multiplier_check;
alter table public.spots add constraint spots_bid_multiplier_check check (bid_multiplier >= 1);

update public.spots set bid_multiplier = 2, updated_at = now();
update public.spots set starting_price = 600, updated_at = now() where id = 'blazer';
update public.spots set starting_price = 400, updated_at = now() where id = 'bag';
update public.spots set starting_price = 1000, updated_at = now() where id = 'both';

-- min_increment is no longer used by place_bid(); kept so older rows/queries don't break.

create or replace view public.spot_board with (security_invoker = true) as
select
  s.id,
  s.status,
  s.starting_price,
  s.bid_multiplier,
  s.ends_at,
  coalesce(max(b.amount), 0)::int as high_bid,
  count(b.id)::int                as bid_count
from public.spots s
left join public.bids b on b.spot_id = s.id
group by s.id;

create or replace function public.place_bid(
  p_spot_id text,
  p_amount  integer,
  p_name    text,
  p_email   text,
  p_brand   text,
  p_handle  text default null,
  p_message text default null,
  p_show_brand boolean default false
) returns public.bids
language plpgsql
set search_path = public
as $$
declare
  v_spot public.spots;
  v_high integer;
  v_min  integer;
  v_bid  public.bids;
begin
  select * into v_spot from public.spots where id = p_spot_id for update;
  if not found then
    raise exception 'SPOT_NOT_FOUND';
  end if;

  if v_spot.status <> 'open' or now() >= v_spot.ends_at then
    raise exception 'BIDDING_CLOSED';
  end if;

  select max(amount) into v_high from public.bids where spot_id = p_spot_id;
  v_min := case when v_high is null then v_spot.starting_price else ceil(v_high * v_spot.bid_multiplier)::integer end;

  if p_amount < v_min then
    raise exception 'BID_TOO_LOW:%', v_min;
  end if;

  insert into public.bids (spot_id, amount, name, email, brand, handle, message, show_brand)
  values (p_spot_id, p_amount, p_name, lower(p_email), p_brand, p_handle, p_message, coalesce(p_show_brand, false))
  returning * into v_bid;

  update public.spots set updated_at = now() where id = p_spot_id;
  return v_bid;
end;
$$;

revoke all on function public.place_bid(text, integer, text, text, text, text, text, boolean) from public, anon, authenticated;
