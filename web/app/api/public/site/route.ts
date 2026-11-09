import { NextResponse } from "next/server";
import {
  getAnnouncements,
  getFeaturedShops,
  getHomeContent,
  getPublicServices,
} from "@/lib/public-data";

export async function GET() {
  const [content, shops, services, announcements] = await Promise.all([
    getHomeContent(),
    getFeaturedShops(6),
    getPublicServices(),
    getAnnouncements(5),
  ]);

  return NextResponse.json({ content, shops, services, announcements });
}
