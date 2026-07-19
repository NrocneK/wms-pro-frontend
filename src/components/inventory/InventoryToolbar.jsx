// src/components/inventory/InventoryToolbar.jsx
import Icon from "../ui/Icon";
import { Btn, Inp, Sel } from "../ui";
import { WAREHOUSES } from "../../constants";
import { downloadInventoryTemplate, exportInventoryToExcel } from "../../utils/excelInventory";

export default function InventoryToolbar({
    list, canEdit, userWarehouseCode, showAlert, exporting, setExporting,
    onAddClick, onExcelClick,
}) {
    const { inputValue, handleSearchInput, filterWH, handleFilterWH, inputLocation, handleLocationInput, search } = list;

    return (
        <div className="flex gap-[10px] mb-[18px] flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px]">
                <Icon
                    name="search" size={14}
                    className="absolute left-[10px] top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
                />
                <Inp
                    placeholder="Tìm tên hoặc barcode"
                    value={inputValue}
                    onChange={e => handleSearchInput(e.target.value)}
                    style={{ paddingLeft: 32 }}
                />
            </div>

            {!userWarehouseCode && (
                <Sel value={filterWH} onChange={e => handleFilterWH(e.target.value)} style={{ width: 120 }}>
                    <option value="all">Tất cả kho</option>
                    {WAREHOUSES.map(w => <option key={w}>{w}</option>)}
                </Sel>
            )}

            <div className="relative" style={{ width: 150 }}>
                <Inp
                    placeholder="Lọc vị trí..."
                    value={inputLocation}
                    onChange={e => handleLocationInput(e.target.value)}
                />
            </div>

            {canEdit && (
                <Btn onClick={onAddClick}>
                    <Icon name="plus" size={15} /> Thêm sản phẩm
                </Btn>
            )}
            {canEdit && (
                <Btn onClick={onExcelClick} color="#10b981" outline>
                    <Icon name="excel" size={15} /> Nhập Excel
                </Btn>
            )}
            <Btn
                onClick={() => exportInventoryToExcel({ search, filterWH, showAlert, setExporting })}
                color="#3b82f6" outline
                disabled={exporting}
            >
                <Icon name="download" size={15} /> {exporting ? "Đang xuất..." : "Xuất Excel"}
            </Btn>
            {canEdit && (
                <Btn onClick={downloadInventoryTemplate} color="#334155" outline>
                    <Icon name="excel" size={15} /> Tải file mẫu
                </Btn>
            )}
        </div>
    );
}