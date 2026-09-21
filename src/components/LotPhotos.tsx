"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { HERO_PHOTOS, formatUsd, isOpen, spotById, type HeroPhoto } from "@/data/spots";
import { useBid } from "./BidProvider";

// Desktop: all three side by side. Every photo gets the same height (her height), so she's
// the same size in each; the bag is drawn smaller inside that height via `scale`. The
// height is also capped by the viewport width so the row always fits: 1.436 = sum of
// (width/height x scale) over the photos, px values = side gutters + gaps.
const ROW_HEIGHT = "h-[min(70vh,640px,calc((min(100vw,1024px)-144px)/1.436))]";
// Phone: one photo at a time, so it only has to fit the screen on its own.
const SLIDE_H = "min(56vh, 460px)";
const SLIDE_HEIGHT = "h-[min(56vh,460px)]";
const ROTATE_MS = 4000;

// `standalone` = shown on its own (the phone carousel). It's sized to fit the slide both
// ways (never taller than the slide, never wider than the screen) instead of standing on
// the shared baseline the desktop row uses.
function Photo({ photo, heightClass, standalone = false }: { photo: HeroPhoto; heightClass: string; standalone?: boolean }) {
  const { board, openBid } = useBid();
  const scale = photo.scale ?? 1;
  const ratio = photo.width / photo.height;

  const outer = standalone
    ? { className: "relative flex h-full items-center", style: { width: `min(100%, calc(${SLIDE_H} * ${ratio}))` } }
    : { className: `relative flex items-end ${heightClass}`, style: { aspectRatio: `${photo.width * scale} / ${photo.height}` } };

  return (
    // Outer box sets the footprint; inner box is the photo itself, with the spot boxes
    // positioned as percentages of it.
    <div className={outer.className} style={outer.style}>
      <div className="relative w-full" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
        <Image src={photo.src} alt={photo.alt} fill priority sizes="(min-width: 640px) 33vw, 80vw" className="object-contain" />
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

// Phone carousel: rotates on its own until the first swipe or dot tap, then stays put.
function Carousel() {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const [direction, setDirection] = useState(1);
  const photo = HERO_PHOTOS[index];

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % HERO_PHOTOS.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [auto]);

  const goTo = (next: number, dir: number) => {
    setAuto(false); // a swipe or a dot tap takes over from here
    setDirection(dir);
    setIndex((next + HERO_PHOTOS.length) % HERO_PHOTOS.length);
  };

  return (
    <div className="sm:hidden">
      <div className={`relative ${SLIDE_HEIGHT} overflow-hidden`}>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={photo.src}
            // slides across rather than fading on top of the previous photo
            initial={{ x: `${direction * 100}%` }}
            animate={{ x: 0 }}
            exit={{ x: `${direction * -100}%`, opacity: 0.4 }}
            transition={{ duration: 0.45, ease: [0.33, 1, 0.68, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -40) goTo(index + 1, 1);
              else if (info.offset.x > 40) goTo(index - 1, -1);
              else setAuto(false);
            }}
            className="absolute inset-0 flex touch-pan-y justify-center"
          >
            <Photo photo={photo} heightClass={SLIDE_HEIGHT} standalone />
          </motion.div>
        </AnimatePresence>
      </div>

      <Caption photo={photo} />

      <div className="mt-1 flex justify-center gap-1">
        {HERO_PHOTOS.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => goTo(i, i > index ? 1 : -1)}
            aria-label={`Show ${p.alt}`}
            aria-current={i === index}
            className="p-2"
          >
            <span className={`block h-1.5 w-1.5 rounded-full transition ${i === index ? "bg-fg" : "bg-line"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function LotPhotos() {
  return (
    <>
      <Carousel />
      <div className="hidden items-end justify-center gap-4 sm:flex sm:gap-12">
        {HERO_PHOTOS.map((photo) => (
          <figure key={photo.src}>
            <Photo photo={photo} heightClass={ROW_HEIGHT} />
            <Caption photo={photo} />
          </figure>
        ))}
      </div>
    </>
  );
}
