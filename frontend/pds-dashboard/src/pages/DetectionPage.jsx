import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ShieldAlert, Database, Siren, Thermometer } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DetectionPage({ alerts, rfidLogs, weightLogs, envLogs }) {
  const deniedCount = rfidLogs.filter((r) =>
    String(r.access || "").includes("denied")
  ).length;

  const avgWeightDrop = (() => {
    const values = weightLogs
      .map((r) => Number(r.change_g || 0))
      .filter((v) => v > 0);
    if (!values.length) return "0.0";
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  })();

  const envWarningCount = envLogs.filter(
    (e) =>
      Number(e.temperature_c || 0) > 35 ||
      Number(e.humidity_percent || 0) > 75
  ).length;

  const anomalyTrend = alerts.slice(0, 7).reverse().map((row, index) => ({
    name: `A${index + 1}`,
    count: 1,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI / Detection Page"
        subtitle="Rule-based detection is active now. This page also highlights AI-ready metrics for future model training."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Rule Engine Active"
          value="Yes"
          hint="Real-time backend anomaly rules are enabled"
          icon={ShieldAlert}
        />
        <StatCard
          title="Avg Weight Drop / Event"
          value={`${avgWeightDrop} g`}
          hint="Derived from stored weight logs"
          icon={Database}
        />
        <StatCard
          title="Denied Scan Count"
          value={deniedCount}
          hint="RFID denial events in current records"
          icon={Siren}
        />
        <StatCard
          title="Env Warning Count"
          value={envWarningCount}
          hint="Potential unusual temperature or humidity readings"
          icon={Thermometer}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="glass-card rounded-[28px]">
          <CardHeader>
            <CardTitle>Suspicious Activity Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={anomalyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-[28px]">
          <CardHeader>
            <CardTitle>Detection Module Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
              <p className="font-medium text-slate-900">Current detection mode</p>
              <p className="mt-1">Rule-based real-time anomaly detection</p>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
              <p className="font-medium text-slate-900">AI confidence</p>
              <p className="mt-1">Experimental / planned after enough dataset collection</p>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
              <p className="font-medium text-slate-900">Suggested model later</p>
              <p className="mt-1">Isolation Forest for behavior and distribution anomaly detection</p>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
              <p className="font-medium text-slate-900">Recommended action</p>
              <p className="mt-1">Keep collecting logs from multiple shops and items, then train an AI anomaly model.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}