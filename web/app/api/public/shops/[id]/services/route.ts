import { NextResponse } from "next/server";
import { getShopServiceOptions } from "@/lib/public-data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const shopId = Number(id);
  if (!Number.isFinite(shopId)) {
    return NextResponse.json({ message: "Invalid shop." }, { status: 400 });
  }

  try {
    const data = await getShopServiceOptions(shopId);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ services: [], staff: [] });
  }
}
