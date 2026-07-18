// src/services/importService.js
import { request, upload } from "./http";

export const importApi = {
    parseExcel: (file) => upload("/imports/parse-excel", file),
    create: (d) => request("POST", "/imports", d),
    confirm: (id) => request("POST", `/imports/${id}/confirm`),
    getAll: (p = {}) => request("GET", `/imports?${new URLSearchParams(p)}`),
    getOne: (id) => request("GET", `/imports/${id}`),
};