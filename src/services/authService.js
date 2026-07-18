// src/services/authService.js
import { request, setToken, setRefreshToken, clearTokens } from "./http";

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