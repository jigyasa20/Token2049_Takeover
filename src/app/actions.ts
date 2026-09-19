"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SPOTS, formatUsd } from "@/data/spots";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export type BidState =
  | { ok: true; message: string; amount: number }
  | { ok: false; message: string; errors?: Record<string, string[] | undefined>; minBid?: number }
  | null;

const spotIds = SPOTS.map((s) => s.id) as [string, ...string[]];

const schema = z.object({
  spot_id: z.enum(spotIds, { message: "Pick a spot" }),
  amount: z.coerce.number({ message: "Enter your bid" }).int("Whole dollars only").positive("Enter your bid").max(1_000_000),
  brand: z.string().trim().min(1, "Which brand is bidding?").max(120),
  name: z.string().trim().min(2, "Tell me your name").max(120),
  email: z.email("That email doesn't look right").max(200),
  handle: z.string().trim().max(64).optional(),
  message: z.string().trim().max(2000).optional(),
  show_brand: z.boolean(),
});

const emptyToUndefined = (v: FormDataEntryValue | null) =>
  v === null || (typeof v === "string" && v.trim() === "") ? undefined : v;

export async function placeBid(_prev: BidState, formData: FormData): Promise<BidState> {
  // Honeypot: real people never fill this hidden field.
  if (formData.get("website")) return { ok: true, message: "Bid received.", amount: 0 };

  const parsed = schema.safeParse({
    spot_id: formData.get("spot_id"),
    amount: emptyToUndefined(formData.get("amount")),
    brand: formData.get("brand"),
    name: formData.get("name"),
    email: formData.get("email"),
    handle: emptyToUndefined(formData.get("handle")),
    message: emptyToUndefined(formData.get("message")),
    show_brand: formData.get("show_brand") === "on",
  });

  if (!parsed.success) {
    return { ok: false, message: "A couple of things need fixing below.", errors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn("[bid] Supabase env not set; bid not stored:", parsed.data);
    return { ok: false, message: "Bidding isn't connected yet (Supabase env missing)." };
  }

  const d = parsed.data;
  const { error } = await supabase.rpc("place_bid", {
    p_spot_id: d.spot_id,
    p_amount: d.amount,
    p_name: d.name,
    p_email: d.email,
    p_brand: d.brand,
    p_handle: d.handle ?? null,
    p_message: d.message ?? null,
    p_show_brand: d.show_brand,
  });

  if (error) {
    const tooLow = error.message.match(/BID_TOO_LOW:(\d+)/);
    if (tooLow) {
      const min = Number(tooLow[1]);
      revalidatePath("/");
      return {
        ok: false,
        minBid: min,
        message: `Someone got there first. The minimum bid is now ${formatUsd(min)}.`,
        errors: { amount: [`At least ${formatUsd(min)}`] },
      };
    }
    if (error.message.includes("BIDDING_CLOSED")) return { ok: false, message: "Bidding on this spot is closed, sorry!" };
    console.error("[bid] place_bid failed", error);
    return { ok: false, message: "Something broke on my end. Try again, or just DM me." };
  }

  revalidatePath("/");
  return {
    ok: true,
    amount: d.amount,
    message: `You're in the lead at ${formatUsd(d.amount)}! Someone could still outbid you before Sep 30, so check back. I'll reach out if you win.`,
  };
}
