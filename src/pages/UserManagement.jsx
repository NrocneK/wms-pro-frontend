// src/pages/UserManagement.jsx
import { useState, useEffect } from "react";
import { Btn, AlertModal, ConfirmModal } from "../components/ui";
import Icon from "../components/ui/Icon";
import { userApi } from "../services/userService";
import { ROLES, ROLE_COLORS, ROLE_LABELS, ROLE_LEGEND } from "../components/users/roleConstants";
import UserForm from "../components/users/UserForm";
import UserListView from "../components/users/UserListView";

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

      <UserListView
        users={users}
        loading={loading}
        currentUser={currentUser}
        onEdit={(u) => { setEditUser({ ...u, warehouse_id: u.warehouse_code || "" }); setShowForm(true); }}
        onToggleActive={handleToggleActive}
      />

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