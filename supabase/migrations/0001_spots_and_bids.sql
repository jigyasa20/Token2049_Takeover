-- Three lots (blazer, bag, both) with open bidding until the deadline.
-- Run in the client's Supabase SQL editor, or `supabase db push` once the CLI is linked.

create table if not exists public.spots (
  id             text primary key,               -- matches src/data/spots.ts: 'blazer' | 'bag' | 'both'
  name           text not null,
  starting_price integer not null check (starting_price > 0),  -- USD
  min_increment  integer not null default 100 check (min_increment > 0),
  ends_at        timestamptz not null,
  status         text not null default 'open' check (status in ('open', 'closed', 'sold')),
  winner_bid_id  uuid,
  updated_at     timestamptz not null default now()
);

create table if not exists public.bids (
  id          uuid primary key default gen_random_uuid(),
  spot_id     text not null references public.spots(id),
  amount      integer not null check (amount > 0),  -- USD
  name        text not null,
  email       text not null,
  brand       text not null,
  handle      text,
  message     text,
  show_brand  boolean not null default false,  -- bidder opted in to showing their brand publicly
  created_at  timestamptz not null default now()
);

create index if not exists bids_spot_amount_idx on public.bids (spot_id, amount desc);

-- RLS on with no policies: only the service role (used server-side by the app) can read/write.
alter table public.spots enable row level security;
alter table public.bids enable row level security;

-- Public-safe summary per lot: no bidder names or emails.
create or replace view public.spot_board with (security_invoker = true) as
select
  s.id,
  s.status,
  s.starting_price,
  s.min_increment,
  s.ends_at,
  coalesce(max(b.amount), 0)::int as high_bid,
  count(b.id)::int                as bid_count
from public.spots s
left join public.bids b on b.spot_id = s.id
group by s.id;

-- Public bid history for the bid board. Never exposes names or emails; brands only
-- when the bidder opted in, otherwise a stable "Anonymous bidder #n" (numbered by
-- each bidder's first bid across all lots).
create or replace view public.bid_feed with (security_invoker = true) as
with bidders as (
  select email, row_number() over (order by min(created_at)) as n
  from public.bids
  group by email
)
select
  b.id,
  b.spot_id,
  b.amount,
  b.created_at,
  case when b.show_brand then b.brand else 'Anonymous bidder #' || bd.n end as display_name,
  b.show_brand as is_public
from public.bids b
join bidders bd on bd.email = b.email;

-- Places a bid atomically. Locks the lot row so two simultaneous bids can't both
-- win at the same amount. Errors are raised with a stable code prefix the app maps
-- to friendly messages:
--   SPOT_NOT_FOUND | BIDDING_CLOSED | BID_TOO_LOW:<minimum>
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
  v_min := case when v_high is null then v_spot.starting_price else v_high + v_spot.min_increment end;

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

-- Only the server (service role) may place bids.
revoke all on function public.place_bid(text, integer, text, text, text, text, text, boolean) from public, anon, authenticated;

-- Prices are placeholders: keep in sync with src/data/spots.ts.
-- Deadline: 25 Sep 2026, 23:59 Singapore time.
insert into public.spots (id, name, starting_price, min_increment, ends_at) values
  ('blazer', 'The Blazer',     1000, 100, '2026-09-25 23:59:59+08'),
  ('bag',    'The Bag',         800, 100, '2026-09-25 23:59:59+08'),
  ('both',   'Blazer + Bag',   1600, 100, '2026-09-25 23:59:59+08')
on conflict (id) do nothing;
