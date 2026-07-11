// src/components/ui/index.jsx
import Icon from "./Icon";

// ── Modal ────────────────────────────────────
export const Modal = ({ title, onClose, children, width = 680 }) => (
  <div className="fixed inset-0 bg-black/65 backdrop-blur-[4px] z-[1000] flex items-center justify-center p-4">
    <div
      className="bg-card border border-border rounded-2xl w-full max-h-[90vh] overflow-y-auto"
      style={{ maxWidth: width, boxShadow: "0 24px 80px rgba(0,0,0,.6)" }}
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <h3 className="m-0 text-[17px] font-bold text-heading">{title}</h3>
        <button
          onClick={onClose}
          className="bg-border border-none rounded-lg text-label cursor-pointer p-[6px] flex items-center hover:text-heading transition-colors duration-150"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ── Button ───────────────────────────────────
export const Btn = ({ children, onClick, color = "#6366f1", outline = false, disabled = false, style = {} }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="rounded-[9px] px-[18px] py-[9px] font-bold text-[13px] flex items-center gap-[6px] transition-opacity duration-150"
    style={{
      background: outline ? "transparent" : color,
      border: `1px solid ${color}`,
      color: outline ? color : "#fff",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style,
    }}
  >
    {children}
  </button>
);

// ── Alert Modal ───────────────────────────────
export const AlertModal = ({ message, onClose, type = "error", title }) => {
  const cfg = {
    error: { color: "#ef4444", icon: "alert", label: "Lỗi" },
    success: { color: "#10b981", icon: "check", label: "Thành công" },
    warning: { color: "#f59e0b", icon: "alert", label: "Cảnh báo" },
    info: { color: "#6366f1", icon: "search", label: "Thông tin" },
  };
  const { color, icon, label } = cfg[type] || cfg.info;
  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-[4px] z-[1100] flex items-center justify-center p-4">
      <div
        className="bg-card w-full max-w-[420px] p-7 rounded-2xl"
        style={{ border: `1px solid ${color}44`, boxShadow: "0 24px 80px rgba(0,0,0,.6)" }}
      >
        <div className="flex flex-col items-center gap-[14px] text-center">
          <div
            className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center"
            style={{ background: color + "22", color }}
          >
            <Icon name={icon} size={26} />
          </div>
          <div className="text-[16px] font-bold text-heading">{title || label}</div>
          <div className="text-sm text-label leading-relaxed whitespace-pre-line">{message}</div>
          <button
            onClick={onClose}
            className="mt-1 border-none rounded-[9px] py-[10px] px-8 text-white font-bold text-sm cursor-pointer w-full transition-opacity hover:opacity-90"
            style={{ background: color }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Confirm Modal ─────────────────────────────
export const ConfirmModal = ({ title = "Xác nhận", message, onConfirm, onCancel, confirmLabel = "Xác nhận", confirmColor = "#ef4444" }) => (
  <div className="fixed inset-0 bg-black/65 backdrop-blur-[4px] z-[1100] flex items-center justify-center p-4">
    <div
      className="bg-card border border-muted rounded-2xl w-full max-w-[420px] p-7"
      style={{ boxShadow: "0 24px 80px rgba(0,0,0,.6)" }}
    >
      <div className="flex flex-col items-center gap-[14px] text-center">
        <div className="w-[52px] h-[52px] rounded-[14px] bg-warning/[0.13] flex items-center justify-center text-warning">
          <Icon name="alert" size={26} />
        </div>
        <div className="text-[16px] font-bold text-heading">{title}</div>
        <div className="text-sm text-label leading-relaxed whitespace-pre-line">{message}</div>
        <div className="flex gap-[10px] w-full mt-1">
          <button
            onClick={onCancel}
            className="flex-1 bg-transparent border border-muted rounded-[9px] py-[10px] text-label font-semibold text-sm cursor-pointer hover:border-subtle hover:text-body transition-colors duration-150"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 border-none rounded-[9px] py-[10px] text-white font-bold text-sm cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: confirmColor }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Field ─────────────────────────────────────
export const Field = ({ label, required, children }) => (
  <div className="mb-[14px]">
    <label className="block text-[11px] font-bold text-subtle mb-[5px] tracking-[0.5px] uppercase">
      {label}{required && <span className="text-danger ml-[3px]">*</span>}
    </label>
    {children}
  </div>
);

// ── Input ─────────────────────────────────────
export const Inp = ({ style = {}, className = "", ...p }) => (
  <input
    {...p}
    className={`w-full bg-border border border-muted rounded-lg px-[11px] py-2 text-heading text-[13px] outline-none box-border placeholder:text-dim ${className}`}
    style={style}
  />
);

// ── Select ────────────────────────────────────
export const Sel = ({ children, style = {}, className = "", ...p }) => (
  <select
    {...p}
    className={`w-full bg-border border border-muted rounded-lg px-[11px] py-2 text-heading text-[13px] outline-none box-border ${className}`}
    style={{ colorScheme: "dark", ...style }}
  >
    {children}
  </select>
);

// ── Status Badge ──────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    ok: ["#10b981", "Bình thường"],
    warning: ["#f59e0b", "Sắp hết"],
    low: ["#ef4444", "Sắp hết"],
    zero: ["#475569", "Hết hàng"],
  };
  const [c, l] = map[status] || ["#6b7280", "—"];
  return (
    <span
      className="rounded-[6px] px-[10px] py-[2px] text-[11px] font-bold tracking-[0.5px]"
      style={{ background: c + "22", color: c, border: `1px solid ${c}44` }}
    >
      {l}
    </span>
  );
};

// ── Type Badge ────────────────────────────────
export const TypeBadge = ({ type }) => (
  <span
    className="rounded-[6px] px-[10px] py-[2px] text-[11px] font-bold"
    style={{
      background: type === "import" ? "#3b82f622" : "#f9731622",
      color: type === "import" ? "#3b82f6" : "#f97316",
      border: `1px solid ${type === "import" ? "#3b82f644" : "#f9731644"}`,
    }}
  >
    {type === "import" ? "↓ Nhập" : "↑ Xuất"}
  </span>
);

// ── Pagination ────────────────────────────────
export const Pagination = ({ page, totalPages, onChange }) => {
  const getPages = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const navBtn = (disabled) =>
    `min-w-[34px] h-[34px] px-[10px] rounded-[7px] border border-border bg-transparent text-subtle text-[13px] flex items-center justify-center gap-1 transition-opacity ${disabled ? "opacity-35 cursor-not-allowed" : "cursor-pointer hover:text-label"}`;

  return (
    <div className="flex gap-1 mt-4 justify-center items-center flex-wrap">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className={navBtn(page === 1)}>
        ‹ Trước
      </button>

      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={`d${i}`} className="text-dim px-1">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`min-w-[34px] h-[34px] px-[10px] rounded-[7px] border text-[13px] flex items-center justify-center cursor-pointer transition-colors duration-150 ${p === page
                ? "border-primary bg-primary text-white font-bold"
                : "border-border bg-transparent text-subtle hover:text-label"
              }`}
          >
            {p}
          </button>
        )
      )}

      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className={navBtn(page === totalPages)}>
        Sau ›
      </button>
      <span className="text-xs text-dim ml-2">Trang {page}/{totalPages}</span>
    </div>
  );
};

export { default as Icon } from "./Icon";
