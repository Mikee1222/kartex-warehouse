import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

type ErrorCardProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorCard({
  title = "Σφάλμα",
  message,
  onRetry,
  className,
}: ErrorCardProps) {
  return (
    <div
      className={cn(
        "flex min-h-[50dvh] flex-col items-center justify-center px-6 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-kartex-danger/20 text-kartex-danger">
        <AlertTriangle className="size-8" aria-hidden />
      </div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="mt-2 max-w-sm text-base text-kartex-muted">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 min-h-16 w-full max-w-xs rounded-xl bg-kartex-orange px-6 text-base font-bold text-white"
        >
          Δοκιμή ξανά
        </button>
      ) : null}
    </div>
  );
}
