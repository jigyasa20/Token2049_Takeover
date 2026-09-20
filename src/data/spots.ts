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
};

// The cut-out photos in the hero, left to right. Each dashed box marks a spot and
// opens the bid form for it. `caption` is the lot whose price shows under the photo.
// `scale` shrinks an item relative to her height (1 = full height); it sits on the
// same baseline as her feet.
export type HeroPhoto = {
  src: string;
  width: number;
  height: number;
  alt: string;
  boxes: (Box & { spot: SpotId })[];
  caption?: SpotId;
  scale?: number;
};

export const HERO_PHOTOS: HeroPhoto[] = [
  {
    src: "/looks/blazer.webp",
    width: 375,
    height: 1131,
    alt: "Jigyasa in the black blazer",
    boxes: [{ spot: "blazer", x: 38, y: 21, w: 42, h: 24 }],
    caption: "blazer",
  },
  {
    src: "/looks/bag.webp",
    width: 1178,
    height: 1199,
    alt: "The big blank white bag",
    boxes: [{ spot: "bag", x: 14, y: 34, w: 60, h: 44 }],
    caption: "bag",
    scale: 0.55,
  },
  {
    src: "/looks/blazer-bag-plain.webp",
    width: 941,
    height: 1670,
    alt: "Jigyasa in the black blazer carrying the big white bag",
    boxes: [
      { spot: "blazer", x: 62, y: 20, w: 28, h: 20 },
      { spot: "bag", x: 10, y: 42, w: 38, h: 26 },
    ],
    caption: "both",
  },
];

// 25 Sep 2026, 23:59 Singapore time
export const BIDDING_ENDS_AT = "2026-09-25T23:59:59+08:00";

export const SPOTS: Spot[] = [
  {
    id: "blazer",
    name: "The Blazer",
    kicker: "1 brand",
    blurb: "Your brand, big and centred on my black blazer. If someone takes a photo of me, you're in it.",
    startingPrice: 1000,
    minIncrement: 100,
  },
  {
    id: "bag",
    name: "The Bag",
    kicker: "1 brand",
    blurb: "A huge blank bag I'll be carrying around all day. Hard to miss, and easy to read from across the hall.",
    startingPrice: 800,
    minIncrement: 100,
  },
  {
    id: "both",
    name: "Blazer + Bag",
    kicker: "Whole outfit",
    blurb: "Blazer and bag, same brand. You'd be the only logo on me all day.",
    startingPrice: 1600,
    minIncrement: 100,
  },
];

export const CAMPAIGN = {
  // Headline and tagline are shared by the page, the tab title, the link-preview text
  // and the generated share banner (src/app/opengraph-image.tsx). Edit them here only.
  headline: "Put your brand on my blazer, my bag, or both.",
  headlineAccent: "both.", // word(s) shown in italics
  // "\n" = where the line breaks in the black strip; elsewhere it's read as a space.
  tagline: ["Everyone is buying visibility.", "I'm creating something\npeople notice."],
  name: "Jigyasa",
  handle: "@jigyasa_0203",
  twitter: "https://x.com/jigyasa_0203",
  instagramHandle: "@jigyasa_vaishnv_",
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

// e.g. "Sep 30", in Singapore time, from BIDDING_ENDS_AT.
export const deadlineLabel = () =>
  new Date(BIDDING_ENDS_AT).toLocaleDateString("en-US", { timeZone: "Asia/Singapore", month: "short", day: "numeric" });

export const taglineText = () => CAMPAIGN.tagline.join(" ").replace(/\n/g, " ");

export const formatUsd = (n: number) => `$${n.toLocaleString("en-US")}`;
export const spotById = (id: string) => SPOTS.find((s) => s.id === id);
