import type { SupabaseClient } from "@supabase/supabase-js";

import { pickColorJoin, type ProductColorVariantRow } from "@/types/products";

export const INVENTORY_PRODUCTS_SELECT = `
  *,
  product_masters ( clean_name, category, image_url ),
  product_color_variants (
    id,
    stock,
    is_active,
    color_id,
    product_colors ( id, name, hex_code )
  )
`;

export async function syncProductStockFromVariants(
  supabase: SupabaseClient,
  productId: string,
): Promise<{ totalStock: number; error: string | null }> {
  const { data, error } = await supabase
    .from("product_color_variants")
    .select("stock")
    .eq("product_id", productId)
    .eq("is_active", true);

  if (error) {
    return { totalStock: 0, error: error.message };
  }

  const totalStock =
    (data ?? []).reduce((sum, row) => sum + (row.stock ?? 0), 0) ?? 0;

  const { error: updateError } = await supabase
    .from("products")
    .update({ stock: totalStock })
    .eq("id", productId);

  if (updateError) {
    return { totalStock: 0, error: updateError.message };
  }

  return { totalStock, error: null };
}

export async function updateVariantStock(
  supabase: SupabaseClient,
  variantId: string,
  productId: string,
  stock: number,
): Promise<{ error: string | null; totalStock?: number }> {
  const { error } = await supabase
    .from("product_color_variants")
    .update({ stock: Math.max(0, Math.round(stock)) })
    .eq("id", variantId);

  if (error) {
    return { error: error.message };
  }

  const { totalStock, error: syncError } = await syncProductStockFromVariants(
    supabase,
    productId,
  );

  if (syncError) {
    return { error: syncError };
  }

  return { error: null, totalStock };
}

export async function findVariantForOrderItem(
  supabase: SupabaseClient,
  productId: string,
  colorId: string | null | undefined,
): Promise<ProductColorVariantRow | null> {
  const { data, error } = await supabase
    .from("product_color_variants")
    .select(
      `
      id,
      stock,
      is_active,
      color_id,
      product_colors ( id, name, hex_code )
    `,
    )
    .eq("product_id", productId)
    .eq("is_active", true);

  if (error || !data?.length) {
    return null;
  }

  const variants = data as ProductColorVariantRow[];

  if (colorId) {
    const match = variants.find((v) => v.color_id === colorId);
    if (match) return match;
  }

  return variants[0] ?? null;
}

export function getVariantColorName(variant: ProductColorVariantRow): string {
  return pickColorJoin(variant.product_colors)?.name ?? "—";
}

export function getVariantHex(variant: ProductColorVariantRow): string {
  return pickColorJoin(variant.product_colors)?.hex_code ?? "#888888";
}
