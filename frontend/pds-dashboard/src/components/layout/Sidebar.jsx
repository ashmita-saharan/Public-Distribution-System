import {
  LayoutDashboard,
  ShieldCheck,
  Store,
  Users,
  AlertTriangle,
  Database,
  PackageCheck,
} from "lucide-react";

const items = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "admin", label: "Admin", icon: ShieldCheck },
  { key: "distributor", label: "Distributor", icon: Store },
  { key: "consumer", label: "Consumer", icon: Users },
  { key: "risk", label: "Risk Analysis", icon: AlertTriangle },
  { key: "logs", label: "Logs", icon: Database },
];

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="w-full lg:w-[290px] shrink-0">
      <div className="rounded-[34px] border border-white/40 bg-white/55 p-5 backdrop-blur-l shadow-[0_20px_50px_rgba(170,150,210,0.18)] sticky top-6">
        <div className="pds-sidebar-card rounded-[28px] p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute right-6 bottom-5 rounded-2xl bg-white/10 p-3">
            <PackageCheck className="h-7 w-7 text-white" />
          </div>

          <p className="text-xs tracking-[0.24em] uppercase text-violet-100">
            True PDS Monitor
          </p>

          <h2 className="mt-3 text-3xl font-semibold leading-tight">
            Smart Public Food Distribution System
          </h2>

          <p className="mt-4 text-sm text-violet-100/90 leading-6 max-w-[190px]">
            Transparent ration monitoring for authorities, distributors, and citizens.
          </p>
        </div>

        <nav className="mt-6 space-y-2">
          {items.map(({ key, label, icon: Icon }) => {
            const active = page === key;

            return (
              <button
                key={key}
                onClick={() => setPage(key)}
                className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
                  active
                    ? "pds-sidebar-item-active"
                    : "pds-sidebar-item hover:bg-violet-50/70"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}