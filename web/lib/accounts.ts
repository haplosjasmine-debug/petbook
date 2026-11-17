import { randomBytes } from "node:crypto";
import {
  DirectusError,
  adminRequest,
  createItem,
  listItems,
  updateItem,
} from "@/lib/directus";
import { DIRECTUS_ROLE_NAMES, normalizeRole, type AppRole } from "@/lib/roles";
import type { Customer, DirectusRole, DirectusUser, Shop } from "@/lib/types";

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

export async function findUserByEmail(email: string) {
  const result = await adminRequest<{ data: DirectusUser[] }>(
    `/users?filter[email][_eq]=${encodeURIComponent(email.trim().toLowerCase())}&limit=1`
  );
  return result.data[0] ?? null;
}

function roleId(role: DirectusUser["role"]) {
  return typeof role === "string" ? role : role?.id ?? null;
}

export async function ensureCustomerProfile(user: DirectusUser, phone?: string | null) {
  const normalized = normalizeRole(user.role);
  if (normalized && normalized !== "pet_owner") return null;
  if (!normalized) {
    const ownerRole = await findRole("pet_owner");
    if (roleId(user.role) !== ownerRole.id) return null;
  }

  const existing = await listItems<Customer>(
    "customers",
    `filter[user][_eq]=${user.id}&limit=1`
  );

  if (existing[0]) {
    if (phone && !existing[0].phone) {
      return updateItem<Customer>("customers", existing[0].id, { phone });
    }
    return existing[0];
  }

  const fallbackName = splitName(user.email.split("@")[0] ?? user.email);
  const first_name = user.first_name?.trim() || fallbackName.first_name;
  const last_name = user.last_name?.trim() || fallbackName.last_name || "";

  try {
    return await createItem<Customer>("customers", {
      user: user.id,
      first_name,
      last_name,
      phone: phone || null,
      loyalty_points: 0,
    });
  } catch (error) {
    const raced = await listItems<Customer>(
      "customers",
      `filter[user][_eq]=${user.id}&limit=1`
    );
    if (raced[0]) return raced[0];
    throw error;
  }
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
  const existing = await findUserByEmail(email);
  if (existing) {
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

export async function setAccountPassword(id: string, password: string) {
  const result = await adminRequest<{ data: DirectusUser }>(`/users/${id}`, {
    method: "PATCH",
    body: { password },
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
