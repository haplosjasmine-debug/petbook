export type RoleName = "Administrator" | "Shop Owner" | "Customer" | string;

export interface DirectusRole {
  id: string;
  name: string;
}

export interface DirectusUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status?: string;
  role: DirectusRole | string | null;
}

export interface Customer {
  id: number;
  user: string | DirectusUser;
  first_name: string;
  last_name: string;
  phone: string | null;
  loyalty_points: number;
  date_created?: string;
}

export interface Shop {
  id: number;
  owner: string | DirectusUser;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  cover_image: string | null;
  featured: boolean;
  active: boolean;
  commission_rate: number | string;
  timezone: string;
  date_created?: string;
}

export interface Staff {
  id: number;
  shop: number | Shop;
  user: string | null;
  name: string;
  role: "groomer" | "vet" | "assistant" | "manager" | string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  active: boolean;
}

export interface Pet {
  id: number;
  customer: number | Customer;
  name: string;
  species: "dog" | "cat" | "bird" | "rabbit" | "other" | string;
  breed: string | null;
  sex: "male" | "female" | "unknown" | string;
  birth_date: string | null;
  weight_kg: number | string | null;
  color: string | null;
  notes: string | null;
  photo: string | null;
  date_created?: string;
}

export interface Service {
  id: number;
  shop: number | Shop;
  name: string;
  category: "grooming" | "veterinary" | "package" | string;
  description: string | null;
  duration_min: number;
  price: number | string;
  active: boolean;
}

export interface ServicePackage {
  id: number;
  shop: number | Shop;
  name: string;
  description: string | null;
  price: number | string;
  sessions: number;
  validity_days: number;
  active: boolean;
}

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Appointment {
  id: number;
  shop: number | Shop;
  customer: number | Customer;
  pet: number | Pet;
  service: number | Service;
  package: number | ServicePackage | null;
  staff: number | Staff | null;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  price: number | string;
  notes: string | null;
  qr_code: string;
  checked_in_at: string | null;
  completed_at: string | null;
  date_created?: string;
}

export type TransactionStatus = "pending" | "paid" | "refunded";

export interface Transaction {
  id: number;
  appointment: number | Appointment;
  shop: number | Shop;
  customer: number | Customer;
  amount: number | string;
  commission_rate: number | string;
  commission_amount: number | string;
  net_amount: number | string;
  status: TransactionStatus;
  commission_status: "pending" | "settled";
  provider: string | null;
  method: string | null;
  reference: string | null;
  paid_at: string | null;
  date_created: string;
}

export type CommissionPaymentStatus = "pending" | "paid" | "failed";

export interface CommissionPayment {
  id: number;
  shop: number | Shop;
  amount: number | string;
  status: CommissionPaymentStatus;
  provider: string | null;
  method: string | null;
  reference: string | null;
  checkout_id: string | null;
  paid_at: string | null;
  date_created: string;
}

export interface Vaccination {
  id: number;
  pet: number | Pet;
  shop: number | Shop | null;
  staff: number | Staff | null;
  name: string;
  administered_at: string;
  next_due_at: string | null;
  lot_number: string | null;
  notes: string | null;
}

export interface LoyaltyPoint {
  id: number;
  customer: number | Customer;
  appointment: number | Appointment | null;
  points: number;
  type: "earned" | "redeemed" | "adjustment";
  description: string | null;
  date_created: string;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  image: string | null;
  starts_at: string | null;
  ends_at: string | null;
  published: boolean;
  date_created?: string;
}

export interface SiteContent {
  id: number;
  key: string;
  title: string;
  body: string;
  image: string | null;
  published: boolean;
}

export interface Reminder {
  id: number;
  appointment: number | Appointment;
  type: "upcoming" | "follow_up" | "vaccination" | string;
  send_at: string;
  status: "scheduled" | "sent" | "failed" | "cancelled" | string;
  channel: string;
  message: string | null;
  sent_at: string | null;
}

export interface AppNotification {
  id: number;
  customer: number | Customer | null;
  shop: number | Shop | null;
  appointment: number | Appointment | null;
  channel: "email" | "sms" | "system" | string;
  recipient: string;
  subject: string | null;
  body: string;
  status: string;
  provider: string | null;
  sent_at: string | null;
  date_created: string;
}

export interface Session {
  user: DirectusUser;
  role: RoleName;
  customer: Customer | null;
  shop: Shop | null;
  accessToken: string;
}

export interface DirectusList<T> {
  data: T[];
  meta?: {
    total_count?: number;
    filter_count?: number;
  };
}
