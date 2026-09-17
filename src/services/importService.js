// src/services/importService.js
import { request, upload } from "./http";

export const importApi = {
    parseExcel: (file, warehouse_id) => upload("/imports/parse-excel", file, { warehouse_id }),
    create: (d) => request("POST", "/imports", d),
    confirm: (id) => request("POST", `/imports/${id}/confirm`),
    getAll: (p = {}) => request("GET", `/imports?${new URLSearchParams(p)}`),
    getOne: (id) => request("GET", `/imports/${id}`),
};