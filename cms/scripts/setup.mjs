/**
 * PetBook Directus setup.
 *
 * The Laravel backend owns the MySQL schema. This script registers those
 * existing tables as Directus collections, wires up relations and custom
 * fields on directus_users, creates the Pet Owner / Business Owner roles with
 * scoped permissions, and installs the appointment -> Laravel webhook flow.
 *
 * Directus 12 restricts custom permission rules behind a license, so the
 * scoped permissions and relation metadata are written straight to the shared
 * database. Restart Directus (`npm start`) after running this script.
 *
 * Usage: npm run setup   (run inside the cms/ folder)
 */

import path from 'node:path';
import process from 'node:process';
import mysql from 'mysql2/promise';

try {
  process.loadEnvFile(path.resolve('.env'));
} catch {
  const { readFileSync } = await import('node:fs');
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
}

const API = (process.env.DIRECTUS_URL || process.env.PUBLIC_URL || 'http://localhost:8055').replace(/\/$/, '');
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const LARAVEL_URL = (process.env.PETBOOK_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const WEBHOOK_SECRET = process.env.PETBOOK_WEBHOOK_SECRET || 'dev-directus-webhook-secret';

let token = null;
let db = null;
let warnings = 0;

const log = (...args) => console.log(...args);
const warn = (...args) => {
  warnings++;
  console.warn('  !', ...args);
};

async function raw(path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
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
    const error = new Error(`${method} ${path} -> ${response.status} ${text}`);
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

async function connectDatabase() {
  db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'petbook',
  });
}

async function rows(sql, params = []) {
  const [result] = await db.query(sql, params);
  return result;
}

async function login() {
  const response = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, mode: 'json' }),
  });

  if (!response.ok) {
    throw new Error(`Directus login failed (${response.status}): ${await response.text()}`);
  }

  const payload = await response.json();
  token = payload?.data?.access_token;

  if (!token) throw new Error('Directus login returned no access token.');
}

