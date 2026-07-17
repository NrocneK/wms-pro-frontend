// src/components/layout/Sidebar.jsx
import Icon from "../ui/Icon";
import { useRef, useLayoutEffect, useState } from "react";

const NAV_ALL = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "inventory", label: "Tồn kho", icon: "inventory" },
  { id: "import", label: "Nhập kho", icon: "import_" },
  { id: "export", label: "Xuất kho", icon: "export_" },
  { id: "reports", label: "Báo cáo", icon: "search" },
];
const NAV_ADMIN = { id: "users", label: "Người dùng", icon: "warehouse" };

const ROLE_CONFIG = {
  admin: { label: "Admin", color: "text-danger" },
  manager: { label: "Quản lý", color: "text-warning" },
  staff: { label: "Nhân viên", color: "text-primary" },
};

export default function Sidebar({ page, setPage, sidebarOpen, setSidebar, userRole, mobileMenuOpen = false, setMobileMenuOpen = () => { } }) {
  const nav = userRole === "admin" ? [...NAV_ALL, NAV_ADMIN] : NAV_ALL;
  const roleConf = ROLE_CONFIG[userRole] || ROLE_CONFIG.staff;
  const showLabels = sidebarOpen || mobileMenuOpen;
  const navRefs = useRef({});
  const [indicator, setIndicator] = useState({ top: 0, height: 0 });

  useLayoutEffect(() => {
    const el = navRefs.current[page];
    if (el) {
      setIndicator({ top: el.offsetTop, height: el.offsetHeight });
    }
  }, [page, sidebarOpen, mobileMenuOpen]);

  return (
    <>
      {/* Backdrop mờ phía sau drawer — chỉ hiện trên mobile khi đang mở, bấm vào để đóng */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className={`
        fixed md:static inset-y-0 left-0 z-40
        w-[220px] ${sidebarOpen ? "md:w-[220px]" : "md:w-16"}
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        flex-shrink-0 bg-surface border-r border-border
        flex flex-col transition-all duration-[250ms] overflow-hidden
      `}>

        {/* ── Logo ─────────────────────────────────────── */}
        <div className="px-4 py-5 border-b border-border flex items-center gap-[10px]">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-lg"
            style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)" }}
          >
            <Icon name="warehouse" size={18} />
          </div>
          {showLabels && (
            <div className="font-extrabold text-sm text-heading whitespace-nowrap tracking-wide">
              WMS Pro
            </div>
          )}
        </div>

        {/* ── Nav items ────────────────────────────────── */}
        <nav className="relative px-2 pt-3 flex-1">
          {/* Pill nền trượt mượt lên/xuống theo mục đang chọn */}
          <div
            className="absolute left-2 right-2 rounded-[9px] transition-all duration-300 ease-out pointer-events-none"
            style={{
              top: indicator.top,
              height: indicator.height,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
            }}
          />
          {nav.map(n => {
            const isActive = page === n.id;
            return (
              <button
                key={n.id}
                ref={el => { navRefs.current[n.id] = el; }}
                onClick={() => { setPage(n.id); setMobileMenuOpen(false); }}
                title={!showLabels ? n.label : undefined}
                className={`
        relative z-10 w-full flex items-center gap-3 px-3 py-[10px]
        rounded-[9px] border-none bg-transparent
        cursor-pointer mb-0.5 transition-colors duration-300 ease-out
        ${isActive ? "text-white" : "text-subtle hover:text-label"}
      `}
              >
                {/* Icon + alert badge */}
                <div className="flex-shrink-0 relative">
                  <Icon name={n.icon} size={18} />
                </div>

                {/* Label — fade khi collapse */}
                {showLabels && (
                  <span className={`text-[13px] whitespace-nowrap ${isActive ? "font-bold" : "font-medium"}`}>
                    {n.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Role badge ───────────────────────────────── */}
        {showLabels && (
          <div className="px-4 pb-[10px]">
            <div className="bg-border rounded-lg px-[10px] py-[6px] text-[11px] text-center">
              <span className={`font-semibold ${roleConf.color}`}>
                ● {roleConf.label}
              </span>
            </div>
          </div>
        )}

        {/* ── Collapse toggle ──────────────────────────── */}
        <button
          onClick={() => setSidebar(o => !o)}
          className="
          hidden md:flex
          mx-2 mb-4 bg-border border-none rounded-[9px] p-[10px]
          text-subtle cursor-pointer items-center justify-center
          hover:bg-muted hover:text-label transition-colors duration-200
        "
          title={sidebarOpen ? "Thu gọn" : "Mở rộng"}
        >
          <Icon name="menu" size={16} />
        </button>
      </div>
    </>
  );
}
