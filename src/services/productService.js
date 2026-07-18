// src/services/productService.js
import { request } from "./http";

export const productApi = {
    getAll: (p = {}) => request("GET", `/products?${new URLSearchParams(p)}`),
    getByBarcode: (barcode) => request("GET", `/products/${barcode}`),
    create: (d) => request("POST", "/products", d),
    update: (id, d) => request("PUT", `/products/${id}`, d),
};