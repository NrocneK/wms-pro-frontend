// src/components/layout/AccountModal.jsx
import { useState } from "react";
import { Modal, Field, Inp, Btn, AlertModal } from "../ui";
import { userApi, authApi } from "../../api/client";

const ROLE_LABELS = { admin: "Quản trị viên", manager: "Quản lý kho", staff: "Nhân viên" };

export default function AccountModal({ user, onClose, onUpdated }) {
    const [fullName, setFullName] = useState(user.full_name || "");
    const [savingName, setSavingName] = useState(false);

    const [oldPw, setOldPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [savingPw, setSavingPw] = useState(false);

    const [alert, setAlert] = useState(null);
    const showAlert = (message, type = "error", title) => setAlert({ message, type, title });

    const handleSaveName = async () => {
        if (!fullName.trim()) return showAlert("Họ và tên không được để trống");
        setSavingName(true);
        try {
            await userApi.updateSelf({ full_name: fullName.trim() });
            onUpdated({ ...user, full_name: fullName.trim() });
            showAlert("Cập nhật họ tên thành công.", "success");
        } catch (err) {
            showAlert(err.message);
        } finally {
            setSavingName(false);
        }
    };

    const handleChangePassword = async () => {
        if (!oldPw || !newPw || !confirmPw) return showAlert("Vui lòng nhập đầy đủ thông tin");
        if (newPw.length < 8) return showAlert("Mật khẩu mới phải ít nhất 8 ký tự");
        if (newPw !== confirmPw) return showAlert("Mật khẩu mới nhập lại không khớp");
        setSavingPw(true);
        try {
            await authApi.changePassword(oldPw, newPw);
            setOldPw(""); setNewPw(""); setConfirmPw("");
            showAlert("Đổi mật khẩu thành công.", "success");
        } catch (err) {
            showAlert(err.message);
        } finally {
            setSavingPw(false);
        }
    };

    return (
        <Modal title="Tài khoản của tôi" onClose={onClose} width={480}>
            {alert && <AlertModal {...alert} onClose={() => setAlert(null)} />}

            {/* ── Thông tin cơ bản (chỉ đọc) ─────────── */}
            <div className="bg-border rounded-[10px] p-[12px_16px] mb-5 text-xs">
                <div className="flex justify-between py-1">
                    <span className="text-subtle">Username</span>
                    <span className="font-mono font-bold text-heading">{user.username}</span>
                </div>
                <div className="flex justify-between py-1">
                    <span className="text-subtle">Vai trò</span>
                    <span className="font-bold text-heading">{ROLE_LABELS[user.role] || user.role}</span>
                </div>
                <div className="flex justify-between py-1">
                    <span className="text-subtle">Kho phụ trách</span>
                    <span className="font-bold text-heading">{user.warehouse_code || "Tất cả"}</span>
                </div>
            </div>

            {/* ── Đổi họ tên ─────────────────────────── */}
            <div className="mb-6">
                <Field label="Họ và tên">
                    <Inp value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Tên hiển thị..." />
                </Field>
                <div className="flex justify-end">
                    <Btn onClick={handleSaveName} disabled={savingName}>
                        {savingName ? "Đang lưu..." : "Lưu tên"}
                    </Btn>
                </div>
            </div>

            <div className="border-t border-border my-5" />

            {/* ── Đổi mật khẩu ───────────────────────── */}
            <div>
                <h4 className="text-sm font-bold text-heading mb-3">Đổi mật khẩu</h4>
                <Field label="Mật khẩu hiện tại" required>
                    <Inp type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="Nhập mật khẩu hiện tại..." />
                </Field>
                <Field label="Mật khẩu mới" required>
                    <Inp type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Tối thiểu 8 ký tự..." />
                </Field>
                <Field label="Nhập lại mật khẩu mới" required>
                    <Inp type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Nhập lại mật khẩu mới..." />
                </Field>
                <div className="flex justify-end">
                    <Btn onClick={handleChangePassword} disabled={savingPw} color="#f59e0b">
                        {savingPw ? "Đang đổi..." : "Đổi mật khẩu"}
                    </Btn>
                </div>
            </div>
        </Modal>
    );
}