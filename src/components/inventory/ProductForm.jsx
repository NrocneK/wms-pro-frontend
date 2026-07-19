// src/components/inventory/ProductForm.jsx
import { useState } from "react";
import { Btn, Field, Inp, Sel, Modal } from "../ui";
import { WAREHOUSES, UNITS } from "../../constants";
import { productApi } from "../../services/productService";

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
    const s = (k, v) => setF(x => ({ ...x, [k]: v }));

    const handleBarcodeBlur = async () => {
        if (initial || !f.barcode.trim()) return;
        setLookingUp(true);
        try {
            const rows = await productApi.getByBarcode(f.barcode.trim());
            const product = Array.isArray(rows) ? rows[0] : rows;
            if (product) {
                setF(x => ({
                    ...x,
                    name: product.name,
                    unit: product.unit || x.unit,
                    costPrice: product.cost_price || x.costPrice,
                    sellPrice: product.sell_price || x.sellPrice,
                }));
                setFoundInCatalog(true);
            }
        } catch {
            setFoundInCatalog(false);
        } finally {
            setLookingUp(false);
        }
    };

    return (
        <Modal title={initial ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"} onClose={onClose} width={680}>
            <div className="grid grid-cols-2 gap-x-5">
                <Field label="Barcode" required>
                    <Inp
                        value={f.barcode}
                        onChange={e => s("barcode", e.target.value)}
                        onBlur={handleBarcodeBlur}
                        placeholder="Nhập mã barcode rồi bấm ra ngoài để tra cứu..."
                        disabled={!!initial}
                    />
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
        </Modal>
    );
}