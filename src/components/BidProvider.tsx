"use client";

import { MotionConfig } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { spotById, type LiveData, type Spot, type SpotId } from "@/data/spots";
import { BidDialog } from "./BidDialog";

const POLL_MS = 12_000;

type BidCtx = LiveData & {
  openBid: (spotId?: SpotId) => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<BidCtx | null>(null);

export function useBid() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBid must be used inside <BidProvider>");
  return ctx;
}

// Owns the live bid data (polled) and the single bid dialog, so any photo, card,
// chart or CTA on the page reads the same numbers and can open the form.
export function BidProvider({ initial, children }: { initial: LiveData; children: React.ReactNode }) {
  const [live, setLive] = useState(initial);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/board", { cache: "no-store" });
      if (res.ok) setLive(await res.json());
    } catch {
      // Offline or server hiccup: keep showing the last known numbers.
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const openBid = useCallback((spotId?: SpotId) => {
    setSpot((spotId && spotById(spotId)) || null);
    setKey((k) => k + 1); // fresh form state each time
    setOpen(true);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <Ctx.Provider value={{ ...live, openBid, refresh }}>
        {children}
        <BidDialog
          key={key}
          spot={spot}
          board={live.board}
          open={open}
          onClose={() => setOpen(false)}
          onPlaced={refresh}
        />
      </Ctx.Provider>
    </MotionConfig>
  );
}

export function BidButton({
  spotId,
  className,
  children,
  disabled,
}: {
  spotId?: SpotId;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { openBid } = useBid();
  return (
    <button type="button" disabled={disabled} onClick={() => openBid(spotId)} className={className}>
      {children}
    </button>
  );
}
