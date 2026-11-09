import Link from "next/link";
import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  className,
  inverted = false,
}: {
  href?: string;
  className?: string;
  inverted?: boolean;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-2xl shadow-sm",
          inverted ? "bg-white text-brand-700" : "bg-primary text-primary-foreground"
        )}
      >
        <PawPrint className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <span className={cn("text-xl font-black tracking-tight", inverted ? "text-white" : "text-foreground")}>
        Pet<span className="text-coral-500">Book</span>
      </span>
    </Link>
  );
}
