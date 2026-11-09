import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Heart,
  HeartHandshake,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "About" };

const values = [
  {
    icon: Heart,
    title: "Care comes first",
    text: "Every decision starts with the pet's comfort and the owner's peace of mind.",
  },
  {
    icon: ShieldCheck,
    title: "Trust is earned",
    text: "We partner with verified businesses and keep records transparent and secure.",
  },
  {
    icon: Sparkles,
    title: "Simple is kind",
    text: "Booking, reminders, and records should feel calm — never like another chore.",
  },
  {
    icon: HeartHandshake,
    title: "Small businesses matter",
    text: "We give local groomers and clinics the tools to look professional and grow.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-brand-900 text-white">
        <div className="page-shell grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-200">
              About PetBook
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Built for pets, shaped by the people who care for them.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-100/85">
              PetBook started with a simple frustration: booking pet care should not mean
              late-night phone calls, lost vaccination cards, and missed reminders. We bring
              trusted local businesses and pet owners together in one calm, reliable place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/shops">
                  Find a shop <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/5 text-white hover:bg-white/15"
              >
                <Link href="/register?role=shop_owner">Partner with us</Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "40+", label: "Partner businesses" },
              { value: "12k+", label: "Appointments booked" },
              { value: "98%", label: "Reminder delivery" },
              { value: "10%", label: "Simple commission" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur"
              >
                <p className="text-3xl font-black">{stat.value}</p>
                <p className="mt-1 text-sm text-brand-100/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-16">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">Our mission</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight">
              Make great pet care easier to find, book, and remember.
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              We believe pet care businesses do their best work when they are not buried in
              paperwork. And pet owners make better decisions when they can see clear prices,
              trusted reviews, and a booking experience that respects their time.
            </p>
            <p>
              PetBook connects both sides: a polished storefront and booking engine for shops, and
              a personal health hub for owners. Vaccination records, appointment reminders, loyalty
              points, and payment history all live in one place.
            </p>
            <p>
              Our revenue model is intentionally simple. Pet care businesses pay a 10% commission
              on completed bookings. There are no monthly fees, no setup fees, and no surprises.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-secondary/60 py-16">
        <div className="page-shell">
          <div className="text-center">
            <p className="eyebrow">What we value</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight">The principles behind PetBook</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <Card key={value.title}>
                <CardContent className="p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                    <value.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-black">{value.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{value.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="commission" className="page-shell py-16">
        <div className="grid gap-8 rounded-[2rem] border bg-white p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">Pricing</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">
              One fair commission. No monthly fees.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Listing your shop and using the dashboard is free. PetBook only earns when you earn:
              a 10% commission is recorded on completed appointments and settled transparently.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Free shop listing and booking page",
                "Calendar, staff, and service management",
                "Automatic SMS and email reminders",
                "Commission tracking and monthly settlement",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-100 text-[10px] font-black text-brand-700">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-brand-900 p-8 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-200">
              Simple pricing
            </p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-6xl font-black">10%</span>
              <span className="pb-2 text-sm text-brand-100/70">per completed booking</span>
            </div>
            <div className="mt-6 space-y-3 border-t border-white/15 pt-6 text-sm text-brand-100/80">
              <p className="flex items-center gap-2">
                <PawPrint className="h-4 w-4 text-coral-400" /> No monthly subscription
              </p>
              <p className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-coral-400" /> Grooming, vet, and packages
              </p>
              <p className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-coral-400" /> Reminders included
              </p>
            </div>
            <Button asChild variant="accent" className="mt-8 w-full">
              <Link href="/register?role=shop_owner">List your shop</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="page-shell pb-20">
        <div className="rounded-[2rem] bg-gradient-to-br from-brand-700 to-brand-900 p-8 text-center text-white sm:p-12">
          <h2 className="text-3xl font-black tracking-tight">Join a calmer pet care community</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-brand-100/80">
            Whether you have one pampered pup or run a busy clinic, PetBook is built to make every
            visit feel a little easier.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="accent">
              <Link href="/register">Create an account</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/5 text-white hover:bg-white/15"
            >
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
