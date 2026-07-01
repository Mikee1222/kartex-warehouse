"use client";

import { CheckCircle2, Package } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { PageToolbar } from "@/components/ui/page-toolbar";
import { Spinner } from "@/components/ui/spinner";
import { ErrorCard } from "@/components/ui/error-card";
import {
  getCustomerTypeBadgeClass,
  getCustomerTypeLabel,
} from "@/lib/customers/labels";
import { useAutoRefresh } from "@/lib/hooks/use-auto-refresh";
import { OrderStatus, Priority } from "@/lib/orders/constants";
import {
  becameConfirmed,
  isConfirmedOrder,
  type RealtimeOrderRow,
  vibrateNewOrderAlert,
} from "@/lib/orders/realtime-order-row";
import { startOrderPicking } from "@/lib/orders/start-picking";
import { formatRelativeTimeEl } from "@/lib/format/relative-time";
import { createClient } from "@/lib/supabase/client";
import { cardPremium } from "@/lib/ui/styles";
import {
  getCustomerName,
  getOrderLineStats,
  type CustomerJoin,
  type OrderListRow,
} from "@/types/orders";
import { cn } from "@/lib/utils";

function getCustomerType(
  customers: CustomerJoin | CustomerJoin[] | null,
): string | null {
  if (!customers) return null;
  const c = Array.isArray(customers) ? customers[0] : customers;
  return c?.type ?? null;
}

function priorityBarClass(priority: string | null) {
  return priority === Priority.Urgent
    ? "bg-[var(--red)]"
    : "bg-[var(--orange)]";
}

export function OrdersView() {
  const [orders, setOrders] = useState<OrderListRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("orders")
      .select("*, customers(name, type), order_items(quantity)")
      .eq("status", OrderStatus.Confirmed)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setInitialLoading(false);
      return;
    }

    setError(null);
    setOrders((data as OrderListRow[]) ?? []);
    setInitialLoading(false);
  }, []);

  const { lastUpdatedLabel, refreshing, refresh } = useAutoRefresh(load);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("warehouse-orders-confirmed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as RealtimeOrderRow;
          if (isConfirmedOrder(row)) {
            toast.success(`Νέα παραγγελία: ${row.order_number ?? ""}`);
            vibrateNewOrderAlert();
          }
          void load();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `status=eq.${OrderStatus.Confirmed}`,
        },
        (payload) => {
          const row = payload.new as RealtimeOrderRow;
          const oldRow = payload.old as RealtimeOrderRow;
          if (becameConfirmed(oldRow, row)) {
            toast.success(`Νέα παραγγελία: ${row.order_number ?? ""}`);
            vibrateNewOrderAlert();
          }
          void load();
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "orders" },
        () => {
          void load();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as RealtimeOrderRow;
          if (row.status !== OrderStatus.Confirmed) {
            void load();
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

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
      <PageToolbar
        title="Εκκρεμείς παραγγελίες"
        lastUpdatedLabel={lastUpdatedLabel}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
      />

      {orders.length === 0 ? (
        <p
          className={cn(
            cardPremium,
            "p-8 text-center text-lg text-[var(--text-muted)]",
          )}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <CheckCircle2 className="size-5 text-[var(--green)]" />
            Δεν υπάρχουν εκκρεμείς παραγγελίες
          </span>
        </p>
      ) : (
        orders.map((order) => {
          const customerType = getCustomerType(order.customers);
          const stats = getOrderLineStats(order);
          return (
            <article
              key={order.id}
              className={cn(cardPremium, "relative overflow-hidden p-4 pl-5")}
            >
              <span
                className={cn(
                  "absolute bottom-3 left-0 top-3 w-1.5 rounded-full",
                  priorityBarClass(order.priority),
                )}
                aria-hidden
              />
              <div className="flex flex-wrap items-start justify-between gap-2 pl-2">
                <p className="text-lg font-bold text-[var(--text)]">
                  {order.order_number}
                </p>
              </div>
              <p className="mt-1 pl-2 text-sm text-[var(--text-muted)]">
                {getCustomerName(order.customers)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 pl-2 text-sm text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1">
                  <Package className="size-5 text-white" strokeWidth={2} />
                  {stats.totalQty}
                </span>
                <span className="text-[var(--text-dim)]">|</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    getCustomerTypeBadgeClass(customerType),
                  )}
                >
                  {getCustomerTypeLabel(customerType)}
                </span>
                <span className="ml-auto text-[var(--text-dim)]">
                  {formatRelativeTimeEl(order.created_at)}
                </span>
              </div>
              <button
                type="button"
                disabled={startingId === order.id}
                onClick={() => void startPicking(order.id)}
                className="btn-orange-gradient mt-4 min-h-14 w-full rounded-xl text-lg font-bold text-white disabled:opacity-60"
              >
                {startingId === order.id ? "Έναρξη…" : "ΕΝΑΡΞΗ PICKING"}
              </button>
            </article>
          );
        })
      )}
    </section>
  );
}
