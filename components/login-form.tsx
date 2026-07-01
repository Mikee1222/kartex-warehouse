"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  isBootstrapAdminEmail,
  isWarehouseAllowedRole,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";
  const forbidden = searchParams.get("error") === "forbidden";

  const [error, setError] = React.useState<string | null>(
    forbidden ? "Δεν έχετε πρόσβαση στην αποθήκη" : null,
  );
  const [pending, setPending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Συμπληρώστε email και κωδικό.");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError("Λάθος στοιχεία σύνδεσης. Δοκιμάστε ξανά.");
      setPending(false);
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    const role = roleData?.role;
    if (
      !isWarehouseAllowedRole(role) &&
      !isBootstrapAdminEmail(data.user.email)
    ) {
      await supabase.auth.signOut();
      setError("Δεν έχετε πρόσβαση στην αποθήκη");
      setPending(false);
      return;
    }

    toast.success("Επιτυχής σύνδεση");
    router.replace(nextPath.startsWith("/") ? nextPath : "/dashboard");
    router.refresh();
  }

  const FormFields = "div" as const;

  return (
    <form action={(fd) => void handleSubmit(fd)} className="w-full max-w-md">
      {error ? (
        <p
          className="mb-4 rounded-lg border border-kartex-danger/40 bg-kartex-danger/15 px-4 py-3 text-base text-kartex-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <FormFields className="grid gap-4">
        <FormFields className="grid gap-2">
          <label htmlFor="email" className="text-base font-medium text-white">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            placeholder="name@example.com"
            className="min-h-16 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 text-base text-[var(--text)] outline-none glow-gold-focus"
          />
        </FormFields>

        <FormFields className="grid gap-2">
          <label htmlFor="password" className="text-base font-medium text-white">
            Κωδικός
          </label>
          <FormFields className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={pending}
              className="min-h-16 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 pr-12 text-base text-[var(--text)] outline-none glow-gold-focus"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-kartex-muted"
              aria-label={showPassword ? "Απόκρυψη" : "Εμφάνιση"}
            >
              {showPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </FormFields>
        </FormFields>

        <button
          type="submit"
          disabled={pending}
          className={cn(
            "btn-orange-gradient min-h-16 w-full text-lg font-bold uppercase tracking-wide text-white",
            "disabled:opacity-60",
          )}
        >
          {pending ? "Σύνδεση…" : "ΣΥΝΔΕΣΗ"}
        </button>
      </FormFields>
    </form>
  );
}
