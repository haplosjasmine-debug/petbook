import Link from "next/link";
import { PawPrint } from "lucide-react";
import { BookingWizard } from "@/components/booking-wizard";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { customerPets } from "@/lib/queries";
import { getActiveShops } from "@/lib/public-data";
import { requireCustomer } from "@/lib/session";

export const metadata = { title: "Book an appointment" };

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; service?: string }>;
}) {
  const session = await requireCustomer();
  const params = await searchParams;

  const [shops, pets] = await Promise.all([
    getActiveShops().catch(() => []),
    customerPets(session.customer!.id).catch(() => []),
  ]);

  const initialShopId = Number(params.shop);
  const initialServiceId = Number(params.service);

  return (
    <>
      <PageHeader
        eyebrow="New booking"
        title="Book an appointment"
        description="Choose a shop, service, and time that works for you. You can pay at the shop or online."
      />

      {pets.length ? (
        <BookingWizard
          shops={shops}
          pets={pets}
          initialShopId={Number.isFinite(initialShopId) ? initialShopId : undefined}
          initialServiceId={Number.isFinite(initialServiceId) ? initialServiceId : undefined}
        />
      ) : (
        <EmptyState
          icon={PawPrint}
          title="Add a pet first"
          description="We need your pet's details before we can book a service."
          action={
            <Button asChild>
              <Link href="/dashboard/pets">Add your first pet</Link>
            </Button>
          }
        />
      )}
    </>
  );
}
