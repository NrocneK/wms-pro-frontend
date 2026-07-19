// src/hooks/useInventoryList.js
// Toàn bộ state + logic của danh sách "Tồn kho": tìm kiếm, lọc, sắp xếp, phân
// trang, CRUD. Tách từ Inventory.jsx (phần lớn dòng 307-444 bản gốc trước
// Phase 3) — KHÔNG đổi logic, chỉ đổi vị trí.
// LƯU Ý: editItem (đang sửa sản phẩm nào) vẫn do trang Inventory.jsx quản lý
// vì nó gắn với việc mở/đóng modal — hook chỉ nhận editItem làm tham số khi
// cần lưu, không tự giữ state đó.
import { useState, useEffect, useRef } from "react";
import { inventoryApi } from "../services/inventoryService";

const PER = 20;

export const SORT_LABELS = {
    "Barcode": "barcode",
    "Tên sản phẩm": "product_name",
    "SL tồn": "quantity",
    "Vị trí": "location",
    "Kho": "warehouse_code",
    "Giá vốn": "cost_price",
    "Giá trị tồn kho": "stock_value",
};

export function useInventoryList({ onRefresh, refreshKey, showAlert, showConfirm }) {
    const [search, setSearch] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [filterWH, setFWH] = useState("all");
    const [filterLocation, setFilterLocation] = useState("");
    const [inputLocation, setInputLocation] = useState("");
    const [sortBy, setSortBy] = useState("product_name");
    const [sortDir, setSortDir] = useState("asc");
    const locationDebounceRef = useRef(null);
    const searchDebounceRef = useRef(null);
    const [page, setPage] = useState(1);
    const [apiItems, setApiItems] = useState([]);
    const [apiTotal, setApiTotal] = useState(0);
    const [apiLoading, setApiLoading] = useState(false);
    const [localRefreshKey, setLocalRefreshKey] = useState(0);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Fetch từ API mỗi khi search/filterWH/page thay đổi
    useEffect(() => {
        let active = true;
        // eslint-disable-next-line
        setApiLoading(true);
        const params = { page, limit: PER, sort_by: sortBy, sort_dir: sortDir };
        if (search.trim()) params.search = search.trim();
        if (filterWH !== "all") params.warehouse_code = filterWH;
        if (filterLocation.trim()) params.location = filterLocation.trim();
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
    }, [search, filterWH, filterLocation, sortBy, sortDir, page, refreshKey, localRefreshKey]);

    // eslint-disable-next-line
    useEffect(() => { setSelectedIds(new Set()); }, [search, filterWH, filterLocation, sortBy, sortDir]);

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

    const handleSave = async (item, editItem) => {
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

    const handleSort = (col) => {
        if (sortBy === col) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortBy(col);
            setSortDir("asc");
        }
        setPage(1);
    };

    const handleSearchInput = (val) => {
        setInputValue(val);
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 350);
    };

    const handleLocationInput = (val) => {
        setInputLocation(val);
        clearTimeout(locationDebounceRef.current);
        locationDebounceRef.current = setTimeout(() => { setFilterLocation(val); setPage(1); }, 350);
    };

    const handleFilterWH = (val) => { setFWH(val); setPage(1); };

    return {
        search, inputValue, filterWH, filterLocation, inputLocation,
        sortBy, sortDir, page, setPage,
        apiItems, apiTotal, apiLoading, paged, totalPages,
        selectedIds, setSelectedIds,
        handleDelete, handleSave, handleBulkDelete, handleSort,
        handleSearchInput, handleLocationInput, handleFilterWH,
        refetch: () => setLocalRefreshKey(k => k + 1), // dùng khi có thao tác ngoài hook này làm đổi dữ liệu (vd: import Excel)
    };
}