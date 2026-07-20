import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";

export default function AlertsPage({ alerts }) {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Alerts Page"
        subtitle="All triggered anomalies such as large weight drop, denied access patterns, and suspicious activity."
      />

      <DataTable
        rows={alerts}
        columns={[
          { key: "timestamp", label: "Timestamp" },
          { key: "shop_id", label: "Shop" },
          { key: "item", label: "Item" },
          {
            key: "alert_type",
            label: "Alert Type",
            render: (v) => <StatusBadge value={v} />,
          },
          { key: "reason", label: "Reason" },
          { key: "action_taken", label: "Action" },
        ]}
      />
    </div>
  );
}