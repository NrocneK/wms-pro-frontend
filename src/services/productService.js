// src/services/productService.js
import { request, upload } from "./http";

export const productApi = {
    getAll: (p = {}) => request("GET", `/products?${new URLSearchParams(p)}`),
    getByBarcode: (barcode) => request("GET", `/products/${barcode}`),
    create: (d) => request("POST", "/products", d),
    update: (id, d) => request("PUT", `/products/${id}`, d),
    remove: (id) => request("DELETE", `/products/${id}`),
    parseExcel: (file) => upload("/products/parse-excel", file),
    bulkImport: (items, warehouse_id = null) => request("POST", "/products/bulk-import", { items, warehouse_id }),
};