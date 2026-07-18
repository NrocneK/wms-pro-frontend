// src/services/inventoryService.js
import { request, upload } from "./http";

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