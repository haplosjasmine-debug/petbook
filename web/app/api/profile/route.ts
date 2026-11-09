import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession } from "@/lib/session";
import { adminRequest, updateItem } from "@/lib/directus";
import { profileSchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  }

  try {
    const input = profileSchema.parse(await request.json());

    await adminRequest(`/users/${session.user.id}`, {
      method: "PATCH",
      body: { first_name: input.first_name, last_name: input.last_name },
    });

    if (session.customer) {
      await updateItem("customers", session.customer.id, {
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone || null,
      });
    }

    return NextResponse.json({ message: "Profile updated." });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check your details." },
        { status: 422 }
      );
    }
    return NextResponse.json({ message: "Unable to update your profile." }, { status: 500 });
  }
}
