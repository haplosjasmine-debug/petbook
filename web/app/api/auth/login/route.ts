import { NextResponse } from "next/server";
import { DirectusError, fetchCurrentUser, loginDirectus } from "@/lib/directus";
import { appRoleHome } from "@/lib/roles";
import { buildSession, setSessionCookies } from "@/lib/session";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);
    const tokens = await loginDirectus(input.email, input.password);
    const user = await fetchCurrentUser(tokens.access_token);
    const session = await buildSession(user, tokens.access_token);

    if (!session) {
      throw new DirectusError(
        "This account does not have a PetBook role. Contact the platform administrator.",
        403
      );
    }

    await setSessionCookies(tokens);

    return NextResponse.json({
      role: session.role,
      appRole: session.appRole,
      home: appRoleHome(session.appRole),
      user: {
        ...user,
        role: {
          id: user.role && typeof user.role === "object" ? user.role.id : "",
          name: session.role,
        },
      },
      customer: session.customer,
      shop: session.shop,
      staff: session.staff,
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
