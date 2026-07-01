"use client";

import { ChevronDown } from "lucide-react";

import { VariantAdjustRow } from "@/components/inventory/variant-adjust-row";
import {
  getStockBarPercent,
  getStockColorClass,
  getStockLevel,
} from "@/lib/products/stock";
import { cardPremium } from "@/lib/ui/styles";
import {
  getActiveVariants,
  getTotalVariantStock,
  productUsesVariantStock,
  type InventoryProductRow,
} from "@/types/products";
import { cn } from "@/lib/utils";

type InventoryProductCardProps = {
  product: InventoryProductRow;
  expanded: boolean;
  isSelected: boolean;
  applyingVariantId: string | null;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onVariantAdjust: (variantId: string, delta: number) => void;
};

export function InventoryProductCard({
  product,
  expanded,
  isSelected,
  applyingVariantId,
  onToggleExpand,
  onToggleSelect,
  onVariantAdjust,
}: InventoryProductCardProps) {
  const variants = getActiveVariants(product);
  const hasVariants = productUsesVariantStock(product);
  const totalStock = getTotalVariantStock(product);
  const level = getStockLevel({ stock: totalStock, min_stock: product.min_stock });
  const barPct = getStockBarPercent({
    stock: totalStock,
    min_stock: product.min_stock,
  });

  return (
    <article
      className={cn(
        cardPremium,
        "relative overflow-hidden transition-all duration-200",
        isSelected && "ring-2 ring-[var(--orange)]/50",
        expanded && "bg-[var(--surface-2)]",
      )}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="absolute left-3 top-4 z-10 size-5 accent-[var(--orange)]"
        onClick={(e) => e.stopPropagation()}
      />

      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-center gap-3 p-4 pl-10 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-[var(--text)]">{product.name}</p>
          <p className="font-mono text-xs text-[var(--text-dim)]">
            SKU: {product.sku}
          </p>
          {hasVariants ? (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {variants.length} χρώματα
            </p>
          ) : null}
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-3)]">
            <span
              className={cn(
                "block h-full rounded-full transition-all duration-300",
                level === "good" && "bg-[var(--green)]",
                level === "low" && "bg-[var(--orange)]",
                level === "critical" && "bg-[var(--red)]",
              )}
              style={{ width: `${barPct}%` }}
            />
          </div>
        </div>
        <p
          className={cn(
            "shrink-0 text-[48px] font-bold leading-none",
            getStockColorClass(level),
          )}
        >
          {totalStock}
        </p>
        <ChevronDown
          className={cn(
            "size-6 shrink-0 text-[var(--text-muted)] transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded ? (
        <div className="border-t border-[var(--border)] px-4 pb-4 pl-10">
          {hasVariants ? (
            variants.map((variant) => (
              <VariantAdjustRow
                key={variant.id}
                variant={variant}
                applying={applyingVariantId === variant.id}
                onApply={(delta) => onVariantAdjust(variant.id, delta)}
              />
            ))
          ) : (
            <p className="py-4 text-base text-[var(--text-muted)]">
              Δεν υπάρχουν ενεργά χρώματα — χρησιμοποιείται συνολικό απόθεμα (
              {product.stock}).
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}
