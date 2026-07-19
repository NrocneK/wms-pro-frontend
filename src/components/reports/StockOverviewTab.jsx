// src/components/reports/StockOverviewTab.jsx
// Tách từ Reports.jsx (dòng 87-106 bản gốc trước Phase 3) — KHÔNG đổi JSX.
import { fmtNum, fmtCur } from "../../utils/helpers";
import { WAREHOUSES } from "../../constants";

const WH_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

export default function StockOverviewTab({ displayed }) {
    return (
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
    );
}