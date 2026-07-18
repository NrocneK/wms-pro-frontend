// src/services/auditService.js
import { request } from "./http";

export const auditApi = {
    getAll: (params = {}) => request("GET", `/audit-logs?${new URLSearchParams(params)}`),
};