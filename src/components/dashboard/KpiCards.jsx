// src/components/dashboard/KpiCards.jsx
import Icon from "../ui/Icon";
import { fmtNum, fmtCur } from "../../utils/helpers";
import { WAREHOUSES } from "../../constants";

export default function KpiCards({ overview, onViewAlerts }) {
    const { dashData, totalSKU, totalValue, lowStock, warnStock } = overview;

    const kpis = [
        { label: "Tổng SKU", value: fmtNum(dashData.kpi?.total_skus ?? totalSKU), sub: `${dashData.kpi?.total_warehouses ?? WAREHOUSES.length} kho`, icon: "inventory", c: "#6366f1" },
        { label: "Giá trị tồn", value: fmtCur(dashData.kpi?.total_stock_value ?? totalValue), sub: "Toàn hệ thống", icon: "warehouse", c: "#10b981" },
        { label: "Cảnh báo", value: fmtNum(lowStock), sub: `+${warnStock} sắp hết`, icon: "alert", c: "#ef4444", onClick: onViewAlerts },
    ];

    return (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
            {kpis.map((k, i) => (
                <div
                    key={i}
                    onClick={k.onClick}
                    className={`card card-hover p-4 md:p-[22px] relative overflow-hidden ${k.onClick ? "cursor-pointer" : "cursor-default"}`}
                    title={k.onClick ? "Xem danh sách sản phẩm cần xử lý" : undefined}
                >
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-[10px] flex items-center justify-center"
                        style={{ background: k.c + "22", color: k.c }}>
                        <Icon name={k.icon} size={20} />
                    </div>
                    <div className="text-[10px] font-semibold text-subtle tracking-[1.5px] mb-3 uppercase">{k.label}</div>
                    <div className="text-[22px] font-extrabold text-heading leading-none mb-1">{k.value}</div>
                    <div className="text-xs text-subtle mt-1">{k.sub}</div>
                    <div className="absolute bottom-0 left-0 right-0 h-[3px]"
                        style={{ background: `linear-gradient(90deg,${k.c},transparent)` }} />
                </div>
            ))}
        </div>
    );
}