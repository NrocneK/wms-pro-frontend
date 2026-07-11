export const WAREHOUSES = ["X1", "XN", "Q1", "N1"];
export const CATEGORIES = ["Điện tử", "Thực phẩm", "May mặc", "Hóa phẩm", "Thiết bị", "Văn phòng phẩm", "Khác"];
export const UNITS = ["Cái", "Hộp", "Thùng", "Kg", "Lít", "Mét", "Cuộn"];

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";

// Danh sách nhà sách liên kết hệ thống kho — mã (ký hiệu) → tên đầy đủ
export const BOOKSTORES = {
    AP: "AN PHÚ", PO: "ONLINE", NO: "NGUYỄN OANH", AT: "NGUYỄN ẢNH THỦ",
    RM: "RẠCH MIỄU", VV: "LÊ VĂN VIỆT", ES: "ESTELLA", TN: "BA THÁNG HAI",
    HV: "HOÀNG VIỆT", TD: "THỦ ĐỨC", OV: "VIVO CITY", CR: "CRESCENT MALL",
    SG: "NGUYỄN HUỆ", BP: "BÌNH PHÚ", Y1: "NGUYỄN TRÃI", NB: "NGUYỄN VĂN BÌNH",
    NF: "BCF NGUYỄN VĂN BÌNH", CE: "LÊ LỢI", VH: "SƯ VẠN HẠNH", PT: "PHÚ THỌ",
    B1: "BÌNH DƯƠNG", BA: "PEEKTOY BÌNH DƯƠNG", BH: "BIÊN HÒA", DK: "ĐỒNG KHỞI",
    NA: "VINH", NL: "LOTTE VINH", H7: "STELLAR HN", GM: "GARDEN MALL",
    VC: "LOTTE HN", HN: "HN CENTER", H5: "LẠC LONG QUÂN HN", H6: "PHỐ SÁCH HN",
    QN: "QUẢNG NINH", U5: "PHÚ XUÂN", UP: "SB PHÚ BÀI", D5: "ĐÀ NẴNG",
    D8: "SB ĐÀ NẴNG", D6: "VC ĐÀ NẴNG", R5: "NHA TRANG", DL: "ĐÀ LẠT",
    LD: "BẢO LỘC", D7: "AEON ĐÀ NẴNG", LO: "VĨNH LONG", C5: "CẦN THƠ",
    KG: "KIÊN GIANG", BM: "BUÔN MÊ THUỘT", K2: "KONTUM", PR: "PHAN RANG",
    B5: "PHAN THIẾT", TA: "TÂN PHÚ", LM: "LANDMARK 81",
};

// Dịch mã → tên đầy đủ. Xử lý được cả chuỗi nhiều mã gộp "C5, B5, R5" (trường
// hợp phiếu xuất gộp nhiều nhà sách). Mã lạ không có trong danh mục → giữ
// nguyên mã gốc thay vì hiện "undefined".
export const bookstoreName = (codes) => {
    if (!codes) return codes;
    return String(codes)
        .split(",")
        .map(c => c.trim())
        .map(c => BOOKSTORES[c] || c)
        .join(", ");
};