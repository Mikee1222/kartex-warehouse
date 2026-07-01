export type ProductColorJoin = {
  id: string;
  name: string;
  hex_code: string;
};

export type ProductColorVariantRow = {
  id: string;
  stock: number;
  is_active: boolean;
  is_primary?: boolean | null;
  color_id?: string;
  product_colors: ProductColorJoin | ProductColorJoin[] | null;
};

export type InventoryProductRow = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  stock: number;
  min_stock: number;
  category: string | null;
  notes: string | null;
  product_color_variants?: ProductColorVariantRow[] | null;
};

export function pickColorJoin(
  value: ProductColorJoin | ProductColorJoin[] | null | undefined,
): ProductColorJoin | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function getActiveVariants(product: InventoryProductRow): ProductColorVariantRow[] {
  return (product.product_color_variants ?? []).filter((v) => v.is_active);
}

export function getTotalVariantStock(product: InventoryProductRow): number {
  const variants = getActiveVariants(product);
  if (variants.length === 0) return product.stock ?? 0;
  return variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
}

export function productUsesVariantStock(product: InventoryProductRow): boolean {
  return getActiveVariants(product).length > 0;
}
