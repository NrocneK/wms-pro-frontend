// src/hooks/useAuditLogs.js
// Tách từ Reports.jsx (dòng 20-38 bản gốc trước Phase 3) — KHÔNG đổi logic.
// Chỉ fetch khi tab "audit" được mở lần đầu (lazy), sau đó cache lại.
import { useState, useEffect } from "react";
import { auditApi } from "../services/auditService";

export function useAuditLogs(isActive) {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingAudit, setLoadingAudit] = useState(false);

    useEffect(() => {
        if (!isActive) return;
        if (auditLogs.length) return;
        let active = true;
        // eslint-disable-next-line
        setLoadingAudit(true);
        auditApi.getAll({ limit: 100 })
            .then(data => { if (active) setAuditLogs(data.items || []); })
            .catch(() => { })
            .finally(() => { if (active) setLoadingAudit(false); });
        return () => { active = false; };
    }, [isActive, auditLogs.length]);

    return { auditLogs, loadingAudit };
}