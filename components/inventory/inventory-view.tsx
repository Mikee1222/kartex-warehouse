"use client";

import { Barcode, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AddProductModal } from "@/components/inventory/add-product-modal";
import { InventoryProductCard } from "@/components/inventory/inventory-product-card";
import { BarcodeScanner } from "@/components/pick/barcode-scanner";
import { Spinner } from "@/components/ui/spinner";
import { ErrorCard } from "@/components/ui/error-card";
import { logInventoryMovement } from "@/lib/inventory/log-movement";
import {
  INVENTORY_PRODUCTS_SELECT,
  updateVariantStock,
} from "@/lib/products/color-variants";
import { createClient } from "@/lib/supabase/client";
import { inputPremium } from "@/lib/ui/styles";
import {
  getActiveVariants,
  getTotalVariantStock,
  pickColorJoin,
  type InventoryProductRow,
} from "@/types/products";
import { cn } from "@/lib/utils";

function vibrateSuccess() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(200);
  }
}

type InventoryViewProps = {
  initialProducts?: InventoryProductRow[];
  initialError?: string | null;
};

export function InventoryView({
  initialProducts = [],
  initialError = null,
}: InventoryViewProps) {
  const [products, setProducts] = useState<InventoryProductRow[]>(initialProducts);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(!initialProducts.length && !initialError);
  const [error, setError] = useState<string | null>(initialError);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [scannerOpen, setScannerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [applyingVariantId, setApplyingVariantId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("products")
      .select(INVENTORY_PRODUCTS_SELECT)
      .order("name");

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setProducts((data as InventoryProductRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!initialProducts.length && !initialError) {
      void load();
    }
  }, [load, initialProducts.length, initialError]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      if (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode?.toLowerCase().includes(q) ?? false)
      ) {
        return true;
      }
      return getActiveVariants(p).some((v) => {
        const color = pickColorJoin(v.product_colors);
        return color?.name.toLowerCase().includes(q);
      });
    });
  }, [products, query]);

  const allSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const selectionCount = selected.size;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function applyVariantAdjust(
    product: InventoryProductRow,
    variantId: string,
    delta: number,
  ) {
    const variant = getActiveVariants(product).find((v) => v.id === variantId);
    if (!variant) return;

    setApplyingVariantId(variantId);
    const newStock = Math.max(0, variant.stock + delta);
    const supabase = createClient();

    const { error: updateError, totalStock } = await updateVariantStock(
      supabase,
      variantId,
      product.id,
      newStock,
    );

    setApplyingVariantId(null);

    if (updateError) {
      toast.error("Αποτυχία ενημέρωσης");
      return;
    }

    await logInventoryMovement(supabase, {
      product_id: product.id,
      type: "adjustment",
      quantity: Math.abs(delta),
      reason: delta > 0 ? "Προσθήκη αποθήκης" : "Αφαίρεση αποθήκης",
    });

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== product.id) return p;
        const variants = (p.product_color_variants ?? []).map((v) =>
          v.id === variantId ? { ...v, stock: newStock } : v,
        );
        return {
          ...p,
          product_color_variants: variants,
          stock: totalStock ?? getTotalVariantStock({ ...p, product_color_variants: variants }),
        };
      }),
    );

    toast.success("Απόθεμα ενημερώθηκε");
    vibrateSuccess();
  }

  async function deleteSelected() {
    if (!selectionCount) return;
    setDeleting(true);
    const supabase = createClient();
    const ids = Array.from(selected);
    const { error: delError } = await supabase.from("products").delete().in("id", ids);

    if (delError) {
      toast.error(delError.message);
      setDeleting(false);
      return;
    }

    setProducts((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
    setExpanded((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setDeleteConfirm(false);
    setDeleting(false);
    toast.success(`Διαγράφηκαν ${ids.length} προϊόντα`);
  }

  function handleBarcodeScan(code: string) {
    setQuery(code.trim());
    setScannerOpen(false);
    toast.success("Barcode σαρώθηκε");
  }

  if (loading) {
    return (
      <section className="flex min-h-[50dvh] items-center justify-center">
        <Spinner />
      </section>
    );
  }

  if (error) {
    return <ErrorCard message={error} onRetry={() => void load()} />;
  }

  return (
    <section className="relative flex flex-col gap-4 pb-28">
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
      />
      <AddProductModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => void load()}
      />

      <h1 className="text-lg font-bold text-[var(--text)]">Απόθεμα</h1>

      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Αναζήτηση προϊόντος ή χρώματος..."
          className={cn(inputPremium, "pr-14")}
        />
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="absolute right-2 top-1/2 flex min-h-12 min-w-12 -translate-y-1/2 items-center justify-center rounded-xl bg-[var(--orange)]/20 text-[var(--orange)] transition-all hover:glow-orange"
          aria-label="Σάρωση barcode"
        >
          <Barcode className="size-6" />
        </button>
      </div>

      {filtered.length > 0 ? (
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="size-5 accent-[var(--orange)]"
          />
          <span className="text-base text-[var(--text-muted)]">Επιλογή όλων</span>
        </label>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-center text-base text-[var(--text-muted)]">
          Δεν βρέθηκαν προϊόντα
        </p>
      ) : (
        filtered.map((product) => (
          <InventoryProductCard
            key={product.id}
            product={product}
            expanded={expanded.has(product.id)}
            isSelected={selected.has(product.id)}
            applyingVariantId={applyingVariantId}
            onToggleExpand={() => toggleExpand(product.id)}
            onToggleSelect={() => toggleSelect(product.id)}
            onVariantAdjust={(variantId, delta) =>
              void applyVariantAdjust(product, variantId, delta)
            }
          />
        ))
      )}

      {selectionCount > 0 ? (
        <section className="fixed bottom-20 left-4 right-4 z-30 flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 p-4 shadow-lg shadow-black/40 backdrop-blur-xl">
          <span className="text-base font-medium text-[var(--text)]">
            {selectionCount} επιλεγμένα
          </span>
          {!deleteConfirm ? (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="flex min-h-12 items-center gap-2 rounded-xl bg-[var(--red)] px-4 text-sm font-bold text-white"
            >
              <Trash2 className="size-4" />
              Διαγραφή
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="min-h-12 rounded-xl border border-[var(--border)] px-3 text-sm text-[var(--text)]"
              >
                Άκυρο
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void deleteSelected()}
                className="min-h-12 rounded-xl bg-[var(--red)] px-4 text-sm font-bold text-white"
              >
                {deleting ? "…" : "Επιβεβαίωση"}
              </button>
            </div>
          )}
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="btn-orange-gradient fixed bottom-24 right-4 z-30 flex size-16 items-center justify-center rounded-full shadow-lg"
        aria-label="Προσθήκη προϊόντος"
      >
        <Plus className="size-8 text-white" />
      </button>
    </section>
  );
}
