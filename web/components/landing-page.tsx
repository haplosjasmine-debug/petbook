import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CalendarCheck,
  Check,
  ChevronDown,
  HeartPulse,
  LineChart,
  LockKeyhole,
  PawPrint,
  Quote,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const trustBadges = [
  { icon: BadgeCheck, title: "Trusted by pet care businesses", text: "Verified local partners" },
  { icon: BellRing, title: "Automated SMS reminders", text: "Fewer no-shows" },
  { icon: ShieldCheck, title: "Secure pet health records", text: "Private and access-controlled" },
  { icon: CalendarCheck, title: "24/7 online booking", text: "Book from any device" },
];

const features = [
  {
    icon: CalendarCheck,
    title: "Online booking",
    text: "Pet owners book grooming or vet appointments anytime, from any device.",
  },
  {
    icon: BellRing,
    title: "Smart reminders",
    text: "Automatic SMS notifications reduce no-shows and keep schedules full.",
  },
  {
    icon: HeartPulse,
    title: "Pet profiles & history",
    text: "Complete grooming, medical, and vaccination records in one place.",
  },
  {
    icon: LineChart,
    title: "Business dashboard",
    text: "Manage staff, track revenue, and generate reports from a single panel.",
  },
];

const ownerFeatures = [
  "Add pet photos and profiles",
  "View service history",
  "Earn loyalty points",
  "Book in seconds",
];

const businessFeatures = [
  "Manage appointments and staff assignments",
  "Track each pet's treatment history",
  "Monitor daily revenue and sales reports",
  "Assign services to specific staff",
];

const steps = [
  {
    step: "01",
    title: "Create an account",
    text: "Sign up as a pet owner or a business.",
  },
  {
    step: "02",
    title: "Set up your profile",
    text: "Add your pets or configure your services.",
  },
  {
    step: "03",
    title: "Book or manage",
    text: "Start booking appointments or manage your shop's schedule.",
  },
];

const testimonials = [
  {
    quote:
      "The automatic reminders cut our no-shows dramatically. Our calendar stays full without constant follow-ups.",
    name: "Maria",
    detail: "Owner, Paws & Polish",
  },
  {
    quote:
      "I can add Mochi and Latte, keep their vaccine records together, and rebook in seconds. It just makes sense.",
    name: "Jasmine",
    detail: "Pet parent to Mochi & Latte",
  },
  {
    quote:
      "Everything our clinic needs is in one dashboard — appointments, pet history, staff, and daily revenue.",
    name: "Paolo",
    detail: "VetCare Manila",
  },
];

const faqs = [
  {
    question: "Do I need to install anything?",
    answer:
      "No. PetBook is completely web-based, so you can manage bookings, pets, and your business from any modern browser.",
  },
  {
    question: "Is my pet's data secure?",
    answer:
      "Yes. Every record is private and access-controlled, so only you and the care team you book with can see your pet's details.",
  },
  {
    question: "How does the 10% commission work?",
    answer:
      "It is calculated only when a booking is marked completed. There is no monthly fee and no setup cost — you only pay when you earn.",
  },
  {
    question: "Can I use PetBook for both grooming and veterinary services?",
    answer:
      "Yes. PetBook supports grooming shops, veterinary clinics, and businesses that offer both types of care.",
  },
];

