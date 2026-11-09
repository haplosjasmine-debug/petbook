import { Star } from "lucide-react";
import { RatingStars } from "@/components/rating-stars";
import { Card, CardContent } from "@/components/ui/card";
import type { ReviewSummary } from "@/lib/reviews";

export function ReviewSummaryPanel({
  summary,
  title = "Customer rating",
  description = "Ratings and comments from verified PetBook customers.",
}: {
  summary: ReviewSummary;
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-500">
            <Star className="h-5 w-5 fill-amber-400" />
          </span>
        </div>

        <div className="mt-5 flex items-end gap-4">
          <p className="text-5xl font-black leading-none tracking-tight">
            {summary.count ? summary.average.toFixed(1) : "New"}
          </p>
          <div className="pb-1">
            <RatingStars rating={summary.average} />
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.count
                ? `${summary.count} review${summary.count === 1 ? "" : "s"}`
                : "No reviews yet"}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = summary.breakdown[stars] ?? 0;
            const percent = summary.count ? (count / summary.count) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-bold text-muted-foreground">{stars} star</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-5 text-right font-bold text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
