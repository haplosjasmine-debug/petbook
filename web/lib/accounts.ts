import { randomBytes } from "node:crypto";
import { DirectusError, adminRequest, listItems } from "@/lib/directus";
import { DIRECTUS_ROLE_NAMES, type AppRole } from "@/lib/roles";
import type { DirectusRole, DirectusUser, Shop } from "@/lib/types";

export function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] ?? name.trim(),
    last_name: parts.slice(1).join(" ") || null,
  };
}

export function temporaryPassword() {
  return `PB-${randomBytes(6).toString("hex")}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function findRole(role: AppRole) {
  const result = await adminRequest<{ data: DirectusRole[] }>("/roles?limit=-1&fields=id,name");
  const candidates = DIRECTUS_ROLE_NAMES[role].map((name) => name.toLowerCase());
  const match = result.data.find((item) => candidates.includes(item.name.toLowerCase()));

  if (!match) {
    throw new DirectusError(
      `The ${DIRECTUS_ROLE_NAMES[role][0]} role has not been configured in Directus. Run the setup script first.`,
      500
    );
  }
  return match;
}

export async function createAccount({
  email,
  password,
  name,
  role,
}: {
  email: string;
  password: string;
  name: string;
  role: AppRole;
}) {
  const existing = await adminRequest<{ data: DirectusUser[] }>(
    `/users?filter[email][_eq]=${encodeURIComponent(email)}&limit=1`
  );
  if (existing.data[0]) {
    throw new DirectusError("An account with this email already exists.", 409);
  }

  const directusRole = await findRole(role);
  const { first_name, last_name } = splitName(name);
  const result = await adminRequest<{ data: DirectusUser }>("/users", {
    method: "POST",
    body: {
      email,
      password,
      first_name,
      last_name,
      role: directusRole.id,
      status: "active",
    },
  });
  return result.data;
}

export async function updateAccount(
  id: string,
  body: Record<string, unknown>
) {
  const result = await adminRequest<{ data: DirectusUser }>(`/users/${id}`, {
    method: "PATCH",
    body,
  });
  return result.data;
}

export async function uniqueShopSlug(name: string) {
  const base = slugify(name) || "shop";
  const existing = await listItems<Shop>(
    "shops",
    `filter[slug][_eq]=${encodeURIComponent(base)}&limit=1`
  );
  if (!existing.length) return base;
  return `${base}-${Date.now().toString().slice(-5)}`;
}
