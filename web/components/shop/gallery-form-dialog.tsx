"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import type { ShopGalleryItem } from "@/lib/types";

function galleryFormValues(item?: ShopGalleryItem) {
  return {
    image_url: item?.image_url ?? "",
    caption: item?.caption ?? "",
    pet_name: item?.pet_name ?? "",
    customer_name: item?.customer_name ?? "",
    featured: item?.featured ?? true,
    active: item?.active ?? true,
  };
}

export function GalleryFormDialog({
  item,
  label,
  variant = "default",
}: {
  item?: ShopGalleryItem;
  label?: string;
  variant?: "default" | "outline" | "soft" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(() => galleryFormValues(item));
  const router = useRouter();

  useEffect(() => {
    if (open) setForm(galleryFormValues(item));
  }, [open, item]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.image_url.trim()) {
      toast.error("Add a photo URL first.");
      return;
    }

    setLoading(true);
    const response = await fetch(item ? `/api/shop/gallery/${item.id}` : "/api/shop/gallery", {
      method: item ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: form.image_url.trim(),
        caption: form.caption,
        pet_name: form.pet_name,
        customer_name: form.customer_name,
        featured: form.featured,
        active: form.active,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to save the gallery photo.");
      return;
    }

    toast.success(item ? "Gallery photo updated." : "Gallery photo added.");
    setOpen(false);
    if (!item) setForm(galleryFormValues());
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={label ? "sm" : "default"}>
          {item ? null : <Plus className="h-4 w-4" />}
          {label ?? (item ? "Edit" : "Add photo")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{item ? "Edit gallery photo" : "Add a happy customer photo"}</DialogTitle>
          <DialogDescription>
            Build a gallery of satisfied customers. Featured photos can also appear on the
            homepage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gallery-image">Photo URL</Label>
            <Input
              id="gallery-image"
              value={form.image_url}
              onChange={(event) => setForm({ ...form, image_url: event.target.value })}
              placeholder="https://example.com/happy-customer.jpg"
              required
            />
            <div className="grid h-44 place-items-center overflow-hidden rounded-2xl border bg-secondary/50">
              {form.image_url ? (
                <img
                  src={form.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex flex-col items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <ImagePlus className="h-6 w-6" />
                  Photo preview
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gallery-caption">Caption</Label>
            <Textarea
              id="gallery-caption"
              rows={2}
              value={form.caption}
              onChange={(event) => setForm({ ...form, caption: event.target.value })}
              placeholder="Fresh from the dryer and feeling fancy."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="gallery-pet">Pet name</Label>
              <Input
                id="gallery-pet"
                value={form.pet_name}
                onChange={(event) => setForm({ ...form, pet_name: event.target.value })}
                placeholder="Mochi"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gallery-customer">Customer name</Label>
              <Input
                id="gallery-customer"
                value={form.customer_name}
                onChange={(event) =>
                  setForm({ ...form, customer_name: event.target.value })
                }
                placeholder="Jasmine"
              />
            </div>
          </div>

          <div className="grid gap-2 rounded-2xl border bg-secondary/40 p-3 text-sm sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-white/70 p-3">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
                className="mt-0.5 h-4 w-4 accent-brand-600"
              />
              <span>
                <span className="block font-bold">Visible on shop page</span>
                <span className="block text-xs text-muted-foreground">
                  Customers can see this photo in your gallery.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-white/70 p-3">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => setForm({ ...form, featured: event.target.checked })}
                className="mt-0.5 h-4 w-4 accent-brand-600"
              />
              <span>
                <span className="block font-bold">Feature on homepage</span>
                <span className="block text-xs text-muted-foreground">
                  Include this photo in the PetBook gallery.
                </span>
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Saving..." : item ? "Save changes" : "Add photo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteGalleryButton({ itemId }: { itemId: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function remove() {
    if (!window.confirm("Remove this gallery photo? This cannot be undone.")) return;
    setLoading(true);
    const response = await fetch(`/api/shop/gallery/${itemId}`, { method: "DELETE" });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to remove the gallery photo.");
      return;
    }

    toast.success("Gallery photo removed.");
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
