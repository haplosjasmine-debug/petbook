import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { directusFileUrl } from "@/lib/directus";
import { formatDistance } from "@/lib/geo";
import type { Shop } from "@/lib/types";
import { formatMoney, initials } from "@/lib/utils";

export function ShopCard({
  shop,
  serviceCount,
  fromPrice,
  distanceKm,
  ratingAverage,
  reviewCount,
}: {
  shop: Shop;
  serviceCount?: number;
  fromPrice?: number | string | null;
  distanceKm?: number | null;
  ratingAverage?: number;
  reviewCount?: number;
}) {
  const logoUrl = directusFileUrl(shop.logo);

  return (
    <Card className="group overflow-hidden">
      <div className="relative h-36 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute left-5 top-5 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-white/95 text-lg font-black text-brand-700 shadow-sm">
          {logoUrl ? (
            <img src={logoUrl} alt={shop.name} className="h-full w-full object-cover" />
          ) : (
            initials(shop.name)
          )}
        </div>
        {shop.featured ? (
          <Badge className="absolute right-4 top-4 bg-white/95 text-brand-700 hover:bg-white/95">
            Featured
          </Badge>
        ) : null}
      </div>
      <CardContent className="space-y-4 p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-black leading-tight">{shop.name}</h3>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {ratingAverage ? ratingAverage.toFixed(1) : "New"}
              {reviewCount ? (
                <span className="font-semibold text-amber-700/70">({reviewCount})</span>
              ) : null}
            </span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {shop.city || "Philippines"}
            </span>
            {formatDistance(distanceKm) ? (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">
                {formatDistance(distanceKm)}
              </span>
            ) : null}
          </p>
        </div>

        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
          {shop.description || "Caring, professional pet services in a calm environment."}
        </p>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-xs text-muted-foreground">
            {serviceCount ? `${serviceCount} services` : "Grooming & vet care"}
            {fromPrice ? (
              <span className="ml-2 font-bold text-foreground">from {formatMoney(fromPrice)}</span>
            ) : null}
          </div>
          <Button asChild size="sm" variant="soft">
            <Link href={`/shops/${shop.slug}`}>View shop</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
