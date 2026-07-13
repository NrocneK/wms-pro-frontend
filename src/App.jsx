// src/App.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { BrowserRouter, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import AccountModal from "./components/layout/AccountModal";
import Icon from "./components/ui/Icon";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import ImportPage from "./pages/ImportPage";
import ExportPage from "./pages/ExportPage";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import { authApi, inventoryApi, getToken, getTokenExp } from "./api/client";
import { today, fmtDate } from "./utils/helpers";

const ROLE_LABELS_DISPLAY = {
  admin: "Quản trị viên",
  manager: "Quản lý kho",
  staff: "Nhân viên",
};

const PAGE_TITLES = {
  dashboard: "Dashboard",
  inventory: "Tồn kho",
  import: "Nhập kho",
  export: "Xuất kho",
  reports: "Báo cáo",
  users: "Người dùng",
};

// ── Ánh xạ URL ↔ tên trang nội bộ ──────────────────
// Đây là điểm DUY NHẤT quyết định URL của từng trang — sửa ở đây nếu muốn đổi đường dẫn
const PATH_TO_PAGE = {
  "/": "dashboard",
  "/dashboard": "dashboard",
  "/inventory": "inventory",
  "/import": "import",
  "/export": "export",
  "/reports": "reports",
  "/users": "users",
};
const PAGE_TO_PATH = {
  dashboard: "/dashboard",
  inventory: "/inventory",
  import: "/import",
  export: "/export",
  reports: "/reports",
  users: "/users",
};

// Component ngoài cùng — chỉ có nhiệm vụ bọc BrowserRouter, không chứa logic gì khác.
// Tách riêng vì useNavigate/useLocation BẮT BUỘC phải gọi bên trong context của Router.
export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

