"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Pet } from "@/lib/types";

export function PetFormDialog({
  pet,
  label,
  variant = "default",
}: {
  pet?: Pet;
  label?: string;
  variant?: "default" | "outline" | "soft" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: pet?.name ?? "",
    species: pet?.species ?? "dog",
    breed: pet?.breed ?? "",
    sex: pet?.sex ?? "unknown",
    birth_date: pet?.birth_date ?? "",
    weight_kg: pet?.weight_kg ? String(pet.weight_kg) : "",
    color: pet?.color ?? "",
    notes: pet?.notes ?? "",
  });
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setForm({
        name: pet?.name ?? "",
        species: pet?.species ?? "dog",
        breed: pet?.breed ?? "",
        sex: pet?.sex ?? "unknown",
        birth_date: pet?.birth_date ?? "",
        weight_kg: pet?.weight_kg ? String(pet.weight_kg) : "",
        color: pet?.color ?? "",
        notes: pet?.notes ?? "",
      });
    }
  }, [open, pet]);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const response = await fetch(pet ? `/api/pets/${pet.id}` : "/api/pets", {
      method: pet ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to save the pet.");
      return;
    }

    toast.success(pet ? "Pet updated." : "Pet added.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={pet ? "sm" : "default"}>
          {!pet ? <Plus className="h-4 w-4" /> : null}
          {label ?? (pet ? "Edit" : "Add pet")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pet ? "Edit pet" : "Add a pet"}</DialogTitle>
          <DialogDescription>
            These details help your shop provide safer, more personal care.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pet-name">Name</Label>
              <Input
                id="pet-name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pet-species">Species</Label>
              <Select
                id="pet-species"
                value={form.species}
                onChange={(event) => update("species", event.target.value)}
              >
                {["dog", "cat", "bird", "rabbit", "other"].map((species) => (
                  <option key={species} value={species}>
                    {species[0].toUpperCase() + species.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pet-breed">Breed</Label>
              <Input
                id="pet-breed"
                value={form.breed}
                onChange={(event) => update("breed", event.target.value)}
                placeholder="Shih Tzu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pet-sex">Sex</Label>
              <Select
                id="pet-sex"
                value={form.sex}
                onChange={(event) => update("sex", event.target.value)}
              >
                <option value="unknown">Unknown</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pet-birth">Birth date</Label>
              <Input
                id="pet-birth"
                type="date"
                value={form.birth_date ?? ""}
                onChange={(event) => update("birth_date", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pet-weight">Weight (kg)</Label>
              <Input
                id="pet-weight"
                type="number"
                step="0.1"
                min="0"
                value={form.weight_kg}
                onChange={(event) => update("weight_kg", event.target.value)}
                placeholder="5.2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pet-color">Colour / markings</Label>
            <Input
              id="pet-color"
              value={form.color}
              onChange={(event) => update("color", event.target.value)}
              placeholder="Cream with tan ears"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pet-notes">Care notes</Label>
            <Textarea
              id="pet-notes"
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              rows={3}
              placeholder="Allergies, temperament, favourite treats…"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Saving…" : pet ? "Save changes" : "Add pet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeletePetButton({
  petId,
  redirectTo,
}: {
  petId: number;
  redirectTo?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function remove() {
    if (!window.confirm("Remove this pet? This cannot be undone.")) return;
    setLoading(true);
    const response = await fetch(`/api/pets/${petId}`, { method: "DELETE" });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to remove the pet.");
      return;
    }

    toast.success("Pet removed.");
    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-destructive hover:bg-red-50"
      onClick={remove}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Remove
    </Button>
  );
}
