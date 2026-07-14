// src/components/ui/Icon.jsx
import {
  LayoutDashboard,
  Package,
  Download,
  Upload,
  Search,
  Warehouse,
  AlertTriangle,
  X,
  Plus,
  Pencil,
  Trash2,
  Printer,
  UploadCloud,
  Check,
  Menu,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  User,
  LogOut,
} from "lucide-react";

const ICONS = {
  dashboard: LayoutDashboard,
  inventory: Package,
  import_: Download,
  export_: Upload,
  search: Search,
  warehouse: Warehouse,
  alert: AlertTriangle,
  close: X,
  plus: Plus,
  edit: Pencil,
  delete: Trash2,
  print: Printer,
  upload: UploadCloud,
  check: Check,
  menu: Menu,
  excel: FileSpreadsheet,
  pdf: FileText,
  "chevron-down": ChevronDown,
  user: User,
  logout: LogOut,
};

// className prop cho phép ghi đè màu bằng Tailwind (vd: className="text-primary")
// style prop giữ để backward compat với các component chưa migrate
export default function Icon({ name, size = 18, className = "", style = {} }) {
  const LucideIcon = ICONS[name] || Check;
  return (
    <LucideIcon
      size={size}
      strokeWidth={2}
      className={`flex-shrink-0 ${className}`}
      style={Object.keys(style).length > 0 ? style : undefined}
    />
  );
}