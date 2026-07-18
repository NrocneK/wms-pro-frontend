// src/services/dashboardService.js
// Gom toàn bộ API liên quan Dashboard — trước đây Dashboard.jsx tự gọi fetch()
// trực tiếp 5 chỗ khác nhau (tự set header Authorization mỗi lần), không nhất
// quán với các trang khác. Nay dùng chung request() từ services/http.js.
import { request } from "./http";

export const dashboardApi = {
    // KPI + biểu đồ hoạt động theo tuần (weekOffset: 0 = tuần này, 1 = tuần trước...)
    getOverview: (weekOffset = 0) =>
        request("GET", `/dashboard?week_offset=${weekOffset}&_t=${Date.now()}`),

    // Danh sách ngày có giao dịch (cấp 1 của "Lịch sử giao dịch"), phân trang
    getHistoryDates: (limit = 15, offset = 0) =>
        request("GET", `/dashboard/history-dates?limit=${limit}&offset=${offset}`),

    // Danh sách phiếu (nhập/xuất) trong 1 ngày cụ thể (cấp 2)
    getHistoryOrders: (date) =>
        request("GET", `/dashboard/history-orders?date=${date}`),

    // Danh sách sản phẩm của 1 mã phiếu xuất cụ thể (cấp 3, chỉ dùng cho type="export")
    getExportItems: (orderId, refNo) =>
        request("GET", `/dashboard/export-items?order_id=${orderId}&ref_no=${refNo}`),
};