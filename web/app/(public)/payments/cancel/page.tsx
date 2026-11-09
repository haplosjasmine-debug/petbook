import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Payment cancelled" };

export default function PaymentCancelPage() {
  return (
    <section className="page-shell max-w-xl py-16">
      <Card>
        <CardContent className="p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-100 text-red-700">
            <XCircle className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-2xl font-black">Payment cancelled</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No payment was taken. Your appointment is still saved and can be paid from your
            appointments page.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/dashboard/appointments">View appointments</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/shops">Browse shops</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
