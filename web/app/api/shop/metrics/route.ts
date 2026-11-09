import { NextResponse } from "next/server";
import { shopSession, unauthorized } from "@/lib/authz";
import { emptyShopRevenueMetrics, getShopRevenueMetrics } from "@/lib/shop-metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await shopSession();
  if (!session) return unauthorized();

  try {
    const metrics = await getShopRevenueMetrics(session.shop.id);
    return NextResponse.json(metrics, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json(emptyShopRevenueMetrics(), {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
}
