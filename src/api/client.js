// src/api/client.js
import { API_BASE } from "../constants";

// ── Token management ──────────────────────────
export const getToken = () => localStorage.getItem("wms_token") || "";
// Đọc thời điểm hết hạn từ JWT payload (trả về milliseconds)
export const getTokenExp = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000; // exp tính bằng giây → đổi sang ms
  } catch {
    return null;
  }
};
export const setToken = (t) => localStorage.setItem("wms_token", t);
export const setRefreshToken = (t) => localStorage.setItem("wms_refresh", t);
export const clearTokens = () => { localStorage.removeItem("wms_token"); localStorage.removeItem("wms_refresh"); };

// ── Base fetch ────────────────────────────────
const request = async (method, path, body = null) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lỗi kết nối server");
  return data.data;
};

// ── File upload (multipart) ───────────────────
const upload = async (path, file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lỗi upload file");
  return data.data;
};

// AUTH
export const authApi = {
  login: async (username, password) => {
    const data = await request("POST", "/auth/login", { username, password });
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    return data;
  },
  logout: () => clearTokens(),
  me: () => request("GET", "/auth/me"),
  refresh: async () => {
    const refreshToken = localStorage.getItem("wms_refresh") || "";
    if (!refreshToken) throw new Error("Không có refresh token");
    const data = await request("POST", "/auth/refresh", { refreshToken });
    setToken(data.token); // lưu token mới vào localStorage
    return data;
  },
  changePassword: (old_pw, new_pw) =>
    request("POST", "/auth/change-password", { old_password: old_pw, new_password: new_pw }),
};

// INVENTORY
export const inventoryApi = {
  getAll: (p = {}) => request("GET", `/inventory?${new URLSearchParams(p)}`),
  getByBarcode: (bc) => request("GET", `/products/${bc}`),
  create: (d) => request("POST", "/inventory", d),
  update: (id, d) => request("PUT", `/inventory/${id}`, d),
  remove: (id) => request("DELETE", `/inventory/${id}`),
  removeBatch: (ids) => request("DELETE", "/inventory/batch", { ids }),
  getDashboard: () => request("GET", "/dashboard"),
  getAlerts: () => request("GET", "/inventory/alerts"),
  getReportByCategory: () => request("GET", "/reports/by-category"),
  getReportUserActivity: () => request("GET", "/reports/user-activity"),

  // Thay thế toàn bộ tồn kho từ file Excel
  previewReplace: (file) => upload("/inventory/preview-replace", file),
  importReplace: (file) => upload("/inventory/import-replace", file),
};

// IMPORT
export const importApi = {
  parseExcel: (file) => upload("/imports/parse-excel", file),
  create: (d) => request("POST", "/imports", d),
  confirm: (id) => request("POST", `/imports/${id}/confirm`),
  getAll: (p = {}) => request("GET", `/imports?${new URLSearchParams(p)}`),
  getOne: (id) => request("GET", `/imports/${id}`),
};

// EXPORT
export const exportApi = {
  parseExcel: (file) => upload("/exports/parse-excel", file),
  create: (d) => request("POST", "/exports", d),
  confirm: (id) => request("POST", `/exports/${id}/confirm`),
  getAll: (p = {}) => request("GET", `/exports?${new URLSearchParams(p)}`),
  getOne: (id) => request("GET", `/exports/${id}`),
  getPacking: () => request("GET", "/exports/packing"),
  getBatchTickets: (id) => request("GET", `/exports/${id}/packing-tickets`),
  getTicketItems: (id, refNo) => request("GET", `/exports/${id}/packing-tickets/${refNo}/items`),
  updateActualQuantity: (itemId, quantity) => request("PUT", `/exports/items/${itemId}/actual-quantity`, { quantity }),
  cancel: (id) => request("POST", `/exports/${id}/cancel`),
};

// USERS (admin only)
export const userApi = {
  getAll: () => request("GET", "/users"),
  create: (d) => request("POST", "/users", d),
  update: (id, d) => request("PUT", `/users/${id}`, d),
  resetPassword: (id, pw) => request("POST", `/users/${id}/reset-password`, { new_password: pw }),
  remove: (id) => request("DELETE", `/users/${id}`),
};

// AUDIT LOGS
export const auditApi = {
  getAll: (params = {}) => request("GET", `/audit-logs?${new URLSearchParams(params)}`),
};