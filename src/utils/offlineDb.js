// src/utils/offlineDb.js
// Lưu 1 bản sao Danh Mục Sản Phẩm vào IndexedDB (kho lưu trữ trong trình
// duyệt, không mất khi tắt tab/tắt máy, dung lượng lớn hơn localStorage
// nhiều — phù hợp lưu hàng chục nghìn dòng sản phẩm) để tra cứu được khi
// mất mạng. KHÔNG dùng để lưu số lượng tồn kho thời gian thực — số đó thay
// đổi liên tục, cache sai dễ gây nhầm lẫn nghiêm trọng hơn là không có gì.
//
// version: 2 — thêm store "pendingActions" (hàng đợi thao tác lúc mất
// mạng, VD quét mã lúc soạn hàng). IndexedDB bắt buộc tăng version mỗi khi
// đổi cấu trúc store — đây là quy ước bình thường của nó, không phải lỗi.
import { openDB } from "idb";

const DB_NAME = "wms-offline";
const DB_VERSION = 2;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    if (!db.objectStoreNames.contains("catalog")) {
      db.createObjectStore("catalog", { keyPath: "barcode" });
    }
    if (!db.objectStoreNames.contains("meta")) {
      db.createObjectStore("meta"); // lưu thời điểm đồng bộ gần nhất, dạng key-value đơn giản
    }
    if (oldVersion < 2 && !db.objectStoreNames.contains("pendingActions")) {
      db.createObjectStore("pendingActions", { keyPath: "localId", autoIncrement: true });
    }
  },
});

/**
 * Ghi đè toàn bộ catalog vào IndexedDB — gọi sau khi tải catalog mới nhất từ
 * server thành công. Dùng 1 transaction cho cả loạt ghi, nhanh hơn nhiều so
 * với gọi put() từng dòng ở ngoài transaction.
 */
export const cacheCatalog = async (products) => {
  const db = await dbPromise;
  const tx = db.transaction(["catalog", "meta"], "readwrite");
  await Promise.all(products.map((p) => tx.objectStore("catalog").put(p)));
  await tx.objectStore("meta").put(Date.now(), "catalogSyncedAt");
  await tx.done;
};

/** Tra 1 sản phẩm theo barcode trong bản cache — dùng khi gọi API thất bại do mất mạng. */
export const lookupOffline = async (barcode) => {
  const db = await dbPromise;
  return db.get("catalog", barcode.trim());
};

/** Thời điểm đồng bộ catalog gần nhất (ms, hoặc null nếu chưa đồng bộ lần nào). */
export const getCatalogSyncedAt = async () => {
  const db = await dbPromise;
  return (await db.get("meta", "catalogSyncedAt")) || null;
};

/** Tổng số sản phẩm đang có trong cache — hữu ích để hiển thị cho người dùng biết "đã lưu offline bao nhiêu mã". */
export const getCachedCatalogCount = async () => {
  const db = await dbPromise;
  return db.count("catalog");
};

// ── Hàng đợi thao tác offline ──────────────────
// Mỗi action PHẢI có idempotencyKey sinh NGAY LÚC TẠO (không phải lúc gửi) —
// xem giải thích đầy đủ trong syncEngine.js.

/** Thêm 1 thao tác vào hàng đợi — gọi khi phát hiện đang offline. */
export const queueAction = async (action) => {
  const db = await dbPromise;
  return db.add("pendingActions", { ...action, createdAt: Date.now() });
};

/** Lấy toàn bộ thao tác đang chờ, sắp theo thứ tự tạo (cũ nhất trước). */
export const getPendingActions = async () => {
  const db = await dbPromise;
  const all = await db.getAll("pendingActions");
  return all.sort((a, b) => a.createdAt - b.createdAt);
};

/** Xoá 1 thao tác khỏi hàng đợi — gọi sau khi đồng bộ thành công (hoặc server xác nhận đã xử lý). */
export const removePendingAction = async (localId) => {
  const db = await dbPromise;
  return db.delete("pendingActions", localId);
};

/** Đếm số thao tác đang chờ — dùng hiển thị badge "N thao tác chờ đồng bộ". */
export const countPendingActions = async () => {
  const db = await dbPromise;
  return db.count("pendingActions");
};
