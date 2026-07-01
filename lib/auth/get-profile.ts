import { resolveWarehouseRole, type WarehouseRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type WarehouseProfile = {
  id: string;
  email: string;
  name: string;
  role: WarehouseRole;
  roleLabel: string;
};

const ROLE_LABELS: Record<WarehouseRole, string> = {
  warehouse: "Αποθηκάριος",
  admin: "Διαχειριστής",
};

export async function getWarehouseProfile(): Promise<WarehouseProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const role = await resolveWarehouseRole(supabase, user);
  if (!role) return null;

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const name =
    (typeof metadata?.full_name === "string" && metadata.full_name) ||
    (typeof metadata?.name === "string" && metadata.name) ||
    user.email?.split("@")[0] ||
    "Χρήστης";

  return {
    id: user.id,
    email: user.email ?? "",
    name,
    role,
    roleLabel: ROLE_LABELS[role],
  };
}
