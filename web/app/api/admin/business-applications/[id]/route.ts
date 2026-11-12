import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createAccount,
  splitName,
  temporaryPassword,
  uniqueShopSlug,
} from "@/lib/accounts";
import { adminSession, unauthorized } from "@/lib/authz";
import { DirectusError, createItem, getItem, updateItem } from "@/lib/directus";
import type { BusinessApplication, Shop } from "@/lib/types";
import { businessApplicationDecisionSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await adminSession();
  if (!session) return unauthorized();

  try {
    const { id } = await context.params;
    const input = businessApplicationDecisionSchema.parse(await request.json());
    const result = await getItem<{ data: BusinessApplication }>(
      "business_applications",
      id,
      "?fields=*"
    );
    const application = result.data;

    if (!application) {
      return NextResponse.json({ message: "Application not found." }, { status: 404 });
    }
    if (application.status !== "pending") {
      return NextResponse.json(
        { message: "This application has already been reviewed." },
        { status: 409 }
      );
    }

    if (input.action === "reject") {
      const updated = await updateItem<BusinessApplication>(
        "business_applications",
        application.id,
        {
          status: "rejected",
          decision_note: input.decision_note || null,
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
        }
      );
      return NextResponse.json({ application: updated });
    }

    const password = temporaryPassword();
    const account = await createAccount({
      email: application.email,
      password,
      name: application.contact_name,
      role: "business_owner",
    });
    const { first_name, last_name } = splitName(application.contact_name);
    const shop = await createItem<Shop>("shops", {
      owner: account.id,
      name: application.business_name,
      slug: await uniqueShopSlug(application.business_name),
      description: application.message || null,
      address: application.address || null,
      city: application.city || null,
      phone: application.phone || null,
      email: application.email,
      featured: false,
      active: true,
      commission_rate: 10,
      timezone: "Asia/Manila",
    });

    await createItem("staff", {
      shop: shop.id,
      user: account.id,
      name: `${first_name}${last_name ? ` ${last_name}` : ""}`,
      role: "manager",
      email: application.email,
      phone: application.phone || null,
      active: true,
    });

    const updated = await updateItem<BusinessApplication>(
      "business_applications",
      application.id,
      {
        status: "approved",
        decision_note: input.decision_note || null,
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString(),
      }
    );

    return NextResponse.json({
      application: updated,
      shop,
      credentials: {
        email: application.email,
        temporaryPassword: password,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check the review details." },
        { status: 422 }
      );
    }
    if (error instanceof DirectusError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { message: "Unable to review the application." },
      { status: 500 }
    );
  }
}
