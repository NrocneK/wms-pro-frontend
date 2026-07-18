// src/services/exportService.js
import { request, upload } from "./http";

export const exportApi = {
    parseExcel: (file) => upload("/exports/parse-excel", file),
    create: (d) => request("POST", "/exports", d),
    confirm: (id) => request("POST", `/exports/${id}/confirm`),
    getAll: (p = {}) => request("GET", `/exports?${new URLSearchParams(p)}`),
    getOne: (id) => request("GET", `/exports/${id}`),
    getPacking: () => request("GET", "/exports/packing"),
    getBatchTickets: (id) => request("GET", `/exports/${id}/packing-tickets`),
    getTicketItems: (id, refNo) => request("GET", `/exports/${id}/packing-tickets/${refNo}/items`),
    updateActualQuantity: (itemId, quantity) => request("PUT", `/exports/items/${itemId}/actual-quantity`, { quantity }),
    cancel: (id) => request("POST", `/exports/${id}/cancel`),
};