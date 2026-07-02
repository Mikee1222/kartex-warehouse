import type { OrderItemRow } from "@/types/orders";

const PICK_PRODUCT_SELECT = `
  id,
  name,
  clean_name,
  sku,
  barcode,
  stock,
  min_stock,
  category,
  notes,
  master_id,
  product_masters(clean_name, category, image_url)
`;

/** Supabase select for warehouse picking (includes line color when migration 020 applied). */
export const PICK_ORDER_SELECT = `
  id,
  order_number,
  status,
  customers(name),
  order_items(
    id,
    product_id,
    quantity,
    picked_at,
    picked_by,
    color_id,
    product_colors(id, name, hex_code),
    products(${PICK_PRODUCT_SELECT})
  )
`;

export const PICK_ORDER_SELECT_FALLBACK = `
  id,
  order_number,
  status,
  customers(name),
  order_items(
    id,
    product_id,
    quantity,
    picked_at,
    picked_by,
    products(${PICK_PRODUCT_SELECT})
  )
`;

/** When migration 036 (picked_at) is not yet applied. */
export const PICK_ORDER_SELECT_NO_PICKED = `
  id,
  order_number,
  status,
  customers(name),
  order_items(
    id,
    product_id,
    quantity,
    color_id,
    product_colors(id, name, hex_code),
    products(${PICK_PRODUCT_SELECT})
  )
`;

export const PICK_ORDER_SELECT_LEGACY = `
  id,
  order_number,
  status,
  customers(name),
  order_items(
    id,
    product_id,
    quantity,
    products(${PICK_PRODUCT_SELECT})
  )
`;

export function derivePickProgress(items: OrderItemRow[]): {
  confirmed: Set<string>;
  currentIndex: number;
} {
  const confirmed = new Set(
    items.filter((item) => item.picked_at).map((item) => item.id),
  );
  const firstUnpicked = items.findIndex((item) => !item.picked_at);
  const currentIndex = firstUnpicked === -1 ? items.length : firstUnpicked;

  return { confirmed, currentIndex };
}
