import { NextResponse } from "next/server";
import { DirectusError, fetchCurrentUser, listItems, loginDirectus } from "@/lib/directus";
import { setSessionCookies } from "@/lib/session";
import { loginSchema } from "@/lib/validators";
import type { Customer, Shop } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);
    const tokens = await loginDirectus(input.email, input.password);
    const user = await fetchCurrentUser(tokens.access_token);
    const role = user.role && typeof user.role === "object" ? user.role.name : "";

    let customer: Customer | null = null;
    let shop: Shop | null = null;

    if (role === "Customer") {
      const rows = await listItems<Customer>(
        "customers",
        `filter[user][_eq]=${user.id}&limit=1`
      );
      customer = rows[0] ?? null;
    }

    if (role === "Shop Owner") {
      const rows = await listItems<Shop>("shops", `filter[owner][_eq]=${user.id}&limit=1`);
      shop = rows[0] ?? null;
    }

    await setSessionCookies(tokens);

    return NextResponse.json({
      role,
      user: {
        ...user,
        role: {
          id: user.role && typeof user.role === "object" ? user.role.id : "",
          name: role,
        },
      },
      customer,
      shop,
    });
  } catch (error) {
    if (error instanceof DirectusError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ message: "Enter a valid email and password." }, { status: 422 });
    }
    return NextResponse.json({ message: "Unable to sign in." }, { status: 500 });
  }
}
