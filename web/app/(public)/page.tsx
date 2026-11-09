import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  HeartPulse,
  MapPin,
  PawPrint,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ServiceCard } from "@/components/service-card";
import { ShopCard } from "@/components/shop-card";
import {
  getAnnouncements,
  getFeaturedShops,
  getHomeContent,
  getPublicServices,
  getServicesForShops,
} from "@/lib/public-data";
import { formatDate } from "@/lib/utils";

export default async function HomePage() {
  const [content, shops, services, announcements] = await Promise.all([
    getHomeContent(),
    getFeaturedShops(3),
    getPublicServices(),
    getAnnouncements(3),
  ]);

  const shopIds = shops.map((shop) => shop.id);
  const shopServices = await getServicesForShops(shopIds);
  const featuredServices = services.slice(0, 6);

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

          <div className="relative hidden lg:block">
            <div className="absolute inset-6 rounded-[2rem] bg-white/10 blur-2xl" />
            <div className="relative space-y-4 rounded-[2rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="rounded-2xl bg-white p-5 text-foreground shadow-soft">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                      <Scissors className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-black">Full grooming session</p>
                      <p className="text-xs text-muted-foreground">Happy Paws Grooming · 90 min</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    Confirmed
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-muted-foreground">When</p>
                    <p className="mt-1 font-bold">Sat, 10:30 AM</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-muted-foreground">Pet</p>
                    <p className="mt-1 font-bold">Biscuit · Shih Tzu</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <BellRing className="h-5 w-5 text-coral-400" />
                  <p className="mt-3 text-sm font-bold">Reminder sent</p>
                  <p className="text-xs text-brand-100/70">24 hours before every visit</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <ShieldCheck className="h-5 w-5 text-brand-300" />
                  <p className="mt-3 text-sm font-bold">Vaccines tracked</p>
                  <p className="text-xs text-brand-100/70">Never miss a due date</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-coral-400 text-coral-400" />
                    <p className="text-sm font-bold">4.9 from 2,300 reviews</p>
                  </div>
                  <div className="flex -space-x-2">
                    {["AR", "MJ", "LC", "KS"].map((item) => (
                      <span
                        key={item}
                        className="grid h-7 w-7 place-items-center rounded-full border-2 border-brand-900 bg-brand-200 text-[10px] font-black text-brand-800"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
                <Link href="/register?role=shop_owner">List your shop</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="bg-secondary/60 py-16">
        <div className="page-shell">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="eyebrow">Popular services</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight">
                Everything your pet needs, in one place
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                From routine grooming to veterinary checkups, compare services and book the right
                care in minutes.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { icon: Scissors, label: "Grooming & spa" },
                  { icon: Stethoscope, label: "Veterinary care" },
                  { icon: PawPrint, label: "Boarding & day care" },
                  { icon: CheckCircle2, label: "Vaccination packages" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm font-semibold">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-brand-700 shadow-sm">
                      <item.icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </div>
                ))}
              </div>
              <Button asChild className="mt-6">
                <Link href="/services">Explore services</Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {featuredServices.length ? (
                featuredServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))
              ) : (
                <Card className="sm:col-span-2">
                  <CardContent className="p-8 text-center text-sm text-muted-foreground">
                    Services appear here once partner shops are published.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

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
                reminders, and keep every pet record organised. One simple 10% commission on
                completed bookings — no monthly fee.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="accent">
                  <Link href="/register?role=shop_owner">List your shop</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/5 text-white hover:bg-white/15"
                >
                  <Link href="/about#commission">See pricing</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "10%", label: "Commission only" },
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
