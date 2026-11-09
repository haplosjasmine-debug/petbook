import { Quote, Store } from "lucide-react";
import { RatingStars } from "@/components/rating-stars";
import { Card, CardContent } from "@/components/ui/card";
import type { Review, Service, Shop } from "@/lib/types";
import { reviewAuthor } from "@/lib/reviews";
import { cn, formatDate, initials } from "@/lib/utils";

export function ReviewCard({
  review,
  showShop = false,
  tone = "light",
}: {
  review: Review;
  showShop?: boolean;
  tone?: "light" | "dark";
}) {
  const shop = typeof review.shop === "object" ? (review.shop as Shop) : null;
  const service =
    review.service && typeof review.service === "object"
      ? (review.service as Service)
      : null;
  const author = reviewAuthor(review);
  const context = [service?.name, showShop ? shop?.name : null].filter(Boolean).join(" - ");
  const dark = tone === "dark";

  const content = (
    <CardContent className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-xs font-black",
              dark ? "bg-white/10 text-white" : "bg-brand-100 text-brand-700"
            )}
          >
            {initials(author)}
          </span>
          <div className="min-w-0">
            <p className={cn("truncate text-sm font-black", dark && "text-white")}>{author}</p>
            <p className={cn("truncate text-[11px]", dark ? "text-white/55" : "text-muted-foreground")}>
              {context || (showShop ? shop?.name : "PetBook customer")}
            </p>
          </div>
        </div>
        <Quote
          className={cn(
            "h-5 w-5 shrink-0",
            dark ? "text-coral-300/60" : "text-brand-200"
          )}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <RatingStars rating={Number(review.rating)} />
        {review.date_created ? (
          <span className={cn("text-[11px]", dark ? "text-white/50" : "text-muted-foreground")}>
            {formatDate(review.date_created, false)}
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          "mt-3 flex-1 text-sm leading-relaxed",
          dark ? "text-white/80" : "text-muted-foreground"
        )}
      >
        {review.comment || "A happy PetBook customer."}
      </p>

      {showShop && shop ? (
        <p
          className={cn(
            "mt-4 flex items-center gap-1.5 border-t pt-3 text-[11px] font-semibold",
            dark ? "border-white/10 text-white/60" : "border-border text-muted-foreground"
          )}
        >
          <Store className="h-3.5 w-3.5" /> {shop.city || shop.name}
        </p>
      ) : null}
    </CardContent>
  );

  if (dark) {
    return (
      <div className="h-full rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur">
        {content}
      </div>
    );
  }

  return <Card className="h-full">{content}</Card>;
}
