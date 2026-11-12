import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createItem, listItems } from "@/lib/directus";
import type { BusinessApplication } from "@/lib/types";
import { businessApplicationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const input = businessApplicationSchema.parse(await request.json());
    const pending = await listItems<BusinessApplication>(
      "business_applications",
      `filter[email][_eq]=${encodeURIComponent(input.email)}&filter[status][_eq]=pending&limit=1`
    );

    if (pending.length) {
      return NextResponse.json(
        { message: "An application with this email is already waiting for review." },
        { status: 409 }
      );
    }

    const application = await createItem<BusinessApplication>("business_applications", {
      business_name: input.business_name,
      contact_name: input.contact_name,
      email: input.email,
      phone: input.phone || null,
      city: input.city || null,
      address: input.address || null,
      message: input.message || null,
      status: "pending",
    });

    return NextResponse.json(
      { message: "Application submitted.", applicationId: application.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check your business details." },
        { status: 422 }
      );
    }
    return NextResponse.json({ message: "Unable to submit your application." }, { status: 500 });
  }
}
