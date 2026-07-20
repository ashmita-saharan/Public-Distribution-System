import { Store, Users, PackageCheck, Clock } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";

export default function DistributorView({ distributorSummary }) {
  const items = distributorSummary?.items || [];

  const peopleServed = items.reduce(
    (sum, item) => sum + Number(item.people_served_today || 0),
    0
  );

  return (
    <div className="space-y-8 page-fade-in">
      <PageHeader
        title="Distributor View"
        subtitle="Shop-level operational view for stock left, estimated duration, served people, and refill needs."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Shop ID" value={distributorSummary?.shop_id || "—"} icon={Store} hint="Selected distributor shop" />
        <StatCard title="Items Monitored" value={items.length} icon={PackageCheck} hint="Rice, wheat, or other commodities" />
        <StatCard title="People Served Today" value={peopleServed} icon={Users} hint="Estimated from distributed weight" />
        <StatCard title="Refill Planning" value="Active" icon={Clock} hint="Based on estimated days left" />
      </div>

      <DataTable
        rows={items}
        columns={[
          { key: "item", label: "Item" },
          { key: "current_weight_g", label: "Food Left (g)" },
          { key: "stock_status", label: "Stock Status", render: (v) => <StatusBadge value={v} /> },
          { key: "estimated_days_left", label: "Estimated Days Left" },
          { key: "people_served_today", label: "People Served Today" },
          { key: "total_distributed_today_g", label: "Distributed Today (g)" },
        ]}
        emptyText="No item data for this distributor."
      />

      <DataTable
        rows={distributorSummary?.recent_access_logs || []}
        columns={[
          { key: "timestamp", label: "Time" },
          { key: "item", label: "Item" },
          { key: "rfid_uid", label: "RFID UID" },
          { key: "access", label: "Access", render: (v) => <StatusBadge value={v} /> },
          { key: "locked", label: "Locked", render: (v) => <StatusBadge value={v ? "yes" : "no"} /> },
        ]}
        emptyText="No recent access logs."
      />
    </div>
  );
}