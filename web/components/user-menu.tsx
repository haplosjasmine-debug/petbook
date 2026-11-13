"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";

export function UserMenu({
  name,
  role,
  dashboardHref,
  avatarUrl,
  profileHref,
}: {
  name: string;
  role: string;
  dashboardHref: string;
  avatarUrl?: string | null;
  profileHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signOut() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border bg-white/80 py-1.5 pl-1.5 pr-3 text-sm font-semibold shadow-sm transition hover:bg-secondary"
      >
        <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-brand-100 text-xs font-black text-brand-700">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            initials(name)
          )}
        </span>
        <span className="hidden max-w-[9rem] truncate sm:block">{name}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border bg-white p-2 shadow-soft">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-bold">{name}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link
            href={dashboardHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-secondary"
          >
            <UserRound className="h-4 w-4" /> Dashboard
          </Link>
          {profileHref ? (
            <Link
              href={profileHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              <Settings className="h-4 w-4" /> Profile settings
            </Link>
          ) : null}
          <button
            type="button"
            onClick={signOut}
            disabled={loading}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-red-50 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" /> {loading ? "Signing out." : "Sign out"}
          </button>
        </div>
      ) : null}

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <Button asChild variant="ghost" size="sm" className="sr-only">
        <Link href={dashboardHref}>Dashboard</Link>
      </Button>
    </div>
  );
}
