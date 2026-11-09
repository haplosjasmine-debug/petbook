import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { customerSession, unauthorized } from "@/lib/authz";
import { createItem, getItem, listItems, updateItem } from "@/lib/directus";
import type { Review, Service, Shop } from "@/lib/types";
import { reviewSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await customerSession();
  if (!session) return unauthorized("Sign in as a customer to leave a review.");

  try {
    const input = reviewSchema.parse(await request.json());

    const shopResult = await getItem<{ data: Shop }>(
      "shops",
      input.shop,
      "?fields=id,active"
    );
    if (!shopResult.data?.active) {
      return NextResponse.json({ message: "Shop not found." }, { status: 404 });
    }

    if (input.service) {
      const serviceResult = await getItem<{ data: Service }>(
        "services",
        input.service,
        "?fields=id,shop,active"
      );
      if (
        !serviceResult.data?.active ||
        Number(serviceResult.data.shop) !== input.shop
      ) {
        return NextResponse.json(
          { message: "That service does not belong to this shop." },
          { status: 400 }
        );
      }
    }

    const serviceFilter = input.service
      ? `filter[service][_eq]=${input.service}`
      : "filter[service][_null]=true";
    const existing = await listItems<Review>(
      "reviews",
      `filter[customer][_eq]=${session.customer.id}&filter[shop][_eq]=${input.shop}&${serviceFilter}&limit=1`
    );

    const body = {
      shop: input.shop,
      service: input.service ?? null,
      customer: session.customer.id,
      rating: input.rating,
      comment: input.comment,
      active: true,
    };

    if (existing[0]) {
      const review = await updateItem<Review>("reviews", existing[0].id, body);
      return NextResponse.json({ review, updated: true });
    }

    const review = await createItem<Review>("reviews", body);
    return NextResponse.json({ review, updated: false }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check your review." },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { message: "Unable to save your review." },
      { status: 500 }
    );
  }
}
