"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  addDaysISO,
  formatDayDivider,
  getTodayISO,
} from "@/lib/format/dates";
import { fetchUpcomingPickings } from "@/lib/orders/fetch-schedule";
import { createClient } from "@/lib/supabase/client";
import { getCustomerName } from "@/types/orders";
import type { ScheduleOrderRow } from "@/types/schedule";
import { cn } from "@/lib/utils";

const REFRESH_MS = 5 * 60 * 1000;

export function ScheduleBell() {
  const [orders, setOrders] = useState<ScheduleOrderRow[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const today = getTodayISO();
  const tomorrow = addDaysISO(today, 1);
  const weekEnd = addDaysISO(today, 7);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { orders: rows, error } = await fetchUpcomingPickings(
      supabase,
      today,
      weekEnd,
    );
    if (!error) setOrders(rows);
  }, [today, weekEnd]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const todayCount = useMemo(
    () => orders.filter((o) => o.picking_date === today).length,
    [orders, today],
  );
  const tomorrowCount = useMemo(
    () => orders.filter((o) => o.picking_date === tomorrow).length,
    [orders, tomorrow],
  );

  const badgeTone =
    todayCount > 0 ? "orange" : tomorrowCount > 0 ? "yellow" : null;
  const badgeCount = todayCount > 0 ? todayCount : tomorrowCount;

  const upcoming = useMemo(() => {
    return [...orders].sort((a, b) =>
      (a.picking_date ?? "").localeCompare(b.picking_date ?? ""),
    );
  }, [orders]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex min-h-10 min-w-10 items-center justify-center rounded-xl",
          "border border-white/10 bg-kartex-card/60 transition-all duration-200",
          open && "glow-orange",
        )}
        aria-label="Πρόγραμμα picking"
      >
        <Calendar className="size-5 text-white" />
        {badgeTone ? (
          <span
            className={cn(
              "absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white",
              badgeTone === "orange" ? "bg-kartex-orange" : "bg-kartex-warning",
            )}
          >
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-kartex-card shadow-lg shadow-black/40">
          <p className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">
            Πρόγραμμα picking
          </p>
          {todayCount > 0 ? (
            <p className="border-b border-kartex-orange/20 bg-kartex-orange/10 px-4 py-2 text-xs text-kartex-orange">
              {todayCount} σήμερα · {tomorrowCount} αύριο
            </p>
          ) : tomorrowCount > 0 ? (
            <p className="border-b border-kartex-warning/20 bg-kartex-warning/10 px-4 py-2 text-xs text-kartex-warning">
              {tomorrowCount} αύριο
            </p>
          ) : null}
          {upcoming.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-white/50">
              Καμία προγραμματισμένη παραγγελία
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {upcoming.map((o) => (
                <li key={o.id}>
                  <Link
                    href="/schedule"
                    onClick={() => setOpen(false)}
                    className="block border-b border-white/5 px-4 py-3 transition-colors hover:bg-kartex-card-hover"
                  >
                    <p className="text-sm font-medium text-white">
                      {o.order_number}
                    </p>
                    <p className="truncate text-xs text-white/50">
                      {getCustomerName(o.customers)}
                    </p>
                    <p className="mt-1 text-xs text-kartex-orange">
                      {o.picking_date
                        ? formatDayDivider(o.picking_date)
                        : "—"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/schedule"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-sm font-medium text-kartex-orange"
          >
            Προβολή προγράμματος →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
