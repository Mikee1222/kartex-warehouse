"use client";

import {
  BarChart2,
  Calendar,
  CheckCircle2,
  Home,
  Package,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: "/dashboard", label: "Αρχική", icon: Home },
  { href: "/orders", label: "Παραγγελίες", icon: Package },
  { href: "/ready", label: "Έτοιμα", icon: CheckCircle2 },
  { href: "/schedule", label: "Πρόγραμμα", icon: Calendar },
  { href: "/inventory", label: "Απόθεμα", icon: BarChart2 },
  { href: "/profile", label: "Προφίλ", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.includes("/pick")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-20 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_98%,transparent)] backdrop-blur-xl">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 pb-2 pt-1 text-xs font-medium transition-all duration-200",
              active ? "text-[var(--gold)]" : "text-[var(--text-dim)]",
            )}
          >
            <Icon
              className={cn(
                "size-7 transition-transform duration-200",
                active && "scale-105",
                active ? "text-[var(--gold)]" : "text-[var(--text-dim)]",
              )}
              strokeWidth={2}
              aria-hidden
            />
            <span className="text-[11px]">{item.label}</span>
            {active ? (
              <span className="absolute bottom-1.5 size-1.5 rounded-full bg-[var(--gold)] shadow-[0_0_10px_var(--gold)]" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
