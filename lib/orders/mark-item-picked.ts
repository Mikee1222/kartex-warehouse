import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Client-side pick mark when confirm_pick_item RPC is unavailable (pre-migration).
 */
export async function markOrderItemPicked(
  supabase: SupabaseClient,
  orderItemId: string,
  userId: string | null,
): Promise<{ error: string | null; alreadyPicked: boolean }> {
  const { data, error } = await supabase
    .from("order_items")
    .update({
      picked_at: new Date().toISOString(),
      picked_by: userId,
    })
    .eq("id", orderItemId)
    .is("picked_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message, alreadyPicked: false };
  }

  if (!data) {
    return { error: null, alreadyPicked: true };
  }

  return { error: null, alreadyPicked: false };
}

/** Clears pick marker when stock deduction succeeded but marking failed. */
export async function clearOrderItemPicked(
  supabase: SupabaseClient,
  orderItemId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("order_items")
    .update({ picked_at: null, picked_by: null })
    .eq("id", orderItemId);

  return { error: error?.message ?? null };
}
