# WMS Pro — Frontend

> A warehouse management system built for a real, nationwide bookstore retail chain — not a tutorial project. Every screen maps to an actual daily task: receiving stock, dispatching orders to ~50 store locations, and keeping multi-warehouse inventory accurate.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

**Backend repo:** [wms-pro-backend](https://github.com/NrocneK/wms-pro-backend)

---

## Table of Contents

- [Background](#background)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Design notes worth reading](#design-notes-worth-reading)
- [Known limitations](#known-limitations)

---

## Background

After working as a Warehouse Supervisor at a bookstore retail chain, I saw first-hand how error-prone and slow a manual, Excel-based stock process is once you're juggling multiple warehouses and dozens of store locations.

**WMS Pro** is a production system built directly against that workflow. It isn't designed around a generic "inventory CRUD" tutorial — it's designed around the actual files the company's internal systems export, the actual roles on a warehouse team, and the actual problems that show up once real people start using it (which is also why several entries below are marked "fixed after real-world testing" rather than pretending the first version was right).

---

## Features

### Product Catalog vs. Inventory — kept strictly separate

The catalog (`Danh Mục Sản Phẩm`) is a warehouse-independent list of SKUs; inventory (`Tồn Kho`) is what's physically on hand per warehouse. The catalog never writes to stock, and bulk-adding to the catalog never touches inventory — a boundary that was tightened more than once after early versions blurred it.

- Bulk-add products from Excel, with column headers matched **by name** — upload the company's own export file as-is, in any column order, and the system finds `barcode`, `name`, `unit`, `cost_price`, `sell_price`, `supplier_code`, `supplier_name` regardless of position.
- Existing barcodes are never overwritten: a bulk upload only **fills in fields that are currently empty**, and reports exactly which fields it touched.
- Optional warehouse assignment at confirm time, for newly-created catalog entries only.
- Admin-only soft delete.

### Import / Export (stock-in / stock-out)

- Same header-name-matching approach applied to real company export files (`RHE_ID`, `IIT_CODE`, `DIS_QUANTITY`, `RETAIL_UNIT_PRICE`, …), including parsing the company's own `DD-MMM-YY` date format.
- Inventory status ("MỚI" / "CÓ SẴN" for import, "SẴN SÀNG" / "THIẾU TỒN" / "HẾT HÀNG" / "KHÔNG TÌM THẤY" for export) is checked against the **specific warehouse the transaction is for** — not just "does this barcode exist somewhere" — so the review screen never shows stock that actually belongs to a different warehouse.
- Sort and filter the review table by status or column (barcode, name, quantity) before confirming — useful once a file has hundreds of rows and only a handful need attention.
- Responsive by necessity: below 768px the review table becomes a stacked card list instead of a horizontally-scrolling table, since this page is used from a phone on the warehouse floor as often as from a desk.
- Picking-slip generation, with Excel export and a printable PDF (Vietnamese-font-aware, via a lazily-loaded jsPDF + AutoTable).
- Camera barcode scanning (`html5-qrcode`) for picking without a dedicated scanner.

### Inventory

- Multi-warehouse stock view with live status badges and low-stock highlighting.
- Free-text bin locations, auto-reclaimed by the backend 3 days after an item hits zero stock.

### Dashboard & Reports

- KPI cards, activity chart, warehouse distribution, and recent transaction history.
- Reports page: stock overview, low-stock alerts, and a full audit-log tab (every write anywhere in the system, filterable).

### Role-based access

- **Admin** — full access, user management, can delete catalog entries.
- **Manager** — catalog and bulk-import access.
- **Staff / Warehouse Keeper** — scoped to their own assigned warehouse; still sees the full shared catalog, but can only edit stock in their own warehouse.

---

## Tech stack

| Category     | Technology                                                               |
| ------------ | ------------------------------------------------------------------------ |
| Framework    | React 19                                                                 |
| Build tool   | Vite 8                                                                   |
| Styling      | Tailwind CSS v4                                                          |
| Routing      | React Router v7                                                          |
| HTTP client  | Axios (list/detail) + native `fetch` (file upload)                       |
| Excel I/O    | SheetJS (`xlsx`)                                                         |
| Barcode scan | html5-qrcode                                                             |
| PDF export   | jsPDF + jsPDF-AutoTable, loaded on demand from a CDN rather than bundled |
| Icons        | lucide-react                                                             |
| Tests        | vitest                                                                   |

---

## Architecture

```
React 19 + Vite
    │
    ├── Pages (React Router)
    │     ├── Dashboard
    │     ├── Inventory        (Tồn Kho tab + Danh Mục Sản Phẩm tab)
    │     ├── Import / Export
    │     ├── Reports          (Overview / Alerts / Audit Log)
    │     └── User Management  (Admin only)
    │
    └── services/*.js  ──►  REST API (wms-pro-backend, /api/v1)  ──►  MySQL
```

**Deployment:** Frontend on Vercel · Backend on Render · Database on Aiven (managed MySQL).

---

## Getting started

### Prerequisites

- Node.js ≥ 18
- A running instance of [wms-pro-backend](https://github.com/NrocneK/wms-pro-backend)

### Installation

```bash
git clone https://github.com/NrocneK/wms-pro-frontend.git
cd wms-pro-frontend
npm install

# create .env.local (see below)
npm run dev   # http://localhost:5173
```

---

## Environment variables

```env
VITE_API_BASE=http://localhost:3001/api/v1
```

Falls back to that same localhost URL if unset, so local development works without a `.env` file as long as the backend runs on the default port. Set `VITE_API_BASE` to the deployed backend's URL (including the `/api/v1` prefix) for production builds.

---

## Project structure

```
src/
├── main.jsx / App.jsx        # Entry point, router
├── pages/                    # One file per route
├── components/
│   ├── layout/                # Sidebar (responsive: mobile drawer, collapsible desktop), header
│   ├── inventory/              # Catalog, bulk import, barcode scanner, stock view
│   ├── export/                 # Review table, packing, pick-slip modal
│   ├── dashboard/               # KPI cards, charts, transaction history
│   ├── reports/                 # Stock overview, alerts, audit log tabs
│   ├── users/                   # User form, list, role constants
│   └── ui/                      # Shared primitives (Modal, Btn, Icon, ConfirmModal…)
├── hooks/                     # Data-fetching + local state per feature (useInventoryList, useExportReview…)
├── services/                  # One file per API domain, all going through services/http.js
├── utils/                     # Excel templates, PDF export, formatting helpers
└── constants/                 # Warehouse codes, bookstore code → name map, API base URL
```

---

## Design notes worth reading

A few decisions that aren't obvious from the file list alone:

- **Header-name column matching lives in one place on the backend** (`excelColumns.js`), shared by every Excel-consuming feature. The frontend never assumes a fixed column layout either — it always renders whatever the parse step returns.
- **`warehouse_codes` is a comma-joined, deduplicated field**, not a join artifact — the catalog list is grouped by product server-side (`GROUP BY` + `GROUP_CONCAT`) specifically so a product stocked in three warehouses shows up as one row, not three.
- **Status badges use `whitespace-nowrap` deliberately.** Vietnamese status labels are often two or three words; without it, badges wrap mid-word on narrow screens and the table looks broken rather than just tight.
- **Bookstore codes are resolved to names client-side only**, via a static map in `constants/index.js` (`BOOKSTORES`) — the database only ever stores the short code, so relabeling a store doesn't require a migration.

---

## Known limitations

- **Automated test coverage is minimal** (one `vitest` file). Manual testing against real exported files from the company's internal system is the primary way Excel-import changes are verified before shipping.
- **No offline support.** The app assumes a live connection to the backend at all times — relevant given it's used on warehouse-floor mobile devices where connectivity isn't always reliable.
- **Tokens are stored in `localStorage`**, which is simple to reason about but more exposed to XSS than an httpOnly-cookie-based session would be — an acceptable trade-off for an internal tool behind a login wall, worth revisiting if this were ever exposed more broadly.

---

## Author

**Ngo Minh Nhut**

- GitHub: [@NrocneK](https://github.com/NrocneK)
- Email: kdc.1110639@gmail.com

> Built from real warehouse experience — every feature above exists because a real workflow needed it, and most of the "fixed after real-world testing" details exist because a real user (also me) caught them in use.
