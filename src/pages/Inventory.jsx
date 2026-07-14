// src/pages/Inventory.jsx
import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import Icon from "../components/ui/Icon";
import { Btn, Field, Inp, Sel, Modal, Pagination, AlertModal, ConfirmModal } from "../components/ui";
import { fmtNum, fmtCur, fmtCompact } from "../utils/helpers";
import { WAREHOUSES, UNITS } from "../constants";
import { inventoryApi } from "../api/client";

const downloadInventoryTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ["Barcode", "Tên sản phẩm", "Số lượng", "Vị trí", "Kho", "Giá vốn"],
    ["893500182997", "Tên sản phẩm mẫu", 100, "C2.3", WAREHOUSES[0], 15000],
  ]);
  ws["!cols"] = [{ wch: 20 }, { wch: 35 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tồn kho");
  XLSX.writeFile(wb, "mau_ton_kho.xlsx");
};

// Download dữ liệu tồn kho
const exportInventoryToExcel = async ({ search, filterWH, showAlert, setExporting }) => {
  setExporting(true);
  try {
    const params = { page: 1, limit: 10000 };
    if (search.trim()) params.search = search.trim();
    if (filterWH !== "all") params.warehouse_code = filterWH;

    const data = await inventoryApi.getAll(params);
    const items = data.items || [];

    if (items.length === 0) {
      showAlert("Không có dữ liệu để xuất.", "warning");
      return;
    }

    const rows = items.map(item => ({
      "Barcode": item.barcode,
      "Tên sản phẩm": item.product_name,
      "Số lượng": item.quantity,
      "Vị trí": item.location || "",
      "Kho": item.warehouse_code,
      "Giá vốn": Number(item.cost_price) || 0,
      "Giá trị tồn kho": item.quantity * (Number(item.cost_price) || 0),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 20 }, { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 16 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tồn kho");

    const now = new Date();
    const dateStr = `${now.getDate()}_${now.getMonth() + 1}_${now.getFullYear()}`;
    XLSX.writeFile(wb, `ton_kho_${dateStr}.xlsx`);
  } catch (err) {
    showAlert("Xuất file thất bại: " + err.message);
  } finally {
    setExporting(false);
  }
};

// ── ProductForm modal ─────────────────────────
function ProductForm({ initial, onClose, onSave }) {
  const [f, setF] = useState({
    barcode: initial?.barcode || "",
    name: initial?.name || "",
    unit: initial?.unit || UNITS[0],
    quantity: initial?.quantity || 0,
    minStock: initial?.minStock || 5,
    costPrice: initial?.costPrice || 0,
    sellPrice: initial?.sellPrice || 0,
    warehouse: initial?.warehouse || WAREHOUSES[0],
    location: initial?.location || "",
    supplier: initial?.supplier || "",
  });
  const s = (k, v) => setF(x => ({ ...x, [k]: v }));

  return (
    <Modal title={initial ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"} onClose={onClose} width={680}>
      <div className="grid grid-cols-2 gap-x-5">
        <Field label="Barcode" required>
          <Inp value={f.barcode} onChange={e => s("barcode", e.target.value)} placeholder="Nhập mã barcode..." />
        </Field>
        <Field label="Đơn vị">
          <Sel value={f.unit} onChange={e => s("unit", e.target.value)}>
            {UNITS.map(u => <option key={u}>{u}</option>)}
          </Sel>
        </Field>
        <Field label="Tên sản phẩm" required>
          <Inp value={f.name} onChange={e => s("name", e.target.value)} placeholder="Nhập tên sản phẩm..." />
        </Field>
        <Field label="Kho">
          <Sel value={f.warehouse} onChange={e => s("warehouse", e.target.value)}>
            {WAREHOUSES.map(w => <option key={w}>{w}</option>)}
          </Sel>
        </Field>
        <Field label="Số lượng" required>
          <Inp type="number" value={f.quantity} onChange={e => s("quantity", Number(e.target.value))} min={0} />
        </Field>
        <Field label="Tồn tối thiểu">
          <Inp type="number" value={f.minStock} onChange={e => s("minStock", Number(e.target.value))} min={0} />
        </Field>
        <Field label="Giá vốn">
          <Inp type="number" value={f.costPrice} onChange={e => s("costPrice", Number(e.target.value))} min={0} />
        </Field>
        <Field label="Giá bán">
          <Inp type="number" value={f.sellPrice} onChange={e => s("sellPrice", Number(e.target.value))} min={0} />
        </Field>
      </div>
      <Field label="Vị trí">
        <Inp value={f.location} onChange={e => s("location", e.target.value)} placeholder="Vd: C2.3, E1.4, 1030..." />
      </Field>
      <Field label="Nhà cung cấp">
        <Inp value={f.supplier} onChange={e => s("supplier", e.target.value)} placeholder="Tên hoặc mã NCC..." />
      </Field>
      <div className="flex gap-[10px] justify-end mt-2">
        <Btn onClick={onClose} color="#334155" outline>Hủy</Btn>
        <Btn onClick={() => {
          if (!f.barcode || !f.name) { alert("Vui lòng nhập Barcode và tên sản phẩm."); return; }
          onSave(f);
        }}>
          {initial ? "Lưu thay đổi" : "Thêm sản phẩm"}
        </Btn>
      </div>
    </Modal>
  );
}

// ── Main Inventory page ───────────────────────
export default function Inventory({ onRefresh, canEdit = false, refreshKey = 0, userWarehouseCode = null }) {
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [filterWH, setFWH] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [page, setPage] = useState(1);
  const [alertModal, setAlert] = useState(null);
  const [confirmModal, setConfirm] = useState(null);
  const [excelPhase, setExcelPhase] = useState("idle");
  const [exporting, setExporting] = useState(false);
  const [excelPreview, setExcelPreview] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const excelRef = useRef();
  const PER = 20;
  const [apiItems, setApiItems] = useState([]);
  const [apiTotal, setApiTotal] = useState(0);
  const [apiLoading, setApiLoading] = useState(false);
  const searchDebounceRef = useRef(null);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const showAlert = (message, type = "error", title) => setAlert({ message, type, title });
  const showConfirm = (message, onConfirm, opts = {}) => setConfirm({ message, onConfirm, ...opts });

  // Fetch từ API mỗi khi search/filterWH/page thay đổi
  useEffect(() => {
    let active = true;
    setApiLoading(true);
    const params = { page, limit: PER };
    if (search.trim()) params.search = search.trim();
    if (filterWH !== "all") params.warehouse_code = filterWH;
    inventoryApi.getAll(params)
      .then(data => {
        if (!active) return;
        const mapped = (data.items || []).map(item => ({
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
          createdAt: item.updated_at?.split("T")[0] || "",
          category: "Khác",
          supplier: "",
        }));
        setApiItems(mapped);
        setApiTotal(data.pagination?.total || 0);
      })
      .catch(() => { })
      .finally(() => { if (active) setApiLoading(false); });
    return () => { active = false; };
  }, [search, filterWH, page, refreshKey, localRefreshKey]);

  useEffect(() => { setSelectedIds(new Set()); }, [search, filterWH]);

  const paged = apiItems;
  const totalPages = Math.ceil(apiTotal / PER);

  const handleDelete = (id, name) => {
    showConfirm(
      `Xác nhận xóa sản phẩm "${name}"?\n\nHành động này không thể hoàn tác.`,
      async () => {
        try {
          await inventoryApi.remove(id);
          await onRefresh();
          setLocalRefreshKey(k => k + 1);
          showAlert("Đã xóa sản phẩm thành công.", "success");
        } catch (err) { showAlert("Xóa thất bại: " + err.message); }
      },
      { title: "Xóa sản phẩm", confirmLabel: "Xóa", confirmColor: "#ef4444" }
    );
  };

  const handleSave = async (item) => {
    try {
      if (editItem) {
        await inventoryApi.update(editItem.id, {
          name: item.name, unit: item.unit,
          cost_price: item.costPrice, sell_price: item.sellPrice,
          min_stock: item.minStock, location_text: item.location,
        });
        showAlert("Cập nhật sản phẩm thành công.", "success");
      } else {
        await inventoryApi.create({
          barcode: item.barcode, name: item.name, unit: item.unit,
          cost_price: item.costPrice, sell_price: item.sellPrice,
          warehouse_code: item.warehouse, location_text: item.location,
          quantity: item.quantity, min_stock: item.minStock,
        });
        showAlert("Thêm sản phẩm thành công.", "success");
      }
      await onRefresh();
      setLocalRefreshKey(k => k + 1);
      setShowAdd(false);
      setEditItem(null);
    } catch (err) { showAlert("Lưu thất bại: " + err.message); }
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    showConfirm(
      `Xác nhận xóa ${count} sản phẩm đã chọn?\n\nHành động này không thể hoàn tác.`,
      async () => {
        try {
          const result = await inventoryApi.removeBatch([...selectedIds]);
          setSelectedIds(new Set());
          await onRefresh();
          setLocalRefreshKey(k => k + 1);
          showAlert(`Đã xóa ${result.deleted} sản phẩm thành công.`, "success");
        } catch (err) { showAlert("Xóa thất bại: " + err.message); }
      },
      { title: "Xóa hàng loạt", confirmLabel: `Xóa ${count} sản phẩm`, confirmColor: "#ef4444" }
    );
  };

  const handleExcelFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setExcelPhase("previewing");
    try {
      const preview = await inventoryApi.previewReplace(file);
      setExcelPreview(preview);
      setExcelFile(file);
    } catch (err) {
      showAlert("Không đọc được file: " + err.message);
      setExcelPhase("idle");
    }
  };

  const handleExcelReplace = async () => {
    if (!excelFile) return;
    setExcelPhase("replacing");
    try {
      const result = await inventoryApi.importReplace(excelFile);
      await onRefresh();
      setLocalRefreshKey(k => k + 1);
      setExcelPhase("idle");
      setExcelPreview(null);
      setExcelFile(null);
      showAlert(
        `Cập nhật thành công!\n${result.inserted} sản phẩm · Kho: ${result.warehouses?.join(", ")}`,
        "success", "Cập nhật tồn kho hoàn tất"
      );
    } catch (err) {
      showAlert("Cập nhật thất bại: " + err.message);
      setExcelPhase("idle");
    }
  };

  return (
    <div>
      {alertModal && <AlertModal  {...alertModal} onClose={() => setAlert(null)} />}
      {confirmModal && <ConfirmModal
        title={confirmModal.title} message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel} confirmColor={confirmModal.confirmColor}
        onConfirm={() => { setConfirm(null); confirmModal.onConfirm(); }}
        onCancel={() => setConfirm(null)} />}

      {/* ── Excel Preview Modal ──────────────────── */}
      {excelPhase === "previewing" && excelPreview && (
        <Modal
          title="Xem trước — Import Excel"
          onClose={() => { setExcelPhase("idle"); setExcelPreview(null); setExcelFile(null); }}
          width={700}
        >
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-[10px] mb-5">
            {[
              { label: "Tổng SP", value: excelPreview.total_rows, color: "#6366f1" },
              { label: "Tổng SL", value: fmtNum(excelPreview.total_qty), color: "#10b981" },
              { label: "Tổng giá trị", value: fmtCompact(excelPreview.total_value || 0), color: "#8b5cf6", title: fmtCur(excelPreview.total_value || 0) },
              excelPreview.zero_qty > 0 && { label: "SL = 0", value: excelPreview.zero_qty, color: "#f59e0b" },
              excelPreview.no_location > 0 && { label: "Chưa có vị trí", value: excelPreview.no_location, color: "#ef4444" },
            ].filter(Boolean).map((s, i) => (
              <div key={i} className="bg-border rounded-[10px] p-[12px_10px] text-center">
                <div
                  className="text-[19px] font-extrabold whitespace-nowrap"
                  style={{ color: s.color }}
                  title={s.title}
                >
                  {s.value}
                </div>
                <div className="text-[11px] text-subtle mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Warning */}
          <div className="bg-danger/[0.08] border border-danger/[0.27] rounded-[10px] p-[12px_16px] mb-5">
            <div className="text-[13px] font-bold text-danger mb-[6px]">
              ⚠ Dữ liệu tại các kho sau sẽ bị thay thế hoàn toàn:
            </div>
            <div className="flex gap-2 flex-wrap mb-[6px]">
              {excelPreview.warehouses?.map(w => (
                <span key={w} className="bg-danger/[0.13] text-danger border border-danger/[0.27] rounded-[6px] px-3 py-[3px] font-bold text-xs">
                  {w}
                </span>
              ))}
            </div>
            <div className="text-xs text-label">
              Toàn bộ tồn kho cũ tại các kho này sẽ bị xóa và thay bằng dữ liệu từ file Excel.
            </div>
          </div>

          {/* Sample table */}
          <div className="text-[11px] font-bold text-subtle mb-2 tracking-[0.5px]">
            XEM TRƯỚC — 5 DÒNG ĐẦU
          </div>
          <div className="card overflow-hidden mb-5">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-border">
                  {["Barcode", "Tên sản phẩm", "Số lượng", "Vị trí", "Kho", "Giá vốn"].map(h => (
                    <th
                      key={h}
                      className={`p-[8px_12px] text-label font-bold text-[10px] ${h === "Giá vốn" ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelPreview.sample?.map((r, i) => (
                  <tr key={i} className={`border-b border-border ${i % 2 === 0 ? "" : "bg-surface/50"}`}>
                    <td className="p-[8px_12px] font-mono text-primary font-bold">{r.barcode}</td>
                    <td className="p-[8px_12px] text-body max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{r.name}</td>
                    <td className="p-[8px_12px] text-success font-bold text-center">{fmtNum(r.quantity)}</td>
                    <td className="p-[8px_12px] text-warning font-mono">{r.location || "—"}</td>
                    <td className="p-[8px_12px] text-primary-light font-bold">{r.warehouse}</td>
                    <td className="p-[8px_12px] text-label text-right">{r.cost_price > 0 ? fmtCur(r.cost_price) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-[10px] justify-end">
            <Btn onClick={() => { setExcelPhase("idle"); setExcelPreview(null); setExcelFile(null); }} color="#334155" outline>Hủy</Btn>
            <Btn onClick={handleExcelReplace} color="#ef4444" style={{ padding: "10px 24px" }}>
              <Icon name="upload" size={15} /> Xác nhận thay thế {excelPreview.total_rows} sản phẩm
            </Btn>
          </div>
        </Modal>
      )}

      {excelPhase === "replacing" && (
        <Modal title="Đang cập nhật..." onClose={() => { }}>
          <div className="text-center py-5">
            <div className="text-sm text-primary font-semibold">Đang cập nhật dữ liệu...</div>
            <div className="text-xs text-subtle mt-2">Vui lòng không đóng tab này</div>
          </div>
        </Modal>
      )}

      <input ref={excelRef} type="file" accept=".xlsx,.xls" onChange={handleExcelFile} className="hidden" />

      {/* ── Toolbar ─────────────────────────────── */}
      <div className="flex gap-[10px] mb-[18px] flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Icon
            name="search" size={14}
            className="absolute left-[10px] top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
          />
          <Inp
            placeholder="Tìm tên hoặc barcode"
            value={inputValue}
            onChange={e => {
              const val = e.target.value;
              setInputValue(val);
              clearTimeout(searchDebounceRef.current);
              searchDebounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 350);
            }}
            style={{ paddingLeft: 32 }}
          />
        </div>

        {!userWarehouseCode && (
          <Sel value={filterWH} onChange={e => { setFWH(e.target.value); setPage(1); }} style={{ width: 120 }}>
            <option value="all">Tất cả kho</option>
            {WAREHOUSES.map(w => <option key={w}>{w}</option>)}
          </Sel>
        )}

        {canEdit && (
          <Btn onClick={() => { setEditItem(null); setShowAdd(true); }}>
            <Icon name="plus" size={15} /> Thêm sản phẩm
          </Btn>
        )}
        {canEdit && (
          <Btn onClick={() => excelRef.current.click()} color="#10b981" outline>
            <Icon name="excel" size={15} /> Import Excel
          </Btn>
        )}
        {canEdit && (
          <Btn onClick={downloadInventoryTemplate} color="#334155" outline>
            <Icon name="excel" size={15} /> Tải file mẫu
          </Btn>
        )}
        <Btn
          onClick={() => exportInventoryToExcel({ search, filterWH, showAlert, setExporting })}
          color="#3b82f6" outline
          disabled={exporting}
        >
          <Icon name="download" size={15} /> {exporting ? "Đang xuất..." : "Xuất Excel"}
        </Btn>
      </div>

      {/* ── Counter ─────────────────────────────── */}
      <div className="text-xs text-subtle mb-[10px] flex items-center gap-[10px]">
        Hiển thị {paged.length} / {apiTotal} sản phẩm
        {apiLoading && <span className="text-primary">Đang tải...</span>}
      </div>

      {/* ── Bulk action bar ──────────────────────── */}
      {selectedIds.size > 0 && canEdit && (
        <div className="flex items-center justify-between flex-wrap gap-2 bg-primary/[0.13] border border-primary/[0.27] rounded-[10px] px-4 py-[10px] mb-[10px]">
          <span className="text-[13px] text-primary-light font-semibold">
            Đã chọn <strong className="text-heading">{selectedIds.size}</strong> sản phẩm
          </span>
          <div className="flex gap-2">
            <Btn onClick={() => setSelectedIds(new Set())} color="#334155" outline style={{ padding: "6px 14px", fontSize: 12 }}>
              Bỏ chọn
            </Btn>
            <Btn onClick={handleBulkDelete} color="#ef4444" style={{ padding: "6px 14px", fontSize: 12 }}>
              <Icon name="delete" size={13} /> Xóa {selectedIds.size} sản phẩm
            </Btn>
          </div>
        </div>
      )}

      {/* ── Table ───────────────────────────────── */}
      <div className="card overflow-hidden hidden wide:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs min-w-[780px]">
            <thead>
              <tr className="bg-border">
                <th className="p-[10px_8px] w-11 text-center">
                  {canEdit && (
                    <input
                      type="checkbox"
                      className="accent-primary cursor-pointer w-[15px] h-[15px]"
                      checked={paged.length > 0 && paged.every(p => selectedIds.has(p.id))}
                      onChange={e => setSelectedIds(e.target.checked ? new Set(paged.map(p => p.id)) : new Set())}
                    />
                  )}
                </th>
                {["Barcode", "Tên sản phẩm", "SL tồn", "Vị trí", "Kho", "Giá vốn", "Giá trị tồn kho", ""].map(h => (
                  <th
                    key={h}
                    className={`p-[10px_14px] text-label font-bold text-[10px] tracking-[0.5px] whitespace-nowrap ${["Giá vốn", "Giá trị tồn kho"].includes(h) ? "text-right" : "text-left"
                      }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((p, i) => {
                const isZero = p.status === "zero" || p.quantity === 0;
                const giaVon = Number(p.costPrice || p.cost_price || 0);
                const giaTriTon = p.quantity * giaVon;
                const isSelected = selectedIds.has(p.id);
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-border transition-colors duration-150 ${isSelected ? "bg-primary/[0.08]"
                      : i % 2 === 0 ? "" : "bg-[#0a101a]"
                      } ${isZero ? "opacity-[0.45]" : ""}`}
                  >
                    {/* Checkbox */}
                    <td className="p-[10px_8px] w-11 text-center">
                      {canEdit && (
                        <input
                          type="checkbox"
                          className="accent-primary cursor-pointer w-[15px] h-[15px]"
                          checked={isSelected}
                          onChange={e => {
                            const next = new Set(selectedIds);
                            e.target.checked ? next.add(p.id) : next.delete(p.id);
                            setSelectedIds(next);
                          }}
                        />
                      )}
                    </td>

                    {/* Barcode */}
                    <td className={`p-[10px_14px] font-mono font-bold text-[12px] ${isZero ? "text-dim" : "text-primary"}`}>
                      {p.barcode}
                    </td>

                    {/* Tên */}
                    <td className={`p-[10px_14px] font-medium ${isZero ? "text-dim" : "text-body"}`}>
                      {p.name}
                    </td>

                    {/* SL tồn — dynamic color by status */}
                    <td
                      className="p-[10px_14px] font-extrabold text-sm"
                      style={{ color: isZero ? "#ef4444" : p.status === "low" ? "#f59e0b" : "#10b981" }}
                    >
                      {fmtNum(p.quantity)}
                    </td>

                    {/* Vị trí */}
                    <td className="p-[10px_14px]">
                      {p.location
                        ? <span className="bg-warning/[0.13] border border-warning/[0.27] rounded-[6px] px-[10px] py-[3px] font-mono text-xs text-warning font-semibold">{p.location}</span>
                        : <span className="text-[11px] text-dim italic">—</span>}
                    </td>

                    {/* Kho */}
                    <td className="p-[10px_14px]">
                      <span className="bg-primary/[0.13] text-primary-light rounded-[6px] px-2 py-[2px] text-[11px] font-bold">
                        {p.warehouse}
                      </span>
                    </td>

                    {/* Giá vốn */}
                    <td className="p-[10px_14px] text-label text-right">
                      {giaVon > 0 ? fmtCur(giaVon) : <span className="text-muted">—</span>}
                    </td>

                    {/* Giá trị tồn */}
                    <td className={`p-[10px_14px] text-right font-bold ${giaTriTon > 0 ? "text-success" : "text-muted"}`}>
                      {giaTriTon > 0 ? fmtCur(giaTriTon) : "—"}
                    </td>

                    {/* Actions */}
                    <td className="p-[10px_14px]">
                      {canEdit && (
                        <div className="flex gap-[5px]">
                          <button
                            onClick={() => { setEditItem(p); setShowAdd(true); }}
                            className="bg-border border-none rounded-[6px] text-primary cursor-pointer p-[5px] flex hover:bg-muted transition-colors duration-150"
                          >
                            <Icon name="edit" size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="bg-border border-none rounded-[6px] text-danger cursor-pointer p-[5px] flex hover:bg-muted transition-colors duration-150"
                          >
                            <Icon name="delete" size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Danh sách dạng thẻ (mobile, dưới md) — đủ 8 trường như bảng ─── */}
      <div className="wide:hidden space-y-3">
        {canEdit && paged.length > 0 && (
          <label className="flex items-center gap-2 text-xs text-subtle px-1">
            <input
              type="checkbox"
              className="accent-primary cursor-pointer w-[15px] h-[15px]"
              checked={paged.every(p => selectedIds.has(p.id))}
              onChange={e => setSelectedIds(e.target.checked ? new Set(paged.map(p => p.id)) : new Set())}
            />
            Chọn tất cả trên trang này
          </label>
        )}

        {paged.map((p) => {
          const isZero = p.status === "zero" || p.quantity === 0;
          const giaVon = Number(p.costPrice || p.cost_price || 0);
          const giaTriTon = p.quantity * giaVon;
          const isSelected = selectedIds.has(p.id);
          return (
            <div
              key={p.id}
              className={`card p-4 transition-colors duration-150 ${isSelected ? "border-primary/50 bg-primary/[0.05]" : ""} ${isZero ? "opacity-[0.6]" : ""}`}
            >
              {/* Hàng đầu: checkbox + barcode + badge kho */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {canEdit && (
                    <input
                      type="checkbox"
                      className="accent-primary cursor-pointer w-[15px] h-[15px] flex-shrink-0"
                      checked={isSelected}
                      onChange={e => {
                        const next = new Set(selectedIds);
                        e.target.checked ? next.add(p.id) : next.delete(p.id);
                        setSelectedIds(next);
                      }}
                    />
                  )}
                  <span className={`font-mono font-bold text-[13px] truncate ${isZero ? "text-dim" : "text-primary"}`}>
                    {p.barcode}
                  </span>
                </div>
                <span className="bg-primary/[0.13] text-primary-light rounded-[6px] px-2 py-[2px] text-[11px] font-bold flex-shrink-0">
                  {p.warehouse}
                </span>
              </div>

              {/* Tên sản phẩm */}
              <div className={`text-sm font-medium mb-3 ${isZero ? "text-dim" : "text-body"}`}>
                {p.name}
              </div>

              {/* Lưới 2x2: SL tồn / Vị trí / Giá vốn / Giá trị tồn */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3 pb-3 border-b border-border">
                <div>
                  <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">SL tồn</div>
                  <div className="font-extrabold text-sm" style={{ color: isZero ? "#ef4444" : p.status === "low" ? "#f59e0b" : "#10b981" }}>
                    {fmtNum(p.quantity)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Vị trí</div>
                  {p.location
                    ? <span className="bg-warning/[0.13] border border-warning/[0.27] rounded-[6px] px-2 py-[1px] font-mono text-xs text-warning font-semibold">{p.location}</span>
                    : <span className="text-xs text-dim italic">—</span>}
                </div>
                <div>
                  <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Giá vốn</div>
                  <div className="text-label text-sm">{giaVon > 0 ? fmtCur(giaVon) : "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-dim uppercase tracking-wide mb-[2px]">Giá trị tồn</div>
                  <div className={`font-bold text-sm ${giaTriTon > 0 ? "text-success" : "text-muted"}`}>
                    {giaTriTon > 0 ? fmtCur(giaTriTon) : "—"}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {canEdit && (
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setEditItem(p); setShowAdd(true); }}
                    className="bg-border border-none rounded-[6px] text-primary cursor-pointer px-3 py-[6px] flex items-center gap-1 text-xs font-semibold hover:bg-muted transition-colors duration-150"
                  >
                    <Icon name="edit" size={13} /> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="bg-border border-none rounded-[6px] text-danger cursor-pointer px-3 py-[6px] flex items-center gap-1 text-xs font-semibold hover:bg-muted transition-colors duration-150"
                  >
                    <Icon name="delete" size={13} /> Xóa
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {paged.length === 0 && (
          <div className="text-center text-muted text-sm py-8">Không có sản phẩm nào</div>
        )}
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}

      {canEdit && showAdd && (
        <ProductForm
          initial={editItem}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
