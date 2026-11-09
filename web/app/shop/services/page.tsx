import Link from "next/link";
import { Clock, Scissors, Stethoscope } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  DeleteServiceButton,
  ServiceFormDialog,
} from "@/components/shop/service-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { shopServices } from "@/lib/queries";
import { requireShop } from "@/lib/session";
import { formatMoney, titleCase } from "@/lib/utils";

export const metadata = { title: "Services" };

export default async function ShopServicesPage() {
  const session = await requireShop();
  const services = await shopServices(session.shop!.id).catch(() => []);

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Services"
        description="Prices, durations, and availability shown on your public page."
        action={<ServiceFormDialog label="Add service" />}
      />

      {services.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <Card key={service.id} className={service.active ? "" : "opacity-70"}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                      {service.category === "veterinary" ? (
                        <Stethoscope className="h-5 w-5" />
                      ) : (
                        <Scissors className="h-5 w-5" />
                      )}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black">{service.name}</h3>
                        <Badge variant={service.active ? "success" : "secondary"}>
                          {service.active ? "Active" : "Hidden"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-brand-600">
                        {titleCase(service.category)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {service.description || "No description yet."}
                      </p>
                    </div>
                  </div>
                  <p className="whitespace-nowrap text-lg font-black">
                    {formatMoney(service.price)}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {service.duration_min} min
                  </p>
                  <div className="flex items-center gap-1">
                    <ServiceFormDialog service={service} label="Edit" variant="ghost" />
                    <DeleteServiceButton serviceId={service.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Scissors}
          title="No services yet"
          description="Add your first service so customers can book you."
          action={<ServiceFormDialog label="Add your first service" />}
        />
      )}

      <Card className="mt-6 border-dashed bg-white/60">
        <CardContent className="flex flex-col gap-3 p-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Customers see active services on your shop page. Hide a service instead of deleting it
            if it has past appointments.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/shops/${session.shop!.slug}`}>Preview public page</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
