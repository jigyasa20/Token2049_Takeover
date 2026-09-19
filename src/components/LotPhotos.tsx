"use client";

import Image from "next/image";
import { SPOTS, formatUsd, isOpen, spotById, type Box, type Spot } from "@/data/spots";
import { useBid } from "./BidProvider";

function LogoBox({ box }: { box: Box }) {
  return (
    <span
      className="absolute grid place-items-center rounded-md border-2 border-dashed border-white/90 bg-black/20"
      style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
    >
      <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-fg sm:text-[10px]">
        your brand
      </span>
    </span>
  );
}

// Renders a photo at its natural aspect ratio so the % logo boxes line up with the image.
function Photo({ spot, sizes, style }: { spot: Spot; sizes: string; style?: React.CSSProperties }) {
  const { src, width, height } = spot.photo;
  return (
    <div className="relative" style={{ aspectRatio: `${width} / ${height}`, ...style }}>
      <Image src={src} alt={`Jigyasa, ${spot.name.toLowerCase()} spot`} fill sizes={sizes} className="object-cover" />
      {spot.boxes.map((b, i) => (
        <LogoBox key={i} box={b} />
      ))}
    </div>
  );
}

const FRAME_RATIO = 3 / 4; // width / height of every card
const ratioOf = (s: Spot) => s.photo.width / s.photo.height;
// Largest width (as % of the frame) that keeps the photo fully inside the frame.
const fitWidth = (ratio: number) => `${Math.min(100, (ratio / FRAME_RATIO) * 100)}%`;

// Until the combined photo arrives, show the blazer and bag photos side by side.
function BothPlaceholder() {
  const blazer = spotById("blazer")!;
  const bag = spotById("bag")!;
  const total = ratioOf(blazer) + ratioOf(bag);
  return (
    <>
      <div className="relative flex gap-px" style={{ width: fitWidth(total) }}>
        <Photo spot={blazer} sizes="(min-width: 640px) 14vw, 32vw" style={{ width: `${(ratioOf(blazer) / total) * 100}%` }} />
        <Photo spot={bag} sizes="(min-width: 640px) 18vw, 40vw" style={{ width: `${(ratioOf(bag) / total) * 100}%` }} />
        <span className="absolute left-[43%] top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-lg font-bold text-fg">
          +
        </span>
      </div>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 font-mono text-[10px] text-muted">
        photo coming
      </span>
    </>
  );
}

export function LotPhotos() {
  const { board, openBid } = useBid();

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0">
      {SPOTS.map((spot, i) => {
        const lot = board[spot.id];
        const open = isOpen(lot);
        return (
          <button
            key={spot.id}
            type="button"
            disabled={!open}
            onClick={() => openBid(spot.id)}
            aria-label={`Bid on ${spot.name}`}
            className="group w-[72%] shrink-0 snap-center text-left sm:w-auto"
          >
            <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-chip transition group-hover:scale-[1.01] group-active:scale-[0.99]">
              {spot.photo.placeholder ? (
                <BothPlaceholder />
              ) : (
                <Photo spot={spot} sizes="(min-width: 640px) 33vw, 72vw" style={{ width: fitWidth(ratioOf(spot)) }} />
              )}
              <span className="absolute left-3 top-3 rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-fg">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span className="font-semibold">{spot.name}</span>
              <span className="font-mono text-sm font-bold text-money">
                {formatUsd(lot.highBid || spot.startingPrice)}
              </span>
            </div>
            <p className="mt-0.5 flex justify-between text-xs text-muted">
              <span>{spot.kicker}</span>
              <span>{lot.bidCount > 0 ? `top bid, ${lot.bidCount} ${lot.bidCount === 1 ? "bid" : "bids"}` : "starting bid"}</span>
            </p>
          </button>
        );
      })}
    </div>
  );
}
