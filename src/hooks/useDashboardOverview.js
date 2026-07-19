// src/hooks/useDashboardOverview.js
// Toàn bộ state + logic cho KPI cards và biểu đồ "Hoạt động 14 ngày".
// Tách từ Dashboard.jsx (dòng 38-134 bản gốc trước Phase 3) — KHÔNG đổi công thức tính.
import { useState, useEffect, useMemo } from "react";
import { dashboardApi } from "../services/dashboardService";
import { WAREHOUSES } from "../constants";

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

const WINDOW_DAYS = 14;
const LAST_IDX = WINDOW_DAYS - 1; // = 13

export function useDashboardOverview(products) {
    const totalSKU = products.length;
    const totalValue = products.reduce((s, p) => s + p.quantity * p.costPrice, 0);
    const lowStock = products.filter(p => p.status === "low" || p.status === "zero").length;
    const warnStock = products.filter(p => p.status === "warning").length;

    const [weekOffset, setWeekOffset] = useState(0);
    const [loadingChart, setLoadChart] = useState(true);
    const [dashData, setDashData] = useState({
        kpi: null, today: null, activity: [], byWarehouse: [],
        rangeStart: null, rangeEnd: null, hasOlder: false,
    });

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line
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

    const [hoveredIdx, setHoveredIdx] = useState(null);
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

    const rangeLabel = dashData.rangeStart && dashData.rangeEnd
        ? { start: dashData.rangeStart, end: dashData.rangeEnd }
        : null;

    return {
        totalSKU, totalValue, lowStock, warnStock,
        dashData, loadingChart, weekOffset,
        todayImp, todayExp,
        last14, yMax, yTicks, totalImp14, totalExp14, rangeLabel,
        hoveredIdx, setHoveredIdx,
        mobileDayIndex, LAST_IDX,
        goToPrevWeek, goToNextWeek, goToThisWeek, goToPrevDay, goToNextDay,
        canGoPrevDay, canGoNextDay,
        byWH,
    };
}