import { useMemo, useState } from "react";
import { AlertTriangle, Lock, PackageMinus, Users } from "lucide-react";
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminView({ adminSummary }) {
  const [selectedShop, setSelectedShop] = useState("all");
  const [selectedItem, setSelectedItem] = useState("all");

  const stockRows = adminSummary?.stock_overview || [];

  const shops = useMemo(() => {
    return ["all", ...new Set(stockRows.map((row) => row.shop_id))];
  }, [stockRows]);

  const items = useMemo(() => {
    return ["all", ...new Set(stockRows.map((row) => row.item))];
  }, [stockRows]);

  const filteredStockRows = useMemo(() => {
    return stockRows.filter((row) => {
      const shopMatch = selectedShop === "all" || row.shop_id === selectedShop;
      const itemMatch = selectedItem === "all" || row.item === selectedItem;
      return shopMatch && itemMatch;
    });
  }, [stockRows, selectedShop, selectedItem]);

  const stockChartData = filteredStockRows.map((row) => ({
    name: `${row.shop_id}-${row.item}`,
    stock: Number(row.weight_g || 0),
    people: Number(row.people_served_today || 0),
    days: Number(row.estimated_days_left || 0),
  }));

  return (
    <div className="space-y-8 page-fade-in">
      <PageHeader
        title="Admin View"
        subtitle="Authority-level monitoring for stock, refill needs, people served, and suspicious activity."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="High Risk Shops"
          value={adminSummary?.high_risk_shops ?? 0}
          icon={AlertTriangle}
          hint="Shops with anomaly history"
        />

        <StatCard
          title="Low Stock Containers"
          value={adminSummary?.low_stock_count ?? 0}
          icon={PackageMinus}
          hint="Items below refill threshold"
        />

        <StatCard
          title="Total People Served"
          value={adminSummary?.total_people_served ?? 0}
          icon={Users}
          hint="Estimated from ration distributed today"
        />

        <StatCard
          title="Pending Refill Requests"
          value={adminSummary?.pending_refill_requests ?? 0}
          icon={Lock}
          hint="Low stock items needing refill"
        />
      </div>

      <div className="glass-card rounded-[28px] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[#332f5b] font-semibold text-xl">
              Stock Analytics
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Filter stock and service estimates by shop and item.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedShop} onValueChange={setSelectedShop}>
              <SelectTrigger className="w-full sm:w-44 rounded-2xl bg-white/70 border-white/60">
                <SelectValue placeholder="Select shop" />
              </SelectTrigger>
              <SelectContent>
                {shops.map((shop) => (
                  <SelectItem key={shop} value={shop}>
                    {shop === "all" ? "All Shops" : shop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger className="w-full sm:w-44 rounded-2xl bg-white/70 border-white/60">
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item === "all" ? "All Items" : item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card rounded-[28px] p-6">
          <h2 className="text-[#332f5b] font-semibold text-xl mb-4">
            Stock Left per Item
          </h2>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-[28px] p-6">
          <h2 className="text-[#332f5b] font-semibold text-xl mb-4">
            People Served per Item
          </h2>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="people" fill="#e9b7d8" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <DataTable
        rows={filteredStockRows}
        columns={[
          { key: "shop_id", label: "Shop" },
          { key: "item", label: "Item" },
          { key: "weight_g", label: "Food Left (g)" },
          { key: "change_g", label: "Last Change (g)" },
          { key: "people_served_today", label: "People Served Today" },
          { key: "estimated_days_left", label: "Days Left" },
          {
            key: "refill_status",
            label: "Refill Status",
            render: (v) => <StatusBadge value={v} />,
          },
          {
            key: "event",
            label: "Event",
            render: (v) => <StatusBadge value={v} />,
          },
          { key: "timestamp", label: "Last Updated" },
        ]}
        emptyText="No stock data found for selected filter."
      />

      <DataTable
        rows={adminSummary?.recent_alerts || []}
        columns={[
          { key: "timestamp", label: "Time" },
          { key: "shop_id", label: "Shop" },
          { key: "item", label: "Item" },
          {
            key: "alert_type",
            label: "Alert",
            render: (v) => <StatusBadge value={v} />,
          },
          { key: "reason", label: "Reason" },
          { key: "action_taken", label: "Action" },
        ]}
        emptyText="No recent alerts."
      />
    </div>
  );
}