// src/components/inventory/ProductCatalog.jsx
import { useState, useEffect } from "react";
import Icon from "../ui/Icon";
import { Btn, Inp } from "../ui";
import { productApi } from "../../services/productService";
import CatalogForm from "./CatalogForm";

export default function ProductCatalog({ canEdit, showAlert }) {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);

    const load = () => {
        setLoading(true);
        productApi.getAll(search.trim() ? { search: search.trim() } : {})
            .then(data => setItems(Array.isArray(data) ? data : data.items || []))
            .catch(err => showAlert("Không tải được danh mục: " + err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [search]); // eslint-disable-line

    const handleSave = async (f) => {
        try {
            if (editItem) {
                await productApi.update(editItem.id, f);
            } else {
                await productApi.create(f);
            }
            showAlert(editItem ? "Cập nhật thành công." : "Thêm mới thành công.", "success");
            setShowForm(false);
            setEditItem(null);
            load();
        } catch (err) { showAlert("Lưu thất bại: " + err.message); }
    };

    return (
        <div>
            <div className="flex gap-[10px] mb-[18px] flex-wrap items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Icon name="search" size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
                    <Inp
                        placeholder="Tìm barcode hoặc tên sản phẩm..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: 32 }}
                    />
                </div>
                {canEdit && (
                    <Btn onClick={() => { setEditItem(null); setShowForm(true); }}>
                        <Icon name="plus" size={15} /> Thêm sản phẩm mới
                    </Btn>
                )}
            </div>

            <div className="card overflow-hidden">
                <table className="w-full border-collapse text-[13px]">
                    <thead>
                        <tr className="bg-border">
                            {["Barcode", "Tên sản phẩm", "Mã NCC", "Tên NCC", ""].map(h => (
                                <th key={h} className="text-left p-[10px_14px] text-label font-bold text-[10px] tracking-[0.5px] whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="py-7 text-center text-subtle">Đang tải...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={5} className="py-7 text-center text-muted">Chưa có sản phẩm nào trong danh mục</td></tr>
                        ) : items.map((p, i) => (
                            <tr key={p.id} className={`border-b border-border ${i % 2 === 0 ? "" : "bg-[#0a101a]"}`}>
                                <td className="p-[10px_14px] font-mono text-primary font-bold text-[12px]">{p.barcode}</td>
                                <td className="p-[10px_14px] text-body font-medium">{p.name}</td>
                                <td className="p-[10px_14px] text-label">{p.supplier_code || "—"}</td>
                                <td className="p-[10px_14px] text-label">{p.supplier_name || "—"}</td>
                                <td className="p-[10px_14px]">
                                    {canEdit && (
                                        <button
                                            onClick={() => { setEditItem(p); setShowForm(true); }}
                                            className="bg-border border-none rounded-[6px] text-primary cursor-pointer p-[6px] flex hover:bg-muted transition-colors duration-150"
                                        >
                                            <Icon name="edit" size={13} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <CatalogForm
                    initial={editItem}
                    onClose={() => { setShowForm(false); setEditItem(null); }}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}