import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/utils";

const styles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  confirmed: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  checked_in: "bg-violet-100 text-violet-800 hover:bg-violet-100",
  in_progress: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
  completed: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
  no_show: "bg-slate-200 text-slate-700 hover:bg-slate-200",
  paid: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  refunded: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  settled: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  scheduled: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  sent: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  failed: "bg-red-100 text-red-800 hover:bg-red-100",
  earned: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  redeemed: "bg-coral-100 text-coral-800 hover:bg-coral-100",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = String(status ?? "unknown");
  return (
    <Badge className={styles[key] ?? "bg-slate-100 text-slate-700 hover:bg-slate-100"}>
      {titleCase(key)}
    </Badge>
  );
}
