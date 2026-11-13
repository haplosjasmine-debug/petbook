import Link from "next/link";
import { CalendarDays, Mail, PawPrint, Phone, UserRound, Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchUsersByIds } from "@/lib/directus";
import { expanded, relationId, shopAppointments, shopCustomers } from "@/lib/queries";
import { requireShop } from "@/lib/session";
import type { Customer, DirectusUser } from "@/lib/types";
import { formatDate, initials } from "@/lib/utils";

export const metadata = { title: "Customers" };

export default async function ShopCustomersPage() {
  const session = await requireShop();
  const shop = session.shop!;
  const [links, appointments] = await Promise.all([
    shopCustomers(shop.id).catch(() => []),
    shopAppointments(shop.id).catch(() => []),
  ]);

  const userIds = [
    ...new Set(
      links.flatMap((link) => {
        const customer = expanded<Customer>(link.customer);
        return customer && typeof customer.user === "string" ? [customer.user] : [];
      })
    ),
  ];
  const users = await fetchUsersByIds(userIds).catch(() => []);
  const userMap = new Map(users.map((user) => [user.id, user]));

  const visits = new Map<number, { count: number; lastVisit: string | null }>();
  for (const appointment of appointments) {
    const customerId = relationId(appointment.customer);
    if (!customerId) continue;
    const current = visits.get(customerId) ?? { count: 0, lastVisit: null };
    current.count += 1;
    if (!current.lastVisit || appointment.start_at > current.lastVisit) {
      current.lastVisit = appointment.start_at;
    }
    visits.set(customerId, current);
  }

  const rows = links
    .flatMap((link) => {
      const customer = expanded<Customer>(link.customer);
      if (!customer) return [];
      const user =
        expanded<DirectusUser>(customer.user) ??
        (typeof customer.user === "string" ? userMap.get(customer.user) : undefined);
      return [
        {
          customer,
          email: user?.email ?? null,
          visits: visits.get(customer.id)?.count ?? 0,
          lastVisit: visits.get(customer.id)?.lastVisit ?? null,
        },
      ];
    })
    .sort((a, b) => (b.lastVisit ?? "").localeCompare(a.lastVisit ?? ""));

  return (
    <>
      <PageHeader
        eyebrow="Relationships"
        title="Customers"
        description="People who have booked with your shop. Open a profile to see their pets and visit history."
      />

      {rows.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map(({ customer, email, visits: visitCount, lastVisit }) => {
            const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ");
            return (
              <Card key={customer.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-100 text-lg font-black text-brand-700">
                      {initials(name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black">{name || "Customer"}</h3>
                      <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                        {email ? (
                          <p className="inline-flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" /> {email}
                          </p>
                        ) : null}
                        {customer.phone ? (
                          <p className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" /> {customer.phone}
                          </p>
                        ) : null}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" /> {visitCount} visit
                          {visitCount === 1 ? "" : "s"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <PawPrint className="h-3.5 w-3.5" /> Last visit{" "}
                          {formatDate(lastVisit, false)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end border-t pt-3">
                    <Button asChild size="sm" variant="soft">
                      <Link href={`/shop/customers/${customer.id}`}>
                        <UserRound className="h-4 w-4" /> View profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Customers appear here after their first booking with your shop."
        />
      )}
    </>
  );
}
