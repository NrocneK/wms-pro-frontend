// src/services/authService.js
import { request } from "./http";

export const authApi = {
    login: (username, password) => request("POST", "/auth/login", { username, password }),
    // Backend set cookie qua Set-Cookie lúc gọi /auth/login — không còn gì để lưu ở đây.
    logout: () => request("POST", "/auth/logout"),
    // JS không xoá được cookie httpOnly — phải nhờ backend clearCookie() giúp.
    me: () => request("GET", "/auth/me"),
    refresh: () => request("POST", "/auth/refresh"),
    // Không còn tham số/refreshToken nào truyền tay — cookie tự đi kèm request.
    changePassword: (old_pw, new_pw) =>
        request("POST", "/auth/change-password", { old_password: old_pw, new_password: new_pw }),
};