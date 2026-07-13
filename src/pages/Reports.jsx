// src/pages/Reports.jsx
import { useState, useMemo, useEffect } from "react";
import Icon from "../components/ui/Icon";
import { fmtNum, fmtCur, fmtDate, applyZeroReclaim } from "../utils/helpers";
import { WAREHOUSES } from "../constants";
import { inventoryApi, auditApi } from "../api/client";
import { bookstoreName } from "../constants";

const ROLE_LABELS = { admin: "Admin", manager: "Quản lý", staff: "Nhân viên" };
const ROLE_COLORS = { admin: "#ef4444", manager: "#f59e0b", staff: "#6366f1" };
const WH_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];
const ACTION_CONFIG = {
  CREATE: { label: "Tạo mới", color: "#10b981" },
  UPDATE: { label: "Cập nhật", color: "#6366f1" },
  DELETE: { label: "Xóa", color: "#ef4444" },
  CONFIRM: { label: "Xác nhận", color: "#3b82f6" },
  REPLACE: { label: "Thay thế", color: "#f59e0b" },
};

export default function Reports({ products, transactions, defaultTab = null }) {
  const [tab, setTab] = useState(defaultTab || "stock");
  const [userActivity, setUserActivity] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const displayed = useMemo(() => applyZeroReclaim(products), [products]);
  const lowItems = displayed
    .filter(p => p.status !== "ok")
    .sort((a, b) => (a.quantity / Math.max(a.minStock, 1)) - (b.quantity / Math.max(b.minStock, 1)));

  useEffect(() => {
    if (tab !== "users") return;
    if (userActivity) return;
    let active = true;
    setLoadingUsers(true);
    inventoryApi.getReportUserActivity()
      .then(data => { if (active) setUserActivity(data); })
      .catch(() => { })
      .finally(() => { if (active) setLoadingUsers(false); });
    return () => { active = false; };
  }, [tab, userActivity]);

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
    { id: "users", label: "Hoạt động" },
    { id: "audit", label: "Nhật ký" },
  ];

  /* ── shared table header style ── */
  const TH = "text-left p-[10px_12px] text-subtle font-semibold text-[11px] whitespace-nowrap";

  return (
    <div className="space-y-5">

      {/* Tab bar */}
      <div className="flex gap-1 bg-card border border-border rounded-[10px] p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`border-none rounded-[7px] px-4 py-[7px] cursor-pointer text-[13px] transition-all duration-150
              ${tab === t.id ? "bg-primary text-white font-bold" : "bg-transparent text-subtle font-medium hover:text-label"}`}>
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

      {/* ── Hoạt động người dùng ───────────────── */}
      {tab === "users" && (
        <div className="space-y-5">
          {loadingUsers && <div className="text-center py-8 text-subtle text-sm">Đang tải...</div>}
          {!loadingUsers && userActivity && (
            <>
              {/* User cards */}
              <div className="grid gap-[14px]" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
                {userActivity.summary.map(u => {
                  const isSel = selectedUser?.user_id === u.user_id;
                  return (
                    <div key={u.user_id} onClick={() => setSelectedUser(isSel ? null : u)}
                      className="bg-card rounded-[14px] p-[18px_20px] cursor-pointer transition-all duration-200"
                      style={{ border: `1px solid ${isSel ? ROLE_COLORS[u.role] : "#1e293b"}` }}>
                      <div className="flex justify-between items-start mb-[14px]">
                        <div>
                          <div className="text-[15px] font-extrabold text-heading">{u.full_name}</div>
                          <div className="text-xs text-subtle font-mono mt-[2px]">@{u.username}</div>
                        </div>
                        <span className="rounded-[6px] px-[10px] py-[2px] text-[11px] font-bold"
                          style={{ background: ROLE_COLORS[u.role] + "22", color: ROLE_COLORS[u.role], border: `1px solid ${ROLE_COLORS[u.role]}44` }}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-[10px] mb-3">
                        <div className="bg-info/[0.07] rounded-lg p-[10px_12px]">
                          <div className="text-[11px] text-subtle mb-[3px]">Phiếu nhập</div>
                          <div className="text-xl font-extrabold text-info">{fmtNum(u.import_orders)}</div>
                          <div className="text-[11px] text-info/60">{fmtNum(u.import_items)} SP</div>
                        </div>
                        <div className="bg-export/[0.07] rounded-lg p-[10px_12px]">
                          <div className="text-[11px] text-subtle mb-[3px]">Phiếu xuất</div>
                          <div className="text-xl font-extrabold text-export">{fmtNum(u.export_orders)}</div>
                          <div className="text-[11px] text-export/60">{fmtNum(u.export_items)} SP</div>
                        </div>
                      </div>
                      <div className="flex justify-between text-[11px] text-dim">
                        <span>Hoạt động gần nhất</span>
                        <span style={{ color: u.last_activity > "1970" ? "#94a3b8" : "#334155" }}>
                          {u.last_activity && u.last_activity > "1970-01-01" ? fmtDate(u.last_activity) : "Chưa có"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chi tiết user được chọn */}
              {selectedUser && (
                <div className="card overflow-hidden" style={{ border: `1px solid ${ROLE_COLORS[selectedUser.role]}44` }}>
                  <div className="flex justify-between items-center px-[18px] py-[14px] border-b border-border">
                    <h3 className="m-0 text-sm font-bold text-heading">Chi tiết hoạt động — {selectedUser.full_name}</h3>
                    <button onClick={() => setSelectedUser(null)}
                      className="bg-border border-none rounded-[7px] text-subtle cursor-pointer px-3 py-1 text-xs hover:text-label transition-colors">
                      Đóng
                    </button>
                  </div>

                  <div className="overflow-x-auto hidden wide:block">
                    <table className="w-full border-collapse text-xs">
                      <thead><tr className="bg-border">
                        {["Loại", "Mã phiếu", "Ngày", "Đối tác", "Số SP", "Kho", "Xác nhận"].map(h => (
                          <th key={h} className="p-[9px_12px] text-label font-bold text-[10px] text-left whitespace-nowrap">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {userActivity.recent.filter(r => r.username === selectedUser.username).map((r, i) => (
                          <tr key={i} className={`border-b border-border ${i % 2 === 0 ? "" : "bg-[#0a101a]"}`}>
                            <td className="p-[9px_12px]">
                              <span className="rounded-[6px] px-2 py-[2px] text-[10px] font-bold"
                                style={{ background: r.type === "import" ? "#3b82f622" : "#f9731622", color: r.type === "import" ? "#3b82f6" : "#f97316", border: `1px solid ${r.type === "import" ? "#3b82f644" : "#f9731644"}` }}>
                                {r.type === "import" ? "↓ Nhập" : "↑ Xuất"}
                              </span>
                            </td>
                            <td className="p-[9px_12px] font-mono font-bold" style={{ color: r.type === "import" ? "#3b82f6" : "#f97316" }}>{r.ref_no}</td>
                            <td className="p-[9px_12px] text-body">{fmtDate(r.txn_date)}</td>
                            <td className="p-[9px_12px] text-label max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">{bookstoreName(r.partner) || "—"}</td>
                            <td className="p-[9px_12px] font-bold" style={{ color: r.type === "import" ? "#3b82f6" : "#f97316" }}>{fmtNum(r.total_items)}</td>
                            <td className="p-[9px_12px] text-subtle text-[11px]">{r.warehouse_name}</td>
                            <td className="p-[9px_12px] text-subtle text-[11px]">{r.confirmed_at ? fmtDate(r.confirmed_at) : "—"}</td>
                          </tr>
                        ))}
                        {userActivity.recent.filter(r => r.username === selectedUser.username).length === 0 && (
                          <tr><td colSpan={7} className="py-5 text-center text-muted">Chưa có dữ liệu</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="wide:hidden p-4 space-y-3">
                    {userActivity.recent.filter(r => r.username === selectedUser.username).map((r, i) => (
                      <div key={i} className="card p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="rounded-[6px] px-2 py-[2px] text-[10px] font-bold"
                            style={{ background: r.type === "import" ? "#3b82f622" : "#f9731622", color: r.type === "import" ? "#3b82f6" : "#f97316", border: `1px solid ${r.type === "import" ? "#3b82f644" : "#f9731644"}` }}>
                            {r.type === "import" ? "↓ Nhập" : "↑ Xuất"}
                          </span>
                          <span className="font-mono font-bold text-[13px]" style={{ color: r.type === "import" ? "#3b82f6" : "#f97316" }}>{r.ref_no}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                          <div>
                            <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Ngày</div>
                            <div className="text-body">{fmtDate(r.txn_date)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Số SP</div>
                            <div className="font-bold" style={{ color: r.type === "import" ? "#3b82f6" : "#f97316" }}>{fmtNum(r.total_items)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Nhà sách</div>
                            <div className="text-label text-xs">{bookstoreName(r.partner) || "—"}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Kho</div>
                            <div className="text-subtle text-xs">{r.warehouse_name}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Xác nhận</div>
                            <div className="text-subtle text-xs">{r.confirmed_at ? fmtDate(r.confirmed_at) : "—"}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {userActivity.recent.filter(r => r.username === selectedUser.username).length === 0 && (
                      <div className="text-center text-muted text-sm py-5">Chưa có dữ liệu</div>
                    )}
                  </div>
                </div>
              )}

              {/* 50 giao dịch gần nhất */}
              <div className="card overflow-hidden">
                <div className="px-[18px] py-[14px] border-b border-border">
                  <h3 className="m-0 text-sm font-bold text-heading">50 giao dịch gần nhất</h3>
                </div>

                <div className="overflow-x-auto hidden wide:block">
                  <table className="w-full border-collapse text-xs">
                    <thead><tr className="bg-border">
                      {["Loại", "Mã phiếu", "Ngày", "Người xử lý", "Vai trò", "Đối tác", "Số SP", "Kho", "Xác nhận"].map(h => (
                        <th key={h} className="p-[9px_12px] text-label font-bold text-[10px] text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {userActivity.recent.map((r, i) => (
                        <tr key={i} className={`border-b border-border ${i % 2 === 0 ? "" : "bg-[#0a101a]"}`}>
                          <td className="p-[9px_12px]">
                            <span className="rounded-[6px] px-2 py-[2px] text-[10px] font-bold"
                              style={{ background: r.type === "import" ? "#3b82f622" : "#f9731622", color: r.type === "import" ? "#3b82f6" : "#f97316", border: `1px solid ${r.type === "import" ? "#3b82f644" : "#f9731644"}` }}>
                              {r.type === "import" ? "↓ Nhập" : "↑ Xuất"}
                            </span>
                          </td>
                          <td className="p-[9px_12px] font-mono font-bold" style={{ color: r.type === "import" ? "#3b82f6" : "#f97316" }}>{r.ref_no}</td>
                          <td className="p-[9px_12px] text-body">{fmtDate(r.txn_date)}</td>
                          <td className="p-[9px_12px]">
                            <div className="font-semibold text-heading text-xs">{r.user_name}</div>
                            <div className="text-subtle text-[10px] font-mono">@{r.username}</div>
                          </td>
                          <td className="p-[9px_12px]">
                            <span className="rounded-[5px] px-[7px] py-[1px] text-[10px] font-bold"
                              style={{ background: ROLE_COLORS[r.user_role] + "22", color: ROLE_COLORS[r.user_role] }}>
                              {ROLE_LABELS[r.user_role] || r.user_role}
                            </span>
                          </td>
                          <td className="p-[9px_12px] text-label max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap">{bookstoreName(r.partner) || "—"}</td>
                          <td className="p-[9px_12px] font-bold" style={{ color: r.type === "import" ? "#3b82f6" : "#f97316" }}>{fmtNum(r.total_items)}</td>
                          <td className="p-[9px_12px] text-subtle text-[11px]">{r.warehouse_name}</td>
                          <td className="p-[9px_12px] text-subtle text-[11px]">{r.confirmed_at ? fmtDate(r.confirmed_at) : "—"}</td>
                        </tr>
                      ))}
                      {userActivity.recent.length === 0 && (
                        <tr><td colSpan={9} className="py-7 text-center text-muted">Chưa có dữ liệu</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="wide:hidden p-4 space-y-3">
                  {userActivity.recent.map((r, i) => (
                    <div key={i} className="card p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="rounded-[6px] px-2 py-[2px] text-[10px] font-bold"
                          style={{ background: r.type === "import" ? "#3b82f622" : "#f9731622", color: r.type === "import" ? "#3b82f6" : "#f97316", border: `1px solid ${r.type === "import" ? "#3b82f644" : "#f9731644"}` }}>
                          {r.type === "import" ? "↓ Nhập" : "↑ Xuất"}
                        </span>
                        <span className="font-mono font-bold text-[13px]" style={{ color: r.type === "import" ? "#3b82f6" : "#f97316" }}>{r.ref_no}</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-heading text-xs">{r.user_name}</div>
                          <div className="text-subtle text-[10px] font-mono">@{r.username}</div>
                        </div>
                        <span className="rounded-[5px] px-[7px] py-[1px] text-[10px] font-bold"
                          style={{ background: ROLE_COLORS[r.user_role] + "22", color: ROLE_COLORS[r.user_role] }}>
                          {ROLE_LABELS[r.user_role] || r.user_role}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                        <div>
                          <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Ngày</div>
                          <div className="text-body">{fmtDate(r.txn_date)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Số SP</div>
                          <div className="font-bold" style={{ color: r.type === "import" ? "#3b82f6" : "#f97316" }}>{fmtNum(r.total_items)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Nhà sách</div>
                          <div className="text-label text-xs">{bookstoreName(r.partner) || "—"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Kho</div>
                          <div className="text-subtle text-xs">{r.warehouse_name}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Xác nhận</div>
                          <div className="text-subtle text-xs">{r.confirmed_at ? fmtDate(r.confirmed_at) : "—"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {userActivity.recent.length === 0 && (
                    <div className="text-center text-muted text-sm py-7">Chưa có dữ liệu</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
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
