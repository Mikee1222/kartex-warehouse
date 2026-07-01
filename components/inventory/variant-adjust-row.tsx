"use client";

import { Check, Minus, Plus } from "lucide-react";
import { useState } from "react";

import { ColorCircle } from "@/components/ui/color-circle";
import {
  getStockColorClass,
  getStockLevel,
  type StockLevel,
} from "@/lib/products/stock";
import { getVariantColorName, getVariantHex } from "@/lib/products/color-variants";
import type { ProductColorVariantRow } from "@/types/products";
import { cn } from "@/lib/utils";

type VariantAdjustRowProps = {
  variant: ProductColorVariantRow;
  onApply: (delta: number) => void;
  applying?: boolean;
};

export function VariantAdjustRow({
  variant,
  onApply,
  applying = false,
}: VariantAdjustRowProps) {
  const [draft, setDraft] = useState(1);
  const [sign, setSign] = useState<1 | -1>(1);
  const colorName = getVariantColorName(variant);
  const hex = getVariantHex(variant);
  const level: StockLevel = getStockLevel({
    stock: variant.stock,
    min_stock: 0,
  });
  const stockClass =
    variant.stock <= 0
      ? "text-[var(--red)]"
      : variant.stock <= 5
        ? "text-[var(--orange)]"
        : getStockColorClass(level);

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--border)] py-4 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-3">
        <ColorCircle hex={hex} size={32} title={colorName} />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-[var(--text)]">{colorName}</p>
        </div>
        <p className={cn("text-[48px] font-bold leading-none", stockClass)}>
          {variant.stock}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={applying}
          onClick={() => setSign(-1)}
          className={cn(
            "flex min-h-16 min-w-16 items-center justify-center rounded-xl text-2xl font-bold transition-all duration-200",
            sign === -1
              ? "bg-[var(--red)]/20 text-[var(--red)] ring-2 ring-[var(--red)]/40"
              : "bg-[var(--surface-3)] text-[var(--text)] hover:bg-[var(--surface-2)]",
          )}
          aria-label="Αφαίρεση"
        >
          <Minus className="size-7" strokeWidth={2.5} />
        </button>
        <input
          type="number"
          min={1}
          max={999}
          value={draft}
          onChange={(e) =>
            setDraft(Math.max(1, Math.min(999, Number(e.target.value) || 1)))
          }
          className="min-h-16 w-20 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-center text-[48px] font-bold leading-none text-[var(--text)]"
        />
        <button
          type="button"
          disabled={applying}
          onClick={() => setSign(1)}
          className={cn(
            "flex min-h-16 min-w-16 items-center justify-center rounded-xl text-2xl font-bold text-white transition-all duration-200",
            sign === 1
              ? "bg-[var(--orange)] shadow-[0_4px_16px_var(--orange-glow)]"
              : "bg-[var(--surface-3)] text-[var(--text)] hover:bg-[var(--surface-2)]",
          )}
          aria-label="Προσθήκη"
        >
          <Plus className="size-7" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          disabled={applying || (sign === -1 && variant.stock <= 0)}
          onClick={() => {
            onApply(draft * sign);
            setDraft(1);
            setSign(1);
          }}
          className="flex min-h-16 min-w-16 items-center justify-center rounded-xl bg-[var(--green)] text-white transition-all duration-200 hover:brightness-110 disabled:opacity-40"
          aria-label="Επιβεβαίωση"
        >
          <Check className="size-7" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
