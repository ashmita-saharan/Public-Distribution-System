import { Users, Store, PackageCheck } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ConsumerView({
  consumerShops,
  selectedConsumerShop,
  setSelectedConsumerShop,
  consumerAvailability,
}) {
  const rows = consumerAvailability?.availability || [];

  const availableCount = rows.filter((r) => r.available).length;

  return (
    <div className="space-y-8 page-fade-in">
      <PageHeader
        title="Consumer View"
        subtitle="Public transparency page where beneficiaries can check ration availability without technical logs."
      />

      <div className="max-w-xs">
        <Select value={selectedConsumerShop} onValueChange={setSelectedConsumerShop}>
          <SelectTrigger className="rounded-2xl bg-white/70 backdrop-blur-md border-white/60">
            <SelectValue placeholder="Select shop" />
          </SelectTrigger>
          <SelectContent>
            {consumerShops.map((shop) => (
              <SelectItem key={shop} value={shop}>{shop}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Selected Shop" value={selectedConsumerShop || "—"} icon={Store} hint="Public ration shop" />
        <StatCard title="Available Items" value={availableCount} icon={PackageCheck} hint="Items currently available" />
        <StatCard title="Beneficiary Access" value="Open View" icon={Users} hint="No login required for public status" />
      </div>

      <DataTable
        rows={rows}
        columns={[
          { key: "item", label: "Item" },
          { key: "availability_text", label: "Availability", render: (v) => <StatusBadge value={v} /> },
          { key: "approx_stock_g", label: "Approx Stock (g)" },
          { key: "distribution_status", label: "Distribution Status", render: (v) => <StatusBadge value={v} /> },
          { key: "last_updated", label: "Last Updated" },
        ]}
        emptyText="No availability data for this shop."
      />
    </div>
  );
}