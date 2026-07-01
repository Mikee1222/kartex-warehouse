"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AnimatedCounter } from "@/components/ui/animated-counter";
import { PageToolbar } from "@/components/ui/page-toolbar";
import { Spinner } from "@/components/ui/spinner";
import { ErrorCard } from "@/components/ui/error-card";
import { useAutoRefresh } from "@/lib/hooks/use-auto-refresh";
import { OrderStatus } from "@/lib/orders/constants";
import { createClient } from "@/lib/supabase/client";
import { cardPremium } from "@/lib/ui/styles";
import { cn } from "@/lib/utils";

type Counts = {
  pending: number;
  inProgress: number;
  ready: number;
};

export function DashboardView() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();

    const [pending, inProgress, ready] = await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", OrderStatus.Confirmed),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", OrderStatus.Processing),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", OrderStatus.ReadyForShipment),
    ]);

    if (pending.error || inProgress.error || ready.error) {
      setError("Αποτυχία φόρτωσης στατιστικών.");
      setInitialLoading(false);
      return;
    }

    setError(null);
    setCounts({
      pending: pending.count ?? 0,
      inProgress: inProgress.count ?? 0,
      ready: ready.count ?? 0,
    });
    setInitialLoading(false);
  }, []);

  const { lastUpdatedLabel, refreshing, refresh } = useAutoRefresh(load);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("warehouse-dashboard-orders")
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

  if (initialLoading && !counts) {
    return (
      <section className="flex min-h-[50dvh] items-center justify-center">
        <Spinner />
      </section>
    );
  }

  if (error || !counts) {
    return (
      <ErrorCard
        message={error ?? "Άγνωστο σφάλμα"}
        onRetry={() => void refresh()}
      />
    );
  }

  const cards = [
    {
      href: "/orders",
      count: counts.pending,
      label: "παραγγελίες περιμένουν picking",
      title: "Εκκρεμείς",
      glow: "glow-bar-gold",
      color: "text-[var(--gold)]",
      hoverGlow: "hover:shadow-[inset_8px_0_32px_-4px_var(--gold-glow)]",
    },
    {
      href: "/orders",
      count: counts.inProgress,
      label: "παραγγελίες σε εξέλιξη",
      title: "Σε Εξέλιξη",
      glow: "glow-bar-blue",
      color: "text-[var(--blue)]",
      hoverGlow: "hover:shadow-[inset_8px_0_32px_-4px_rgba(59,130,246,0.25)]",
    },
    {
      href: "/ready",
      count: counts.ready,
      label: "έτοιμες για αποστολή",
      title: "Έτοιμες",
      glow: "glow-bar-green",
      color: "text-[var(--green)]",
      hoverGlow: "hover:shadow-[inset_8px_0_32px_-4px_rgba(0,214,143,0.25)]",
    },
  ] as const;

  return (
    <section className="flex flex-col gap-4">
      <PageToolbar
        title="Πίνακας ελέγχου"
        lastUpdatedLabel={lastUpdatedLabel}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
      />
      {cards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className={cn(
            cardPremium,
            "block p-5 pl-6 transition-all duration-200 active:scale-[0.99]",
            card.glow,
            card.hoverGlow,
            "hover:bg-[var(--surface-2)] hover:border-[var(--border-hover)]",
          )}
        >
          <p className="text-base text-[var(--text-muted)]">{card.title}</p>
          <AnimatedCounter
            value={card.count}
            className={cn("mt-2 block text-[72px] font-bold leading-none", card.color)}
          />
          <p className="mt-2 text-base text-[var(--text-muted)]">{card.label}</p>
          <p className="mt-1 text-sm text-[var(--text-dim)]">
            τελευταία ενημέρωση {lastUpdatedLabel}
          </p>
        </Link>
      ))}
    </section>
  );
}
