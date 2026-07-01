import type { OrderListRow } from "@/types/orders";

export type ScheduleOrderRow = OrderListRow & {
  picking_date: string | null;
  delivery_date: string | null;
};
