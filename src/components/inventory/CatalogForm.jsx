// src/components/inventory/CatalogForm.jsx
import { useState } from "react";
import { Btn, Field, Inp, Modal } from "../ui";

export default function CatalogForm({ initial, onClose, onSave }) {
    const [f, setF] = useState({
        barcode: initial?.barcode || "",
        name: initial?.name || "",
        supplier_code: initial?.supplier_code || "",
        supplier_name: initial?.supplier_name || "",
    });
    const s = (k, v) => setF(x => ({ ...x, [k]: v }));
    const isEdit = !!initial;

    return (
        <Modal title={isEdit ? "Sửa thông tin sản phẩm" : "Thêm sản phẩm vào danh mục"} onClose={onClose} width={480}>
            <Field label="Barcode" required>
                <Inp value={f.barcode} onChange={e => s("barcode", e.target.value)} disabled={isEdit} style={{ opacity: isEdit ? .6 : 1 }} />
            </Field>
            <Field label="Tên sản phẩm" required>
                <Inp value={f.name} onChange={e => s("name", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-x-4">
                <Field label="Mã NCC">
                    <Inp value={f.supplier_code} onChange={e => s("supplier_code", e.target.value)} placeholder="Vd: NCC001" />
                </Field>
                <Field label="Tên NCC">
                    <Inp value={f.supplier_name} onChange={e => s("supplier_name", e.target.value)} placeholder="Tên nhà cung cấp" />
                </Field>
            </div>
            <div className="flex gap-[10px] justify-end mt-2">
                <Btn onClick={onClose} color="#334155" outline>Hủy</Btn>
                <Btn onClick={() => { if (!f.barcode || !f.name) return; onSave(f); }}>
                    {isEdit ? "Lưu thay đổi" : "Thêm mới"}
                </Btn>
            </div>
        </Modal>
    );
}