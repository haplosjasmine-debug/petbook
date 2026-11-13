/**
 * PetBook demo data.
 *
 * Creates three shops, customer and staff accounts, services, pets, bookings,
 * transactions and homepage content. Safe to re-run: records are matched by
 * slug, email, QR code, service name and content key.
 *
 * Demo password for every account: PetBook123!
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
const DEMO_PASSWORD = "PetBook123!";
const COMMISSION_RATE = 10;

let token = null;

async function raw(pathname, { method = "GET", body } = {}) {
  const response = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  throw new Error(`Directus is not reachable at ${API}. Start it first.`);
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

async function first(collection, filter) {
  const query = new URLSearchParams({ filter: JSON.stringify(filter), limit: "1" });
  const result = await raw(`/items/${collection}?${query}`);
  return result.data[0] ?? null;
}

async function create(collection, body) {
  const result = await raw(`/items/${collection}`, { method: "POST", body });
  return result.data;
}

async function update(collection, id, body) {
  const result = await raw(`/items/${collection}/${id}`, { method: "PATCH", body });
  return result.data;
}

async function ensure(collection, filter, body) {
  const existing = await first(collection, filter);
  if (existing) return existing;
  return create(collection, body);
}

async function roleId(name) {
  const result = await raw(`/roles?filter[name][_eq]=${encodeURIComponent(name)}&limit=1`);
  if (!result.data[0]) throw new Error(`Missing Directus role "${name}". Run npm run setup first.`);
  return result.data[0].id;
}

async function ensureUser({ email, first_name, last_name, role, password = DEMO_PASSWORD }) {
  const result = await raw(`/users?filter[email][_eq]=${encodeURIComponent(email)}&limit=1`);
  const existing = result.data[0];
  if (existing) return existing;
  const created = await raw("/users", {
    method: "POST",
    body: {
      email,
      password,
      first_name,
      last_name,
      role,
      status: "active",
      email_notifications: false,
    },
  });
  return created.data;
}

async function ensureCustomer(user, phone) {
  return ensure(
    "customers",
    { user: { _eq: user.id } },
    {
      user: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone,
      loyalty_points: 0,
    }
  );
}

async function ensureShop(owner, body) {
  const existing = await first("shops", { slug: { _eq: body.slug } });
  if (existing) return update("shops", existing.id, { ...body, owner: owner.id });
  return create("shops", { ...body, owner: owner.id });
}

async function ensureStaff(shop, body) {
  const existing = await first("staff", { shop: { _eq: shop.id }, name: { _eq: body.name } });
  if (existing) return update("staff", existing.id, { ...body, shop: shop.id });
  return create("staff", { ...body, shop: shop.id });
}

async function ensureService(shop, body) {
  return ensure(
    "services",
    { shop: { _eq: shop.id }, name: { _eq: body.name } },
    { ...body, shop: shop.id }
  );
}

async function ensureGallery(shop, body) {
  return ensure(
    "shop_gallery",
    { shop: { _eq: shop.id }, image_url: { _eq: body.image_url } },
    { ...body, shop: shop.id }
  );
}

async function ensureReview(shop, customer, service, rating, comment) {
  return ensure(
    "reviews",
    {
      shop: { _eq: shop.id },
      customer: { _eq: customer.id },
      ...(service ? { service: { _eq: service.id } } : { service: { _null: true } }),
    },
    {
      shop: shop.id,
      customer: customer.id,
      service: service?.id ?? null,
      rating,
      comment,
      active: true,
    }
  );
}

async function ensurePet(customer, body) {
  return ensure(
    "pets",
    { customer: { _eq: customer.id }, name: { _eq: body.name } },
    { ...body, customer: customer.id }
  );
}

function at(dayOffset, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

async function ensureShopCustomer(shop, customer) {
  return ensure(
    "shop_customers",
    { shop: { _eq: shop.id }, customer: { _eq: customer.id } },
    { shop: shop.id, customer: customer.id }
  );
}

async function ensureAppointment({
  qr,
  shop,
  customer,
  pet,
  service,
  staff,
  start,
  end,
  status,
  price,
  notes = null,
  checkedInAt = null,
  completedAt = null,
}) {
  const appointment = await ensure(
    "appointments",
    { qr_code: { _eq: qr } },
    {
      shop: shop.id,
      customer: customer.id,
      pet: pet.id,
      service: service.id,
      staff: staff?.id ?? null,
      start_at: start,
      end_at: end,
      status,
      price,
      notes,
      qr_code: qr,
      checked_in_at: checkedInAt,
      completed_at: completedAt,
    }
  );
  await ensureShopCustomer(shop, customer);
  return appointment;
}

async function ensureTransaction(appointment, shop, customer, amount, { paid = true } = {}) {
  const commission = Number((amount * (COMMISSION_RATE / 100)).toFixed(2));
  const net = Number((amount - commission).toFixed(2));
  return ensure(
    "transactions",
    { appointment: { _eq: appointment.id } },
    {
      appointment: appointment.id,
      shop: shop.id,
      customer: customer.id,
      amount,
      commission_rate: COMMISSION_RATE,
      commission_amount: commission,
      net_amount: net,
      status: paid ? "paid" : "pending",
      commission_status: paid ? "pending" : "pending",
      provider: "cash",
      method: "cash",
      reference: `DEMO-${appointment.qr_code}`,
      paid_at: paid ? appointment.completed_at ?? appointment.start_at : null,
    }
  );
}

async function main() {
  console.log(`\nPetBook demo seed -> ${API}\n`);
  await waitForDirectus();
  await login();

  const customerRole = await roleId("Customer");
  const shopRole = await roleId("Shop Owner");
  const staffRole = await roleId("Staff");

  const jasmineUser = await ensureUser({
    email: "jasmine@petbook.io",
    first_name: "Jasmine",
    last_name: "Dela Cruz",
    role: customerRole,
  });
  const miguelUser = await ensureUser({
    email: "miguel@petbook.io",
    first_name: "Miguel",
    last_name: "Torres",
    role: customerRole,
  });
  const beaUser = await ensureUser({
    email: "bea@petbook.io",
    first_name: "Bea",
    last_name: "Lim",
    role: customerRole,
  });

  const mariaUser = await ensureUser({
    email: "maria@petbook.io",
    first_name: "Maria",
    last_name: "Santos",
    role: shopRole,
  });
  const paoloUser = await ensureUser({
    email: "paolo@petbook.io",
    first_name: "Paolo",
    last_name: "Reyes",
    role: shopRole,
  });
  const anaUser = await ensureUser({
    email: "ana@petbook.io",
    first_name: "Ana",
    last_name: "Cruz",
    role: shopRole,
  });
  const lizaUser = await ensureUser({
    email: "liza@pawsandpolish.com",
    first_name: "Liza",
    last_name: "Ramos",
    role: staffRole,
  });

  const jasmine = await ensureCustomer(jasmineUser, "0917 555 0101");
  const miguel = await ensureCustomer(miguelUser, "0917 555 0102");
  const bea = await ensureCustomer(beaUser, "0917 555 0103");

  const paws = await ensureShop(mariaUser, {
    name: "Paws & Polish Grooming",
    slug: "paws-and-polish",
    description:
      "A gentle, low-stress grooming studio in the heart of Makati. Small dogs, big dogs, and cats welcome.",
    address: "24 Legazpi Street, Legazpi Village",
    city: "Makati",
    latitude: 14.5547,
    longitude: 121.0244,
    phone: "028 555 0140",
    email: "hello@pawsandpolish.com",
    featured: true,
    active: true,
    commission_rate: COMMISSION_RATE,
    timezone: "Asia/Manila",
  });

  const vetcare = await ensureShop(paoloUser, {
    name: "VetCare Manila",
    slug: "vetcare-manila",
    description:
      "Preventive care, wellness checks and vaccinations from a team that treats every pet like family.",
    address: "88 Katipunan Avenue, Loyola Heights",
    city: "Quezon City",
    latitude: 14.676,
    longitude: 121.0437,
    phone: "028 555 0175",
    email: "clinic@vetcaremanila.com",
    featured: true,
    active: true,
    commission_rate: COMMISSION_RATE,
    timezone: "Asia/Manila",
  });

  const happyTails = await ensureShop(anaUser, {
    name: "Happy Tails Studio",
    slug: "happy-tails-studio",
    description:
      "Playful, patient grooming for dogs and cats in Pasig, with transparent pricing and no cages.",
    address: "12 Ortigas Avenue Extension",
    city: "Pasig",
    latitude: 14.5764,
    longitude: 121.0851,
    phone: "028 555 0198",
    email: "care@happytails.com",
    featured: true,
    active: true,
    commission_rate: COMMISSION_RATE,
    timezone: "Asia/Manila",
  });

  const mariaStaff = await ensureStaff(paws, {
    name: "Maria Santos",
    role: "manager",
    email: "maria@petbook.io",
    phone: "0917 555 0110",
    bio: "Studio owner and groomer with 12 years of experience with anxious pets.",
    active: true,
    user: mariaUser.id,
  });
  const lizaStaff = await ensureStaff(paws, {
    name: "Liza Ramos",
    role: "groomer",
    email: "liza@pawsandpolish.com",
    phone: "0917 555 0111",
    bio: "Cat grooming specialist and Fear Free certified.",
    active: true,
    user: lizaUser.id,
  });
  const paoloStaff = await ensureStaff(vetcare, {
    name: "Dr. Paolo Reyes",
    role: "vet",
    email: "paolo@petbook.io",
    phone: "0917 555 0112",
    bio: "Small animal internal medicine and preventive care.",
    active: true,
    user: paoloUser.id,
  });
  const miaStaff = await ensureStaff(vetcare, {
    name: "Dr. Mia Fernandez",
    role: "vet",
    email: "mia@vetcaremanila.com",
    phone: "0917 555 0113",
    bio: "Dermatology and nutrition consultations.",
    active: true,
  });
  const anaStaff = await ensureStaff(happyTails, {
    name: "Ana Cruz",
    role: "manager",
    email: "ana@petbook.io",
    phone: "0917 555 0114",
    bio: "Groomer and studio owner. Loves senior dogs.",
    active: true,
    user: anaUser.id,
  });

  const fullGroom = await ensureService(paws, {
    name: "Full Groom",
    category: "grooming",
    description: "Bath, blow dry, haircut, nail trim and ear cleaning tailored to your pet.",
    duration_min: 90,
    price: 1200,
    active: true,
  });
  const bath = await ensureService(paws, {
    name: "Bath & Blow Dry",
    category: "grooming",
    description: "A refreshing bath, gentle dry and brush-out.",
    duration_min: 60,
    price: 650,
    active: true,
  });
  const nails = await ensureService(paws, {
    name: "Nail Trim",
    category: "grooming",
    description: "Quick, gentle nail trim and paw balm.",
    duration_min: 30,
    price: 250,
    active: true,
  });
  const wellness = await ensureService(vetcare, {
    name: "Wellness Check",
    category: "veterinary",
    description: "Complete physical exam, weight check and health plan.",
    duration_min: 45,
    price: 900,
    active: true,
  });
  const vaccine = await ensureService(vetcare, {
    name: "Vaccination",
    category: "veterinary",
    description: "Core vaccine administration with a health screening.",
    duration_min: 30,
    price: 750,
    active: true,
  });
  const dental = await ensureService(vetcare, {
    name: "Dental Check",
    category: "veterinary",
    description: "Oral health assessment and home care plan.",
    duration_min: 30,
    price: 600,
    active: true,
  });
  const catGroom = await ensureService(happyTails, {
    name: "Cat Groom",
    category: "grooming",
    description: "Low-stress bath, brush-out and nail trim for cats.",
    duration_min: 60,
    price: 950,
    active: true,
  });
  const puppyGroom = await ensureService(happyTails, {
    name: "Puppy First Groom",
    category: "grooming",
    description: "A gentle introduction to grooming for puppies under 6 months.",
    duration_min: 45,
    price: 700,
    active: true,
  });

  await ensureGallery(paws, {
    image_url: "/images/home/hero-dog.jpg",
    caption: "Fresh from the dryer and feeling fancy.",
    pet_name: "Mochi",
    customer_name: "Jasmine",
    featured: true,
    active: true,
  });
  await ensureGallery(paws, {
    image_url: "/images/home/hero-puppy.jpg",
    caption: "First groom, zero tears, one very happy puppy.",
    pet_name: "Biscuit",
    customer_name: "Bea",
    featured: true,
    active: true,
  });
  await ensureGallery(paws, {
    image_url: "/images/home/hero-cat.jpg",
    caption: "Quiet-room grooming for a very relaxed cat.",
    pet_name: "Latte",
    customer_name: "Jasmine",
    featured: true,
    active: true,
  });
  await ensureGallery(vetcare, {
    image_url: "/images/home/hero-cat.jpg",
    caption: "Wellness check complete and purring again.",
    pet_name: "Luna",
    customer_name: "Miguel",
    featured: true,
    active: true,
  });
  await ensureGallery(vetcare, {
    image_url: "/images/home/hero-puppy.jpg",
    caption: "Brave little patient after his vaccination.",
    pet_name: "Bruno",
    customer_name: "Bea",
    featured: true,
    active: true,
  });
  await ensureGallery(vetcare, {
    image_url: "/images/home/hero-dog.jpg",
    caption: "Healthy teeth, happy tail.",
    pet_name: "Mochi",
    customer_name: "Jasmine",
    featured: true,
    active: true,
  });
  await ensureGallery(happyTails, {
    image_url: "/images/home/hero-puppy.jpg",
    caption: "Puppy's first spa day was a success.",
    pet_name: "Biscuit",
    customer_name: "Bea",
    featured: true,
    active: true,
  });
  await ensureGallery(happyTails, {
    image_url: "/images/home/hero-dog.jpg",
    caption: "Soft, shiny, and ready for zoomies.",
    pet_name: "Bruno",
    customer_name: "Bea",
    featured: true,
    active: true,
  });
  await ensureGallery(happyTails, {
    image_url: "/images/home/hero-cat.jpg",
    caption: "A calm cat groom with all the treats.",
    pet_name: "Luna",
    customer_name: "Miguel",
    featured: true,
    active: true,
  });

  const mochi = await ensurePet(jasmine, {
    name: "Mochi",
    species: "dog",
    breed: "Shih Tzu",
    sex: "female",
    birth_date: "2022-03-14",
    weight_kg: 5.4,
    color: "Cream and white",
    notes: "A little shy with the dryer. Prefers Liza.",
  });
  const latte = await ensurePet(jasmine, {
    name: "Latte",
    species: "cat",
    breed: "Domestic Shorthair",
    sex: "male",
    birth_date: "2021-08-02",
    weight_kg: 4.2,
    color: "Brown tabby",
    notes: "Needs a quiet room away from dogs.",
  });
  const luna = await ensurePet(miguel, {
    name: "Luna",
    species: "cat",
    breed: "Persian",
    sex: "female",
    birth_date: "2020-11-20",
    weight_kg: 3.8,
    color: "White",
    notes: "Sensitive skin. Use hypoallergenic shampoo.",
  });
  const bruno = await ensurePet(bea, {
    name: "Bruno",
    species: "dog",
    breed: "Labrador Retriever",
    sex: "male",
    birth_date: "2019-05-09",
    weight_kg: 28.7,
    color: "Chocolate",
    notes: "Very food motivated. Watch the treat intake.",
  });

  await ensureReview(paws, jasmine, fullGroom, 5, "Mochi came home fluffy, calm, and absolutely gorgeous. The team really listened.");
  await ensureReview(paws, bea, bath, 5, "Bruno is a big dog with a lot of energy, but they handled him with so much patience.");
  await ensureReview(paws, miguel, nails, 4, "Quick, gentle, and easy to book. The paw balm was a nice touch.");
  await ensureReview(vetcare, jasmine, wellness, 5, "Thorough checkup and clear explanations. I left with a proper care plan for Mochi.");
  await ensureReview(vetcare, bea, vaccine, 5, "They kept Bruno relaxed the whole time and followed up the next day.");
  await ensureReview(vetcare, miguel, dental, 4, "Helpful dental advice and no upselling. Booking was simple too.");
  await ensureReview(happyTails, bea, puppyGroom, 5, "Biscuit's first groom was stress-free. He looked adorable and smelled amazing.");
  await ensureReview(happyTails, jasmine, catGroom, 5, "Latte usually hates grooming, but the quiet room made a huge difference.");
  await ensureReview(happyTails, miguel, catGroom, 4, "Luna was well cared for and the finish was lovely. Would book again.");

  const todayVisit = await ensureAppointment({
    qr: "DEMO-PAW-1001",
    shop: paws,
    customer: jasmine,
    pet: mochi,
    service: fullGroom,
    staff: lizaStaff,
    start: at(0, 10),
    end: at(0, 11, 30),
    status: "confirmed",
    price: 1200,
    notes: "Please use the oatmeal shampoo.",
  });
  await ensureAppointment({
    qr: "DEMO-PAW-1002",
    shop: paws,
    customer: bea,
    pet: bruno,
    service: bath,
    staff: mariaStaff,
    start: at(0, 14),
    end: at(0, 15),
    status: "checked_in",
    price: 650,
    checkedInAt: at(0, 13, 50),
  });
  await ensureAppointment({
    qr: "DEMO-VET-2001",
    shop: vetcare,
    customer: miguel,
    pet: luna,
    service: wellness,
    staff: paoloStaff,
    start: at(1, 9, 30),
    end: at(1, 10, 15),
    status: "pending",
    price: 900,
  });
  await ensureAppointment({
    qr: "DEMO-VET-2002",
    shop: vetcare,
    customer: jasmine,
    pet: latte,
    service: vaccine,
    staff: miaStaff,
    start: at(2, 11),
    end: at(2, 11, 30),
    status: "confirmed",
    price: 750,
    notes: "Annual FVRCP booster.",
  });
  await ensureAppointment({
    qr: "DEMO-HAP-3001",
    shop: happyTails,
    customer: jasmine,
    pet: latte,
    service: catGroom,
    staff: anaStaff,
    start: at(3, 15),
    end: at(3, 16),
    status: "pending",
    price: 950,
  });

  const completedVisit = await ensureAppointment({
    qr: "DEMO-PAW-0901",
    shop: paws,
    customer: bea,
    pet: bruno,
    service: fullGroom,
    staff: mariaStaff,
    start: at(-1, 9),
    end: at(-1, 11),
    status: "completed",
    price: 1200,
    completedAt: at(-1, 10, 50),
  });
  await ensureTransaction(completedVisit, paws, bea, 1200);

  const completedVet = await ensureAppointment({
    qr: "DEMO-VET-0902",
    shop: vetcare,
    customer: miguel,
    pet: luna,
    service: dental,
    staff: paoloStaff,
    start: at(-2, 13),
    end: at(-2, 13, 30),
    status: "completed",
    price: 600,
    completedAt: at(-2, 13, 25),
  });
  await ensureTransaction(completedVet, vetcare, miguel, 600);

  await ensureTransaction(todayVisit, paws, jasmine, 1200, { paid: false });

  await ensure(
    "site_content",
    { key: { _eq: "home" } },
    {
      key: "home",
      title: "Trusted pet care, booked in minutes",
      body: "Discover trusted groomers and veterinarians near you, keep every vaccination and visit in one place, and never miss a reminder again.",
      published: true,
    }
  );

  await ensure(
    "announcements",
    { title: { _eq: "Free nail trim for first-time bookings" } },
    {
      title: "Free nail trim for first-time bookings",
      body: "Book any grooming service at a featured shop this month and get a complimentary nail trim.",
      published: true,
    }
  );
  await ensure(
    "announcements",
    { title: { _eq: "Vaccination month at VetCare Manila" } },
    {
      title: "Vaccination month at VetCare Manila",
      body: "Core vaccinations are 15% off through the end of the month. Limited slots each morning.",
      published: true,
    }
  );

  console.log("Demo data ready.\n");
  console.log("Customer: jasmine@petbook.io / PetBook123!");
  console.log("Customer: miguel@petbook.io  / PetBook123!");
  console.log("Shop:     maria@petbook.io    / PetBook123!  (Paws & Polish)");
  console.log("Shop:     paolo@petbook.io    / PetBook123!  (VetCare Manila)");
  console.log("Shop:     ana@petbook.io      / PetBook123!  (Happy Tails)");
  console.log("Staff:    liza@pawsandpolish.com / PetBook123! (Paws & Polish)\n");
}

main().catch((error) => {
  console.error("\nSeed failed:", error.message);
  if (error.body) console.error(JSON.stringify(error.body, null, 2));
  process.exit(1);
});
