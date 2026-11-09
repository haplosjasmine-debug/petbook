import { NextResponse } from "next/server";
import { getActiveShops, getServicesForShops } from "@/lib/public-data";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams.get("search") ?? "";
  try {
    const shops = await getActiveShops(search);
    const services = await getServicesForShops(shops.map((shop) => shop.id));
    return NextResponse.json({ shops, services });
  } catch {
    return NextResponse.json({ shops: [], services: [] });
  }
}
