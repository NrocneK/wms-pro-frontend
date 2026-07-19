// src/components/users/roleConstants.js
// Tách từ đầu UserManagement.jsx (dòng 9-21 bản gốc) — KHÔNG đổi giá trị.
export const ROLES = ["admin", "manager", "staff"];
export const ROLE_LABELS = { admin: "Admin", manager: "Quản lý", staff: "Nhân viên" };
export const ROLE_COLORS = { admin: "#ef4444", manager: "#f59e0b", staff: "#6366f1" };
export const ROLE_DESC = {
    admin: "Toàn quyền, quản lý người dùng, chỉnh sửa tồn kho",
    manager: "Nhập/xuất kho, chỉnh sửa tồn kho, không quản lý người dùng",
    staff: "Nhập/xuất kho, chỉ xem Dashboard, Tồn kho, Báo cáo",
};
export const ROLE_LEGEND = {
    admin: "Toàn quyền + quản lý người dùng",
    manager: "Nhập/xuất kho + chỉnh sửa tồn kho",
    staff: "Nhập/xuất kho + chỉ xem các tab khác",
};