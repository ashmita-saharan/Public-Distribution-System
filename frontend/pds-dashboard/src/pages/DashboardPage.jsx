import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, AlertTriangle, Activity, Lock } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import StatCard from "@/components/common/StatCard";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";

export default function DashboardPage({
  overview,
  alerts,
  weightLogs,
  rfidLogs,
  envLogs,
}) {
  const weightChartData = weightLogs.slice(0, 8).reverse().map((row, i) => ({
    name: `E${i + 1}`,
    change: Number(row.change_g || 0),
  }));

  const envChartData = envLogs.slice(0, 8).reverse().map((row, i) => ({
    name: `R${i + 1}`,
    temp: Number(row.temperature_c || 0),
    humidity: Number(row.humidity_percent || 0),
  }));

  return (
    <div className="space-y-8 page-fade-in">
      <PageHeader
        title="Overview Dashboard"
        subtitle="System summary across shops, containers, alerts, and recent events."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Shops Active"
          value={overview?.total_shops ?? 0}
          hint="Unique shops with stored records"
          icon={Factory}
        />
        <StatCard
          title="Total Alerts"
          value={overview?.total_alerts ?? 0}
          hint="Rule-triggered alerts and anomalies"
          icon={AlertTriangle}
        />
        <StatCard
          title="Total RFID Events"
          value={overview?.total_rfid_events ?? 0}
          hint="Granted and denied access scans"
          icon={Activity}
        />
        <StatCard
          title="Locked Containers"
          value={overview?.locked_count ?? 0}
          hint="Containers currently flagged as locked"
          icon={Lock}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="glass-card rounded-[28px] dashboard-card-hover">
          <CardHeader>
            <CardTitle className="text-slate-900 font-semibold text-xl">Latest Distribution Events</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="change"
                  strokeWidth={3}
                  stroke="#8b5cf6"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-[28px] dashboard-card-hover">
          <CardHeader>
            <CardTitle className="text-slate-900 font-semibold text-xl">Environment Summary</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={envChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="temp" fill="#a78bfa" radius={[10, 10, 0, 0]} />
                <Bar
                  dataKey="humidity"
                  fill="#e9b7d8"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="glass-card rounded-[28px] dashboard-card-hover">
          <CardHeader>
            <CardTitle className="text-slate-900 font-semibold text-xl">Latest Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-white/60 bg-white/60 p-4 transition hover:bg-white/75"
              >
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge value={a.alert_type} />
                  <span className="text-xs text-slate-500">{a.timestamp}</span>
                </div>
                <p className="mt-2 font-medium text-slate-900">{a.reason}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {a.shop_id} • {a.item} • action: {a.action_taken}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card rounded-[28px] dashboard-card-hover">
          <CardHeader>
            <CardTitle className="text-slate-900 font-semibold text-xl">Latest RFID Scans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rfidLogs.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-white/60 bg-white/60 p-4 flex items-center justify-between gap-3 transition hover:bg-white/75"
              >
                <div>
                  <p className="font-medium text-slate-900">{r.rfid_uid}</p>
                  <p className="text-xs text-slate-500">
                    {r.shop_id} • {r.item} • {r.timestamp}
                  </p>
                </div>
                <StatusBadge value={r.access} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}