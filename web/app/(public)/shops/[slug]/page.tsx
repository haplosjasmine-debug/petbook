import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Navigation,
  Package,
  Phone,
  Scissors,
  Star,
  Stethoscope,
  Users,
} from "lucide-react";
import { ServiceImageCollage } from "@/components/service-images";
import { ShopMap } from "@/components/shop-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { shopCoordinates } from "@/lib/geo";
import { getShopProfile } from "@/lib/public-data";
import { serviceAvailabilityLabel } from "@/lib/service-availability";
import { formatMoney, initials, titleCase } from "@/lib/utils";

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getShopProfile(slug);
  if (!profile) notFound();

  const { shop, services, staff, packages } = profile;
  const coords = shopCoordinates(shop);
  const directionsUrl = coords
    ? `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}`
    : null;

  return (
    <>
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <div className="hero-grid absolute inset-0 opacity-50" />
        <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-coral-500/20 blur-3xl" />
        <div className="page-shell relative grid gap-8 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/15 text-white hover:bg-white/15">Verified partner</Badge>
              {shop.featured ? (
                <Badge className="bg-coral-500 text-white hover:bg-coral-500">Featured</Badge>
              ) : null}
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{shop.name}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-4 text-sm text-brand-100/80">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {shop.address || shop.city || "Philippines"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-coral-400 text-coral-400" /> 4.9 · 312 reviews
              </span>
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-brand-100/85">
              {shop.description ||
                "A trusted PetBook partner offering thoughtful grooming and care for pets of every size."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href={`/dashboard/book?shop=${shop.id}`}>
                  Book an appointment <CalendarCheck className="h-4 w-4" />
                </Link>
              </Button>
              {shop.phone ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/5 text-white hover:bg-white/15"
                >
                  <a href={`tel:${shop.phone}`}>
                    <Phone className="h-4 w-4" /> Call shop
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-lg font-black text-brand-700">
                {initials(shop.name)}
              </span>
              <div>
                <p className="text-sm font-bold">Open today</p>
                <p className="text-xs text-brand-100/70">9:00 AM – 6:00 PM</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-brand-100/60">Services</p>
                <p className="mt-1 text-lg font-black">{services.length}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-brand-100/60">Team members</p>
                <p className="mt-1 text-lg font-black">{staff.length}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-brand-100/60">From</p>
                <p className="mt-1 text-lg font-black">
                  {services.length
                    ? formatMoney(Math.min(...services.map((service) => Number(service.price))))
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-brand-100/60">Status</p>
                <p className="mt-1 text-lg font-black">Verified</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-10">
            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Services</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">Book a service</h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {services.length ? (
                  services.map((service) => (
                    <Card key={service.id}>
                      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                          {service.images?.length ? (
                            <ServiceImageCollage
                              images={service.images}
                              name={service.name}
                              className="h-24 w-24 shrink-0 rounded-xl sm:h-28 sm:w-32"
                            />
                          ) : (
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                              {service.category === "veterinary" ? (
                                <Stethoscope className="h-5 w-5" />
                              ) : (
                                <Scissors className="h-5 w-5" />
                              )}
                            </span>
                          )}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-black">{service.name}</h3>
                              <Badge variant="secondary">{titleCase(service.category)}</Badge>
                            </div>
                            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                              {service.description || "Professional care from a trusted team."}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> {service.duration_min} minutes
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />{" "}
                                {serviceAvailabilityLabel(service)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-t pt-3 sm:border-0 sm:pt-0">
                          <p className="text-lg font-black text-brand-700">
                            {formatMoney(service.price)}
                          </p>
                          <Button asChild size="sm">
                            <Link href={`/dashboard/book?shop=${shop.id}&service=${service.id}`}>
                              Book
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-sm text-muted-foreground">
                      This shop has not published services yet.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {packages.length ? (
              <div>
                <p className="eyebrow">Packages</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">Save with packages</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {packages.map((pack) => (
                    <Card key={pack.id}>
                      <CardContent className="p-5">
                        <Package className="h-5 w-5 text-brand-600" />
                        <h3 className="mt-3 font-black">{pack.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{pack.description}</p>
                        <p className="mt-3 text-lg font-black text-brand-700">{formatMoney(pack.price)}</p>
                        <p className="text-xs text-muted-foreground">
                          {pack.sessions} sessions · valid {pack.validity_days} days
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <p className="eyebrow">Meet the team</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">People who care</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {staff.length ? (
                  staff.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="flex items-start gap-4 p-5">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-100 font-black text-brand-700">
                          {initials(member.name)}
                        </span>
                        <div>
                          <h3 className="font-black">{member.name}</h3>
                          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                            {titleCase(member.role)}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {member.bio || "Experienced and gentle with every pet."}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="sm:col-span-2">
                    <CardContent className="p-6 text-sm text-muted-foreground">
                      Team profiles are coming soon.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            {coords ? (
              <Card className="overflow-hidden">
                <ShopMap shops={[shop]} center={coords} zoom={15} height={220} />
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-black">Find the shop</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {shop.address || shop.city || "Open in maps for directions"}
                    </p>
                  </div>
                  {directionsUrl ? (
                    <Button asChild size="sm" variant="soft">
                      <a href={directionsUrl} target="_blank" rel="noreferrer">
                        <Navigation className="h-4 w-4" /> Directions
                      </a>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardContent className="space-y-4 p-6">
                <h3 className="text-lg font-black">Shop details</h3>
                <div className="space-y-3 text-sm">
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    <span>{shop.address || "Address available on request"}{shop.city ? `, ${shop.city}` : ""}</span>
                  </p>
                  {shop.phone ? (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-brand-600" />
                      <a href={`tel:${shop.phone}`} className="hover:underline">
                        {shop.phone}
                      </a>
                    </p>
                  ) : null}
                  {shop.email ? (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-brand-600" />
                      <a href={`mailto:${shop.email}`} className="hover:underline">
                        {shop.email}
                      </a>
                    </p>
                  ) : null}
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand-600" /> Mon–Sat, 9:00 AM – 6:00 PM
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="flex items-center gap-2 text-lg font-black">
                  <CheckCircle2 className="h-5 w-5 text-brand-600" /> Book with confidence
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>Instant confirmation</li>
                  <li>Automatic SMS reminder 24h before</li>
                  <li>Secure online payment options</li>
                  <li>Loyalty points on every completed visit</li>
                </ul>
                <Button asChild className="mt-5 w-full" variant="soft">
                  <Link href={`/dashboard/book?shop=${shop.id}`}>Start booking</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
                <Users className="h-5 w-5 text-brand-600" />
                <span>{staff.length} team members ready to help</span>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </>
  );
}
