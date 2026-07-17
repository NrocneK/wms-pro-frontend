// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import AppHeader from "./components/layout/AppHeader";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import ImportPage from "./pages/ImportPage";
import ExportPage from "./pages/ExportPage";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import { useAuth } from "./hooks/useAuth";
import { useInventory } from "./hooks/useInventory";

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

  // "page" được SUY RA từ URL hiện tại, không còn là state độc lập
  // → URL luôn là nguồn sự thật duy nhất
  const page = PATH_TO_PAGE[location.pathname] || "dashboard";
  const setPage = (p) => navigate(PAGE_TO_PATH[p] || "/dashboard");

  const { user, setUser, authChecked, handleLogin, handleLogout } = useAuth();
  const { products, loading, apiError, loadInventory } = useInventory(user);

  const [transactions, setTxns] = useState([]);
  const [sidebarOpen, setSidebar] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportDefaultTab, setReportDefaultTab] = useState(null);

  // Khóa scroll nền khi drawer mobile đang mở — tránh cuộn xuyên qua lớp overlay phía sau
  // (giữ nguyên y hệt bản gốc, kể cả cleanup function)
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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
  // xong, người dùng tự động vào đúng trang đã bookmark/deep-link ban đầu.
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
        <AppHeader
          pageTitle={pageTitle}
          user={user}
          setUser={setUser}
          loading={loading}
          apiError={apiError}
          onRetry={loadInventory}
          onLogout={handleLogout}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

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
              canEdit={user?.role === "admin" || user?.role === "manager" || (user?.role === "staff" && !!user?.warehouse_code)}
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