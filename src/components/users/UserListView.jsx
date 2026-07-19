// src/components/users/UserListView.jsx
// Tách từ UserManagement.jsx (dòng 214-382 bản gốc trước Phase 3) — KHÔNG đổi JSX.
import Icon from "../ui/Icon";
import { fmtDate } from "../../utils/helpers";
import { ROLE_LABELS, ROLE_COLORS } from "./roleConstants";

export default function UserListView({ users, loading, currentUser, onEdit, onToggleActive }) {
    return (
        <>
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
                                            onClick={() => onEdit(u)}
                                            className="bg-border border-none rounded-[6px] text-primary cursor-pointer p-[6px] flex hover:bg-muted transition-colors duration-150"
                                        >
                                            <Icon name="edit" size={13} />
                                        </button>
                                        {u.id !== currentUser?.id && (
                                            <button
                                                onClick={() => onToggleActive(u)}
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
                                onClick={() => onEdit(u)}
                                className="bg-border border-none rounded-[6px] text-primary cursor-pointer px-3 py-[6px] flex items-center gap-1 text-xs font-semibold hover:bg-muted transition-colors duration-150"
                            >
                                <Icon name="edit" size={13} /> Sửa
                            </button>
                            {u.id !== currentUser?.id && (
                                <button
                                    onClick={() => onToggleActive(u)}
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
        </>
    );
}