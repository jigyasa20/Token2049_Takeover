"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { placeBid, type BidState } from "@/app/actions";
import { CAMPAIGN, SPOTS, formatUsd, minNextBid, spotById, type Board, type Spot } from "@/data/spots";

type Props = {
  spot: Spot | null;
  board: Board;
  open: boolean;
  onClose: () => void;
  onPlaced: () => void; // refresh live data after the server answers
};

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[15px] text-fg placeholder:text-muted/60 outline-none transition focus:border-fg";

const labelCls = "mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted";

function FieldError({ msgs }: { msgs?: string[] }) {
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msgs[0]}</p>;
}

export function BidDialog({ spot, board, open, onClose, onPlaced }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState<BidState, FormData>(placeBid, null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // A placed bid, or a "too low" rejection, means the board changed: pull fresh numbers.
  useEffect(() => {
    if (state?.ok || (state && !state.ok && state.minBid)) onPlaced();
  }, [state, onPlaced]);

  const errors = state && !state.ok ? state.errors : undefined;
  const [selectedId, setSelectedId] = useState<string>(spot?.id ?? "");
  const current = spotById(selectedId) ?? null;
  const lot = current ? board[current.id] : null;
  const min = current && lot ? Math.max(minNextBid(current, lot), state && !state.ok ? (state.minBid ?? 0) : 0) : undefined;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-[460px] border-l border-line bg-canvas p-0 text-fg sm:w-[460px]"
    >
      <motion.div
        className="flex h-full flex-col"
        initial={{ x: 32, opacity: 0 }}
        animate={open ? { x: 0, opacity: 1 } : { x: 32, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line bg-surface px-6 py-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">Place a bid</p>
            <h2 className="mt-1 font-display text-2xl font-medium tracking-[-0.03em]">{current?.name ?? "Pick a spot"}</h2>
            {current && lot && (
              <p className="mt-1 text-sm text-muted">
                {lot.highBid > 0 ? (
                  <>
                    Top bid is <span className="font-mono font-bold text-money">{formatUsd(lot.highBid)}</span> ({lot.bidCount}{" "}
                    {lot.bidCount === 1 ? "bid" : "bids"} so far)
                  </>
                ) : (
                  <>
                    No bids yet, starts at <span className="font-mono font-bold text-money">{formatUsd(current.startingPrice)}</span>
                  </>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-fg hover:text-fg"
          >
            ✕
          </button>
        </div>

        {state?.ok ? (
          <div className="flex flex-1 flex-col justify-center gap-6 overflow-y-auto px-6 py-8">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-money text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <motion.path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
                />
              </svg>
            </span>
            <div>
              <p className="font-display text-4xl leading-tight">{state.message}</p>
              {state.spotName && <p className="mt-1 text-muted">Your bid on {state.spotName} is on the board now.</p>}
            </div>

            {/* who to talk to next: no payment on the site, it's all sorted over DM */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.35 }}
              className="rounded-lg border border-line bg-surface p-5"
            >
              <div className="flex items-center gap-3">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-chip">
                  <Image src="/looks/outfit.webp" alt="" fill sizes="48px" className="origin-[50%_14%] scale-[2.2] object-cover object-[50%_12%]" />
                </span>
                <div>
                  <p className="font-semibold">{CAMPAIGN.name}</p>
                  <a
                    href={CAMPAIGN.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline"
                  >
                    {CAMPAIGN.portfolioLabel}
                  </a>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted">
                No payment on the site. Drop me a DM so I know it&apos;s you, and I&apos;ll sort the rest out with the winner after Sep 30.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  href={CAMPAIGN.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-accent px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-accent-deep"
                >
                  X <span className="font-normal opacity-80">{CAMPAIGN.handle}</span>
                </a>
                <a
                  href={CAMPAIGN.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-accent px-3 py-2.5 text-center text-sm font-semibold text-accent transition hover:bg-accent-soft"
                >
                  Instagram
                </a>
              </div>
              <p className="mt-2 text-center font-mono text-[11px] text-muted">{CAMPAIGN.instagramHandle} on Instagram</p>
            </motion.div>

            <button
              type="button"
              onClick={() => {
                onClose();
                document.getElementById("board")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="self-start text-sm text-muted underline underline-offset-4 hover:text-fg"
            >
              See the bid board
            </button>
          </div>
        ) : (
          <form
            // Submit manually so React doesn't reset the fields when validation fails.
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              startTransition(() => action(data));
            }}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6"
            noValidate
          >
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

            <label className="block">
              <span className={labelCls}>Spot</span>
              <select
                name="spot_id"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className={inputCls}
                required
              >
                <option value="" disabled>
                  Choose a spot…
                </option>
                {SPOTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <FieldError msgs={errors?.spot_id} />
            </label>

            <label className="block">
              <span className={labelCls}>Your bid (USD) *</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted">$</span>
                <input
                  key={min}
                  name="amount"
                  type="number"
                  inputMode="numeric"
                  min={min}
                  step={1}
                  defaultValue={min}
                  className={`${inputCls} pl-7 font-mono text-lg`}
                  required
                />
              </div>
              {min !== undefined && !errors?.amount && (
                <p className="mt-1 text-xs text-muted">Minimum {formatUsd(min)}</p>
              )}
              <FieldError msgs={errors?.amount} />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>Brand *</span>
                <input name="brand" className={inputCls} autoComplete="organization" required />
                <FieldError msgs={errors?.brand} />
              </label>
              <label className="block">
                <span className={labelCls}>Your name *</span>
                <input name="name" className={inputCls} autoComplete="name" required />
                <FieldError msgs={errors?.name} />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>Email *</span>
                <input name="email" type="email" className={inputCls} autoComplete="email" required />
                <FieldError msgs={errors?.email} />
              </label>
              <label className="block">
                <span className={labelCls}>Telegram / X</span>
                <input name="handle" className={inputCls} placeholder="@handle" />
              </label>
            </div>

            <label className="flex items-start gap-2.5 text-sm">
              <input name="show_brand" type="checkbox" className="mt-0.5 h-4 w-4 accent-accent" />
              <span>
                Show my brand name on the bid board
                <span className="block text-xs text-muted">If you leave this off, you&apos;ll show up as anonymous. Your name and email stay private either way.</span>
              </span>
            </label>

            <label className="block">
              <span className={labelCls}>Anything else</span>
              <textarea name="message" rows={3} className={inputCls} placeholder="Anything you want me to know" />
            </label>

            {state && !state.ok && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
            )}

            <div className="mt-auto pt-2">
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-accent px-4 py-3 text-[15px] font-medium text-white hover:bg-accent-deep transition hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
              >
                {pending ? "Placing bid…" : "Place bid"}
              </button>
              <p className="mt-3 text-center text-xs text-muted">
                No payment here. If you win, we sort it out over DM.
              </p>
            </div>
          </form>
        )}
      </motion.div>
    </dialog>
  );
}
