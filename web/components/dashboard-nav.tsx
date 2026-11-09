"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Coins,
  CreditCard,
  Home,
  LayoutDashboard,
  LineChart,
  PawPrint,
  Scissors,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = {
  customer: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/dashboard/pets", label: "My pets", icon: PawPrint },
    { href: "/dashboard/loyalty", label: "Loyalty", icon: CreditCard },
    { href: "/dashboard/notifications", label: "Reminders", icon: Bell },
    { href: "/dashboard/profile", label: "Profile", icon: Settings },
  ],
  shop: [
    { href: "/shop", label: "Overview", icon: LayoutDashboard },
    { href: "/shop/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/shop/services", label: "Services", icon: Scissors },
    { href: "/shop/staff", label: "Staff", icon: Users },
    { href: "/shop/commissions", label: "Commissions", icon: Coins },
    { href: "/shop/reports", label: "Reports", icon: LineChart },
    { href: "/shop/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/", label: "Public site", icon: Home },
  ],
} as const;

export function DashboardNav({ portal }: { portal: "customer" | "shop" | "admin" }) {
  const pathname = usePathname();
  const nav = items[portal];

  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
      {nav.map((item) => {
        const active =
          item.href === `/${portal === "customer" ? "dashboard" : portal}`
            ? pathname === item.href
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-brand-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
