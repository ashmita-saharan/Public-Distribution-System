const API_BASE = "http://127.0.0.1:8000";

async function fetchJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.json();
}

export const api = {
  getOverview: () => fetchJSON("/overview"),
  getShops: () => fetchJSON("/shops"),
  getAlerts: (limit = 50) => fetchJSON(`/alerts?limit=${limit}`),
  getWeightLogs: (limit = 50) => fetchJSON(`/logs/weight?limit=${limit}`),
  getRfidLogs: (limit = 50) => fetchJSON(`/logs/rfid?limit=${limit}`),
  getEnvironmentLogs: (limit = 50) => fetchJSON(`/logs/environment?limit=${limit}`),
  getStatusLogs: (limit = 50) => fetchJSON(`/logs/status?limit=${limit}`),

  getAdminSummary: () => fetchJSON("/admin/summary"),
  getRiskAnalysis: () => fetchJSON("/admin/risk-analysis"),
  getDistributorSummary: (shopId) => fetchJSON(`/distributor/${shopId}/summary`),
  getConsumerShops: () => fetchJSON("/consumer/shops"),
  getConsumerAvailability: (shopId) =>
    fetchJSON(`/consumer/shops/${shopId}/availability`),
};