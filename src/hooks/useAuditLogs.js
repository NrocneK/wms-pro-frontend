// src/hooks/useAuditLogs.js
// Chỉ fetch khi tab "audit" được mở lần đầu (lazy), sau đó cache lại.
import { useState, useEffect, useRef } from "react";
import { auditApi } from "../services/auditService";

export function useAuditLogs(isActive) {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingAudit, setLoadingAudit] = useState(false);
    const [auditError, setAuditError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    // Dùng ref (không phải auditLogs.length) để biết "đã tải thành công lần
    // nào chưa" — tránh vòng lặp cache bị hỏng nếu user bấm "Thử lại" nhiều lần.
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (!isActive) return;
        if (hasFetchedRef.current) return; // đã tải thành công trước đó — dùng cache, không gọi lại API
        let active = true;
        setLoadingAudit(true);
        setAuditError("");
        auditApi.getAll({ limit: 100 })
            .then(data => {
                if (!active) return;
                setAuditLogs(data.items || []);
                hasFetchedRef.current = true;
            })
            .catch(err => { if (active) setAuditError("Không tải được nhật ký thao tác: " + err.message); })
            .finally(() => { if (active) setLoadingAudit(false); });
        return () => { active = false; };
    }, [isActive, reloadKey]);

    const retryAudit = () => {
        hasFetchedRef.current = false; // buộc effect chạy lại dù isActive không đổi
        setReloadKey(k => k + 1);
    };

    return { auditLogs, loadingAudit, auditError, retryAudit };
}