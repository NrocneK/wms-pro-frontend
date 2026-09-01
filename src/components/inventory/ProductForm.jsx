// src/components/inventory/ProductForm.jsx
import { useState, lazy, Suspense } from "react";
import { Btn, Field, Inp, Sel, Modal } from "../ui";
import Icon from "../ui/Icon";
import { WAREHOUSES, UNITS } from "../../constants";
import { productApi } from "../../services/productService";

// Lazy-load: thư viện html5-qrcode khá nặng (~100kB+), chỉ tải khi người dùng
// thực sự bấm nút quét camera, tránh làm phình bundle của trang Inventory
// cho mọi người dùng — nhất quán với cách code-splitting theo trang ở App.jsx.
const BarcodeScannerModal = lazy(() => import("./BarcodeScannerModal"));

export default function ProductForm({ initial, onClose, onSave }) {
    const [f, setF] = useState({
        barcode: initial?.barcode || "",
        name: initial?.name || "",
        unit: initial?.unit || UNITS[0],
        quantity: initial?.quantity || 0,
        minStock: initial?.minStock || 5,
        costPrice: initial?.costPrice || 0,
        sellPrice: initial?.sellPrice || 0,
        warehouse: initial?.warehouse || WAREHOUSES[0],
        location: initial?.location || "",
        supplier: initial?.supplier || "",
    });
    const [lookingUp, setLookingUp] = useState(false);
    const [foundInCatalog, setFoundInCatalog] = useState(!!initial);
    const [showScanner, setShowScanner] = useState(false);
    const s = (k, v) => setF(x => ({ ...x, [k]: v }));

    // Tra cứu barcode trong danh mục — tách thành hàm riêng nhận tham số `code`
    // thay vì đọc trực tiếp từ state `f.barcode`, để có thể gọi ngay lập tức
    // sau khi quét (camera) hoặc sau khi máy quét USB "gõ" xong + Enter,
    // mà không phải chờ state cập nhật xong qua re-render.
    const lookupBarcode = async (code) => {
        if (initial || !code.trim()) return;
        setLookingUp(true);
        try {
            const rows = await productApi.getByBarcode(code.trim());
            const product = Array.isArray(rows) ? rows[0] : rows;
            if (product) {
                setF(x => ({
                    ...x,
                    barcode: code.trim(),
                    name: product.name,
                    unit: product.unit || x.unit,
                    costPrice: product.cost_price || x.costPrice,
                    sellPrice: product.sell_price || x.sellPrice,
                }));
                setFoundInCatalog(true);
            } else {
                setFoundInCatalog(false);
            }
        } catch {
            setFoundInCatalog(false);
        } finally {
            setLookingUp(false);
        }
    };

    // Hệ thống lưu barcode 12 số, nhưng mã vạch in trên sản phẩm (sách/ấn phẩm)
    // thường theo chuẩn EAN-13 = 12 số dữ liệu + 1 số kiểm tra (check digit) ở
    // cuối cùng. Khi quét ra đủ 13 số, ta cắt bỏ số cuối để khớp định dạng 12 số
    // của hệ thống. Chỉ áp dụng cho kết quả QUÉT (camera / máy quét USB) —
    // không áp dụng khi gõ tay, vì lúc đó người dùng tự chịu trách nhiệm nhập
    // đúng mã 12 số (ví dụ khi sửa lại một mã bị sai).
    const normalizeScannedBarcode = (code) => {
        const trimmed = code.trim();
        return trimmed.length === 13 ? trimmed.slice(0, -1) : trimmed;
    };

    // Máy quét mã vạch USB hoạt động như bàn phím: gõ toàn bộ ký tự của mã vạch
    // rất nhanh rồi kết thúc bằng phím Enter. Ta chặn Enter để không submit form
    // ngoài ý muốn, và trigger tra cứu ngay (không cần đợi blur ra khỏi ô input).
    const handleBarcodeKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const normalized = normalizeScannedBarcode(f.barcode);
            if (normalized !== f.barcode.trim()) s("barcode", normalized);
            lookupBarcode(normalized);
        }
    };

    // Kết quả từ camera: cắt số check digit (nếu đủ 13 số), điền vào ô barcode
    // rồi tra cứu ngay, đóng modal quét.
    const handleScanDetected = (code) => {
        setShowScanner(false);
        const normalized = normalizeScannedBarcode(code);
        s("barcode", normalized);
        lookupBarcode(normalized);
    };

    return (
        <Modal title={initial ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"} onClose={onClose} width={680}>
            <div className="grid grid-cols-2 gap-x-5">
                <Field label="Barcode" required>
                    <div className="flex gap-[6px]">
                        <Inp
                            value={f.barcode}
                            onChange={e => s("barcode", e.target.value)}
                            onBlur={() => lookupBarcode(f.barcode)}
                            onKeyDown={handleBarcodeKeyDown}
                            placeholder="Quét mã, nhập tay rồi Enter, hoặc bấm ra ngoài để tra cứu..."
                            disabled={!!initial}
                            autoFocus={!initial}
                        />
                        {!initial && (
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                title="Quét bằng camera"
                                className="flex-shrink-0 bg-border border border-muted rounded-lg px-[10px] flex items-center justify-center text-label hover:text-heading hover:border-subtle transition-colors duration-150"
                            >
                                <Icon name="camera" size={16} />
                            </button>
                        )}
                    </div>
                    {lookingUp && <div className="text-[11px] text-primary mt-1">Đang tra cứu danh mục...</div>}
                    {!lookingUp && foundInCatalog && !initial && (
                        <div className="text-[11px] text-success mt-1">✓ Đã tìm thấy trong danh mục — tự động điền thông tin</div>
                    )}
                </Field>
                <Field label="Đơn vị">
                    <Sel value={f.unit} onChange={e => s("unit", e.target.value)}>
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                    </Sel>
                </Field>
                <Field label="Tên sản phẩm" required>
                    <Inp
                        value={f.name}
                        onChange={e => s("name", e.target.value)}
                        placeholder="Nhập tên sản phẩm..."
                        disabled={foundInCatalog && !initial}
                        style={{ opacity: foundInCatalog && !initial ? .6 : 1 }}
                    />
                </Field>
                <Field label="Kho">
                    <Sel value={f.warehouse} onChange={e => s("warehouse", e.target.value)}>
                        {WAREHOUSES.map(w => <option key={w}>{w}</option>)}
                    </Sel>
                </Field>
                <Field label="Số lượng" required>
                    <Inp type="number" value={f.quantity} onChange={e => s("quantity", Number(e.target.value))} min={0} />
                </Field>
                <Field label="Tồn tối thiểu">
                    <Inp type="number" value={f.minStock} onChange={e => s("minStock", Number(e.target.value))} min={0} />
                </Field>
                <Field label="Giá vốn">
                    <Inp type="number" value={f.costPrice} onChange={e => s("costPrice", Number(e.target.value))} min={0} />
                </Field>
                <Field label="Giá bán">
                    <Inp type="number" value={f.sellPrice} onChange={e => s("sellPrice", Number(e.target.value))} min={0} />
                </Field>
            </div>
            <Field label="Vị trí">
                <Inp value={f.location} onChange={e => s("location", e.target.value)} placeholder="Vd: C2.3, E1.4, 1030..." />
            </Field>
            <Field label="Nhà cung cấp">
                <Inp value={f.supplier} onChange={e => s("supplier", e.target.value)} placeholder="Tên hoặc mã NCC..." />
            </Field>
            <div className="flex gap-[10px] justify-end mt-2">
                <Btn onClick={onClose} color="#334155" outline>Hủy</Btn>
                <Btn onClick={() => {
                    if (!f.barcode || !f.name) { alert("Vui lòng nhập Barcode và tên sản phẩm."); return; }
                    onSave(f);
                }}>
                    {initial ? "Lưu thay đổi" : "Thêm sản phẩm"}
                </Btn>
            </div>
            {showScanner && (
                <Suspense fallback={
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-[4px] z-[1200] flex items-center justify-center">
                        <div className="flex items-center gap-3 text-subtle text-sm">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
                            Đang tải trình quét...
                        </div>
                    </div>
                }>
                    <BarcodeScannerModal
                        onDetected={handleScanDetected}
                        onClose={() => setShowScanner(false)}
                    />
                </Suspense>
            )}
        </Modal>
    );
}