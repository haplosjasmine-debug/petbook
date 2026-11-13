"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { ImageUploadButton } from "@/components/shop/image-upload-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  firstName,
  lastName,
  phone,
  email,
  photoId,
  photoUrl,
}: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  photoId: string | null;
  photoUrl: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [currentPhotoId, setCurrentPhotoId] = useState(photoId ?? "");
  const [photoPreview, setPhotoPreview] = useState(photoUrl);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: form.get("first_name"),
        last_name: form.get("last_name"),
        email: form.get("email"),
        phone: form.get("phone"),
        photo: currentPhotoId || null,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to update your profile.");
      return;
    }

    toast.success("Profile updated.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-dashed bg-secondary/40 p-4 sm:flex-row sm:items-center">
        <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-white text-lg font-black text-brand-700">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt={`${firstName} ${lastName}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Camera className="h-7 w-7 text-brand-600" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Your photo</p>
          <p className="text-xs text-muted-foreground">
            Add a friendly face so your care team can recognise you when you arrive.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImageUploadButton
            endpoint="/api/customer/uploads"
            label={photoPreview ? "Replace photo" : "Upload photo"}
            onUploaded={(image) => {
              setCurrentPhotoId(image.id);
              setPhotoPreview(image.url);
            }}
          />
          {photoPreview ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentPhotoId("");
                setPhotoPreview(null);
              }}
            >
              <X className="h-4 w-4" /> Remove
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-first">First name</Label>
          <Input id="profile-first" name="first_name" defaultValue={firstName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-last">Last name</Label>
          <Input id="profile-last" name="last_name" defaultValue={lastName} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-email">Email address</Label>
        <Input
          id="profile-email"
          name="email"
          type="email"
          defaultValue={email}
          required
        />
        <p className="text-xs text-muted-foreground">
          Booking confirmations and account notices are sent here.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-phone">Mobile number</Label>
        <Input
          id="profile-phone"
          name="phone"
          defaultValue={phone}
          placeholder="+63 917 000 0000"
        />
        <p className="text-xs text-muted-foreground">
          Used for SMS appointment reminders.
        </p>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
