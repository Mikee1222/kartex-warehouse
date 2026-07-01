import { cn } from "@/lib/utils";

export const cardPremium = cn(
  "card-premium transition-all duration-200",
);

export const inputPremium = cn(
  "min-h-[60px] w-full rounded-xl border px-4 text-base",
  "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]",
  "placeholder:text-[var(--text-dim)] glow-gold-focus transition-all duration-200",
);

export const btnPick = cn(
  "btn-orange-gradient flex min-h-14 w-full items-center justify-center",
  "rounded-xl text-lg font-bold text-white transition-all duration-200",
  "disabled:opacity-50",
);

export const pageTitle = "text-xl font-bold tracking-tight text-[var(--text)]";

export const textMuted = "text-[var(--text-muted)]";
export const textDim = "text-[var(--text-dim)]";
