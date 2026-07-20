import { useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";

export default function LogsPage({
  selectedLog,
  setSelectedLog,
  weightLogs,
  rfidLogs,
  envLogs,
  statusLogs,
}) {
  const logMap = useMemo(
    () => ({
      weight: {
        title: "Weight Logs",
        rows: weightLogs,
        columns: [
          { key: "timestamp", label: "Timestamp" },
          { key: "shop_id", label: "Shop" },
          { key: "item", label: "Item" },
          { key: "weight_g", label: "Weight (g)" },
          { key: "change_g", label: "Change (g)" },
          {
            key: "event",
            label: "Event",
            render: (v) => <StatusBadge value={v} />,
          },
        ],
      },
      rfid: {
        title: "RFID Logs",
        rows: rfidLogs,
        columns: [
          { key: "timestamp", label: "Timestamp" },
          { key: "shop_id", label: "Shop" },
          { key: "item", label: "Item" },
          { key: "rfid_uid", label: "RFID UID" },
          {
            key: "access",
            label: "Access",
            render: (v) => <StatusBadge value={v} />,
          },
          {
            key: "locked",
            label: "Locked",
            render: (v) => <StatusBadge value={v ? "yes" : "no"} />,
          },
        ],
      },
      environment: {
        title: "Environment Logs",
        rows: envLogs,
        columns: [
          { key: "timestamp", label: "Timestamp" },
          { key: "shop_id", label: "Shop" },
          { key: "item", label: "Item" },
          { key: "temperature_c", label: "Temperature (°C)" },
          { key: "humidity_percent", label: "Humidity (%)" },
        ],
      },
      status: {
        title: "Status Logs",
        rows: statusLogs,
        columns: [
          { key: "timestamp", label: "Timestamp" },
          { key: "shop_id", label: "Shop" },
          { key: "item", label: "Item" },
          {
            key: "state",
            label: "State",
            render: (v) => <StatusBadge value={v} />,
          },
          { key: "reason", label: "Reason" },
          {
            key: "locked",
            label: "Locked",
            render: (v) => <StatusBadge value={v ? "yes" : "no"} />,
          },
          {
            key: "servo_open",
            label: "Servo Open",
            render: (v) => <StatusBadge value={v ? "yes" : "no"} />,
          },
        ],
      },
    }),
    [weightLogs, rfidLogs, envLogs, statusLogs]
  );

  const current = logMap[selectedLog];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Logs Page"
        subtitle="Browse weight, RFID, environmental, and status records."
      />

      <div className="flex flex-wrap gap-2">
        {Object.keys(logMap).map((key) => (
          <button
            key={key}
            onClick={() => setSelectedLog(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedLog === key
                ? "bg-[linear-gradient(135deg,#7c5cd6,#9f7aea)] text-white shadow-md"
                : "bg-white/70 text-slate-700 border border-white/60"
            }`}
          >
            {logMap[key].title}
          </button>
        ))}
      </div>

      <DataTable rows={current.rows} columns={current.columns} />
    </div>
  );
}