import Link from "next/link";
import { ArrowRight, CalendarCheck, Heart, PawPrint, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function LeaningCat({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 260"
      className={cn("h-full w-full", className)}
      aria-hidden="true"
    >
      <ellipse cx="118" cy="250" rx="58" ry="9" fill="#0b3b38" opacity="0.08" />
      <g
        className="motion-safe:animate-pet-tail"
        style={{
          transformBox: "fill-box",
          transformOrigin: "78% 94%",
        }}
      >
        <path
          d="M144 235 C184 236 188 198 168 185 C152 174 156 152 174 145"
          fill="none"
          stroke="#d97706"
          strokeWidth="16"
          strokeLinecap="round"
        />
      </g>
      <g
        className="motion-safe:animate-pet-breathe"
        style={{
          transformBox: "fill-box",
          transformOrigin: "center bottom",
        }}
      >
        <ellipse cx="118" cy="210" rx="56" ry="44" fill="#f59e0b" />
        <path d="M82 226 Q78 168 112 147 Q150 166 154 226 Z" fill="#fbbf24" />
        <ellipse cx="112" cy="212" rx="34" ry="37" fill="#fef3c7" />
        <ellipse cx="92" cy="245" rx="26" ry="12" fill="#fbbf24" />
        <ellipse cx="138" cy="245" rx="24" ry="12" fill="#fbbf24" />
        <g transform="rotate(-13 54 176)">
          <ellipse cx="54" cy="176" rx="34" ry="15" fill="#fbbf24" />
          <path
            d="M36 172 L36 180 M48 169 L48 181 M60 169 L60 181 M72 172 L72 180"
            stroke="#d97706"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <g transform="rotate(-7 114 92)">
          <path d="M72 68 L68 18 L106 46 Z" fill="#f59e0b" />
          <path d="M154 68 L160 18 L122 46 Z" fill="#f59e0b" />
          <path d="M78 60 L76 32 L96 48 Z" fill="#fbcfe8" />
          <path d="M148 60 L152 32 L132 48 Z" fill="#fbcfe8" />
          <circle cx="114" cy="94" r="52" fill="#fbbf24" />
          <path
            d="M108 48 Q114 62 120 48"
            fill="none"
            stroke="#d97706"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M96 52 Q102 64 110 54"
            fill="none"
            stroke="#d97706"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M88 88 Q96 96 104 88"
            fill="none"
            stroke="#7c2d12"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M124 88 Q132 96 140 88"
            fill="none"
            stroke="#7c2d12"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <ellipse cx="83" cy="104" rx="8" ry="4" fill="#fb7185" opacity="0.35" />
          <ellipse cx="145" cy="104" rx="8" ry="4" fill="#fb7185" opacity="0.35" />
          <path d="M109 104 Q114 100 119 104 Q114 111 109 104 Z" fill="#fb7185" />
          <path
            d="M114 111 Q114 120 106 118 M114 111 Q114 120 122 118"
            fill="none"
            stroke="#7c2d12"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M86 108 L58 102 M86 114 L58 114 M142 108 L170 102 M142 114 L170 114"
            stroke="#d97706"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M98 70 Q102 66 106 70"
            fill="none"
            stroke="#d97706"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.5"
          />
        </g>
      </g>
    </svg>
  );
}

export function PetLeanPanel() {
  return (
    <section className="page-shell pb-16">
      <div className="relative overflow-hidden rounded-[2.4rem] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-coral-100/70 px-6 py-10 shadow-soft sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_center,rgba(15,118,110,0.1)_1px,transparent_1px)] [background-size:22px_22px] motion-safe:animate-paw-drift"
        />
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-brand-300/30 blur-3xl motion-safe:animate-float-slow" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-coral-400/20 blur-3xl motion-safe:animate-float" />
        <PawPrint className="pointer-events-none absolute left-8 top-8 h-5 w-5 -rotate-12 text-brand-400/50 motion-safe:animate-float" />
        <PawPrint className="pointer-events-none absolute bottom-10 left-1/3 h-4 w-4 rotate-12 text-coral-500/30 motion-safe:animate-float-delayed" />

        <div className="relative z-10 grid gap-10 sm:grid-cols-[1fr_11rem] sm:items-end lg:grid-cols-[1fr_15rem]">
          <div className="max-w-2xl pb-44 sm:pb-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-brand-700 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Made for pet parents
            </span>
            <h2 className="mt-4 text-balance text-3xl font-black tracking-tight text-brand-950 sm:text-4xl">
              A little less hassle. A lot more purring.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-900/70 sm:text-base">
              Thoughtful care is closer than you think. Browse trusted groomers and vet
              clinics, pick a time that suits you, and let PetBook keep the rest on track.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/shops">
                  Find care nearby <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/70">
                <Link href="/services">Browse services</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-brand-800/70">
              <span className="inline-flex items-center gap-1.5">
                <CalendarCheck className="h-3.5 w-3.5 text-brand-600" /> Instant booking
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-coral-500" /> Verified local care
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PawPrint className="h-3.5 w-3.5 text-brand-600" /> Reminders included
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-2 right-0 h-44 w-36 sm:static sm:h-56 sm:w-full lg:h-64">
            <div className="absolute inset-x-4 bottom-3 h-24 rounded-full bg-brand-300/40 blur-2xl" />
            <div className="relative h-full motion-safe:animate-fade-up">
              <LeaningCat className="-ml-4 h-full w-full sm:-ml-8" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
