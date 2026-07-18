// src/pages/LoginPage.jsx
import { useState } from "react";
import { authApi } from "../services/authService";
import Icon from "../components/ui/Icon";

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: "admin", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!form.username || !form.password) { setError("Vui lòng nhập đầy đủ thông tin."); return; }
    setLoading(true); setError("");
    try {
      const data = await authApi.login(form.username, form.password);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || "Sai tên đăng nhập hoặc mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-5">
      <div className="w-full max-w-[400px]">

        {/* ── Logo ──────────────────────────────── */}
        <div className="text-center mb-9">
          <div
            className="w-14 h-14 rounded-[14px] flex items-center justify-center mx-auto mb-[14px] text-white shadow-lg"
            style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)" }}
          >
            <Icon name="warehouse" size={28} />
          </div>
          <div className="text-[24px] font-extrabold text-heading">WMS Pro</div>
          <div className="text-[13px] text-subtle mt-1">Hệ thống quản lý kho hàng</div>
        </div>

        {/* ── Login card ────────────────────────── */}
        <div
          className="bg-card border border-border rounded-2xl p-8"
          style={{ boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}
        >
          <h2 className="m-0 mb-6 text-[17px] font-bold text-heading">Đăng nhập</h2>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 bg-danger/[0.13] border border-danger/[0.27] rounded-[9px] px-[14px] py-[10px] mb-4 text-danger text-[13px]">
              <Icon name="alert" size={15} />
              {error}
            </div>
          )}

          {/* Username */}
          <div className="mb-4">
            <label className="block text-[11px] font-bold text-subtle mb-[6px] tracking-[0.5px] uppercase">
              Tài khoản
            </label>
            <input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              onKeyDown={onKey}
              placeholder="Nhập username..."
              autoComplete="username"
              className="w-full bg-border border border-muted rounded-[9px] px-[14px] py-[11px] text-heading text-sm outline-none box-border placeholder:text-dim transition-colors duration-150 focus:border-primary"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold text-subtle mb-[6px] tracking-[0.5px] uppercase">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={onKey}
                placeholder="Nhập mật khẩu..."
                autoComplete="current-password"
                className="w-full bg-border border border-muted rounded-[9px] px-[14px] py-[11px] pr-[44px] text-heading text-sm outline-none box-border placeholder:text-dim transition-colors duration-150 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                tabIndex={-1}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none text-dim hover:text-subtle cursor-pointer p-1 flex items-center transition-colors duration-150"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full border-none rounded-[9px] py-3 text-white text-[15px] font-bold transition-opacity duration-150"
            style={{
              background: "linear-gradient(135deg,#6366f1,#3b82f6)",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-[7px] h-[7px] rounded-full bg-white/60 inline-block animate-pulse" />
                Đang đăng nhập...
              </span>
            ) : "Đăng nhập"}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 text-xs text-dim">
          WMS Pro · Hệ thống quản lý nhập xuất kho
        </div>
      </div>
    </div>
  );
}
