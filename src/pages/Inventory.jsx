// src/pages/Inventory.jsx
import { useState, useRef } from "react";
import { AlertModal, ConfirmModal } from "../components/ui";
import { useInventoryList } from "../hooks/useInventoryList";
import { useExcelReplace } from "../hooks/useExcelReplace";
import ProductForm from "../components/inventory/ProductForm";
import ProductCatalog from "../components/inventory/ProductCatalog";
import ExcelPreviewModal from "../components/inventory/ExcelPreviewModal";
import InventoryToolbar from "../components/inventory/InventoryToolbar";
import InventoryStockView from "../components/inventory/InventoryStockView";

export default function Inventory({ onRefresh, canEdit = false, refreshKey = 0, userWarehouseCode = null }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [alertModal, setAlert] = useState(null);
  const [confirmModal, setConfirm] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState("stock"); // "stock" | "catalog"
  const excelRef = useRef();

  const showAlert = (message, type = "error", title) => setAlert({ message, type, title });
  const showConfirm = (message, onConfirm, opts = {}) => setConfirm({ message, onConfirm, ...opts });

  const list = useInventoryList({ onRefresh, refreshKey, showAlert, showConfirm });
  const excel = useExcelReplace({ onRefresh, showAlert });

  const handleSaveProduct = async (item) => {
    try {
      await list.handleSave(item, editItem);
      setShowAdd(false);
      setEditItem(null);
    } catch (err) { showAlert("Lưu thất bại: " + err.message); }
  };

  // Sau khi Excel replace xong, danh sách tồn kho (useInventoryList) phải tự
  // fetch lại — gọi list.refetch() để bump localRefreshKey nội bộ của nó.
  const handleExcelReplaceConfirm = () => excel.handleExcelReplace(list.refetch);

  return (
    <div>
      {alertModal && <AlertModal {...alertModal} onClose={() => setAlert(null)} />}
      {confirmModal && <ConfirmModal
        title={confirmModal.title} message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel} confirmColor={confirmModal.confirmColor}
        onConfirm={() => { setConfirm(null); confirmModal.onConfirm(); }}
        onCancel={() => setConfirm(null)} />}

      <ExcelPreviewModal excel={excel} onConfirm={handleExcelReplaceConfirm} />

      {/* Chuyển đổi Tồn kho / Danh mục sản phẩm */}
      <div className="flex gap-1 bg-card border border-border rounded-full p-1 w-fit mb-4">
        {[{ id: "stock", label: "Tồn kho" }, { id: "catalog", label: "Danh mục sản phẩm" }].map(t => (
          <button
            key={t.id}
            onClick={() => setViewMode(t.id)}
            className={`
        relative border-none rounded-full px-5 py-[9px] cursor-pointer
        text-[13px] transition-all duration-300 ease-out
        ${viewMode === t.id
                ? "text-white font-bold scale-[1.03]"
                : "bg-transparent text-subtle font-medium hover:text-label hover:bg-white/[0.04]"
              }
      `}
            style={viewMode === t.id
              ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }
              : {}
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {viewMode === "stock" ? (
        <>
          <input ref={excelRef} type="file" accept=".xlsx,.xls" onChange={excel.handleExcelFile} className="hidden" />

          <InventoryToolbar
            list={list}
            canEdit={canEdit}
            userWarehouseCode={userWarehouseCode}
            showAlert={showAlert}
            exporting={exporting}
            setExporting={setExporting}
            onAddClick={() => { setEditItem(null); setShowAdd(true); }}
            onExcelClick={() => excelRef.current.click()}
          />

          <InventoryStockView
            list={list}
            canEdit={canEdit}
            onEdit={(p) => { setEditItem(p); setShowAdd(true); }}
          />
        </>
      ) : (
        <ProductCatalog canEdit={canEdit} showAlert={showAlert} />
      )}

      {canEdit && showAdd && (
        <ProductForm
          initial={editItem}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}