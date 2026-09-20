# Token2049_Takeover

Sponsor site for Jigyasa at TOKEN2049 Singapore. Brands bid on one of three lots:
the blazer, the bag, or both. Bidding closes 30 Sep 2026, 23:59 SGT.

Next.js (App Router) + Tailwind v4 + Supabase.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the client's Supabase URL + service role key
npm run dev
```

Without Supabase env vars, `npm run dev` shows **sample bids** on the bid board (labelled as such), and bids you place locally are added to them (in memory, reset on restart) so the whole flow can be tried. Production never uses sample data.

## Supabase setup (client's project)

Run `supabase/migrations/0001_spots_and_bids.sql` in the SQL editor. It creates:

- `spots`: the three lots with starting price, bid multiplier (each bid doubles the last) and deadline
- `bids`: every bid (brand, name, email, amount)
- `spot_board`: public-safe view of top bid + bid count per lot
- `bid_feed`: public bid history for the bid board (brand only if the bidder ticked "show my brand", otherwise "Anonymous bidder #n"; never names or emails)
- `place_bid(...)`: locks the lot, checks the deadline and the minimum (double the top bid), then inserts the bid

RLS is on with no public policies; the app talks to Supabase only from the server using the service role key.
The page polls `/api/board` every 12s for new bids.

There's no payment on the site. After a bid, the bidder sees Jigyasa's X, Instagram and
portfolio so they can DM her; the winner is sorted out over DM after bidding closes.

### Bid notifications (Telegram)

Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (see `.env.example`) and every new bid is
sent to Jigyasa on Telegram: spot, amount, brand, name, email, handle and message. It's
sent after the response, so bidders never wait on it, and a failed message never affects
the bid.

### Picking winners

When bidding closes, compare the top `both` bid with top `blazer` + top `bag`:
whichever is higher wins. Set `spots.status = 'sold'` on the winning lot(s).

## Editing lots

`src/data/spots.ts` holds names, copy, starting prices, the deadline, photos and the
logo-box positions (percent of each photo). Keep prices/deadline in sync with the SQL seed.
Photos live in `public/looks/`; the Blazer + Bag photo is a placeholder until the real one arrives.

## Headline, tagline, deadline and the link preview

The headline, tagline and bidding deadline live in `src/data/spots.ts` (`CAMPAIGN` and
`BIDDING_ENDS_AT`). The page, tab title, preview text and the share banner
(`src/app/opengraph-image.tsx`, drawn at build time) all read them from there, so an edit
there updates everything on the next deploy. If you change the deadline, also update
`ends_at` in the `spots` table so the database enforces the same time.

## Fonts

Instrument Serif (headings) and JetBrains Mono (numbers) via Google Fonts; Satoshi (body) is self-hosted from Fontshare under the ITF Free Font License (`src/app/fonts/Satoshi-LICENSE.txt`).

The share banner uses TTF/OTF copies in `src/og/` (Instrument Serif under the SIL Open Font License, `src/og/InstrumentSerif-OFL.txt`; Satoshi under the ITF licence above).
