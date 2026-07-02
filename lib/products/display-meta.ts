import type { ProductJoin, ProductMasterJoin } from "@/types/orders";

export type ProductDisplayMeta = {
  displayName: string;
  category: string;
  imageUrl: string | null;
  variantName: string;
};

function pickMasterJoin(
  value: ProductMasterJoin | ProductMasterJoin[] | null | undefined,
): ProductMasterJoin | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeCategory(category: string | null | undefined): string {
  const trimmed = category?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Γενικά";
}

export function resolveProductDisplayMeta(
  product: ProductJoin | null,
): ProductDisplayMeta {
  if (!product) {
    return {
      displayName: "—",
      category: "Γενικά",
      imageUrl: null,
      variantName: "—",
    };
  }

  const master = pickMasterJoin(product.product_masters);
  const masterCleanName = master?.clean_name?.trim();
  const variantCleanName = product.clean_name?.trim();
  const displayName =
    product.master_id && masterCleanName
      ? masterCleanName
      : variantCleanName || product.name;

  const category = normalizeCategory(
    product.master_id && master?.category
      ? master.category
      : product.category,
  );

  const imageUrl = master?.image_url?.trim() || null;

  return {
    displayName,
    category,
    imageUrl,
    variantName: product.name,
  };
}
