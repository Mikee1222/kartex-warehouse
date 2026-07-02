import { redirect } from "next/navigation";

import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";
import { getWarehouseProfile } from "@/lib/auth/get-profile";

export async function WarehouseShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getWarehouseProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <TopBar userName={profile.name} />
      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
