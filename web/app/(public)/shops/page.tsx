import Link from "next/link";
import { LocateFixed, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { NearMeButton } from "@/components/near-me-button";
import { ShopCard } from "@/components/shop-card";
import { ShopMap } from "@/components/shop-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  distanceKm as calculateDistance,
  mapCenter,
  parseCoordinates,
  shopCoordinates,
} from "@/lib/geo";
import {
  getActiveShops,
  getReviewSummaries,
  getServicesForShops,
} from "@/lib/public-data";

export const metadata = { title: "Find a shop" };

export default async function ShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; lat?: string; lng?: string }>;
}) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const userLocation = parseCoordinates(params.lat, params.lng);
  const loadedShops = await getActiveShops(search);

  const distanceByShop = new Map<number, number>();
  if (userLocation) {
    loadedShops.forEach((shop) => {
      const coords = shopCoordinates(shop);
      if (coords) distanceByShop.set(shop.id, calculateDistance(userLocation, coords));
    });
  }

  const shops = userLocation
    ? [...loadedShops].sort((a, b) => {
        const aDistance = distanceByShop.get(a.id) ?? Number.POSITIVE_INFINITY;
        const bDistance = distanceByShop.get(b.id) ?? Number.POSITIVE_INFINITY;
        return aDistance - bDistance;
      })
    : loadedShops;

  const [services, reviewSummaries] = await Promise.all([
    getServicesForShops(shops.map((shop) => shop.id)),
    getReviewSummaries(shops.map((shop) => shop.id)),
  ]);
  const mappedShops = shops
    .map((shop) => ({ shop, coords: shopCoordinates(shop) }))
    .filter((item): item is { shop: (typeof shops)[number]; coords: NonNullable<ReturnType<typeof shopCoordinates>> } =>
      Boolean(item.coords)
    );
  const center = mapCenter(
    mappedShops.map((item) => item.coords),
    userLocation ?? undefined
  );

  return (
    <section className="page-shell py-12">
      <div className="rounded-[2rem] bg-brand-900 px-6 py-10 text-white sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-200">
          Trusted pet care
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Find a shop near you</h1>
        <p className="mt-2 max-w-xl text-sm text-brand-100/80">
          Compare grooming salons, veterinary clinics, and pet care partners in your area.
        </p>

        <form className="mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row" action="/shops">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search by shop name"
              className="h-11 border-white/20 bg-white pl-10 text-foreground"
            />
          </div>
          <Button type="submit" variant="accent" className="h-11">
            Search shops
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <NearMeButton
            search={search}
            className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
          />
          <span className="inline-flex items-center gap-1.5 text-xs text-brand-100/70">
            <LocateFixed className="h-3.5 w-3.5" />
            {userLocation
              ? "Sorted by distance from your GPS location"
              : "GPS sorting shows the closest shops first"}
          </span>
        </div>
      </div>

      {mappedShops.length ? (
        <div className="mt-8 overflow-hidden rounded-[1.75rem] border bg-white p-2 shadow-card">
          <ShopMap
            shops={mappedShops.map((item) => item.shop)}
            userLocation={userLocation}
            center={center}
            height={380}
          />
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">
            {search ? `Results for “${search}”` : "All partner shops"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {shops.length} {shops.length === 1 ? "shop" : "shops"} available
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Verified PetBook partners
        </div>
      </div>

      {shops.length ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => {
            const related = services.filter((service) => Number(service.shop) === shop.id);
            const fromPrice = related.length
              ? Math.min(...related.map((service) => Number(service.price)))
              : null;
            return (
              <ShopCard
                key={shop.id}
                shop={shop}
                serviceCount={related.length}
                fromPrice={fromPrice}
                distanceKm={distanceByShop.get(shop.id) ?? null}
                ratingAverage={reviewSummaries.get(shop.id)?.average}
                reviewCount={reviewSummaries.get(shop.id)?.count}
              />
            );
          })}
        </div>
      ) : (
        <Card className="mt-6 border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <MapPin className="h-8 w-8 text-brand-600" />
            <h3 className="text-lg font-bold">No shops found</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Try a different search, or invite your favourite local shop to join PetBook.
            </p>
            <div className="mt-2 flex gap-2">
              <Button asChild variant="outline">
                <Link href="/shops">Clear search</Link>
              </Button>
              <Button asChild>
                <Link href="/business/apply">Apply as a business</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
