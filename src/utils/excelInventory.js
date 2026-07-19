// src/utils/excelInventory.js
// 2 hàm liên quan Excel — tách từ đầu Inventory.jsx (dòng 11-63 bản gốc trước Phase 3).
// KHÔNG đổi logic, chỉ đổi vị trí.
import * as XLSX from "xlsx";
import { WAREHOUSES } from "../constants";
import { inventoryApi } from "../services/inventoryService";

export const downloadInventoryTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
        ["Barcode", "Tên sản phẩm", "Số lượng", "Vị trí", "Kho", "Giá vốn"],
        ["893500182997", "Tên sản phẩm mẫu", 100, "C2.3", WAREHOUSES[0], 15000],
    ]);
    ws["!cols"] = [{ wch: 20 }, { wch: 35 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tồn kho");
    XLSX.writeFile(wb, "mau_ton_kho.xlsx");
};

// Download dữ liệu tồn kho
export const exportInventoryToExcel = async ({ search, filterWH, showAlert, setExporting }) => {
    setExporting(true);
    try {
        const params = { page: 1, limit: 10000 };
        if (search.trim()) params.search = search.trim();
        if (filterWH !== "all") params.warehouse_code = filterWH;

        const data = await inventoryApi.getAll(params);
        const items = data.items || [];

        if (items.length === 0) {
            showAlert("Không có dữ liệu để xuất.", "warning");
            return;
        }

        const rows = items.map(item => ({
            "Barcode": item.barcode,
            "Tên sản phẩm": item.product_name,
            "Số lượng": item.quantity,
            "Vị trí": item.location || "",
            "Kho": item.warehouse_code,
            "Giá vốn": Number(item.cost_price) || 0,
            "Giá trị tồn kho": item.quantity * (Number(item.cost_price) || 0),
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        ws["!cols"] = [
            { wch: 20 }, { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 16 },
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Tồn kho");

        const now = new Date();
        const dateStr = `${now.getDate()}_${now.getMonth() + 1}_${now.getFullYear()}`;
        XLSX.writeFile(wb, `ton_kho_${dateStr}.xlsx`);
    } catch (err) {
        showAlert("Xuất file thất bại: " + err.message);
    } finally {
        setExporting(false);
    }
};