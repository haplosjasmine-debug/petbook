import { NextResponse } from "next/server";
import { createAccount } from "@/lib/accounts";
import { DirectusError, createItem, loginDirectus } from "@/lib/directus";
import { setSessionCookies } from "@/lib/session";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    const user = await createAccount({
      email: input.email,
      password: input.password,
      name: `${input.first_name} ${input.last_name}`,
      role: "pet_owner",
    });

    await createItem("customers", {
      user: user.id,
      first_name: input.first_name,
      last_name: input.last_name,
      phone: input.phone || null,
      loyalty_points: 0,
    });

    const tokens = await loginDirectus(input.email, input.password);
    await setSessionCookies(tokens);

    return NextResponse.json(
      { message: "Account created.", userId: user.id, home: "/dashboard" },
      { status: 201 }
    );
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
