"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { inputPremium } from "@/lib/ui/styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AddProductModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function AddProductModal({ open, onClose, onSaved }: AddProductModalProps) {
  const [pending, setPending] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const sku = String(fd.get("sku") ?? "").trim();
    const category = String(fd.get("category") ?? "").trim() || null;
    const stock = Math.max(0, Number(fd.get("stock") ?? 0));
    const min_stock = Math.max(0, Number(fd.get("min_stock") ?? 0));

    if (!name || !sku) {
      toast.error("Συμπληρώστε όνομα και SKU");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("products").insert({
      name,
      sku,
      category,
      stock,
      min_stock,
    });

    if (error) {
      toast.error(error.message);
      setPending(false);
      return;
    }

    toast.success("Το προϊόν προστέθηκε");
    setPending(false);
    onSaved();
    onClose();
  }

  return (
    <section className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="card-premium w-full max-w-md rounded-2xl p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Νέο προϊόν</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/50 hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1 text-sm text-white/70">
            Όνομα
            <input name="name" required className={inputPremium} />
          </label>
          <label className="grid gap-1 text-sm text-white/70">
            SKU
            <input name="sku" required className={inputPremium} />
          </label>
          <label className="grid gap-1 text-sm text-white/70">
            Κατηγορία
            <input name="category" className={inputPremium} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm text-white/70">
              Απόθεμα
              <input
                name="stock"
                type="number"
                min={0}
                defaultValue={0}
                className={inputPremium}
              />
            </label>
            <label className="grid gap-1 text-sm text-white/70">
              Ελάχιστο
              <input
                name="min_stock"
                type="number"
                min={0}
                defaultValue={0}
                className={inputPremium}
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className={cn(
            "btn-orange-gradient mt-6 min-h-14 w-full rounded-xl font-bold text-white",
            "disabled:opacity-60",
          )}
        >
          {pending ? "Αποθήκευση…" : "Αποθήκευση"}
        </button>
      </form>
    </section>
  );
}
