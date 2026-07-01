import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "size-12 rounded-full border-4 border-kartex-card border-t-kartex-orange animate-spin-slow",
        className,
      )}
      role="status"
      aria-label="Φόρτωση"
    />
  );
}
