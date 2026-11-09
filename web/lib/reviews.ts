import type { Review, Shop } from "@/lib/types";

export type ReviewSummary = {
  count: number;
  average: number;
  breakdown: Record<number, number>;
};

export function summarizeReviews(reviews: Pick<Review, "rating">[]): ReviewSummary {
  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;

  for (const review of reviews) {
    const stars = Math.max(1, Math.min(5, Math.round(Number(review.rating) || 0)));
    breakdown[stars] += 1;
    total += stars;
  }

  return {
    count: reviews.length,
    average: reviews.length ? total / reviews.length : 0,
    breakdown,
  };
}

export function summarizeReviewsByShop(
  reviews: (Pick<Review, "rating" | "shop">)[]
): Map<number, ReviewSummary> {
  const grouped = new Map<number, Pick<Review, "rating">[]>();

  for (const review of reviews) {
    const shopId =
      typeof review.shop === "number" ? review.shop : (review.shop as Shop).id;
    const rows = grouped.get(shopId) ?? [];
    rows.push(review);
    grouped.set(shopId, rows);
  }

  return new Map(
    [...grouped.entries()].map(([shopId, rows]) => [shopId, summarizeReviews(rows)])
  );
}

export function summarizeReviewsByService(
  reviews: (Pick<Review, "rating" | "service">)[]
): Map<number, ReviewSummary> {
  const grouped = new Map<number, Pick<Review, "rating">[]>();

  for (const review of reviews) {
    if (!review.service) continue;
    const serviceId =
      typeof review.service === "number" ? review.service : review.service.id;
    const rows = grouped.get(serviceId) ?? [];
    rows.push(review);
    grouped.set(serviceId, rows);
  }

  return new Map(
    [...grouped.entries()].map(([serviceId, rows]) => [serviceId, summarizeReviews(rows)])
  );
}

export function reviewAuthor(review: Review) {
  const customer = typeof review.customer === "object" ? review.customer : null;
  if (!customer) return "PetBook customer";
  return [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "PetBook customer";
}
