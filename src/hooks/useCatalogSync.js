// src/hooks/useCatalogSync.js
// Tự tải toàn bộ Danh Mục Sản Phẩm về máy (IndexedDB) khi vừa đăng nhập, và
// làm mới lại mỗi 15 phút trong lúc còn mạng — để BarcodeScannerModal/
// ProductForm vẫn tra cứu được khi mất mạng giữa chừng.
//
// KHÔNG đồng bộ số lượng tồn kho ở đây — hook này chỉ lo Danh Mục (barcode,
// tên, đơn giá, NCC), đúng ranh giới Danh mục/Tồn kho đã thống nhất từ đầu.
import { useEffect, useRef } from "react";
import { productApi } from "../services/productService";
import { cacheCatalog } from "../utils/offlineDb";

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 phút

export function useCatalogSync(enabled) {
    const timerRef = useRef(null);

    useEffect(() => {
        if (!enabled) return;

        const syncNow = async () => {
            try {
                // limit cao để lấy toàn bộ catalog trong 1 lần — chấp nhận được vì
                // đây là tác vụ nền, không chặn người dùng chờ.
                const data = await productApi.getAll({ limit: 100000 });
                const items = Array.isArray(data) ? data : data.items || [];
                if (items.length) await cacheCatalog(items);
            } catch {
                // Mất mạng hoặc lỗi server — bỏ qua, giữ nguyên bản cache cũ đang có,
                // thử lại ở lượt sync kế tiếp. Không cần báo lỗi cho người dùng vì
                // đây là đồng bộ nền, không phải thao tác họ chủ động bấm.
            }
        };

        syncNow(); // đồng bộ ngay khi vừa đăng nhập
        timerRef.current = setInterval(syncNow, SYNC_INTERVAL_MS);
        return () => clearInterval(timerRef.current);
    }, [enabled]);
}
