"use client";

import Image from "next/image";
import { HERO_PHOTOS, formatUsd, isOpen, spotById, type HeroPhoto } from "@/data/spots";
import { useBid } from "./BidProvider";

// Every photo gets the same height (her height), so she's the same size in each; the
// bag is drawn smaller inside that height via `scale`. Widths follow each photo's own
// proportions. The height is also capped by the viewport width so all three always fit
// in one row: 1.436 = sum of (width/height x scale) over the photos, and the px values
// are the side gutters plus the gaps between photos.
const HEIGHT =
  "h-[min(64vh,560px,calc((100vw-64px)/1.436))] sm:h-[min(70vh,640px,calc((min(100vw,1024px)-144px)/1.436))]";

function Photo({ photo }: { photo: HeroPhoto }) {
  const { board, openBid } = useBid();
  const scale = photo.scale ?? 1;

  return (
    // Outer box: full height, as wide as the (scaled) photo. Inner box: the photo itself,
    // resting on the bottom edge. Spot boxes are positioned relative to the inner box.
    <div className={`relative flex items-end ${HEIGHT}`} style={{ aspectRatio: `${photo.width * scale} / ${photo.height}` }}>
      <div className="relative w-full" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
        <Image src={photo.src} alt={photo.alt} fill priority sizes="(min-width: 640px) 33vw, 40vw" className="object-contain" />
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
    </div>
  );
}

// Always takes the same space, even with no caption, so everyone's feet line up.
// `w-0 min-w-full` stops the caption from widening its photo's column (a wide caption
// would push the row off-screen); items-center lets longer text spill evenly both sides.
// Two lines (name / price) until there's room for one.
function Caption({ photo }: { photo: HeroPhoto }) {
  const { board } = useBid();
  const spot = photo.caption && spotById(photo.caption);
  const lot = photo.caption && board[photo.caption];
  return (
    <p className="mt-3 flex h-10 w-0 min-w-full flex-col items-center whitespace-nowrap text-sm lg:h-5 lg:flex-row lg:justify-center lg:gap-1">
      {spot && lot && (
        <>
          <span className="font-semibold">{spot.name}</span>
          <span>
            <span className="font-mono font-bold text-money">{formatUsd(lot.highBid || spot.startingPrice)}</span>{" "}
            <span className="text-xs text-muted">{lot.bidCount > 0 ? "top bid" : "to start"}</span>
          </span>
        </>
      )}
    </p>
  );
}

export function LotPhotos() {
  return (
    <div className="flex items-end justify-center gap-4 sm:gap-12">
      {HERO_PHOTOS.map((photo) => (
        <figure key={photo.src}>
          <Photo photo={photo} />
          <Caption photo={photo} />
        </figure>
      ))}
    </div>
  );
}
