// src/hooks/useTransactionHistory.js
// Lịch sử giao dịch — nay có 4 cấp thay vì 3:
//   Cấp 1: Ngày  →  Cấp 2 (MỚI): Loại phiếu (Nhập/Xuất)  →  Cấp 3: Phiếu  →  Cấp 4: Sản phẩm
// Cấp 2 mới HOÀN TOÀN là gom nhóm phía client — API /dashboard/history-orders
// vẫn trả về danh sách phẳng gồm cả phiếu nhập lẫn xuất (có field `type`),
// không cần đổi gì ở backend.
import { useState, useEffect } from "react";
import { dashboardApi } from "../services/dashboardService";
import { importApi } from "../services/importService";

export function useTransactionHistory() {
    const [historyDates, setHistoryDates] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [loadingMoreDates, setLoadingMoreDates] = useState(false);
    const [hasMoreDates, setHasMoreDates] = useState(false);

    const [openDate, setOpenDate] = useState(null);       // cấp 1 → 2
    const [ordersByDate, setOrdersByDate] = useState({}); // cache danh sách phiếu THÔ (chưa nhóm) của 1 ngày
    const [loadingOrdersFor, setLoadingOrdersFor] = useState(null);

    const [openTypeGroup, setOpenTypeGroup] = useState(null); // cấp 2 → 3, key = `${date}-${type}`

    const [openOrderKey, setOpenOrderKey] = useState(null);   // cấp 3 → 4, key = `${type}-${order_id}-${ref_no}`
    const [itemsByOrder, setItemsByOrder] = useState({});
    const [loadingItemsFor, setLoadingItemsFor] = useState(null);

    // Tải 15 ngày gần nhất khi hook được mount lần đầu (giữ nguyên hành vi gốc)
    useEffect(() => {
        let active = true;
        dashboardApi.getHistoryDates(15, 0)
            .then(json => {
                if (!active) return;
                setHistoryDates(json?.dates || []);
                setHasMoreDates(json?.has_more || false);
            })
            .catch(() => { })
            .finally(() => { if (active) setLoadingHistory(false); });
        return () => { active = false; };
    }, []);

    const loadMoreDates = async () => {
        setLoadingMoreDates(true);
        try {
            const json = await dashboardApi.getHistoryDates(15, historyDates.length);
            setHistoryDates(prev => [...prev, ...(json?.dates || [])]);
            setHasMoreDates(json?.has_more || false);
        } catch { /* im lặng — người dùng có thể bấm lại */ }
        finally { setLoadingMoreDates(false); }
    };

    // Cấp 1 → Cấp 2: mở 1 ngày, tải danh sách phiếu thô (có cache)
    const toggleDate = async (date) => {
        if (openDate === date) {
            setOpenDate(null);
            setOpenTypeGroup(null);
            setOpenOrderKey(null);
            return;
        }
        setOpenDate(date);
        setOpenTypeGroup(null); // đóng nhóm loại phiếu + phiếu đang mở của ngày cũ
        setOpenOrderKey(null);
        if (ordersByDate[date]) return;
        setLoadingOrdersFor(date);
        try {
            const json = await dashboardApi.getHistoryOrders(date);
            setOrdersByDate(prev => ({ ...prev, [date]: json?.items || [] }));
        } catch {
            setOrdersByDate(prev => ({ ...prev, [date]: [] }));
        } finally {
            setLoadingOrdersFor(null);
        }
    };

    // Cấp 2 (MỚI) → Cấp 3: mở 1 nhóm loại phiếu (nhập/xuất) trong ngày đang chọn.
    // Không gọi API — chỉ lọc lại danh sách đã có sẵn trong ordersByDate[date].
    const toggleTypeGroup = (date, type) => {
        const key = `${date}-${type}`;
        if (openTypeGroup === key) {
            setOpenTypeGroup(null);
            setOpenOrderKey(null);
            return;
        }
        setOpenTypeGroup(key);
        setOpenOrderKey(null); // đóng phiếu đang mở của nhóm cũ khi chuyển nhóm
    };

    // Cấp 3 → Cấp 4: mở 1 phiếu, tải danh sách sản phẩm.
    // Import: tái sử dụng /imports/:id (đã trả về đủ items).
    // Export: PHẢI lọc thêm theo ref_no (1 export_order có thể có nhiều "mã phiếu"
    // con) nên dùng riêng dashboardApi.getExportItems, không dùng /exports/:id
    // (endpoint đó trả về TẤT CẢ items của cả phiếu, không lọc theo ref_no).
    const toggleOrder = async (order) => {
        const key = `${order.type}-${order.order_id}-${order.ref_no}`;
        if (openOrderKey === key) { setOpenOrderKey(null); return; }
        setOpenOrderKey(key);
        if (itemsByOrder[key]) return;
        setLoadingItemsFor(key);
        try {
            let data;
            if (order.type === "import") {
                data = (await importApi.getOne(order.order_id)).items || [];
            } else {
                data = await dashboardApi.getExportItems(order.order_id, order.ref_no);
            }
            setItemsByOrder(prev => ({ ...prev, [key]: data || [] }));
        } catch {
            setItemsByOrder(prev => ({ ...prev, [key]: [] }));
        } finally {
            setLoadingItemsFor(null);
        }
    };

    // Gom danh sách phiếu thô của 1 ngày thành 2 nhóm: import / export.
    // Dùng bởi component UI để render cấp 2 (số lượng phiếu + tổng giá trị mỗi nhóm).
    const groupOrdersByType = (date) => {
        const orders = ordersByDate[date] || [];
        const groups = { import: [], export: [] };
        for (const o of orders) {
            if (groups[o.type]) groups[o.type].push(o);
        }
        return {
            import: {
                orders: groups.import,
                count: groups.import.length,
                totalValue: groups.import.reduce((s, o) => s + Number(o.total_value || 0), 0),
            },
            export: {
                orders: groups.export,
                count: groups.export.length,
                totalValue: groups.export.reduce((s, o) => s + Number(o.total_value || 0), 0),
            },
        };
    };

    return {
        historyDates, loadingHistory, loadingMoreDates, hasMoreDates,
        loadMoreDates,
        openDate, ordersByDate, loadingOrdersFor, toggleDate,
        openTypeGroup, toggleTypeGroup, groupOrdersByType,
        openOrderKey, itemsByOrder, loadingItemsFor, toggleOrder,
    };
}