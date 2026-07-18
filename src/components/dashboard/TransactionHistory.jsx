// src/components/dashboard/TransactionHistory.jsx
// Lịch sử giao dịch — 4 cấp:
//   Cấp 1: Ngày → Cấp 2: Loại phiếu (Nhập/Xuất) → Cấp 3: Phiếu → Cấp 4: Sản phẩm
import { Fragment } from "react";
import { TypeBadge } from "../ui";
import { fmtDate, fmtNum, fmtCur } from "../../utils/helpers";

const TYPE_LABELS = { import: "Phiếu nhập", export: "Phiếu xuất" };

export default function TransactionHistory({ history, todayStr }) {
    const {
        historyDates, loadingHistory, loadingMoreDates, hasMoreDates, loadMoreDates,
        openDate, loadingOrdersFor, toggleDate,
        openTypeGroup, toggleTypeGroup, groupOrdersByType,
        openOrderKey, itemsByOrder, loadingItemsFor, toggleOrder,
    } = history;

    return (
        <div className="card overflow-hidden">
            <div className="flex justify-between items-center px-4 md:px-[22px] py-4 border-b border-border">
                <h3 className="m-0 text-[15px] font-bold text-heading">Lịch sử giao dịch</h3>
                <span className="text-xs text-subtle">{historyDates.length} ngày{hasMoreDates ? "+" : ""}</span>
            </div>

            {loadingHistory ? (
                <div className="py-8 text-center text-subtle text-sm">Đang tải...</div>
            ) : historyDates.length === 0 ? (
                <div className="py-8 text-center text-muted text-sm">Chưa có dữ liệu lịch sử</div>
            ) : (
                <div>
                    {historyDates.map((dRow) => {
                        const groups = openDate === dRow.date ? groupOrdersByType(dRow.date) : null;

                        return (
                            <div key={dRow.date} className="border-b border-border last:border-b-0">

                                {/* ── Cấp 1: Ngày ─────────────────────────── */}
                                <button
                                    onClick={() => toggleDate(dRow.date)}
                                    className="w-full flex items-center justify-between flex-wrap gap-2 px-4 md:px-[22px] py-[13px] hover:bg-white/[0.02] transition-colors duration-150 text-left cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] text-subtle transition-transform duration-200 inline-block ${openDate === dRow.date ? "rotate-90" : ""}`}>▸</span>
                                        <span className="text-heading font-semibold text-sm">{fmtDate(dRow.date)}</span>
                                        {dRow.date === todayStr && (
                                            <span className="bg-primary/[0.13] text-primary-light text-[10px] font-bold rounded-[5px] px-2 py-[2px]">Hôm nay</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-6 text-xs">
                                        <div className="text-right">
                                            <div className="text-export font-semibold">↑ {dRow.export_count} xuất</div>
                                            <div className="text-export/70 font-mono text-[11px]">{fmtCur(dRow.export_value)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-info font-semibold">↓ {dRow.import_count} nhập</div>
                                            <div className="text-info/70 font-mono text-[11px]">{fmtCur(dRow.import_value)}</div>
                                        </div>
                                    </div>
                                </button>

                                {/* ── Cấp 2 (MỚI): Nhóm theo loại phiếu ───── */}
                                {openDate === dRow.date && (
                                    <div className="border-t border-border bg-black/20">
                                        {loadingOrdersFor === dRow.date ? (
                                            <div className="text-center text-subtle text-xs py-4">Đang tải...</div>
                                        ) : (
                                            ["import", "export"].map((type) => {
                                                const g = groups[type];
                                                const groupKey = `${dRow.date}-${type}`;
                                                const isGroupOpen = openTypeGroup === groupKey;
                                                if (g.count === 0) return null;

                                                return (
                                                    <div key={type} className="border-t border-border/40 first:border-t-0">
                                                        <button
                                                            onClick={() => toggleTypeGroup(dRow.date, type)}
                                                            className="w-full flex items-center justify-between px-4 md:px-[34px] py-[10px] hover:bg-white/[0.02] transition-colors duration-150 text-left cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className={`text-[9px] text-dim inline-block transition-transform duration-200 ${isGroupOpen ? "rotate-90" : ""}`}>▸</span>
                                                                <TypeBadge type={type} />
                                                                <span className="text-label text-xs font-semibold">{TYPE_LABELS[type]}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-xs">
                                                                <span className="text-subtle">{g.count} phiếu</span>
                                                                <span className="font-mono font-bold" style={{ color: type === "import" ? "#3b82f6" : "#f97316" }}>
                                                                    {fmtCur(g.totalValue)}
                                                                </span>
                                                            </div>
                                                        </button>

                                                        {/* ── Cấp 3: Danh sách phiếu trong nhóm ── */}
                                                        {isGroupOpen && (
                                                            <div className="overflow-x-auto pb-2">
                                                                <table className="w-full border-collapse text-xs">
                                                                    <thead>
                                                                        <tr>
                                                                            <th className="w-7" />
                                                                            {["Mã phiếu", "Kho", "Giá trị", "Người xử lý"].map(h => (
                                                                                <th key={h} className="text-left p-[7px_10px] text-subtle font-semibold text-[10px]">{h}</th>
                                                                            ))}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {g.orders.map((o) => {
                                                                            const key = `${o.type}-${o.order_id}-${o.ref_no}`;
                                                                            const isOpenOrder = openOrderKey === key;
                                                                            const items = itemsByOrder[key];
                                                                            return (
                                                                                <Fragment key={key}>
                                                                                    {/* ── Cấp 3 row: 1 phiếu ── */}
                                                                                    <tr
                                                                                        onClick={() => toggleOrder(o)}
                                                                                        className="border-t border-border/50 cursor-pointer hover:bg-white/[0.02] transition-colors duration-150"
                                                                                    >
                                                                                        <td className="p-[7px_10px] text-center">
                                                                                            <span className={`text-[9px] text-dim inline-block transition-transform duration-200 ${isOpenOrder ? "rotate-90" : ""}`}>▸</span>
                                                                                        </td>
                                                                                        <td className="p-[7px_10px] font-mono font-bold" style={{ color: o.type === "import" ? "#3b82f6" : "#f97316" }}>{o.ref_no}</td>
                                                                                        <td className="p-[7px_10px] text-label">{o.warehouse_code}</td>
                                                                                        <td className="p-[7px_10px] font-bold" style={{ color: o.type === "import" ? "#3b82f6" : "#f97316" }}>{fmtCur(o.total_value)}</td>
                                                                                        <td className="p-[7px_10px] text-body">{o.created_by_name || "—"}</td>
                                                                                    </tr>

                                                                                    {/* ── Cấp 4: Danh sách sản phẩm trong phiếu ── */}
                                                                                    {isOpenOrder && (
                                                                                        <tr>
                                                                                            <td colSpan={5} className="p-0">
                                                                                                <div className="bg-app/60 mx-2 mb-2 px-4 py-3 rounded-lg border border-border/50">
                                                                                                    {loadingItemsFor === key ? (
                                                                                                        <div className="text-center text-subtle text-xs py-2">Đang tải sản phẩm...</div>
                                                                                                    ) : (
                                                                                                        <div className="overflow-x-auto">
                                                                                                            <table className="w-full border-collapse text-[11px]">
                                                                                                                <thead>
                                                                                                                    <tr>
                                                                                                                        {["#", "Barcode", "Tên sản phẩm", "SL", ...(o.type === "export" ? ["Nhà sách"] : [])].map(h => (
                                                                                                                            <th key={h} className="text-left p-[5px_8px] text-dim font-semibold">{h}</th>
                                                                                                                        ))}
                                                                                                                    </tr>
                                                                                                                </thead>
                                                                                                                <tbody>
                                                                                                                    {(items || []).map((it, idx) => (
                                                                                                                        <tr key={idx} className="border-t border-border/30">
                                                                                                                            <td className="p-[5px_8px] text-subtle">{idx + 1}</td>
                                                                                                                            <td className="p-[5px_8px] font-mono text-primary">{it.barcode}</td>
                                                                                                                            <td className="p-[5px_8px] text-body">{it.product_name}</td>
                                                                                                                            <td className="p-[5px_8px] text-success font-semibold">{fmtNum(it.quantity)}</td>
                                                                                                                            {o.type === "export" && <td className="p-[5px_8px] text-label">{it.bookstore || "—"}</td>}
                                                                                                                        </tr>
                                                                                                                    ))}
                                                                                                                    {(items || []).length === 0 && (
                                                                                                                        <tr><td colSpan={o.type === "export" ? 5 : 4} className="p-2 text-center text-muted">Không có dữ liệu</td></tr>
                                                                                                                    )}
                                                                                                                </tbody>
                                                                                                            </table>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </td>
                                                                                        </tr>
                                                                                    )}
                                                                                </Fragment>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                        {!loadingOrdersFor && groups.import.count === 0 && groups.export.count === 0 && (
                                            <div className="p-3 text-center text-muted text-xs">Không có dữ liệu</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {hasMoreDates && (
                        <div className="p-3 text-center border-t border-border">
                            <button
                                onClick={loadMoreDates}
                                disabled={loadingMoreDates}
                                className="text-xs text-primary-light font-semibold hover:text-primary transition-colors duration-150 disabled:opacity-50"
                            >
                                {loadingMoreDates ? "Đang tải..." : "Tải thêm ngày ▾"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}