export type AppRole = "pet_owner" | "business_owner" | "staff" | "super_admin";

export const DIRECTUS_ROLE_NAMES: Record<AppRole, string[]> = {
  pet_owner: ["Customer", "Pet Owner"],
  business_owner: ["Shop Owner", "Business Owner"],
  staff: ["Staff"],
  super_admin: ["Administrator"],
};

const ROLE_ALIASES: Record<AppRole, string[]> = {
  pet_owner: ["pet owner", "pet_owner", "customer"],
  business_owner: ["business owner", "business_owner", "shop owner", "shop_owner"],
  staff: ["staff", "team member"],
  super_admin: ["super admin", "super_admin", "administrator", "admin"],
};

const ROLE_LABELS: Record<AppRole, string> = {
  pet_owner: "Pet owner",
  business_owner: "Business owner",
  staff: "Staff",
  super_admin: "Super admin",
};

const ROLE_HOMES: Record<AppRole, string> = {
  pet_owner: "/dashboard",
  business_owner: "/shop",
  staff: "/staff",
  super_admin: "/admin",
};

export function directusRoleName(
  role: { name?: string | null } | string | null | undefined
) {
  if (!role) return "";
  return typeof role === "string" ? role : role.name ?? "";
}

export function normalizeRole(
  role: { name?: string | null } | string | null | undefined
): AppRole | null {
  const value = directusRoleName(role).trim().toLowerCase().replace(/[_-]+/g, " ");
  if (!value) return null;

  for (const [key, aliases] of Object.entries(ROLE_ALIASES) as [AppRole, string[]][]) {
    if (aliases.includes(value)) return key;
  }
  return null;
}

export function appRoleHome(role: AppRole | null | undefined) {
  return role ? ROLE_HOMES[role] : "/dashboard";
}

export function appRoleLabel(role: AppRole | null | undefined) {
  return role ? ROLE_LABELS[role] : "PetBook member";
}
