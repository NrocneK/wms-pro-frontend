// src/components/reports/AlertsTab.jsx
// Tách từ Reports.jsx (dòng 108-195 bản gốc trước Phase 3) — KHÔNG đổi JSX.
import { fmtNum } from "../../utils/helpers";

const TH = "text-left p-[10px_12px] text-subtle font-semibold text-[11px] whitespace-nowrap";

export default function AlertsTab({ lowItems }) {
    return (
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
    );
}