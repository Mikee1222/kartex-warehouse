export type CustomerJoin = {
  name: string;
  type?: string;
};

export type OrderListRow = {
  id: string;
  order_number: string;
  status: string;
  priority: string | null;
  created_at: string;
  updated_at: string;
  customers: CustomerJoin | CustomerJoin[] | null;
  order_items: { count: number }[] | { id: string }[];
};

export type ProductColorJoin = {
  id: string;
  name: string;
  hex_code: string;
};

export type ProductJoin = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  stock: number;
  min_stock: number;
  category: string | null;
  notes: string | null;
};

export type OrderItemQty = {
  quantity: number;
};

export type OrderItemRow = {
  id: string;
  product_id: string | null;
  quantity: number;
  picked_at?: string | null;
  picked_by?: string | null;
  color_id?: string | null;
  product_colors?: ProductColorJoin | ProductColorJoin[] | null;
  products: ProductJoin | ProductJoin[] | null;
};

export type OrderPickRow = {
  id: string;
  order_number: string;
  status: string;
  customers: CustomerJoin | CustomerJoin[] | null;
  order_items: OrderItemRow[];
};

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  stock: number;
  min_stock: number;
  category: string | null;
  notes: string | null;
};

export function getCustomerName(
  customers: CustomerJoin | CustomerJoin[] | null,
): string {
  if (!customers) return "—";
  if (Array.isArray(customers)) return customers[0]?.name ?? "—";
  return customers.name;
}

export function getProduct(
  products: ProductJoin | ProductJoin[] | null,
): ProductJoin | null {
  if (!products) return null;
  return Array.isArray(products) ? (products[0] ?? null) : products;
}

export function getItemCount(order: OrderListRow): number {
  const items = order.order_items;
  if (!items?.length) return 0;
  const first = items[0];
  if ("count" in first && typeof first.count === "number") return first.count;
  return items.length;
}

export function getOrderLineStats(order: OrderListRow): {
  lines: number;
  totalQty: number;
} {
  const items = order.order_items ?? [];
  if (!items.length) return { lines: 0, totalQty: 0 };
  const first = items[0];
  if ("count" in first && typeof first.count === "number") {
    return { lines: first.count, totalQty: first.count };
  }
  const rows = items as unknown as OrderItemQty[];
  return {
    lines: rows.length,
    totalQty: rows.reduce((sum, row) => sum + (row.quantity ?? 0), 0),
  };
}

export function getOrderItemColor(
  item: Pick<OrderItemRow, "product_colors">,
): ProductColorJoin | null {
  const colors = item.product_colors;
  if (!colors) return null;
  return Array.isArray(colors) ? (colors[0] ?? null) : colors;
}

export function getShelfLocation(product: ProductJoin | null): string | null {
  if (!product) return null;
  const notes = product.notes?.trim();
  if (notes) {
    const shelfMatch = notes.match(/ράφι[:\s]+([^\n,]+)/i);
    if (shelfMatch) return shelfMatch[1].trim();
    if (notes.length <= 24) return notes;
  }
  const category = product.category?.trim();
  if (category && /^[A-Za-z]-\d+/i.test(category)) return category;
  return null;
}
