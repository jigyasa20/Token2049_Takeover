// The three lots brands can bid on. Keep ids, prices and the deadline in sync with
// supabase/migrations/0001_spots_and_bids.sql. Prices are PLACEHOLDERS (USD).

export type SpotId = "blazer" | "bag" | "both";

export type Box = { x: number; y: number; w: number; h: number }; // % of the photo

export type Spot = {
  id: SpotId;
  name: string;
  kicker: string;
  blurb: string;
  startingPrice: number;
  minIncrement: number;
  photo: { src: string; width: number; height: number; placeholder?: boolean };
  boxes: Box[]; // highlighted placement(s) on the photo
};

// 30 Sep 2026, 23:59 Singapore time
export const BIDDING_ENDS_AT = "2026-09-30T23:59:59+08:00";

export const SPOTS: Spot[] = [
  {
    id: "blazer",
    name: "The Blazer",
    kicker: "1 brand",
    blurb: "Your logo, big and centred on my black blazer. If someone takes a photo of me, you're in it.",
    startingPrice: 1000,
    minIncrement: 50,
    photo: { src: "/looks/outfit.webp", width: 720, height: 1280 },
    boxes: [{ x: 30, y: 24, w: 40, h: 29 }],
  },
  {
    id: "bag",
    name: "The Bag",
    kicker: "1 brand",
    blurb: "A huge blank bag I'll be carrying around all day. Hard to miss, and easy to read from across the hall.",
    startingPrice: 800,
    minIncrement: 50,
    photo: { src: "/looks/bag.png", width: 736, height: 981 },
    boxes: [{ x: 10, y: 36, w: 58, h: 44 }],
  },
  {
    id: "both",
    name: "Blazer + Bag",
    kicker: "Whole outfit",
    blurb: "Blazer and bag, same brand. You'd be the only logo on me all day.",
    startingPrice: 1600,
    minIncrement: 50,
    // TODO: replace with the photo of her in the blazer holding the bag
    photo: { src: "/looks/outfit.webp", width: 720, height: 1280, placeholder: true },
    boxes: [
      { x: 30, y: 24, w: 40, h: 29 },
      { x: 18, y: 52, w: 34, h: 20 },
    ],
  },
];

export const CAMPAIGN = {
  name: "Jigyasa",
  handle: "@jigyasa_0203",
  twitter: "https://x.com/jigyasa_0203",
  instagram: "https://instagram.com/jigyasa_vaishnv_",
  youtube: "https://youtube.com/@StoriesbyRaahi",
  portfolio: "https://jigyasav.vercel.app/",
  portfolioLabel: "jigyasav.vercel.app",
  event: "TOKEN2049 Singapore",
  dates: "Oct 7 and 8, 2026", // TODO: confirm which day(s) she'll be wearing it
  venue: "Marina Bay Sands",
};

export type LotState = {
  status: "open" | "closed" | "sold";
  highBid: number; // 0 = no bids yet
  bidCount: number;
  endsAt: string;
};

export type Board = Record<SpotId, LotState>;

export type FeedBid = {
  id: string;
  spotId: SpotId;
  amount: number;
  at: string; // ISO timestamp
  name: string; // brand if the bidder opted in, otherwise "Anonymous bidder #n"
  isPublic: boolean;
};

export type LiveData = {
  board: Board;
  feed: FeedBid[]; // oldest first
  preview: boolean; // true = sample data because Supabase isn't connected (dev only)
};

export const minNextBid = (spot: Spot, lot: LotState) =>
  lot.highBid > 0 ? lot.highBid + spot.minIncrement : spot.startingPrice;

export const isOpen = (lot: LotState, now = Date.now()) => lot.status === "open" && now < Date.parse(lot.endsAt);

export const formatUsd = (n: number) => `$${n.toLocaleString("en-US")}`;
export const spotById = (id: string) => SPOTS.find((s) => s.id === id);
