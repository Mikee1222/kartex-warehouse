"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { isLowStock } from "@/lib/products/stock";
import type { ProductRow } from "@/types/orders";
import { cn } from "@/lib/utils";

export function LowStockBell() {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("id, name, sku, stock, min_stock, barcode, category, notes")
      .order("stock", { ascending: true });

    const low = ((data as ProductRow[]) ?? []).filter(isLowStock).slice(0, 12);
    setItems(low);
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const count = items.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex min-h-10 min-w-10 items-center justify-center rounded-xl",
          "border border-[var(--border)] bg-[var(--surface)] transition-all duration-200",
          open && "glow-orange",
        )}
        aria-label="Ειδοποιήσεις χαμηλού αποθέματος"
      >
        <Bell className="size-5 text-[var(--orange)]" />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--orange)] text-[10px] font-bold text-white shadow-[0_0_8px_var(--orange-glow)]">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg shadow-black/40">
          <p className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text)]">
            Χαμηλό απόθεμα ({count})
          </p>
          {count === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-white/50">
              Όλα τα προϊόντα είναι εντάξει
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {items.map((p) => (
                <li key={p.id}>
                  <Link
                    href="/inventory"
                    onClick={() => setOpen(false)}
                    className="block border-b border-white/5 px-4 py-3 transition-colors hover:bg-kartex-card-hover"
                  >
                    <p className="truncate text-sm font-medium text-white">
                      {p.name}
                    </p>
                    <p className="text-xs text-kartex-danger">
                      {p.stock} / ελάχ. {p.min_stock}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/inventory"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-sm font-medium text-kartex-orange"
          >
            Προβολή αποθέματος →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
