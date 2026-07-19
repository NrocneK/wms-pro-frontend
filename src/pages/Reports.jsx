// src/pages/Reports.jsx
import { useState, useMemo, useLayoutEffect, useRef } from "react";
import { applyZeroReclaim } from "../utils/helpers";
import { useAuditLogs } from "../hooks/useAuditLogs";
import StockOverviewTab from "../components/reports/StockOverviewTab";
import AlertsTab from "../components/reports/AlertsTab";
import AuditLogTab from "../components/reports/AuditLogTab";

export default function Reports({ products, defaultTab = null }) {
  const [tab, setTab] = useState(defaultTab || "stock");
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const displayed = useMemo(() => applyZeroReclaim(products), [products]);
  const lowItems = displayed
    .filter(p => p.status !== "ok")
    .sort((a, b) => (a.quantity / Math.max(a.minStock, 1)) - (b.quantity / Math.max(b.minStock, 1)));

  const { auditLogs, loadingAudit } = useAuditLogs(tab === "audit");

  const tabs = [
    { id: "stock", label: "Tổng quan" },
    { id: "alerts", label: `Cảnh báo · ${lowItems.length}` },
    { id: "audit", label: "Nhật ký" },
  ];

  useLayoutEffect(() => {
    const el = tabRefs.current[tab];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [tab, tabs.length]);

  return (
    <div className="space-y-5">

      {/* Tab bar */}
      <div className="relative flex gap-1 bg-card border border-border rounded-full p-1 w-fit">
        {/* Pill nền trượt mượt phía sau nút — chỉ 1 phần tử duy nhất, di chuyển bằng transform */}
        <div
          className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out pointer-events-none"
          style={{
            left: indicator.left,
            width: indicator.width,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
          }}
        />
        {tabs.map(t => (
          <button
            key={t.id}
            ref={el => { tabRefs.current[t.id] = el; }}
            onClick={() => setTab(t.id)}
            className={`
        relative z-10 border-none rounded-full px-5 py-[9px] bg-transparent cursor-pointer
        text-[13px] transition-colors duration-300 ease-out
        ${tab === t.id ? "text-white font-bold" : "text-subtle font-medium hover:text-label"}
      `}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stock" && <StockOverviewTab displayed={displayed} />}
      {tab === "alerts" && <AlertsTab lowItems={lowItems} />}
      {tab === "audit" && <AuditLogTab auditLogs={auditLogs} loadingAudit={loadingAudit} />}
    </div>
  );
}