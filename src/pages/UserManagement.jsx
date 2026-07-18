// src/pages/UserManagement.jsx
import { useState, useEffect } from "react";
import { Btn, Field, Inp, Sel, Modal, AlertModal, ConfirmModal } from "../components/ui";
import Icon from "../components/ui/Icon";
import { fmtDate } from "../utils/helpers";
import { userApi } from "../services/userService";
import { WAREHOUSES } from "../constants";

const ROLES = ["admin", "manager", "staff"];
const ROLE_LABELS = { admin: "Admin", manager: "Quản lý", staff: "Nhân viên" };
const ROLE_COLORS = { admin: "#ef4444", manager: "#f59e0b", staff: "#6366f1" };
const ROLE_DESC = {
  admin: "Toàn quyền, quản lý người dùng, chỉnh sửa tồn kho",
  manager: "Nhập/xuất kho, chỉnh sửa tồn kho, không quản lý người dùng",
  staff: "Nhập/xuất kho, chỉ xem Dashboard, Tồn kho, Báo cáo",
};
const ROLE_LEGEND = {
  admin: "Toàn quyền + quản lý người dùng",
  manager: "Nhập/xuất kho + chỉnh sửa tồn kho",
  staff: "Nhập/xuất kho + chỉ xem các tab khác",
};

