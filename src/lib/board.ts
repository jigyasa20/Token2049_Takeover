import "server-only";
import { BIDDING_ENDS_AT, SPOTS, type Board, type FeedBid, type LiveData, type SpotId } from "@/data/spots";
import { getSupabaseAdmin } from "./supabase-server";

const emptyBoard = (): Board =>
  Object.fromEntries(
    SPOTS.map((s) => [s.id, { status: "open", highBid: 0, bidCount: 0, endsAt: BIDDING_ENDS_AT }]),
  ) as Board;

// Sample bids so the bid board can be reviewed locally before Supabase is connected.
// Kept on globalThis so the page, the server action and /api/board (which Next may
// load as separate module instances) all see the same list. Never used in production.
type PreviewStore = { feed: FeedBid[] };
const g = globalThis as typeof globalThis & { __previewBids?: PreviewStore };

function previewStore(): PreviewStore {
  if (!g.__previewBids) {
    const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
    g.__previewBids = {
      feed: [
        { id: "p1", spotId: "blazer", amount: 1200, at: hoursAgo(70), name: "Anonymous bidder #1", isPublic: false },
        { id: "p2", spotId: "bag", amount: 1000, at: hoursAgo(64), name: "Nimbus Labs", isPublic: true },
        { id: "p3", spotId: "blazer", amount: 1400, at: hoursAgo(52), name: "Nimbus Labs", isPublic: true },
        { id: "p4", spotId: "both", amount: 2000, at: hoursAgo(40), name: "Anonymous bidder #3", isPublic: false },
        { id: "p5", spotId: "bag", amount: 1200, at: hoursAgo(33), name: "Anonymous bidder #1", isPublic: false },
        { id: "p6", spotId: "blazer", amount: 1600, at: hoursAgo(20), name: "Orbit Wallet", isPublic: true },
        { id: "p7", spotId: "both", amount: 2400, at: hoursAgo(12), name: "Anonymous bidder #3", isPublic: false },
        { id: "p8", spotId: "blazer", amount: 1800, at: hoursAgo(5), name: "Nimbus Labs", isPublic: true },
        { id: "p9", spotId: "bag", amount: 1400, at: hoursAgo(2), name: "Orbit Wallet", isPublic: true },
      ],
    };
  }
  return g.__previewBids;
}

function previewData(): LiveData {
  const { feed } = previewStore();
  const board = emptyBoard();
  for (const b of feed) {
    board[b.spotId].highBid = Math.max(board[b.spotId].highBid, b.amount);
    board[b.spotId].bidCount++;
  }
  return { board, feed: [...feed], preview: true };
}

export const isPreviewMode = () => !getSupabaseAdmin() && process.env.NODE_ENV !== "production";

// Local-only stand-in for the place_bid() SQL function: same minimum-bid rule.
export function placePreviewBid(bid: { spotId: SpotId; amount: number; brand: string; showBrand: boolean }):
  | { ok: true }
  | { ok: false; minBid: number } {
  const { board } = previewData();
  const spot = SPOTS.find((s) => s.id === bid.spotId)!;
  const high = board[bid.spotId].highBid;
  const min = high > 0 ? high + spot.minIncrement : spot.startingPrice;
  if (bid.amount < min) return { ok: false, minBid: min };

  const store = previewStore();
  store.feed.push({
    id: `p${store.feed.length + 1}-${Date.now()}`,
    spotId: bid.spotId,
    amount: bid.amount,
    at: new Date().toISOString(),
    name: bid.showBrand ? bid.brand : "Anonymous bidder (you)",
    isPublic: bid.showBrand,
  });
  return { ok: true };
}

// Current bids per lot plus the public bid history. Falls back to sample data in
// development, and to "open, no bids" in production, when Supabase isn't configured.
export async function getLiveData(): Promise<LiveData> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return process.env.NODE_ENV === "production" ? { board: emptyBoard(), feed: [], preview: false } : previewData();
  }

  const board = emptyBoard();
  const [lots, bids] = await Promise.all([
    supabase.from("spot_board").select("id, status, high_bid, bid_count, ends_at"),
    supabase.from("bid_feed").select("id, spot_id, amount, created_at, display_name, is_public").order("created_at"),
  ]);

  if (lots.error) console.error("[board] spot_board fetch failed", lots.error);
  for (const r of lots.data ?? []) {
    if (r.id in board) {
      board[r.id as SpotId] = { status: r.status, highBid: r.high_bid, bidCount: r.bid_count, endsAt: r.ends_at };
    }
  }

  if (bids.error) console.error("[board] bid_feed fetch failed", bids.error);
  const feed: FeedBid[] = (bids.data ?? []).map((r) => ({
    id: r.id,
    spotId: r.spot_id,
    amount: r.amount,
    at: r.created_at,
    name: r.display_name,
    isPublic: r.is_public,
  }));

  return { board, feed, preview: false };
}
