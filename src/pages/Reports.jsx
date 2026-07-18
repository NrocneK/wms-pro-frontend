// src/pages/Reports.jsx
import { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { fmtNum, fmtCur, applyZeroReclaim } from "../utils/helpers";
import { WAREHOUSES } from "../constants";
import { auditApi } from "../services/auditService";

const WH_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];
const ACTION_CONFIG = {
  CREATE: { label: "Tạo mới", color: "#10b981" },
  UPDATE: { label: "Cập nhật", color: "#6366f1" },
  DELETE: { label: "Xóa", color: "#ef4444" },
  CONFIRM: { label: "Xác nhận", color: "#3b82f6" },
  REPLACE: { label: "Thay thế", color: "#f59e0b" },
};

export default function Reports({ products, defaultTab = null }) {
  const [tab, setTab] = useState(defaultTab || "stock");
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const displayed = useMemo(() => applyZeroReclaim(products), [products]);
  const lowItems = displayed
    .filter(p => p.status !== "ok")
    .sort((a, b) => (a.quantity / Math.max(a.minStock, 1)) - (b.quantity / Math.max(b.minStock, 1)));

  useEffect(() => {
    if (tab !== "audit") return;
    if (auditLogs.length) return;
    let active = true;
    setLoadingAudit(true);
    auditApi.getAll({ limit: 100 })
      .then(data => { if (active) setAuditLogs(data.items || []); })
      .catch(() => { })
      .finally(() => { if (active) setLoadingAudit(false); });
    return () => { active = false; };
  }, [tab, auditLogs.length]);

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

  /* ── shared table header style ── */
  const TH = "text-left p-[10px_12px] text-subtle font-semibold text-[11px] whitespace-nowrap";

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

      {/* ── Tổng quan ──────────────────────────── */}
      {tab === "stock" && (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))" }}>
          {WAREHOUSES.map((w, i) => {
            const wp = displayed.filter(p => p.warehouse === w);
            const c = WH_COLORS[i];
            return (
              <div key={w} className="bg-card rounded-xl p-[18px]" style={{ border: `1px solid ${c}44` }}>
                <div className="text-xs font-bold mb-[10px]" style={{ color: c }}>{w}</div>
                <div className="text-[22px] font-extrabold text-heading mb-1">{fmtNum(wp.length)} SKU</div>
                <div className="text-[13px] text-subtle">{fmtCur(wp.reduce((s, p) => s + p.quantity * p.costPrice, 0))}</div>
                <div className="flex gap-3 text-xs mt-[6px]">
                  <span className="text-danger">{wp.filter(p => p.status === "low" || p.status === "zero").length} hết/thiếu</span>
                  <span className="text-warning">{wp.filter(p => p.status === "warning").length} sắp hết</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Cảnh báo ───────────────────────────── */}
      {tab === "alerts" && (
        <>
          <div className="card overflow-hidden hidden wide:block">
            <table className="w-full border-collapse text-[13px]">
              <thead><tr className="bg-border">
                {["Barcode", "Tên sản phẩm", "Kho", "Vị trí", "SL tồn", "Tối thiểu", "Trạng thái"].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {lowItems.map((p, i) => (
                  <tr key={p.id} className={`border-b border-border ${i % 2 === 0 ? "" : "bg-[#0a101a]"} ${p.status === "zero" ? "opacity-50" : ""}`}>
                    <td className="p-[9px_12px] text-primary font-mono text-[11px]">{p.barcode}</td>
                    <td className="p-[9px_12px] text-body">{p.name}</td>
                    <td className="p-[9px_12px] text-label text-xs">{p.warehouse}</td>
                    <td className="p-[9px_12px]">
                      {p.location
                        ? <span className="bg-border rounded-[6px] px-2 py-[2px] font-mono text-[11px] text-warning">{p.location}</span>
                        : <span className="text-[11px] text-dim italic">Thu hồi</span>}
                    </td>
                    <td className="p-[9px_12px] font-bold"
                      style={{ color: p.status === "zero" || p.status === "low" ? "#ef4444" : "#f59e0b" }}>
                      {fmtNum(p.quantity)}
                    </td>
                    <td className="p-[9px_12px] text-subtle">{fmtNum(p.minStock)}</td>
                    <td className="p-[9px_12px]">
                      <span className="rounded-[6px] px-[9px] py-[2px] text-[10px] font-bold" style={{
                        background: p.status === "zero" ? "#47556922" : p.status === "low" ? "#ef444422" : "#f59e0b22",
                        color: p.status === "zero" ? "#94a3b8" : p.status === "low" ? "#ef4444" : "#f59e0b",
                        border: `1px solid ${p.status === "zero" ? "#47556944" : p.status === "low" ? "#ef444444" : "#f59e0b44"}`,
                      }}>
                        {p.status === "zero" ? "Hết hàng" : "Sắp hết"}
                      </span>
                    </td>
                  </tr>
                ))}
                {lowItems.length === 0 && (
                  <tr><td colSpan={7} className="py-7 text-center text-muted">
                    Không có cảnh báo — tồn kho đang ổn định 🎉
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="wide:hidden space-y-3">
            {lowItems.map((p) => (
              <div key={p.id} className={`card p-4 ${p.status === "zero" ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono font-bold text-[13px] text-primary truncate">{p.barcode}</span>
                  <span className="rounded-[6px] px-[9px] py-[2px] text-[10px] font-bold flex-shrink-0" style={{
                    background: p.status === "zero" ? "#47556922" : p.status === "low" ? "#ef444422" : "#f59e0b22",
                    color: p.status === "zero" ? "#94a3b8" : p.status === "low" ? "#ef4444" : "#f59e0b",
                    border: `1px solid ${p.status === "zero" ? "#47556944" : p.status === "low" ? "#ef444444" : "#f59e0b44"}`,
                  }}>
                    {p.status === "zero" ? "Hết hàng" : "Sắp hết"}
                  </span>
                </div>
                <div className="text-sm text-body mb-3">{p.name}</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div>
                    <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">SL tồn</div>
                    <div className="font-bold" style={{ color: p.status === "zero" || p.status === "low" ? "#ef4444" : "#f59e0b" }}>{fmtNum(p.quantity)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Tối thiểu</div>
                    <div className="text-subtle">{fmtNum(p.minStock)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Kho</div>
                    <div className="text-label text-xs">{p.warehouse}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Vị trí</div>
                    {p.location
                      ? <span className="bg-border rounded-[6px] px-2 py-[1px] font-mono text-[11px] text-warning">{p.location}</span>
                      : <span className="text-[11px] text-dim italic">Thu hồi</span>}
                  </div>
                </div>
              </div>
            ))}
            {lowItems.length === 0 && (
              <div className="text-center text-muted text-sm py-8">Không có cảnh báo — tồn kho đang ổn định 🎉</div>
            )}
          </div>
        </>
      )}

      {/* ── Nhật ký thao tác ───────────────────── */}
      {tab === "audit" && (
        <>
          <div className="card overflow-hidden hidden wide:block">
            <table className="w-full border-collapse text-xs">
              <thead><tr className="bg-border">
                {["Thời gian", "Người thực hiện", "Hành động", "Đối tượng", "Mô tả"].map(h => (
                  <th key={h} className="text-left p-[10px_12px] text-label font-bold text-[10px] whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loadingAudit ? (
                  <tr><td colSpan={5} className="py-6 text-center text-subtle">Đang tải...</td></tr>
                ) : auditLogs.map((log, i) => {
                  const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: "#94a3b8" };
                  return (
                    <tr key={log.id} className={`border-b border-border ${i % 2 === 0 ? "" : "bg-[#0a101a]"}`}>
                      <td className="p-[9px_12px] text-subtle text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td className="p-[9px_12px]">
                        <div className="text-heading font-semibold text-xs">{log.full_name}</div>
                        <div className="text-subtle text-[10px] font-mono">@{log.username}</div>
                      </td>
                      <td className="p-[9px_12px]">
                        <span className="rounded-[6px] px-2 py-[2px] text-[10px] font-bold"
                          style={{ background: cfg.color + "22", color: cfg.color, border: `1px solid ${cfg.color}44` }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-[9px_12px] text-label text-[11px]">{log.entity}</td>
                      <td className="p-[9px_12px] text-body text-xs">{log.description}</td>
                    </tr>
                  );
                })}
                {!loadingAudit && auditLogs.length === 0 && (
                  <tr><td colSpan={5} className="py-7 text-center text-muted">Chưa có nhật ký nào</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="wide:hidden space-y-3">
            {loadingAudit ? (
              <div className="text-center text-subtle text-sm py-6">Đang tải...</div>
            ) : auditLogs.map((log) => {
              const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: "#94a3b8" };
              return (
                <div key={log.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-heading font-semibold text-sm">{log.full_name}</div>
                      <div className="text-subtle text-[10px] font-mono">@{log.username}</div>
                    </div>
                    <span className="rounded-[6px] px-2 py-[2px] text-[10px] font-bold flex-shrink-0"
                      style={{ background: cfg.color + "22", color: cfg.color, border: `1px solid ${cfg.color}44` }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-subtle mb-2">{new Date(log.created_at).toLocaleString("vi-VN")}</div>
                  <div className="text-xs text-label mb-1">Đối tượng: <span className="text-label font-medium">{log.entity}</span></div>
                  <div className="text-xs text-body">{log.description}</div>
                </div>
              );
            })}
            {!loadingAudit && auditLogs.length === 0 && (
              <div className="text-center text-muted text-sm py-8">Chưa có nhật ký nào</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
