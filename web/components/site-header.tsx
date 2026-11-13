"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import type { AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

export type HeaderSession = {
  name: string;
  role: string;
  appRole: AppRole;
  dashboardHref: string;
  avatarUrl: string | null;
} | null;

const guestLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#for-business", label: "For Business" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const customerLinks = [
  { href: "/", label: "Home" },
  { href: "/shops", label: "Shops" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ session }: { session: HeaderSession }) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const links = session ? customerLinks : guestLinks;

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
    setSigningOut(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <UserMenu
              name={session.name}
              role={session.role}
              dashboardHref={session.dashboardHref}
              avatarUrl={session.avatarUrl}
              profileHref={session.appRole === "pet_owner" ? "/dashboard/profile" : undefined}
            />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign Up Free</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full border bg-white md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className={cn("border-t bg-background md:hidden", open ? "block" : "hidden")}>
        <div className="page-shell space-y-1 py-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 border-t pt-3">
            {session ? (
              <div className="space-y-2">
                <Link
                  href={session.dashboardHref}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl bg-secondary px-3 py-2.5 text-sm font-semibold"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  disabled={signingOut}
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-destructive disabled:opacity-50"
                >
                  {signingOut ? "Signing out." : "Sign out"}
                </button>
              </div>
            ) : (
              <div className="grid gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Log In
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/register" onClick={() => setOpen(false)}>
                    Sign Up Free
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
