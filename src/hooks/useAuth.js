// src/hooks/useAuth.js
// Toàn bộ logic xác thực: kiểm tra phiên đăng nhập khi vào app, login, logout.
// Token nằm trong cookie httpOnly — hook này không còn đọc/ghi token trực tiếp.
// Việc tự làm mới access token khi hết hạn giờ nằm ở http.js (request() tự
// gọi /auth/refresh khi gặp 401 rồi thử lại request gốc), không cần hẹn giờ
// trước ở đây nữa vì không còn cách nào đọc được thời điểm hết hạn từ client.

import { useState, useCallback, useEffect } from "react";
import { authApi } from "../services/authService";

export function useAuth() {
    const [user, setUser] = useState(null);
    const [authChecked, setChecked] = useState(false);

    const handleLogout = useCallback(async () => {
        try { await authApi.logout(); } catch { /* dù lỗi mạng cũng vẫn coi như đã đăng xuất ở phía client */ }
        setUser(null);
    }, []);

    const handleLogin = useCallback((userData) => {
        setUser(userData);
    }, []);

    // Kiểm tra phiên đăng nhập khi load lại trang (F5, mở tab mới...) — cookie
    // (nếu còn hạn) tự động gửi kèm request này, không cần đọc gì từ client.
    useEffect(() => {
        const check = async () => {
            try {
                const me = await authApi.me();
                setUser(me);
            } catch {
                /* chưa đăng nhập hoặc cookie hết hạn → giữ nguyên user = null */
            }
            setChecked(true);
        };
        check();
    }, []);

    return { user, setUser, authChecked, handleLogin, handleLogout };
}
