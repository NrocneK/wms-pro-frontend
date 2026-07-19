// src/hooks/useExcelReplace.js
// Logic "Nhập Excel — thay thế toàn bộ tồn kho". Tách từ Inventory.jsx
// (dòng 456-489 bản gốc trước Phase 3) — KHÔNG đổi logic.
// excelPreview giờ có thêm duplicate_count/duplicates/duplicates_truncated
// (backend đã bổ sung) — hook này không cần xử lý gì thêm, chỉ truyền
// nguyên object preview xuống UI.
import { useState } from "react";
import { inventoryApi } from "../services/inventoryService";

export function useExcelReplace({ onRefresh, showAlert }) {
    const [excelPhase, setExcelPhase] = useState("idle"); // idle | previewing | replacing
    const [excelPreview, setExcelPreview] = useState(null);
    const [excelFile, setExcelFile] = useState(null);

    const handleExcelFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = "";
        setExcelPhase("previewing");
        try {
            const preview = await inventoryApi.previewReplace(file);
            setExcelPreview(preview);
            setExcelFile(file);
        } catch (err) {
            showAlert("Không đọc được file: " + err.message);
            setExcelPhase("idle");
        }
    };

    const handleExcelReplace = async (onDone) => {
        if (!excelFile) return;
        setExcelPhase("replacing");
        try {
            const result = await inventoryApi.importReplace(excelFile);
            await onRefresh();
            if (onDone) onDone(); // để trang gọi setLocalRefreshKey riêng của useInventoryList
            setExcelPhase("idle");
            setExcelPreview(null);
            setExcelFile(null);
            showAlert(
                `Cập nhật thành công!\n${result.inserted} sản phẩm · Kho: ${result.warehouses?.join(", ")}`,
                "success", "Cập nhật tồn kho hoàn tất"
            );
        } catch (err) {
            showAlert("Cập nhật thất bại: " + err.message);
            setExcelPhase("idle");
        }
    };

    const closeExcelModal = () => {
        setExcelPhase("idle");
        setExcelPreview(null);
        setExcelFile(null);
    };

    return {
        excelPhase, excelPreview, excelFile,
        handleExcelFile, handleExcelReplace, closeExcelModal,
    };
}