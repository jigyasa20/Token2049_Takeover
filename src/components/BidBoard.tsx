"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { SPOTS, formatUsd, isOpen, minNextBid, spotById, type FeedBid, type Spot, type SpotId } from "@/data/spots";
import { AnimatedUsd } from "./AnimatedNumber";
import { useBid } from "./BidProvider";

// Fixed timezone + locale so server and client render identical text.
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    timeZone: "Asia/Singapore",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

// ---------- Step chart ----------

const W = 640;
const H = 260;
const PAD = { l: 56, r: 20, t: 28, b: 30 };

function StepChart({ spot, bids }: { spot: Spot; bids: FeedBid[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const top = bids.at(-1);
  const times = bids.map((b) => Date.parse(b.at));
  const first = times[0] ?? 0;
  const last = times.at(-1) ?? 0;
  const span = Math.max(last - first, 2 * 3_600_000);
  const t0 = first - span * 0.08;
  const t1 = last + span * 0.12;

  const lo = spot.startingPrice;
  const hi = Math.max(top?.amount ?? lo, lo);
  const range = Math.max(hi - lo, lo * 0.25);
  const y0 = lo - range * 0.18;
  const y1 = hi + range * 0.18;

  const x = (t: number) => PAD.l + ((t - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - y0) / (y1 - y0)) * (H - PAD.t - PAD.b);

  // Every accepted bid is a new high, so the line only ever steps up.
  const path = bids.length
    ? bids.reduce((d, b, i) => {
        const px = x(times[i]);
        const py = y(b.amount);
        return i === 0 ? `M ${px} ${py}` : `${d} H ${px} V ${py}`;
      }, "") + ` H ${W - PAD.r}`
    : "";

  const ticks = [lo, lo + (hi - lo) / 2, hi].filter((v, i, a) => a.indexOf(v) === i);
  const leader = top ? { left: (x(last) / W) * 100, top: (y(top.amount) / H) * 100 } : null;
  const drawDuration = 0.9;

  return (
    <div ref={ref} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Bid history for ${spot.name}`}>
        {/* grid + y labels */}
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={PAD.l - 10} y={y(v)} textAnchor="end" dominantBaseline="middle" className="fill-muted font-mono text-[11px]">
              {formatUsd(Math.round(v))}
            </text>
          </g>
        ))}

        {/* starting price */}
        <line
          x1={PAD.l}
          x2={W - PAD.r}
          y1={y(lo)}
          y2={y(lo)}
          stroke="var(--muted)"
          strokeDasharray="4 5"
          opacity={0.6}
        />
        <text x={W - PAD.r} y={y(lo) + 16} textAnchor="end" className="fill-muted font-mono text-[10px]">
          starting bid
        </text>

        {/* x labels */}
        {bids.length > 0 && (
          <>
            <text x={x(first)} y={H - 8} className="fill-muted font-mono text-[10px]">
              {fmtTime(bids[0].at)}
            </text>
            {bids.length > 1 && (
              <text x={x(last)} y={H - 8} textAnchor="end" className="fill-muted font-mono text-[10px]">
                {fmtTime(top!.at)}
              </text>
            )}
          </>
        )}

        {/* the step line draws itself when scrolled into view */}
        {path && (
          <motion.path
            d={path}
            fill="none"
            stroke="var(--fg)"
            strokeWidth={2}
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: inView ? 1 : 0 }}
            transition={{ duration: drawDuration, ease: "easeInOut" }}
          />
        )}

        {/* one dot per bid, popping in after the line passes it */}
        {bids.map((b, i) => {
          const isTop = i === bids.length - 1;
          return (
            <motion.circle
              key={b.id}
              cx={x(times[i])}
              cy={y(b.amount)}
              r={isTop ? 6 : 3.5}
              fill={isTop ? "var(--accent)" : "var(--surface)"}
              stroke={isTop ? "var(--surface)" : "var(--fg)"}
              strokeWidth={isTop ? 3 : 1.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 24, delay: (i / Math.max(bids.length - 1, 1)) * drawDuration }}
            />
          );
        })}
      </svg>

      {/* leader label, anchored to the top dot */}
      {leader && top && (
        <motion.div
          key={top.id}
          className={`pointer-events-none absolute -translate-y-[calc(100%+12px)] whitespace-nowrap rounded-full bg-accent px-2.5 py-1 font-mono text-[11px] text-white ${
            leader.left > 45 ? "-translate-x-full" : "-translate-x-3"
          }`}
          style={{ left: `${leader.left}%`, top: `${leader.top}%` }}
          initial={{ opacity: 0, y: 6 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          transition={{ delay: drawDuration, duration: 0.3 }}
        >
          {top.name} is leading
        </motion.div>
      )}

      {bids.length === 0 && (
        <div className="absolute inset-0 grid place-items-center">
          <p className="rounded-full bg-surface px-3 py-1 text-sm text-muted ring-1 ring-line">No bids yet. Go first?</p>
        </div>
      )}
    </div>
  );
}

// ---------- Bid list ----------

function BidList({ bids }: { bids: FeedBid[] }) {
  const newestFirst = [...bids].reverse();
  const topId = bids.at(-1)?.id;

  if (!bids.length) {
    return <p className="px-5 py-8 text-center text-sm text-muted">Nothing here yet.</p>;
  }

  return (
    <ul className="max-h-[320px] divide-y divide-line overflow-y-auto">
      <AnimatePresence initial={false}>
        {newestFirst.map((b) => {
          const isTop = b.id === topId;
          return (
            <motion.li
              key={b.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative flex items-center justify-between gap-3 px-5 py-3 ${isTop ? "bg-accent-soft/40" : ""}`}
            >
              {isTop && <motion.span layoutId="leader-bar" className="absolute inset-y-0 left-0 w-[3px] bg-accent" />}
              <div className="min-w-0">
                <p className={`truncate text-sm ${isTop ? "font-semibold text-fg" : b.isPublic ? "text-fg" : "text-muted"}`}>
                  {b.name}
                  {isTop && (
                    <span className="ml-2 rounded-full bg-lemon px-1.5 py-0.5 align-middle font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-fg">
                      Leading
                    </span>
                  )}
                </p>
                <p className="font-mono text-[11px] text-muted">{fmtTime(b.at)}</p>
              </div>
              <span className={`shrink-0 font-mono text-sm ${isTop ? "font-bold text-money" : "text-muted line-through decoration-muted/40"}`}>
                {formatUsd(b.amount)}
              </span>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

// ---------- Combined deal ----------

function CombinedDeal({ feedBy }: { feedBy: (id: SpotId) => FeedBid[] }) {
  const topOf = (id: SpotId) => feedBy(id).at(-1)?.amount ?? 0;
  const both = topOf("both");
  const separate = topOf("blazer") + topOf("bag");
  const max = Math.max(both, separate, 1);
  const bothWins = both > separate;
  const nobody = both === 0 && separate === 0;

  const rows = [
    { label: "Bid for both", value: both, detail: both ? formatUsd(both) : "no bids", wins: !nobody && bothWins },
    {
      label: "Top blazer bid + top bag bid",
      value: separate,
      detail: `${formatUsd(topOf("blazer"))} + ${formatUsd(topOf("bag"))}`,
      wins: !nobody && !bothWins,
    },
  ];

  return (
    <div className="rounded-lg border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="font-semibold">Both spots vs. separate bids</p>
        <p className="text-sm text-muted">
          {nobody
            ? "No bids yet."
            : bothWins
              ? "Right now, one brand would get both."
              : "Right now, two brands would win one each."}
        </p>
      </div>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className={r.wins ? "font-semibold" : "text-muted"}>{r.label}</span>
              <span className={`font-mono ${r.wins ? "font-bold text-money" : "text-muted"}`}>
                {r.detail}
                {r.value > 0 && r.detail.includes("+") && <span className="text-fg"> = {formatUsd(r.value)}</span>}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-line">
              <motion.div
                className={`h-full rounded-full ${r.wins ? "bg-accent" : "bg-muted/50"}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${(r.value / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Board ----------

export function BidBoard() {
  const { board, feed, preview, openBid } = useBid();
  const [tab, setTab] = useState<SpotId>("blazer");
  const feedBy = (id: SpotId) => feed.filter((b) => b.spotId === id);

  const spot = spotById(tab)!;
  const lot = board[tab];
  const bids = feedBy(tab);
  const top = bids.at(-1);
  const open = isOpen(lot);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {/* tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex gap-1 rounded-full bg-chip p-1">
            {SPOTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setTab(s.id)}
                aria-pressed={tab === s.id}
                className="relative rounded-full px-3 py-1.5 text-sm transition"
              >
                {tab === s.id && (
                  <motion.span layoutId="bidboard-tab" className="absolute inset-0 rounded-full bg-surface shadow-sm ring-1 ring-line" />
                )}
                <span className={`relative ${tab === s.id ? "font-semibold text-fg" : "text-muted"}`}>
                  {s.name}
                  <span className="ml-1.5 font-mono text-[11px] text-muted">{board[s.id].bidCount}</span>
                </span>
              </button>
            ))}
          </div>
          <span className="flex items-center gap-2 text-xs text-muted">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-money" />
            {preview ? "Sample bids (Supabase not connected)" : "Updates every few seconds"}
          </span>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* chart */}
          <div className="border-b border-line p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted">{top ? "Top bid" : "Starts at"}</p>
                <AnimatedUsd
                  value={top?.amount ?? spot.startingPrice}
                  className="font-mono text-3xl font-bold tracking-[-0.02em] text-money sm:text-4xl"
                />
                {top && <p className="mt-0.5 text-sm">by <span className="font-semibold">{top.name}</span></p>}
              </div>
              <button
                type="button"
                disabled={!open}
                onClick={() => openBid(tab)}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep transition hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40"
              >
                {open ? `Outbid for ${formatUsd(minNextBid(spot, lot))}` : "Bidding closed"}
              </button>
            </div>
            {/* keyed so the draw-in replays when switching lots */}
            <StepChart key={tab} spot={spot} bids={bids} />
          </div>

          {/* list */}
          <div>
            <p className="border-b border-line px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              {bids.length} {bids.length === 1 ? "bid" : "bids"} on {spot.name}
            </p>
            <BidList bids={bids} />
          </div>
        </div>
      </div>

      <CombinedDeal feedBy={feedBy} />
    </div>
  );
}
