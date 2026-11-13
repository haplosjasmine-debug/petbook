import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Mail,
  PawPrint,
  Phone,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RemoveCustomerButton } from "@/components/shop/remove-customer-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchUserById, getItem } from "@/lib/directus";
import { customerPets, expanded, shopAppointments, shopCustomerLink } from "@/lib/queries";
import { requireShop } from "@/lib/session";
import type { Customer, DirectusUser, Service } from "@/lib/types";
import { formatDate, formatMoney, initials, titleCase } from "@/lib/utils";

export default async function ShopCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireShop();
  const shop = session.shop!;
  const customerId = Number((await params).id);
  if (!Number.isInteger(customerId) || customerId <= 0) notFound();

  const link = await shopCustomerLink(shop.id, customerId).catch(() => null);
  if (!link) notFound();

  const [customerResult, appointments, pets] = await Promise.all([
    getItem<{ data: Customer }>("customers", customerId, "?fields=*,user.id,user.email"),
    shopAppointments(
      shop.id,
      `&filter[customer][_eq]=${customerId}&fields=*,service.id,service.name`
    ).catch(() => []),
    customerPets(customerId).catch(() => []),
  ]);

  const customer = customerResult.data;
  if (!customer) notFound();

  const expandedUser = expanded<DirectusUser>(customer.user);
  const email =
    expandedUser?.email ??
    (typeof customer.user === "string"
      ? await fetchUserById(customer.user).then((user) => user.email).catch(() => null)
      : null);
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Customer";

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/shop/customers">
          <ArrowLeft className="h-4 w-4" /> Back to customers
        </Link>
      </Button>

      <PageHeader
        eyebrow="Customer profile"
        title={name}
        description="Contact details, pets, and visits shared with your shop."
        action={<RemoveCustomerButton customerId={customer.id} customerName={name} />}
      />

      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr] xl:items-start">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-100 text-xl font-black text-brand-700">
                  {initials(name)}
                </span>
                <div>
                  <h2 className="text-lg font-black">{name}</h2>
                  <p className="text-xs text-muted-foreground">
                    Customer since {formatDate(customer.date_created, false)}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                {email ? (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 text-brand-600" />
                    <span className="truncate text-foreground">{email}</span>
                  </p>
                ) : null}
                {customer.phone ? (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 text-brand-600" />
                    <span className="text-foreground">{customer.phone}</span>
                  </p>
                ) : null}
                <p className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-brand-600" />
                  <span className="text-foreground">
                    {appointments.length} visit{appointments.length === 1 ? "" : "s"}
                  </span>
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="h-4 w-4 text-brand-600" />
                  <span className="text-foreground">
                    {customer.loyalty_points ?? 0} loyalty points
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PawPrint className="h-4 w-4 text-brand-600" /> Pets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pets.length ? (
                pets.map((pet) => (
                  <div key={pet.id} className="flex items-center gap-3 rounded-xl border p-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-black text-brand-700">
                      {initials(pet.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold">{pet.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[titleCase(pet.species), pet.breed].filter(Boolean).join(" - ")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No pets on file yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visit history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.length ? (
              appointments.map((appointment) => {
                const service = expanded<Service>(appointment.service);
                return (
                  <div
                    key={appointment.id}
                    className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-bold">{service?.name ?? "Appointment"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(appointment.start_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">
                        {formatMoney(appointment.price)}
                      </span>
                      <StatusBadge status={appointment.status} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No appointments yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
