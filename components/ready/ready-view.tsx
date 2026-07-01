"use client";

import { useCallback, useEffect, useState } from "react";

import { Spinner } from "@/components/ui/spinner";
import { ErrorCard } from "@/components/ui/error-card";
import { OrderStatus } from "@/lib/orders/constants";
import { formatRelativeTimeEl } from "@/lib/format/relative-time";
import { createClient } from "@/lib/supabase/client";
import { cardPremium } from "@/lib/ui/styles";
import { getCustomerName, type OrderListRow } from "@/types/orders";
import { cn } from "@/lib/utils";

export function ReadyView() {
  const [orders, setOrders] = useState<OrderListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("orders")
      .select("*, customers(name)")
      .eq("status", OrderStatus.ReadyForShipment)
      .order("updated_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setOrders((data as OrderListRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <section className="flex min-h-[50dvh] items-center justify-center">
        <Spinner />
      </section>
    );
  }

  if (error) {
    return <ErrorCard message={error} onRetry={() => void load()} />;
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-[var(--text)]">Έτοιμες για αποστολή</h1>

      {orders.length === 0 ? (
        <p
          className={cn(
            cardPremium,
            "p-8 text-center text-lg text-[var(--text-muted)]",
          )}
        >
          Καμία παραγγελία σε αναμονή οδηγού
        </p>
      ) : (
        orders.map((order) => (
          <article
            key={order.id}
            className={cn(cardPremium, "relative overflow-hidden p-4 pl-5")}
          >
            <span
              className="absolute bottom-3 left-0 top-3 w-1.5 rounded-full bg-[var(--green)]"
              aria-hidden
            />
            <div className="flex items-start justify-between gap-2 pl-2">
              <div>
                <p className="text-lg font-bold text-[var(--text)]">
                  {order.order_number}
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {getCustomerName(order.customers)}
                </p>
                <p className="mt-2 text-sm text-[var(--text-dim)]">
                  {formatRelativeTimeEl(order.updated_at)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[var(--green)]/10 px-3 py-1 text-sm font-medium text-[var(--green)]">
                Αναμένει οδηγό
              </span>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
