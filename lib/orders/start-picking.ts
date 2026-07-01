import type { SupabaseClient } from "@supabase/supabase-js";

import { OrderStatus } from "@/lib/orders/constants";

/** Marks order as in picking — visible to Office in real time. */
export async function startOrderPicking(
  supabase: SupabaseClient,
  orderId: string,
) {
  return supabase
    .from("orders")
    .update({ status: OrderStatus.Processing })
    .eq("id", orderId);
}
