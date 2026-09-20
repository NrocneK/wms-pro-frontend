// src/hooks/useOfflineSync.js
// Tự động gọi syncEngine khi: (1) vừa có mạng lại (offline -> online), và
// (2) vừa mở app lên mà trong hàng đợi đã có sẵn thao tác từ phiên trước
// (trường hợp tắt app luôn lúc còn đang mất mạng, mở lại thì mạng đã có).
import { useEffect } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { syncPendingActions } from "../utils/syncEngine";
import { getPendingActions } from "../utils/offlineDb";

export function useOfflineSync(enabled) {
    const online = useOnlineStatus();

    useEffect(() => {
        if (!enabled || !online) return;
        // Chạy mỗi khi "online" là true — bao gồm cả lúc vừa mở app (đã có
        // mạng sẵn) lẫn lúc vừa chuyển từ mất mạng sang có mạng lại. Gọi hơi
        // thừa vài lần không sao — syncPendingActions() tự chặn chạy chồng
        // (biến `syncing` trong syncEngine.js), và hàng đợi rỗng thì gọi cũng
        // không làm gì cả.
        (async () => {
            const pending = await getPendingActions();
            if (pending.length) await syncPendingActions();
        })();
    }, [online, enabled]);
}
