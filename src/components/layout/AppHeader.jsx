// src/components/layout/AppHeader.jsx
// Header: nút mở menu mobile, tiêu đề trang, đồng hồ realtime, badge kho,
// trạng thái loading, banner lỗi API, dropdown tài khoản.

import { useState, useRef, useEffect } from "react";
import Icon from "../ui/Icon";
import AccountModal from "./AccountModal";
import { fmtDate, today } from "../../utils/helpers";

const ROLE_LABELS_DISPLAY = {
    admin: "Quản trị viên",
    manager: "Quản lý kho",
    staff: "Nhân viên",
};

export default function AppHeader({
    pageTitle,
    user,
    setUser,
    loading,
    apiError,
    onRetry,
    onLogout,
    onOpenMobileMenu,
}) {
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!showUserMenu) return;
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showUserMenu]);

    return (
        <>
            <header
                className="
          flex-shrink-0 px-4 md:px-6 py-[14px]
          bg-surface border-b border-border
          flex items-center justify-between flex-wrap gap-y-3
        "
            >
                {/* Left: Nút mở drawer (chỉ hiện mobile) + tiêu đề trang */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onOpenMobileMenu}
                        className="
              md:hidden flex-shrink-0
              w-9 h-9 rounded-lg bg-border border-none
              text-label cursor-pointer flex items-center justify-center
              hover:bg-muted transition-colors duration-150
            "
                        title="Mở menu"
                    >
                        <Icon name="menu" size={18} />
                    </button>
                    <div>
                        <h1 className="m-0 text-xl font-extrabold text-heading leading-none">
                            {pageTitle}
                        </h1>
                        <p className="text-xs text-subtle mt-[3px] m-0">
                            <span>Hệ thống quản lý kho · {fmtDate(today())}</span>
                        </p>
                    </div>
                </div>

                {/* Right: Status indicators + User */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Đồng hồ realtime */}
                    <div className="hidden sm:flex items-center gap-2 bg-border/40 border border-border rounded-lg py-[6px] px-3">
                        <span className="w-[7px] h-[7px] rounded-full bg-success inline-block animate-pulse" />
                        <span className="font-mono text-[13px] font-semibold text-heading tabular-nums">
                            {now.toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                            })}
                        </span>
                    </div>

                    {/* Loading indicator */}
                    {loading && (
                        <div className="flex items-center gap-[6px] text-xs text-subtle">
                            <span className="w-[7px] h-[7px] rounded-full bg-primary inline-block animate-pulse" />
                            Đang tải...
                        </div>
                    )}

                    {/* Warehouse scope badge */}
                    {user?.warehouse_code && (
                        <div
                            className="
                bg-primary/[0.13] border border-primary/[0.27]
                rounded-lg py-[6px] px-3
                text-xs text-primary-light font-bold
              "
                        >
                            Kho {user.warehouse_code}
                        </div>
                    )}

                    {/* User info dropdown */}
                    <div className="relative pl-1" ref={userMenuRef}>
                        <button
                            onClick={() => setShowUserMenu((o) => !o)}
                            title="Tài khoản"
                            className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-1 rounded-lg hover:bg-white/[0.05] transition-colors duration-150"
                        >
                            <div className="text-right">
                                <div className="text-[13px] font-semibold text-heading">
                                    {user.full_name}
                                </div>
                                <div className="text-[11px] text-subtle">
                                    {ROLE_LABELS_DISPLAY[user.role] || user.role}
                                </div>
                            </div>
                            <div
                                className="
                  w-[34px] h-[34px] rounded-[9px]
                  flex items-center justify-center
                  text-sm font-extrabold text-white
                  flex-shrink-0
                "
                                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                            >
                                {user.full_name?.[0]?.toUpperCase() || "A"}
                            </div>
                            <Icon
                                name="chevron-down"
                                size={14}
                                className={`text-subtle flex-shrink-0 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`}
                            />
                        </button>

                        {showUserMenu && (
                            <div
                                className="
                  absolute right-0 top-[calc(100%+8px)] z-50
                  w-[200px] bg-card border border-border rounded-[12px]
                  overflow-hidden
                "
                                style={{ boxShadow: "0 12px 40px rgba(0,0,0,.5)" }}
                            >
                                <button
                                    onClick={() => { setShowAccountModal(true); setShowUserMenu(false); }}
                                    className="
                    w-full flex items-center gap-[10px] px-4 py-[11px]
                    bg-transparent border-none cursor-pointer
                    text-[13px] text-body font-medium text-left
                    hover:bg-white/[0.05] transition-colors duration-150
                  "
                                >
                                    <Icon name="user" size={15} className="text-subtle" />
                                    Thông tin tài khoản
                                </button>
                                <div className="border-t border-border" />
                                <button
                                    onClick={onLogout}
                                    className="
                    w-full flex items-center gap-[10px] px-4 py-[11px]
                    bg-transparent border-none cursor-pointer
                    text-[13px] text-danger font-medium text-left
                    hover:bg-danger/[0.1] transition-colors duration-150
                  "
                                >
                                    <Icon name="logout" size={15} />
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>

                    {showAccountModal && (
                        <AccountModal
                            user={user}
                            onClose={() => setShowAccountModal(false)}
                            onUpdated={(updatedUser) => setUser(updatedUser)}
                        />
                    )}
                </div>
            </header>

            {/* ── API error banner ─────────────────── */}
            {apiError && (
                <div
                    className="
            flex-shrink-0 px-6 py-[10px]
            bg-danger/[0.13] border-b border-danger/[0.27]
            flex items-center justify-between
            text-[13px] text-danger
          "
                >
                    <span className="flex items-center gap-2">
                        <Icon name="alert" size={14} />
                        {apiError}
                    </span>
                    <button
                        onClick={onRetry}
                        className="
              bg-danger border-none rounded-md
              text-white text-xs font-semibold
              px-3 py-1 cursor-pointer
              hover:opacity-90 transition-opacity
            "
                    >
                        Thử lại
                    </button>
                </div>
            )}
        </>
    );
}