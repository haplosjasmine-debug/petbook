/**
 * PetBook Directus setup.
 *
 * Creates the PostgreSQL-backed Directus schema, relations, roles and access
 * policies used by the Next.js app. Safe to re-run: existing collections,
 * fields, relations and roles are left in place.
 *
 * Usage:
 *   npm run setup   (inside web/)
 *
 * Requires a running Directus instance and admin credentials in the
 * environment (or a local .env file).
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

function loadEnv() {
  const files = [path.resolve(".env"), path.resolve("../.env"), path.resolve("../directus/.env")];
  for (const file of files) {
    try {
      for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith("#")) continue;
        const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
        if (match && process.env[match[1]] === undefined) {
          process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      // Optional file.
    }
  }
}

loadEnv();

const API = (
  process.env.DIRECTUS_URL ||
  process.env.DIRECTUS_PUBLIC_URL ||
  "http://127.0.0.1:8055"
).replace(/\/$/, "");
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

let token = null;
let warnings = 0;

const log = (...args) => console.log(...args);
const warn = (...args) => {
  warnings += 1;
  console.warn("  !", ...args);
};

async function raw(pathname, { method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(`${method} ${pathname} -> ${response.status} ${text}`);
    error.status = response.status;
    error.body = json;
    throw error;
  }

  return json;
}

async function attempt(label, fn) {
  try {
    return await fn();
  } catch (error) {
    warn(`${label}: ${error.message}`);
    return null;
  }
}

async function waitForDirectus() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const response = await fetch(`${API}/server/ping`);
      if (response.ok) return;
    } catch {
      // Keep waiting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Directus is not reachable at ${API}. Start it with "docker compose up -d".`);
}

async function login() {
  if (!EMAIL || !PASSWORD) {
    throw new Error("Set DIRECTUS_ADMIN_EMAIL and DIRECTUS_ADMIN_PASSWORD (or ADMIN_EMAIL/ADMIN_PASSWORD).");
  }
  const response = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, mode: "json" }),
  });
  if (!response.ok) {
    throw new Error(`Directus login failed (${response.status}): ${await response.text()}`);
  }
  const payload = await response.json();
  token = payload?.data?.access_token;
  if (!token) throw new Error("Directus login returned no access token.");
}

async function readCollection(collection) {
  try {
    const result = await raw(`/collections/${collection}`);
    return result.data;
  } catch (error) {
    if (error.status === 404 || error.status === 403) return null;
    throw error;
  }
}

async function ensureCollection(collection, meta) {
  const existing = await readCollection(collection);

  if (existing) {
    if (!existing.schema) {
      await raw(`/collections/${collection}`, { method: "DELETE" });
    } else {
      await attempt(`update meta for ${collection}`, () =>
        raw(`/collections/${collection}`, { method: "PATCH", body: { meta } })
      );
      log(`  = ${collection}`);
      return;
    }
  }

  const created = await attempt(`create collection ${collection}`, () =>
    raw("/collections", { method: "POST", body: { collection, meta, schema: {} } })
  );
  if (created) log(`  + ${collection}`);
}

async function fieldExists(collection, field) {
  try {
    const result = await raw(`/fields/${collection}/${field}`);
    return Boolean(result?.data?.field ?? result?.field);
  } catch (error) {
    if (error.status === 404 || error.status === 403) return false;
    throw error;
  }
}

async function ensureField(collection, field, definition) {
  if (await fieldExists(collection, field)) return;
  const created = await attempt(`create field ${collection}.${field}`, () =>
    raw(`/fields/${collection}`, { method: "POST", body: { field, ...definition } })
  );
  if (created) log(`  + ${collection}.${field}`);
}

async function relationExists(collection, field) {
  try {
    const result = await raw("/relations?limit=-1");
    return Boolean(
      result?.data?.some(
        (relation) => relation.collection === collection && relation.field === field
      )
    );
  } catch (error) {
    if (error.status === 403) return false;
    throw error;
  }
}

async function ensureRelation(collection, field, relatedCollection, onDelete = "SET NULL") {
  if (await relationExists(collection, field)) return;
  const created = await attempt(`create relation ${collection}.${field} -> ${relatedCollection}`, () =>
    raw("/relations", {
      method: "POST",
      body: {
        collection,
        field,
        related_collection: relatedCollection,
        meta: { sort_field: null },
        schema: { on_delete: onDelete },
      },
    })
  );
  if (created) log(`  + relation ${collection}.${field} -> ${relatedCollection}`);
}

const choices = (values) => values.map((value) => ({ text: value, value }));

function textMeta(overrides = {}) {
  return {
    interface: "input",
    options: {},
    display: null,
    display_options: null,
    readonly: false,
    hidden: false,
    sort: null,
    width: "full",
    note: null,
    ...overrides,
  };
}

function stringField(overrides = {}, schema = {}) {
  return { type: "string", schema: { is_nullable: true, ...schema }, meta: textMeta(overrides) };
}

function textField(overrides = {}) {
  return {
    type: "text",
    schema: { is_nullable: true },
    meta: textMeta({ interface: "input-multiline", ...overrides }),
  };
}

function integerField(overrides = {}, schema = {}) {
  return {
    type: "integer",
    schema: { is_nullable: true, ...schema },
    meta: textMeta({ interface: "input", ...overrides }),
  };
}

function booleanField(overrides = {}, schema = {}) {
  return {
    type: "boolean",
    schema: { is_nullable: true, ...schema },
    meta: textMeta({ interface: "boolean", ...overrides }),
  };
}

function decimalField(overrides = {}, schema = {}) {
  return {
    type: "decimal",
    schema: { is_nullable: true, numeric_precision: 12, numeric_scale: 2, ...schema },
    meta: textMeta({ interface: "input", ...overrides }),
  };
}

function coordinateField(overrides = {}, schema = {}) {
  return {
    type: "decimal",
    schema: { is_nullable: true, numeric_precision: 10, numeric_scale: 7, ...schema },
    meta: textMeta({
      interface: "input",
      note: "Used for map discovery and GPS distance sorting.",
      ...overrides,
    }),
  };
}

function datetimeField(overrides = {}, schema = {}) {
  return {
    type: "dateTime",
    schema: { is_nullable: true, ...schema },
    meta: textMeta({ interface: "datetime", display: "datetime", ...overrides }),
  };
}

function createdAtField() {
  return {
    type: "timestamp",
    schema: { is_nullable: true, default_value: "CURRENT_TIMESTAMP" },
    meta: textMeta({
      interface: "datetime",
      special: ["date-created"],
      readonly: true,
      hidden: true,
      width: "half",
    }),
  };
}

function dateField(overrides = {}) {
  return {
    type: "date",
    schema: { is_nullable: true },
    meta: textMeta({ interface: "datetime", display: "datetime", ...overrides }),
  };
}

function relationField(relatedCollection, options = {}) {
  return {
    type: "integer",
    schema: { is_nullable: options.nullable !== false },
    meta: textMeta({
      interface: "select-dropdown-m2o",
      special: ["m2o"],
      options: { template: options.template ?? "{{id}}", filter: options.filter },
      display: "related-values",
      display_options: { template: options.template ?? "{{id}}" },
      width: options.width ?? "half",
      note: options.note,
    }),
  };
}

function userRelationField(note) {
  return {
    type: "uuid",
    schema: { is_nullable: true },
    meta: textMeta({
      interface: "select-dropdown-m2o",
      special: ["m2o"],
      options: { template: "{{first_name}} {{last_name}}" },
      display: "related-values",
      display_options: { template: "{{first_name}} {{last_name}}" },
      width: "half",
      note,
    }),
  };
}

function fileField(note) {
  return {
    type: "uuid",
    schema: { is_nullable: true },
    meta: textMeta({
      interface: "file-image",
      special: ["file"],
      display: "image",
      width: "half",
      note,
    }),
  };
}

function selectField(values, overrides = {}) {
  const { default_value, ...meta } = overrides;
  return stringField(
    {
      interface: "select-dropdown",
      options: { choices: choices(values) },
      ...meta,
    },
    { default_value },
  );
}

const collections = [
  [
    "customers",
    {
      icon: "person",
      note: "Customer profiles linked to Directus users.",
      display_template: "{{first_name}} {{last_name}}",
      sort_field: "first_name",
    },
  ],
  [
    "shops",
    {
      icon: "storefront",
      note: "Grooming and veterinary businesses.",
      display_template: "{{name}}",
      sort_field: "name",
    },
  ],
  [
    "staff",
    {
      icon: "badge",
      note: "Shop staff members.",
      display_template: "{{name}}",
      sort_field: "name",
    },
  ],
  [
    "pets",
    {
      icon: "pets",
      note: "Registered pets.",
      display_template: "{{name}}",
      sort_field: "name",
    },
  ],
  [
    "services",
    {
      icon: "content_cut",
      note: "Bookable shop services.",
      display_template: "{{name}}",
      sort_field: "name",
    },
  ],
  [
    "service_packages",
    {
      icon: "inventory_2",
      note: "Prepaid service packages.",
      display_template: "{{name}}",
      sort_field: "name",
    },
  ],
  [
    "appointments",
    {
      icon: "calendar_month",
      note: "Bookings and their statuses.",
      display_template: "{{qr_code}}",
      sort_field: "-start_at",
    },
  ],
  [
    "transactions",
    {
      icon: "payments",
      note: "Payments, commission and payout status.",
      display_template: "{{id}}",
      sort_field: "-date_created",
    },
  ],
  [
    "commission_payments",
    {
      icon: "account_balance_wallet",
      note: "Online PetBook commission checkouts and settlements.",
      display_template: "{{reference}}",
      sort_field: "-date_created",
    },
  ],
  [
    "loyalty_points",
    {
      icon: "stars",
      note: "Customer loyalty point ledger.",
      display_template: "{{description}}",
      sort_field: "-date_created",
    },
  ],
  [
    "vaccinations",
    {
      icon: "vaccines",
      note: "Vaccination history.",
      display_template: "{{name}}",
      sort_field: "-administered_at",
    },
  ],
  [
    "reminders",
    {
      icon: "sms",
      note: "Reminder queue used by the cron endpoint.",
      display_template: "{{type}} - {{send_at}}",
      sort_field: "send_at",
    },
  ],
  [
    "notifications",
    {
      icon: "notifications",
      note: "In-app, email and SMS notification log.",
      display_template: "{{subject}}",
      sort_field: "-date_created",
    },
  ],
  [
    "announcements",
    {
      icon: "campaign",
      note: "Homepage announcements.",
      display_template: "{{title}}",
      sort_field: "-date_created",
    },
  ],
  [
    "site_content",
    {
      icon: "web",
      note: "Editable marketing copy.",
      display_template: "{{title}}",
      sort_field: "key",
    },
  ],
];

const fieldDefinitions = {
  customers: [
    ["user", userRelationField("Directus account for this customer.")],
    ["first_name", stringField({ sort: 1 }, { is_nullable: false })],
    ["last_name", stringField({ sort: 2 }, { is_nullable: false })],
    ["phone", stringField({ sort: 3, width: "half" })],
    ["loyalty_points", integerField({ sort: 4, width: "half" }, { default_value: 0 })],
    ["date_created", createdAtField()],
  ],
  shops: [
    ["owner", userRelationField("Directus account for the shop owner.")],
    ["name", stringField({ sort: 1 }, { is_nullable: false })],
    ["slug", stringField({ sort: 2, width: "half" }, { is_unique: true })],
    ["description", textField({ sort: 3 })],
    ["address", stringField({ sort: 4 })],
    ["city", stringField({ sort: 5, width: "half" })],
    ["phone", stringField({ sort: 6, width: "half" })],
    ["email", stringField({ sort: 7, width: "half" })],
    ["logo", fileField("Shop logo.")],
    ["cover_image", fileField("Hero image for the public shop page.")],
    ["featured", booleanField({ sort: 8, width: "half" }, { default_value: false })],
    ["active", booleanField({ sort: 9, width: "half" }, { default_value: true })],
    ["commission_rate", decimalField({ sort: 10, width: "half" }, { default_value: 10 })],
    ["timezone", stringField({ sort: 11, width: "half" }, { default_value: "Asia/Manila" })],
    ["latitude", coordinateField({ sort: 12, width: "half" })],
    ["longitude", coordinateField({ sort: 13, width: "half" })],
    ["date_created", createdAtField()],
  ],
  staff: [
    ["shop", relationField("shops", { template: "{{name}}", note: "Shop this staff member belongs to." })],
    ["user", userRelationField("Optional Directus account.")],
    ["name", stringField({ sort: 1 }, { is_nullable: false })],
    [
      "role",
      selectField(["groomer", "vet", "assistant", "manager"], { sort: 2, width: "half" }),
    ],
    ["email", stringField({ sort: 3, width: "half" })],
    ["phone", stringField({ sort: 4, width: "half" })],
    ["bio", textField({ sort: 5 })],
    ["active", booleanField({ sort: 6, width: "half" }, { default_value: true })],
  ],
  pets: [
    ["customer", relationField("customers", { template: "{{first_name}} {{last_name}}", note: "Owner." })],
    ["name", stringField({ sort: 1 }, { is_nullable: false })],
    [
      "species",
      selectField(["dog", "cat", "bird", "rabbit", "other"], { sort: 2, width: "half" }),
    ],
    ["breed", stringField({ sort: 3, width: "half" })],
    ["sex", selectField(["male", "female", "unknown"], { sort: 4, width: "half" })],
    ["birth_date", dateField({ sort: 5, width: "half" })],
    ["weight_kg", decimalField({ sort: 6, width: "half" })],
    ["color", stringField({ sort: 7, width: "half" })],
    ["notes", textField({ sort: 8 })],
    ["photo", fileField("Pet photo.")],
    ["date_created", createdAtField()],
  ],
  services: [
    ["shop", relationField("shops", { template: "{{name}}", note: "Shop offering this service." })],
    ["name", stringField({ sort: 1 }, { is_nullable: false })],
    [
      "category",
      selectField(["grooming", "veterinary", "package"], { sort: 2, width: "half" }),
    ],
    ["duration_min", integerField({ sort: 3, width: "half" }, { default_value: 60 })],
    ["price", decimalField({ sort: 4, width: "half" }, { default_value: 0 })],
    ["description", textField({ sort: 5 })],
    ["active", booleanField({ sort: 6, width: "half" }, { default_value: true })],
  ],
  service_packages: [
    ["shop", relationField("shops", { template: "{{name}}" })],
    ["name", stringField({ sort: 1 }, { is_nullable: false })],
    ["description", textField({ sort: 2 })],
    ["price", decimalField({ sort: 3, width: "half" })],
    ["sessions", integerField({ sort: 4, width: "half" }, { default_value: 1 })],
    ["validity_days", integerField({ sort: 5, width: "half" }, { default_value: 365 })],
    ["active", booleanField({ sort: 6, width: "half" }, { default_value: true })],
  ],
  appointments: [
    ["shop", relationField("shops", { template: "{{name}}" })],
    ["customer", relationField("customers", { template: "{{first_name}} {{last_name}}" })],
    ["pet", relationField("pets", { template: "{{name}}" })],
    ["service", relationField("services", { template: "{{name}}" })],
    ["package", relationField("service_packages", { template: "{{name}}" })],
    ["staff", relationField("staff", { template: "{{name}}" })],
    ["start_at", datetimeField({ sort: 1 })],
    ["end_at", datetimeField({ sort: 2 })],
    [
      "status",
      selectField(
        ["pending", "confirmed", "checked_in", "in_progress", "completed", "cancelled", "no_show"],
        { sort: 3, width: "half", default_value: "pending" }
      ),
    ],
    ["price", decimalField({ sort: 4, width: "half" })],
    ["notes", textField({ sort: 5 })],
    ["qr_code", stringField({ sort: 6, width: "half" }, { is_unique: true })],
    ["checked_in_at", datetimeField({ sort: 7, width: "half" })],
    ["completed_at", datetimeField({ sort: 8, width: "half" })],
    ["date_created", createdAtField()],
  ],
  transactions: [
    ["appointment", relationField("appointments", { template: "{{qr_code}}" })],
    ["shop", relationField("shops", { template: "{{name}}" })],
    ["customer", relationField("customers", { template: "{{first_name}} {{last_name}}" })],
    ["amount", decimalField({ sort: 1, width: "half" })],
    ["commission_rate", decimalField({ sort: 2, width: "half" })],
    ["commission_amount", decimalField({ sort: 3, width: "half" })],
    ["net_amount", decimalField({ sort: 4, width: "half" })],
    [
      "status",
      selectField(["pending", "paid", "refunded"], { sort: 5, width: "half", default_value: "pending" }),
    ],
    [
      "commission_status",
      selectField(["pending", "settled"], { sort: 6, width: "half", default_value: "pending" }),
    ],
    ["provider", stringField({ sort: 7, width: "half" })],
    ["method", stringField({ sort: 8, width: "half" })],
    ["reference", stringField({ sort: 9, width: "half" })],
    ["paid_at", datetimeField({ sort: 10, width: "half" })],
    ["date_created", createdAtField()],
  ],
  commission_payments: [
    ["shop", relationField("shops", { template: "{{name}}", note: "Shop paying PetBook commission." })],
    ["amount", decimalField({ sort: 1, width: "half" })],
    [
      "status",
      selectField(["pending", "paid", "failed"], {
        sort: 2,
        width: "half",
        default_value: "pending",
      }),
    ],
    ["provider", stringField({ sort: 3, width: "half" })],
    ["method", stringField({ sort: 4, width: "half" })],
    ["reference", stringField({ sort: 5, width: "half" })],
    ["checkout_id", stringField({ sort: 6, width: "half" })],
    ["paid_at", datetimeField({ sort: 7, width: "half" })],
    ["date_created", createdAtField()],
  ],
  loyalty_points: [
    ["customer", relationField("customers", { template: "{{first_name}} {{last_name}}" })],
    ["appointment", relationField("appointments", { template: "{{qr_code}}" })],
    ["points", integerField({ sort: 1, width: "half" })],
    [
      "type",
      selectField(["earned", "redeemed", "adjustment"], { sort: 2, width: "half" }),
    ],
    ["description", stringField({ sort: 3 })],
    ["date_created", createdAtField()],
  ],
  vaccinations: [
    ["pet", relationField("pets", { template: "{{name}}" })],
    ["shop", relationField("shops", { template: "{{name}}" })],
    ["staff", relationField("staff", { template: "{{name}}" })],
    ["name", stringField({ sort: 1 }, { is_nullable: false })],
    ["administered_at", datetimeField({ sort: 2, width: "half" })],
    ["next_due_at", datetimeField({ sort: 3, width: "half" })],
    ["lot_number", stringField({ sort: 4, width: "half" })],
    ["notes", textField({ sort: 5 })],
  ],
  reminders: [
    ["appointment", relationField("appointments", { template: "{{qr_code}}" })],
    ["type", selectField(["upcoming", "follow_up", "vaccination"], { sort: 1, width: "half" })],
    ["send_at", datetimeField({ sort: 2, width: "half" })],
    [
      "status",
      selectField(["scheduled", "sent", "failed", "cancelled"], {
        sort: 3,
        width: "half",
        default_value: "scheduled",
      }),
    ],
    ["channel", stringField({ sort: 4, width: "half" }, { default_value: "email" })],
    ["message", textField({ sort: 5 })],
    ["sent_at", datetimeField({ sort: 6, width: "half" })],
  ],
  notifications: [
    ["customer", relationField("customers", { template: "{{first_name}} {{last_name}}" })],
    ["shop", relationField("shops", { template: "{{name}}" })],
    ["appointment", relationField("appointments", { template: "{{qr_code}}" })],
    ["channel", selectField(["email", "sms", "system"], { sort: 1, width: "half" })],
    ["recipient", stringField({ sort: 2, width: "half" })],
    ["subject", stringField({ sort: 3 })],
    ["body", textField({ sort: 4 })],
    ["status", stringField({ sort: 5, width: "half" }, { default_value: "sent" })],
    ["provider", stringField({ sort: 6, width: "half" })],
    ["sent_at", datetimeField({ sort: 7, width: "half" })],
    ["date_created", createdAtField()],
  ],
  announcements: [
    ["title", stringField({ sort: 1 }, { is_nullable: false })],
    ["body", textField({ sort: 2 })],
    ["image", fileField("Optional announcement image.")],
    ["starts_at", datetimeField({ sort: 3, width: "half" })],
    ["ends_at", datetimeField({ sort: 4, width: "half" })],
    ["published", booleanField({ sort: 5, width: "half" }, { default_value: true })],
    ["date_created", createdAtField()],
  ],
  site_content: [
    ["key", stringField({ sort: 1 }, { is_unique: true })],
    ["title", stringField({ sort: 2 })],
    ["body", textField({ sort: 3 })],
    ["image", fileField("Optional supporting image.")],
    ["published", booleanField({ sort: 4, width: "half" }, { default_value: true })],
  ],
};

const relations = [
  ["customers", "user", "directus_users"],
  ["shops", "owner", "directus_users"],
  ["shops", "logo", "directus_files"],
  ["shops", "cover_image", "directus_files"],
  ["staff", "shop", "shops"],
  ["staff", "user", "directus_users"],
  ["pets", "customer", "customers"],
  ["pets", "photo", "directus_files"],
  ["services", "shop", "shops"],
  ["service_packages", "shop", "shops"],
  ["appointments", "shop", "shops"],
  ["appointments", "customer", "customers"],
  ["appointments", "pet", "pets"],
  ["appointments", "service", "services"],
  ["appointments", "package", "service_packages"],
  ["appointments", "staff", "staff"],
  ["transactions", "appointment", "appointments"],
  ["transactions", "shop", "shops"],
  ["transactions", "customer", "customers"],
  ["commission_payments", "shop", "shops"],
  ["loyalty_points", "customer", "customers"],
  ["loyalty_points", "appointment", "appointments"],
  ["vaccinations", "pet", "pets"],
  ["vaccinations", "shop", "shops"],
  ["vaccinations", "staff", "staff"],
  ["reminders", "appointment", "appointments"],
  ["notifications", "customer", "customers"],
  ["notifications", "shop", "shops"],
  ["notifications", "appointment", "appointments"],
  ["announcements", "image", "directus_files"],
  ["site_content", "image", "directus_files"],
];

async function ensureRole(name, icon) {
  const existing = await raw(`/roles?filter[name][_eq]=${encodeURIComponent(name)}&limit=1`);
  if (existing.data[0]) return existing.data[0].id;

  const created = await attempt(`create role ${name}`, () =>
    raw("/roles", {
      method: "POST",
      body: {
        name,
        icon,
        description: `PetBook ${name} role.`,
        app_access: true,
        admin_access: false,
        enforce_tfa: false,
      },
    })
  );
  if (created) log(`  + role ${name}`);
  return created?.data?.id ?? null;
}

async function ensurePolicy(name) {
  const existing = await raw(`/policies?filter[name][_eq]=${encodeURIComponent(name)}&limit=1`);
  if (existing.data[0]) return existing.data[0].id;

  const created = await attempt(`create policy ${name}`, () =>
    raw("/policies", {
      method: "POST",
      body: {
        name,
        icon: "verified_user",
        description: `PetBook ${name} policy.`,
        admin_access: false,
        app_access: true,
        enforce_tfa: false,
      },
    })
  );
  if (created) log(`  + policy ${name}`);
  return created?.data?.id ?? null;
}

async function ensureAccess(role, policy) {
  if (!role || !policy) return;
  const existing = await raw(
    `/access?filter[role][_eq]=${role}&filter[policy][_eq]=${policy}&limit=1`
  );
  if (existing.data[0]) return;
  await attempt("create role access", () =>
    raw("/access", { method: "POST", body: { role, policy, user: null, sort: null } })
  );
}

async function ensurePermission(policy, collection, action, permissions = null, options = {}) {
  if (!policy) return;
  const filter = `filter[policy][_eq]=${policy}&filter[collection][_eq]=${encodeURIComponent(
    collection
  )}&filter[action][_eq]=${action}&limit=1`;
  const existing = await raw(`/permissions?${filter}`);

  const body = {
    policy,
    collection,
    action,
    permissions,
    validation: options.validation ?? null,
    presets: options.presets ?? null,
    fields: options.fields ?? ["*"],
  };

  if (existing.data[0]) {
    await attempt(`update permission ${action} ${collection}`, () =>
      raw(`/permissions/${existing.data[0].id}`, { method: "PATCH", body })
    );
    return;
  }

  await attempt(`permission ${action} ${collection}`, () =>
    raw("/permissions", { method: "POST", body })
  );
}

async function setupPolicies() {
  const customerRole = await ensureRole("Customer", "person");
  const shopRole = await ensureRole("Shop Owner", "storefront");
  const customerPolicy = await ensurePolicy("Customer");
  const shopPolicy = await ensurePolicy("Shop Owner");

  await ensureAccess(customerRole, customerPolicy);
  await ensureAccess(shopRole, shopPolicy);

  const currentUser = { id: { _eq: "$CURRENT_USER" } };
  await ensurePermission(customerPolicy, "directus_users", "read", currentUser, {
    fields: ["id", "first_name", "last_name", "email"],
  });
  await ensurePermission(customerPolicy, "customers", "read", {
    user: { _eq: "$CURRENT_USER" },
  });
  await ensurePermission(customerPolicy, "customers", "update", {
    user: { _eq: "$CURRENT_USER" },
  });
  await ensurePermission(customerPolicy, "pets", "read", {
    customer: { user: { _eq: "$CURRENT_USER" } },
  });
  await ensurePermission(customerPolicy, "appointments", "read", {
    customer: { user: { _eq: "$CURRENT_USER" } },
  });
  await ensurePermission(customerPolicy, "loyalty_points", "read", {
    customer: { user: { _eq: "$CURRENT_USER" } },
  });
  await ensurePermission(customerPolicy, "notifications", "read", {
    customer: { user: { _eq: "$CURRENT_USER" } },
  });
  for (const collection of ["shops", "services", "service_packages", "announcements", "site_content"]) {
    await ensurePermission(customerPolicy, collection, "read");
  }

  const scoped = { shop: { owner: { _eq: "$CURRENT_USER" } } };
  const presets = { shop: { owner: { _eq: "$CURRENT_USER" } } };
  const ownShop = { owner: { _eq: "$CURRENT_USER" } };

  await ensurePermission(shopPolicy, "directus_users", "read", currentUser, {
    fields: ["id", "first_name", "last_name", "email"],
  });
  await ensurePermission(shopPolicy, "shops", "read", ownShop);
  await ensurePermission(shopPolicy, "shops", "update", ownShop);
  for (const collection of [
    "staff",
    "services",
    "service_packages",
    "appointments",
    "transactions",
    "vaccinations",
    "reminders",
    "notifications",
  ]) {
    await ensurePermission(shopPolicy, collection, "read", scoped);
    await ensurePermission(shopPolicy, collection, "create", null, { presets });
    await ensurePermission(shopPolicy, collection, "update", scoped);
    await ensurePermission(shopPolicy, collection, "delete", scoped);
  }
  for (const collection of ["customers", "pets", "loyalty_points"]) {
    await ensurePermission(shopPolicy, collection, "read");
  }
  await ensurePermission(shopPolicy, "commission_payments", "read", scoped);
}

async function main() {
  log(`\nPetBook Directus setup -> ${API}\n`);
  await waitForDirectus();
  await login();

  log("\nCollections");
  for (const [collection, meta] of collections) {
    await ensureCollection(collection, meta);
  }

  log("\nFields");
  for (const [collection, definitions] of Object.entries(fieldDefinitions)) {
    for (const [field, definition] of definitions) {
      await ensureField(collection, field, definition);
    }
  }

  log("\nRelations");
  for (const [collection, field, related] of relations) {
    await ensureRelation(collection, field, related);
  }

  log("\nRoles and policies");
  await setupPolicies();

  log("\nClearing Directus caches");
  await attempt("clear cache", () => raw("/utils/cache/clear", { method: "POST" }));

  log(`\nDone.${warnings ? ` ${warnings} warning(s) — see above.` : ""}`);
  log(`Log in at ${API} with ${EMAIL}\n`);
}

main().catch((error) => {
  console.error("\nSetup failed:", error.message);
  if (error.body) console.error(JSON.stringify(error.body, null, 2));
  process.exit(1);
});
