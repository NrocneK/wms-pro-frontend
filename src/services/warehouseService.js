// src/services/warehouseService.js
import { request } from "./http";

export const warehouseApi = {
    getAll: () => request("GET", "/warehouses"),
};