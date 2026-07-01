import { OrderStatus } from "@/lib/orders/constants";

export type RealtimeOrderRow = {
  status?: string;
  order_number?: string;
};

export function isConfirmedOrder(row: RealtimeOrderRow | undefined): boolean {
  return row?.status === OrderStatus.Confirmed;
}

export function becameConfirmed(
  oldRow: RealtimeOrderRow | undefined,
  newRow: RealtimeOrderRow | undefined,
): boolean {
  return isConfirmedOrder(newRow) && !isConfirmedOrder(oldRow);
}

export function vibrateNewOrderAlert() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(500);
  }
}
