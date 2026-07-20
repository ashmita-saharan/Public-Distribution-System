import { Factory, AlertTriangle, Activity, Lock } from "lucide-react";
import StatCard from "@/components/common/StatCard";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";

export default function OverviewPage({ overview, alerts, weightLogs, rfidLogs }) {
  return (
    <div className="space-y-8 page-fade-in">
      <PageHeader
        title="Overview Dashboard"
        subtitle="Central view of stock movement, access activity, alerts, and lock status."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Shops" value={overview?.total_shops ?? 0} icon={Factory} hint="Shops reporting data" />
        <StatCard title="Alerts" value={overview?.total_alerts ?? 0} icon={AlertTriangle} hint="Detected irregularities" />
        <StatCard title="RFID Events" value={overview?.total_rfid_events ?? 0} icon={Activity} hint="Access scans recorded" />
        <StatCard title="Locked Containers" value={overview?.locked_count ?? 0} icon={Lock} hint="Containers requiring attention" />
      </div>

      <DataTable
        rows={alerts.slice(0, 8)}
        columns={[
          { key: "timestamp", label: "Time" },
          { key: "shop_id", label: "Shop" },
          { key: "item", label: "Item" },
          { key: "alert_type", label: "Alert", render: (v) => <StatusBadge value={v} /> },
          { key: "reason", label: "Reason" },
          { key: "action_taken", label: "Action" },
        ]}
        emptyText="No alerts yet."
      />

      <DataTable
        rows={weightLogs.slice(0, 8)}
        columns={[
          { key: "timestamp", label: "Time" },
          { key: "shop_id", label: "Shop" },
          { key: "item", label: "Item" },
          { key: "weight_g", label: "Stock Left (g)" },
          { key: "change_g", label: "Change (g)" },
          { key: "event", label: "Event", render: (v) => <StatusBadge value={v} /> },
        ]}
        emptyText="No stock events yet."
      />
    </div>
  );
}