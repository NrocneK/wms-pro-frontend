// src/components/export/PackingAccordion.jsx
// "Đang soạn hàng" — 3 cấp. Tách từ ExportPage.jsx (dòng 623-768 bản gốc
// trước Phase 3) — KHÔNG đổi JSX.
import Icon from "../ui/Icon";
import { Btn } from "../ui";
import { fmtDate, fmtNum, fmtCur } from "../../utils/helpers";
import { bookstoreName } from "../../constants";

export default function PackingAccordion({ packing }) {
    const {
        packingBatches, loadingPacking,
        openBatchId, batchTickets, loadingTickets, toggleBatch,
        openTicketKey, ticketItems, loadingItems, toggleTicket,
        savingQty, updateActualQtyLocal, saveActualQty,
        reprinting, confirmBatch, cancelBatchAction, reprintBatch,
    } = packing;

    return (
        <div className="card overflow-hidden">
            <div className="flex justify-between items-center px-[18px] py-[14px] border-b border-border">
                <h3 className="m-0 text-sm font-bold text-heading">Đang soạn hàng</h3>
                <span className="text-xs text-subtle">{packingBatches.length} phiếu soạn</span>
            </div>

            {loadingPacking ? (
                <div className="py-8 text-center text-subtle text-sm">Đang tải...</div>
            ) : packingBatches.length === 0 ? (
                <div className="py-8 text-center text-muted text-sm">Không có phiếu nào đang soạn hàng</div>
            ) : (
                <div>
                    {packingBatches.map(batch => {
                        const isOpen = openBatchId === batch.id;
                        const tickets = batchTickets[batch.id];
                        return (
                            <div key={batch.id} className="border-b border-border last:border-b-0">
                                {/* ── Cấp 1: Phiếu soạn ── */}
                                <button
                                    onClick={() => toggleBatch(batch.id)}
                                    className="w-full flex items-center justify-between px-[18px] py-[13px] hover:bg-white/[0.02] transition-colors duration-150 text-left cursor-pointer flex-wrap gap-2"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] text-subtle transition-transform duration-200 inline-block ${isOpen ? "rotate-90" : ""}`}>▸</span>
                                        <span className="text-heading font-semibold text-sm">{fmtDate(batch.export_date)}</span>
                                        <span className="bg-primary/[0.13] text-primary-light rounded-[6px] px-2 py-[2px] text-[11px] font-bold">
                                            {batch.warehouse_code}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-export font-semibold">{batch.ticket_count} phiếu xuất</span>
                                        <span className="text-primary-light font-semibold">{batch.sku_count} tựa</span>
                                        <span className="text-success font-bold">{fmtCur(batch.total_value)}</span>
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="border-t border-border bg-black/20 px-[18px] py-4">
                                        {loadingTickets === batch.id ? (
                                            <div className="text-center text-subtle text-xs py-4">Đang tải...</div>
                                        ) : (
                                            <>
                                                {/* ── Cấp 2: Phiếu xuất con ── */}
                                                <div className="space-y-2 mb-4">
                                                    {(tickets || []).map(ticket => {
                                                        const tKey = `${batch.id}-${ticket.ref_no}`;
                                                        const isTOpen = openTicketKey === tKey;
                                                        const items = ticketItems[tKey];
                                                        return (
                                                            <div key={ticket.ref_no} className="border border-border rounded-lg overflow-hidden">
                                                                <button
                                                                    onClick={() => toggleTicket(batch.id, ticket.ref_no)}
                                                                    className="w-full flex items-center justify-between px-[14px] py-[10px] bg-card hover:bg-white/[0.02] transition-colors duration-150 text-left cursor-pointer flex-wrap gap-2"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-[9px] text-dim transition-transform duration-200 inline-block ${isTOpen ? "rotate-90" : ""}`}>▸</span>
                                                                        <span className="font-mono text-export font-bold text-[13px]">{ticket.ref_no}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-xs">
                                                                        <span className="text-label">{bookstoreName(ticket.bookstore)}</span>
                                                                        <span className="text-primary-light font-semibold">{ticket.sku_count} tựa</span>
                                                                        <span className="text-success font-bold">{fmtCur(ticket.total_value)}</span>
                                                                    </div>
                                                                </button>

                                                                {/* ── Cấp 3: Chi tiết sản phẩm ── */}
                                                                {isTOpen && (
                                                                    <div className="border-t border-border bg-app/60 px-[14px] py-3">
                                                                        {loadingItems === tKey ? (
                                                                            <div className="text-center text-subtle text-xs py-3">Đang tải sản phẩm...</div>
                                                                        ) : (
                                                                            <div className="overflow-x-auto">
                                                                                <table className="w-full border-collapse text-xs">
                                                                                    <thead>
                                                                                        <tr>
                                                                                            {["Barcode", "Tên sản phẩm", "SL yêu cầu", "SL thực tế", "Vị trí"].map(h => (
                                                                                                <th key={h} className="p-[6px_8px] text-dim font-semibold text-[10px] text-left whitespace-nowrap">{h}</th>
                                                                                            ))}
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {(items || []).map(it => (
                                                                                            <tr key={it.id} className="border-t border-border/30">
                                                                                                <td className="p-[6px_8px] font-mono text-primary font-bold">{it.barcode}</td>
                                                                                                <td className="p-[6px_8px] text-body">{it.product_name}</td>
                                                                                                <td className="p-[6px_8px] text-subtle">{fmtNum(it.quantity_requested)}</td>
                                                                                                <td className="p-[4px_6px]">
                                                                                                    <input
                                                                                                        type="number" min={0} defaultValue={it.quantity}
                                                                                                        onChange={e => updateActualQtyLocal(tKey, it.id, e.target.value)}
                                                                                                        onBlur={e => saveActualQty(it.id, e.target.value)}
                                                                                                        className="bg-border border border-muted rounded-[6px] px-2 py-[4px] text-heading text-xs font-bold text-center outline-none w-[64px] focus:border-primary"
                                                                                                    />
                                                                                                    {savingQty === it.id && <span className="text-[10px] text-dim ml-1">lưu...</span>}
                                                                                                </td>
                                                                                                <td className="p-[6px_8px]">
                                                                                                    {it.location_text
                                                                                                        ? <span className="bg-warning/[0.13] text-warning rounded-[6px] px-2 py-[1px] font-mono text-[11px]">{it.location_text}</span>
                                                                                                        : <span className="text-dim text-[11px]">—</span>}
                                                                                                </td>
                                                                                            </tr>
                                                                                        ))}
                                                                                        {(items || []).length === 0 && (
                                                                                            <tr><td colSpan={5} className="p-3 text-center text-muted">Không có dữ liệu</td></tr>
                                                                                        )}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {(tickets || []).length === 0 && (
                                                        <div className="text-center text-muted text-xs py-3">Không có phiếu xuất nào</div>
                                                    )}
                                                </div>

                                                {/* Hành động áp dụng cho CẢ phiếu soạn */}
                                                <div className="flex gap-2 justify-end flex-wrap">
                                                    <Btn
                                                        onClick={() => reprintBatch(batch)}
                                                        color="#6366f1" outline style={{ padding: "8px 16px" }}
                                                        disabled={reprinting === batch.id}
                                                    >
                                                        <Icon name="pdf" size={14} /> {reprinting === batch.id ? "Đang tải..." : "Xem/In phiếu"}
                                                    </Btn>
                                                    <Btn onClick={() => cancelBatchAction(batch)} color="#ef4444" outline style={{ padding: "8px 16px" }}>
                                                        <Icon name="close" size={14} /> Hủy phiếu soạn
                                                    </Btn>
                                                    <Btn onClick={() => confirmBatch(batch)} color="#10b981" style={{ padding: "8px 16px" }}>
                                                        <Icon name="check" size={14} /> Xác nhận xuất hàng
                                                    </Btn>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}