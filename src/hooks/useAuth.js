// src/hooks/useAuth.js
// Toàn bộ logic xác thực: kiểm tra token khi vào app, login, logout,
// và tự động refresh token trước khi hết hạn 5 phút.

import { useState, useCallback, useRef, useEffect } from "react";
import { authApi } from "../services/authService";
import { getToken, getTokenExp } from "../services/http";

export function useAuth() {
    const [user, setUser] = useState(null);
    const [authChecked, setChecked] = useState(false);

    const refreshTimerRef = useRef(null);
    const scheduleTokenRefreshRef = useRef(null);

    const handleLogout = useCallback(() => {
        clearTimeout(refreshTimerRef.current);
        authApi.logout();
        setUser(null);
    }, []);

    const scheduleTokenRefresh = useCallback((token) => {
        clearTimeout(refreshTimerRef.current);
        const exp = getTokenExp(token);
        if (!exp) return;
        const delay = exp - Date.now() - 5 * 60 * 1000;
        if (delay <= 0) {
            handleLogout();
            return;
        }
        refreshTimerRef.current = setTimeout(async () => {
            try {
                const data = await authApi.refresh();
                scheduleTokenRefreshRef.current(data.token);
            } catch {
                handleLogout();
            }
        }, delay);
    }, [handleLogout]);

    useEffect(() => {
        scheduleTokenRefreshRef.current = scheduleTokenRefresh;
    }, [scheduleTokenRefresh]);

    const handleLogin = useCallback((userData) => {
        setUser(userData);
        scheduleTokenRefresh(getToken());
    }, [scheduleTokenRefresh]);

    // Kiểm tra token có sẵn khi load lại trang (F5, mở tab mới...)
    useEffect(() => {
        const check = async () => {
            const token = getToken();
            if (token) {
                try {
                    const me = await authApi.me();
                    setUser(me);
                    scheduleTokenRefresh(token);
                } catch {
                    /* token invalid → login */
                }
            }
            setChecked(true);
        };
        check();
    }, [scheduleTokenRefresh]);

    return { user, setUser, authChecked, handleLogin, handleLogout };
}