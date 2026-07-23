# WMS Pro — Frontend

Giao diện quản lý kho (Warehouse Management System) cho nghiệp vụ nhà sách/xuất bản — Dashboard trực quan, quản lý tồn kho đa kho, nhập/xuất kho qua Excel, soạn hàng theo phiếu, in phiếu tìm hàng (PDF/Excel), phân quyền theo vai trò và theo kho, nhật ký thao tác.

Đây là frontend cho [wms-pro-backend](https://github.com/NrocneK/wms-pro-backend).

## Demo

- **Production:** triển khai trên [Vercel](https://vercel.com)
- **Backend API:** triển khai trên [Render](https://render.com), cơ sở dữ liệu [Aiven](https://aiven.io) (MySQL managed)

## Công nghệ sử dụng

- **React 19** + **Vite** — SPA, build nhanh, HMR khi dev
- **React Router** — điều hướng theo URL, hỗ trợ deep-link/bookmark từng trang
- **Tailwind CSS v4** — styling, có breakpoint tùy chỉnh `wide` (1080px) để chuyển đổi bảng ↔ thẻ trên di động
- **jsPDF** + **jsPDF-AutoTable** — xuất phiếu tìm hàng PDF (font tiếng Việt Roboto)
- **SheetJS (xlsx)** — đọc/ghi file Excel cho nhập/xuất kho, đồng bộ tồn kho hàng loạt
- **lucide-react** — bộ icon

## Cấu trúc thư mục

```
src/
├── pages/                     # Từng trang tương ứng 1 mục ở sidebar (Dashboard, Inventory, Import, Export, Reports, Users, Login)
├── components/
│   ├── layout/                  # Sidebar, Header, các phần khung chung
│   ├── ui/                      # Component dùng chung (Button, Modal, Input, Table...)
│   └── <domain>/                # Component riêng theo từng trang (dashboard/, inventory/, export/, reports/, users/)
├── hooks/                      # Logic state + gọi API, tách khỏi UI (theo pattern 1 hook = 1 luồng nghiệp vụ)
├── services/                   # Gọi API — 1 file = 1 domain, khớp 1-1 với route backend
├── utils/                      # Hàm thuần túy (format ngày/tiền tệ, tạo file Excel/PDF)
└── constants/                  # Hằng số dùng chung (danh sách kho, đơn vị, mã nhà sách...)
```

Các trang lớn được tách theo pattern: `pages/<Tên>.jsx` chỉ còn nhiệm vụ compose hook + component, toàn bộ state/logic nằm trong `hooks/use<Tên>.js`, toàn bộ UI phức tạp nằm trong `components/<domain>/`.

## Cài đặt & chạy local

### Yêu cầu

- Node.js ≥ 18
- Backend đã chạy sẵn (xem [wms-pro-backend](https://github.com/NrocneK/wms-pro-backend))

### Các bước

```bash
git clone https://github.com/NrocneK/wms-pro-frontend.git
cd wms-pro-frontend
npm install
```

Tạo file `.env` (không bắt buộc nếu backend chạy ở `http://localhost:3001`):

```bash
VITE_API_BASE=http://localhost:3001/api/v1
```

Chạy dev server:

```bash
npm run dev
```

Mặc định chạy ở `http://localhost:5173`.

### Build production

```bash
npm run build      # đóng gói vào thư mục dist/, có code-splitting theo từng trang
npm run preview     # chạy thử bản build production ở local trước khi deploy
```

## Các quy tắc kỹ thuật cần lưu ý

- **Import/Export luôn được mounted** (ẩn/hiện bằng CSS `display`, không unmount qua route) — để giữ nguyên dữ liệu đang nhập dở khi người dùng chuyển sang trang khác rồi quay lại. Không refactor sang `<Routes>`/`<Route>` cho 2 trang này vì sẽ làm mất tính chất đó.
- **Code-splitting theo trang:** các trang (trừ Login) được tải bằng `React.lazy()`, chỉ tải chunk JS tương ứng khi người dùng thực sự vào trang đó — giảm đáng kể thời gian tải lần đầu.
- **Breakpoint `wide` (1080px):** dùng riêng cho việc chuyển đổi giữa layout bảng (desktop) và layout thẻ (mobile/tablet), tách biệt với các breakpoint chuẩn của Tailwind.
- **Chiều cao cột biểu đồ Dashboard** dùng giá trị pixel cố định qua inline style, không dùng phần trăm bên trong flex container (tránh lỗi hiển thị sai tỉ lệ).

## Phân quyền theo giao diện

| Vai trò     | Có thể thấy/làm                                                |
| ----------- | -------------------------------------------------------------- |
| **admin**   | Toàn bộ trang, bao gồm Quản lý người dùng                      |
| **manager** | Dashboard, Tồn kho (sửa được), Nhập/Xuất kho, Báo cáo          |
| **staff**   | Nhập/Xuất kho; chỉ xem (không sửa) Dashboard, Tồn kho, Báo cáo |

Tài khoản được gán 1 kho cụ thể sẽ chỉ thấy dữ liệu của kho đó trên toàn bộ giao diện (đồng bộ với giới hạn phía backend).

## Triển khai (Production)

Đang deploy trên **Vercel**, cấu hình rewrite SPA trong `vercel.json` để mọi route đều trả về `index.html` (bắt buộc vì dùng React Router). Biến môi trường `VITE_API_BASE` cần trỏ đúng domain backend thật khi deploy.
