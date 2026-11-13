import { CalendarDays, CreditCard, Mail, PawPrint, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { directusFileUrl } from "@/lib/directus";
import { customerAppointments, customerPets } from "@/lib/queries";
import { requireCustomer } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await requireCustomer();
  const customer = session.customer!;

  const [appointments, pets] = await Promise.all([
    customerAppointments(customer.id).catch(() => []),
    customerPets(customer.id).catch(() => []),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="Keep your contact details current so reminders reach you."
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal details</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              firstName={customer.first_name}
              lastName={customer.last_name}
              phone={customer.phone ?? ""}
              email={session.user.email}
              photoId={customer.photo}
              photoUrl={directusFileUrl(customer.photo)}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <PawPrint className="h-4 w-4 text-brand-600" /> Pets
                </span>
                <span className="font-semibold">{pets.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-brand-600" /> Appointments
                </span>
                <span className="font-semibold">{appointments.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="h-4 w-4 text-brand-600" /> Points
                </span>
                <span className="font-semibold">{customer.loyalty_points ?? 0}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 text-brand-600" /> Email
                </span>
                <span className="truncate font-semibold">{session.user.email}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-brand-600" /> Member since
                </span>
                <span className="font-semibold">
                  {formatDate(customer.date_created, false)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
