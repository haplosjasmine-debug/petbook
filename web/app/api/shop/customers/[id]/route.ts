import { NextResponse } from "next/server";
import { shopSession, unauthorized } from "@/lib/authz";
import { deleteItem, DirectusError, listItems } from "@/lib/directus";
import type { ShopCustomer } from "@/lib/types";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await shopSession();
  if (!session) return unauthorized();

  const customerId = Number((await context.params).id);
  if (!Number.isInteger(customerId) || customerId <= 0) {
    return NextResponse.json({ message: "Customer not found." }, { status: 404 });
  }

  try {
    const links = await listItems<ShopCustomer>(
      "shop_customers",
      `filter[shop][_eq]=${session.shop.id}&filter[customer][_eq]=${customerId}&limit=100`
    );

    if (!links.length) {
      return NextResponse.json({ message: "Customer not found." }, { status: 404 });
    }

    for (const link of links) {
      await deleteItem("shop_customers", link.id);
    }

    return NextResponse.json({ message: "Customer removed from your list." });
  } catch (error) {
    if (error instanceof DirectusError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to remove the customer." }, { status: 500 });
  }
}
