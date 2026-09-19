import "server-only";
import { BIDDING_ENDS_AT, SPOTS, type Board, type FeedBid, type LiveData, type SpotId } from "@/data/spots";
import { getSupabaseAdmin } from "./supabase-server";

const emptyBoard = (): Board =>
  Object.fromEntries(
    SPOTS.map((s) => [s.id, { status: "open", highBid: 0, bidCount: 0, endsAt: BIDDING_ENDS_AT }]),
  ) as Board;

// Sample bids so the bid board can be reviewed locally before Supabase is connected.
// Never used in production.
function previewData(): LiveData {
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  const feed: FeedBid[] = [
    { id: "p1", spotId: "blazer", amount: 1000, at: hoursAgo(70), name: "Anonymous bidder #1", isPublic: false },
    { id: "p2", spotId: "bag", amount: 800, at: hoursAgo(64), name: "Nimbus Labs", isPublic: true },
    { id: "p3", spotId: "blazer", amount: 1150, at: hoursAgo(52), name: "Nimbus Labs", isPublic: true },
    { id: "p4", spotId: "both", amount: 1600, at: hoursAgo(40), name: "Anonymous bidder #3", isPublic: false },
    { id: "p5", spotId: "bag", amount: 900, at: hoursAgo(33), name: "Anonymous bidder #1", isPublic: false },
    { id: "p6", spotId: "blazer", amount: 1300, at: hoursAgo(20), name: "Orbit Wallet", isPublic: true },
    { id: "p7", spotId: "both", amount: 2000, at: hoursAgo(12), name: "Anonymous bidder #3", isPublic: false },
    { id: "p8", spotId: "blazer", amount: 1450, at: hoursAgo(5), name: "Nimbus Labs", isPublic: true },
    { id: "p9", spotId: "bag", amount: 1000, at: hoursAgo(2), name: "Orbit Wallet", isPublic: true },
  ];
  const board = emptyBoard();
  for (const b of feed) {
    board[b.spotId].highBid = Math.max(board[b.spotId].highBid, b.amount);
    board[b.spotId].bidCount++;
  }
  return { board, feed, preview: true };
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
