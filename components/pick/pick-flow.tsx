"use client";

import { ArrowLeft, Camera, Check, MapPin } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BarcodeScanner } from "@/components/pick/barcode-scanner";
import { BoxPhotosCompletion } from "@/components/pick/box-photos-completion";
import { ColorCircle } from "@/components/ui/color-circle";
import { Spinner } from "@/components/ui/spinner";
import { ErrorCard } from "@/components/ui/error-card";
import {
  derivePickProgress,
  PICK_ORDER_SELECT,
  PICK_ORDER_SELECT_FALLBACK,
  PICK_ORDER_SELECT_LEGACY,
  PICK_ORDER_SELECT_NO_PICKED,
} from "@/lib/orders/pick-queries";
import { startOrderPicking } from "@/lib/orders/start-picking";
import {
  findVariantForOrderItem,
  getVariantColorName,
  getVariantHex,
} from "@/lib/products/color-variants";
import { confirmPickItem } from "@/lib/products/pick-stock";
import { createClient } from "@/lib/supabase/client";
import { inputPremium } from "@/lib/ui/styles";
import {
  getCustomerName,
  getOrderItemColor,
  getProduct,
  getShelfLocation,
  type OrderItemRow,
  type OrderPickRow,
} from "@/types/orders";
import type { ProductColorVariantRow } from "@/types/products";
import { cn } from "@/lib/utils";

type PickFlowProps = {
  orderId: string;
};

function matchesBarcode(
  product: ReturnType<typeof getProduct>,
  code: string,
): boolean {
  if (!product) return false;
  const normalized = code.trim().toLowerCase();
  return (
    product.sku.toLowerCase() === normalized ||
    (product.barcode?.toLowerCase() ?? "") === normalized
  );
}

const PICK_ORDER_SELECTS = [
  PICK_ORDER_SELECT,
  PICK_ORDER_SELECT_FALLBACK,
  PICK_ORDER_SELECT_NO_PICKED,
  PICK_ORDER_SELECT_LEGACY,
] as const;

