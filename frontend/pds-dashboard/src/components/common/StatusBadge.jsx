import { Badge } from "@/components/ui/badge";

export default function StatusBadge({ value }) {
  const v = String(value || "unknown").toLowerCase();

  let cls =
    "bg-white/70 text-slate-700 border-slate-200";

  if (v.includes("lock") || v.includes("anomaly")) {
    cls = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (
    v.includes("grant") ||
    v.includes("ready") ||
    v.includes("open") ||
    v.includes("online")
  ) {
    cls = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (v.includes("denied") || v.includes("warning")) {
    cls = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (v.includes("active")) {
    cls = "bg-violet-50 text-violet-700 border-violet-200";
  }

  return (
    <Badge variant="outline" className={`rounded-full px-3 py-1 ${cls}`}>
      {value || "unknown"}
    </Badge>
  );
}