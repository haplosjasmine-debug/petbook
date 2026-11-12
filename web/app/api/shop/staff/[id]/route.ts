import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createAccount, splitName, updateAccount } from "@/lib/accounts";
import { shopSession, unauthorized } from "@/lib/authz";
import { DirectusError, deleteItem, getItem, updateItem } from "@/lib/directus";
import type { Staff } from "@/lib/types";
import { staffSchema } from "@/lib/validators";

async function ownedStaff(id: number, shopId: number) {
  const result = await getItem<{ data: Staff }>("staff", id, "?fields=*");
  if (!result.data || Number(result.data.shop) !== shopId) return null;
  return result.data;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await shopSession();
  if (!session) return unauthorized();

  try {
    const staff = await ownedStaff(Number((await context.params).id), session.shop.id);
    if (!staff) return NextResponse.json({ message: "Staff member not found." }, { status: 404 });

    const input = staffSchema.partial().parse(await request.json());
    const name = input.name ?? staff.name;
    const email = input.email !== undefined ? input.email : staff.email || "";
    const password = input.password || "";
    let userId = typeof staff.user === "string" ? staff.user : null;

    if (password && !email) {
      return NextResponse.json(
        { message: "Add an email address before creating staff login access." },
        { status: 422 }
      );
    }

    if (userId) {
      const { first_name, last_name } = splitName(name);
      await updateAccount(userId, {
        ...(input.email !== undefined ? { email: email || null } : {}),
        ...(input.name !== undefined ? { first_name, last_name } : {}),
        ...(input.password ? { password: input.password } : {}),
        ...(input.active !== undefined ? { status: input.active ? "active" : "suspended" } : {}),
      });
    } else if (password) {
      const account = await createAccount({
        email,
        password,
        name,
        role: "staff",
      });
      userId = account.id;
    }

    const updated = await updateItem<Staff>("staff", staff.id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.email !== undefined ? { email: email || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.bio !== undefined ? { bio: input.bio || null } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(userId && !staff.user ? { user: userId } : {}),
    });
    return NextResponse.json({ staff: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check the staff details." },
        { status: 422 }
      );
    }
    if (error instanceof DirectusError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to update the staff member." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await shopSession();
  if (!session) return unauthorized();

  try {
    const staff = await ownedStaff(Number((await context.params).id), session.shop.id);
    if (!staff) return NextResponse.json({ message: "Staff member not found." }, { status: 404 });
    await deleteItem("staff", staff.id);
    return NextResponse.json({ message: "Staff member removed." });
  } catch (error) {
    if (error instanceof DirectusError) {
      return NextResponse.json(
        {
          message:
            error.status === 400
              ? "This staff member has appointments. Deactivate them instead."
              : error.message,
        },
        { status: error.status }
      );
    }
    return NextResponse.json({ message: "Unable to remove the staff member." }, { status: 500 });
  }
}
