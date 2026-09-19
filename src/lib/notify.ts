import "server-only";
import { formatUsd, spotById, type SpotId } from "@/data/spots";

export type NewBid = {
  spotId: SpotId;
  amount: number;
  brand: string;
  name: string;
  email: string;
  handle?: string;
  message?: string;
  showBrand: boolean;
};

// Sends Jigyasa a Telegram message for every new bid. Does nothing unless
// TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set. Never throws: a failed
// notification must not affect a bid that's already been saved.
export async function notifyNewBid(bid: NewBid) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text = [
    `New bid: ${formatUsd(bid.amount)} on ${spotById(bid.spotId)?.name ?? bid.spotId}`,
    "",
    `Brand: ${bid.brand}${bid.showBrand ? "" : " (anonymous on the site)"}`,
    `Name: ${bid.name}`,
    `Email: ${bid.email}`,
    bid.handle ? `Telegram / X: ${bid.handle}` : null,
    bid.message ? `Message: ${bid.message}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Plain text (no parse_mode) so bidder-supplied text can't break formatting.
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error("[notify] telegram failed", res.status, await res.text());
  } catch (err) {
    console.error("[notify] telegram error", err);
  }
}
