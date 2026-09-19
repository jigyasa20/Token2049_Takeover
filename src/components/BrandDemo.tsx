"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { BidButton } from "./BidProvider";

// Demo only: shows what a fully branded look could be. Add more brands here as mockups arrive.
const BRANDS = [
  {
    id: "cocacola",
    name: "Coca-Cola",
    src: "/looks/demo-cocacola.webp",
    icon: (
      <span className="grid h-full w-full place-items-center rounded-full bg-[#e41e2b] font-display text-[11px] font-semibold italic tracking-[-0.02em] text-white">
        Coca‑Cola
      </span>
    ),
  },
];

const BASE = "/looks/outfit.webp";

export function BrandDemo() {
  const [active, setActive] = useState<string | null>(null);
  const brand = BRANDS.find((b) => b.id === active);

  return (
    <div className="grid items-center gap-8 rounded-lg border border-line bg-surface p-4 sm:p-8 md:grid-cols-[minmax(0,320px)_1fr] md:gap-12">
      <div className="relative mx-auto aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-xl bg-chip">
        <Image src={BASE} alt="Jigyasa, plain outfit" fill sizes="320px" className="object-cover" />
        {/* the branded look wipes down over the plain one, like putting the jacket on */}
        {BRANDS.map((b) => {
          const on = active === b.id;
          return (
            <motion.div
              key={b.id}
              className="absolute inset-0"
              initial={false}
              animate={{ clipPath: on ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" }}
              transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
            >
              <Image src={b.src} alt={`Jigyasa wearing a ${b.name} branded outfit`} fill sizes="320px" className="object-cover" />
            </motion.div>
          );
        })}
        {/* bright edge that travels with the wipe */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-[2px] bg-white"
          initial={false}
          animate={brand ? { top: ["0%", "100%"], opacity: [1, 1, 0] } : { top: ["100%", "0%"], opacity: [1, 1, 0] }}
          transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
          style={{ opacity: 0 }}
        />
        <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-fg">
          {brand ? `${brand.name} (mockup)` : "Before"}
        </span>
      </div>

      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Try it on</p>
        <h3 className="mt-2 font-display text-4xl sm:text-5xl">
          Tap the logo, see it <em>on me</em>
        </h3>
        <p className="mt-3 max-w-md text-muted">
          Here&apos;s a Coca-Cola version I mocked up so you can picture it (they&apos;re not a sponsor, just an example). Tap it to swap outfits, tap again to go back.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {BRANDS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setActive((cur) => (cur === b.id ? null : b.id))}
              aria-pressed={active === b.id}
              aria-label={`Try ${b.name}`}
              className={`h-16 w-16 rounded-full p-1 transition hover:scale-[1.05] active:scale-[0.97] ${
                active === b.id ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : "ring-1 ring-line"
              }`}
            >
              {b.icon}
            </button>
          ))}
          <BidButton className="grid h-16 w-16 place-items-center rounded-full border border-dashed border-muted/60 text-center font-mono text-[10px] leading-tight text-muted transition hover:border-fg hover:text-fg">
            your
            <br />
            logo?
          </BidButton>
        </div>

        {brand && (
          <button type="button" onClick={() => setActive(null)} className="mt-5 text-sm text-muted underline underline-offset-4 hover:text-fg">
            Back to plain
          </button>
        )}
      </div>
    </div>
  );
}
