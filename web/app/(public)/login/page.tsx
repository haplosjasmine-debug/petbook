import Link from "next/link";
import { CalendarCheck, BellRing, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : undefined;

  return (
    <section className="page-shell grid gap-10 py-14 lg:grid-cols-2 lg:items-center">
      <div className="hidden lg:block">
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">
          Your pet's care, all in one calm place.
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Sign in to manage appointments, pet records, reminders, and loyalty points.
        </p>

        <div className="mt-8 space-y-3">
          {[
            { icon: CalendarCheck, title: "Upcoming appointments", text: "See every visit at a glance" },
            { icon: BellRing, title: "Smart reminders", text: "Never miss a vaccine or checkup" },
            { icon: ShieldCheck, title: "Secure records", text: "Only you and your shop can see them" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3 rounded-2xl border bg-white/70 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card className="mx-auto w-full max-w-md">
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-2xl font-black">Sign in to PetBook</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the email and password you registered with.
          </p>
          <div className="mt-6">
            <LoginForm next={next} />
          </div>
          <div className="mt-6 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
            Are you a shop owner?{" "}
            <Link href="/register?role=shop_owner" className="font-semibold text-brand-700 hover:underline">
              Create a business account
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
