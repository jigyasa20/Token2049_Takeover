"use client";

import { SPOTS, formatUsd, isOpen, minNextBid } from "@/data/spots";
import { AnimatedUsd } from "./AnimatedNumber";
import { useBid } from "./BidProvider";

export function SpotList() {
  const { board, openBid } = useBid();

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      {SPOTS.map((spot, i) => {
        const lot = board[spot.id];
        const open = isOpen(lot);
        return (
          <div
            key={spot.id}
            className={`flex flex-col gap-4 border-b border-line p-5 last:border-b-0 sm:flex-row sm:items-center sm:gap-6 sm:p-6 ${
              spot.id === "both" ? "bg-canvas" : ""
            }`}
          >
            <span className="font-mono text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-display text-3xl leading-none">{spot.name}</span>
                <span className="rounded-md bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-accent-deep">
                  {spot.kicker}
                </span>
              </p>
              <p className="mt-2 max-w-xl text-sm text-muted">{spot.blurb}</p>
            </div>
            <div className="flex items-center justify-between gap-6 sm:justify-end">
              <div className="text-left sm:text-right">
                <AnimatedUsd value={lot.highBid || spot.startingPrice} className="font-mono text-xl font-bold text-money" />
                <p className="text-xs text-muted">
                  {lot.bidCount > 0 ? `top bid, ${lot.bidCount} ${lot.bidCount === 1 ? "bid" : "bids"}` : "starting bid"}
                </p>
              </div>
              <button
                type="button"
                disabled={!open}
                onClick={() => openBid(spot.id)}
                className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep transition hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40"
              >
                {open ? `Bid ${formatUsd(minNextBid(spot, lot))}+` : "Closed"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
