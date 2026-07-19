// src/components/export/ExportReviewTable.jsx
// Tách từ ExportPage.jsx (dòng 460-621 bản gốc trước Phase 3) — KHÔNG đổi JSX.
import Icon from "../ui/Icon";
import { Btn } from "../ui";
import { fmtDate, fmtNum, fmtCur } from "../../utils/helpers";
import { bookstoreName } from "../../constants";
import { downloadExportTemplate } from "../../utils/exportPickSlip";

export default function ExportReviewTable({ review, fileRef }) {
    const { rows, exportDate, phase, setPhase, setRows, handleFile, updateQty, createAndPrint, warnCount, validCount } = review;

    return (
        <>
            {/* ── Header ──────────────────────────────── */}
            <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                    <h2 className="m-0 text-lg font-extrabold text-heading">Xuất kho</h2>
                    <p className="m-0 mt-1 text-[13px] text-subtle">
                        Tải file Excel → Xem trước → In phiếu tìm hàng → Soạn hàng → Xác nhận xuất kho
                    </p>
                </div>
                <div className="flex gap-2">
                    {phase === "review" && (
                        <Btn onClick={() => { setPhase("idle"); setRows([]); }} color="#334155" outline>
                            <Icon name="close" size={15} /> Hủy
                        </Btn>
                    )}
                </div>
            </div>

            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />

            {/* ── Idle ────────────────────────────────── */}
            {phase === "idle" && (
                <div className="card border-2 border-dashed border-muted rounded-2xl p-6 md:p-12 text-center">
                    <div className="w-14 h-14 rounded-[14px] bg-export/[0.13] flex items-center justify-center mx-auto mb-4 text-export">
                        <Icon name="upload" size={28} />
                    </div>
                    <div className="text-base font-bold text-heading mb-2">Chọn file Excel phiếu xuất</div>
                    <div className="text-[13px] text-subtle mb-5">
                        Cột yêu cầu: <strong className="text-label">Ngày · Số phiếu xuất · Mã hàng · Tên sản phẩm · Số lượng · Nhà sách</strong>
                    </div>
                    <div className="flex gap-[10px] justify-center flex-wrap">
                        <Btn onClick={() => fileRef.current.click()} color="#f97316" style={{ padding: "11px 26px" }}>
                            <Icon name="upload" size={16} /> Chọn file
                        </Btn>
                        <Btn onClick={downloadExportTemplate} color="#334155" outline style={{ padding: "11px 22px" }}>
                            <Icon name="excel" size={16} /> Tải file mẫu
                        </Btn>
                    </div>
                </div>
            )}

            {/* ── Saving ──────────────────────────────── */}
            {phase === "saving" && (
                <div className="card rounded-xl p-7 text-center">
                    <div className="flex items-center justify-center gap-2 text-export text-sm font-semibold">
                        <span className="w-2 h-2 rounded-full bg-export animate-pulse inline-block" />
                        Đang xử lý...
                    </div>
                    <div className="text-subtle text-xs mt-2">Vui lòng chờ trong giây lát</div>
                </div>
            )}

            {/* ── Review ──────────────────────────────── */}
            {phase === "review" && (
                <div>
                    <div className="bg-border rounded-[10px] px-[18px] py-[14px] mb-4 flex gap-4 flex-wrap items-center">
                        <div className="text-[13px] text-subtle">
                            Ngày: <strong className="text-heading">{fmtDate(exportDate)}</strong>
                        </div>
                        <div className="text-[13px] text-subtle">
                            Hợp lệ: <strong className="text-success">{validCount}</strong>
                            {warnCount > 0 && <span className="text-danger ml-2">/ {warnCount} có vấn đề</span>}
                        </div>
                        <div className="text-[13px] text-subtle">
                            Thành tiền: <strong className="text-export">
                                {fmtCur(rows.filter(r => !r.notFound && r.qtyAvail > 0).reduce((s, r) => s + r.quantity * (r.unitPrice || 0), 0))}
                            </strong>
                        </div>
                        <div className="flex gap-2 ml-auto">
                            <Btn onClick={createAndPrint} color="#6366f1" disabled={validCount === 0} style={{ padding: "10px 18px" }}>
                                <Icon name="print" size={15} /> In phiếu tìm hàng
                            </Btn>
                        </div>
                    </div>

                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-xs min-w-[860px]">
                                <thead>
                                    <tr className="bg-border">
                                        {["#", "Mã phiếu", "Barcode", "Tên sản phẩm", "SL xuất", "Đơn giá", "Thành tiền", "Tồn kho", "Nhà sách", "Vị trí", "Trạng thái"].map(h => (
                                            <th key={h} className={`p-[10px_12px] text-label font-bold text-[10px] tracking-[0.5px] whitespace-nowrap ${["Đơn giá", "Thành tiền"].includes(h) ? "text-right" : "text-left"}`}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, i) => {
                                        const isZero = row.qtyAvail === 0;
                                        const dimmed = isZero || row.notFound;
                                        const rowBg = row.notFound ? "rgba(239,68,68,0.03)" : isZero ? "rgba(71,85,105,0.06)" : i % 2 === 0 ? "transparent" : "#0a101a";
                                        return (
                                            <tr key={i} className={`border-b border-border ${dimmed ? "opacity-50" : ""}`} style={{ background: rowBg }}>
                                                <td className="p-[9px_12px] text-subtle">{i + 1}</td>
                                                <td className="p-[9px_12px] font-mono text-export font-bold">{row.itemRefNo || "—"}</td>
                                                <td className="p-[9px_12px] font-mono font-bold" style={{ color: dimmed ? "#475569" : "#6366f1" }}>{row.barcode}</td>
                                                <td className="p-[9px_12px] max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: dimmed ? "#475569" : "#e2e8f0" }}>
                                                    {row.name || "(không tìm thấy)"}
                                                </td>
                                                <td className="p-[4px_8px]">
                                                    {!row.notFound && row.qtyAvail > 0 ? (
                                                        <>
                                                            <input
                                                                type="number" value={row.quantity} min={1} max={row.qtyAvail}
                                                                onChange={e => updateQty(i, e.target.value)}
                                                                className="rounded-[6px] px-2 py-[5px] text-heading text-xs font-bold text-center outline-none w-[72px]"
                                                                style={{
                                                                    background: row.quantity > row.qtyAvail ? "rgba(239,68,68,0.13)" : "#1e293b",
                                                                    border: `1px solid ${row.quantity > row.qtyAvail ? "#ef4444" : "#334155"}`,
                                                                }}
                                                            />
                                                            {row.quantity !== row.qtyOriginal && (
                                                                <div className="text-[10px] text-warning mt-[2px]">Gốc: {fmtNum(row.qtyOriginal)}</div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-danger font-bold">{fmtNum(row.quantity)}</span>
                                                    )}
                                                </td>
                                                <td className="p-[9px_12px] text-right text-xs" style={{ color: row.unitPrice > 0 ? "#94a3b8" : "#334155" }}>
                                                    {!row.notFound && row.unitPrice > 0 ? fmtCur(row.unitPrice) : "—"}
                                                </td>
                                                <td className="p-[9px_12px] font-bold text-right" style={{ color: (row.unitPrice || 0) > 0 && !row.notFound && row.qtyAvail > 0 ? "#f97316" : "#334155" }}>
                                                    {(row.unitPrice || 0) > 0 && !row.notFound && row.qtyAvail > 0 ? fmtCur(row.quantity * (row.unitPrice || 0)) : "—"}
                                                </td>
                                                <td className="p-[9px_12px] font-bold"
                                                    style={{ color: row.qtyAvail === 0 ? "#ef4444" : row.qtyAvail < row.quantity ? "#f59e0b" : "#10b981" }}>
                                                    {row.notFound ? "—" : fmtNum(row.qtyAvail)}
                                                </td>
                                                <td className="p-[9px_12px] text-label text-xs">{bookstoreName(row.nhaSach)}</td>
                                                <td className="p-[9px_12px]">
                                                    {row.location
                                                        ? <span className="bg-warning/[0.13] text-warning rounded-[6px] px-2 py-[2px] font-mono text-[11px]">{row.location}</span>
                                                        : <span className="text-dim text-[11px]">—</span>}
                                                </td>
                                                <td className="p-[9px_12px]">
                                                    {row.notFound ? (
                                                        <span className="bg-danger/[0.13] text-danger border border-danger/[0.27] rounded-[6px] px-2 py-[2px] text-[10px] font-bold">KHÔNG TÌM THẤY</span>
                                                    ) : isZero ? (
                                                        <span className="bg-muted/50 text-label border border-muted/50 rounded-[6px] px-2 py-[2px] text-[10px] font-bold">HẾT HÀNG</span>
                                                    ) : !row.qtyOk ? (
                                                        <span className="bg-warning/[0.13] text-warning border border-warning/[0.27] rounded-[6px] px-2 py-[2px] text-[10px] font-bold">THIẾU TỒN</span>
                                                    ) : (
                                                        <span className="bg-success/[0.13] text-success border border-success/[0.27] rounded-[6px] px-2 py-[2px] text-[10px] font-bold">SẴN SÀNG</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex gap-5 flex-wrap text-xs text-subtle mt-2">
                        <span>🔴 Đỏ = không tìm thấy mã</span>
                        <span>⬛ Mờ = hết hàng</span>
                        <span>🟡 Vàng = thiếu tồn (có thể điều chỉnh SL)</span>
                        <span>✏ Có thể sửa số lượng, tối đa = tồn kho</span>
                    </div>
                </div>
            )}
        </>
    );
}