const QUEUE_KEY = "kartex-warehouse-pick-queue";

export type PendingPickConfirm = {
  id: string;
  orderItemId: string;
  productId: string;
  colorId: string | null;
  quantity: number;
  orderId: string;
  createdAt: string;
};

function readQueue(): PendingPickConfirm[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingPickConfirm[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: PendingPickConfirm[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function getPendingPickQueue(): PendingPickConfirm[] {
  return readQueue();
}

export function enqueuePickConfirm(
  entry: Omit<PendingPickConfirm, "id" | "createdAt">,
): PendingPickConfirm {
  const item: PendingPickConfirm = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const next = [...readQueue(), item];
  writeQueue(next);
  return item;
}

export function dequeuePickConfirm(id: string) {
  writeQueue(readQueue().filter((item) => item.id !== id));
}

export function isBrowserOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}
