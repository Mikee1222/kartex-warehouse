import { InventoryView } from "@/components/inventory/inventory-view";
import { INVENTORY_PRODUCTS_SELECT } from "@/lib/products/color-variants";
import { createClient } from "@/lib/supabase/server";
import type { InventoryProductRow } from "@/types/products";

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(INVENTORY_PRODUCTS_SELECT)
    .order("name");

  return (
    <InventoryView
      initialProducts={(data as InventoryProductRow[]) ?? []}
      initialError={error?.message ?? null}
    />
  );
}
