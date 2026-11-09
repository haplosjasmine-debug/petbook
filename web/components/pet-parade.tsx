import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function Leg({
  x,
  color,
  delay,
}: {
  x: number;
  color: string;
  delay: string;
}) {
  return (
    <g
      className="motion-safe:animate-pet-leg"
      style={{
        transformBox: "fill-box",
        transformOrigin: "top center",
        animationDelay: delay,
      }}
    >
      <rect x={x - 3} y={64} width={6} height={22} rx={3} fill={color} />
      <ellipse cx={x} cy={86} rx={6} ry={3} fill={color} />
    </g>
  );
}

function Dog({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 92" className={cn("h-16 w-24", className)} aria-hidden="true">
      <path d="M35 50 C18 43 22 26 13 24" fill="none" stroke="#d97706" strokeWidth="8" strokeLinecap="round" />
      <Leg x={48} color="#d97706" delay="0s" />
      <Leg x={66} color="#f59e0b" delay="0.18s" />
      <Leg x={88} color="#d97706" delay="0.32s" />
      <Leg x={104} color="#f59e0b" delay="0.1s" />
      <ellipse cx="70" cy="52" rx="35" ry="21" fill="#f59e0b" />
      <circle cx="105" cy="38" r="19" fill="#fbbf24" />
      <path d="M110 24 L123 9 L120 34 Z" fill="#b45309" />
      <ellipse cx="115" cy="43" rx="12" ry="9" fill="#fef3c7" />
      <circle cx="123" cy="41" r="2.8" fill="#44403c" />
      <circle cx="102" cy="33" r="2.4" fill="#3f2a1d" />
      <path d="M106 47 Q112 53 118 46" fill="none" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M90 61 Q97 67 104 61" fill="none" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function Cat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 92" className={cn("h-16 w-24", className)} aria-hidden="true">
      <path d="M35 55 C13 58 18 34 8 30" fill="none" stroke="#64748b" strokeWidth="7" strokeLinecap="round" />
      <Leg x={48} color="#475569" delay="0.12s" />
      <Leg x={66} color="#64748b" delay="0.3s" />
      <Leg x={88} color="#475569" delay="0.04s" />
      <Leg x={104} color="#64748b" delay="0.22s" />
      <ellipse cx="70" cy="53" rx="34" ry="20" fill="#64748b" />
      <circle cx="104" cy="38" r="18" fill="#94a3b8" />
      <path d="M92 27 L89 8 L104 19 Z" fill="#64748b" />
      <path d="M115 26 L120 7 L126 27 Z" fill="#64748b" />
      <path d="M94 26 L92 14 L101 21 Z" fill="#fbcfe8" />
      <path d="M117 25 L120 13 L123 26 Z" fill="#fbcfe8" />
      <circle cx="98" cy="34" r="2.2" fill="#334155" />
      <circle cx="110" cy="34" r="2.2" fill="#334155" />
      <path d="M104 40 L101 37 M104 40 L107 37 M104 40 L104 43" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M99 47 Q104 51 109 47" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      <path d="M112 42 L124 38 M112 45 L124 47" stroke="#cbd5e1" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function Rabbit({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 92" className={cn("h-16 w-24", className)} aria-hidden="true">
      <circle cx="31" cy="51" r="10" fill="#f8fafc" />
      <Leg x={52} color="#e2e8f0" delay="0.08s" />
      <Leg x={70} color="#ffffff" delay="0.27s" />
      <Leg x={92} color="#e2e8f0" delay="0.16s" />
      <Leg x={108} color="#ffffff" delay="0.34s" />
      <ellipse cx="73" cy="53" rx="34" ry="20" fill="#f8fafc" />
      <circle cx="105" cy="37" r="18" fill="#ffffff" />
      <ellipse cx="94" cy="10" rx="7" ry="21" fill="#ffffff" transform="rotate(-12 94 10)" />
      <ellipse cx="114" cy="11" rx="7" ry="21" fill="#ffffff" transform="rotate(10 114 11)" />
      <ellipse cx="94" cy="11" rx="3" ry="14" fill="#fbcfe8" transform="rotate(-12 94 11)" />
      <ellipse cx="114" cy="12" rx="3" ry="14" fill="#fbcfe8" transform="rotate(10 114 12)" />
      <circle cx="99" cy="33" r="2.2" fill="#475569" />
      <circle cx="111" cy="33" r="2.2" fill="#475569" />
      <circle cx="106" cy="40" r="2.6" fill="#fb7185" />
      <path d="M100 46 Q106 51 112 46" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Walker({
  children,
  delay,
}: {
  children: ReactNode;
  delay: string;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-end motion-safe:animate-pet-walk"
      style={{ animationDelay: delay }}
    >
      {children}
      <span className="absolute -bottom-1 left-1/2 h-2 w-16 -translate-x-1/2 rounded-full bg-brand-900/10 blur-[2px]" />
    </span>
  );
}

export function PetParade() {
  const pets = [
    { key: "dog", node: <Dog />, delay: "0s" },
    { key: "cat", node: <Cat />, delay: "0.45s" },
    { key: "rabbit", node: <Rabbit />, delay: "0.9s" },
  ];

  return (
    <section
      aria-label="Happy dogs, cats and rabbits walking"
      className="relative overflow-hidden border-y border-brand-100 bg-gradient-to-r from-coral-100/60 via-white to-brand-50 py-5"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
      <div className="flex w-max motion-safe:animate-pet-parade">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 items-end gap-14 pr-14 sm:gap-20 sm:pr-20"
          >
            {pets.map((pet) => (
              <Walker key={`${copy}-${pet.key}`} delay={pet.delay}>
                {pet.node}
              </Walker>
            ))}
            <span className="pb-4 text-2xl text-brand-400/60" aria-hidden="true">
              🐾
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
