import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Sidebar from "@/components/layout/Sidebar";

import OverviewPage from "@/pages/OverviewPage";
import AdminView from "@/pages/AdminView";
import DistributorView from "@/pages/DistributorView";
import ConsumerView from "@/pages/ConsumerView";
import RiskAnalysisPage from "@/pages/RiskAnalysisPage";
import LogsPage from "@/pages/LogsPage";

import { api } from "@/services/api";

export default function App() {
  const [page, setPage] = useState("overview");
  const [selectedLog, setSelectedLog] = useState("weight");

  const [overview, setOverview] = useState(null);
  const [adminSummary, setAdminSummary] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);

  const [shops, setShops] = useState([]);
  const [selectedDistributorShop, setSelectedDistributorShop] = useState("shop01");
  const [distributorSummary, setDistributorSummary] = useState(null);

  const [consumerShops, setConsumerShops] = useState([]);
  const [selectedConsumerShop, setSelectedConsumerShop] = useState("shop01");
  const [consumerAvailability, setConsumerAvailability] = useState(null);

  const [alerts, setAlerts] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [rfidLogs, setRfidLogs] = useState([]);
  const [envLogs, setEnvLogs] = useState([]);
  const [statusLogs, setStatusLogs] = useState([]);

  const [search, setSearch] = useState("");

  const loadAll = async () => {
    const [
      overviewRes,
      shopsRes,
      alertsRes,
      weightRes,
      rfidRes,
      envRes,
      statusRes,
      adminRes,
      riskRes,
      consumerShopRes,
    ] = await Promise.all([
      api.getOverview(),
      api.getShops(),
      api.getAlerts(50),
      api.getWeightLogs(50),
      api.getRfidLogs(50),
      api.getEnvironmentLogs(50),
      api.getStatusLogs(50),
      api.getAdminSummary(),
      api.getRiskAnalysis(),
      api.getConsumerShops(),
    ]);

    setOverview(overviewRes);
    setShops(shopsRes.shops || []);
    setAlerts(alertsRes.alerts || []);
    setWeightLogs(weightRes.weight_logs || []);
    setRfidLogs(rfidRes.rfid_logs || []);
    setEnvLogs(envRes.environment_logs || []);
    setStatusLogs(statusRes.status_logs || []);
    setAdminSummary(adminRes);
    setRiskAnalysis(riskRes);
    setConsumerShops(consumerShopRes.shops || []);

    const firstShop = shopsRes.shops?.[0] || "shop01";
    setSelectedDistributorShop((prev) => prev || firstShop);
    setSelectedConsumerShop((prev) => prev || firstShop);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    async function loadDistributor() {
      if (!selectedDistributorShop) return;
      const res = await api.getDistributorSummary(selectedDistributorShop);
      setDistributorSummary(res);
    }
    loadDistributor();
  }, [selectedDistributorShop]);

  useEffect(() => {
    async function loadConsumer() {
      if (!selectedConsumerShop) return;
      const res = await api.getConsumerAvailability(selectedConsumerShop);
      setConsumerAvailability(res);
    }
    loadConsumer();
  }, [selectedConsumerShop]);

  const filterRows = (rows) => {
    if (!search.trim()) return rows;
    return rows.filter((r) =>
      JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
    );
  };

  const filteredAlerts = useMemo(() => filterRows(alerts), [alerts, search]);
  const filteredWeightLogs = useMemo(() => filterRows(weightLogs), [weightLogs, search]);
  const filteredRfidLogs = useMemo(() => filterRows(rfidLogs), [rfidLogs, search]);
  const filteredEnvLogs = useMemo(() => filterRows(envLogs), [envLogs, search]);
  const filteredStatusLogs = useMemo(() => filterRows(statusLogs), [statusLogs, search]);

  return (
    <AppShell search={search} setSearch={setSearch} onRefresh={loadAll}>
      <Sidebar page={page} setPage={setPage} />

      <main className="flex-1 relative z-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold pds-section-title">
              Smart Public Distribution Monitoring
            </h1>
            <p className="mt-2 text-sm md:text-base pds-subtitle">
              Role-based monitoring for administrators, distributors, and beneficiaries.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search records"
              className="pds-search h-12 w-full sm:w-80 rounded-full px-5 outline-none"
            />
            <button
              onClick={loadAll}
              className="pds-button h-12 rounded-full px-5 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        {page === "overview" && (
          <OverviewPage
            overview={overview}
            alerts={filteredAlerts}
            weightLogs={filteredWeightLogs}
            rfidLogs={filteredRfidLogs}
          />
        )}

        {page === "admin" && (
          <AdminView adminSummary={adminSummary} />
        )}

        {page === "distributor" && (
          <DistributorView
            distributorSummary={distributorSummary}
            shops={shops}
            selectedShop={selectedDistributorShop}
            setSelectedShop={setSelectedDistributorShop}
          />
        )}

        {page === "consumer" && (
          <ConsumerView
            consumerShops={consumerShops}
            selectedConsumerShop={selectedConsumerShop}
            setSelectedConsumerShop={setSelectedConsumerShop}
            consumerAvailability={consumerAvailability}
          />
        )}

        {page === "risk" && (
          <RiskAnalysisPage riskAnalysis={riskAnalysis} />
        )}

        {page === "logs" && (
          <LogsPage
            selectedLog={selectedLog}
            setSelectedLog={setSelectedLog}
            weightLogs={filteredWeightLogs}
            rfidLogs={filteredRfidLogs}
            envLogs={filteredEnvLogs}
            statusLogs={filteredStatusLogs}
          />
        )}
      </main>
    </AppShell>
  );
}