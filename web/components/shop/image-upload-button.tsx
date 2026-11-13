"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type UploadedImage = { id: string; url: string };

export function ImageUploadButton({
  onUploaded,
  label = "Upload image",
  disabled = false,
  variant = "outline",
  size = "sm",
  endpoint = "/api/shop/uploads",
}: {
  onUploaded: (image: UploadedImage) => void;
  label?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "soft" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  endpoint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Images must be smaller than 8 MB.");
      return;
    }

    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(endpoint, { method: "POST", body });
    const data = (await response.json().catch(() => ({}))) as {
      id?: string;
      url?: string;
      message?: string;
    };
    setUploading(false);

    if (!response.ok || !data.id || !data.url) {
      toast.error(data.message ?? "Unable to upload the image.");
      return;
    }

    onUploaded({ id: data.id, url: data.url });
    toast.success("Image uploaded.");
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={choose}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
        {uploading ? "Uploading." : label}
      </Button>
    </>
  );
}
