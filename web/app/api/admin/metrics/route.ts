import { NextResponse } from "next/server";
import { adminSession, unauthorized } from "@/lib/authz";
import { emptyAdminMetrics, getAdminMetrics } from "@/lib/admin-metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await adminSession();
  if (!session) return unauthorized();

  try {
    const metrics = await getAdminMetrics();
    return NextResponse.json(metrics, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json(emptyAdminMetrics(), {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
}
