"use client";

import { Calendar, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ScheduleOrderCard } from "@/components/schedule/schedule-order-card";
import { Spinner } from "@/components/ui/spinner";
import { ErrorCard } from "@/components/ui/error-card";
import {
  formatDayDivider,
  formatDayNumber,
  formatDayShort,
  formatDaysRemainingBadge,
  formatScheduleHeaderDate,
  getTodayISO,
  getWeekDays,
} from "@/lib/format/dates";
import { useAutoRefresh } from "@/lib/hooks/use-auto-refresh";
import { fetchScheduleOrders } from "@/lib/orders/fetch-schedule";
import { OrderStatus } from "@/lib/orders/constants";
import { startOrderPicking } from "@/lib/orders/start-picking";
import { createClient } from "@/lib/supabase/client";
import { cardPremium } from "@/lib/ui/styles";
import type { ScheduleOrderRow } from "@/types/schedule";
import { cn } from "@/lib/utils";

type ViewMode = "today" | "week" | "all";

const TABS: { id: ViewMode; label: string }[] = [
  { id: "today", label: "Σήμερα" },
  { id: "week", label: "Εβδομάδα" },
  { id: "all", label: "Όλα" },
];

const REFRESH_MS = 5 * 60 * 1000;

export function ScheduleView() {
  const [mode, setMode] = useState<ViewMode>("today");
  const [orders, setOrders] = useState<ScheduleOrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [selectedWeekDay, setSelectedWeekDay] = useState<string | null>(null);

  const today = getTodayISO();
  const weekDays = useMemo(() => getWeekDays(today), [today]);

  const load = useCallback(async () => {
    const supabase = createClient();

    if (mode === "today") {
      const result = await fetchScheduleOrders(supabase, {
        pickingDateEq: today,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        setOrders(result.orders);
      }
      setInitialLoading(false);
      return;
    }

    if (mode === "week") {
      const weekStart = weekDays[0];
      const weekEnd = weekDays[6];
      const result = await fetchScheduleOrders(supabase, {
        pickingDateGte: weekStart,
        pickingDateLte: weekEnd,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        setOrders(result.orders);
        setSelectedWeekDay((prev) => prev ?? today);
      }
      setInitialLoading(false);
      return;
    }

    const result = await fetchScheduleOrders(supabase, {
      pickingDateGte: today,
    });
    if (result.error) {
      setError(result.error);
    } else {
      setError(null);
      setOrders(result.orders);
    }
    setInitialLoading(false);
  }, [mode, today, weekDays]);

  const { lastUpdatedLabel, refreshing, refresh } = useAutoRefresh(load, {
    intervalMs: REFRESH_MS,
  });

  useEffect(() => {
    setInitialLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("warehouse-schedule-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const countsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of weekDays) map.set(day, 0);
    for (const o of orders) {
      if (o.picking_date) {
        map.set(o.picking_date, (map.get(o.picking_date) ?? 0) + 1);
      }
    }
    return map;
  }, [orders, weekDays]);

  const weekOrders = useMemo(() => {
    if (!selectedWeekDay) return [];
    return orders.filter((o) => o.picking_date === selectedWeekDay);
  }, [orders, selectedWeekDay]);

  const groupedAll = useMemo(() => {
    const groups = new Map<string, ScheduleOrderRow[]>();
    for (const o of orders) {
      if (!o.picking_date) continue;
      const list = groups.get(o.picking_date) ?? [];
      list.push(o);
      groups.set(o.picking_date, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [orders]);

  async function startPicking(orderId: string) {
    setStartingId(orderId);
    const supabase = createClient();
    const { error: updateError } = await startOrderPicking(supabase, orderId);

    if (updateError) {
      toast.error("Αποτυχία έναρξης picking");
      setStartingId(null);
      return;
    }

    window.location.href = `/orders/${orderId}/pick`;
  }

  function renderOrderList(
    list: ScheduleOrderRow[],
    options?: { showDaysRemaining?: boolean },
  ) {
    if (list.length === 0) {
      return (
        <p className={cn(cardPremium, "p-8 text-center text-lg text-white/50")}>
          Δεν υπάρχουν προγραμματισμένες παραγγελίες
        </p>
      );
    }

    return list.map((order) => (
      <ScheduleOrderCard
        key={order.id}
        order={order}
        startingId={startingId}
        onStartPicking={(id) => void startPicking(id)}
        daysRemainingLabel={
          options?.showDaysRemaining && order.picking_date
            ? formatDaysRemainingBadge(order.picking_date)
            : undefined
        }
      />
    ));
  }

  if (initialLoading && orders.length === 0 && !error) {
    return (
      <section className="flex min-h-[50dvh] items-center justify-center">
        <Spinner />
      </section>
    );
  }

  if (error) {
    return <ErrorCard message={error} onRetry={() => void refresh()} />;
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Πρόγραμμα</h1>
          <p className="mt-1 text-sm text-white/50">
            Ενημέρωση: {lastUpdatedLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-white/10 text-white/70"
          aria-label="Ανανέωση"
        >
          <RefreshCw
            className={cn("size-5 text-white", refreshing && "animate-spin")}
          />
        </button>
      </header>

      <div className="flex gap-2 rounded-2xl border border-white/10 bg-kartex-card/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={cn(
              "min-h-12 flex-1 rounded-xl text-sm font-semibold transition-all duration-200",
              mode === tab.id
                ? "bg-kartex-orange text-white shadow-lg shadow-kartex-orange/30"
                : "text-white/50 hover:text-white",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "today" ? (
        <>
          <div className={cn(cardPremium, "p-4")}>
            <p className="flex items-center gap-2 text-lg font-bold text-white">
              <Calendar className="size-5 shrink-0 text-white" strokeWidth={2} />
              Σήμερα — {formatScheduleHeaderDate(today)}
            </p>
            <p className="mt-1 text-base text-white/50">
              {orders.length} παραγγελί{orders.length === 1 ? "α" : "ες"} για
              picking
            </p>
          </div>
          {renderOrderList(orders)}
        </>
      ) : null}

      {mode === "week" ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {weekDays.map((day) => {
              const count = countsByDay.get(day) ?? 0;
              const active = selectedWeekDay === day;
              const isToday = day === today;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedWeekDay(day)}
                  className={cn(
                    "flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-2xl border px-3 py-3 transition-all duration-200",
                    active
                      ? "border-kartex-orange bg-kartex-orange/20 glow-orange"
                      : "border-white/10 bg-kartex-card/60",
                  )}
                >
                  <span className="text-xs text-white/50">
                    {formatDayShort(day)}
                  </span>
                  <span className="text-2xl font-bold text-white">
                    {formatDayNumber(day)}
                  </span>
                  <span
                    className={cn(
                      "mt-1 text-xs font-medium",
                      count > 0 ? "text-kartex-orange" : "text-white/40",
                    )}
                  >
                    {count} picking
                  </span>
                  {isToday ? (
                    <span className="mt-1 text-[10px] text-kartex-success">
                      σήμερα
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {selectedWeekDay ? (
            <p className="text-sm text-white/50">
              {formatDayDivider(selectedWeekDay)} · {weekOrders.length}{" "}
              παραγγελίες
            </p>
          ) : null}
          {renderOrderList(weekOrders)}
        </>
      ) : null}

      {mode === "all" ? (
        <>
          <p className="text-sm text-white/50">
            Επερχόμενες παραγγελίες ({orders.length})
          </p>
          {groupedAll.length === 0 ? (
            <p className={cn(cardPremium, "p-8 text-center text-lg text-white/50")}>
              Δεν υπάρχουν επερχόμενες παραγγελίες
            </p>
          ) : (
            groupedAll.map(([date, dayOrders]) => (
              <section key={date} className="flex flex-col gap-3">
                <h2 className="sticky top-14 z-10 border-b border-white/10 bg-kartex-navy/90 py-2 text-base font-semibold text-kartex-orange backdrop-blur-sm">
                  {formatDayDivider(date)}
                </h2>
                {renderOrderList(dayOrders, { showDaysRemaining: true })}
              </section>
            ))
          )}
        </>
      ) : null}
    </section>
  );
}
