// src/hooks/useExportReview.js
// Luồng "Tải Excel → Xem trước → In phiếu tìm hàng (= tạo phiếu soạn)".
// Tách từ ExportPage.jsx (dòng 183-443 bản gốc trước Phase 3, phần không
// thuộc "Đang soạn hàng") — KHÔNG đổi logic.
import { useState } from "react";
import { today, fmtDate } from "../utils/helpers";
import { exportApi } from "../services/exportService";

export function useExportReview({ showAlert, setPickSlip, onDone }) {
    const [rows, setRows] = useState([]);
    const [exportDate, setDate] = useState(today());
    const [partner, setPartner] = useState("");
    const [phase, setPhase] = useState("idle");

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = "";
        setPhase("saving");
        try {
            const data = await exportApi.parseExcel(file);
            setDate(data.export_date || today());
            setPartner(data.bookstore || "");
            const parsed = (data.items || []).map((item, idx) => ({
                idx,
                itemRefNo: item.ref_no || "",
                barcode: item.barcode,
                name: item.name,
                quantity: item.quantity,
                qtyOriginal: item.quantity,
                nhaSach: item.bookstore || data.bookstore || "",
                location: item.location_code || "",
                warehouseId: item.warehouse_id || null,
                qtyAvail: item.qty_available || 0,
                qtyOk: item.qty_ok !== false,
                notFound: item.not_found || false,
                unitPrice: item.cost_price || 0,
                warehouseCode: item.warehouse_code || "",
            }));
            setRows(parsed);
            setPhase("review");
        } catch (err) {
            showAlert("Không đọc được file: " + err.message);
            setPhase("idle");
        }
    };

    const updateQty = (idx, val) => {
        setRows(prev => prev.map((r, i) => {
            if (i !== idx) return r;
            const newQty = Math.max(1, Math.min(Number(val) || 1, r.qtyAvail));
            return { ...r, quantity: newQty, qtyOk: newQty <= r.qtyAvail };
        }));
    };

    // ── In phiếu tìm hàng = TẠO PHIẾU SOẠN (status='packing') RỒI MỚI IN ────
    const createAndPrint = async () => {
        const validRows = rows.filter(r => !r.notFound && r.qtyAvail > 0);
        if (!validRows.length) { showAlert("Không có dòng hợp lệ nào để tạo phiếu.", "warning"); return; }

        setPhase("saving");
        try {
            const uniqueRefs = [...new Set(validRows.map(r => r.itemRefNo))].sort();
            const refNo = uniqueRefs.join("-") || "EXPORT";
            const bookstores = [...new Set(validRows.map(r => r.nhaSach).filter(Boolean))];
            const bookstoreLabel = bookstores.join(", ") || partner;

            await exportApi.create({
                ref_no: refNo, export_date: exportDate,
                warehouse_id: validRows[0]?.warehouseId || 1,
                bookstore: bookstoreLabel,
                items: validRows.map(r => ({
                    ref_no: r.itemRefNo,
                    bookstore: r.nhaSach || "",
                    barcode: r.barcode,
                    quantity: r.quantity,
                    unit_price: r.unitPrice || 0,
                })),
            });

            const sorted = [...validRows].sort((a, b) => String(a.itemRefNo).localeCompare(String(b.itemRefNo), undefined, { numeric: true }));
            setPickSlip({
                date: fmtDate(exportDate),
                partner,
                warehouse: validRows[0]?.warehouseCode || "—",
                items: sorted.map(r => ({
                    itemRefNo: r.itemRefNo, nhaSach: r.nhaSach,
                    barcode: r.barcode, name: r.name,
                    quantity: r.quantity, location: r.location,
                    note: r.qtyOk ? "" : `⚠ Tồn chỉ còn ${r.qtyAvail}`,
                })),
            });

            setRows([]);
            setPhase("idle");
            if (onDone) onDone(); // gọi loadPackingBatches() từ useExportPacking
        } catch (err) {
            showAlert("Không thể tạo phiếu: " + err.message);
            setPhase("review");
        }
    };

    const warnCount = rows.filter(r => r.notFound || !r.qtyOk).length;
    const validCount = rows.filter(r => !r.notFound && r.qtyAvail > 0).length;

    return {
        rows, exportDate, partner, phase, setPhase, setRows,
        handleFile, updateQty, createAndPrint,
        warnCount, validCount,
    };
}