# WMS Pro — Warehouse Management System (Frontend)

> A professional warehouse management system built for real-world bookstore & publishing operations.
> Designed from actual warehouse workflows — not a tutorial project.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

**Live Demo:** _coming soon_
**Backend Repo:** [wms-pro-backend](https://github.com/NrocneK/wms-pro-backend)

---

## 🗂️ Table of Contents

- [Background](#-background)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)

---

## 💡 Background

After 2 years as a Warehouse Supervisor at Phuong Nam Bookstore chain, I saw first-hand how manual Excel-based inventory processes were slow, error-prone, and unscalable.

**WMS Pro** was built to solve that exact problem — a real production-grade system designed around the actual day-to-day workflows of a bookstore warehouse: receiving stock, dispatching orders, managing multiple warehouse locations, and generating picking slips for staff.

---

## ✨ Features

### 📦 Inventory Management

- Multi-warehouse inventory tracking
- Real-time stock levels per warehouse
- Low-stock alerts and dashboard overview

### 📥 Import / Export

- Import stock via Excel file (SheetJS) — bulk upload with validation
- Export transactions and inventory reports to Excel
- Batch inventory sync across warehouses

### 🧾 Picking Slips

- Generate picking slips for outbound orders
- Print to PDF with Vietnamese font support (jsPDF + Roboto)
- Export picking slips to Excel

### 🔐 Role-Based Access Control

- **Admin** — full system access, user management
- **Warehouse Keeper** — access limited to assigned warehouse(s)
- Full audit log: every action is recorded with timestamp and user

### 📊 Dashboard

- Inventory overview with charts
- Recent transaction history
- Quick-access shortcuts

---

## 🛠️ Tech Stack

| Category    | Technology              |
| ----------- | ----------------------- |
| Framework   | React 19                |
| Build Tool  | Vite 5                  |
| Styling     | Tailwind CSS v4         |
| Routing     | React Router v6         |
| PDF Export  | jsPDF + jsPDF-AutoTable |
| Excel I/O   | SheetJS (xlsx)          |
| Icons       | lucide-react            |
| HTTP Client | Axios                   |

---

## 🏗️ Architecture

```
Frontend (React 19 + Vite)
    │
    ├── Pages (React Router)
    │     ├── Dashboard
    │     ├── Inventory (per warehouse)
    │     ├── Import / Export
    │     ├── Picking Slips
    │     ├── Audit Log
    │     └── User Management (Admin only)
    │
    └── REST API ──► Backend (Node.js + Express)
                          └── MySQL (Aiven Cloud)
```

**Deployment:**

- Frontend → Vercel
- Backend → Render
- Database → Aiven MySQL (managed cloud)

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- A running instance of [wms-pro-backend](https://github.com/NrocneK/wms-pro-backend)

### Installation

```bash
# Clone the repo
git clone https://github.com/NrocneK/wms-pro-frontend.git
cd wms-pro-frontend

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env

# Start development server
npm run dev
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

For production, set `VITE_API_URL` to your deployed backend URL.

---

## 📁 Project Structure

```
src/
├── main.jsx              # App entry point
├── App.jsx               # Router setup
├── index.css             # Global styles (Tailwind)
├── components/           # Reusable UI components
│   ├── layout/           # Sidebar, Header, PageWrapper
│   ├── ui/               # Button, Modal, Table, Badge...
│   └── shared/           # Charts, FileUpload, PDFViewer
├── pages/                # Route-level page components
│   ├── Dashboard/
│   ├── Inventory/
│   ├── Import/
│   ├── Export/
│   ├── PickingSlip/
│   ├── AuditLog/
│   └── Users/
├── services/             # API call functions (axios)
├── hooks/                # Custom React hooks
├── utils/                # Helpers: format, validate, export
└── constants/            # App-wide constants & config
```

---

## 👤 Author

**Ngo Minh Nhut**

- GitHub: [@NrocneK](https://github.com/NrocneK)
- Email: kdc.1110639@gmail.com

> _Built from real warehouse experience. Every feature exists because a real workflow needed it._
