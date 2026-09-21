"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

// Demo only: shows what a branded blazer + bag could look like. Coca-Cola is just the example.
const BRANDS = [
  {
    id: "cocacola",
    name: "Coca-Cola",
    src: "/looks/cocacola-look.webp",
    icon: (
      <span className="grid h-full w-full place-items-center rounded-full bg-[#e41e2b] font-display text-[11px] font-semibold italic tracking-[-0.02em] text-white">
        Coca‑Cola
      </span>
    ),
  },
];

const BASE = "/looks/blazer-bag-plain.webp";

// The plain and branded photos are the same shot cropped identically, so they swap
// in place with nothing shifting.
const FRAME_RATIO = "941 / 1670";

export function BrandDemo() {
  const [active, setActive] = useState<string | null>(null);
  const [tapped, setTapped] = useState(false); // hides the "click here" hint for good
  const brand = BRANDS.find((b) => b.id === active);

  return (
    <div className="grid items-center gap-8 rounded-lg border border-line bg-surface p-4 sm:p-8 md:grid-cols-[minmax(0,320px)_1fr] md:gap-12">
      {/* No frame. The plain photo always stays in place; the branded one fades in and out
          on top of it. Both are the same shot cropped identically, so nothing shifts. */}
      <div className="relative mx-auto w-full max-w-[320px]" style={{ aspectRatio: FRAME_RATIO }}>
        <Image
          src={BASE}
          alt="Jigyasa in the plain black blazer, carrying the blank white bag"
          fill
          loading="eager"
          sizes="320px"
          className="object-contain object-bottom"
        />
        {BRANDS.map((b) => (
          <Image
            key={b.id}
            src={b.src}
            alt={`Jigyasa with a ${b.name} branded blazer and bag`}
            fill
            loading="eager"
            sizes="320px"
            className={`object-contain object-bottom transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${
              active === b.id ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-fg">
          {brand ? `${brand.name} (mockup)` : "Before"}
        </span>
      </div>

      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Example</p>
        <h3 className="mt-2 font-display text-4xl sm:text-5xl">
          This is how your brand will look <em>on me</em>
        </h3>
        <p className="mt-3 max-w-md text-muted">
          I used Coca-Cola as the example, on both the blazer and the bag. They&apos;re not a sponsor, it&apos;s just a mockup. Tap the
          logo to see it, tap again to go back.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {BRANDS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setTapped(true);
                setActive((cur) => (cur === b.id ? null : b.id));
              }}
              aria-pressed={active === b.id}
              aria-label={`Try ${b.name}`}
              className={`h-16 w-16 rounded-full p-1 transition hover:scale-[1.05] active:scale-[0.97] ${
                active === b.id ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : "ring-1 ring-line"
              }`}
            >
              {b.icon}
            </button>
          ))}

          {/* nudge towards the logo until someone taps it */}
          {!tapped && (
            <motion.span
              aria-hidden
              className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.12em] text-accent"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: [0, -6, 0] }}
              transition={{ opacity: { duration: 0.3 }, x: { duration: 1.4, repeat: Infinity, ease: "easeInOut" } }}
            >
              <span className="text-base leading-none">←</span> click here
            </motion.span>
          )}
        </div>

        {/* the row keeps its space whether or not the link is showing, so nothing shifts */}
        <div className="mt-5 h-5">
          {brand && (
            <button type="button" onClick={() => setActive(null)} className="text-sm text-muted underline underline-offset-4 hover:text-fg">
              Back to plain
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
