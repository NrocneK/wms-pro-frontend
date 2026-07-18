// src/pages/Dashboard.jsx
import { today } from "../utils/helpers";
import { useDashboardOverview } from "../hooks/useDashboardOverview";
import { useTransactionHistory } from "../hooks/useTransactionHistory";
import KpiCards from "../components/dashboard/KpiCards";
import ActivityChart from "../components/dashboard/ActivityChart";
import WarehouseDistribution from "../components/dashboard/WarehouseDistribution";
import TransactionHistory from "../components/dashboard/TransactionHistory";

export default function Dashboard({ products, onViewAlerts }) {
  const todayStr = today();
  const overview = useDashboardOverview(products);
  const history = useTransactionHistory();

  return (
    <div className="space-y-4">
      <KpiCards overview={overview} onViewAlerts={onViewAlerts} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <ActivityChart overview={overview} todayStr={todayStr} />
        <WarehouseDistribution overview={overview} />
      </div>

      <TransactionHistory history={history} todayStr={todayStr} />
    </div>
  );
}