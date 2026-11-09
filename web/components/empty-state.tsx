import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed bg-white/60 px-6 py-12 text-center">
      {Icon ? (
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <Icon className="h-6 w-6" />
        </span>
      ) : null}
      <h3 className="text-base font-bold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
