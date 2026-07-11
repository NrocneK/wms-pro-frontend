// src/pages/ImportPage.jsx
import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import Icon from "../components/ui/Icon";
import { Btn } from "../components/ui";
import { today, fmtDate, fmtCur } from "../utils/helpers";
import { API_BASE } from "../constants";
import { WAREHOUSES } from "../constants";
import { importApi, getToken } from "../api/client";

const downloadTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ["Ngày", "Số phiếu nhập (7 số)", "Mã hàng (barcode)", "Tên sản phẩm", "Số lượng", "Đơn giá nhập"],
    [today(), "1000001", "893500182997", "Tên sản phẩm mẫu", 10, 0],
  ]);
  ws["!cols"] = [{ wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 35 }, { wch: 12 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Phiếu nhập");
  XLSX.writeFile(wb, "mau_phieu_nhap.xlsx");
};

export default function ImportPage({ onRefresh, userWarehouseCode = null }) {
  const [rows, setRows] = useState([]);

  const [importDate, setDate] = useState(today());
  const [phase, setPhase] = useState("idle"); // idle | review | saving | done
  const [error, setError] = useState("");
  const [createdCount, setCreatedCount] = useState(0);
  const fileRef = useRef();
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWHId, setSelectedWHId] = useState(null);

  useEffect(() => {
    if (phase !== "done") return;
    const timer = setTimeout(() => setPhase("idle"), 5000);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    fetch(`${API_BASE}/v1/warehouses`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(json => {
        const whs = json.data || [];
        setWarehouses(whs);
        if (whs.length > 0) {
          // Ưu tiên kho của user đang đăng nhập, fallback về kho đầu tiên
          const userWH = userWarehouseCode
            ? whs.find(w => w.code === userWarehouseCode)
            : null;
          setSelectedWHId(userWH ? userWH.id : whs[0].id);
        }
      })
      .catch(() => { });
  }, [userWarehouseCode]);

  const handleFile = async (e) => {
    setError("");
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setPhase("saving");
    try {
      const data = await importApi.parseExcel(file);
      setDate(data.import_date || today());
      const parsed = (data.items || []).map((item, idx) => ({
        idx,
        refNo: item.ref_no || data.ref_no || "",
        barcode: item.barcode,
        name: item.name,
        quantity: item.quantity,
        location: item.location_code || "",
        warehouse: item.warehouse_name || WAREHOUSES[0],
        warehouseId: item.warehouse_id || null,
        locationId: item.location_id || null,
        isNew: item.is_new || false,
        unitPrice: item.is_new ? (item.unit_price || 0) : (item.cost_price || 0),
      }));
      setRows(parsed);
      setPhase("review");
    } catch (err) {
      setError("Không đọc được file: " + err.message);
      setPhase("idle");
    }
  };

  const updateRow = (idx, field, val) =>
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));

  const hasErrors = rows.some(r => r.isNew && !r.location.trim());

  const confirmImport = async () => {
    if (hasErrors) { setError("Vui lòng điền vị trí cho các sản phẩm mới."); return; }
    setPhase("saving");
    setError("");
    try {
      const result = await importApi.create({
        import_date: importDate,
        warehouse_id: selectedWHId || rows[0]?.warehouseId || 1,
        items: rows.map(r => ({
          ref_no: r.refNo,
          barcode: r.barcode,
          name: r.name,
          quantity: r.quantity,
          location_id: r.locationId || null,
          location_text: r.location,
          unit_price: r.unitPrice || 0,
        })),
      });
      for (const order of result.orders) {
        await importApi.confirm(order.order_id);
      }
      setCreatedCount(result.count);
      await onRefresh();
      setRows([]);
      setPhase("done");
    } catch (err) {
      setError("Không thể xác nhận nhập kho: " + err.message);
      setPhase("review");
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────── */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h2 className="m-0 text-lg font-extrabold text-heading">Nhập kho</h2>
          <p className="m-0 mt-1 text-[13px] text-subtle">
            Tải file Excel → Xem trước & đối chiếu vị trí → Xác nhận nhập kho
          </p>
        </div>
        <div className="flex gap-2">

          {phase === "review" && (
            <Btn onClick={() => { setPhase("idle"); setRows([]); setError(""); }} color="#334155" outline>
              <Icon name="close" size={15} /> Hủy
            </Btn>
          )}
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />

      {/* ── Error banner ─────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 bg-danger/[0.13] border border-danger/[0.27] rounded-[10px] px-4 py-3 text-danger text-[13px]">
          <Icon name="alert" size={15} /> {error}
        </div>
      )}

      {/* ── IDLE: drop zone ──────────────────────── */}
      {phase === "idle" && (
        <div className="card border-2 border-dashed border-muted rounded-2xl p-6 md:p-12 text-center">
          <div className="w-14 h-14 rounded-[14px] bg-info/[0.13] flex items-center justify-center mx-auto mb-4 text-info">
            <Icon name="upload" size={28} />
          </div>
          <div className="text-base font-bold text-heading mb-2">Chọn file Excel phiếu nhập</div>
          <div className="text-[13px] text-subtle mb-5">
            Cột yêu cầu: <strong className="text-label">Ngày · Số phiếu nhập · Mã hàng · Tên sản phẩm · Số lượng · Đơn giá</strong>
          </div>
          <div className="flex gap-[10px] justify-center flex-wrap">
            <Btn onClick={() => fileRef.current.click()} color="#3b82f6" style={{ padding: "11px 26px" }}>
              <Icon name="upload" size={16} /> Chọn file
            </Btn>
            <Btn onClick={downloadTemplate} color="#334155" outline style={{ padding: "11px 22px" }}>
              <Icon name="excel" size={16} /> Tải file mẫu
            </Btn>
          </div>
        </div>
      )}

      {/* ── SAVING: loading state ────────────────── */}
      {phase === "saving" && (
        <div className="card rounded-xl p-7 text-center">
          <div className="flex items-center justify-center gap-2 text-primary text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
            Đang xử lý...
          </div>
          <div className="text-subtle text-xs mt-2">Vui lòng chờ trong giây lát</div>
        </div>
      )}

      {/* ── DONE: success banner ─────────────────── */}
      {phase === "done" && (
        <div className="flex items-center gap-3 bg-success/[0.13] border border-success/[0.27] rounded-xl px-6 py-5">
          <Icon name="check" size={22} className="text-success flex-shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-success text-[15px]">
              Nhập kho thành công — {createdCount} phiếu đã được ghi nhận.
            </div>
            <div className="text-[13px] text-success/70 mt-1">Dữ liệu đã được lưu vào hệ thống.</div>
          </div>
          <Btn onClick={() => { setPhase("idle"); setError(""); }} color="#3b82f6">
            <Icon name="upload" size={15} /> Tải phiếu mới
          </Btn>
        </div>
      )}

      {/* ── REVIEW: summary + table ──────────────── */}
      {phase === "review" && (
        <div>
          {/* Summary bar */}
          <div className="bg-border rounded-[10px] px-[18px] py-[14px] mb-4 flex gap-6 flex-wrap items-center">
            <div className="text-[13px] text-subtle">
              Ngày: <strong className="text-heading">{fmtDate(importDate)}</strong>
            </div>
            <div className="text-[13px] text-subtle">
              Số sản phẩm: <strong className="text-heading">{rows.length}</strong>
            </div>
            <div className="text-[13px] text-subtle">
              Số phiếu nhập: <strong className="text-info">{new Set(rows.map(r => r.refNo)).size}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-subtle">Nhập vào kho:</span>
              <select
                value={selectedWHId || ""}
                onChange={e => setSelectedWHId(Number(e.target.value))}
                className="bg-card border border-primary rounded-[6px] px-3 py-[5px] text-heading text-[13px] font-bold outline-none"
                style={{ colorScheme: "dark" }}
              >
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.code} — {w.name}</option>)}
              </select>
            </div>
            <div className="text-[13px] text-subtle">
              Sản phẩm mới: <strong className="text-warning">{rows.filter(r => r.isNew).length}</strong>
            </div>
            <div className="text-[13px] text-subtle">
              Tổng: <strong className="text-success">
                {fmtCur(rows.reduce((s, r) => s + (r.quantity * (r.unitPrice || 0)), 0))}
              </strong>
            </div>
            <Btn onClick={confirmImport} color="#10b981" disabled={hasErrors} style={{ marginLeft: "auto" }}>
              <Icon name="check" size={15} /> Xác nhận nhập kho
            </Btn>
          </div>

          {/* Review table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-border">
                    {["#", "Mã phiếu", "Barcode", "Tên sản phẩm", "SL nhập", "Đơn giá", "Thành tiền", "Kho", "Vị trí", "Trạng thái"].map(h => (
                      <th key={h} className="p-[10px_12px] text-label font-bold text-[10px] tracking-[0.5px] text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-border ${row.isNew ? "bg-warning/[0.03]" : i % 2 === 0 ? "" : "bg-[#0a101a]"
                        }`}
                    >
                      {/* STT */}
                      <td className="p-[8px_12px] text-subtle">{i + 1}</td>

                      {/* Mã phiếu */}
                      <td className="p-[8px_12px] font-mono text-info font-bold text-[11px]">
                        {row.refNo || "—"}
                      </td>

                      {/* Barcode */}
                      <td className="p-[8px_12px] font-mono text-primary font-bold">{row.barcode}</td>

                      {/* Tên sản phẩm */}
                      <td className="p-[8px_12px] max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {row.isNew
                          ? <span className="text-warning">✦ {row.name || "(mã mới)"}</span>
                          : <span className="text-body">{row.name}</span>}
                      </td>

                      {/* SL nhập — editable */}
                      <td className="p-[4px_8px]">
                        <input
                          type="number" min={1} value={row.quantity}
                          onChange={e => updateRow(i, "quantity", Math.max(1, Number(e.target.value)))}
                          className="bg-border border border-muted rounded-[6px] px-2 py-[5px] text-success text-xs font-bold text-center outline-none w-[72px]"
                        />
                      </td>

                      {/* Đơn giá */}
                      <td className="p-[9px_12px] text-right text-xs" style={{ color: row.unitPrice > 0 ? "#94a3b8" : "#334155" }}>
                        {row.unitPrice > 0 ? fmtCur(row.unitPrice) : "—"}
                        {row.is_new && row.unitPrice > 0 && (
                          <div className="text-[10px] text-warning mt-[2px]">từ file</div>
                        )}
                      </td>

                      {/* Thành tiền */}
                      <td className={`p-[8px_12px] font-bold text-right ${(row.unitPrice || 0) > 0 ? "text-success" : "text-muted"}`}>
                        {(row.unitPrice || 0) > 0 ? fmtCur(row.quantity * (row.unitPrice || 0)) : "—"}
                      </td>

                      {/* Kho */}
                      <td className="p-[8px_12px]">
                        <span className="bg-primary/[0.13] text-primary-light rounded-[6px] px-[10px] py-[4px] text-xs font-bold">
                          {warehouses.find(w => w.id === selectedWHId)?.code || "—"}
                        </span>
                      </td>

                      {/* Vị trí — editable */}
                      <td className="p-[4px_8px]">
                        <input
                          type="text"
                          value={row.location}
                          onChange={e => updateRow(i, "location", e.target.value)}
                          placeholder={row.isNew ? "Bắt buộc" : "Tuỳ chọn"}
                          className="rounded-[6px] px-[9px] py-[5px] text-heading text-xs font-mono outline-none w-[130px]"
                          style={{
                            background: row.isNew && !row.location.trim() ? "rgba(239,68,68,.08)" : "#1e293b",
                            border: `1px solid ${row.isNew && !row.location.trim() ? "#ef4444" : "#334155"}`,
                          }}
                        />
                      </td>

                      {/* Trạng thái */}
                      <td className="p-[8px_12px]">
                        {row.isNew
                          ? <span className="bg-warning/[0.13] text-warning border border-warning/[0.27] rounded-[6px] px-[9px] py-[2px] text-[10px] font-bold">MỚI</span>
                          : <span className="bg-success/[0.13] text-success border border-success/[0.27] rounded-[6px] px-[9px] py-[2px] text-[10px] font-bold">CÓ SẴN</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {hasErrors && (
            <div className="flex items-center gap-[6px] text-xs text-warning mt-2">
              <Icon name="alert" size={13} />
              Sản phẩm mới (viền đỏ) bắt buộc điền vị trí.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
