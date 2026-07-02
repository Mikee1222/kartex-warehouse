import type { SupabaseClient, User } from "@supabase/supabase-js";

export const WAREHOUSE_ALLOWED_ROLES = ["warehouse", "admin"] as const;

export type WarehouseRole = (typeof WAREHOUSE_ALLOWED_ROLES)[number];

const BOOTSTRAP_ADMIN_EMAIL = "admin@karalis.gr";

export function isWarehouseAllowedRole(
  role: string | null | undefined,
): role is WarehouseRole {
  return role === "warehouse" || role === "admin";
}

export function isBootstrapAdminEmail(email: string | undefined) {
  return email?.trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
}

export function roleFromBootstrapOrRow(
  email: string | undefined,
  role: string | null | undefined,
): WarehouseRole | null {
  if (isBootstrapAdminEmail(email)) {
    return "admin";
  }
  return isWarehouseAllowedRole(role) ? role : null;
}

export async function resolveWarehouseRole(
  supabase: SupabaseClient,
  user: User,
): Promise<WarehouseRole | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return roleFromBootstrapOrRow(user.email, data?.role ?? null);
}
