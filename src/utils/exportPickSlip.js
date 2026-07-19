// src/utils/exportPickSlip.js
// 6 hàm helper Excel/PDF — tách từ đầu ExportPage.jsx (dòng 10-101 bản gốc
// trước Phase 3). KHÔNG đổi logic, chỉ đổi vị trí.
import * as XLSX from "xlsx";
import { today } from "./helpers";

export const downloadExportTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
        ["Ngày", "Số phiếu xuất (7 số)", "Mã hàng (barcode)", "Tên sản phẩm", "Số lượng", "Đơn giá xuất", "Nhà sách"],
        [today(), "2000001", "893500182997", "Tên sản phẩm mẫu", 5, 0, "Fahasa"],
    ]);
    ws["!cols"] = [{ wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 35 }, { wch: 12 }, { wch: 16 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Phiếu xuất");
    XLSX.writeFile(wb, "mau_phieu_xuat.xlsx");
};

export const downloadPickSlipExcel = (slip) => {
    const rows = [
        ["PHIẾU TÌM HÀNG", "", "", "", "", ""],
        ["Nhà sách:", slip.partner, "Ngày:", slip.date, "", ""],
        [""],
        ["STT", "Số phiếu xuất", "Mã hàng (Barcode)", "Tên sản phẩm", "Số lượng", "Vị trí"],
        ...slip.items.map((r, i) => [i + 1, r.itemRefNo, r.barcode, r.name, r.quantity, r.location || "—"]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 6 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 35 }, { wch: 10 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Phiếu tìm hàng");
    XLSX.writeFile(wb, `phieu_tim_hang_${slip.date}.xlsx`);
};

const loadScript = (src) => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
});

const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
};

let vnFontLoaded = false;
const registerVietnameseFont = async (doc) => {
    const [regularBuf, boldBuf] = await Promise.all([
        fetch("https://cdn.jsdelivr.net/gh/googlefonts/roboto-2@main/src/hinted/Roboto-Regular.ttf").then(r => {
            if (!r.ok) throw new Error("Không tải được font Roboto-Regular (HTTP " + r.status + ")");
            return r.arrayBuffer();
        }),
        fetch("https://cdn.jsdelivr.net/gh/googlefonts/roboto-2@main/src/hinted/Roboto-Bold.ttf").then(r => {
            if (!r.ok) throw new Error("Không tải được font Roboto-Bold (HTTP " + r.status + ")");
            return r.arrayBuffer();
        }),
    ]);
    doc.addFileToVFS("Roboto-Regular.ttf", arrayBufferToBase64(regularBuf));
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.addFileToVFS("Roboto-Bold.ttf", arrayBufferToBase64(boldBuf));
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
    vnFontLoaded = true;
};

export const downloadPickSlipPDF = async (slip) => {
    if (!window.jspdf) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    if (!window.jspdf?.jsPDF?.prototype?.autoTable) {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    if (!vnFontLoaded) await registerVietnameseFont(doc);
    else {
        await registerVietnameseFont(doc);
    }

    doc.setFontSize(16); doc.setFont("Roboto", "bold");
    doc.text("PHIẾU TÌM HÀNG / PICK SLIP", 105, 16, { align: "center" });
    doc.setFontSize(11); doc.setFont("Roboto", "normal");
    doc.text(`Kho: ${slip.warehouse}`, 14, 26);
    doc.text(`Ngày: ${slip.date}`, 14, 32);
    doc.text(`Tổng số dòng: ${slip.items.length}`, 14, 38);
    doc.setLineWidth(0.4); doc.line(14, 42, 196, 42);
    doc.autoTable({
        startY: 46,
        head: [["STT", "Số phiếu xuất", "Nhà sách", "Mã hàng", "Tên hàng", "Số lượng", "Vị trí"]],
        body: slip.items.map((r, i) => [i + 1, r.itemRefNo, r.nhaSach || "—", r.barcode, r.name, String(r.quantity), r.location || "—"]),
        styles: { font: "Roboto", fontSize: 9, cellPadding: 2.5 },
        headStyles: { font: "Roboto", fontStyle: "bold", fillColor: [99, 102, 241], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 242, 255] },
        columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 28 }, 2: { cellWidth: 18 }, 3: { cellWidth: 28 }, 4: { cellWidth: 48 }, 5: { cellWidth: 20 }, 6: { cellWidth: 25 } },
    });
    const y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9); doc.setFont("Roboto", "normal");
    doc.text("Người lấy hàng: _______________    Ký tên: _______________", 14, y);
    doc.save(`phieu_tim_hang_${slip.date}.pdf`);
};