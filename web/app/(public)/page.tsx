import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  HeartPulse,
  MapPin,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { LandingPage } from "@/components/landing-page";
import { ShopGalleryGrid } from "@/components/shop-gallery-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShopCard } from "@/components/shop-card";
import {
  getAnnouncements,
  getFeaturedGallery,
  getFeaturedShops,
  getHomeContent,
  getServicesForShops,
} from "@/lib/public-data";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function HomePage() {
  const session = await getSession();

  if (session?.appRole !== "pet_owner") {
    return <LandingPage />;
  }

  return <CustomerHomePage />;
}

async function CustomerHomePage() {
  const [content, shops, gallery, announcements] = await Promise.all([
    getHomeContent(),
    getFeaturedShops(3),
    getFeaturedGallery(6),
    getAnnouncements(3),
  ]);

  const shopIds = shops.map((shop) => shop.id);
  const shopServices = await getServicesForShops(shopIds);

  return (
    <>
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <div className="hero-grid absolute inset-0 opacity-60" />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-coral-500/20 blur-3xl" />

        <div className="page-shell relative grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-brand-100">
              <Sparkles className="h-3.5 w-3.5" /> {content.eyebrow}
            </span>
            <h1 className="mt-5 text-balance text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {content.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-100/85 sm:text-lg">
              {content.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/shops">
                  {content.primaryCta} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/5 text-white hover:bg-white/15"
              >
                <Link href="/register">{content.secondaryCta}</Link>
              </Button>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/15 pt-6">
              {content.stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="text-xs text-brand-100/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-[29rem] lg:block">
            <div className="pointer-events-none absolute -inset-10 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -inset-5 rounded-[3.4rem] border border-dashed border-white/10 motion-safe:animate-spin-slow" />
            <div className="pointer-events-none absolute -right-14 -top-10 h-36 w-36 rounded-full border border-white/10">
              <div className="absolute inset-4 rounded-full border border-dashed border-white/15" />
            </div>

            <PawPrint className="pointer-events-none absolute -left-14 top-10 h-9 w-9 -rotate-12 text-white/15 motion-safe:animate-float-slow" />
            <PawPrint className="pointer-events-none absolute -right-12 bottom-36 h-6 w-6 rotate-12 text-coral-300/30 motion-safe:animate-float" />

            <div className="relative motion-safe:animate-fade-up">
              <div className="absolute -left-6 top-24 z-20 hidden motion-safe:animate-float-slow xl:block">
                <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-brand-950/80 px-3 py-2 shadow-soft backdrop-blur">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  </span>
                  <span className="text-xs font-bold">3 shops free today</span>
                </div>
              </div>

              <div className="relative aspect-[4/5] overflow-hidden rounded-[2.8rem] border border-white/20 bg-white/10 p-2 shadow-[0_30px_90px_-24px_rgba(0,0,0,0.7)]">
                <div className="relative h-full overflow-hidden rounded-[2.3rem]">
                  <Image
                    src="/images/home/hero-dog.jpg"
                    alt="A happy golden retriever enjoying a day at the groomer"
                    fill
                    priority
                    sizes="(min-width: 1024px) 29rem, 100vw"
                    className="object-cover object-[center_32%] transition duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/25 to-transparent" />
                  <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-brand-800 shadow-sm backdrop-blur">
                      <Sparkles className="h-3.5 w-3.5" /> Pet of the day
                    </span>
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur">
                      <PawPrint className="h-4 w-4" />
                    </span>
                  </div>

                  <div className="absolute inset-x-4 bottom-4">
                    <div className="rounded-[1.7rem] border border-white/20 bg-white/95 p-4 text-foreground shadow-soft">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl">
                            <Image
                              src="/images/home/hero-puppy.jpg"
                              alt="Biscuit the puppy"
                              fill
                              sizes="3rem"
                              className="object-cover"
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black">Biscuit&apos;s spa day</p>
                            <p className="truncate text-xs text-muted-foreground">
                              Happy Paws Grooming · 10:30 AM
                            </p>
                          </div>
                        </div>
                        <Badge className="shrink-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                          Confirmed
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                          <ShieldCheck className="h-3.5 w-3.5 text-brand-600" /> Vaccines up to date
                        </span>
                        <span className="text-[11px] font-black text-brand-700">View booking</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-10 top-20 z-20 w-36 motion-safe:animate-float-delayed">
                <div className="rounded-[1.5rem] border border-white/25 bg-white p-2 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[1.1rem]">
                    <Image
                      src="/images/home/hero-cat.jpg"
                      alt="A relaxed cat after grooming"
                      fill
                      sizes="9rem"
                      className="object-cover"
                    />
                  </div>
                  <div className="px-2 pb-1 pt-2">
                    <p className="text-[11px] font-black text-foreground">Grooming, sorted</p>
                    <p className="text-[10px] text-muted-foreground">Loved by 2,300 pet parents</p>
                  </div>
                </div>
              </div>

              <div className="absolute -left-9 bottom-32 z-20 w-44 motion-safe:animate-float">
                <div className="rounded-2xl bg-coral-500 p-4 text-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
                  <div className="flex gap-0.5" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-3.5 w-3.5 fill-white text-white" />
                    ))}
                  </div>
                  <p className="mt-2 text-xs font-bold leading-snug">
                    “Booking took 30 seconds. Biscuit looks amazing.”
                  </p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
                    Jasmine · Makati
                  </p>
                </div>
              </div>

              <div className="absolute -right-6 bottom-14 z-20 grid h-16 w-16 place-items-center rounded-full border border-white/25 bg-brand-900/80 text-white shadow-soft backdrop-blur motion-safe:animate-float-slow">
                <div className="text-center">
                  <ShieldCheck className="mx-auto h-5 w-5 text-brand-300" />
                  <p className="mt-0.5 text-[9px] font-black uppercase tracking-wide">Verified</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="relative border-t border-white/10 bg-brand-950/30 py-3.5 backdrop-blur">
          <div className="flex w-max motion-safe:animate-marquee">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex shrink-0 items-center gap-8 pr-8 text-[11px] font-black uppercase tracking-[0.2em] text-brand-100"
              >
                {[0, 1, 2].map((group) =>
                  ["Grooming", "Vet visits", "Boarding", "Vaccines", "Spa days", "Day care"].map(
                    (item) => (
                      <span
                        key={`${group}-${item}`}
                        className="flex items-center gap-2.5 whitespace-nowrap"
                      >
                        <PawPrint className="h-3.5 w-3.5 text-coral-300" /> {item}
                      </span>
                    )
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b bg-white/70">
        <div className="page-shell grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarCheck, label: "Instant booking", text: "Pick a time that suits you" },
            { icon: BellRing, label: "Smart reminders", text: "SMS & email before visits" },
            { icon: HeartPulse, label: "Health records", text: "Vaccines and visit history" },
            { icon: ShieldCheck, label: "Verified partners", text: "Trusted local businesses" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Featured partners</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight">Caring shops near you</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Hand-picked groomers and clinics that treat every pet like family.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/shops">
              Browse all shops <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {shops.length ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => {
              const related = shopServices.filter((service) => Number(service.shop) === shop.id);
              const fromPrice = related.length
                ? Math.min(...related.map((service) => Number(service.price)))
                : null;
              return (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  serviceCount={related.length}
                  fromPrice={fromPrice}
                />
              );
            })}
          </div>
        ) : (
          <Card className="mt-8 border-dashed bg-white/60">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <MapPin className="h-8 w-8 text-brand-600" />
              <h3 className="text-lg font-bold">Partner shops are being added</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Run the Directus setup and seed scripts to load demo shops, or list your own
                business to be one of the first.
              </p>
              <Button asChild className="mt-2">
                <Link href="/business/apply">Apply as a business</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {gallery.length ? (
        <section id="gallery" className="scroll-mt-20 bg-secondary/60 py-16">
          <div className="page-shell">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Customer gallery</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight">
                  Happy pets, fresh from the shop
                </h2>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  Real photos from partner shops. See the wags, purrs, and fresh cuts before you
                  book.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/shops">
                  Browse shop galleries <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ShopGalleryGrid items={gallery} showShop className="mt-8" />
          </div>
        </section>
      ) : null}

      <section className="page-shell py-16">
        <div className="text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Three calm steps to a happy pet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            No phone tag, no lost paper records. Just thoughtful care from start to finish.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: MapPin,
              step: "01",
              title: "Find a trusted shop",
              text: "Search by city or service, compare prices, and read what other pet owners say.",
            },
            {
              icon: CalendarCheck,
              step: "02",
              title: "Book in a minute",
              text: "Choose your pet, service, staff member, and a time that works for your day.",
            },
            {
              icon: BellRing,
              step: "03",
              title: "Relax and stay on track",
              text: "Get reminders, keep vaccine records, and collect loyalty points automatically.",
            },
          ].map((item) => (
            <Card key={item.step} className="relative overflow-hidden">
              <CardContent className="p-6">
                <span className="absolute right-4 top-3 text-5xl font-black text-brand-50">
                  {item.step}
                </span>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                  <item.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {announcements.length ? (
        <section className="page-shell pb-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">From the community</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">News & announcements</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardContent className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {formatDate(announcement.date_created, false)}
                  </p>
                  <h3 className="mt-2 text-base font-black">{announcement.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {announcement.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="page-shell pb-20">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 to-brand-900 p-8 text-white sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-200">
                For pet care businesses
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Grow your shop with PetBook
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-100/80">
                Get a polished booking page, manage your calendar and staff, send automatic
                reminders, and keep every pet record organised. No setup fee and no monthly fee.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="accent">
                  <Link href="/business/apply">Apply as a business</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/5 text-white hover:bg-white/15"
                >
                  <Link href="/about">See partner benefits</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "Verified", label: "Partner shops" },
                { value: "0", label: "Monthly fees" },
                { value: "24/7", label: "Online bookings" },
                { value: "SMS", label: "Automatic reminders" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
                >
                  <p className="text-2xl font-black">{item.value}</p>
                  <p className="text-xs text-brand-100/70">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
