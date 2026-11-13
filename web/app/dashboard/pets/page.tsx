import Link from "next/link";
import { ArrowRight, Cake, PawPrint, Scale, Syringe } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PetFormDialog } from "@/components/pets/pet-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { directusFileUrl } from "@/lib/directus";
import { customerPets, petVaccinations } from "@/lib/queries";
import { requireCustomer } from "@/lib/session";
import { formatDate, initials, titleCase } from "@/lib/utils";

export const metadata = { title: "My pets" };

export default async function PetsPage() {
  const session = await requireCustomer();
  const pets = await customerPets(session.customer!.id).catch(() => []);
  const vaccinations = (
    await Promise.all(pets.map((pet) => petVaccinations(pet.id).catch(() => [])))
  ).flat();

  return (
    <>
      <PageHeader
        eyebrow="Pet records"
        title="My pets"
        description="Keep profiles, care notes, and vaccination history in one place."
        action={<PetFormDialog label="Add pet" />}
      />

      {pets.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {pets.map((pet) => {
            const photoUrl = directusFileUrl(pet.photo);
            const records = vaccinations.filter((vaccination) => Number(vaccination.pet) === pet.id);
            const nextDue = records
              .filter((vaccination) => vaccination.next_due_at)
              .sort(
                (a, b) =>
                  new Date(a.next_due_at as string).getTime() -
                  new Date(b.next_due_at as string).getTime()
              )[0];

            return (
              <Card key={pet.id} className="overflow-hidden">
                <div className="flex items-center gap-3 bg-gradient-to-br from-brand-600 to-brand-500 p-5 text-white">
                  <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-white/95 text-lg font-black text-brand-700">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={pet.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials(pet.name)
                    )}
                  </span>
                  <div>
                    <h3 className="text-lg font-black">{pet.name}</h3>
                    <p className="text-xs text-brand-50/80">
                      {pet.breed || titleCase(pet.species)} · {titleCase(pet.sex)}
                    </p>
                  </div>
                </div>
                <CardContent className="space-y-3 p-5">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-secondary/70 p-3">
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Cake className="h-3.5 w-3.5" /> Birthday
                      </p>
                      <p className="mt-1 font-semibold">
                        {pet.birth_date ? formatDate(pet.birth_date, false) : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-secondary/70 p-3">
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Scale className="h-3.5 w-3.5" /> Weight
                      </p>
                      <p className="mt-1 font-semibold">
                        {pet.weight_kg ? `${pet.weight_kg} kg` : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl border p-3 text-xs">
                    <Syringe className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
                    <div>
                      <p className="font-semibold">
                        {nextDue ? nextDue.name : "No vaccination on file"}
                      </p>
                      <p className="text-muted-foreground">
                        {nextDue?.next_due_at
                          ? `Next due ${formatDate(nextDue.next_due_at, false)}`
                          : "Add records after your next visit"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t pt-3">
                    <Button asChild variant="soft" size="sm">
                      <Link href={`/dashboard/pets/${pet.id}`}>
                        View profile <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <PetFormDialog pet={pet} photoUrl={photoUrl} label="Edit" variant="ghost" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={PawPrint}
          title="No pets yet"
          description="Add your first pet to start booking appointments and tracking vaccinations."
          action={<PetFormDialog label="Add your first pet" />}
        />
      )}
    </>
  );
}
