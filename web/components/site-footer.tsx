import Link from "next/link";
import { Logo } from "@/components/logo";

const columns = [
  {
    title: "PetBook",
    links: [
      { href: "/about", label: "About us" },
      { href: "/shops", label: "Find a shop" },
      { href: "/services", label: "Services" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "For pet owners",
    links: [
      { href: "/register?role=customer", label: "Create an account" },
      { href: "/dashboard", label: "My bookings" },
      { href: "/dashboard/pets", label: "Pet records" },
      { href: "/dashboard/loyalty", label: "Loyalty points" },
    ],
  },
  {
    title: "For businesses",
    links: [
      { href: "/register?role=shop_owner", label: "List your shop" },
      { href: "/shop", label: "Business dashboard" },
      { href: "/about#commission", label: "Pricing" },
      { href: "/contact", label: "Partner with us" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t bg-brand-900 text-white">
      <div className="page-shell grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="space-y-4">
          <Logo inverted />
          <p className="max-w-xs text-sm leading-relaxed text-brand-100/80">
            Calm, caring appointments for every pet — and simple tools for the people who care for
            them.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-brand-200">
              {column.title}
            </h4>
            <ul className="space-y-2.5 text-sm text-brand-100/80">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="page-shell flex flex-col gap-2 py-5 text-xs text-brand-100/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PetBook. All rights reserved.</p>
          <p>Made for pets and the people who love them.</p>
        </div>
      </div>
    </footer>
  );
}
