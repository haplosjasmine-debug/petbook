import { cn } from "@/lib/utils";
import { normalizeServiceImages } from "@/lib/service-availability";

export function ServiceImageCollage({
  images,
  name,
  className,
}: {
  images: string[] | null | undefined;
  name: string;
  className?: string;
}) {
  const list = normalizeServiceImages(images);
  if (!list.length) return null;

  const remaining = list.length - 3;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-brand-50",
        className ?? "h-40 w-full"
      )}
    >
      {list.length === 1 ? (
        <img
          src={list[0]}
          alt={name}
          className="h-full w-full object-cover transition duration-500 hover:scale-105"
        />
      ) : (
        <div className="grid h-full grid-cols-[1.45fr_1fr] gap-1">
          <img
            src={list[0]}
            alt={name}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
          <div className="grid h-full gap-1">
            {list.slice(1, 3).map((image, index) => (
              <img
                key={`${image}-${index}`}
                src={image}
                alt=""
                className="h-full min-h-0 w-full object-cover"
              />
            ))}
          </div>
        </div>
      )}
      {remaining > 0 ? (
        <span className="absolute bottom-2 right-2 rounded-full bg-brand-950/80 px-2 py-1 text-[10px] font-black text-white backdrop-blur">
          +{remaining} photos
        </span>
      ) : null}
    </div>
  );
}
