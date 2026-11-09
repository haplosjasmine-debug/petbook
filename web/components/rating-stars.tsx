import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  className,
  starClassName,
  showValue = false,
}: {
  rating: number;
  className?: string;
  starClassName?: string;
  showValue?: boolean;
}) {
  const rounded = Math.round(rating);

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "h-3.5 w-3.5",
            index < rounded
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground/30",
            starClassName
          )}
        />
      ))}
      {showValue ? <span className="ml-1 text-xs font-bold">{rating.toFixed(1)}</span> : null}
    </span>
  );
}
