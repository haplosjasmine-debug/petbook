import { NextResponse } from "next/server";
import { createHmac, createHash, timingSafeEqual } from "crypto";
import {
  DirectusError,
  adminRequest,
  createItem,
  listItems,
  updateItem,
  loginDirectus,
} from "@/lib/directus";
import { setSessionCookies } from "@/lib/session";
import { registerSchema } from "@/lib/validators";
import type { DirectusRole, DirectusUser, Shop } from "@/lib/types";

type EmailOtpRecord = {
  id: string;
  verification_token_hash: string;
  token_used: boolean;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function verifyEmailToken(token: string, email: string) {
  const secret = process.env.OTP_VERIFICATION_SECRET;

  if (!secret) {
    throw new DirectusError("OTP verification is not configured.", 500);
  }

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;

  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest();

  const received = Buffer.from(signature, "base64url");

  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return false;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    ) as { email: string; expires: number };

    return (
      data.email === email &&
      typeof data.expires === "number" &&
      data.expires > Date.now()
    );
  } catch {
    return false;
  }
}

async function findRole(name: string) {
  const result = await adminRequest<{ data: DirectusRole[] }>(
    `/roles?filter[name][_eq]=${encodeURIComponent(name)}&limit=1`
  );

  if (!result.data[0]) {
    throw new DirectusError(
      `The ${name} role has not been configured in Directus.`,
      500
    );
  }

  return result.data[0];
}

async function uniqueSlug(name: string) {
  const base = slugify(name) || "shop";

  const existing = await listItems<Shop>(
    "shops",
    `filter[slug][_eq]=${encodeURIComponent(base)}&limit=1`
  );

  if (!existing.length) return base;

  return `${base}-${Date.now().toString().slice(-5)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);

    const email = input.email.trim().toLowerCase();
    const verificationToken = body.verification_token;

    if (
      typeof verificationToken !== "string" ||
      !verifyEmailToken(verificationToken, email)
    ) {
      return NextResponse.json(
        { message: "Please verify your email before creating an account." },
        { status: 403 }
      );
    }

    const existingUser = await adminRequest<{ data: DirectusUser[] }>(
      `/users?filter[email][_eq]=${encodeURIComponent(email)}&limit=1`
    );

    if (existingUser.data.length > 0) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const verificationTokenHash = createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const otpRecords = await listItems<EmailOtpRecord>(
      "email_otps",
      `filter[email][_eq]=${encodeURIComponent(email)}&filter[verification_token_hash][_eq]=${verificationTokenHash}&filter[used][_eq]=true&filter[token_used][_eq]=false&limit=1`
    );

    const otpRecord = otpRecords[0];

    if (!otpRecord) {
      return NextResponse.json(
        { message: "Your email verification has expired or has already been used. Please verify again." },
        { status: 403 }
      );
    }

    const role = await findRole(
      input.role === "customer" ? "Customer" : "Shop Owner"
    );

    await updateItem("email_otps", otpRecord.id, {
      token_used: true,
    });

    const user = await adminRequest<{ data: DirectusUser }>("/users", {
      method: "POST",
      body: {
        email,
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
        email,
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
        email,
        phone: input.phone || null,
        active: true,
      });
    }

    const tokens = await loginDirectus(email, input.password);
    await setSessionCookies(tokens);

    return NextResponse.json(
      { message: "Account created.", userId },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof DirectusError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { message: "Unable to create the account." },
      { status: 500 }
    );
  }
}
