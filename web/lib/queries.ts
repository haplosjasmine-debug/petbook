import { listItems } from "@/lib/directus";
import type {
  AppNotification,
  Appointment,
  Customer,
  LoyaltyPoint,
  Pet,
  Reminder,
  Review,
  Service,
  ServicePackage,
  Shop,
  ShopCustomer,
  ShopGalleryItem,
  Staff,
  Transaction,
  Vaccination,
} from "@/lib/types";

export function relationId(value: number | { id: number } | null | undefined) {
  if (value === null || value === undefined) return null;
  return typeof value === "object" ? value.id : value;
}

export function expanded<T>(value: number | string | T | null | undefined): T | null {
  return value && typeof value === "object" ? (value as T) : null;
}

export async function customerAppointments(customerId: number, extra = "") {
  return listItems<Appointment>(
    "appointments",
    `filter[customer][_eq]=${customerId}${extra}&sort=-start_at&limit=100`
  );
}

export async function shopAppointments(shopId: number, extra = "") {
  return listItems<Appointment>(
    "appointments",
    `filter[shop][_eq]=${shopId}${extra}&sort=-start_at&limit=200`
  );
}

export async function staffAppointments(staffId: number, extra = "") {
  return listItems<Appointment>(
    "appointments",
    `filter[staff][_eq]=${staffId}${extra}&sort=-start_at&limit=200`
  );
}

export async function customerPets(customerId: number) {
  return listItems<Pet>("pets", `filter[customer][_eq]=${customerId}&sort=name&limit=100`);
}

export async function customerTransactions(customerId: number, limit = 50) {
  return listItems<Transaction>(
    "transactions",
    `filter[customer][_eq]=${customerId}&sort=-date_created&limit=${limit}`
  );
}

export async function shopTransactions(shopId: number, extra = "", limit = 200) {
  return listItems<Transaction>(
    "transactions",
    `filter[shop][_eq]=${shopId}${extra}&sort=-date_created&limit=${limit}`
  );
}

export async function customerLoyalty(customerId: number) {
  return listItems<LoyaltyPoint>(
    "loyalty_points",
    `filter[customer][_eq]=${customerId}&sort=-date_created&limit=100`
  );
}

export async function customerReminders(appointments: Appointment[]) {
  const ids = appointments.map((appointment) => appointment.id);
  if (!ids.length) return [] as Reminder[];
  return listItems<Reminder>(
    "reminders",
    `filter[appointment][_in]=${ids.join(",")}&sort=send_at&limit=100`
  );
}

export async function customerNotifications(customerId: number, limit = 50) {
  return listItems<AppNotification>(
    "notifications",
    `filter[customer][_eq]=${customerId}&sort=-date_created&limit=${limit}`
  );
}

export async function shopCustomers(shopId: number) {
  return listItems<ShopCustomer>(
    "shop_customers",
    `filter[shop][_eq]=${shopId}&fields=*,customer.*,customer.user.id,customer.user.email&sort=-date_created&limit=200`
  );
}

export async function shopCustomerLink(shopId: number, customerId: number) {
  const rows = await listItems<ShopCustomer>(
    "shop_customers",
    `filter[shop][_eq]=${shopId}&filter[customer][_eq]=${customerId}&limit=1`
  );
  return rows[0] ?? null;
}

export async function shopStaff(shopId: number) {
  return listItems<Staff>("staff", `filter[shop][_eq]=${shopId}&sort=name&limit=100`);
}

export async function shopServices(shopId: number) {
  return listItems<Service>("services", `filter[shop][_eq]=${shopId}&sort=name&limit=100`);
}

export async function shopGallery(shopId: number) {
  return listItems<ShopGalleryItem>(
    "shop_gallery",
    `filter[shop][_eq]=${shopId}&sort=-date_created&limit=100`
  );
}

export async function shopReviews(shopId: number, limit = 100) {
  return listItems<Review>(
    "reviews",
    `filter[shop][_eq]=${shopId}&fields=*,service.id,service.name,customer.id,customer.first_name,customer.last_name&sort=-date_created&limit=${limit}`
  );
}

export async function shopPackages(shopId: number) {
  return listItems<ServicePackage>(
    "service_packages",
    `filter[shop][_eq]=${shopId}&sort=name&limit=100`
  );
}

export async function petVaccinations(petId: number) {
  return listItems<Vaccination>(
    "vaccinations",
    `filter[pet][_eq]=${petId}&sort=-administered_at&limit=100`
  );
}

export async function petAppointments(petId: number) {
  return listItems<Appointment>(
    "appointments",
    `filter[pet][_eq]=${petId}&sort=-start_at&limit=50`
  );
}

export async function customerById(customerId: number) {
  const rows = await listItems<Customer>("customers", `filter[id][_eq]=${customerId}&limit=1`);
  return rows[0] ?? null;
}

export async function transactionForAppointment(appointmentId: number) {
  const rows = await listItems<Transaction>(
    "transactions",
    `filter[appointment][_eq]=${appointmentId}&sort=-date_created&limit=1`
  );
  return rows[0] ?? null;
}

export async function shopsByIds(ids: number[]) {
  if (!ids.length) return [] as Shop[];
  return listItems<Shop>("shops", `filter[id][_in]=${ids.join(",")}&limit=100`);
}

export async function servicesByIds(ids: number[]) {
  if (!ids.length) return [] as Service[];
  return listItems<Service>("services", `filter[id][_in]=${ids.join(",")}&limit=100`);
}

export async function appointmentsByIds(ids: number[]) {
  if (!ids.length) return [] as Appointment[];
  return listItems<Appointment>("appointments", `filter[id][_in]=${ids.join(",")}&limit=200`);
}

export async function customersByIds(ids: number[]) {
  if (!ids.length) return [] as Customer[];
  return listItems<Customer>("customers", `filter[id][_in]=${ids.join(",")}&limit=200`);
}

export async function petsByIds(ids: number[]) {
  if (!ids.length) return [] as Pet[];
  return listItems<Pet>("pets", `filter[id][_in]=${ids.join(",")}&limit=200`);
}
