"use client";

import { useSyncExternalStore } from "react";

// Ticks once a second on the client; renders placeholders on the server so there's no hydration mismatch.
const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
};
const nowSeconds = () => Math.floor(Date.now() / 1000);

export function Countdown({ endsAt, compact = false }: { endsAt: string; compact?: boolean }) {
  const now = useSyncExternalStore(subscribe, nowSeconds, () => null);
  const end = Math.floor(Date.parse(endsAt) / 1000);
  const left = now === null ? null : Math.max(0, end - now);

  if (left === 0) return <span className="font-mono">Bidding closed</span>;

  const parts =
    left === null
      ? [["--", "d"], ["--", "h"], ["--", "m"], ["--", "s"]]
      : [
          [Math.floor(left / 86400), "d"],
          [Math.floor((left % 86400) / 3600), "h"],
          [Math.floor((left % 3600) / 60), "m"],
          [left % 60, "s"],
        ].map(([v, u]) => [String(v).padStart(2, "0"), u]);

  if (compact) {
    return <span className="font-mono tabular-nums">{parts.map(([v, u]) => `${v}${u}`).join(" ")}</span>;
  }

  return (
    <span className="inline-flex gap-1.5 font-mono tabular-nums">
      {parts.map(([v, u]) => (
        <span key={u} className="rounded-md bg-surface px-2 py-1 text-fg ring-1 ring-line">
          {v}
          <span className="text-muted">{u}</span>
        </span>
      ))}
    </span>
  );
}
