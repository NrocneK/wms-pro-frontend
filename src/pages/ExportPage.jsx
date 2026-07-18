// src/pages/ExportPage.jsx
import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import Icon from "../components/ui/Icon";
import { Btn, Modal, AlertModal, ConfirmModal } from "../components/ui";
import { today, fmtDate, fmtNum, fmtCur } from "../utils/helpers";
import { exportApi } from "../services/exportService";
import { bookstoreName } from "../constants";

const downloadTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ["Ngày", "Số phiếu xuất (7 số)", "Mã hàng (barcode)", "Tên sản phẩm", "Số lượng", "Đơn giá xuất", "Nhà sách"],
    [today(), "2000001", "893500182997", "Tên sản phẩm mẫu", 5, 0, "Fahasa"],
  ]);
  ws["!cols"] = [{ wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 35 }, { wch: 12 }, { wch: 16 }, { wch: 18 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Phiếu xuất");
  XLSX.writeFile(wb, "mau_phieu_xuat.xlsx");
};

const downloadPickSlipExcel = (slip) => {
  const rows = [
    ["PHIẾU TÌM HÀNG", "", "", "", "", ""],
    ["Nhà sách:", slip.partner, "Ngày:", slip.date, "", ""],
    [""],
    ["STT", "Số phiếu xuất", "Mã hàng (Barcode)", "Tên sản phẩm", "Số lượng", "Vị trí"],
    ...slip.items.map((r, i) => [i + 1, r.itemRefNo, r.barcode, r.name, r.quantity, r.location || "—"]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 6 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 35 }, { wch: 10 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Phiếu tìm hàng");
  XLSX.writeFile(wb, `phieu_tim_hang_${slip.date}.xlsx`);
};

const loadScript = (src) => new Promise((res, rej) => {
  const s = document.createElement("script");
  s.src = src; s.onload = res; s.onerror = rej;
  document.head.appendChild(s);
});

const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

let vnFontLoaded = false;
const registerVietnameseFont = async (doc) => {
  const [regularBuf, boldBuf] = await Promise.all([
    fetch("https://cdn.jsdelivr.net/gh/googlefonts/roboto-2@main/src/hinted/Roboto-Regular.ttf").then(r => {
      if (!r.ok) throw new Error("Không tải được font Roboto-Regular (HTTP " + r.status + ")");
      return r.arrayBuffer();
    }),
    fetch("https://cdn.jsdelivr.net/gh/googlefonts/roboto-2@main/src/hinted/Roboto-Bold.ttf").then(r => {
      if (!r.ok) throw new Error("Không tải được font Roboto-Bold (HTTP " + r.status + ")");
      return r.arrayBuffer();
    }),
  ]);
  doc.addFileToVFS("Roboto-Regular.ttf", arrayBufferToBase64(regularBuf));
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", arrayBufferToBase64(boldBuf));
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  vnFontLoaded = true;
};

const downloadPickSlipPDF = async (slip) => {
  if (!window.jspdf) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  if (!window.jspdf?.jsPDF?.prototype?.autoTable) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  if (!vnFontLoaded) await registerVietnameseFont(doc);
  else {
    // Font đã tải ở lần trước, chỉ cần đăng ký lại vào instance doc mới (mỗi lần new jsPDF() là instance mới)
    await registerVietnameseFont(doc);
  }

  doc.setFontSize(16); doc.setFont("Roboto", "bold");
  doc.text("PHIẾU TÌM HÀNG / PICK SLIP", 105, 16, { align: "center" });
  doc.setFontSize(11); doc.setFont("Roboto", "normal");
  doc.text(`Kho: ${slip.warehouse}`, 14, 26);
  doc.text(`Ngày: ${slip.date}`, 14, 32);
  doc.text(`Tổng số dòng: ${slip.items.length}`, 14, 38);
  doc.setLineWidth(0.4); doc.line(14, 42, 196, 42);
  doc.autoTable({
    startY: 46,
    head: [["STT", "Số phiếu xuất", "Nhà sách", "Mã hàng", "Tên hàng", "Số lượng", "Vị trí"]],
    body: slip.items.map((r, i) => [i + 1, r.itemRefNo, r.nhaSach || "—", r.barcode, r.name, String(r.quantity), r.location || "—"]),
    styles: { font: "Roboto", fontSize: 9, cellPadding: 2.5 },
    headStyles: { font: "Roboto", fontStyle: "bold", fillColor: [99, 102, 241], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 242, 255] },
    columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 28 }, 2: { cellWidth: 18 }, 3: { cellWidth: 28 }, 4: { cellWidth: 48 }, 5: { cellWidth: 20 }, 6: { cellWidth: 25 } },
  });
  const y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(9); doc.setFont("Roboto", "normal");
  doc.text("Người lấy hàng: _______________    Ký tên: _______________", 14, y);
  doc.save(`phieu_tim_hang_${slip.date}.pdf`);
};

