import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: "brand" | "coral" | "blue" | "amber";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    coral: "bg-orange-50 text-coral-600",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
  } as const;

  return (
    <Card className="group transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft">
      <CardContent className="flex items-start gap-4 p-5">
        {Icon ? (
          <span
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition duration-300 group-hover:scale-110 group-hover:rotate-3",
              tones[tone]
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-black tracking-tight">{value}</p>
          {hint ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
