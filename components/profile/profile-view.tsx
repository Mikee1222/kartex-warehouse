"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { OrderStatus } from "@/lib/orders/constants";
import { createClient } from "@/lib/supabase/client";
import type { WarehouseProfile } from "@/lib/auth/get-profile";
import { cardPremium } from "@/lib/ui/styles";
import { cn } from "@/lib/utils";

const APP_VERSION = "1.0.0";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function todayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

type ProfileStats = {
  trips: number;
  deliveries: number;
  boxes: number;
};

export function ProfileView() {
  const router = useRouter();
  const [profile, setProfile] = useState<WarehouseProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    trips: 0,
    deliveries: 0,
    boxes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const since = todayStartIso();

      const [
        { data: roleData },
        { count: trips },
        { data: readyOrders },
      ] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .gte("updated_at", since)
          .eq("status", OrderStatus.Processing),
        supabase
          .from("orders")
          .select("boxes_count")
          .gte("updated_at", since)
          .eq("status", OrderStatus.ReadyForShipment),
      ]);

      const role = roleData?.role === "admin" ? "admin" : "warehouse";
      const metadata = user.user_metadata as Record<string, unknown>;
      const name =
        (typeof metadata?.full_name === "string" && metadata.full_name) ||
        (typeof metadata?.name === "string" && metadata.name) ||
        user.email?.split("@")[0] ||
        "Χρήστης";

      const deliveries = readyOrders?.length ?? 0;
      const boxes = (readyOrders ?? []).reduce(
        (sum, row) => sum + (row.boxes_count ?? 0),
        0,
      );

      setProfile({
        id: user.id,
        email: user.email ?? "",
        name,
        role,
        roleLabel: role === "admin" ? "Διαχειριστής" : "Αποθηκάριος",
      });
      setStats({
        trips: trips ?? 0,
        deliveries,
        boxes,
      });
      setLoading(false);
    }

    void load();
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Αποσυνδεθήκατε");
    router.replace("/login");
    router.refresh();
  }

  if (loading || !profile) {
    return (
      <section className="flex min-h-[50dvh] items-center justify-center">
        <Spinner />
      </section>
    );
  }

  const statItems = [
    { label: "Διαδρομές", value: stats.trips },
    { label: "Παραδόσεις", value: stats.deliveries },
    { label: "Κουτιά", value: stats.boxes },
  ] as const;

  return (
    <section className="flex flex-col items-center gap-6 py-4">
      <div className="rounded-full p-1 ring-4 ring-[var(--orange)] ring-offset-4 ring-offset-[var(--bg)]">
        <div className="flex size-20 items-center justify-center rounded-full bg-[var(--orange)] text-2xl font-bold text-white shadow-[0_0_24px_var(--orange-glow)]">
          {getInitials(profile.name)}
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--text)]">{profile.name}</h1>
        <p className="mt-1 text-base text-[var(--text-muted)]">{profile.email}</p>
        <span className="mt-4 inline-block rounded-full bg-[var(--orange)]/10 px-4 py-2 text-base font-medium text-[var(--orange)]">
          {profile.roleLabel}
        </span>
      </div>

      <div
        className={cn(
          cardPremium,
          "grid w-full max-w-md grid-cols-3 gap-2 p-4 text-center",
        )}
      >
        {statItems.map((item) => (
          <div key={item.label}>
            <p className="text-3xl font-bold text-[var(--orange)]">{item.value}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{item.label}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-[var(--text-dim)]">
        Στατιστικά σήμερα · Kartex Αποθήκη v{APP_VERSION}
      </p>

      <button
        type="button"
        disabled={signingOut}
        onClick={() => void handleSignOut()}
        className={cn(
          "mt-2 min-h-16 w-full max-w-md rounded-xl border-2 text-lg font-bold",
          "border-[var(--red)] bg-[var(--red)]/10 text-[var(--red)]",
          "transition-all duration-200 hover:bg-[var(--red)]/20 disabled:opacity-60",
        )}
      >
        {signingOut ? "Αποσύνδεση…" : "ΑΠΟΣΥΝΔΕΣΗ"}
      </button>
    </section>
  );
}
