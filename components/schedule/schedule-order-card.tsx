"use client";

import { Package } from "lucide-react";

import {
  getCustomerTypeBadgeClass,
  getCustomerTypeLabel,
} from "@/lib/customers/labels";
import {
  getTodayISO,
  isSameDayISO,
} from "@/lib/format/dates";
import { OrderStatus, Priority } from "@/lib/orders/constants";
import { cardPremium } from "@/lib/ui/styles";
import {
  getCustomerName,
  getOrderLineStats,
  type CustomerJoin,
} from "@/types/orders";
import type { ScheduleOrderRow } from "@/types/schedule";
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

type ScheduleOrderCardProps = {
  order: ScheduleOrderRow;
  startingId: string | null;
  onStartPicking: (orderId: string) => void;
  daysRemainingLabel?: string;
};

export function ScheduleOrderCard({
  order,
  startingId,
  onStartPicking,
  daysRemainingLabel,
}: ScheduleOrderCardProps) {
  const customerType = getCustomerType(order.customers);
  const stats = getOrderLineStats(order);
  const today = getTodayISO();
  const isUrgent = isSameDayISO(order.delivery_date, today);
  const canStart = order.status === OrderStatus.Confirmed;

  return (
    <article className={cn(cardPremium, "relative overflow-hidden p-4 pl-5")}>
      <span
        className={cn(
          "absolute bottom-3 left-0 top-3 w-1.5 rounded-full",
          priorityBarClass(order.priority),
        )}
        aria-hidden
      />
      <div className="flex flex-wrap items-start justify-between gap-2 pl-2">
        <p className="text-lg font-bold text-[var(--text)]">{order.order_number}</p>
        <div className="flex flex-wrap gap-2">
          {isUrgent ? (
            <span className="rounded-full bg-[var(--red)]/15 px-2.5 py-1 text-xs font-bold uppercase text-[var(--red)]">
              Επείγον
            </span>
          ) : null}
          {daysRemainingLabel ? (
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--text)]">
              {daysRemainingLabel}
            </span>
          ) : null}
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              getCustomerTypeBadgeClass(customerType),
            )}
          >
            {getCustomerTypeLabel(customerType)}
          </span>
        </div>
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
      </div>
      {canStart ? (
        <button
          type="button"
          disabled={startingId === order.id}
          onClick={() => onStartPicking(order.id)}
          className="btn-orange-gradient mt-4 min-h-14 w-full rounded-xl text-lg font-bold text-white disabled:opacity-60"
        >
          {startingId === order.id ? "Έναρξη…" : "ΕΝΑΡΞΗ PICKING"}
        </button>
      ) : (
        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
          Σε εξέλιξη picking
        </p>
      )}
    </article>
  );
}
