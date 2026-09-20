// src/services/http.js
// Hàm dùng chung cho toàn bộ services/ — request JSON, upload file.
// Token giờ nằm trong cookie httpOnly (do backend set qua Set-Cookie) — JS ở
// đây không đọc/ghi/xoá được token nữa, và cũng không cần: trình duyệt tự gửi
// cookie kèm mỗi request có credentials: "include".
import { API_BASE } from "../constants";

let refreshPromise = null; // gộp nhiều request 401 cùng lúc thành đúng 1 lần gọi /auth/refresh

const tryRefresh = () => {
    if (!refreshPromise) {
        refreshPromise = fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" })
            .then(res => res.ok)
            .finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
};

// ── Base fetch (JSON) ──────────────────────────
export const request = async (method, path, body = null, _retried = false) => {
    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            method,
            credentials: "include", // bắt buộc — thiếu dòng này trình duyệt sẽ không gửi cookie cross-origin
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (networkErr) {
        // fetch() chỉ throw khi KHÔNG kết nối được tới server (mất mạng, DNS lỗi,
        // CORS chặn...) — khác hẳn server trả về lỗi (400/401/500), lúc đó fetch
        // vẫn resolve bình thường, chỉ là res.ok = false. Đánh dấu rõ isNetworkError
        // để nơi gọi (VD syncEngine) phân biệt được "chưa gửi đi được" với "server
        // từ chối" — 2 tình huống cần xử lý khác nhau hoàn toàn.
        const err = new Error("Không thể kết nối đến server");
        err.isNetworkError = true;
        throw err;
    }

    // Access token hết hạn → thử refresh 1 lần rồi gọi lại đúng request gốc.
    // Không retry route /auth/* để tránh vòng lặp vô hạn khi chính refresh cũng 401.
    if (res.status === 401 && !_retried && !path.startsWith("/auth/")) {
        const refreshed = await tryRefresh();
        if (refreshed) return request(method, path, body, true);
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi kết nối server");
    return data.data;
};

// ── File upload (multipart) ───────────────────
export const upload = async (path, file, extraFields = {}, _retried = false) => {
    const form = new FormData();
    form.append("file", file);
    for (const [k, v] of Object.entries(extraFields)) {
        if (v !== null && v !== undefined && v !== "") form.append(k, v);
    }
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        credentials: "include",
        body: form,
    });

    if (res.status === 401 && !_retried) {
        const refreshed = await tryRefresh();
        if (refreshed) return upload(path, file, extraFields, true);
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi upload file");
    return data.data;
};