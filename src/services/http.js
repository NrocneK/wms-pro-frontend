// src/services/http.js
// Hàm dùng chung cho toàn bộ services/ — request JSON, upload file, quản lý token.
// Tách từ api/client.js (dòng 1-43 bản gốc) — KHÔNG đổi logic.
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
export const clearTokens = () => {
    localStorage.removeItem("wms_token");
    localStorage.removeItem("wms_refresh");
};

// ── Base fetch (JSON) ──────────────────────────
export const request = async (method, path, body = null) => {
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
export const upload = async (path, file) => {
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