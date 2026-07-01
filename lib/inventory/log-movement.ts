import type { SupabaseClient } from "@supabase/supabase-js";

export type InventoryMovementType = "in" | "out" | "adjustment";

export async function logInventoryMovement(
  supabase: SupabaseClient,
  input: {
    product_id: string;
    type: InventoryMovementType;
    quantity: number;
    reason?: string | null;
    order_id?: string | null;
  },
) {
  const quantity = Math.abs(Math.round(input.quantity));
  if (quantity <= 0) return { error: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("inventory_movements").insert({
    product_id: input.product_id,
    type: input.type,
    quantity,
    reason: input.reason?.trim() || "Προσαρμογή αποθήκης",
    order_id: input.order_id ?? null,
    created_by: user?.id ?? null,
  });

  return { error };
}
