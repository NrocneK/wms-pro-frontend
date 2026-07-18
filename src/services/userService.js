// src/services/userService.js
import { request } from "./http";

// USERS (admin only, trừ updateSelf)
export const userApi = {
    getAll: () => request("GET", "/users"),
    create: (d) => request("POST", "/users", d),
    update: (id, d) => request("PUT", `/users/${id}`, d),
    updateSelf: (d) => request("PUT", "/users/me", d),
    resetPassword: (id, pw) => request("POST", `/users/${id}/reset-password`, { new_password: pw }),
    remove: (id) => request("DELETE", `/users/${id}`),
};