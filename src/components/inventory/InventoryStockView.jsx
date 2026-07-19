// src/components/inventory/InventoryStockView.jsx
import Icon from "../ui/Icon";
import { Btn, Pagination } from "../ui";
import { fmtNum, fmtCur } from "../../utils/helpers";
import { SORT_LABELS } from "../../hooks/useInventoryList";

export default function InventoryStockView({ list, canEdit, onEdit }) {
    const {
        paged, apiTotal, apiLoading, totalPages, page, setPage,
        sortBy, sortDir, handleSort, selectedIds, setSelectedIds,
        handleDelete, handleBulkDelete,
    } = list;

    return (
        <>
            {/* ── Counter ─────────────────────────────── */}
            <div className="text-xs text-subtle mb-[10px] flex items-center gap-[10px]">
                Hiển thị {paged.length} / {apiTotal} sản phẩm
                {apiLoading && <span className="text-primary">Đang tải...</span>}
            </div>

            {/* ── Bulk action bar ──────────────────────── */}
            {selectedIds.size > 0 && canEdit && (
                <div className="flex items-center justify-between flex-wrap gap-2 bg-primary/[0.13] border border-primary/[0.27] rounded-[10px] px-4 py-[10px] mb-[10px]">
                    <span className="text-[13px] text-primary-light font-semibold">
                        Đã chọn <strong className="text-heading">{selectedIds.size}</strong> sản phẩm
                    </span>
                    <div className="flex gap-2">
                        <Btn onClick={() => setSelectedIds(new Set())} color="#334155" outline style={{ padding: "6px 14px", fontSize: 12 }}>
                            Bỏ chọn
                        </Btn>
                        <Btn onClick={handleBulkDelete} color="#ef4444" style={{ padding: "6px 14px", fontSize: 12 }}>
                            <Icon name="delete" size={13} /> Xóa {selectedIds.size} sản phẩm
                        </Btn>
                    </div>
                </div>
            )}

            {/* ── Table (desktop, từ breakpoint "wide") ── */}
            <div className="card overflow-hidden hidden wide:block">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs min-w-[780px]">
                        <thead>
                            <tr className="bg-border">
                                <th className="p-[10px_8px] w-11 text-center">
                                    {canEdit && (
                                        <input
                                            type="checkbox"
                                            className="accent-primary cursor-pointer w-[15px] h-[15px]"
                                            checked={paged.length > 0 && paged.every(p => selectedIds.has(p.id))}
                                            onChange={e => setSelectedIds(e.target.checked ? new Set(paged.map(p => p.id)) : new Set())}
                                        />
                                    )}
                                </th>
                                {["Barcode", "Tên sản phẩm", "SL tồn", "Vị trí", "Kho", "Giá vốn", "Giá trị tồn kho", ""].map(h => {
                                    const sortKey = SORT_LABELS[h];
                                    const isSorted = sortKey && sortBy === sortKey;
                                    return (
                                        <th
                                            key={h}
                                            onClick={sortKey ? () => handleSort(sortKey) : undefined}
                                            className={`p-[10px_14px] text-label font-bold text-[10px] tracking-[0.5px] whitespace-nowrap ${["Giá vốn", "Giá trị tồn kho"].includes(h) ? "text-right" : "text-left"
                                                } ${sortKey ? "cursor-pointer select-none hover:text-heading transition-colors duration-150" : ""}`}
                                        >
                                            <span className="inline-flex items-center gap-1">
                                                {h}
                                                {isSorted && (
                                                    <Icon name={sortDir === "asc" ? "chevron-up" : "chevron-down"} size={11} className="text-primary" />
                                                )}
                                            </span>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {paged.map((p, i) => {
                                const isZero = p.status === "zero" || p.quantity === 0;
                                const giaVon = Number(p.costPrice || p.cost_price || 0);
                                const giaTriTon = p.quantity * giaVon;
                                const isSelected = selectedIds.has(p.id);
                                return (
                                    <tr
                                        key={p.id}
                                        className={`border-b border-border transition-colors duration-150 ${isSelected ? "bg-primary/[0.08]"
                                            : i % 2 === 0 ? "" : "bg-[#0a101a]"
                                            } ${isZero ? "opacity-[0.45]" : ""}`}
                                    >
                                        <td className="p-[10px_8px] w-11 text-center">
                                            {canEdit && (
                                                <input
                                                    type="checkbox"
                                                    className="accent-primary cursor-pointer w-[15px] h-[15px]"
                                                    checked={isSelected}
                                                    onChange={e => {
                                                        const next = new Set(selectedIds);
                                                        e.target.checked ? next.add(p.id) : next.delete(p.id);
                                                        setSelectedIds(next);
                                                    }}
                                                />
                                            )}
                                        </td>

                                        <td className={`p-[10px_14px] font-mono font-bold text-[12px] ${isZero ? "text-dim" : "text-primary"}`}>
                                            {p.barcode}
                                        </td>

                                        <td className={`p-[10px_14px] font-medium ${isZero ? "text-dim" : "text-body"}`}>
                                            {p.name}
                                        </td>

                                        <td
                                            className="p-[10px_14px] font-extrabold text-sm"
                                            style={{ color: isZero ? "#ef4444" : p.status === "low" ? "#f59e0b" : "#10b981" }}
                                        >
                                            {fmtNum(p.quantity)}
                                        </td>

                                        <td className="p-[10px_14px]">
                                            {p.location
                                                ? <span className="bg-warning/[0.13] border border-warning/[0.27] rounded-[6px] px-[10px] py-[3px] font-mono text-xs text-warning font-semibold">{p.location}</span>
                                                : <span className="text-[11px] text-dim italic">—</span>}
                                        </td>

                                        <td className="p-[10px_14px]">
                                            <span className="bg-primary/[0.13] text-primary-light rounded-[6px] px-2 py-[2px] text-[11px] font-bold">
                                                {p.warehouse}
                                            </span>
                                        </td>

                                        <td className="p-[10px_14px] text-label text-right">
                                            {giaVon > 0 ? fmtCur(giaVon) : <span className="text-muted">—</span>}
                                        </td>

                                        <td className={`p-[10px_14px] text-right font-bold ${giaTriTon > 0 ? "text-success" : "text-muted"}`}>
                                            {giaTriTon > 0 ? fmtCur(giaTriTon) : "—"}
                                        </td>

                                        <td className="p-[10px_14px]">
                                            {canEdit && (
                                                <div className="flex gap-[5px]">
                                                    <button
                                                        onClick={() => onEdit(p)}
                                                        className="bg-border border-none rounded-[6px] text-primary cursor-pointer p-[5px] flex hover:bg-muted transition-colors duration-150"
                                                    >
                                                        <Icon name="edit" size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p.id, p.name)}
                                                        className="bg-border border-none rounded-[6px] text-danger cursor-pointer p-[5px] flex hover:bg-muted transition-colors duration-150"
                                                    >
                                                        <Icon name="delete" size={13} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Danh sách dạng thẻ (mobile, dưới md) ─── */}
            <div className="wide:hidden space-y-3">
                {canEdit && paged.length > 0 && (
                    <label className="flex items-center gap-2 text-xs text-subtle px-1">
                        <input
                            type="checkbox"
                            className="accent-primary cursor-pointer w-[15px] h-[15px]"
                            checked={paged.every(p => selectedIds.has(p.id))}
                            onChange={e => setSelectedIds(e.target.checked ? new Set(paged.map(p => p.id)) : new Set())}
                        />
                        Chọn tất cả trên trang này
                    </label>
                )}

                {paged.map((p) => {
                    const isZero = p.status === "zero" || p.quantity === 0;
                    const giaVon = Number(p.costPrice || p.cost_price || 0);
                    const giaTriTon = p.quantity * giaVon;
                    const isSelected = selectedIds.has(p.id);
                    return (
                        <div
                            key={p.id}
                            className={`card p-4 transition-colors duration-150 ${isSelected ? "border-primary/50 bg-primary/[0.05]" : ""} ${isZero ? "opacity-[0.6]" : ""}`}
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    {canEdit && (
                                        <input
                                            type="checkbox"
                                            className="accent-primary cursor-pointer w-[15px] h-[15px] flex-shrink-0"
                                            checked={isSelected}
                                            onChange={e => {
                                                const next = new Set(selectedIds);
                                                e.target.checked ? next.add(p.id) : next.delete(p.id);
                                                setSelectedIds(next);
                                            }}
                                        />
                                    )}
                                    <span className={`font-mono font-bold text-[13px] truncate ${isZero ? "text-dim" : "text-primary"}`}>
                                        {p.barcode}
                                    </span>
                                </div>
                                <span className="bg-primary/[0.13] text-primary-light rounded-[6px] px-2 py-[2px] text-[11px] font-bold flex-shrink-0">
                                    {p.warehouse}
                                </span>
                            </div>

                            <div className={`text-sm font-medium mb-3 ${isZero ? "text-dim" : "text-body"}`}>
                                {p.name}
                            </div>

                            <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3 pb-3 border-b border-border">
                                <div>
                                    <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">SL tồn</div>
                                    <div className="font-extrabold text-sm" style={{ color: isZero ? "#ef4444" : p.status === "low" ? "#f59e0b" : "#10b981" }}>
                                        {fmtNum(p.quantity)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Vị trí</div>
                                    {p.location
                                        ? <span className="bg-warning/[0.13] border border-warning/[0.27] rounded-[6px] px-2 py-[1px] font-mono text-xs text-warning font-semibold">{p.location}</span>
                                        : <span className="text-xs text-dim italic">—</span>}
                                </div>
                                <div>
                                    <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Giá vốn</div>
                                    <div className="text-label text-sm">{giaVon > 0 ? fmtCur(giaVon) : "—"}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Giá trị tồn</div>
                                    <div className={`font-bold text-sm ${giaTriTon > 0 ? "text-success" : "text-muted"}`}>
                                        {giaTriTon > 0 ? fmtCur(giaTriTon) : "—"}
                                    </div>
                                </div>
                            </div>

                            {canEdit && (
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => onEdit(p)}
                                        className="bg-border border-none rounded-[6px] text-primary cursor-pointer px-3 py-[6px] flex items-center gap-1 text-xs font-semibold hover:bg-muted transition-colors duration-150"
                                    >
                                        <Icon name="edit" size={13} /> Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(p.id, p.name)}
                                        className="bg-border border-none rounded-[6px] text-danger cursor-pointer px-3 py-[6px] flex items-center gap-1 text-xs font-semibold hover:bg-muted transition-colors duration-150"
                                    >
                                        <Icon name="delete" size={13} /> Xóa
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {paged.length === 0 && (
                    <div className="text-center text-muted text-sm py-8">Không có sản phẩm nào</div>
                )}
            </div>

            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        </>
    );
}