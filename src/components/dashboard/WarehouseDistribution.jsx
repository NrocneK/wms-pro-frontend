// src/components/dashboard/WarehouseDistribution.jsx
import { fmtNum } from "../../utils/helpers";

const whColors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

export default function WarehouseDistribution({ overview }) {
    const { byWH, dashData, totalSKU } = overview;

    return (
        <div className="card p-4 md:p-[22px]">
            <h3 className="m-0 mb-4 text-[15px] font-bold text-heading">Phân bổ kho</h3>
            <div className="space-y-[14px]">
                {byWH.map((w, i) => {
                    const pct = Math.round((w.count / Math.max(dashData.kpi?.total_skus ?? totalSKU, 1)) * 100);
                    return (
                        <div key={i}>
                            <div className="flex justify-between items-center mb-[5px]">
                                <span className="text-xs text-label font-semibold">{w.name}</span>
                                <span className="text-xs font-bold" style={{ color: whColors[i] }}>{fmtNum(w.count)} SKU</span>
                            </div>
                            <div className="bg-border rounded-full h-[6px] overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: whColors[i] }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}