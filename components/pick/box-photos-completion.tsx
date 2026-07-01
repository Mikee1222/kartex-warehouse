"use client";

import { Camera, Check, CheckCircle2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { uploadBoxPhoto } from "@/lib/orders/upload-box-photo";
import { OrderStatus } from "@/lib/orders/constants";
import { createClient } from "@/lib/supabase/client";
import { cardPremium, inputPremium } from "@/lib/ui/styles";
import { cn } from "@/lib/utils";

type BoxPhotoEntry = {
  file: File;
  preview: string;
};

type BoxPhotosCompletionProps = {
  orderId: string;
  orderNumber: string;
  customerName: string;
};

function parseBoxCount(raw: string): number {
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 1) return 0;
  return Math.min(99, n);
}

export function BoxPhotosCompletion({
  orderId,
  orderNumber,
  customerName,
}: BoxPhotosCompletionProps) {
  const [boxesCountInput, setBoxesCountInput] = useState("");
  const [boxesNotes, setBoxesNotes] = useState("");
  const [boxPhotos, setBoxPhotos] = useState<Record<number, BoxPhotoEntry>>({});
  const [completing, setCompleting] = useState(false);

  const boxesCount = useMemo(
    () => parseBoxCount(boxesCountInput),
    [boxesCountInput],
  );

  const boxNumbers = useMemo(
    () =>
      boxesCount > 0
        ? Array.from({ length: boxesCount }, (_, i) => i + 1)
        : [],
    [boxesCount],
  );

  const allBoxesHavePhotos = useMemo(() => {
    if (boxesCount < 1) return false;
    return boxNumbers.every((n) => Boolean(boxPhotos[n]?.file));
  }, [boxesCount, boxNumbers, boxPhotos]);

  function handleBoxCountChange(raw: string) {
    if (raw === "") {
      setBoxesCountInput("");
      setBoxPhotos({});
      return;
    }
    const digitsOnly = raw.replace(/\D/g, "");
    setBoxesCountInput(digitsOnly);
    const next = parseBoxCount(digitsOnly);
    if (next > 0) {
      setBoxPhotos((prev) => {
        const kept: Record<number, BoxPhotoEntry> = {};
        for (let i = 1; i <= next; i++) {
          if (prev[i]) kept[i] = prev[i];
        }
        for (const key of Object.keys(prev).map(Number)) {
          if (key > next && prev[key]?.preview) {
            URL.revokeObjectURL(prev[key].preview);
          }
        }
        return kept;
      });
    } else {
      setBoxPhotos({});
    }
  }

  function clearBoxCount() {
    for (const entry of Object.values(boxPhotos)) {
      if (entry.preview) URL.revokeObjectURL(entry.preview);
    }
    setBoxesCountInput("");
    setBoxPhotos({});
  }

  function handlePhotoCapture(boxNumber: number, file: File | undefined) {
    if (!file) return;
    setBoxPhotos((prev) => {
      const old = prev[boxNumber];
      if (old?.preview) URL.revokeObjectURL(old.preview);
      return {
        ...prev,
        [boxNumber]: { file, preview: URL.createObjectURL(file) },
      };
    });
  }

  async function completeOrder() {
    if (boxesCount < 1) {
      toast.error("Εισάγετε τον αριθμό κιβωτίων");
      return;
    }
    if (!allBoxesHavePhotos) {
      toast.error("Απαιτείται φωτογραφία για κάθε κιβώτιο");
      return;
    }

    setCompleting(true);
    const supabase = createClient();

    try {
      for (const boxNumber of boxNumbers) {
        const entry = boxPhotos[boxNumber];
        if (!entry?.file) continue;
        await uploadBoxPhoto(supabase, orderId, boxNumber, entry.file);
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: OrderStatus.ReadyForShipment,
          boxes_count: boxesCount,
          boxes_notes: boxesNotes.trim() || null,
        })
        .eq("id", orderId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast.success("Η παραγγελία ολοκληρώθηκε!");
      window.location.href = "/dashboard";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Αποτυχία ολοκλήρωσης";
      toast.error(message);
      setCompleting(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 pb-8">
      <p className="flex items-center justify-center gap-2 text-center text-2xl font-bold text-kartex-success">
        <CheckCircle2 className="size-6 shrink-0" strokeWidth={2} />
        Όλα τα είδη επιβεβαιώθηκαν!
      </p>
      <p className="text-center text-base text-white/50">
        {orderNumber} · {customerName}
      </p>

      <section className={cn(cardPremium, "p-4")}>
        <label className="grid gap-2 text-base font-medium text-white">
          Πόσα κιβώτια;
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              value={boxesCountInput}
              onChange={(e) => handleBoxCountChange(e.target.value)}
              placeholder="π.χ. 3"
              className={cn(inputPremium, "pr-14 text-2xl font-bold")}
            />
            {boxesCountInput ? (
              <button
                type="button"
                onClick={clearBoxCount}
                className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg border border-white/10 bg-kartex-navy/80 text-white/70 transition-colors hover:bg-kartex-card-hover hover:text-white"
                aria-label="Καθαρισμός"
              >
                <X className="size-5" />
              </button>
            ) : null}
          </div>
        </label>

        <label className="mt-4 grid gap-2 text-sm text-white/70">
          Σημειώσεις (προαιρετικά)
          <textarea
            value={boxesNotes}
            onChange={(e) => setBoxesNotes(e.target.value)}
            rows={2}
            className={cn(inputPremium, "min-h-20 resize-none py-3")}
            placeholder="π.χ. εύθραυστα, προσοχή στη μεταφορά…"
          />
        </label>
      </section>

      {boxesCount > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-white">Φωτογραφίες κιβωτίων</h2>
          {boxNumbers.map((boxNumber) => {
            const entry = boxPhotos[boxNumber];
            return (
              <article key={boxNumber} className={cn(cardPremium, "p-4")}>
                <p className="mb-3 text-base font-semibold text-white">
                  Κιβώτιο #{boxNumber}
                </p>

                <label className="flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-kartex-orange/60 bg-kartex-navy/50 px-4 text-center transition-all hover:glow-orange">
                  <Camera className="size-6 text-kartex-orange" strokeWidth={2} />
                  <span className="text-base font-medium text-kartex-orange">
                    Φωτογραφία κιβωτίου
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) =>
                      handlePhotoCapture(boxNumber, e.target.files?.[0])
                    }
                  />
                </label>

                {entry?.preview ? (
                  <div className="relative mt-3 h-36 w-full overflow-hidden rounded-xl border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.preview}
                      alt={`Κιβώτιο ${boxNumber}`}
                      className="size-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 flex items-center justify-center rounded-full bg-kartex-success p-1.5 text-white">
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-kartex-danger">
                    Απαιτείται φωτογραφία
                  </p>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <p className="text-center text-sm text-white/50">
          Εισάγετε τον αριθμό κιβωτίων για να εμφανιστούν τα πεδία φωτογραφίας
        </p>
      )}

      <button
        type="button"
        disabled={!allBoxesHavePhotos || completing}
        onClick={() => void completeOrder()}
        className="btn-orange-gradient min-h-20 w-full rounded-xl bg-kartex-success text-lg font-bold text-white disabled:opacity-50"
      >
        {completing ? "Ολοκλήρωση…" : "ΟΛΟΚΛΗΡΩΣΗ"}
      </button>
    </section>
  );
}
