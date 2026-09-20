// src/hooks/useOnlineStatus.js
// navigator.onLine chỉ biết máy có card mạng "bật" (VD còn dính wifi) —
// KHÔNG biết wifi đó có thật sự ra được Internet/đến được server hay không
// (rất thường gặp ở kho: wifi nội bộ còn nhưng đường truyền ra ngoài rớt).
// Đáng tin hơn: tự ping /health định kỳ, coi "online" = ping thành công.
import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../constants";

const PING_INTERVAL_MS = 10000; // 10 giây — đủ nhanh để phát hiện có mạng lại mà không gọi quá dày

// API_BASE dạng "http://host/api/v1" nhưng /health nằm ở gốc domain (xem
// app.js: app.use("/health", ...) đặt TRƯỚC app.use("/api/v1", routes), tách
// biệt khỏi API có version) — lấy origin qua URL() thay vì đếm "../" cho
// chắc, để không vỡ nếu sau này đổi từ /api/v1 sang /api/v2.
const HEALTH_URL = `${new URL(API_BASE).origin}/health`;

export function useOnlineStatus() {
    const [online, setOnline] = useState(navigator.onLine);
    const onlineRef = useRef(online);

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            try {
                const res = await fetch(HEALTH_URL, { method: "GET", cache: "no-store" });
                if (!cancelled) setOnline(res.ok);
            } catch {
                if (!cancelled) setOnline(false);
            }
        };

        check(); // kiểm tra ngay khi mount, không đợi chu kỳ đầu tiên
        const id = setInterval(check, PING_INTERVAL_MS);
        // 2 sự kiện này chỉ để phản ứng NHANH hơn (đổi trạng thái tức thì khi
        // rút dây mạng / bắt lại wifi) — không thay thế việc ping định kỳ ở
        // trên, vì bản thân chúng cũng không đáng tin 100% như đã nói.
        const handleOffline = () => setOnline(false);
        const handleOnline = () => check();
        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        return () => {
            cancelled = true;
            clearInterval(id);
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, []);

    useEffect(() => { onlineRef.current = online; }, [online]);

    return online;
}
