import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Cake,
  CalendarDays,
  ClipboardList,
  Palette,
  PawPrint,
  Scale,
  Syringe,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DeletePetButton, PetFormDialog } from "@/components/pets/pet-form-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getItem } from "@/lib/directus";
import { petAppointments, petVaccinations } from "@/lib/queries";
import { requireCustomer } from "@/lib/session";
import type { Pet } from "@/lib/types";
import { formatDate, initials, titleCase } from "@/lib/utils";

export const metadata = { title: "Pet profile" };

export default async function PetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCustomer();
  const { id } = await params;
  const petId = Number(id);
  if (!Number.isFinite(petId)) notFound();

  const pet = await getItem<{ data: Pet }>("pets", petId, "?fields=*")
    .then((result) => result.data)
    .catch(() => null);

  if (!pet || Number(pet.customer) !== session.customer?.id) notFound();

  const [vaccinations, appointments] = await Promise.all([
    petVaccinations(pet.id).catch(() => []),
    petAppointments(pet.id).catch(() => []),
  ]);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/dashboard/pets">
          <ArrowLeft className="h-4 w-4" /> All pets
        </Link>
      </Button>

      <PageHeader
        eyebrow="Pet profile"
        title={pet.name}
        description={`${pet.breed || titleCase(pet.species)} · ${titleCase(pet.sex)}`}
        action={
          <div className="flex gap-2">
            <PetFormDialog pet={pet} label="Edit profile" variant="outline" />
            <DeletePetButton petId={pet.id} redirectTo="/dashboard/pets" />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <span className="mx-auto grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br from-brand-600 to-brand-400 text-3xl font-black text-white">
                {initials(pet.name)}
              </span>
              <h2 className="mt-4 text-xl font-black">{pet.name}</h2>
              <p className="text-sm text-muted-foreground">
                {pet.breed || titleCase(pet.species)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Cake className="h-4 w-4 text-brand-600" /> Birthday
                </span>
                <span className="font-semibold">
                  {pet.birth_date ? formatDate(pet.birth_date, false) : "—"}
                </span>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Scale className="h-4 w-4 text-brand-600" /> Weight
                </span>
                <span className="font-semibold">
                  {pet.weight_kg ? `${pet.weight_kg} kg` : "—"}
                </span>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Palette className="h-4 w-4 text-brand-600" /> Colour
                </span>
                <span className="font-semibold">{pet.color || "—"}</span>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <PawPrint className="h-4 w-4 text-brand-600" /> Species
                </span>
                <span className="font-semibold">{titleCase(pet.species)}</span>
              </p>
              {pet.notes ? (
                <div className="rounded-xl bg-secondary/70 p-3">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <ClipboardList className="h-3.5 w-3.5" /> Care notes
                  </p>
                  <p className="mt-1 text-sm">{pet.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Syringe className="h-4 w-4 text-coral-500" /> Vaccinations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {vaccinations.length ? (
                vaccinations.map((vaccination) => (
                  <div
                    key={vaccination.id}
                    className="flex flex-col gap-1 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold">{vaccination.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Given {formatDate(vaccination.administered_at, false)}
                        {vaccination.lot_number ? ` · Lot ${vaccination.lot_number}` : ""}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {vaccination.next_due_at
                        ? `Next due ${formatDate(vaccination.next_due_at, false)}`
                        : "No due date"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  No vaccination records yet. Your shop can add them after a visit.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-brand-600" /> Visit history
              </CardTitle>
              <Button asChild size="sm" variant="soft">
                <Link href={`/dashboard/book?shop=&service=`}>Book visit</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {appointments.length ? (
                appointments.map((appointment) => (
                  <Link
                    key={appointment.id}
                    href={`/dashboard/appointments/${appointment.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition hover:border-brand-300 hover:bg-brand-50/40"
                  >
                    <div>
                      <p className="text-sm font-semibold">Appointment #{appointment.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(appointment.start_at)}
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </Link>
                ))
              ) : (
                <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  No visits yet. Book the first appointment for {pet.name}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
