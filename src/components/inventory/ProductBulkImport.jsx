// src/components/inventory/ProductBulkImport.jsx
// Thêm đồng loạt sản phẩm vào Danh Mục Sản Phẩm qua file Excel.
// Cùng pattern với ImportPage.jsx: upload -> backend parse (SheetJS) -> review -> xác nhận.
import { useState, useRef, useEffect } from "react";
import { Btn, Modal } from "../ui";
import Icon from "../ui/Icon";
import { productApi } from "../../services/productService";
import { warehouseApi } from "../../services/warehouseService";
import { downloadProductBulkTemplate } from "../../utils/excelImport";

const STATUS_LABEL = {
    new: { text: "Sản phẩm mới", color: "#22c55e" },
    exists_update: { text: "Đã có", color: "#3b82f6" },
    exists_skip: { text: "Đã có", color: "#94a3b8" },
    error: { text: "Lỗi", color: "#ef4444" },
};

export default function ProductBulkImport({ onClose, onDone, showAlert }) {
    const [phase, setPhase] = useState("idle"); // idle | review | saving | done
    const [items, setItems] = useState([]);
    const [result, setResult] = useState(null);
    const [warehouses, setWarehouses] = useState([]);
    const [warehouseId, setWarehouseId] = useState("");
    const fileRef = useRef();

    useEffect(() => {
        warehouseApi.getAll().then(data => setWarehouses(Array.isArray(data) ? data : data.items || [])).catch(() => { });
    }, []);

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = "";
        setPhase("saving");
        try {
            const data = await productApi.parseExcel(file);
            setItems(data.items || []);
            setPhase("review");
        } catch (err) {
            showAlert("Không đọc được file: " + err.message);
            setPhase("idle");
        }
    };

    const validItems = items.filter(i => i.status === "new" || i.status === "exists_update");
    const newCount = items.filter(i => i.status === "new").length;

    const confirmImport = async () => {
        setPhase("saving");
        try {
            const res = await productApi.bulkImport(items, warehouseId || null);
            setResult(res);
            setPhase("done");
            onDone?.();
        } catch (err) {
            showAlert("Nhập đồng loạt thất bại: " + err.message);
            setPhase("review");
        }
    };

    return (
        <Modal title="Thêm đồng loạt sản phẩm (Excel)" onClose={onClose} width={720}>
            {phase === "idle" && (
                <div className="flex flex-col items-center gap-[14px] py-[20px]">
                    <p className="text-label text-[13px] text-center">
                        Tải file mẫu, điền thông tin sản phẩm rồi tải lên. Sản phẩm đã có trong danh mục
                        sẽ chỉ được bổ sung thông tin còn thiếu (không ghi đè dữ liệu sẵn có, không đụng tồn kho).
                        Sản phẩm mới có thể chọn gán vào 1 kho ở bước xác nhận (tuỳ chọn).
                    </p>
                    <div className="flex gap-[10px]">
                        <Btn onClick={downloadProductBulkTemplate} color="#334155" outline>
                            <Icon name="excel" size={14} /> Tải file mẫu
                        </Btn>
                        <Btn onClick={() => fileRef.current?.click()}>
                            <Icon name="upload" size={14} /> Chọn file Excel
                        </Btn>
                    </div>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
                </div>
            )}

            {phase === "saving" && (
                <div className="py-[30px] text-center text-label">Đang xử lý...</div>
            )}

            {phase === "review" && (
                <>
                    {newCount > 0 && (
                        <div className="flex items-center gap-[10px] mb-[12px] p-[10px_12px] bg-[#0a101a] border border-border rounded-[8px]">
                            <label className="text-label text-[13px] whitespace-nowrap">
                                Gán {newCount} sản phẩm mới vào kho:
                            </label>
                            <select
                                value={warehouseId}
                                onChange={e => setWarehouseId(e.target.value)}
                                className="bg-card border border-border rounded-[6px] text-body text-[13px] px-[10px] py-[6px] flex-1"
                            >
                                <option value="">Không gán kho (chỉ thêm vào danh mục)</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>{w.code} — {w.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="max-h-[400px] overflow-auto border border-border rounded-[8px] mb-[14px]">
                        <table className="w-full border-collapse text-[12px]">
                            <thead>
                                <tr className="bg-border sticky top-0">
                                    {["Dòng", "Barcode", "Tên", "Trạng thái"].map(h => (
                                        <th key={h} className="text-left p-[8px_10px] text-label font-bold text-[10px] whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it, i) => {
                                    const s = STATUS_LABEL[it.status] || STATUS_LABEL.error;
                                    return (
                                        <tr key={i} className="border-b border-border">
                                            <td className="p-[8px_10px] text-subtle">{it.row}</td>
                                            <td className="p-[8px_10px] font-mono">{it.barcode || "—"}</td>
                                            <td className="p-[8px_10px]">{it.name || "—"}</td>
                                            <td className="p-[8px_10px]" style={{ color: s.color }}>
                                                {s.text}{it.error ? ` — ${it.error}` : ""}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-label text-[12px]">
                            {validItems.length}/{items.length} dòng hợp lệ sẽ được nhập
                        </span>
                        <div className="flex gap-[10px]">
                            <Btn onClick={onClose} color="#334155" outline>Hủy</Btn>
                            <Btn onClick={confirmImport} disabled={!validItems.length}>
                                Xác nhận xử lý {validItems.length} dòng
                            </Btn>
                        </div>
                    </div>
                </>
            )}

            {phase === "done" && result && (
                <div className="py-[10px]">
                    <p className="text-body mb-[10px]">Hoàn tất:</p>
                    <ul className="text-[13px] text-label space-y-1 mb-[16px]">
                        <li>✅ {result.created} sản phẩm mới được tạo</li>
                        <li>✏️ {result.updated} sản phẩm được bổ sung thông tin còn thiếu</li>
                        <li>⏭️ {result.skipped} dòng bị bỏ qua (trùng/đã đủ thông tin)</li>
                        <li>❌ {result.failed} dòng lỗi</li>
                    </ul>
                    {result.errors?.length > 0 && (
                        <div className="max-h-[150px] overflow-auto text-[12px] text-red-400 mb-[16px]">
                            {result.errors.map((e, i) => (
                                <div key={i}>Dòng {e.row} ({e.barcode}): {e.message}</div>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-end">
                        <Btn onClick={onClose}>Đóng</Btn>
                    </div>
                </div>
            )}
        </Modal>
    );
}
