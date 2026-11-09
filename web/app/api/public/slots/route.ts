import { NextResponse } from "next/server";
import { getItem } from "@/lib/directus";
import { buildSlots } from "@/lib/booking";
import { serviceWindow } from "@/lib/service-availability";
import type { Service } from "@/lib/types";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const shopId = Number(params.get("shopId"));
  const serviceId = Number(params.get("serviceId"));
  const staffId = params.get("staffId") ? Number(params.get("staffId")) : null;
  const date = params.get("date") ?? "";

  if (!Number.isFinite(shopId) || !Number.isFinite(serviceId) || !date) {
    return NextResponse.json({ message: "Missing booking details." }, { status: 400 });
  }

  try {
    const result = await getItem<{ data: Service }>("services", serviceId, "?fields=*");
    const service = result.data;
    if (!service || service.shop !== shopId) {
      return NextResponse.json({ message: "Service not found." }, { status: 404 });
    }

    const availability = serviceWindow(service);
    const slots = await buildSlots({
      shopId,
      staffId,
      date,
      durationMin: Number(service.duration_min),
      opensAt: availability.from,
      closesAt: availability.to,
      availableDays: service.available_days,
    });

    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json({ slots: [] });
  }
}
