import Link from "next/link";
import { Camera, MapPin, PawPrint } from "lucide-react";
import type { Shop, ShopGalleryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ShopGalleryGrid({
  items,
  showShop = false,
  className,
}: {
  items: ShopGalleryItem[];
  showShop?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
      {items.map((item) => {
        const shop = typeof item.shop === "object" ? (item.shop as Shop) : null;
        const label =
          item.caption ||
          [item.pet_name, shop?.name].filter(Boolean).join(" at ") ||
          "A happy PetBook customer";

        const card = (
          <figure className="group relative aspect-square overflow-hidden rounded-2xl bg-brand-50">
            <img
              src={item.image_url}
              alt={label}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/10 to-transparent" />
            {showShop && shop ? (
              <span className="absolute left-2.5 top-2.5 inline-flex max-w-[calc(100%-1.25rem)] items-center gap-1 truncate rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-brand-800 shadow-sm backdrop-blur">
                <MapPin className="h-3 w-3 shrink-0" /> {shop.name}
              </span>
            ) : (
              <span className="absolute left-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white/85 text-brand-700 shadow-sm backdrop-blur">
                <Camera className="h-3.5 w-3.5" />
              </span>
            )}
            <figcaption className="absolute inset-x-0 bottom-0 p-3 text-white">
              <p className="line-clamp-2 text-xs font-bold leading-snug">
                {item.caption || label}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-white/70">
                <PawPrint className="h-3 w-3" />
                {[item.pet_name, item.customer_name].filter(Boolean).join(" - ") ||
                  "Happy customer"}
              </p>
            </figcaption>
          </figure>
        );

        return showShop && shop?.slug ? (
          <Link
            key={item.id}
            href={`/shops/${shop.slug}#gallery`}
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            {card}
          </Link>
        ) : (
          <div key={item.id}>{card}</div>
        );
      })}
    </div>
  );
}
