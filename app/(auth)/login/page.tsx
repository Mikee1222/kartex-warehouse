import { Warehouse } from "lucide-react";
import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";
import { Spinner } from "@/components/ui/spinner";

function LoginFallback() {
  return (
    <section className="flex min-h-dvh items-center justify-center bg-[var(--bg)]">
      <Spinner />
    </section>
  );
}

export default function LoginPage() {
  return (
    <section className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-6 py-10">
      <section className="card-premium glow-orange w-full max-w-md p-8">
        <div className="flex justify-center" aria-hidden>
          <Warehouse className="size-16 text-[var(--orange)]" strokeWidth={1.5} />
        </div>
        <h1 className="mt-4 text-center text-[28px] font-bold text-[var(--orange)]">
          KARTEX ΑΠΟΘΗΚΗ
        </h1>
        <p className="mt-2 text-center text-base text-[var(--text-muted)]">
          Σύνδεση αποθηκάριου
        </p>
        <section className="mt-8">
          <Suspense fallback={<LoginFallback />}>
            <LoginForm />
          </Suspense>
        </section>
      </section>
    </section>
  );
}
