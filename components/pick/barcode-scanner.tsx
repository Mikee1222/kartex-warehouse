"use client";

import { Html5Qrcode } from "html5-qrcode";
import { ScanLine, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type BarcodeScannerProps = {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
};

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const elementId = "warehouse-barcode-reader";
    let cancelled = false;

    async function start() {
      setError(null);
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 280, height: 160 } },
          (decoded) => {
            if (cancelled) return;
            onScan(decoded.trim());
            void stopScanner();
            onClose();
          },
          () => {},
        );
      } catch {
        if (!cancelled) {
          setError("Δεν ήταν δυνατή η πρόσβαση στην κάμερα.");
        }
      }
    }

    async function stopScanner() {
      try {
        if (scannerRef.current?.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current?.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }

    void start();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [open, onClose, onScan]);

  if (!open) return null;

  return (
    <section className="fixed inset-0 z-50 flex flex-col bg-kartex-navy/95 backdrop-blur-md">
      <header className="flex items-center justify-between border-b border-white/10 p-4">
        <div className="flex items-center gap-2 text-white">
          <ScanLine className="size-6 text-kartex-orange" />
          <h2 className="text-lg font-bold">Σάρωση barcode</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-white/10 bg-kartex-card"
        >
          <X className="size-5 text-white" />
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        {error ? (
          <p className="rounded-xl bg-kartex-danger/20 px-4 py-3 text-base text-kartex-danger">
            {error}
          </p>
        ) : (
          <div className="relative w-full max-w-md">
            <div className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-kartex-gold shadow-[0_0_30px_var(--gold-glow)]" />
            <section
              id="warehouse-barcode-reader"
              className="overflow-hidden rounded-2xl border border-white/10"
            />
          </div>
        )}
        <p className="mt-4 text-center text-sm text-white/50">
          Στοιχίστε το barcode μέσα στο πλαίσιο
        </p>
      </div>
    </section>
  );
}