async function waitForDirectus() {
  for (let i = 0; i < 40; i++) {
    try {
      const response = await fetch(`${API}/server/ping`);
      if (response.ok) return;
    } catch {
      // keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Directus is not reachable at ${API}. Start it with "npm start" first.`);
}

const collections = [
  ['users', { icon: 'person', note: 'PetBook app users (managed by Laravel).', display_template: '{{first_name}} {{last_name}}' }],
  ['businesses', { icon: 'storefront', note: 'Grooming / veterinary businesses.', display_template: '{{name}}' }],
  ['staff', { icon: 'badge', note: 'Business staff members.', display_template: '{{name}}' }],
  ['pets', { icon: 'pets', note: 'Registered pets.', display_template: '{{name}}' }],
  ['services', { icon: 'content_cut', note: 'Bookable services.', display_template: '{{name}}' }],
  ['service_packages', { icon: 'inventory_2', note: 'Prepaid service bundles.', display_template: '{{name}}' }],
  ['package_purchases', { icon: 'shopping_bag', note: 'Purchased packages.', display_template: '{{id}}' }],
  ['appointments', { icon: 'calendar_month', note: 'Bookings and their statuses.', display_template: '{{id}} - {{start_at}}' }],
  ['transactions', { icon: 'payments', note: 'Completed sales and commission.', display_template: '{{id}}' }],
  ['loyalty_transactions', { icon: 'stars', note: 'Loyalty point ledger.', display_template: '{{description}}' }],
  ['vaccinations', { icon: 'vaccines', note: 'Vaccination history.', display_template: '{{name}}' }],
  ['medical_records', { icon: 'medical_information', note: 'Medical and grooming notes.', display_template: '{{title}}' }],
  ['reminders', { icon: 'sms', note: 'SMS reminder queue.', display_template: '{{type}} - {{send_at}}' }],
];

async function ensureCollection(collection, meta) {
  const query = new URLSearchParams({ fields: 'collection' });
  const existing = await attempt(`read collection ${collection}`, () => raw(`/collections/${collection}?${query}`));

  if (existing) {
    await attempt(`update meta for ${collection}`, () =>
      raw(`/collections/${collection}`, { method: 'PATCH', body: { meta } })
    );
    log(`  = ${collection}`);
    return;
  }

  const created = await attempt(`register collection ${collection}`, () =>
    raw('/collections', { method: 'POST', body: { collection, meta } })
  );

  if (created) log(`  + ${collection}`);
}

async function fieldExists(collection, field) {
  const result = await rows(
    'SELECT 1 FROM directus_fields WHERE collection = ? AND field = ? LIMIT 1',
    [collection, field]
  );
  return result.length > 0;
}

async function ensureDirectusField(collection, field, definition = {}) {
  const existing = await rows(
    'SELECT 1 FROM directus_fields WHERE collection = ? AND field = ? LIMIT 1',
    [collection, field]
  );

  if (existing.length > 0) return;

  await rows(
    `INSERT INTO directus_fields
       (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, note, searchable)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      collection,
      field,
      definition.special || null,
      definition.interface || 'input',
      definition.options ? JSON.stringify(definition.options) : null,
      definition.display || null,
      definition.display_options ? JSON.stringify(definition.display_options) : null,
      definition.readonly ? 1 : 0,
      definition.hidden ? 1 : 0,
      definition.sort || null,
      definition.width || 'full',
      definition.note || null,
      definition.searchable === false ? 0 : 1,
    ]
  );

  log(`  + ${collection}.${field}`);
}

async function ensureField(collection, field, definition) {
  if (await fieldExists(collection, field)) return;

  const created = await attempt(`create field ${collection}.${field}`, () =>
    raw('/fields/' + collection, { method: 'POST', body: { field, ...definition } })
  );

  if (created) log(`  + ${collection}.${field}`);
}

async function relationExists(collection, field) {
  const result = await rows(
    'SELECT 1 FROM directus_relations WHERE many_collection = ? AND many_field = ? LIMIT 1',
    [collection, field]
  );
  return result.length > 0;
}

async function ensureRelation(collection, field, relatedCollection) {
  if (await relationExists(collection, field)) return;

  await attempt(`create relation ${collection}.${field} -> ${relatedCollection}`, () =>
    rows(
      `INSERT INTO directus_relations
         (many_collection, many_field, one_collection, one_field, one_deselect_action)
       VALUES (?, ?, ?, NULL, 'nullify')`,
      [collection, field, relatedCollection]
    )
  );

  log(`  + relation ${collection}.${field} -> ${relatedCollection}`);
}

async function ensureForeignKey(table, column) {
  const result = await rows(
    `SELECT 1 FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1`,
    [table, column]
  );

  if (result.length > 0) return;

  const target = table === 'directus_users' && column === 'app_user' ? 'users' : 'businesses';
  const name = `${table}_${column}_petbook_foreign`;

  await attempt(`create FK ${table}.${column}`, () =>
    rows(
      `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${name}\`
        FOREIGN KEY (\`${column}\`) REFERENCES \`${target}\`(id) ON DELETE SET NULL`
    )
  );
}

async function ensureRole(name, icon) {
  const existing = await rows('SELECT id FROM directus_roles WHERE name = ? LIMIT 1', [name]);
  if (existing.length > 0) return existing[0].id;

  const created = await attempt(`create role ${name}`, () =>
    raw('/roles', {
      method: 'POST',
      body: { name, icon, description: `PetBook ${name} role.`, app_access: true, admin_access: false, ip_access: null, enforce_tfa: false },
    })
  );

  if (created) log(`  + role ${name}`);
  return created?.data?.id ?? null;
}

async function ensurePolicy(name) {
  const existing = await rows('SELECT id FROM directus_policies WHERE name = ? LIMIT 1', [name]);
  if (existing.length > 0) return existing[0].id;

  const created = await attempt(`create policy ${name}`, () =>
    raw('/policies', {
      method: 'POST',
      body: { name, icon: 'verified_user', description: `PetBook ${name} policy.`, admin_access: false, app_access: true, enforce_tfa: false },
    })
  );

  if (created) log(`  + policy ${name}`);
  return created?.data?.id ?? null;
}

async function ensureAccess(roleId, policyId) {
  if (!roleId || !policyId) return;

  const existing = await rows(
    'SELECT 1 FROM directus_access WHERE role = ? AND policy = ? LIMIT 1',
    [roleId, policyId]
  );

  if (existing.length > 0) return;

  await rows('INSERT INTO directus_access (id, role, user, policy, sort) VALUES (UUID(), ?, NULL, ?, NULL)', [
    roleId,
    policyId,
  ]);
}

async function ensurePermission(policy, collection, action, permissions = null, options = {}) {
  const values = [
    permissions ? JSON.stringify(permissions) : null,
    options.validation ? JSON.stringify(options.validation) : null,
    options.presets ? JSON.stringify(options.presets) : null,
    options.fields || '*',
  ];

  const existing = await rows(
    'SELECT id FROM directus_permissions WHERE policy = ? AND collection = ? AND action = ? LIMIT 1',
    [policy, collection, action]
  );

  if (existing.length > 0) {
    await rows(
      `UPDATE directus_permissions
          SET permissions = ?, validation = ?, presets = ?, fields = ?
        WHERE id = ?`,
      [...values, existing[0].id]
    );
    return;
  }

  await attempt(`permission ${action} ${collection}`, () =>
    rows(
      `INSERT INTO directus_permissions
         (collection, action, permissions, validation, presets, fields, policy)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [collection, action, ...values, policy]
    )
  );
}

async function ensureFlow() {
  const existing = await rows('SELECT 1 FROM directus_flows WHERE name = ? LIMIT 1', [
    'PetBook appointment sync',
  ]);
  if (existing.length > 0) return;

  const operation = (type) => ({
    name: 'Notify Laravel',
    key: 'notify-laravel',
    type,
    position_x: 19,
    position_y: 1,
    options: {
      url: `${LARAVEL_URL}/api/webhooks/directus`,
      method: 'POST',
      headers: [
        { header: 'Content-Type', value: 'application/json' },
        { header: 'X-Directus-Secret', value: WEBHOOK_SECRET },
      ],
      body: '{"collection":"appointments","keys":["{{$trigger.key}}"]}',
      is_json: true,
    },
  });

  const payload = (type) => ({
    name: 'PetBook appointment sync',
    icon: 'sync',
    color: null,
    description: 'Calls the Laravel API after appointments change so commission, loyalty and reminders stay in sync.',
    status: 'active',
    trigger: 'event',
    accountability: 'all',
    options: { type: 'action', scope: ['items.create', 'items.update'], collections: ['appointments'] },
    operations: [operation(type)],
  });

  let created = await attempt('create appointment webhook flow', () =>
    raw('/flows', { method: 'POST', body: payload('webhook') })
  );

  if (!created) {
    created = await attempt('create appointment webhook flow (request operation)', () =>
      raw('/flows', { method: 'POST', body: payload('request') })
    );
  }

  if (created) log('  + flow PetBook appointment sync');
}

async function main() {
  log(`\nPetBook Directus setup -> ${API}\n`);
  await connectDatabase();
  await waitForDirectus();
  await login();

  log('\nCollections');
  for (const [collection, meta] of collections) {
    await ensureCollection(collection, meta);
  }

  log('\nDirectus user fields');
  await ensureField('directus_users', 'business', {
    type: 'bigInteger',
    meta: {
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      options: { template: '{{name}}' },
      display: 'related-values',
      display_options: { template: '{{name}}' },
      width: 'half',
      note: 'Business this CMS account belongs to.',
    },
    schema: {},
  });

  await ensureField('directus_users', 'app_role', {
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      options: {
        choices: [
          { text: 'Pet Owner', value: 'owner' },
          { text: 'Business Owner', value: 'business' },
          { text: 'Admin', value: 'admin' },
        ],
      },
      width: 'half',
      note: 'Mirror of the Laravel user role.',
    },
    schema: { default_value: 'owner' },
  });

  await ensureField('directus_users', 'app_user', {
    type: 'bigInteger',
    meta: {
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      options: { template: '{{first_name}} {{last_name}}' },
      display: 'related-values',
      display_options: { template: '{{first_name}} {{last_name}}' },
      width: 'half',
      note: 'Laravel users.id for this CMS account.',
    },
    schema: {},
  });

  await attempt('normalise directus_users FK column types', () =>
    rows('ALTER TABLE directus_users MODIFY business BIGINT UNSIGNED NULL, MODIFY app_user BIGINT UNSIGNED NULL')
  );
  await ensureForeignKey('directus_users', 'business');
  await ensureForeignKey('directus_users', 'app_user');

  log('\nTransaction payment fields');
  await ensureDirectusField('transactions', 'payment_provider', {
    interface: 'select-dropdown',
    options: { choices: ['paymongo', 'cash'].map((value) => ({ text: value, value })) },
    width: 'half',
    sort: 10,
    note: 'Online gateway or cash.',
  });
  await ensureDirectusField('transactions', 'payment_method', {
    interface: 'select-dropdown',
    options: {
      choices: ['gcash', 'maya', 'grab_pay', 'qrph', 'card', 'cash'].map((value) => ({ text: value, value })),
    },
    width: 'half',
    sort: 11,
    note: 'GCash, Maya, GrabPay, QR Ph, card or cash.',
  });
  await ensureDirectusField('transactions', 'payment_status', {
    interface: 'select-dropdown',
    options: {
      choices: ['unpaid', 'pending', 'paid', 'failed', 'refunded'].map((value) => ({ text: value, value })),
    },
    width: 'half',
    sort: 12,
  });
  await ensureDirectusField('transactions', 'payment_reference', {
    interface: 'input',
    width: 'half',
    sort: 13,
    note: 'Provider payment id or cash receipt number.',
  });
  await ensureDirectusField('transactions', 'checkout_session_id', {
    interface: 'input',
    readonly: true,
    width: 'half',
    sort: 14,
  });
  await ensureDirectusField('transactions', 'checkout_url', {
    interface: 'input',
    readonly: true,
    sort: 15,
  });
  await ensureDirectusField('transactions', 'payment_paid_at', {
    interface: 'datetime',
    display: 'datetime',
    width: 'half',
    sort: 16,
  });
  await ensureDirectusField('transactions', 'payment_payload', {
    special: 'cast-json',
    interface: 'input-code',
    options: { language: 'json' },
    sort: 17,
  });

  log('\nRelations');
  const relations = [
    ['directus_users', 'business', 'businesses'],
    ['directus_users', 'app_user', 'users'],
    ['businesses', 'owner_id', 'users'],
    ['staff', 'business_id', 'businesses'],
    ['staff', 'user_id', 'users'],
    ['pets', 'owner_id', 'users'],
    ['services', 'business_id', 'businesses'],
    ['service_packages', 'business_id', 'businesses'],
    ['package_purchases', 'service_package_id', 'service_packages'],
    ['package_purchases', 'business_id', 'businesses'],
    ['package_purchases', 'owner_id', 'users'],
    ['package_purchases', 'pet_id', 'pets'],
    ['appointments', 'business_id', 'businesses'],
    ['appointments', 'owner_id', 'users'],
    ['appointments', 'pet_id', 'pets'],
    ['appointments', 'staff_id', 'staff'],
    ['appointments', 'service_id', 'services'],
    ['appointments', 'package_purchase_id', 'package_purchases'],
    ['transactions', 'business_id', 'businesses'],
    ['transactions', 'owner_id', 'users'],
    ['transactions', 'appointment_id', 'appointments'],
    ['transactions', 'package_purchase_id', 'package_purchases'],
    ['loyalty_transactions', 'user_id', 'users'],
    ['loyalty_transactions', 'appointment_id', 'appointments'],
    ['loyalty_transactions', 'package_purchase_id', 'package_purchases'],
    ['vaccinations', 'pet_id', 'pets'],
    ['medical_records', 'pet_id', 'pets'],
    ['medical_records', 'business_id', 'businesses'],
    ['medical_records', 'appointment_id', 'appointments'],
    ['medical_records', 'staff_id', 'staff'],
    ['reminders', 'appointment_id', 'appointments'],
    ['reminders', 'vaccination_id', 'vaccinations'],
    ['reminders', 'user_id', 'users'],
  ];

  for (const [collection, field, related] of relations) {
    await ensureRelation(collection, field, related);
  }

  log('\nRoles and policies');
  const ownerRole = await ensureRole('Pet Owner', 'person');
  const businessRole = await ensureRole('Business Owner', 'storefront');
  const ownerPolicy = await ensurePolicy('Pet Owner');
  const businessPolicy = await ensurePolicy('Business Owner');
  await ensureAccess(ownerRole, ownerPolicy);
  await ensureAccess(businessRole, businessPolicy);

  const basicFields = 'id,first_name,last_name,email,phone,role,active';

  if (ownerPolicy) {
    log('\nPet Owner permissions');

    const ownUser = { user_id: { _eq: '$CURRENT_USER.app_user' } };

    await ensurePermission(ownerPolicy, 'users', 'read', { id: { _eq: '$CURRENT_USER.app_user' } }, { fields: basicFields });
    await ensurePermission(ownerPolicy, 'pets', 'read', { owner_id: { _eq: '$CURRENT_USER.app_user' } });
    await ensurePermission(ownerPolicy, 'pets', 'create', null, { presets: { owner_id: '$CURRENT_USER.app_user' } });
    await ensurePermission(ownerPolicy, 'pets', 'update', { owner_id: { _eq: '$CURRENT_USER.app_user' } });
    await ensurePermission(ownerPolicy, 'pets', 'delete', { owner_id: { _eq: '$CURRENT_USER.app_user' } });

    await ensurePermission(ownerPolicy, 'appointments', 'read', { owner_id: { _eq: '$CURRENT_USER.app_user' } });
    await ensurePermission(ownerPolicy, 'appointments', 'create', null, {
      presets: { owner_id: '$CURRENT_USER.app_user' },
    });
    await ensurePermission(ownerPolicy, 'appointments', 'update', { owner_id: { _eq: '$CURRENT_USER.app_user' } });

    await ensurePermission(ownerPolicy, 'vaccinations', 'read');
    await ensurePermission(ownerPolicy, 'medical_records', 'read');
    await ensurePermission(ownerPolicy, 'loyalty_transactions', 'read', ownUser);
    await ensurePermission(ownerPolicy, 'transactions', 'read', { owner_id: { _eq: '$CURRENT_USER.app_user' } });
    await ensurePermission(ownerPolicy, 'package_purchases', 'read', { owner_id: { _eq: '$CURRENT_USER.app_user' } });
    await ensurePermission(ownerPolicy, 'reminders', 'read', { user_id: { _eq: '$CURRENT_USER.app_user' } });

    for (const collection of ['businesses', 'services', 'service_packages']) {
      await ensurePermission(ownerPolicy, collection, 'read');
    }
  }

  if (businessPolicy) {
    log('\nBusiness Owner permissions');

    const scoped = { business_id: { _eq: '$CURRENT_USER.business' } };
    const presets = { business_id: '$CURRENT_USER.business' };

    for (const collection of ['appointments', 'transactions', 'package_purchases', 'medical_records']) {
      await ensurePermission(businessPolicy, collection, 'read', scoped);
      await ensurePermission(businessPolicy, collection, 'create', null, { presets });
      await ensurePermission(businessPolicy, collection, 'update', scoped);
      await ensurePermission(businessPolicy, collection, 'delete', scoped);
    }

    for (const collection of ['services', 'staff', 'service_packages']) {
      await ensurePermission(businessPolicy, collection, 'read', scoped);
      await ensurePermission(businessPolicy, collection, 'create', null, { presets });
      await ensurePermission(businessPolicy, collection, 'update', scoped);
      await ensurePermission(businessPolicy, collection, 'delete', scoped);
    }

    await ensurePermission(businessPolicy, 'businesses', 'read', { id: { _eq: '$CURRENT_USER.business' } });
    await ensurePermission(businessPolicy, 'businesses', 'update', { id: { _eq: '$CURRENT_USER.business' } });
    await ensurePermission(businessPolicy, 'pets', 'read');
    await ensurePermission(businessPolicy, 'users', 'read', null, { fields: basicFields });
    await ensurePermission(businessPolicy, 'reminders', 'read');
  }

  log('\nAutomation');
  await ensureFlow();

  log('\nClearing Directus caches');
  await attempt('clear cache', () => raw('/utils/cache/clear', { method: 'POST' }));

  log(`\nDone.${warnings ? ` ${warnings} warning(s) — see above.` : ''}`);
  log('Restart Directus to pick up schema changes: npm start');
  log('Log in at ' + API + ' with ' + EMAIL + '\n');

  await db.end();
}

main().catch(async (error) => {
  console.error('\nSetup failed:', error.message);
  if (error.body) console.error(JSON.stringify(error.body, null, 2));
  if (db) await db.end().catch(() => {});
  process.exit(1);
});