// ── Pick Slip Modal — giữ nguyên mã ký hiệu, không đổi ─────────
function PickSlipModal({ slip, onClose }) {
  const [dl, setDl] = useState(null);

  return (
    <Modal title="Phiếu tìm hàng" onClose={onClose} width={860}>
      <div className="border-2 border-dashed border-muted rounded-xl p-6 mb-5">
        <div className="text-center mb-[18px]">
          <div className="text-[11px] text-subtle tracking-[3px] font-mono">PHIẾU TÌM HÀNG / PICK SLIP</div>
          <div className="text-xl font-black text-heading mt-[6px]">PHIẾU TÌM HÀNG</div>
          <div className="text-sm text-primary-light font-bold mt-1">Kho: {slip.warehouse}</div>
          <div className="text-[13px] text-subtle mt-1">
            Ngày: {slip.date} · {slip.items.length} dòng hàng
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs table-fixed">
            <colgroup>
              <col style={{ width: "5%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "32%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr className="bg-primary">
                {["STT", "Số phiếu xuất", "Nhà sách", "Mã hàng", "Tên sản phẩm", "Số lượng", "Vị trí", "Ghi chú"].map(h => (
                  <th key={h} className="p-[10px_12px] text-white text-left font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slip.items.map((r, i) => (
                <tr key={i} className={`border-b border-app ${i % 2 === 0 ? "" : "bg-border"}`}>
                  <td className="p-[10px_12px] text-subtle">{i + 1}</td>
                  <td className="p-[10px_12px] font-mono text-export font-bold">{r.itemRefNo}</td>
                  <td className="p-[10px_12px] text-label text-xs">{r.nhaSach || "—"}</td>
                  <td className="p-[10px_12px] font-mono text-primary font-bold">{r.barcode}</td>
                  <td className="p-[10px_12px] text-body max-w-[200px]">{r.name}</td>
                  <td className="p-[10px_12px] text-success font-extrabold text-center">{fmtNum(r.quantity)}</td>
                  <td className="p-[10px_12px]">
                    {r.location
                      ? <span className="bg-warning/[0.13] text-warning rounded-[6px] px-2 py-[2px] font-mono text-[11px]">{r.location}</span>
                      : <span className="text-danger text-[11px]">Chưa có</span>}
                  </td>
                  <td className="p-[10px_12px] text-subtle text-[11px]">{r.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 pt-[10px] border-t border-dashed border-muted flex justify-between text-[11px] text-subtle font-mono">
          <span>✦ Đã sắp xếp theo số phiếu xuất</span>
          <span>Người lấy hàng: _______________ Ký tên: _______________</span>
        </div>
      </div>

      <div className="flex gap-[10px] justify-center flex-wrap">
        <Btn onClick={() => downloadPickSlipExcel(slip)} color="#10b981" style={{ padding: "11px 22px" }}>
          <Icon name="excel" size={16} /> Tải Excel
        </Btn>
        <Btn
          onClick={async () => { setDl("pdf"); try { await downloadPickSlipPDF(slip); } finally { setDl(null); } }}
          color="#ef4444" style={{ padding: "11px 22px" }} disabled={dl === "pdf"}
        >
          <Icon name="pdf" size={16} /> {dl === "pdf" ? "Đang tạo..." : "Tải PDF"}
        </Btn>
        <Btn onClick={onClose} color="#334155" outline style={{ padding: "11px 22px" }}>Đóng</Btn>
      </div>
    </Modal>
  );
}

// ── Main ExportPage ───────────────────────────
export default function ExportPage({ onRefresh }) {
  const [rows, setRows] = useState([]);
  const [exportDate, setDate] = useState(today());
  const [partner, setPartner] = useState("");
  const [phase, setPhase] = useState("idle");
  const [pickSlip, setPickSlip] = useState(null);
  const [alertModal, setAlert] = useState(null);
  const [confirmModal, setConfirm] = useState(null);
  const fileRef = useRef();

  const showAlert = (message, type = "error", title) => setAlert({ message, type, title });
  const showConfirm = (message, onConfirm, opts = {}) => setConfirm({ message, onConfirm, ...opts });

  // ── Đang soạn hàng — 3 cấp: Phiếu soạn → Phiếu xuất → Sản phẩm ──
  const [packingBatches, setPackingBatches] = useState([]);
  const [loadingPacking, setLoadingPacking] = useState(true);

  const [openBatchId, setOpenBatchId] = useState(null);       // Cấp 1 đang mở
  const [batchTickets, setBatchTickets] = useState({});       // cache Cấp 2: {batchId: [...tickets]}
  const [loadingTickets, setLoadingTickets] = useState(null);

  const [openTicketKey, setOpenTicketKey] = useState(null);   // Cấp 2 đang mở, key = `${batchId}-${refNo}`
  const [ticketItems, setTicketItems] = useState({});         // cache Cấp 3: {key: [...items]}
  const [loadingItems, setLoadingItems] = useState(null);
  const [savingQty, setSavingQty] = useState(null);
  const [reprinting, setReprinting] = useState(null);

  const loadPackingBatches = () => {
    let active = true;
    setLoadingPacking(true);
    exportApi.getPacking()
      .then(data => { if (active) setPackingBatches(data || []); })
      .catch(() => { })
      .finally(() => { if (active) setLoadingPacking(false); });
    return () => { active = false; };
  };

  useEffect(() => { const cleanup = loadPackingBatches(); return cleanup; }, []);

  // Cấp 1 → Cấp 2
  const toggleBatch = async (id) => {
    if (openBatchId === id) { setOpenBatchId(null); return; }
    setOpenBatchId(id);
    setOpenTicketKey(null); // đóng phiếu xuất con đang mở của batch cũ khi chuyển batch khác
    if (batchTickets[id]) return;
    setLoadingTickets(id);
    try {
      const tickets = await exportApi.getBatchTickets(id);
      setBatchTickets(prev => ({ ...prev, [id]: tickets || [] }));
    } catch (err) {
      showAlert("Không tải được danh sách phiếu xuất: " + err.message);
    } finally {
      setLoadingTickets(null);
    }
  };

  // Cấp 2 → Cấp 3
  const toggleTicket = async (batchId, refNo) => {
    const key = `${batchId}-${refNo}`;
    if (openTicketKey === key) { setOpenTicketKey(null); return; }
    setOpenTicketKey(key);
    if (ticketItems[key]) return;
    setLoadingItems(key);
    try {
      const items = await exportApi.getTicketItems(batchId, refNo);
      setTicketItems(prev => ({ ...prev, [key]: items || [] }));
    } catch (err) {
      showAlert("Không tải được chi tiết phiếu: " + err.message);
    } finally {
      setLoadingItems(null);
    }
  };

  // Cập nhật UI ngay khi gõ, chỉ gọi API khi rời ô nhập (onBlur)
  const updateActualQtyLocal = (key, itemId, val) => {
    setTicketItems(prev => ({
      ...prev,
      [key]: prev[key].map(it => it.id === itemId ? { ...it, quantity: val } : it),
    }));
  };

  const saveActualQty = async (itemId, val) => {
    const qty = Math.max(0, Number(val) || 0);
    setSavingQty(itemId);
    try {
      await exportApi.updateActualQuantity(itemId, qty);
    } catch (err) {
      showAlert("Lưu số lượng thất bại: " + err.message);
    } finally {
      setSavingQty(null);
    }
  };

  const confirmBatch = (batch) => {
    showConfirm(
      `Xác nhận xuất kho phiếu soạn ngày ${fmtDate(batch.export_date)} (${batch.ticket_count} phiếu xuất)?\n\nHệ thống sẽ trừ tồn kho theo số lượng thực tế đã điều chỉnh.`,
      async () => {
        try {
          await exportApi.confirm(batch.id);
          await onRefresh();
          setOpenBatchId(null);
          setOpenTicketKey(null);
          setBatchTickets(prev => { const next = { ...prev }; delete next[batch.id]; return next; });
          loadPackingBatches();
          showAlert("Xuất kho thành công.", "success");
        } catch (err) { showAlert("Xác nhận thất bại: " + err.message); }
      },
      { title: "Xác nhận xuất hàng", confirmLabel: "Xác nhận xuất hàng", confirmColor: "#10b981" }
    );
  };

  const cancelBatchAction = (batch) => {
    showConfirm(
      `Hủy phiếu soạn ngày ${fmtDate(batch.export_date)} (${batch.ticket_count} phiếu xuất)?\n\nThao tác này không thể hoàn tác. Tồn kho chưa bị trừ nên hủy an toàn.`,
      async () => {
        try {
          await exportApi.cancel(batch.id);
          setOpenBatchId(null);
          setOpenTicketKey(null);
          setBatchTickets(prev => { const next = { ...prev }; delete next[batch.id]; return next; });
          loadPackingBatches();
          showAlert("Đã hủy phiếu soạn.", "success");
        } catch (err) { showAlert("Hủy thất bại: " + err.message); }
      },
      { title: "Hủy phiếu đang soạn", confirmLabel: "Hủy phiếu", confirmColor: "#ef4444" }
    );
  };

  const reprintBatch = async (batch) => {
    setReprinting(batch.id);
    try {
      const tickets = batchTickets[batch.id] || await exportApi.getBatchTickets(batch.id);
      if (!batchTickets[batch.id]) {
        setBatchTickets(prev => ({ ...prev, [batch.id]: tickets || [] }));
      }

      const allItems = [];
      for (const ticket of (tickets || [])) {
        const key = `${batch.id}-${ticket.ref_no}`;
        const items = ticketItems[key] || await exportApi.getTicketItems(batch.id, ticket.ref_no);
        if (!ticketItems[key]) {
          setTicketItems(prev => ({ ...prev, [key]: items || [] }));
        }
        (items || []).forEach(it => {
          allItems.push({
            itemRefNo: ticket.ref_no,
            nhaSach: ticket.bookstore,
            barcode: it.barcode,
            name: it.product_name,
            quantity: it.quantity_requested,
            location: it.location_text,
          });
        });
      }

      if (allItems.length === 0) {
        showAlert("Phiếu soạn này không có sản phẩm nào.", "warning");
        return;
      }

      const sorted = allItems.sort((a, b) => String(a.itemRefNo).localeCompare(String(b.itemRefNo), undefined, { numeric: true }));
      setPickSlip({
        date: fmtDate(batch.export_date),
        partner: [...new Set(sorted.map(r => r.nhaSach).filter(Boolean))].join(", "),
        warehouse: batch.warehouse_code || "—",
        items: sorted,
      });
    } catch (err) {
      showAlert("Không tải được phiếu soạn: " + err.message);
    } finally {
      setReprinting(null);
    }
  };

  // ── Tải & xem trước Excel (giữ nguyên logic gốc) ─────────────
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setPhase("saving");
    try {
      const data = await exportApi.parseExcel(file);
      setDate(data.export_date || today());
      setPartner(data.bookstore || "");
      const parsed = (data.items || []).map((item, idx) => ({
        idx,
        itemRefNo: item.ref_no || "",
        barcode: item.barcode,
        name: item.name,
        quantity: item.quantity,
        qtyOriginal: item.quantity,
        nhaSach: item.bookstore || data.bookstore || "",
        location: item.location_code || "",
        warehouseId: item.warehouse_id || null,
        qtyAvail: item.qty_available || 0,
        qtyOk: item.qty_ok !== false,
        notFound: item.not_found || false,
        unitPrice: item.cost_price || 0,
        warehouseCode: item.warehouse_code || "",
      }));
      setRows(parsed);
      setPhase("review");
    } catch (err) {
      showAlert("Không đọc được file: " + err.message);
      setPhase("idle");
    }
  };

  const updateQty = (idx, val) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const newQty = Math.max(1, Math.min(Number(val) || 1, r.qtyAvail));
      return { ...r, quantity: newQty, qtyOk: newQty <= r.qtyAvail };
    }));
  };

  // ── In phiếu tìm hàng = TẠO PHIẾU SOẠN (status='packing') RỒI MỚI IN ────
  const createAndPrint = async () => {
    const validRows = rows.filter(r => !r.notFound && r.qtyAvail > 0);
    if (!validRows.length) { showAlert("Không có dòng hợp lệ nào để tạo phiếu.", "warning"); return; }

    setPhase("saving");
    try {
      const uniqueRefs = [...new Set(validRows.map(r => r.itemRefNo))].sort();
      const refNo = uniqueRefs.join("-") || "EXPORT";
      const bookstores = [...new Set(validRows.map(r => r.nhaSach).filter(Boolean))];
      const bookstoreLabel = bookstores.join(", ") || partner;

      await exportApi.create({
        ref_no: refNo, export_date: exportDate,
        warehouse_id: validRows[0]?.warehouseId || 1,
        bookstore: bookstoreLabel,
        items: validRows.map(r => ({
          ref_no: r.itemRefNo,
          bookstore: r.nhaSach || "",
          barcode: r.barcode,
          quantity: r.quantity,
          unit_price: r.unitPrice || 0,
        })),
      });

      const sorted = [...validRows].sort((a, b) => String(a.itemRefNo).localeCompare(String(b.itemRefNo), undefined, { numeric: true }));
      setPickSlip({
        date: fmtDate(exportDate),
        partner,
        warehouse: validRows[0]?.warehouseCode || "—",
        items: sorted.map(r => ({
          itemRefNo: r.itemRefNo, nhaSach: r.nhaSach,
          barcode: r.barcode, name: r.name,
          quantity: r.quantity, location: r.location,
          note: r.qtyOk ? "" : `⚠ Tồn chỉ còn ${r.qtyAvail}`,
        })),
      });

      setRows([]);
      setPhase("idle");
      loadPackingBatches();
    } catch (err) {
      showAlert("Không thể tạo phiếu: " + err.message);
      setPhase("review");
    }
  };

  const warnCount = rows.filter(r => r.notFound || !r.qtyOk).length;
  const validCount = rows.filter(r => !r.notFound && r.qtyAvail > 0).length;

  return (
    <div className="space-y-5">
      {alertModal && <AlertModal {...alertModal} onClose={() => setAlert(null)} />}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title} message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel} confirmColor={confirmModal.confirmColor}
          onConfirm={() => { setConfirm(null); confirmModal.onConfirm(); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── Header ──────────────────────────────── */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h2 className="m-0 text-lg font-extrabold text-heading">Xuất kho</h2>
          <p className="m-0 mt-1 text-[13px] text-subtle">
            Tải file Excel → Xem trước → In phiếu tìm hàng → Soạn hàng → Xác nhận xuất kho
          </p>
        </div>
        <div className="flex gap-2">
          {phase === "review" && (
            <Btn onClick={() => { setPhase("idle"); setRows([]); }} color="#334155" outline>
              <Icon name="close" size={15} /> Hủy
            </Btn>
          )}
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />

      {/* ── Idle ────────────────────────────────── */}
      {phase === "idle" && (
        <div className="card border-2 border-dashed border-muted rounded-2xl p-6 md:p-12 text-center">
          <div className="w-14 h-14 rounded-[14px] bg-export/[0.13] flex items-center justify-center mx-auto mb-4 text-export">
            <Icon name="upload" size={28} />
          </div>
          <div className="text-base font-bold text-heading mb-2">Chọn file Excel phiếu xuất</div>
          <div className="text-[13px] text-subtle mb-5">
            Cột yêu cầu: <strong className="text-label">Ngày · Số phiếu xuất · Mã hàng · Tên sản phẩm · Số lượng · Nhà sách</strong>
          </div>
          <div className="flex gap-[10px] justify-center flex-wrap">
            <Btn onClick={() => fileRef.current.click()} color="#f97316" style={{ padding: "11px 26px" }}>
              <Icon name="upload" size={16} /> Chọn file
            </Btn>
            <Btn onClick={downloadTemplate} color="#334155" outline style={{ padding: "11px 22px" }}>
              <Icon name="excel" size={16} /> Tải file mẫu
            </Btn>
          </div>
        </div>
      )}

      {/* ── Saving ──────────────────────────────── */}
      {phase === "saving" && (
        <div className="card rounded-xl p-7 text-center">
          <div className="flex items-center justify-center gap-2 text-export text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-export animate-pulse inline-block" />
            Đang xử lý...
          </div>
          <div className="text-subtle text-xs mt-2">Vui lòng chờ trong giây lát</div>
        </div>
      )}

      {/* ── Review ──────────────────────────────── */}
      {phase === "review" && (
        <div>
          <div className="bg-border rounded-[10px] px-[18px] py-[14px] mb-4 flex gap-4 flex-wrap items-center">
            <div className="text-[13px] text-subtle">
              Ngày: <strong className="text-heading">{fmtDate(exportDate)}</strong>
            </div>
            <div className="text-[13px] text-subtle">
              Hợp lệ: <strong className="text-success">{validCount}</strong>
              {warnCount > 0 && <span className="text-danger ml-2">/ {warnCount} có vấn đề</span>}
            </div>
            <div className="text-[13px] text-subtle">
              Thành tiền: <strong className="text-export">
                {fmtCur(rows.filter(r => !r.notFound && r.qtyAvail > 0).reduce((s, r) => s + r.quantity * (r.unitPrice || 0), 0))}
              </strong>
            </div>
            <div className="flex gap-2 ml-auto">
              <Btn onClick={createAndPrint} color="#6366f1" disabled={validCount === 0} style={{ padding: "10px 18px" }}>
                <Icon name="print" size={15} /> In phiếu tìm hàng
              </Btn>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs min-w-[860px]">
                <thead>
                  <tr className="bg-border">
                    {["#", "Mã phiếu", "Barcode", "Tên sản phẩm", "SL xuất", "Đơn giá", "Thành tiền", "Tồn kho", "Nhà sách", "Vị trí", "Trạng thái"].map(h => (
                      <th key={h} className={`p-[10px_12px] text-label font-bold text-[10px] tracking-[0.5px] whitespace-nowrap ${["Đơn giá", "Thành tiền"].includes(h) ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const isZero = row.qtyAvail === 0;
                    const dimmed = isZero || row.notFound;
                    const rowBg = row.notFound ? "rgba(239,68,68,0.03)" : isZero ? "rgba(71,85,105,0.06)" : i % 2 === 0 ? "transparent" : "#0a101a";
                    return (
                      <tr key={i} className={`border-b border-border ${dimmed ? "opacity-50" : ""}`} style={{ background: rowBg }}>
                        <td className="p-[9px_12px] text-subtle">{i + 1}</td>
                        <td className="p-[9px_12px] font-mono text-export font-bold">{row.itemRefNo || "—"}</td>
                        <td className="p-[9px_12px] font-mono font-bold" style={{ color: dimmed ? "#475569" : "#6366f1" }}>{row.barcode}</td>
                        <td className="p-[9px_12px] max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: dimmed ? "#475569" : "#e2e8f0" }}>
                          {row.name || "(không tìm thấy)"}
                        </td>
                        <td className="p-[4px_8px]">
                          {!row.notFound && row.qtyAvail > 0 ? (
                            <>
                              <input
                                type="number" value={row.quantity} min={1} max={row.qtyAvail}
                                onChange={e => updateQty(i, e.target.value)}
                                className="rounded-[6px] px-2 py-[5px] text-heading text-xs font-bold text-center outline-none w-[72px]"
                                style={{
                                  background: row.quantity > row.qtyAvail ? "rgba(239,68,68,0.13)" : "#1e293b",
                                  border: `1px solid ${row.quantity > row.qtyAvail ? "#ef4444" : "#334155"}`,
                                }}
                              />
                              {row.quantity !== row.qtyOriginal && (
                                <div className="text-[10px] text-warning mt-[2px]">Gốc: {fmtNum(row.qtyOriginal)}</div>
                              )}
                            </>
                          ) : (
                            <span className="text-danger font-bold">{fmtNum(row.quantity)}</span>
                          )}
                        </td>
                        <td className="p-[9px_12px] text-right text-xs" style={{ color: row.unitPrice > 0 ? "#94a3b8" : "#334155" }}>
                          {!row.notFound && row.unitPrice > 0 ? fmtCur(row.unitPrice) : "—"}
                        </td>
                        <td className="p-[9px_12px] font-bold text-right" style={{ color: (row.unitPrice || 0) > 0 && !row.notFound && row.qtyAvail > 0 ? "#f97316" : "#334155" }}>
                          {(row.unitPrice || 0) > 0 && !row.notFound && row.qtyAvail > 0 ? fmtCur(row.quantity * (row.unitPrice || 0)) : "—"}
                        </td>
                        <td className="p-[9px_12px] font-bold"
                          style={{ color: row.qtyAvail === 0 ? "#ef4444" : row.qtyAvail < row.quantity ? "#f59e0b" : "#10b981" }}>
                          {row.notFound ? "—" : fmtNum(row.qtyAvail)}
                        </td>
                        <td className="p-[9px_12px] text-label text-xs">{bookstoreName(row.nhaSach)}</td>
                        <td className="p-[9px_12px]">
                          {row.location
                            ? <span className="bg-warning/[0.13] text-warning rounded-[6px] px-2 py-[2px] font-mono text-[11px]">{row.location}</span>
                            : <span className="text-dim text-[11px]">—</span>}
                        </td>
                        <td className="p-[9px_12px]">
                          {row.notFound ? (
                            <span className="bg-danger/[0.13] text-danger border border-danger/[0.27] rounded-[6px] px-2 py-[2px] text-[10px] font-bold">KHÔNG TÌM THẤY</span>
                          ) : isZero ? (
                            <span className="bg-muted/50 text-label border border-muted/50 rounded-[6px] px-2 py-[2px] text-[10px] font-bold">HẾT HÀNG</span>
                          ) : !row.qtyOk ? (
                            <span className="bg-warning/[0.13] text-warning border border-warning/[0.27] rounded-[6px] px-2 py-[2px] text-[10px] font-bold">THIẾU TỒN</span>
                          ) : (
                            <span className="bg-success/[0.13] text-success border border-success/[0.27] rounded-[6px] px-2 py-[2px] text-[10px] font-bold">SẴN SÀNG</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-5 flex-wrap text-xs text-subtle mt-2">
            <span>🔴 Đỏ = không tìm thấy mã</span>
            <span>⬛ Mờ = hết hàng</span>
            <span>🟡 Vàng = thiếu tồn (có thể điều chỉnh SL)</span>
            <span>✏ Có thể sửa số lượng, tối đa = tồn kho</span>
          </div>
        </div>
      )}

      {/* ── Đang soạn hàng — 3 cấp ──────────────── */}
      <div className="card overflow-hidden">
        <div className="flex justify-between items-center px-[18px] py-[14px] border-b border-border">
          <h3 className="m-0 text-sm font-bold text-heading">Đang soạn hàng</h3>
          <span className="text-xs text-subtle">{packingBatches.length} phiếu soạn</span>
        </div>

        {loadingPacking ? (
          <div className="py-8 text-center text-subtle text-sm">Đang tải...</div>
        ) : packingBatches.length === 0 ? (
          <div className="py-8 text-center text-muted text-sm">Không có phiếu nào đang soạn hàng</div>
        ) : (
          <div>
            {packingBatches.map(batch => {
              const isOpen = openBatchId === batch.id;
              const tickets = batchTickets[batch.id];
              return (
                <div key={batch.id} className="border-b border-border last:border-b-0">
                  {/* ── Cấp 1: Phiếu soạn ── */}
                  <button
                    onClick={() => toggleBatch(batch.id)}
                    className="w-full flex items-center justify-between px-[18px] py-[13px] hover:bg-white/[0.02] transition-colors duration-150 text-left cursor-pointer flex-wrap gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] text-subtle transition-transform duration-200 inline-block ${isOpen ? "rotate-90" : ""}`}>▸</span>
                      <span className="text-heading font-semibold text-sm">{fmtDate(batch.export_date)}</span>
                      <span className="bg-primary/[0.13] text-primary-light rounded-[6px] px-2 py-[2px] text-[11px] font-bold">
                        {batch.warehouse_code}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-export font-semibold">{batch.ticket_count} phiếu xuất</span>
                      <span className="text-primary-light font-semibold">{batch.sku_count} tựa</span>
                      <span className="text-success font-bold">{fmtCur(batch.total_value)}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border bg-black/20 px-[18px] py-4">
                      {loadingTickets === batch.id ? (
                        <div className="text-center text-subtle text-xs py-4">Đang tải...</div>
                      ) : (
                        <>
                          {/* ── Cấp 2: Phiếu xuất con ── */}
                          <div className="space-y-2 mb-4">
                            {(tickets || []).map(ticket => {
                              const tKey = `${batch.id}-${ticket.ref_no}`;
                              const isTOpen = openTicketKey === tKey;
                              const items = ticketItems[tKey];
                              return (
                                <div key={ticket.ref_no} className="border border-border rounded-lg overflow-hidden">
                                  <button
                                    onClick={() => toggleTicket(batch.id, ticket.ref_no)}
                                    className="w-full flex items-center justify-between px-[14px] py-[10px] bg-card hover:bg-white/[0.02] transition-colors duration-150 text-left cursor-pointer flex-wrap gap-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[9px] text-dim transition-transform duration-200 inline-block ${isTOpen ? "rotate-90" : ""}`}>▸</span>
                                      <span className="font-mono text-export font-bold text-[13px]">{ticket.ref_no}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                      <span className="text-label">{bookstoreName(ticket.bookstore)}</span>
                                      <span className="text-primary-light font-semibold">{ticket.sku_count} tựa</span>
                                      <span className="text-success font-bold">{fmtCur(ticket.total_value)}</span>
                                    </div>
                                  </button>

                                  {/* ── Cấp 3: Chi tiết sản phẩm ── */}
                                  {isTOpen && (
                                    <div className="border-t border-border bg-app/60 px-[14px] py-3">
                                      {loadingItems === tKey ? (
                                        <div className="text-center text-subtle text-xs py-3">Đang tải sản phẩm...</div>
                                      ) : (
                                        <div className="overflow-x-auto">
                                          <table className="w-full border-collapse text-xs">
                                            <thead>
                                              <tr>
                                                {["Barcode", "Tên sản phẩm", "SL yêu cầu", "SL thực tế", "Vị trí"].map(h => (
                                                  <th key={h} className="p-[6px_8px] text-dim font-semibold text-[10px] text-left whitespace-nowrap">{h}</th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {(items || []).map(it => (
                                                <tr key={it.id} className="border-t border-border/30">
                                                  <td className="p-[6px_8px] font-mono text-primary font-bold">{it.barcode}</td>
                                                  <td className="p-[6px_8px] text-body">{it.product_name}</td>
                                                  <td className="p-[6px_8px] text-subtle">{fmtNum(it.quantity_requested)}</td>
                                                  <td className="p-[4px_6px]">
                                                    <input
                                                      type="number" min={0} defaultValue={it.quantity}
                                                      onChange={e => updateActualQtyLocal(tKey, it.id, e.target.value)}
                                                      onBlur={e => saveActualQty(it.id, e.target.value)}
                                                      className="bg-border border border-muted rounded-[6px] px-2 py-[4px] text-heading text-xs font-bold text-center outline-none w-[64px] focus:border-primary"
                                                    />
                                                    {savingQty === it.id && <span className="text-[10px] text-dim ml-1">lưu...</span>}
                                                  </td>
                                                  <td className="p-[6px_8px]">
                                                    {it.location_text
                                                      ? <span className="bg-warning/[0.13] text-warning rounded-[6px] px-2 py-[1px] font-mono text-[11px]">{it.location_text}</span>
                                                      : <span className="text-dim text-[11px]">—</span>}
                                                  </td>
                                                </tr>
                                              ))}
                                              {(items || []).length === 0 && (
                                                <tr><td colSpan={5} className="p-3 text-center text-muted">Không có dữ liệu</td></tr>
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {(tickets || []).length === 0 && (
                              <div className="text-center text-muted text-xs py-3">Không có phiếu xuất nào</div>
                            )}
                          </div>

                          {/* Hành động áp dụng cho CẢ phiếu soạn */}
                          <div className="flex gap-2 justify-end flex-wrap">
                            <Btn
                              onClick={() => reprintBatch(batch)}
                              color="#6366f1" outline style={{ padding: "8px 16px" }}
                              disabled={reprinting === batch.id}
                            >
                              <Icon name="pdf" size={14} /> {reprinting === batch.id ? "Đang tải..." : "Xem/In phiếu"}
                            </Btn>
                            <Btn onClick={() => cancelBatchAction(batch)} color="#ef4444" outline style={{ padding: "8px 16px" }}>
                              <Icon name="close" size={14} /> Hủy phiếu soạn
                            </Btn>
                            <Btn onClick={() => confirmBatch(batch)} color="#10b981" style={{ padding: "8px 16px" }}>
                              <Icon name="check" size={14} /> Xác nhận xuất hàng
                            </Btn>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pickSlip && <PickSlipModal slip={pickSlip} onClose={() => setPickSlip(null)} />}
    </div>
  );
}