export function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="absolute inset-0">
          <Image
            src="/images/home/vet-collage-mosaic.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-brand-950/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/90 to-brand-950/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-transparent to-brand-950/35" />
        </div>
        <div className="hero-grid absolute inset-0 opacity-15" />
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-[28rem] w-[28rem] rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="page-shell relative grid gap-14 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-100 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-coral-300" />
              The pet care operating system
            </div>

            <h1 className="mt-6 text-balance text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
              Modern Pet Care Management, All in One Place
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-100/85 sm:text-lg">
              PetBook helps pet grooming shops and veterinary clinics manage appointments,
              pet records, and customer relationships — while giving pet owners a seamless
              booking experience.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/register">
                  Create Your Account <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/25 bg-white/5 text-white hover:bg-white/15"
              >
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-brand-100/75">
              {["Free for pet owners", "10% only when you earn", "No setup fees"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-brand-300" /> {item}
                </span>
              ))}
            </div>

            <div className="mt-10 flex items-center gap-4 border-t border-white/10 pt-6">
              <div className="flex -space-x-2">
                {["/images/home/hero-puppy.jpg", "/images/home/hero-cat.jpg", "/images/home/hero-dog.jpg"].map(
                  (src, index) => (
                    <span
                      key={src}
                      className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-brand-950"
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="2.25rem"
                        className="object-cover"
                        priority={index === 0}
                      />
                    </span>
                  )
                )}
              </div>
              <div>
                <div className="flex items-center gap-1 text-coral-300" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-1 text-xs text-brand-100/70">
                  Built for pet parents and the businesses that care for them
                </p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[34rem] lg:max-w-none">
            <div className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-emerald-400/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2.6rem] border border-emerald-300/25 bg-gradient-to-br from-emerald-400/25 via-brand-900/85 to-brand-950 p-2.5 shadow-[0_35px_100px_-30px_rgba(0,0,0,0.85)] backdrop-blur">
              <div className="relative overflow-hidden rounded-[2.1rem] border border-white/10 bg-brand-950/75 p-5 sm:p-7">
                <div className="hero-grid absolute inset-0 opacity-20" />

                <div className="relative flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                    </span>
                    Live pet pulse
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-100/55">
                    Vet-connected care
                  </span>
                </div>

                <div className="relative mt-8 grid place-items-center">
                  <div className="absolute h-52 w-52 rounded-full border border-emerald-300/30 motion-safe:animate-pulse-ring" />
                  <div className="absolute h-40 w-40 rounded-full border border-emerald-300/20 motion-safe:animate-pulse-ring [animation-delay:700ms]" />
                  <div className="relative grid h-32 w-32 place-items-center rounded-full border border-emerald-300/30 bg-emerald-400/10 shadow-[0_0_60px_-10px_rgba(52,211,153,0.75)]">
                    <HeartPulse
                      className="h-16 w-16 text-emerald-300 motion-safe:animate-heartbeat"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>

                <div className="relative mt-6 text-center">
                  <p className="text-5xl font-black tracking-tight">
                    <span className="text-emerald-300">128</span>
                    <span className="ml-2 text-sm font-bold text-brand-100/60">BPM</span>
                  </p>
                  <p className="mt-1 text-xs font-semibold text-brand-100/70">
                    Steady rhythm · Every pet monitored with care
                  </p>
                </div>

                <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-3">
                  <svg viewBox="0 0 360 72" className="h-16 w-full" fill="none" aria-hidden="true">
                    <path
                      d="M0 40 H52 L62 40 L70 26 L78 54 L88 14 L100 48 L110 40 H156 L164 40 L172 30 L180 50 L188 18 L200 40 H240 L248 40 L256 32 L264 48 L272 22 L282 40 H360"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-emerald-300/15"
                    />
                    <path
                      d="M0 40 H52 L62 40 L70 26 L78 54 L88 14 L100 48 L110 40 H156 L164 40 L172 30 L180 50 L188 18 L200 40 H240 L248 40 L256 32 L264 48 L272 22 L282 40 H360"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength="360"
                      strokeDasharray="64 296"
                      className="text-emerald-300 motion-safe:animate-ecg-dash"
                    />
                  </svg>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-brand-100/45">
                    <span>Real-time vitals</span>
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <ShieldCheck className="h-3 w-3" /> Secure
                    </span>
                  </div>
                </div>

                <div className="relative mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "Heart", value: "Healthy", icon: HeartPulse },
                    { label: "Rhythm", value: "Steady", icon: BellRing },
                    { label: "Care", value: "24/7", icon: ShieldCheck },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                    >
                      <item.icon className="h-4 w-4 text-emerald-300" />
                      <p className="mt-2 text-xs font-black">{item.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-100/45">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-white/75">
        <div className="page-shell grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustBadges.map((badge) => (
            <div key={badge.title} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <badge.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black">{badge.title}</p>
                <p className="text-xs text-muted-foreground">{badge.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="page-shell scroll-mt-20 py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Core features</p>
          <h2 className="mt-2 text-balance text-3xl font-black tracking-tight sm:text-4xl">
            Everything your pet care business needs.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            One connected system for bookings, reminders, pet history, and the daily
            operations behind every happy visit.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="group transition hover:-translate-y-0.5 hover:shadow-soft">
              <CardContent className="p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-black">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="for-owners" className="bg-secondary/60 py-16 lg:py-20">
        <div className="page-shell grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-brand-700">
              <PawPrint className="h-3.5 w-3.5" /> For pet owners
            </span>
            <h2 className="mt-4 text-balance text-3xl font-black tracking-tight sm:text-4xl">
              Everything your pet needs, in one app.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Create a free account, add your pets, and keep every appointment, photo, and
              health record in one calm place.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {ownerFeatures.map((item) => (
                <li key={item} className="flex items-start gap-2.5 rounded-xl border bg-white/70 p-3 text-sm font-semibold">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-7">
              <Link href="/register">
                Create Your Free Account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-brand-100/70 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border bg-white p-3 shadow-soft">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
                <Image
                  src="/images/home/hero-cat.jpg"
                  alt="A relaxed cat after a grooming appointment"
                  fill
                  sizes="(min-width: 1024px) 32rem, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-transparent to-transparent" />
              </div>
              <div className="grid gap-3 p-3 pt-4 sm:grid-cols-2">
                <div className="rounded-2xl border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-xs font-black">
                    <ImagesIcon /> Pet profiles
                  </div>
                  <div className="mt-3 flex -space-x-2">
                    {["/images/home/hero-puppy.jpg", "/images/home/hero-cat.jpg", "/images/home/hero-dog.jpg"].map(
                      (src) => (
                        <span key={src} className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white">
                          <Image src={src} alt="" fill sizes="2rem" className="object-cover" />
                        </span>
                      )
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Photos, breed, notes, and history</p>
                </div>
                <div className="rounded-2xl border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-xs font-black">
                    <Star className="h-4 w-4 text-coral-500" /> Loyalty points
                  </div>
                  <p className="mt-3 text-2xl font-black">480 pts</p>
                  <p className="text-xs text-muted-foreground">Earned from completed visits</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="for-business" className="scroll-mt-20 bg-brand-900 py-16 text-white lg:py-20">
        <div className="page-shell grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-brand-100">
              <Store className="h-3.5 w-3.5" /> For pet care businesses
            </span>
            <h2 className="mt-4 text-balance text-3xl font-black tracking-tight sm:text-4xl">
              Run your shop smarter, not harder.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-100/80">
              Give your business a polished public page and one calm workspace for bookings,
              customers, staff, and revenue.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {businessFeatures.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500/20 text-brand-200">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" variant="accent" className="mt-7">
              <Link href="/business/apply">
                Start Managing Your Business <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-brand-500/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.06] p-4 shadow-soft backdrop-blur sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-coral-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-300" />
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-100">
                  Business dashboard
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Today", value: "08", icon: CalendarCheck },
                  { label: "Staff", value: "05", icon: Users },
                  { label: "Revenue", value: "₱12.4k", icon: LineChart },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <item.icon className="h-4 w-4 text-brand-300" />
                    <p className="mt-3 text-xl font-black">{item.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-100/55">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black">Next appointment</p>
                  <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-black text-emerald-300">
                    Confirmed
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src="/images/home/hero-cat.jpg"
                      alt="Latte"
                      fill
                      sizes="3rem"
                      className="object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">Cat grooming · Latte</p>
                    <p className="text-xs text-brand-100/60">Liza · Sat, 2:00 PM</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-brand-300" />
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 p-4">
                  <div className="flex items-center gap-2 text-xs font-black">
                    <ShieldCheck className="h-4 w-4 text-brand-300" /> Care records
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-2 w-full rounded-full bg-white/15" />
                    <div className="h-2 w-4/5 rounded-full bg-white/15" />
                    <div className="h-2 w-3/5 rounded-full bg-white/15" />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 p-4">
                  <div className="flex items-center gap-2 text-xs font-black">
                    <Zap className="h-4 w-4 text-coral-300" /> Staff assigned
                  </div>
                  <p className="mt-3 text-xs text-brand-100/60">
                    Services matched to the right groomer or vet automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="page-shell scroll-mt-20 py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Up and running in three simple steps.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((item) => (
            <Card key={item.step} className="relative overflow-hidden">
              <CardContent className="p-6">
                <span className="absolute right-4 top-3 text-5xl font-black text-brand-50">
                  {item.step}
                </span>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                  <PawPrint className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 bg-secondary/60 py-16 lg:py-20">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Pricing</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Simple pricing. No surprises.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Free for pet owners. For businesses, you only pay when you earn.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-5 lg:grid-cols-2">
            <Card className="border-brand-200 bg-white">
              <CardContent className="p-7">
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-brand-700">
                  <PawPrint className="h-3.5 w-3.5" /> Pet owners
                </span>
                <p className="mt-5 text-4xl font-black">Free</p>
                <p className="mt-1 text-sm text-muted-foreground">Always free to use.</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    "Book appointments",
                    "Manage pet profiles",
                    "Receive reminders",
                    "Keep health and visit history",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-7 w-full">
                  <Link href="/register">Sign Up as Pet Owner</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-brand-700 bg-brand-900 text-white shadow-soft">
              <div className="absolute right-4 top-4">
                <Badge className="bg-coral-500 text-white hover:bg-coral-500">For businesses</Badge>
              </div>
              <CardContent className="p-7">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-brand-100">
                  <Store className="h-3.5 w-3.5" /> Pet care businesses
                </span>
                <p className="mt-5 text-4xl font-black">
                  10% <span className="text-base font-bold text-brand-100/70">per completed booking</span>
                </p>
                <p className="mt-1 text-sm text-brand-100/70">
                  No monthly fee. No setup cost. You only pay when you earn.
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    "Unlimited bookings and customers",
                    "Staff, services, and schedule management",
                    "Revenue reports and business dashboard",
                    "Public shop page and reviews",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="accent" className="mt-7 w-full">
                  <Link href="/business/apply">Register Your Business</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground">
            No hidden fees. Commission is automatically calculated per transaction and only
            applies when a booking is marked completed.
          </p>
        </div>
      </section>

      <section className="page-shell py-16 lg:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Testimonials</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              Designed for pet care professionals.
            </h2>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm">
            <Star className="h-4 w-4 fill-coral-500 text-coral-500" />
            Built for real pet care teams
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="relative overflow-hidden">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-brand-100" />
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-5 border-t pt-4">
                  <p className="text-sm font-black">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.detail}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="page-shell pb-16 lg:pb-20">
        <div className="grid gap-8 rounded-[2rem] border bg-white p-6 shadow-card sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">
              Frequently asked questions.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Everything you need to know before getting started with PetBook.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/contact">
                Talk to the team <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-2">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border bg-secondary/35 px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black">
                  {faq.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell pb-20">
        <div className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-8 text-white shadow-soft sm:p-12">
          <div className="hero-grid absolute inset-0 opacity-25" />
          <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-coral-500/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-200">
                Start with one happy visit
              </p>
              <h2 className="mt-2 text-balance text-3xl font-black tracking-tight sm:text-4xl">
                Ready to simplify pet care?
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-100/80">
                Join PetBook as a pet owner or bring your business on board. One platform,
                calmer days, and happier pets.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="accent">
                  <Link href="/register">
                    Sign Up as Pet Owner <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/5 text-white hover:bg-white/15"
                >
                  <Link href="/business/apply">Register Your Business</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: CalendarCheck, label: "24/7 booking" },
                { icon: BellRing, label: "Smart reminders" },
                { icon: LockKeyhole, label: "Secure records" },
                { icon: Smartphone, label: "Any device" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
                >
                  <item.icon className="h-5 w-5 text-brand-200" />
                  <p className="mt-3 text-sm font-black">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ImagesIcon() {
  return <PawPrint className="h-4 w-4 text-brand-600" />;
}
