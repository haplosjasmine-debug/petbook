import { NextResponse } from "next/server";
import {
  DirectusError,
  adminRequest,
  createItem,
  listItems,
  loginDirectus,
} from "@/lib/directus";
import { setSessionCookies } from "@/lib/session";
import { registerSchema } from "@/lib/validators";
import type { DirectusRole, DirectusUser, Shop } from "@/lib/types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function findRole(name: string) {
  const result = await adminRequest<{ data: DirectusRole[] }>(
    `/roles?filter[name][_eq]=${encodeURIComponent(name)}&limit=1`
  );
  if (!result.data[0]) {
    throw new DirectusError(`The ${name} role has not been configured in Directus.`, 500);
  }
  return result.data[0];
}

async function uniqueSlug(name: string) {
  const base = slugify(name) || "shop";
  const existing = await listItems<Shop>("shops", `filter[slug][_eq]=${encodeURIComponent(base)}&limit=1`);
  if (!existing.length) return base;
  return `${base}-${Date.now().toString().slice(-5)}`;
}

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    const role = await findRole(input.role === "customer" ? "Customer" : "Shop Owner");

    const user = await adminRequest<{ data: DirectusUser }>("/users", {
      method: "POST",
      body: {
        email: input.email,
        password: input.password,
        first_name: input.first_name,
        last_name: input.last_name,
        role: role.id,
        status: "active",
      },
    });

    const userId = user.data.id;

    if (input.role === "customer") {
      await createItem("customers", {
        user: userId,
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone || null,
        loyalty_points: 0,
      });
    } else {
      const shop = await createItem<Shop>("shops", {
        owner: userId,
        name: input.shop_name,
        slug: await uniqueSlug(input.shop_name),
        description: input.description || null,
        address: input.address || null,
        city: input.city || null,
        phone: input.phone || null,
        email: input.email,
        featured: false,
        active: true,
        commission_rate: 10,
        timezone: "Asia/Manila",
      });

      await createItem("staff", {
        shop: shop.id,
        user: userId,
        name: `${input.first_name} ${input.last_name}`,
        role: "manager",
        email: input.email,
        phone: input.phone || null,
        active: true,
      });
    }

    const tokens = await loginDirectus(input.email, input.password);
    await setSessionCookies(tokens);

    return NextResponse.json({ message: "Account created.", userId }, { status: 201 });
  } catch (error) {
    if (error instanceof DirectusError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 422 });
    }
    return NextResponse.json({ message: "Unable to create the account." }, { status: 500 });
  }
}
