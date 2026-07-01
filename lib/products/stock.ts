import type { ProductRow } from "@/types/orders";

export type StockLevel = "good" | "low" | "critical";

export function getStockLevel(product: Pick<ProductRow, "stock" | "min_stock">): StockLevel {
  if (product.stock <= product.min_stock) return "critical";
  if (product.stock > product.min_stock * 2) return "good";
  return "low";
}

export function getStockColorClass(level: StockLevel): string {
  switch (level) {
    case "good":
      return "text-kartex-success";
    case "low":
      return "text-kartex-warning";
    case "critical":
      return "text-kartex-danger";
  }
}

export function getStockBarPercent(product: Pick<ProductRow, "stock" | "min_stock">): number {
  const target = Math.max(product.min_stock * 2, 1);
  return Math.min(100, Math.round((product.stock / target) * 100));
}

export function isLowStock(product: Pick<ProductRow, "stock" | "min_stock">): boolean {
  return product.stock <= product.min_stock;
}
