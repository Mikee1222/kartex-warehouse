import type { SupabaseClient } from "@supabase/supabase-js";

import {
  findVariantForOrderItem,
  syncProductStockFromVariants,
  updateVariantStock,
} from "@/lib/products/color-variants";
import { logInventoryMovement } from "@/lib/inventory/log-movement";
import { markOrderItemPicked } from "@/lib/orders/mark-item-picked";

export async function confirmPickItem(
  supabase: SupabaseClient,
  input: {
    orderItemId: string;
    productId: string;
    colorId: string | null | undefined;
    quantity: number;
    orderId: string;
  },
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Δεν βρέθηκε συνδεδεμένος χρήστης" };
  }

  const { error } = await supabase.rpc("confirm_pick_item", {
    p_order_item_id: input.orderItemId,
    p_product_id: input.productId,
    p_color_id: input.colorId ?? null,
    p_quantity: Math.max(1, Math.round(input.quantity)),
    p_order_id: input.orderId,
    p_picked_by: user.id,
  });

  if (!error) {
    return { error: null };
  }

  const message = error.message ?? "";
  if (!/confirm_pick_item|PGRST202|42883/i.test(message)) {
    return { error: message };
  }

  const pickInput = {
    productId: input.productId,
    colorId: input.colorId,
    quantity: input.quantity,
    orderId: input.orderId,
  };

  const { error: stockError } = await deductStockForPickedItem(
    supabase,
    pickInput,
  );
  if (stockError) {
    return { error: stockError };
  }

  const { error: pickError, alreadyPicked } = await markOrderItemPicked(
    supabase,
    input.orderItemId,
    user.id,
  );

  if (pickError) {
    await restoreStockForPickedItem(supabase, pickInput);
    return { error: pickError };
  }

  if (alreadyPicked) {
    await restoreStockForPickedItem(supabase, pickInput);
    return { error: null };
  }

  return { error: null };
}

export async function deductStockForPickedItem(
  supabase: SupabaseClient,
  input: {
    productId: string;
    colorId: string | null | undefined;
    quantity: number;
    orderId?: string;
  },
): Promise<{ error: string | null }> {
  const qty = Math.max(1, Math.round(input.quantity));
  const variant = await findVariantForOrderItem(
    supabase,
    input.productId,
    input.colorId,
  );

  if (variant) {
    const newStock = Math.max(0, (variant.stock ?? 0) - qty);
    const { error } = await updateVariantStock(
      supabase,
      variant.id,
      input.productId,
      newStock,
    );
    if (error) return { error };

    await logInventoryMovement(supabase, {
      product_id: input.productId,
      type: "out",
      quantity: qty,
      reason: "Picking παραγγελίας",
      order_id: input.orderId ?? null,
    });

    return { error: null };
  }

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("stock")
    .eq("id", input.productId)
    .single();

  if (fetchError || !product) {
    return { error: fetchError?.message ?? "Προϊόν δεν βρέθηκε" };
  }

  const newStock = Math.max(0, (product.stock ?? 0) - qty);
  const { error: updateError } = await supabase
    .from("products")
    .update({ stock: newStock })
    .eq("id", input.productId);

  if (updateError) {
    return { error: updateError.message };
  }

  await logInventoryMovement(supabase, {
    product_id: input.productId,
    type: "out",
    quantity: qty,
    reason: "Picking παραγγελίας",
    order_id: input.orderId ?? null,
  });

  return { error: null };
}

/** Reverses deductStockForPickedItem when order_items pick mark fails after stock write. */
export async function restoreStockForPickedItem(
  supabase: SupabaseClient,
  input: {
    productId: string;
    colorId: string | null | undefined;
    quantity: number;
    orderId?: string;
  },
): Promise<{ error: string | null }> {
  const qty = Math.max(1, Math.round(input.quantity));
  const variant = await findVariantForOrderItem(
    supabase,
    input.productId,
    input.colorId,
  );

  if (variant) {
    const newStock = (variant.stock ?? 0) + qty;
    const { error } = await updateVariantStock(
      supabase,
      variant.id,
      input.productId,
      newStock,
    );
    if (error) return { error };

    await logInventoryMovement(supabase, {
      product_id: input.productId,
      type: "in",
      quantity: qty,
      reason: "Αναίρεση picking (αποτυχία καταχώρησης)",
      order_id: input.orderId ?? null,
    });

    return { error: null };
  }

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("stock")
    .eq("id", input.productId)
    .single();

  if (fetchError || !product) {
    return { error: fetchError?.message ?? "Προϊόν δεν βρέθηκε" };
  }

  const newStock = (product.stock ?? 0) + qty;
  const { error: updateError } = await supabase
    .from("products")
    .update({ stock: newStock })
    .eq("id", input.productId);

  if (updateError) {
    return { error: updateError.message };
  }

  await logInventoryMovement(supabase, {
    product_id: input.productId,
    type: "in",
    quantity: qty,
    reason: "Αναίρεση picking (αποτυχία καταχώρησης)",
    order_id: input.orderId ?? null,
  });

  return { error: null };
}
