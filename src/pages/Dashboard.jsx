// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo, Fragment } from "react";
import Icon from "../components/ui/Icon";
import { TypeBadge } from "../components/ui";
import { today, fmtDate, fmtNum, fmtCur } from "../utils/helpers";
import { WAREHOUSES } from "../constants";
import { importApi } from "../services/importService";
import { dashboardApi } from "../services/dashboardService";

const fmtCompact = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + " tỷ";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + " tr";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "k";
  return String(Math.round(n));
};

const niceCeil = (n) => {
  if (n <= 0) return 100000;
  const magnitude = Math.pow(10, Math.floor(Math.log10(n)));
  const normalized = n / magnitude;
  let nice;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
};

const BAR_H = 130;

export default function Dashboard({ products, onViewAlerts }) {
  const totalSKU = products.length;
  const totalValue = products.reduce((s, p) => s + p.quantity * p.costPrice, 0);
  const lowStock = products.filter(p => p.status === "low" || p.status === "zero").length;
  const warnStock = products.filter(p => p.status === "warning").length;
  const todayStr = today();

  // ── Dữ liệu Dashboard theo cửa sổ 7 ngày trượt được ──────────
  const [weekOffset, setWeekOffset] = useState(0);
  const [loadingChart, setLoadChart] = useState(true);
  const [dashData, setDashData] = useState({
    kpi: null, today: null, activity: [], byWarehouse: [],
    rangeStart: null, rangeEnd: null, hasOlder: false,
  });

  useEffect(() => {
    let active = true;
    setLoadChart(true);
    dashboardApi.getOverview(weekOffset)
      .then(json => {
        if (!active) return;
        setDashData({
          kpi: json?.kpi || null,
          today: json?.today || null,
          activity: json?.activity || [],
          byWarehouse: json?.by_warehouse || [],
          rangeStart: json?.range_start || null,
          rangeEnd: json?.range_end || null,
          hasOlder: json?.has_older || false,
        });
      })
      .catch(() => { })
      .finally(() => { if (active) setLoadChart(false); });
    return () => { active = false; };
  }, [weekOffset]);

  const todayImp = dashData.today?.today_imports || 0;
  const todayExp = dashData.today?.today_exports || 0;

  const WINDOW_DAYS = 14;
  const last14 = useMemo(() => {
    if (!dashData.rangeStart) return [];
    const actMap = Object.fromEntries(
      (dashData.activity || []).map(a => [String(a.date).split("T")[0], a])
    );
    const [sy, sm, sd] = dashData.rangeStart.split("-").map(Number);
    const startDate = new Date(sy, sm - 1, sd);
    return Array.from({ length: WINDOW_DAYS }, (_, i) => {
      const dt = new Date(startDate);
      dt.setDate(dt.getDate() + i);
      const d = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      const a = actMap[d] || { import_value: 0, export_value: 0, import_count: 0, export_count: 0 };
      return {
        date: d,
        dLabel: d.slice(5),
        fullLabel: dt.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }),
        imp: Number(a.import_value) || 0,
        exp: Number(a.export_value) || 0,
        impCount: Number(a.import_count) || 0,
        expCount: Number(a.export_count) || 0,
      };
    });
  }, [dashData.activity, dashData.rangeStart]);

  const yMax = niceCeil(Math.max(...last14.map(r => Math.max(r.imp, r.exp)), 0));
  const yTicks = [yMax, yMax * 0.75, yMax * 0.5, yMax * 0.25, 0];
  const totalImp14 = last14.reduce((s, r) => s + r.imp, 0);
  const totalExp14 = last14.reduce((s, r) => s + r.exp, 0);
  const rangeLabel = dashData.rangeStart && dashData.rangeEnd
    ? `${fmtDate(dashData.rangeStart)} – ${fmtDate(dashData.rangeEnd)}`
    : "";

  const [hoveredIdx, setHoveredIdx] = useState(null);

  const LAST_IDX = WINDOW_DAYS - 1; // = 13
  const [mobileDayIndex, setMobileDayIndex] = useState(LAST_IDX);

  const goToPrevWeek = () => { setWeekOffset(w => w + 1); setMobileDayIndex(LAST_IDX); };
  const goToNextWeek = () => { setWeekOffset(w => Math.max(0, w - 1)); setMobileDayIndex(LAST_IDX); };
  const goToThisWeek = () => { setWeekOffset(0); setMobileDayIndex(LAST_IDX); };

  const goToPrevDay = () => {
    if (mobileDayIndex > 0) setMobileDayIndex(i => i - 1);
    else if (dashData.hasOlder) { setWeekOffset(w => w + 1); setMobileDayIndex(LAST_IDX); }
  };
  const goToNextDay = () => {
    if (mobileDayIndex < LAST_IDX) setMobileDayIndex(i => i + 1);
    else if (weekOffset > 0) { setWeekOffset(w => w - 1); setMobileDayIndex(0); }
  };
  const canGoPrevDay = mobileDayIndex > 0 || dashData.hasOlder;
  const canGoNextDay = mobileDayIndex < LAST_IDX || weekOffset > 0;

  const byWH = dashData.byWarehouse.length > 0
    ? dashData.byWarehouse.map(w => ({ name: w.code, count: w.sku_count, value: Number(w.stock_value) }))
    : WAREHOUSES.map(w => ({ name: w, count: 0, value: 0 }));

  const kpis = [
    { label: "Tổng SKU", value: fmtNum(dashData.kpi?.total_skus ?? totalSKU), sub: `${dashData.kpi?.total_warehouses ?? WAREHOUSES.length} kho`, icon: "inventory", c: "#6366f1" },
    { label: "Giá trị tồn", value: fmtCur(dashData.kpi?.total_stock_value ?? totalValue), sub: "Toàn hệ thống", icon: "warehouse", c: "#10b981" },
    { label: "Cảnh báo", value: fmtNum(lowStock), sub: `+${warnStock} sắp hết`, icon: "alert", c: "#ef4444", onClick: onViewAlerts },
    { label: "Nhập hôm nay", value: fmtNum(todayImp), sub: `${todayExp} phiếu xuất`, icon: "import_", c: "#3b82f6" },
  ];

  const whColors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

  // ── Lịch sử 3 cấp: Ngày → Phiếu → Sản phẩm trong phiếu ────────
  const [historyDates, setHistoryDates] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingMoreDates, setLoadingMoreDates] = useState(false);
  const [hasMoreDates, setHasMoreDates] = useState(false);

  const [openDate, setOpenDate] = useState(null);   // ngày đang mở (cấp 1→2)
  const [ordersByDate, setOrdersByDate] = useState({});     // cache cấp 2
  const [loadingOrdersFor, setLoadingOrdersFor] = useState(null);

  const [openOrderKey, setOpenOrderKey] = useState(null);   // phiếu đang mở (cấp 2→3), key = `${type}-${order_id}`
  const [itemsByOrder, setItemsByOrder] = useState({});     // cache cấp 3
  const [loadingItemsFor, setLoadingItemsFor] = useState(null);

  useEffect(() => {
    let active = true;
    dashboardApi.getHistoryDates(15, 0)
      .then(json => {
        if (!active) return;
        setHistoryDates(json?.dates || []);
        setHasMoreDates(json?.has_more || false);
      })
      .catch(() => { })
      .finally(() => { if (active) setLoadingHistory(false); });
    return () => { active = false; };
  }, []);

  const loadMoreDates = async () => {
    setLoadingMoreDates(true);
    try {
      const json = await dashboardApi.getHistoryDates(15, historyDates.length);
      setHistoryDates(prev => [...prev, ...(json?.dates || [])]);
      setHasMoreDates(json?.has_more || false);
    } catch { /* im lặng — người dùng có thể bấm lại */ }
    finally { setLoadingMoreDates(false); }
  };

  // Cấp 1 → Cấp 2: mở 1 ngày, tải danh sách phiếu (có cache)
  const toggleDate = async (date) => {
    if (openDate === date) { setOpenDate(null); setOpenOrderKey(null); return; }
    setOpenDate(date);
    setOpenOrderKey(null); // đóng phiếu đang mở của ngày cũ khi chuyển sang ngày khác
    if (ordersByDate[date]) return;
    setLoadingOrdersFor(date);
    try {
      const json = await dashboardApi.getHistoryOrders(date);
      setOrdersByDate(prev => ({ ...prev, [date]: json?.items || [] }));
    } catch {
      setOrdersByDate(prev => ({ ...prev, [date]: [] }));
    } finally {
      setLoadingOrdersFor(null);
    }
  };

  // Cấp 2 → Cấp 3: mở 1 phiếu, tải danh sách sản phẩm.
  // Import: tái sử dụng /imports/:id (đã trả về đủ items).
  // Export: PHẢI lọc thêm theo ref_no (1 export_order có thể có nhiều "mã phiếu"
  // con) nên dùng riêng dashboardApi.getExportItems, không dùng /exports/:id
  // (endpoint đó trả về TẤT CẢ items của cả phiếu, không lọc theo ref_no).
  const toggleOrder = async (order) => {
    const key = `${order.type}-${order.order_id}-${order.ref_no}`;
    if (openOrderKey === key) { setOpenOrderKey(null); return; }
    setOpenOrderKey(key);
    if (itemsByOrder[key]) return;
    setLoadingItemsFor(key);
    try {
      let data;
      if (order.type === "import") {
        data = (await importApi.getOne(order.order_id)).items || [];
      } else {
        data = await dashboardApi.getExportItems(order.order_id, order.ref_no);
      }
      setItemsByOrder(prev => ({ ...prev, [key]: data || [] }));
    } catch {
      setItemsByOrder(prev => ({ ...prev, [key]: [] }));
    } finally {
      setLoadingItemsFor(null);
    }
  };

  return (
    <div className="space-y-4">

      {/* ── KPI Cards ─────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        {kpis.map((k, i) => (
          <div
            key={i}
            onClick={k.onClick}
            className={`card card-hover p-4 md:p-[22px] relative overflow-hidden ${k.onClick ? "cursor-pointer" : "cursor-default"}`}
            title={k.onClick ? "Xem danh sách sản phẩm cần xử lý" : undefined}
          >
            <div className="absolute top-4 right-4 w-10 h-10 rounded-[10px] flex items-center justify-center"
              style={{ background: k.c + "22", color: k.c }}>
              <Icon name={k.icon} size={20} />
            </div>
            <div className="text-[10px] font-semibold text-subtle tracking-[1.5px] mb-3 uppercase">{k.label}</div>
            <div className="text-[22px] font-extrabold text-heading leading-none mb-1">{k.value}</div>
            <div className="text-xs text-subtle mt-1">{k.sub}</div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px]"
              style={{ background: `linear-gradient(90deg,${k.c},transparent)` }} />
          </div>
        ))}
      </div>

      {/* ── Charts row ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

        <div className="card p-4 md:p-[22px]">
          <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
            <div>
              <h3 className="m-0 text-[15px] font-bold text-heading">Hoạt động 14 ngày</h3>
              <p className="m-0 mt-1 text-[11px] text-subtle">Giá trị nhập/xuất đã xác nhận theo ngày</p>
            </div>

            {/* Điều hướng theo TUẦN — chỉ hiện từ 380px trở lên */}
            <div className="hidden xs:flex items-center gap-2">
              <button
                onClick={goToPrevWeek}
                disabled={!dashData.hasOlder}
                title="Tuần trước"
                className="w-7 h-7 rounded-md border border-border text-subtle text-sm flex items-center justify-center hover:text-label hover:border-muted transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              >‹</button>
              <div className="text-xs text-label font-semibold min-w-[112px] text-center">{rangeLabel}</div>
              <button
                onClick={goToNextWeek}
                disabled={weekOffset === 0}
                title="Tuần sau"
                className="w-7 h-7 rounded-md border border-border text-subtle text-sm flex items-center justify-center hover:text-label hover:border-muted transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              >›</button>
              {weekOffset !== 0 && (
                <button onClick={goToThisWeek} className="text-[11px] text-primary-light font-semibold hover:text-primary transition-colors duration-150 ml-1 whitespace-nowrap">
                  Hôm nay
                </button>
              )}
            </div>

            {/* Điều hướng theo TỪNG NGÀY — chỉ hiện dưới 380px, xem lần lượt cả 14 ngày */}
            <div className="flex xs:hidden items-center gap-2">
              <button
                onClick={goToPrevDay}
                disabled={!canGoPrevDay}
                title="Ngày trước"
                className="w-7 h-7 rounded-md border border-border text-subtle text-sm flex items-center justify-center hover:text-label hover:border-muted transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              >‹</button>
              <div className="text-xs text-label font-semibold min-w-[90px] text-center">
                {last14[mobileDayIndex]?.date === todayStr ? "Hôm nay" : fmtDate(last14[mobileDayIndex]?.date || "")}
              </div>
              <button
                onClick={goToNextDay}
                disabled={!canGoNextDay}
                title="Ngày sau"
                className="w-7 h-7 rounded-md border border-border text-subtle text-sm flex items-center justify-center hover:text-label hover:border-muted transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              >›</button>
            </div>
          </div>

          <div className="flex gap-5 text-xs mb-4 items-center flex-wrap">
            <div className="flex items-center gap-[6px]">
              <span className="w-[10px] h-[3px] rounded-full bg-info inline-block" />
              <span className="text-subtle">Nhập kho</span>
              <span className="text-info font-extrabold">{fmtCur(totalImp14)}</span>
            </div>
            <div className="flex items-center gap-[6px]">
              <span className="w-[10px] h-[3px] rounded-full bg-export inline-block" />
              <span className="text-subtle">Xuất kho</span>
              <span className="text-export font-extrabold">{fmtCur(totalExp14)}</span>
            </div>
            {loadingChart && <span className="text-dim ml-auto">Đang tải...</span>}
          </div>

          <div className="flex gap-3 items-stretch">
            <div className="flex flex-col justify-between text-right pb-5 flex-shrink-0" style={{ width: 32 }}>
              {yTicks.map((v, i) => (
                <span key={i} className="text-[10px] text-dim leading-none">{fmtCompact(v)}</span>
              ))}
            </div>

            <div className="flex-1 relative">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ bottom: 20 }}>
                {yTicks.map((_, i) => (
                  <div key={i} className={`w-full border-t ${i === yTicks.length - 1 ? "border-border" : "border-border/40"}`} />
                ))}
              </div>

              <div className="flex items-end gap-1 h-[160px] pb-5">
                {last14.map((r, i) => {
                  const isHovered = hoveredIdx === i;
                  const isDimmed = hoveredIdx !== null && !isHovered;
                  const isToday = r.date === todayStr;
                  const isMobileVisible = i === mobileDayIndex;
                  const impPx = yMax > 0 ? Math.max(Math.round((r.imp / yMax) * BAR_H), r.imp > 0 ? 3 : 0) : 0;
                  const expPx = yMax > 0 ? Math.max(Math.round((r.exp / yMax) * BAR_H), r.exp > 0 ? 3 : 0) : 0;

                  return (
                    <div
                      key={r.date}
                      className={`${isMobileVisible ? "flex" : "hidden xs:flex"} flex-col items-center gap-[6px] relative cursor-default transition-all duration-300 ease-out`}
                      style={{
                        flex: "1 1 0%",
                        opacity: isDimmed ? 0.35 : 1,
                      }}
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      {isHovered && (
                        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                          <div className="bg-surface border border-border rounded-[10px] px-4 py-3 shadow-2xl whitespace-nowrap text-xs relative">
                            <div className="text-heading font-bold text-center mb-2 capitalize">{r.fullLabel}</div>
                            <div className="flex items-center gap-3">
                              <span className="w-2 h-2 rounded-full bg-info flex-shrink-0" />
                              <span className="text-subtle">Nhập kho</span>
                              <span className="ml-auto font-extrabold text-info pl-4">{fmtCur(r.imp)}</span>
                            </div>
                            <div className="text-[10px] text-dim text-right mb-2">{r.impCount} phiếu</div>
                            <div className="flex items-center gap-3">
                              <span className="w-2 h-2 rounded-full bg-export flex-shrink-0" />
                              <span className="text-subtle">Xuất kho</span>
                              <span className="ml-auto font-extrabold text-export pl-4">{fmtCur(r.exp)}</span>
                            </div>
                            <div className="text-[10px] text-dim text-right">{r.expCount} phiếu</div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-border" />
                          </div>
                        </div>
                      )}

                      <div className="w-full flex gap-[2px] items-end" style={{ height: BAR_H }}>
                        <div
                          className="flex-1 rounded-t-[3px] min-h-[3px] transition-all duration-500"
                          style={{
                            height: impPx,
                            background: isHovered
                              ? "linear-gradient(180deg,#93c5fd,#3b82f6)"
                              : "linear-gradient(180deg,#60a5fa,#3b82f6)",
                          }}
                        />
                        <div
                          className="flex-1 rounded-t-[3px] min-h-[3px] transition-all duration-500"
                          style={{
                            height: expPx,
                            background: isHovered
                              ? "linear-gradient(180deg,#fdba74,#f97316)"
                              : "linear-gradient(180deg,#fb923c,#f97316)",
                          }}
                        />
                      </div>

                      <span className={`text-[10px] whitespace-nowrap ${isToday ? "text-primary-light font-bold" : "text-subtle"}`}>
                        {isToday ? "Hôm nay" : r.dLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {totalImp14 === 0 && totalExp14 === 0 && !loadingChart && (
            <div className="text-center text-subtle text-xs mt-1">Không có hoạt động trong khoảng thời gian này</div>
          )}
        </div>

        <div className="card p-4 md:p-[22px]">
          <h3 className="m-0 mb-4 text-[15px] font-bold text-heading">Phân bổ kho</h3>
          <div className="space-y-[14px]">
            {byWH.map((w, i) => {
              const pct = Math.round((w.count / Math.max(dashData.kpi?.total_skus ?? totalSKU, 1)) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-[5px]">
                    <span className="text-xs text-label font-semibold">{w.name}</span>
                    <span className="text-xs font-bold" style={{ color: whColors[i] }}>{fmtNum(w.count)} SKU</span>
                  </div>
                  <div className="bg-border rounded-full h-[6px] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: whColors[i] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Lịch sử giao dịch — 3 cấp: Ngày → Phiếu → Sản phẩm ── */}
      <div className="card overflow-hidden">
        <div className="flex justify-between items-center px-4 md:px-[22px] py-4 border-b border-border">
          <h3 className="m-0 text-[15px] font-bold text-heading">Lịch sử giao dịch</h3>
          <span className="text-xs text-subtle">{historyDates.length} ngày{hasMoreDates ? "+" : ""}</span>
        </div>

        {loadingHistory ? (
          <div className="py-8 text-center text-subtle text-sm">Đang tải...</div>
        ) : historyDates.length === 0 ? (
          <div className="py-8 text-center text-muted text-sm">Chưa có dữ liệu lịch sử</div>
        ) : (
          <div>
            {historyDates.map((dRow) => (
              <div key={dRow.date} className="border-b border-border last:border-b-0">

                {/* ── Cấp 1: Ngày ─────────────────────────── */}
                <button
                  onClick={() => toggleDate(dRow.date)}
                  className="w-full flex items-center justify-between flex-wrap gap-2 px-4 md:px-[22px] py-[13px] hover:bg-white/[0.02] transition-colors duration-150 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] text-subtle transition-transform duration-200 inline-block ${openDate === dRow.date ? "rotate-90" : ""}`}>▸</span>
                    <span className="text-heading font-semibold text-sm">{fmtDate(dRow.date)}</span>
                    {dRow.date === todayStr && (
                      <span className="bg-primary/[0.13] text-primary-light text-[10px] font-bold rounded-[5px] px-2 py-[2px]">Hôm nay</span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-xs">
                    <div className="text-right">
                      <div className="text-export font-semibold">↑ {dRow.export_count} xuất</div>
                      <div className="text-export/70 font-mono text-[11px]">{fmtCur(dRow.export_value)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-info font-semibold">↓ {dRow.import_count} nhập</div>
                      <div className="text-info/70 font-mono text-[11px]">{fmtCur(dRow.import_value)}</div>
                    </div>
                  </div>
                </button>

                {/* ── Cấp 2: Danh sách phiếu của ngày đó ──── */}
                {openDate === dRow.date && (
                  <div className="border-t border-border bg-black/20">
                    {loadingOrdersFor === dRow.date ? (
                      <div className="text-center text-subtle text-xs py-4">Đang tải...</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr>
                              <th className="w-7" />
                              {["Mã phiếu", "Loại", "Kho", "Giá trị", "Người xử lý"].map(h => (
                                <th key={h} className="text-left p-[7px_10px] text-subtle font-semibold text-[10px]">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(ordersByDate[dRow.date] || []).map((o) => {
                              const key = `${o.type}-${o.order_id}-${o.ref_no}`;
                              const isOpenOrder = openOrderKey === key;
                              const items = itemsByOrder[key];
                              return (
                                <Fragment key={key}>
                                  {/* ── Cấp 2 row: 1 phiếu ── */}
                                  <tr
                                    onClick={() => toggleOrder(o)}
                                    className="border-t border-border/50 cursor-pointer hover:bg-white/[0.02] transition-colors duration-150"
                                  >
                                    <td className="p-[7px_10px] text-center">
                                      <span className={`text-[9px] text-dim inline-block transition-transform duration-200 ${isOpenOrder ? "rotate-90" : ""}`}>▸</span>
                                    </td>
                                    <td className="p-[7px_10px] font-mono font-bold" style={{ color: o.type === "import" ? "#3b82f6" : "#f97316" }}>{o.ref_no}</td>
                                    <td className="p-[7px_10px]"><TypeBadge type={o.type} /></td>
                                    <td className="p-[7px_10px] text-label">{o.warehouse_code}</td>
                                    <td className="p-[7px_10px] font-bold" style={{ color: o.type === "import" ? "#3b82f6" : "#f97316" }}>{fmtCur(o.total_value)}</td>
                                    <td className="p-[7px_10px] text-body">{o.created_by_name || "—"}</td>
                                  </tr>

                                  {/* ── Cấp 3: Danh sách sản phẩm trong phiếu ── */}
                                  {isOpenOrder && (
                                    <tr>
                                      <td colSpan={6} className="p-0">
                                        <div className="bg-app/60 mx-2 mb-2 px-4 py-3 rounded-lg border border-border/50">
                                          {loadingItemsFor === key ? (
                                            <div className="text-center text-subtle text-xs py-2">Đang tải sản phẩm...</div>
                                          ) : (
                                            <div className="overflow-x-auto">
                                              <table className="w-full border-collapse text-[11px]">
                                                <thead>
                                                  <tr>
                                                    {["#", "Barcode", "Tên sản phẩm", "SL", ...(o.type === "export" ? ["Nhà sách"] : [])].map(h => (
                                                      <th key={h} className="text-left p-[5px_8px] text-dim font-semibold">{h}</th>
                                                    ))}
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {(items || []).map((it, idx) => (
                                                    <tr key={idx} className="border-t border-border/30">
                                                      <td className="p-[5px_8px] text-subtle">{idx + 1}</td>
                                                      <td className="p-[5px_8px] font-mono text-primary">{it.barcode}</td>
                                                      <td className="p-[5px_8px] text-body">{it.product_name}</td>
                                                      <td className="p-[5px_8px] text-success font-semibold">{fmtNum(it.quantity)}</td>
                                                      {o.type === "export" && <td className="p-[5px_8px] text-label">{it.bookstore || "—"}</td>}
                                                    </tr>
                                                  ))}
                                                  {(items || []).length === 0 && (
                                                    <tr><td colSpan={o.type === "export" ? 5 : 4} className="p-2 text-center text-muted">Không có dữ liệu</td></tr>
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              );
                            })}
                            {(ordersByDate[dRow.date] || []).length === 0 && (
                              <tr><td colSpan={6} className="p-3 text-center text-muted">Không có dữ liệu</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {hasMoreDates && (
              <div className="p-3 text-center border-t border-border">
                <button
                  onClick={loadMoreDates}
                  disabled={loadingMoreDates}
                  className="text-xs text-primary-light font-semibold hover:text-primary transition-colors duration-150 disabled:opacity-50"
                >
                  {loadingMoreDates ? "Đang tải..." : "Tải thêm ngày ▾"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}