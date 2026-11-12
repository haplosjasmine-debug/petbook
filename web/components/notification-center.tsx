"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BellRing, CalendarDays, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import type { AppNotification, Reminder } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Feed = {
  notifications: AppNotification[];
  reminders: Reminder[];
};

function relatedId(value: number | { id: number } | null | undefined) {
  if (value === null || value === undefined) return null;
  return typeof value === "object" ? value.id : value;
}

function notificationHref(
  portal: "customer" | "shop" | "staff" | "admin",
  notification: AppNotification
) {
  const appointmentId = relatedId(notification.appointment);
  if (!appointmentId) return null;
  return portal === "customer"
    ? `/dashboard/appointments/${appointmentId}`
    : portal === "shop"
      ? "/shop/appointments?status=all"
      : portal === "staff"
        ? "/staff/appointments"
        : null;
}

export function NotificationCenter({
  portal,
}: {
  portal: "customer" | "shop" | "staff" | "admin";
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feed, setFeed] = useState<Feed>({ notifications: [], reminders: [] });
  const [seenAt, setSeenAt] = useState(0);
  const storageKey = `petbook-notifications-seen-${portal}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      setFeed((await response.json()) as Feed);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(storageKey) ?? 0);
    setSeenAt(Number.isFinite(stored) ? stored : 0);
    void load();
    const timer = window.setInterval(load, 60_000);
    return () => window.clearInterval(timer);
  }, [load, storageKey]);

  const unread = feed.notifications.filter(
    (notification) => new Date(notification.date_created ?? 0).getTime() > seenAt
  ).length;

  function changeOpen(next: boolean) {
    setOpen(next);
    if (next) {
      const now = Date.now();
      setSeenAt(now);
      window.localStorage.setItem(storageKey, String(now));
      void load();
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative h-9 w-9 rounded-full"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unread ? (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-coral-500 px-1 text-[10px] font-black text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-brand-600" /> Notifications
          </DialogTitle>
          <DialogDescription>
            Booking updates from shops{portal === "customer" ? " and your upcoming reminders" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(85vh-88px)] overflow-y-auto">
          {loading && !feed.notifications.length && !feed.reminders.length ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading updates
            </div>
          ) : null}

          {feed.notifications.length ? (
            <section className="border-b px-4 py-3">
              <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Booking updates
              </p>
              <div className="space-y-2">
                {feed.notifications.map((notification) => {
                  const href = notificationHref(portal, notification);
                  const content = (
                    <div className="flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-secondary/70">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-bold">
                            {notification.subject || "Booking update"}
                          </p>
                          <StatusBadge status={notification.status} />
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {notification.body}
                        </p>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          {formatDate(notification.sent_at ?? notification.date_created)}
                        </p>
                      </div>
                    </div>
                  );

                  return href ? (
                    <Link key={notification.id} href={href} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id}>{content}</div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {feed.reminders.length ? (
            <section className="px-4 py-3">
              <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Upcoming reminders
              </p>
              <div className="space-y-2">
                {feed.reminders.map((reminder) => {
                  const appointmentId = relatedId(reminder.appointment);
                  const content = (
                    <div className="flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-secondary/70">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                        <Clock className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {reminder.message ?? "Appointment reminder"}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(reminder.send_at)} · {reminder.channel}
                        </p>
                      </div>
                    </div>
                  );

                  return appointmentId && portal === "customer" ? (
                    <Link
                      key={reminder.id}
                      href={`/dashboard/appointments/${appointmentId}`}
                      onClick={() => setOpen(false)}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={reminder.id}>{content}</div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {!loading && !feed.notifications.length && !feed.reminders.length ? (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                <Bell className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-bold">You are all caught up</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Booking updates and reminders will appear here.
              </p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