function UserForm({ initial, onClose, onSave }) {
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

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [alert, setAlert] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const showAlert = (msg, type = "error", title) => setAlert({ message: msg, type, title });
  const showConfirm = (msg, fn, opts = {}) => setConfirm({ message: msg, onConfirm: fn, ...opts });

  const loadUsers = () => {
    let active = true;
    setLoading(true);
    userApi.getAll()
      .then(data => { if (active) setUsers(Array.isArray(data) ? data : []); })
      .catch(err => { if (active) showAlert("Không thể tải danh sách người dùng: " + err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  };

  useEffect(() => { const cleanup = loadUsers(); return cleanup; }, []); // eslint-disable-line

  const handleSave = async (f) => {
    try {
      if (editUser) {
        await userApi.update(editUser.id, {
          full_name: f.full_name, role: f.role,
          warehouse_code: f.warehouse_code, is_active: f.is_active,
        });
        if (f.password) await userApi.resetPassword(editUser.id, f.password);
        showAlert("Cập nhật tài khoản thành công.", "success");
      } else {
        await userApi.create({
          username: f.username, password: f.password,
          full_name: f.full_name, role: f.role, warehouse_code: f.warehouse_code,
        });
        showAlert(`Tạo tài khoản "${f.username}" thành công.`, "success");
      }
      loadUsers();
      setShowForm(false);
      setEditUser(null);
    } catch (err) { showAlert(err.message); }
  };

  const handleToggleActive = (user) => {
    const action = user.is_active ? "vô hiệu hóa" : "kích hoạt lại";
    showConfirm(
      `Xác nhận ${action} tài khoản "${user.username}"?`,
      async () => {
        try {
          await userApi.update(user.id, {
            full_name: user.full_name, role: user.role,
            warehouse_code: user.warehouse_code || null,
            is_active: user.is_active ? 0 : 1,
          });
          showAlert(`Đã ${action} tài khoản.`, "success");
          loadUsers();
        } catch (err) { showAlert(err.message); }
      },
      {
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản`,
        confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
        confirmColor: user.is_active ? "#ef4444" : "#10b981",
      }
    );
  };

  return (
    <div className="space-y-5">
      {alert && <AlertModal {...alert} onClose={() => setAlert(null)} />}
      {confirm && (
        <ConfirmModal
          title={confirm.title} message={confirm.message}
          confirmLabel={confirm.confirmLabel} confirmColor={confirm.confirmColor}
          onConfirm={() => { setConfirm(null); confirm.onConfirm(); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── Header ──────────────────────────────── */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="m-0 text-lg font-extrabold text-heading">Quản lý người dùng</h2>
          <p className="m-0 mt-1 text-[13px] text-subtle">
            Tạo tài khoản, phân quyền và gắn kho phụ trách
          </p>
        </div>
        <Btn onClick={() => { setEditUser(null); setShowForm(true); }}>
          <Icon name="plus" size={15} /> Tạo tài khoản
        </Btn>
      </div>

      {/* ── Role legend ──────────────────────────── */}
      <div className="flex gap-[10px] flex-wrap">
        {ROLES.map(r => (
          <div key={r} className="bg-card rounded-[10px] p-[10px_16px] text-xs"
            style={{ border: `1px solid ${ROLE_COLORS[r]}44` }}>
            <span className="font-bold mr-[6px]" style={{ color: ROLE_COLORS[r] }}>{ROLE_LABELS[r]}</span>
            <span className="text-subtle">{ROLE_LEGEND[r]}</span>
          </div>
        ))}
      </div>

      {/* ── Bảng (desktop/tablet rộng, ≥1080px) — giữ nguyên 100% ── */}
      <div className="card overflow-hidden hidden wide:block">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-border">
              {["Username", "Họ và tên", "Vai trò", "Kho phụ trách", "Trạng thái", "Đăng nhập gần nhất", ""].map(h => (
                <th key={h} className="text-left p-[10px_14px] text-label font-bold text-[10px] tracking-[0.5px] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-7 text-center text-subtle">Đang tải...</td></tr>
            ) : users.map((u, i) => (
              <tr key={u.id}
                className={`border-b border-border transition-colors duration-150 ${i % 2 === 0 ? "" : "bg-[#0a101a]"} ${u.is_active ? "" : "opacity-50"}`}>

                {/* Username */}
                <td className="p-[11px_14px] font-mono text-heading font-bold">
                  {u.username}
                  {u.id === currentUser?.id && (
                    <span className="ml-[6px] text-[10px] text-primary bg-primary/[0.13] rounded-[4px] px-[6px] py-[1px]">
                      Bạn
                    </span>
                  )}
                </td>

                {/* Họ tên */}
                <td className="p-[11px_14px] text-body">{u.full_name}</td>

                {/* Vai trò */}
                <td className="p-[11px_14px]">
                  <span className="rounded-[6px] px-[10px] py-[2px] text-[11px] font-bold"
                    style={{
                      background: ROLE_COLORS[u.role] + "22",
                      color: ROLE_COLORS[u.role],
                      border: `1px solid ${ROLE_COLORS[u.role]}44`,
                    }}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </td>

                {/* Kho */}
                <td className="p-[11px_14px]">
                  {u.warehouse_code
                    ? <span className="bg-primary/[0.13] text-primary-light border border-primary/[0.27] rounded-[6px] px-3 py-[3px] text-[13px] font-extrabold">{u.warehouse_code}</span>
                    : <span className="text-muted text-xs">Tất cả</span>}
                </td>

                {/* Trạng thái */}
                <td className="p-[11px_14px]">
                  <span className="rounded-[6px] px-[10px] py-[2px] text-[11px] font-bold"
                    style={{
                      background: u.is_active ? "#10b98122" : "#47556922",
                      color: u.is_active ? "#10b981" : "#94a3b8",
                      border: `1px solid ${u.is_active ? "#10b98144" : "#47556944"}`,
                    }}>
                    {u.is_active ? "Hoạt động" : "Vô hiệu hóa"}
                  </span>
                </td>

                {/* Đăng nhập gần nhất */}
                <td className="p-[11px_14px] text-subtle text-xs">
                  {u.last_login ? fmtDate(u.last_login) : "—"}
                </td>

                {/* Actions */}
                <td className="p-[11px_14px]">
                  <div className="flex gap-[6px]">
                    <button
                      onClick={() => { setEditUser({ ...u, warehouse_id: u.warehouse_code || "" }); setShowForm(true); }}
                      className="bg-border border-none rounded-[6px] text-primary cursor-pointer p-[6px] flex hover:bg-muted transition-colors duration-150"
                    >
                      <Icon name="edit" size={13} />
                    </button>
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => handleToggleActive(u)}
                        className="bg-border border-none rounded-[6px] cursor-pointer p-[6px] flex hover:bg-muted transition-colors duration-150"
                        style={{ color: u.is_active ? "#ef4444" : "#10b981" }}
                      >
                        <Icon name={u.is_active ? "delete" : "check"} size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Thẻ (màn hình hẹp, <1080px) — đủ 7 trường như bảng ── */}
      <div className="wide:hidden space-y-3">
        {loading ? (
          <div className="text-center text-subtle text-sm py-7">Đang tải...</div>
        ) : users.map((u) => (
          <div key={u.id} className={`card p-4 ${u.is_active ? "" : "opacity-50"}`}>
            {/* Header: username + vai trò */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="font-mono text-heading font-bold text-[13px]">
                {u.username}
                {u.id === currentUser?.id && (
                  <span className="ml-[6px] text-[10px] text-primary bg-primary/[0.13] rounded-[4px] px-[6px] py-[1px]">
                    Bạn
                  </span>
                )}
              </div>
              <span className="rounded-[6px] px-[10px] py-[2px] text-[11px] font-bold flex-shrink-0"
                style={{
                  background: ROLE_COLORS[u.role] + "22",
                  color: ROLE_COLORS[u.role],
                  border: `1px solid ${ROLE_COLORS[u.role]}44`,
                }}>
                {ROLE_LABELS[u.role] || u.role}
              </span>
            </div>

            <div className="text-sm text-body mb-3">{u.full_name}</div>

            {/* Kho / Trạng thái / Đăng nhập */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3 pb-3 border-b border-border text-sm">
              <div>
                <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Kho phụ trách</div>
                {u.warehouse_code
                  ? <span className="bg-primary/[0.13] text-primary-light border border-primary/[0.27] rounded-[6px] px-2 py-[1px] text-xs font-extrabold">{u.warehouse_code}</span>
                  : <span className="text-muted text-xs">Tất cả</span>}
              </div>
              <div>
                <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Trạng thái</div>
                <span className="rounded-[6px] px-2 py-[1px] text-[11px] font-bold"
                  style={{
                    background: u.is_active ? "#10b98122" : "#47556922",
                    color: u.is_active ? "#10b981" : "#94a3b8",
                    border: `1px solid ${u.is_active ? "#10b98144" : "#47556944"}`,
                  }}>
                  {u.is_active ? "Hoạt động" : "Vô hiệu hóa"}
                </span>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Đăng nhập gần nhất</div>
                <div className="text-subtle text-xs">{u.last_login ? fmtDate(u.last_login) : "—"}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setEditUser({ ...u, warehouse_id: u.warehouse_code || "" }); setShowForm(true); }}
                className="bg-border border-none rounded-[6px] text-primary cursor-pointer px-3 py-[6px] flex items-center gap-1 text-xs font-semibold hover:bg-muted transition-colors duration-150"
              >
                <Icon name="edit" size={13} /> Sửa
              </button>
              {u.id !== currentUser?.id && (
                <button
                  onClick={() => handleToggleActive(u)}
                  className="bg-border border-none rounded-[6px] cursor-pointer px-3 py-[6px] flex items-center gap-1 text-xs font-semibold hover:bg-muted transition-colors duration-150"
                  style={{ color: u.is_active ? "#ef4444" : "#10b981" }}
                >
                  <Icon name={u.is_active ? "delete" : "check"} size={13} /> {u.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                </button>
              )}
            </div>
          </div>
        ))}
        {!loading && users.length === 0 && (
          <div className="text-center text-muted text-sm py-8">Chưa có tài khoản nào</div>
        )}
      </div>

      {showForm && (
        <UserForm
          initial={editUser}
          onClose={() => { setShowForm(false); setEditUser(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
