import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ShopsPage({
  shops,
  selectedShop,
  setSelectedShop,
  shopDetails,
}) {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Shop View"
        subtitle="Inspect current status, latest weight, lock state, and environment for each container."
      />

      <div className="max-w-xs">
        <Select value={selectedShop} onValueChange={setSelectedShop}>
          <SelectTrigger className="rounded-2xl bg-white/70 backdrop-blur-md border-white/60">
            <SelectValue placeholder="Select a shop" />
          </SelectTrigger>
          <SelectContent>
            {shops.map((shop) => (
              <SelectItem key={shop} value={shop}>
                {shop}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {shopDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(shopDetails.items || []).map((entry, index) => (
            <Card key={index} className="glass-card rounded-[28px]">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="capitalize">{entry.item} Container</CardTitle>
                  <StatusBadge value={entry.latest_status?.state || "no status"} />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="soft-box">
                    <p className="soft-label">Latest Weight</p>
                    <p className="soft-value">{entry.latest_weight?.weight_g ?? "—"} g</p>
                  </div>
                  <div className="soft-box">
                    <p className="soft-label">Weight Change</p>
                    <p className="soft-value">{entry.latest_weight?.change_g ?? "—"} g</p>
                  </div>
                  <div className="soft-box">
                    <p className="soft-label">Temperature</p>
                    <p className="soft-value">{entry.latest_environment?.temperature_c ?? "—"} °C</p>
                  </div>
                  <div className="soft-box">
                    <p className="soft-label">Humidity</p>
                    <p className="soft-value">{entry.latest_environment?.humidity_percent ?? "—"} %</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
                  <p><span className="font-medium text-slate-900">Status:</span> {entry.latest_status?.state ?? "—"}</p>
                  <p className="mt-1"><span className="font-medium text-slate-900">Reason:</span> {entry.latest_status?.reason ?? "—"}</p>
                  <p className="mt-1"><span className="font-medium text-slate-900">Lock State:</span> {entry.latest_status?.locked ? "Locked" : "Unlocked"}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}