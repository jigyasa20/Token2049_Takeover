import { getLiveData } from "@/lib/board";

// Polled by the page every few seconds so bidders see new bids without refreshing.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getLiveData(), { headers: { "Cache-Control": "no-store" } });
}
