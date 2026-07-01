import type { SupabaseClient } from "@supabase/supabase-js";

import { OrderStatus } from "@/lib/orders/constants";
import type { ScheduleOrderRow } from "@/types/schedule";

const SCHEDULE_STATUSES = [OrderStatus.Confirmed, OrderStatus.Processing];

const SCHEDULE_SELECT =
  "id, order_number, status, priority, created_at, updated_at, picking_date, delivery_date, customers(name, type), order_items(quantity)";

export async function fetchScheduleOrders(
  supabase: SupabaseClient,
  options: {
    pickingDateEq?: string;
    pickingDateGte?: string;
    pickingDateLte?: string;
  },
): Promise<{ orders: ScheduleOrderRow[]; error: string | null }> {
  let query = supabase
    .from("orders")
    .select(SCHEDULE_SELECT)
    .in("status", SCHEDULE_STATUSES)
    .not("picking_date", "is", null);

  if (options.pickingDateEq) {
    query = query.eq("picking_date", options.pickingDateEq);
  }
  if (options.pickingDateGte) {
    query = query.gte("picking_date", options.pickingDateGte);
  }
  if (options.pickingDateLte) {
    query = query.lte("picking_date", options.pickingDateLte);
  }

  const { data, error } = await query.order("picking_date", { ascending: true });

  if (error) {
    return { orders: [], error: error.message };
  }

  return { orders: (data as unknown as ScheduleOrderRow[]) ?? [], error: null };
}

export async function fetchUpcomingPickings(
  supabase: SupabaseClient,
  fromDate: string,
  toDate: string,
): Promise<{ orders: ScheduleOrderRow[]; error: string | null }> {
  return fetchScheduleOrders(supabase, {
    pickingDateGte: fromDate,
    pickingDateLte: toDate,
  });
}
