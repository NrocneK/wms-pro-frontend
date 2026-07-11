export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("vi-VN"); } catch { return d || ""; } };
export const fmtNum = (n) => Number(n || 0).toLocaleString("vi-VN");
export const fmtCur = (n) => Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
export const daysDiff = (dateStr) => {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
};

export const calcStatus = (qty, min = 5) => {
  if (qty === 0) return "zero";
  if (qty <= min) return "low";
  if (qty <= min * 2) return "warning";
  return "ok";
};

export const applyZeroReclaim = (products) =>
  products.map(p => {
    if (p.quantity === 0 && p.zeroSince && daysDiff(p.zeroSince) >= 3) {
      return { ...p, location: "", status: "zero" };
    }
    return p;
  });
