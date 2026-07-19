// src/components/reports/AuditLogTab.jsx
// Tách từ Reports.jsx (dòng 197-267 bản gốc trước Phase 3) — KHÔNG đổi JSX.
const ACTION_CONFIG = {
    CREATE: { label: "Tạo mới", color: "#10b981" },
    UPDATE: { label: "Cập nhật", color: "#6366f1" },
    DELETE: { label: "Xóa", color: "#ef4444" },
    CONFIRM: { label: "Xác nhận", color: "#3b82f6" },
    REPLACE: { label: "Thay thế", color: "#f59e0b" },
};

export default function AuditLogTab({ auditLogs, loadingAudit }) {
    return (
        <>
            <div className="card overflow-hidden hidden wide:block">
                <table className="w-full border-collapse text-xs">
                    <thead><tr className="bg-border">
                        {["Thời gian", "Người thực hiện", "Hành động", "Đối tượng", "Mô tả"].map(h => (
                            <th key={h} className="text-left p-[10px_12px] text-label font-bold text-[10px] whitespace-nowrap">{h}</th>
                        ))}
                    </tr></thead>
                    <tbody>
                        {loadingAudit ? (
                            <tr><td colSpan={5} className="py-6 text-center text-subtle">Đang tải...</td></tr>
                        ) : auditLogs.map((log, i) => {
                            const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: "#94a3b8" };
                            return (
                                <tr key={log.id} className={`border-b border-border ${i % 2 === 0 ? "" : "bg-[#0a101a]"}`}>
                                    <td className="p-[9px_12px] text-subtle text-[11px] whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString("vi-VN")}
                                    </td>
                                    <td className="p-[9px_12px]">
                                        <div className="text-heading font-semibold text-xs">{log.full_name}</div>
                                        <div className="text-subtle text-[10px] font-mono">@{log.username}</div>
                                    </td>
                                    <td className="p-[9px_12px]">
                                        <span className="rounded-[6px] px-2 py-[2px] text-[10px] font-bold"
                                            style={{ background: cfg.color + "22", color: cfg.color, border: `1px solid ${cfg.color}44` }}>
                                            {cfg.label}
                                        </span>
                                    </td>
                                    <td className="p-[9px_12px] text-label text-[11px]">{log.entity}</td>
                                    <td className="p-[9px_12px] text-body text-xs">{log.description}</td>
                                </tr>
                            );
                        })}
                        {!loadingAudit && auditLogs.length === 0 && (
                            <tr><td colSpan={5} className="py-7 text-center text-muted">Chưa có nhật ký nào</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="wide:hidden space-y-3">
                {loadingAudit ? (
                    <div className="text-center text-subtle text-sm py-6">Đang tải...</div>
                ) : auditLogs.map((log) => {
                    const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: "#94a3b8" };
                    return (
                        <div key={log.id} className="card p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                    <div className="text-heading font-semibold text-sm">{log.full_name}</div>
                                    <div className="text-subtle text-[10px] font-mono">@{log.username}</div>
                                </div>
                                <span className="rounded-[6px] px-2 py-[2px] text-[10px] font-bold flex-shrink-0"
                                    style={{ background: cfg.color + "22", color: cfg.color, border: `1px solid ${cfg.color}44` }}>
                                    {cfg.label}
                                </span>
                            </div>
                            <div className="text-[11px] text-subtle mb-2">{new Date(log.created_at).toLocaleString("vi-VN")}</div>
                            <div className="text-xs text-label mb-1">Đối tượng: <span className="text-label font-medium">{log.entity}</span></div>
                            <div className="text-xs text-body">{log.description}</div>
                        </div>
                    );
                })}
                {!loadingAudit && auditLogs.length === 0 && (
                    <div className="text-center text-muted text-sm py-8">Chưa có nhật ký nào</div>
                )}
            </div>
        </>
    );
}