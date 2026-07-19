// src/components/users/UserForm.jsx
// Tách từ UserManagement.jsx (dòng 23-108 bản gốc trước Phase 3) — KHÔNG đổi logic.
import { useState } from "react";
import { Btn, Field, Inp, Sel, Modal } from "../ui";
import { WAREHOUSES } from "../../constants";
import { ROLES, ROLE_LABELS, ROLE_COLORS, ROLE_DESC } from "./roleConstants";

export default function UserForm({ initial, onClose, onSave }) {
    const [f, setF] = useState({
        username: initial?.username || "",
        full_name: initial?.full_name || "",
        role: initial?.role || "staff",
        password: "",
        is_active: initial?.is_active !== undefined ? initial.is_active : 1,
        warehouse_id: initial?.warehouse_id || "",
    });
    const s = (k, v) => setF(x => ({ ...x, [k]: v }));
    const isEdit = !!initial;

    return (
        <Modal title={isEdit ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"} onClose={onClose} width={520}>
            <div className="grid grid-cols-2 gap-x-5">
                <Field label="Username" required>
                    <Inp
                        value={f.username}
                        onChange={e => s("username", e.target.value)}
                        placeholder="vd: nhanvien01"
                        disabled={isEdit}
                        style={{ opacity: isEdit ? .6 : 1 }}
                    />
                </Field>
                <Field label="Vai trò">
                    <Sel value={f.role} onChange={e => s("role", e.target.value)}>
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </Sel>
                </Field>
            </div>

            <Field label="Họ và tên" required>
                <Inp value={f.full_name} onChange={e => s("full_name", e.target.value)} placeholder="Tên hiển thị..." />
            </Field>

            <Field label="Kho phụ trách">
                <Sel value={f.warehouse_id} onChange={e => s("warehouse_id", e.target.value)}>
                    <option value="">— Tất cả kho (không giới hạn) —</option>
                    {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
                </Sel>
                <div className="text-[11px] text-subtle mt-[5px]">
                    {f.warehouse_id
                        ? `⚠ Tài khoản này chỉ truy cập kho "${f.warehouse_id}"`
                        : "✓ Không giới hạn — truy cập tất cả các kho"}
                </div>
            </Field>

            <Field label={isEdit ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"} required={!isEdit}>
                <Inp
                    type="password" value={f.password}
                    onChange={e => s("password", e.target.value)}
                    placeholder={isEdit ? "Để trống nếu không thay đổi..." : "Tối thiểu 6 ký tự..."}
                />
            </Field>

            {isEdit && (
                <Field label="Trạng thái">
                    <Sel value={f.is_active} onChange={e => s("is_active", Number(e.target.value))}>
                        <option value={1}>Hoạt động</option>
                        <option value={0}>Vô hiệu hóa</option>
                    </Sel>
                </Field>
            )}

            {/* Role description */}
            <div className="bg-border rounded-[10px] p-[12px_16px] mb-4 text-xs text-subtle">
                <strong style={{ color: ROLE_COLORS[f.role] }}>{ROLE_LABELS[f.role]}</strong>
                {" — "}{ROLE_DESC[f.role]}
                {f.warehouse_id && (
                    <span className="text-warning"> · Giới hạn kho <strong>{f.warehouse_id}</strong></span>
                )}
            </div>

            <div className="flex gap-[10px] justify-end">
                <Btn onClick={onClose} color="#334155" outline>Hủy</Btn>
                <Btn onClick={() => {
                    if (!f.full_name) return;
                    if (!isEdit && !f.password) return;
                    onSave({ ...f, warehouse_code: f.warehouse_id || null });
                }}>
                    {isEdit ? "Lưu thay đổi" : "Tạo tài khoản"}
                </Btn>
            </div>
        </Modal>
    );
}