// src/utils/syncEngine.js
// Gửi lại toàn bộ thao tác trong hàng đợi offline (IndexedDB) lên server,
// theo ĐÚNG thứ tự đã tạo — quan trọng vì nhiều lượt "+1" cộng dồn phải áp
// dụng đúng thứ tự thời gian thực tế.
//
// Mỗi action mang theo idempotencyKey sinh NGAY LÚC QUÉT (không phải lúc
// gửi) — nên nếu mạng rớt giữa lúc server đã xử lý xong nhưng response chưa
// kịp về tới máy, lần retry kế tiếp vẫn gửi ĐÚNG key đó, và server (nhờ
// bảng idempotency_keys) nhận ra đã xử lý rồi, trả lại kết quả cũ thay vì
// cộng dồn lần 2. Đây là lý do idempotencyKey phải sinh 1 lần duy nhất lúc
// tạo hành động, KHÔNG sinh mới mỗi lần gửi.
import { exportApi } from "../services/exportService";
import { getPendingActions, removePendingAction } from "./offlineDb";

// Map "loại action" -> hàm gọi API tương ứng. Thêm loại action mới (VD quét
// lúc nhập kho sau này) chỉ cần thêm 1 dòng ở đây, không phải sửa loop bên dưới.
const ACTION_HANDLERS = {
  export_scan: (action) =>
    exportApi.updateActualQuantity(action.itemId, { delta: action.delta, idempotencyKey: action.idempotencyKey }),
};

let syncing = false; // chặn 2 lượt sync chạy chồng nhau (VD sự kiện "online" bắn 2 lần liên tiếp)

/**
 * Xử lý toàn bộ hàng đợi. Trả về { synced, failed } để nơi gọi hiển thị kết quả.
 * Dừng ngay khi gặp lỗi MẠNG THẬT (giữ nguyên hàng đợi, thử lại ở lượt sau)
 * — nhưng vẫn xoá khỏi hàng đợi nếu server phản hồi rõ ràng là lỗi nghiệp vụ
 * (VD phiếu đã đóng), vì gửi lại mãi cũng sẽ không thành công.
 */
export async function syncPendingActions(onProgress) {
  if (syncing) return { synced: 0, failed: 0, skipped: true };
  syncing = true;
  let synced = 0;
  let failed = 0;
  try {
    const actions = await getPendingActions(); // đã sắp cũ->mới
    for (const action of actions) {
      const handler = ACTION_HANDLERS[action.type];
      if (!handler) {
        // Loại action không nhận diện được (VD bản build cũ hơn còn sót lại
        // hàng đợi từ 1 loại action đã bị đổi tên) — bỏ qua, không thể xử lý,
        // không nên giữ mãi trong hàng đợi.
        await removePendingAction(action.localId);
        continue;
      }
      try {
        await handler(action);
        await removePendingAction(action.localId);
        synced++;
        onProgress?.({ synced, total: actions.length });
      } catch (err) {
        if (err.isNetworkError) {
          // Lỗi mạng thật — dừng toàn bộ vòng lặp ở đây, KHÔNG xoá action này
          // hay action nào sau nó, thử lại nguyên vẹn ở lượt sync kế tiếp.
          break;
        }
        // Lỗi nghiệp vụ (400/403/404 — VD phiếu không còn ở trạng thái soạn
        // hàng nữa) — action này không thể áp dụng được nữa dù gửi lại bao
        // nhiêu lần, nên bỏ khỏi hàng đợi và ghi nhận là "failed" thay vì
        // chặn các action khác phía sau.
        await removePendingAction(action.localId);
        failed++;
      }
    }
  } finally {
    syncing = false;
  }
  return { synced, failed };
}