export function PickFlow({ orderId }: PickFlowProps) {
  const [order, setOrder] = useState<OrderPickRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualQty, setManualQty] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [currentVariant, setCurrentVariant] =
    useState<ProductColorVariantRow | null>(null);

  const items = useMemo(
    () => order?.order_items?.filter((i) => i.product_id) ?? [],
    [order],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    let data: OrderPickRow | null = null;
    let fetchError: { message?: string } | null = null;

    for (const select of PICK_ORDER_SELECTS) {
      const result = await supabase
        .from("orders")
        .select(select)
        .eq("id", orderId)
        .single();

      if (!result.error) {
        data = result.data as OrderPickRow;
        fetchError = null;
        break;
      }

      fetchError = result.error;
      if (
        !/color_id|product_colors|picked_at|picked_by/i.test(
          result.error.message ?? "",
        )
      ) {
        break;
      }
    }

    if (fetchError || !data) {
      setError(fetchError?.message ?? "Η παραγγελία δεν βρέθηκε");
      setLoading(false);
      return;
    }

    const pickItems = data.order_items?.filter((item) => item.product_id) ?? [];
    const { confirmed: picked, currentIndex: index } =
      derivePickProgress(pickItems);

    setOrder(data);
    setConfirmed(picked);
    setCurrentIndex(index);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const supabase = createClient();
    void startOrderPicking(supabase, orderId);
  }, [orderId]);

  const allConfirmed = items.length > 0 && confirmed.size >= items.length;
  const currentItem = items[currentIndex] as OrderItemRow | undefined;
  const product = getProduct(currentItem?.products ?? null);
  const shelf = getShelfLocation(product);
  const progress = items.length
    ? Math.min(confirmed.size, items.length)
    : 0;
  const stepBadge = allConfirmed
    ? confirmed.size
    : Math.min(confirmed.size + 1, items.length);

  const itemColor = currentItem ? getOrderItemColor(currentItem) : null;
  const displayColorName =
    itemColor?.name ??
    (currentVariant ? getVariantColorName(currentVariant) : null);
  const displayColorHex =
    itemColor?.hex_code ??
    (currentVariant ? getVariantHex(currentVariant) : null);

  useEffect(() => {
    if (!currentItem?.product_id) {
      setCurrentVariant(null);
      return;
    }
    const supabase = createClient();
    void findVariantForOrderItem(
      supabase,
      currentItem.product_id,
      currentItem.color_id,
    ).then(setCurrentVariant);
  }, [currentItem?.id, currentItem?.product_id, currentItem?.color_id]);

  function vibrateSuccess() {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(200);
    }
  }

  function triggerFlash() {
    setFlash(true);
    vibrateSuccess();
    setTimeout(() => setFlash(false), 500);
  }

  async function confirmCurrentItem() {
    if (!currentItem?.product_id || confirming || confirmed.has(currentItem.id)) {
      return;
    }

    setConfirming(true);
    const supabase = createClient();
    const { error: pickError } = await confirmPickItem(supabase, {
      orderItemId: currentItem.id,
      productId: currentItem.product_id,
      colorId: currentItem.color_id,
      quantity: currentItem.quantity,
      orderId,
    });
    setConfirming(false);

    if (pickError) {
      toast.error(pickError);
      return;
    }

    setConfirmed((prev) => new Set(prev).add(currentItem.id));
    triggerFlash();
    setManualQty("");
    setShowManual(false);

    if (currentIndex < items.length - 1) {
      setTimeout(() => setCurrentIndex((i) => i + 1), 520);
    }
  }

  function handleScan(code: string) {
    if (
      !product ||
      !currentItem ||
      confirming ||
      confirmed.has(currentItem.id)
    ) {
      return;
    }
    if (matchesBarcode(product, code)) {
      toast.success("Σωστό barcode!");
      void confirmCurrentItem();
    } else {
      toast.error("Λάθος προϊόν — δοκιμάστε ξανά");
    }
  }

  function handleManualConfirm() {
    if (
      !currentItem ||
      confirming ||
      confirmed.has(currentItem.id) ||
      currentItem.picked_at
    ) {
      return;
    }
    const qty = Number(manualQty);
    if (!currentItem || !Number.isFinite(qty) || qty !== currentItem.quantity) {
      toast.error(`Εισάγετε ποσότητα ${currentItem?.quantity ?? ""}`);
      return;
    }
    void confirmCurrentItem();
  }

  if (loading) {
    return (
      <section className="flex min-h-[50dvh] items-center justify-center">
        <Spinner />
      </section>
    );
  }

  if (error || !order) {
    return <ErrorCard message={error ?? "Σφάλμα"} onRetry={() => void load()} />;
  }

  if (allConfirmed) {
    return (
      <BoxPhotosCompletion
        orderId={orderId}
        orderNumber={order.order_number}
        customerName={getCustomerName(order.customers)}
      />
    );
  }

  if (!currentItem || !product) {
    return <ErrorCard message="Δεν υπάρχουν είδη για picking" />;
  }

  const alreadyDone = confirmed.has(currentItem.id);

  return (
    <section
      className={cn(
        "relative flex flex-col gap-5 pb-6",
        flash && "flash-green",
      )}
    >
      {flash ? (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          aria-hidden
        >
          <span className="check-pop flex size-24 items-center justify-center rounded-full bg-[var(--green)] text-white shadow-lg">
            <Check className="size-12" strokeWidth={3} />
          </span>
        </div>
      ) : null}

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />

      <header className="sticky top-0 z-10 -mx-4 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_95%,transparent)] px-4 pb-4 pt-1 backdrop-blur-md">
        <Link
          href="/orders"
          className="mb-2 inline-flex min-h-12 items-center gap-1 text-base font-medium text-[var(--orange)]"
        >
          <ArrowLeft className="size-5" strokeWidth={2} />
          Πίσω
        </Link>
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-bold text-[var(--text)]">
            {order.order_number}
          </p>
          <span className="rounded-full bg-[var(--orange)]/15 px-3 py-1 text-sm font-bold text-[var(--orange)]">
            {stepBadge}/{items.length}
          </span>
        </div>
        <p className="mt-1 text-base text-[var(--text-muted)]">Είδος σε picking</p>
        <div className="progress-track mt-3">
          <span
            className="progress-orange block h-full rounded-full transition-all duration-300"
            style={{ width: `${(progress / items.length) * 100}%` }}
          />
        </div>
      </header>

      <article
        className={cn(
          "rounded-2xl border border-white/15 bg-white p-6 shadow-xl shadow-black/40",
          flash && "ring-2 ring-[var(--green)]/40",
        )}
      >
        <h2 className="text-[28px] font-bold leading-tight text-[var(--bg)]">
          {product.name}
        </h2>
        <p className="font-mono mt-2 text-sm text-gray-500">SKU: {product.sku}</p>

        {displayColorName && displayColorHex ? (
          <div className="mt-6 flex items-center gap-3">
            <ColorCircle hex={displayColorHex} size={40} title={displayColorName} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Απαιτούμενο χρώμα
              </p>
              <p className="text-xl font-bold text-[var(--bg)]">{displayColorName}</p>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-gray-500">Χρώμα: —</p>
        )}

        <p className="mt-8 text-[96px] font-bold leading-none text-[var(--orange)]">
          {currentItem.quantity}
        </p>
        {shelf ? (
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--orange)]/10 px-4 py-2 text-base font-semibold text-[var(--orange)]">
            <MapPin className="size-5 shrink-0" strokeWidth={2} />
            {shelf}
          </span>
        ) : null}
      </article>

      <button
        type="button"
        disabled={alreadyDone || confirming}
        onClick={() => setScannerOpen(true)}
        className={cn(
          "btn-orange-gradient btn-scan-pulse flex min-h-20 w-full items-center justify-center gap-3",
          "rounded-xl text-lg font-bold text-white disabled:opacity-50",
        )}
      >
        <Camera className="size-8" strokeWidth={2.25} />
        {confirming ? "Ενημέρωση αποθέματος…" : "ΣΑΡΩΣΗ BARCODE"}
      </button>

      <button
        type="button"
        onClick={() => setShowManual((v) => !v)}
        className="text-center text-base text-[var(--text-muted)] underline"
      >
        Χειροκίνητη καταχώρηση
      </button>

      {showManual ? (
        <section className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={manualQty}
            onChange={(e) => setManualQty(e.target.value)}
            placeholder="Ποσότητα"
            className={cn(inputPremium, "flex-1")}
          />
          <button
            type="button"
            disabled={confirming}
            onClick={handleManualConfirm}
            className="min-h-16 rounded-xl bg-[var(--green)] px-6 text-lg font-bold text-white disabled:opacity-50"
          >
            OK
          </button>
        </section>
      ) : null}
    </section>
  );
}
