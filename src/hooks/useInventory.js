// src/hooks/useInventory.js
// Load danh sách tồn kho toàn cục (dùng ở Dashboard, Inventory, Reports...)

import { useState, useCallback, useEffect } from "react";
import { inventoryApi } from "../api/client";

export function useInventory(user) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");

    const loadInventory = useCallback(() => {
        let active = true;
        inventoryApi
            .getAll({ limit: 5000 })
            .then((data) => {
                if (!active) return;
                const mapped = (data.items || []).map((item) => ({
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
                    createdAt:
                        item.updated_at?.split("T")[0] ||
                        new Date().toISOString().split("T")[0],
                    category: "Khác",
                    supplier: "",
                }));
                setProducts(mapped);
            })
            .catch((err) => {
                if (!active) return;
                setApiError("Không thể tải dữ liệu tồn kho: " + err.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!user) return;
        const cleanup = loadInventory();
        return cleanup;
    }, [user, loadInventory]);

    return { products, setProducts, loading, apiError, loadInventory };
}