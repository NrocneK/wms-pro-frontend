// src/utils/excelImport.js
// Tách từ đầu ImportPage.jsx (dòng 12-21 bản gốc) — KHÔNG đổi logic.
import * as XLSX from "xlsx";
import { today } from "./helpers";

export const downloadImportTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
        ["Ngày", "Số phiếu nhập (7 số)", "Mã hàng (barcode)", "Tên sản phẩm", "Số lượng", "Đơn giá nhập"],
        [today(), "1000001", "893500182997", "Tên sản phẩm mẫu", 10, 0],
    ]);
    ws["!cols"] = [{ wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 35 }, { wch: 12 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Phiếu nhập");
    XLSX.writeFile(wb, "mau_phieu_nhap.xlsx");
};