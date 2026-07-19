// src/hooks/useExportPacking.js
// Toàn bộ state + logic "Đang soạn hàng" (3 cấp: Phiếu soạn → Phiếu xuất →
// Sản phẩm). Tách từ ExportPage.jsx (dòng 195-354 bản gốc trước Phase 3) —
// KHÔNG đổi logic.
import { useState, useEffect } from "react";
import { exportApi } from "../services/exportService";
import { fmtDate } from "../utils/helpers";

export function useExportPacking({ onRefresh, showAlert, showConfirm, setPickSlip }) {
    const [packingBatches, setPackingBatches] = useState([]);
    const [loadingPacking, setLoadingPacking] = useState(true);

    const [openBatchId, setOpenBatchId] = useState(null);       // Cấp 1 đang mở
    const [batchTickets, setBatchTickets] = useState({});       // cache Cấp 2: {batchId: [...tickets]}
    const [loadingTickets, setLoadingTickets] = useState(null);

    const [openTicketKey, setOpenTicketKey] = useState(null);   // Cấp 2 đang mở, key = `${batchId}-${refNo}`
    const [ticketItems, setTicketItems] = useState({});         // cache Cấp 3: {key: [...items]}
    const [loadingItems, setLoadingItems] = useState(null);
    const [savingQty, setSavingQty] = useState(null);
    const [reprinting, setReprinting] = useState(null);

    const loadPackingBatches = () => {
        let active = true;
        setLoadingPacking(true);
        exportApi.getPacking()
            .then(data => { if (active) setPackingBatches(data || []); })
            .catch(() => { })
            .finally(() => { if (active) setLoadingPacking(false); });
        return () => { active = false; };
    };

    useEffect(() => { const cleanup = loadPackingBatches(); return cleanup; }, []); // eslint-disable-line

    // Cấp 1 → Cấp 2
    const toggleBatch = async (id) => {
        if (openBatchId === id) { setOpenBatchId(null); return; }
        setOpenBatchId(id);
        setOpenTicketKey(null); // đóng phiếu xuất con đang mở của batch cũ khi chuyển batch khác
        if (batchTickets[id]) return;
        setLoadingTickets(id);
        try {
            const tickets = await exportApi.getBatchTickets(id);
            setBatchTickets(prev => ({ ...prev, [id]: tickets || [] }));
        } catch (err) {
            showAlert("Không tải được danh sách phiếu xuất: " + err.message);
        } finally {
            setLoadingTickets(null);
        }
    };

    // Cấp 2 → Cấp 3
    const toggleTicket = async (batchId, refNo) => {
        const key = `${batchId}-${refNo}`;
        if (openTicketKey === key) { setOpenTicketKey(null); return; }
        setOpenTicketKey(key);
        if (ticketItems[key]) return;
        setLoadingItems(key);
        try {
            const items = await exportApi.getTicketItems(batchId, refNo);
            setTicketItems(prev => ({ ...prev, [key]: items || [] }));
        } catch (err) {
            showAlert("Không tải được chi tiết phiếu: " + err.message);
        } finally {
            setLoadingItems(null);
        }
    };

    // Cập nhật UI ngay khi gõ, chỉ gọi API khi rời ô nhập (onBlur)
    const updateActualQtyLocal = (key, itemId, val) => {
        setTicketItems(prev => ({
            ...prev,
            [key]: prev[key].map(it => it.id === itemId ? { ...it, quantity: val } : it),
        }));
    };

    const saveActualQty = async (itemId, val) => {
        const qty = Math.max(0, Number(val) || 0);
        setSavingQty(itemId);
        try {
            await exportApi.updateActualQuantity(itemId, qty);
        } catch (err) {
            showAlert("Lưu số lượng thất bại: " + err.message);
        } finally {
            setSavingQty(null);
        }
    };

    const confirmBatch = (batch) => {
        showConfirm(
            `Xác nhận xuất kho phiếu soạn ngày ${fmtDate(batch.export_date)} (${batch.ticket_count} phiếu xuất)?\n\nHệ thống sẽ trừ tồn kho theo số lượng thực tế đã điều chỉnh.`,
            async () => {
                try {
                    await exportApi.confirm(batch.id);
                    await onRefresh();
                    setOpenBatchId(null);
                    setOpenTicketKey(null);
                    setBatchTickets(prev => { const next = { ...prev }; delete next[batch.id]; return next; });
                    loadPackingBatches();
                    showAlert("Xuất kho thành công.", "success");
                } catch (err) { showAlert("Xác nhận thất bại: " + err.message); }
            },
            { title: "Xác nhận xuất hàng", confirmLabel: "Xác nhận xuất hàng", confirmColor: "#10b981" }
        );
    };

    const cancelBatchAction = (batch) => {
        showConfirm(
            `Hủy phiếu soạn ngày ${fmtDate(batch.export_date)} (${batch.ticket_count} phiếu xuất)?\n\nThao tác này không thể hoàn tác. Tồn kho chưa bị trừ nên hủy an toàn.`,
            async () => {
                try {
                    await exportApi.cancel(batch.id);
                    setOpenBatchId(null);
                    setOpenTicketKey(null);
                    setBatchTickets(prev => { const next = { ...prev }; delete next[batch.id]; return next; });
                    loadPackingBatches();
                    showAlert("Đã hủy phiếu soạn.", "success");
                } catch (err) { showAlert("Hủy thất bại: " + err.message); }
            },
            { title: "Hủy phiếu đang soạn", confirmLabel: "Hủy phiếu", confirmColor: "#ef4444" }
        );
    };

    const reprintBatch = async (batch) => {
        setReprinting(batch.id);
        try {
            const tickets = batchTickets[batch.id] || await exportApi.getBatchTickets(batch.id);
            if (!batchTickets[batch.id]) {
                setBatchTickets(prev => ({ ...prev, [batch.id]: tickets || [] }));
            }

            const allItems = [];
            for (const ticket of (tickets || [])) {
                const key = `${batch.id}-${ticket.ref_no}`;
                const items = ticketItems[key] || await exportApi.getTicketItems(batch.id, ticket.ref_no);
                if (!ticketItems[key]) {
                    setTicketItems(prev => ({ ...prev, [key]: items || [] }));
                }
                (items || []).forEach(it => {
                    allItems.push({
                        itemRefNo: ticket.ref_no,
                        nhaSach: ticket.bookstore,
                        barcode: it.barcode,
                        name: it.product_name,
                        quantity: it.quantity_requested,
                        location: it.location_text,
                    });
                });
            }

            if (allItems.length === 0) {
                showAlert("Phiếu soạn này không có sản phẩm nào.", "warning");
                return;
            }

            const sorted = allItems.sort((a, b) => String(a.itemRefNo).localeCompare(String(b.itemRefNo), undefined, { numeric: true }));
            setPickSlip({
                date: fmtDate(batch.export_date),
                partner: [...new Set(sorted.map(r => r.nhaSach).filter(Boolean))].join(", "),
                warehouse: batch.warehouse_code || "—",
                items: sorted,
            });
        } catch (err) {
            showAlert("Không tải được phiếu soạn: " + err.message);
        } finally {
            setReprinting(null);
        }
    };

    return {
        packingBatches, loadingPacking, loadPackingBatches,
        openBatchId, batchTickets, loadingTickets, toggleBatch,
        openTicketKey, ticketItems, loadingItems, toggleTicket,
        savingQty, updateActualQtyLocal, saveActualQty,
        reprinting, confirmBatch, cancelBatchAction, reprintBatch,
    };
}