function AppInner() {
  const location = useLocation();
  const navigate = useNavigate();

  // "page" giờ được SUY RA từ URL hiện tại, không còn là state độc lập nữa
  // → URL luôn là nguồn sự thật duy nhất, không còn 2 nơi lưu trạng thái trang xung đột nhau
  const page = PATH_TO_PAGE[location.pathname] || "dashboard";
  const setPage = (p) => navigate(PAGE_TO_PATH[p] || "/dashboard");

  const [user, setUser] = useState(null);
  const [authChecked, setChecked] = useState(false);
  const [products, setProducts] = useState([]);
  const [transactions, setTxns] = useState([]);
  const [sidebarOpen, setSidebar] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [reportDefaultTab, setReportDefaultTab] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [now, setNow] = useState(new Date());

  const refreshTimerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Khóa scroll nền khi drawer mobile đang mở — tránh cuộn xuyên qua lớp overlay phía sau
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // ── Load inventory ───────────────────────────
  const loadInventory = useCallback(() => {
    let active = true;
    inventoryApi
      .getAll({ limit: 500 })
      .then((data) => {
        if (!active) return;
        const mapped = (data.items || []).map((item) => ({
          id: String(item.inventory_id),
          barcode: item.barcode,
          name: item.product_name,
          quantity: item.quantity,
          location: item.location || "",
          warehouse: item.warehouse_code,
          unit: item.unit,
          minStock: item.min_stock,
          costPrice: Number(item.cost_price) || 0,
          sellPrice: Number(item.sell_price) || 0,
          status: item.status,
          zeroSince: item.zero_since || null,
          createdAt:
            item.updated_at?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          category: "Khác",
          supplier: "",
        }));
        setProducts(mapped);
      })
      .catch((err) => {
        if (!active) return;
        setApiError("Không thể tải dữ liệu tồn kho: " + err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const cleanup = loadInventory();
    return cleanup;
  }, [user, loadInventory]);

  // ── Auth handlers ────────────────────────────
  const handleLogout = useCallback(() => {
    clearTimeout(refreshTimerRef.current);
    authApi.logout();
    setUser(null);
    setProducts([]);
    setTxns([]);
  }, []);

  const scheduleTokenRefreshRef = useRef(null);

  const scheduleTokenRefresh = useCallback(
    (token) => {
      clearTimeout(refreshTimerRef.current);
      const exp = getTokenExp(token);
      if (!exp) return;
      const delay = exp - Date.now() - 5 * 60 * 1000;
      if (delay <= 0) {
        handleLogout();
        return;
      }
      refreshTimerRef.current = setTimeout(async () => {
        try {
          const data = await authApi.refresh();
          scheduleTokenRefreshRef.current(data.token);
        } catch {
          handleLogout();
        }
      }, delay);
    },
    [handleLogout]
  );

  useEffect(() => {
    scheduleTokenRefreshRef.current = scheduleTokenRefresh;
  }, [scheduleTokenRefresh]);

  const handleLogin = useCallback(
    (userData) => {
      setUser(userData);
      scheduleTokenRefresh(getToken());
    },
    [scheduleTokenRefresh]
  );

  useEffect(() => {
    const check = async () => {
      const token = getToken();
      if (token) {
        try {
          const me = await authApi.me();
          setUser(me);
          scheduleTokenRefresh(token);
        } catch {
          /* token invalid → login */
        }
      }
      setChecked(true);
    };
    check();
  }, [scheduleTokenRefresh]);

  // ── Render ───────────────────────────────────
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="flex items-center gap-3 text-subtle text-sm">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
          Đang khởi động...
        </div>
      </div>
    );
  }

  // Chưa đăng nhập → hiện LoginPage nhưng KHÔNG đổi URL — nhờ vậy sau khi đăng nhập
  // xong, người dùng tự động vào đúng trang đã bookmark/deep-link ban đầu, không cần
  // code redirect thêm.
  if (!user) return <LoginPage onLogin={handleLogin} />;

  const alertCount = products.filter(
    (p) => p.status === "low" || p.status === "zero"
  ).length;
  const pageTitle = PAGE_TITLES[page] || "WMS Pro";

  return (
    <div className="flex h-screen bg-app text-heading overflow-hidden">
      <Sidebar
        page={page}
        setPage={(p) => {
          if (p !== "reports") setReportDefaultTab(null);
          setPage(p);
        }}
        sidebarOpen={sidebarOpen}
        setSidebar={setSidebar}
        alertCount={alertCount}
        userRole={user?.role}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* ── Header ──────────────────────────── */}
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
              onClick={() => setMobileMenuOpen(true)}
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
            <div
              className="hidden sm:flex items-center gap-2 bg-border/40 border border-border rounded-lg py-[6px] px-3"
            >
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

            {/* User info */}
            <div className="flex items-center gap-2 pl-1">
              <button
                onClick={() => setShowAccountModal(true)}
                title="Tài khoản của tôi"
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
                  style={{
                    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  }}
                >
                  {user.full_name?.[0]?.toUpperCase() || "A"}
                </div>
              </button>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="
      w-[34px] h-[34px] rounded-[9px]
      flex items-center justify-center
      text-label cursor-pointer
      border-none bg-border
      hover:bg-danger/[0.15] hover:text-danger
      transition-colors duration-150
    "
              >
                <Icon name="logout" size={16} />
              </button>
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
              onClick={loadInventory}
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

        {/* ── Page content ─────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6">
          {page === "dashboard" && (
            <Dashboard
              products={products}
              transactions={transactions}
              onViewAlerts={() => {
                setReportDefaultTab("alerts");
                setPage("reports");
              }}
            />
          )}
          {page === "inventory" && (
            <Inventory
              products={products}
              onRefresh={loadInventory}
              canEdit={user?.role === "admin" || user?.role === "manager"}
              userWarehouseCode={user?.warehouse_code || null}
            />
          )}

          {/* Import/Export: luôn mounted, ẩn/hiện bằng CSS để giữ state — KHÔNG đổi
              sang <Routes>/<Route> vì cơ chế match-render sẽ unmount 2 trang này khi
              chuyển route, làm mất dữ liệu đang nhập dở. */}
          <div style={{ display: page === "import" ? "block" : "none" }}>
            <ImportPage
              transactions={transactions}
              setTransactions={setTxns}
              onRefresh={loadInventory}
              userWarehouseCode={user?.warehouse_code || null}
            />
          </div>
          <div style={{ display: page === "export" ? "block" : "none" }}>
            <ExportPage onRefresh={loadInventory} />
          </div>

          {page === "reports" && (
            <Reports
              products={products}
              transactions={transactions}
              defaultTab={reportDefaultTab}
            />
          )}
          {page === "users" && user?.role === "admin" && (
            <UserManagement currentUser={user} />
          )}
        </main>
      </div>
    </div>
  );
}
