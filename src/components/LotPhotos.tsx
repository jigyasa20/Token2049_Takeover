"use client";

import Image from "next/image";
import { HERO_PHOTOS, formatUsd, isOpen, spotById, type HeroPhoto } from "@/data/spots";
import { useBid } from "./BidProvider";

// Both cut-outs are full-length shots, so giving them the same height keeps her the
// same size in each. Widths follow each photo's own proportions. The height is also
// capped by the viewport width so the pair always fits side by side on a phone:
// 0.893 = sum of the two photos' width/height ratios, the px values = gutters + gap.
const HEIGHT =
  "h-[min(64vh,560px,calc((100vw-56px)/0.893))] sm:h-[min(70vh,640px,calc((min(100vw,1024px)-112px)/0.893))]";

function Photo({ photo }: { photo: HeroPhoto }) {
  const { board, openBid } = useBid();

  return (
    <div className={`relative ${HEIGHT}`} style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
      <Image src={photo.src} alt={photo.alt} fill priority sizes="(min-width: 640px) 40vw, 50vw" className="object-contain" />
      {photo.boxes.map((b) => {
        const spot = spotById(b.spot)!;
        const open = isOpen(board[b.spot]);
        return (
          <button
            key={b.spot}
            type="button"
            disabled={!open}
            onClick={() => openBid(b.spot)}
            aria-label={`Bid on ${spot.name}`}
            className="absolute grid place-items-center rounded-md border-2 border-dashed border-white/90 bg-black/20 transition hover:scale-[1.03] hover:border-solid hover:bg-accent/30 active:scale-[0.98] disabled:cursor-not-allowed"
            style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
          >
            <span className="whitespace-nowrap rounded bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-fg sm:text-[10px]">
              your brand
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Caption({ photo }: { photo: HeroPhoto }) {
  const { board } = useBid();
  const spot = spotById(photo.caption)!;
  const lot = board[photo.caption];
  return (
    <p className="mt-3 text-center text-sm">
      <span className="font-semibold">{spot.name}</span>{" "}
      <span className="font-mono font-bold text-money">{formatUsd(lot.highBid || spot.startingPrice)}</span>{" "}
      <span className="text-xs text-muted">{lot.bidCount > 0 ? "top bid" : "to start"}</span>
    </p>
  );
}

export function LotPhotos() {
  return (
    <div className="flex items-end justify-center gap-6 sm:gap-16">
      {HERO_PHOTOS.map((photo) => (
        <figure key={photo.src}>
          <Photo photo={photo} />
          <Caption photo={photo} />
        </figure>
      ))}
    </div>
  );
}
