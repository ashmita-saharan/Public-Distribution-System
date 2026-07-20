import { Card, CardContent } from "@/components/ui/card";

export default function StatCard({ title, value, hint, icon: Icon }) {
  return (
    <Card className="glass-card stat-float rounded-[28px] border-white/60">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="mt-3 text-4xl font-semibold text-slate-900">
              {value}
            </h3>
            <p className="mt-3 text-xs leading-5 text-slate-500">{hint}</p>
          </div>

          <div className="rounded-2xl bg-white/80 p-3 shadow-sm border border-white/60">
            <Icon className="h-5 w-5 text-violet-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}