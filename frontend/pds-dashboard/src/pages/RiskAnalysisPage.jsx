import { AlertTriangle, ShieldAlert } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";

export default function RiskAnalysisPage({ riskAnalysis }) {
  const rows = riskAnalysis?.risk_analysis || [];
  const highRisk = rows.filter((r) => r.risk_level === "High").length;
  const mediumRisk = rows.filter((r) => r.risk_level === "Medium").length;

  const riskChartData = rows.map((row) => ({
    name: `${row.shop_id}-${row.item}`,
    risk: Number(row.risk_score || 0),
    mismatch: Number(row.people_rfid_mismatch || 0),
  }));

  return (
    <div className="space-y-8 page-fade-in">
      <PageHeader
        title="Risk Analysis"
        subtitle="Combined alerts and detection page showing likely fraud risk, reasons, and recommended action."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="High Risk Items" value={highRisk} icon={ShieldAlert} hint="Needs inspection or restriction" />
        <StatCard title="Medium Risk Items" value={mediumRisk} icon={AlertTriangle} hint="Needs closer monitoring" />
        <StatCard title="Detection Mode" value="Rules" icon={ShieldAlert} hint="AI model can be trained later from logs" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card rounded-[28px] p-6">
            <h2 className="text-[#332f5b] font-semibold text-xl mb-4">
            Risk Score by Shop / Item
            </h2>

            <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="risk" fill="#fb7185" radius={[10, 10, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>

        <div className="glass-card rounded-[28px] p-6">
            <h2 className="text-[#332f5b] font-semibold text-xl mb-4">
            People Served vs RFID Mismatch
            </h2>

            <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="mismatch" fill="#f59e0b" radius={[10, 10, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>
        </div>

      <DataTable
        rows={rows}
        columns={[
          { key: "shop_id", label: "Shop" },
          { key: "item", label: "Item" },
          { key: "risk_score", label: "Risk Score" },
          { key: "risk_level", label: "Risk Level", render: (v) => <StatusBadge value={v} /> },
          { key: "reasons", label: "Reasons", render: (v) => Array.isArray(v) ? v.join(", ") : v },
          { key: "recommended_action", label: "Recommended Action" },
          { key: "people_served_today", label: "People Served" },
          { key: "rfid_granted_today", label: "RFID Granted" },
          { key: "people_rfid_mismatch", label: "Mismatch" },
        ]}
        emptyText="No risk data available."
      />
    </div>
  );
}