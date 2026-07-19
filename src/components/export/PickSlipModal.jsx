// src/components/export/PickSlipModal.jsx
// Tách từ ExportPage.jsx (dòng 104-179 bản gốc) — KHÔNG đổi logic/JSX.
import { useState } from "react";
import Icon from "../ui/Icon";
import { Btn, Modal } from "../ui";
import { fmtNum } from "../../utils/helpers";
import { downloadPickSlipExcel, downloadPickSlipPDF } from "../../utils/exportPickSlip";

export default function PickSlipModal({ slip, onClose }) {
    const [dl, setDl] = useState(null);

    return (
        <Modal title="Phiếu tìm hàng" onClose={onClose} width={860}>
            <div className="border-2 border-dashed border-muted rounded-xl p-6 mb-5">
                <div className="text-center mb-[18px]">
                    <div className="text-[11px] text-subtle tracking-[3px] font-mono">PHIẾU TÌM HÀNG / PICK SLIP</div>
                    <div className="text-xl font-black text-heading mt-[6px]">PHIẾU TÌM HÀNG</div>
                    <div className="text-sm text-primary-light font-bold mt-1">Kho: {slip.warehouse}</div>
                    <div className="text-[13px] text-subtle mt-1">
                        Ngày: {slip.date} · {slip.items.length} dòng hàng
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs table-fixed">
                        <colgroup>
                            <col style={{ width: "5%" }} />
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "8%" }} />
                            <col style={{ width: "13%" }} />
                            <col style={{ width: "32%" }} />
                            <col style={{ width: "8%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "12%" }} />
                        </colgroup>
                        <thead>
                            <tr className="bg-primary">
                                {["STT", "Số phiếu xuất", "Nhà sách", "Mã hàng", "Tên sản phẩm", "Số lượng", "Vị trí", "Ghi chú"].map(h => (
                                    <th key={h} className="p-[10px_12px] text-white text-left font-bold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {slip.items.map((r, i) => (
                                <tr key={i} className={`border-b border-app ${i % 2 === 0 ? "" : "bg-border"}`}>
                                    <td className="p-[10px_12px] text-subtle">{i + 1}</td>
                                    <td className="p-[10px_12px] font-mono text-export font-bold">{r.itemRefNo}</td>
                                    <td className="p-[10px_12px] text-label text-xs">{r.nhaSach || "—"}</td>
                                    <td className="p-[10px_12px] font-mono text-primary font-bold">{r.barcode}</td>
                                    <td className="p-[10px_12px] text-body max-w-[200px]">{r.name}</td>
                                    <td className="p-[10px_12px] text-success font-extrabold text-center">{fmtNum(r.quantity)}</td>
                                    <td className="p-[10px_12px]">
                                        {r.location
                                            ? <span className="bg-warning/[0.13] text-warning rounded-[6px] px-2 py-[2px] font-mono text-[11px]">{r.location}</span>
                                            : <span className="text-danger text-[11px]">Chưa có</span>}
                                    </td>
                                    <td className="p-[10px_12px] text-subtle text-[11px]">{r.note || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-3 pt-[10px] border-t border-dashed border-muted flex justify-between text-[11px] text-subtle font-mono">
                    <span>✦ Đã sắp xếp theo số phiếu xuất</span>
                    <span>Người lấy hàng: _______________ Ký tên: _______________</span>
                </div>
            </div>

            <div className="flex gap-[10px] justify-center flex-wrap">
                <Btn onClick={() => downloadPickSlipExcel(slip)} color="#10b981" style={{ padding: "11px 22px" }}>
                    <Icon name="excel" size={16} /> Tải Excel
                </Btn>
                <Btn
                    onClick={async () => { setDl("pdf"); try { await downloadPickSlipPDF(slip); } finally { setDl(null); } }}
                    color="#ef4444" style={{ padding: "11px 22px" }} disabled={dl === "pdf"}
                >
                    <Icon name="pdf" size={16} /> {dl === "pdf" ? "Đang tạo..." : "Tải PDF"}
                </Btn>
                <Btn onClick={onClose} color="#334155" outline style={{ padding: "11px 22px" }}>Đóng</Btn>
            </div>
        </Modal>
    );
}