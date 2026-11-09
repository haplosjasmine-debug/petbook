import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { customerSession, unauthorized } from "@/lib/authz";
import { createItem, updateItem } from "@/lib/directus";
import { minimumRedemption, pointsValue } from "@/lib/loyalty";
import { redeemSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await customerSession();
  if (!session) return unauthorized();

  try {
    const input = redeemSchema.parse(await request.json());
    const customer = session.customer;
    const balance = Number(customer.loyalty_points ?? 0);

    if (input.points < minimumRedemption()) {
      return NextResponse.json(
        { message: `You need at least ${minimumRedemption()} points to redeem.` },
        { status: 400 }
      );
    }

    if (input.points > balance) {
      return NextResponse.json(
        { message: `You only have ${balance} points available.` },
        { status: 400 }
      );
    }

    await createItem("loyalty_points", {
      customer: customer.id,
      appointment: null,
      points: -input.points,
      type: "redeemed",
      description:
        input.description ||
        `Redeemed ${input.points} points for ${pointsValue(input.points)} off`,
    });

    await updateItem("customers", customer.id, {
      loyalty_points: balance - input.points,
    });

    return NextResponse.json({
      message: `Redeemed ${input.points} points (${pointsValue(input.points)} off).`,
      remaining: balance - input.points,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check the redemption amount." },
        { status: 422 }
      );
    }
    return NextResponse.json({ message: "Unable to redeem points." }, { status: 500 });
  }
}
