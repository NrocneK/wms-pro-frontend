// src/hooks/useExportPacking.js
// Toàn bộ state + logic "Đang soạn hàng" (3 cấp: Phiếu soạn → Phiếu xuất →
// Sản phẩm). Tách từ ExportPage.jsx (dòng 195-354 bản gốc trước Phase 3) —
// KHÔNG đổi logic.
import { useState, useEffect } from "react";
import { exportApi } from "../services/exportService";
import { fmtDate } from "../utils/helpers";
import { useOnlineStatus } from "./useOnlineStatus";
import { queueAction } from "../utils/offlineDb";

// Mã vạch in trên sản phẩm thường là EAN-13 (12 số dữ liệu + 1 số kiểm tra) —
// hệ thống lưu 12 số, nên quét ra đủ 13 số thì cắt bỏ số cuối. Cùng quy tắc
// với ProductForm.jsx (normalizeScannedBarcode) — giữ 1 chỗ định nghĩa để
// tránh 2 nơi lệch nhau, xem ghi chú đầy đủ ở ProductForm.jsx.
const normalizeScannedBarcode = (code) => {
    const trimmed = code.trim();
    return trimmed.length === 13 ? trimmed.slice(0, -1) : trimmed;
};

export function useExportPacking({ onRefresh, showAlert, showConfirm, setPickSlip }) {
    const online = useOnlineStatus();
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
    const [scanningKey, setScanningKey] = useState(null); // tKey đang mở scanner để soạn, null = đóng

    // Quét ra 1 mã trong lúc soạn hàng (Cấp 3 đang mở) — tìm đúng dòng sản
    // phẩm khớp barcode trong phiếu xuất đang soạn, rồi CỘNG THÊM 1 vào SL
    // thực tế (giống thao tác lượm 1 đơn vị hàng, quét thêm 1 lần = +1).
    // Dùng lại NGUYÊN VẸN updateActualQtyLocal + saveActualQty bên dưới —
    // đây chính là điểm nối để Giai đoạn 3 (hàng đợi offline) sau này chỉ
    // cần thay ruột saveActualQty, không phải sửa lại chỗ gọi.
    const handlePackingScan = async (tKey, rawCode) => {
        const code = normalizeScannedBarcode(rawCode);
        const items = ticketItems[tKey] || [];
        const item = items.find((it) => it.barcode === code);
        if (!item) {
            showAlert(`Không tìm thấy mã "${code}" trong phiếu xuất này.`, "warning");
            return;
        }
        // Cập nhật giao diện ngay lập tức (lạc quan) — không đợi server, để
        // người quét thấy phản hồi tức thì kể cả khi đang mất mạng.
        const newQty = (Number(item.quantity) || 0) + 1;
        updateActualQtyLocal(tKey, item.id, newQty);

        // idempotencyKey sinh NGAY TẠI ĐÂY — 1 LẦN DUY NHẤT cho hành động
        // "quét này" — dù phải gửi lại nhiều lần sau (mất mạng, sync lại...)
        // vẫn dùng đúng key này, không sinh mới mỗi lần gửi.
        const idempotencyKey = crypto.randomUUID();
        const action = { type: "export_scan", itemId: item.id, delta: 1, idempotencyKey };

        if (!online) {
            await queueAction(action);
            showAlert(`Đã ghi nhận (chờ đồng bộ): +1 "${item.name}"`, "info");
            return;
        }
        try {
            await exportApi.updateActualQuantity(item.id, { delta: 1, idempotencyKey });
        } catch (err) {
            if (err.isNetworkError) {
                // Tưởng còn mạng nhưng thực ra vừa mất ngay lúc gửi — đưa vào
                // hàng đợi thay vì báo lỗi và làm mất thao tác của người dùng.
                await queueAction(action);
                showAlert(`Mất mạng giữa chừng — đã ghi nhận (chờ đồng bộ): +1 "${item.name}"`, "warning");
            } else {
                showAlert("Lưu số lượng thất bại: " + err.message);
            }
        }
    };

    const loadPackingBatches = () => {
        let active = true;
        setLoadingPacking(true);
        exportApi.getPacking()
            .then(data => { if (active) setPackingBatches(data || []); })
            .catch(err => { if (active) showAlert("Không tải được danh sách phiếu soạn: " + err.message); })
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
            await exportApi.updateActualQuantity(itemId, { quantity: qty });
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
        scanningKey, setScanningKey, handlePackingScan, online,
        reprinting, confirmBatch, cancelBatchAction, reprintBatch,
    };
}