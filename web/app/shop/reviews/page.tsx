import { Star } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ReviewCard } from "@/components/review-card";
import { ReviewSummaryPanel } from "@/components/review-summary";
import { Card, CardContent } from "@/components/ui/card";
import { shopReviews } from "@/lib/queries";
import { summarizeReviews } from "@/lib/reviews";
import { requireShop } from "@/lib/session";

export const metadata = { title: "Reviews" };

export default async function ShopReviewsPage() {
  const session = await requireShop();
  const reviews = await shopReviews(session.shop!.id).catch(() => []);
  const summary = summarizeReviews(reviews);

  return (
    <>
      <PageHeader
        eyebrow="Customer feedback"
        title="Reviews"
        description="See how pet parents rate your shop and services, and read what they loved about their visits."
      />

      {reviews.length ? (
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="space-y-4 lg:sticky lg:top-24">
            <ReviewSummaryPanel summary={summary} />
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-500">
                  <Star className="h-5 w-5 fill-amber-400" />
                </span>
                <div>
                  <p className="text-2xl font-black">{summary.count}</p>
                  <p className="text-xs text-muted-foreground">
                    total review{summary.count === 1 ? "" : "s"} from customers
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Customer ratings and comments will appear here after their visits. Keep delighting pets and the feedback will follow."
        />
      )}
    </>
  );
}
