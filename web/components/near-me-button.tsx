"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function NearMeButton({
  search = "",
  className = "",
}: {
  search?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function locate() {
    if (!navigator.geolocation) {
      toast.error("This browser does not support GPS location.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        params.set("lat", position.coords.latitude.toFixed(6));
        params.set("lng", position.coords.longitude.toFixed(6));
        router.push(`/shops?${params.toString()}`);
      },
      () => {
        setLoading(false);
        toast.error("Location permission was denied. Enable GPS and try again.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 }
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={locate}
      disabled={loading}
      className={className}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
      {loading ? "Locating…" : "Use my location"}
    </Button>
  );
}
