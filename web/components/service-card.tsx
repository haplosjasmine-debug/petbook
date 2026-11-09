import Link from "next/link";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { ServiceImageCollage } from "@/components/service-images";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { serviceAvailabilityLabel } from "@/lib/service-availability";
import type { Service, Shop } from "@/lib/types";
import { formatMoney, titleCase } from "@/lib/utils";

export function ServiceCard({ service }: { service: Service }) {
  const shop = typeof service.shop === "object" ? (service.shop as Shop) : null;

  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <ServiceImageCollage images={service.images} name={service.name} />

        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="secondary" className="mb-2">
              {titleCase(service.category)}
            </Badge>
            <h3 className="text-base font-black leading-tight">{service.name}</h3>
          </div>
          <p className="whitespace-nowrap text-lg font-black text-brand-700">
            {formatMoney(service.price)}
          </p>
        </div>

        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
          {service.description || "Professional care from a trusted PetBook partner."}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {service.duration_min} min
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> {serviceAvailabilityLabel(service)}
          </span>
          {shop ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {shop.name}
            </span>
          ) : null}
        </div>

        {shop ? (
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/shops/${shop.slug}`}>View shop</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
