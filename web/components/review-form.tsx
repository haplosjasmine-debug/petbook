"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ReviewForm({
  shopId,
  shopSlug,
  services,
  signedIn,
  isCustomer,
}: {
  shopId: number;
  shopSlug: string;
  services: Service[];
  signedIn: boolean;
  isCustomer: boolean;
}) {
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [serviceId, setServiceId] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!signedIn) {
    return (
      <Card className="border-dashed bg-white/60">
        <CardContent className="p-5">
          <p className="text-sm font-black">Share your experience</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sign in as a customer to rate this shop, comment on a service, and help other pet
            parents choose well.
          </p>
          <Button asChild className="mt-4 w-full" variant="soft">
            <Link href={`/login?next=${encodeURIComponent(`/shops/${shopSlug}#reviews`)}`}>
              Sign in to review
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isCustomer) {
    return (
      <Card className="border-dashed bg-white/60">
        <CardContent className="p-5 text-sm text-muted-foreground">
          Reviews are written by customer accounts. Shop owners and administrators can read
          feedback from the reviews workspace.
        </CardContent>
      </Card>
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (comment.trim().length < 4) {
      toast.error("Add a short comment about your visit.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop: shopId,
        service: serviceId ? Number(serviceId) : null,
        rating,
        comment: comment.trim(),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to save your review.");
      return;
    }

    toast.success("Thanks for sharing your experience.");
    setComment("");
    setServiceId("");
    setRating(5);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm font-black">Share your experience</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your rating and comment are public. You can update your review for the same service
          later.
        </p>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Your rating</Label>
            <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} star${star === 1 ? "" : "s"}`}
                  className="rounded-md p-0.5 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  onMouseEnter={() => setHovered(star)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={cn(
                      "h-7 w-7",
                      star <= (hovered || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-transparent text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-bold text-muted-foreground">
                {hovered || rating} of 5
              </span>
            </div>
          </div>

          {services.length ? (
            <div className="space-y-1.5">
              <Label htmlFor="review-service">Service reviewed</Label>
              <Select
                id="review-service"
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
              >
                <option value="">The whole shop</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="review-comment">Your comment</Label>
            <Textarea
              id="review-comment"
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Tell other pet parents what stood out about your visit."
              maxLength={1000}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Publishing..." : "Publish review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
