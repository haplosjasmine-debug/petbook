import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const customerRegisterSchema = z.object({
  role: z.literal("customer"),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().max(150),
  phone: z.string().max(32).optional().or(z.literal("")),
  password: z.string().min(8).max(72),
});

export const shopRegisterSchema = z.object({
  role: z.literal("shop_owner"),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().max(150),
  phone: z.string().max(32).optional().or(z.literal("")),
  password: z.string().min(8).max(72),
  shop_name: z.string().min(2).max(150),
  city: z.string().max(120).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export const registerSchema = z.discriminatedUnion("role", [
  customerRegisterSchema,
  shopRegisterSchema,
]);

export const petSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.enum(["dog", "cat", "bird", "rabbit", "other"]),
  breed: z.string().max(100).optional().or(z.literal("")),
  sex: z.enum(["male", "female", "unknown"]).default("unknown"),
  birth_date: z.string().optional().or(z.literal("")),
  weight_kg: z.coerce.number().min(0).max(200).optional().nullable(),
  color: z.string().max(60).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const bookingSchema = z.object({
  shop_id: z.coerce.number().int().positive(),
  service_id: z.coerce.number().int().positive(),
  pet_id: z.coerce.number().int().positive(),
  staff_id: z.coerce.number().int().positive().nullable().optional(),
  start_at: z.string().min(5),
  notes: z.string().max(2000).optional().or(z.literal("")),
  payment_method: z.enum(["mock", "cash", "paymongo"]).optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(2).max(150),
  category: z.enum(["grooming", "veterinary", "package"]),
  description: z.string().max(2000).optional().or(z.literal("")),
  duration_min: z.coerce.number().int().min(5).max(600),
  price: z.coerce.number().min(0).max(100000),
  active: z.boolean().optional().default(true),
});

export const staffSchema = z.object({
  name: z.string().min(2).max(150),
  role: z.enum(["groomer", "vet", "assistant", "manager"]),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(32).optional().or(z.literal("")),
  bio: z.string().max(2000).optional().or(z.literal("")),
  active: z.boolean().optional().default(true),
});

export const profileSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z.string().max(32).optional().or(z.literal("")),
});

export const shopSettingsSchema = z.object({
  name: z.string().min(2).max(150),
  phone: z.string().max(32).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  image: z.string().max(255).optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const redeemSchema = z.object({
  points: z.coerce.number().int().min(50),
  description: z.string().max(255).optional().or(z.literal("")),
});

export const statusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "checked_in",
    "in_progress",
    "completed",
    "cancelled",
    "rejected",
    "no_show",
  ]),
  notes: z.string().max(2000).optional().or(z.literal("")),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

export const checkInSchema = z.object({
  code: z.string().min(6).max(120),
});
