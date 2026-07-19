// src/components/inventory/ExcelPreviewModal.jsx
import Icon from "../ui/Icon";
import { Btn, Modal } from "../ui";
import { fmtNum, fmtCur, fmtCompact } from "../../utils/helpers";

export default function ExcelPreviewModal({ excel, onConfirm }) {
    const { excelPhase, excelPreview, closeExcelModal } = excel;

    if (excelPhase === "replacing") {
        return (
            <Modal title="Đang cập nhật..." onClose={() => { }}>
                <div className="text-center py-5">
                    <div className="text-sm text-primary font-semibold">Đang cập nhật dữ liệu...</div>
                    <div className="text-xs text-subtle mt-2">Vui lòng không đóng tab này</div>
                </div>
            </Modal>
        );
    }

    if (excelPhase !== "previewing" || !excelPreview) return null;

    const duplicates = excelPreview.duplicates || [];
    const hasDuplicates = (excelPreview.duplicate_count || 0) > 0;

    return (
        <Modal title="Xem trước — Import Excel" onClose={closeExcelModal} width={700}>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-[10px] mb-5">
                {[
                    { label: "Tổng SP", value: excelPreview.total_rows, color: "#6366f1" },
                    { label: "Tổng SL", value: fmtNum(excelPreview.total_qty), color: "#10b981" },
                    { label: "Tổng giá trị", value: fmtCompact(excelPreview.total_value || 0), color: "#8b5cf6", title: fmtCur(excelPreview.total_value || 0) },
                    excelPreview.zero_qty > 0 && { label: "SL = 0", value: excelPreview.zero_qty, color: "#f59e0b" },
                    excelPreview.no_location > 0 && { label: "Chưa có vị trí", value: excelPreview.no_location, color: "#ef4444" },
                    hasDuplicates && { label: "Mã trùng", value: excelPreview.duplicate_count, color: "#ef4444" },
                ].filter(Boolean).map((s, i) => (
                    <div key={i} className="bg-border rounded-[10px] p-[12px_10px] text-center">
                        <div
                            className="text-[19px] font-extrabold whitespace-nowrap"
                            style={{ color: s.color }}
                            title={s.title}
                        >
                            {s.value}
                        </div>
                        <div className="text-[11px] text-subtle mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Warning — kho sẽ bị thay thế */}
            <div className="bg-danger/[0.08] border border-danger/[0.27] rounded-[10px] p-[12px_16px] mb-5">
                <div className="text-[13px] font-bold text-danger mb-[6px]">
                    ⚠ Dữ liệu tại các kho sau sẽ bị thay thế hoàn toàn:
                </div>
                <div className="flex gap-2 flex-wrap mb-[6px]">
                    {excelPreview.warehouses?.map(w => (
                        <span key={w} className="bg-danger/[0.13] text-danger border border-danger/[0.27] rounded-[6px] px-3 py-[3px] font-bold text-xs">
                            {w}
                        </span>
                    ))}
                </div>
                <div className="text-xs text-label">
                    Toàn bộ tồn kho cũ tại các kho này sẽ bị xóa và thay bằng dữ liệu từ file Excel.
                </div>
            </div>

            {/* Warning — MỚI: liệt kê mã barcode bị trùng trong file, sẽ chỉ giữ dòng cuối */}
            {hasDuplicates && (
                <div className="bg-warning/[0.08] border border-warning/[0.27] rounded-[10px] p-[12px_16px] mb-5">
                    <div className="text-[13px] font-bold text-warning mb-[6px]">
                        ⚠ Phát hiện {excelPreview.duplicate_count} dòng trùng barcode trong file — chỉ dòng cuối cùng của mỗi mã được giữ lại:
                    </div>
                    <div className="max-h-[160px] overflow-y-auto">
                        <table className="w-full border-collapse text-xs">
                            <thead>
                                <tr>
                                    <th className="text-left p-[4px_8px] text-subtle font-semibold text-[10px]">Barcode</th>
                                    <th className="text-left p-[4px_8px] text-subtle font-semibold text-[10px]">Kho</th>
                                    <th className="text-right p-[4px_8px] text-subtle font-semibold text-[10px]">Số lần lặp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {duplicates.map((d, i) => (
                                    <tr key={i} className="border-t border-warning/[0.15]">
                                        <td className="p-[4px_8px] font-mono text-warning font-bold">{d.barcode}</td>
                                        <td className="p-[4px_8px] text-label">{d.warehouse}</td>
                                        <td className="p-[4px_8px] text-right text-warning font-bold">×{d.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {excelPreview.duplicates_truncated && (
                        <div className="text-[11px] text-dim mt-2 italic">
                            Chỉ hiển thị 50 mã đầu tiên — file có nhiều mã trùng hơn con số này.
                        </div>
                    )}
                </div>
            )}

            {/* Sample table */}
            <div className="text-[11px] font-bold text-subtle mb-2 tracking-[0.5px]">
                XEM TRƯỚC — 5 DÒNG ĐẦU
            </div>
            <div className="card overflow-hidden mb-5">
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="bg-border">
                            {["Barcode", "Tên sản phẩm", "Số lượng", "Vị trí", "Kho", "Giá vốn"].map(h => (
                                <th
                                    key={h}
                                    className={`p-[8px_12px] text-label font-bold text-[10px] ${h === "Giá vốn" ? "text-right" : "text-left"}`}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {excelPreview.sample?.map((r, i) => (
                            <tr key={i} className={`border-b border-border ${i % 2 === 0 ? "" : "bg-surface/50"}`}>
                                <td className="p-[8px_12px] font-mono text-primary font-bold">{r.barcode}</td>
                                <td className="p-[8px_12px] text-body max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{r.name}</td>
                                <td className="p-[8px_12px] text-success font-bold text-center">{fmtNum(r.quantity)}</td>
                                <td className="p-[8px_12px] text-warning font-mono">{r.location || "—"}</td>
                                <td className="p-[8px_12px] text-primary-light font-bold">{r.warehouse}</td>
                                <td className="p-[8px_12px] text-label text-right">{r.cost_price > 0 ? fmtCur(r.cost_price) : "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex gap-[10px] justify-end">
                <Btn onClick={closeExcelModal} color="#334155" outline>Hủy</Btn>
                <Btn onClick={onConfirm} color="#ef4444" style={{ padding: "10px 24px" }}>
                    <Icon name="upload" size={15} /> Xác nhận thay thế {excelPreview.total_rows} sản phẩm
                </Btn>
            </div>
        </Modal>
    );
}