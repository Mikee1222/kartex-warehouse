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

export async function resolveWarehouseRole(
  supabase: SupabaseClient,
  user: User,
): Promise<WarehouseRole | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = data?.role ?? null;

  if (isWarehouseAllowedRole(role)) {
    return role;
  }

  if (isBootstrapAdminEmail(user.email)) {
    return "admin";
  }

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const metadataRole =
    typeof metadata?.role === "string" ? metadata.role : null;

  return isWarehouseAllowedRole(metadataRole) ? metadataRole : null;
}
