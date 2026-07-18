// src/components/dashboard/ActivityChart.jsx
import { fmtDate, fmtCur } from "../../utils/helpers";

const fmtCompact = (n) => {
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + " tỷ";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + " tr";
    if (n >= 1e3) return (n / 1e3).toFixed(0) + "k";
    return String(Math.round(n));
};

const BAR_H = 130;

export default function ActivityChart({ overview, todayStr }) {
    const {
        loadingChart, last14, yMax, yTicks, totalImp14, totalExp14, rangeLabel,
        hoveredIdx, setHoveredIdx, mobileDayIndex,
        goToPrevWeek, goToNextWeek, goToThisWeek, goToPrevDay, goToNextDay,
        canGoPrevDay, canGoNextDay, weekOffset, dashData,
    } = overview;

    return (
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
                    <div className="text-xs text-label font-semibold min-w-[112px] text-center">
                        {rangeLabel ? `${fmtDate(rangeLabel.start)} – ${fmtDate(rangeLabel.end)}` : ""}
                    </div>
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
    );
}