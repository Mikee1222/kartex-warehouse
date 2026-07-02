"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { isBrowserOnline } from "@/lib/pick/offline-pick-queue";

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(isBrowserOnline());
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (online) return null;

  return (
    <div className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-[var(--orange)]/40 bg-[var(--orange)]/15 px-4 py-2 text-sm font-semibold text-[var(--orange)]">
      <WifiOff className="size-4" />
      Χωρίς σύνδεση — οι επιβεβαιώσεις θα σταλούν όταν επανέλθει το δίκτυο
    </div>
  );
}
