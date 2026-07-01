"use client";

import { LowStockBell } from "@/components/layout/low-stock-bell";
import { ScheduleBell } from "@/components/layout/schedule-bell";

type TopBarProps = {
  userName: string;
};

export function TopBar({ userName }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_95%,transparent)] px-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="text-base font-bold tracking-wide text-[var(--gold)]">
          KARTEX ΑΠΟΘΗΚΗ
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <span className="pulse-live size-1.5 rounded-full bg-[var(--gold)]" />
          LIVE
        </span>
      </div>
      <section className="flex items-center gap-2">
        <ScheduleBell />
        <LowStockBell />
        <span className="max-w-[100px] truncate text-base text-[var(--text-muted)]">
          {userName}
        </span>
      </section>
    </header>
  );
}
