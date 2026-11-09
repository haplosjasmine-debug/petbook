import { NextResponse } from "next/server";
import { adminSession, unauthorized } from "@/lib/authz";
import { settleCommission } from "@/lib/payments";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await adminSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  try {
    const transaction = await settleCommission(Number(id));
    return NextResponse.json({ message: "Commission marked as settled.", transaction });
  } catch {
    return NextResponse.json({ message: "Unable to settle the commission." }, { status: 500 });
  }
}
