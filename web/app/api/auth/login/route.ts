import { NextResponse } from "next/server";
import { ensureCustomerProfile, findUserByEmail } from "@/lib/accounts";
import { DirectusError, fetchCurrentUser, loginDirectus } from "@/lib/directus";
import { notifyLogin, resolveLoginAlertPhone } from "@/lib/notifications";
import { checkRateLimit, recordRateLimit } from "@/lib/rate-limit";
import { appRoleHome } from "@/lib/roles";
import { buildSession, setSessionCookies } from "@/lib/session";
import { loginSchema } from "@/lib/validators";

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);
    const ip = clientIp(request);
    const rateKey = `login:${ip}:${input.email}`;
    const limit = checkRateLimit(rateKey, {
      windowMs: 15 * 60_000,
      max: 10,
      cooldownMs: 0,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { message: `Too many sign-in attempts. Try again in ${limit.retryAfter} seconds.` },
        { status: 429 }
      );
    }
    recordRateLimit(rateKey, { windowMs: 15 * 60_000 });

    const existing = await findUserByEmail(input.email).catch(() => null);
    if (existing?.status === "unverified") {
      return NextResponse.json(
        {
          message:
            "Finish creating your account first. Enter the verification code we emailed you, or register again to request a new one.",
          code: "email_not_verified",
        },
        { status: 403 }
      );
    }

    const tokens = await loginDirectus(input.email, input.password);
    const user = await fetchCurrentUser(tokens.access_token);
    await ensureCustomerProfile(user);
    const session = await buildSession(user, tokens.access_token);

    if (!session) {
      throw new DirectusError(
        "This account does not have a PetBook role. Contact the platform administrator.",
        403
      );
    }

    await setSessionCookies(tokens);

    let notificationSent = false;
    try {
      const alert = await notifyLogin({
        email: user.email,
        name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email,
        role: session.role,
        phone: await resolveLoginAlertPhone(session),
        customerId: session.customer?.id ?? null,
        shopId: session.shop?.id ?? null,
        ip,
        userAgent: request.headers.get("user-agent"),
      });
      notificationSent = alert.ok && alert.provider !== "mock";
    } catch (error) {
      console.error(
        "Login notification failed:",
        error instanceof Error ? error.message : error
      );
    }

    return NextResponse.json({
      role: session.role,
      appRole: session.appRole,
      notificationSent,
      home: session.appRole === "pet_owner" ? "/" : appRoleHome(session.appRole),
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
      if (error.status === 401) {
        return NextResponse.json(
          {
            message:
              "Email or password is incorrect. If you recently registered, verify your email first.",
          },
          { status: 401 }
        );
      }
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ message: "Enter a valid email and password." }, { status: 422 });
    }
    return NextResponse.json({ message: "Unable to sign in." }, { status: 500 });
  }
}
