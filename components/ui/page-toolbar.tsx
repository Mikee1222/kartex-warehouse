"use client";

import { RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

type PageToolbarProps = {
  title: string;
  lastUpdatedLabel: string;
  refreshing: boolean;
  onRefresh: () => void;
  showLive?: boolean;
};

export function PageToolbar({
  title,
  lastUpdatedLabel,
  refreshing,
  onRefresh,
  showLive = true,
}: PageToolbarProps) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">
          {title}
        </h1>
        <p className="mt-1 text-base text-[var(--text-muted)]">
          τελευταία ενημέρωση {lastUpdatedLabel}
        </p>
        {showLive ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
            <span className="pulse-live inline-block size-2 rounded-full bg-[var(--orange)]" />
            LIVE
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className={cn(
          "flex min-h-12 min-w-12 items-center justify-center rounded-xl",
          "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
          "transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--surface-2)]",
          refreshing && "opacity-60",
        )}
        aria-label="Ανανέωση"
      >
        <RefreshCw
          className={cn("size-5", refreshing && "animate-spin-slow")}
        />
      </button>
    </header>
  );
}
