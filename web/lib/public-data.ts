import { listItems } from "@/lib/directus";
import type {
  Announcement,
  Service,
  ServicePackage,
  Shop,
  SiteContent,
  Staff,
  Vaccination,
} from "@/lib/types";

export const defaultHomeContent = {
  eyebrow: "Trusted pet care, booked in minutes",
  title: "Every pet deserves a calm, caring appointment.",
  body: "Discover trusted groomers and veterinarians near you, keep every vaccination and visit in one place, and never miss a reminder again.",
  primaryCta: "Find a shop",
  secondaryCta: "Join PetBook",
  stats: [
    { label: "Partner shops", value: "40+" },
    { label: "Appointments booked", value: "12,000+" },
    { label: "Reminders sent", value: "98%" },
  ],
};

export type HomeContent = typeof defaultHomeContent;

async function safeList<T>(collection: string, query = "") {
  try {
    return await listItems<T>(collection, query);
  } catch {
    return [] as T[];
  }
}

export async function getHomeContent(): Promise<HomeContent> {
  const rows = await safeList<SiteContent>(
    "site_content",
    "filter[key][_eq]=home&filter[published][_eq]=true&limit=1"
  );

  const row = rows[0];
  if (!row) return defaultHomeContent;

  return {
    ...defaultHomeContent,
    eyebrow: row.title || defaultHomeContent.eyebrow,
    body: row.body || defaultHomeContent.body,
  };
}

export async function getFeaturedShops(limit = 3) {
  const shops = await safeList<Shop>(
    "shops",
    `filter[active][_eq]=true&filter[featured][_eq]=true&sort=name&limit=${limit}`
  );

  if (shops.length) return shops;

  return safeList<Shop>(
    "shops",
    `filter[active][_eq]=true&sort=name&limit=${limit}`
  );
}

export async function getActiveShops(search = "") {
  const query = search
    ? `filter[active][_eq]=true&filter[name][_icontains]=${encodeURIComponent(search)}&sort=name&limit=60`
    : "filter[active][_eq]=true&sort=name&limit=60";
  return safeList<Shop>("shops", query);
}

export async function getServicesForShops(shopIds: number[]) {
  if (!shopIds.length) return [];
  return safeList<Service>(
    "services",
    `filter[active][_eq]=true&filter[shop][_in]=${shopIds.join(",")}&sort=price&limit=100`
  );
}

export async function getPublicServices(search = "") {
  const filter = search
    ? `filter[active][_eq]=true&filter[name][_icontains]=${encodeURIComponent(search)}`
    : "filter[active][_eq]=true";
  return safeList<Service>(
    "services",
    `${filter}&fields=*,shop.id,shop.name,shop.slug,shop.city&sort=name&limit=80`
  );
}

export async function getAnnouncements(limit = 3) {
  return safeList<Announcement>(
    "announcements",
    `filter[published][_eq]=true&sort=-date_created&limit=${limit}`
  );
}

export type ShopProfile = {
  shop: Shop;
  services: Service[];
  staff: Staff[];
  packages: ServicePackage[];
};

export async function getShopProfile(slug: string): Promise<ShopProfile | null> {
  const shops = await safeList<Shop>(
    "shops",
    `filter[slug][_eq]=${encodeURIComponent(slug)}&filter[active][_eq]=true&limit=1`
  );

  const shop = shops[0];
  if (!shop) return null;

  const [services, staff, packages] = await Promise.all([
    safeList<Service>(
      "services",
      `filter[shop][_eq]=${shop.id}&filter[active][_eq]=true&sort=price&limit=100`
    ),
    safeList<Staff>(
      "staff",
      `filter[shop][_eq]=${shop.id}&filter[active][_eq]=true&sort=name&limit=50`
    ),
    safeList<ServicePackage>(
      "service_packages",
      `filter[shop][_eq]=${shop.id}&filter[active][_eq]=true&sort=price&limit=20`
    ),
  ]);

  return { shop, services, staff, packages };
}

export async function getShopServiceOptions(shopId: number) {
  const [services, staff] = await Promise.all([
    safeList<Service>(
      "services",
      `filter[shop][_eq]=${shopId}&filter[active][_eq]=true&sort=price`
    ),
    safeList<Staff>(
      "staff",
      `filter[shop][_eq]=${shopId}&filter[active][_eq]=true&sort=name`
    ),
  ]);
  return { services, staff };
}

export async function getVaccinationsForPets(petIds: number[]) {
  if (!petIds.length) return [] as Vaccination[];
  return safeList<Vaccination>(
    "vaccinations",
    `filter[pet][_in]=${petIds.join(",")}&sort=next_due_at&limit=100`
  );
}
