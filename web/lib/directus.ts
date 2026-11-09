import { appConfig } from "@/lib/config";
import type { DirectusList, DirectusUser } from "@/lib/types";

export class DirectusError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status = 500, details: unknown = null) {
    super(message);
    this.name = "DirectusError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
  cache?: RequestCache;
  headers?: Record<string, string>;
};

type AuthTokens = {
  access_token: string;
  refresh_token: string;
  expires: number;
};

const globalCache = globalThis as typeof globalThis & {
  __petbookAdminToken?: { token: string; expiresAt: number };
};

function baseUrl() {
  return appConfig.directusUrl.replace(/\/$/, "");
}

function errorFromPayload(payload: unknown, status: number) {
  const data = payload as { errors?: Array<{ message?: string }>; message?: string } | null;
  if (data?.errors?.length) {
    return data.errors.map((error) => error.message).filter(Boolean).join(", ");
  }
  return data?.message ?? `Directus request failed (${status}).`;
}

export async function directusRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: options.cache ?? "no-store",
    });
  } catch (error) {
    throw new DirectusError(
      "Cannot reach Directus. Check DIRECTUS_URL and that the CMS is running.",
      503,
      error
    );
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    throw new DirectusError(errorFromPayload(payload, response.status), response.status, payload);
  }

  return payload as T;
}

export async function getAdminToken(): Promise<string> {
  if (process.env.DIRECTUS_STATIC_TOKEN) return process.env.DIRECTUS_STATIC_TOKEN;

  const cached = globalCache.__petbookAdminToken;
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const email = process.env.DIRECTUS_ADMIN_EMAIL;
  const password = process.env.DIRECTUS_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new DirectusError(
      "Set DIRECTUS_STATIC_TOKEN or DIRECTUS_ADMIN_EMAIL/DIRECTUS_ADMIN_PASSWORD.",
      500
    );
  }

  const result = await directusRequest<{ data: AuthTokens }>("/auth/login", {
    method: "POST",
    body: { email, password, mode: "json" },
  });

  globalCache.__petbookAdminToken = {
    token: result.data.access_token,
    expiresAt: Date.now() + Math.max(result.data.expires - 60_000, 60_000),
  };

  return result.data.access_token;
}

export async function adminRequest<T>(path: string, options: RequestOptions = {}) {
  let token = await getAdminToken();
  try {
    return await directusRequest<T>(path, { ...options, token });
  } catch (error) {
    if (error instanceof DirectusError && error.status === 401 && !process.env.DIRECTUS_STATIC_TOKEN) {
      globalCache.__petbookAdminToken = undefined;
      token = await getAdminToken();
      return directusRequest<T>(path, { ...options, token });
    }
    throw error;
  }
}

export async function listItems<T>(collection: string, query = "") {
  const result = await adminRequest<DirectusList<T>>(
    `/items/${collection}${query ? `?${query}` : ""}`
  );
  return result.data;
}

export async function getItem<T>(collection: string, id: string | number, query = "") {
  return adminRequest<T>(`/items/${collection}/${id}${query ? `?${query}` : ""}`);
}

export async function createItem<T>(collection: string, body: unknown) {
  const result = await adminRequest<{ data: T }>(`/items/${collection}`, {
    method: "POST",
    body,
  });
  return result.data;
}

export async function updateItem<T>(collection: string, id: string | number, body: unknown) {
  const result = await adminRequest<{ data: T }>(`/items/${collection}/${id}`, {
    method: "PATCH",
    body,
  });
  return result.data;
}

export async function deleteItem(collection: string, id: string | number) {
  await adminRequest(`/items/${collection}/${id}`, { method: "DELETE" });
}

export async function loginDirectus(email: string, password: string) {
  const result = await directusRequest<{ data: AuthTokens }>("/auth/login", {
    method: "POST",
    body: { email, password, mode: "json" },
  });
  return result.data;
}

export async function refreshDirectus(refreshToken: string) {
  const result = await directusRequest<{ data: AuthTokens }>("/auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken, mode: "json" },
  });
  return result.data;
}

export async function fetchCurrentUser(accessToken: string) {
  const result = await directusRequest<{ data: DirectusUser }>(
    "/users/me?fields=id,email,first_name,last_name,status,role.id,role.name",
    { token: accessToken }
  );
  return result.data;
}

export async function fetchUserById(id: string) {
  const result = await adminRequest<{ data: DirectusUser }>(
    `/users/${id}?fields=id,email,first_name,last_name,status,role.id,role.name`
  );
  return result.data;
}

export function directusFileUrl(fileId: string | null | undefined) {
  if (!fileId) return null;
  return `${baseUrl()}/assets/${fileId}`;
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}
