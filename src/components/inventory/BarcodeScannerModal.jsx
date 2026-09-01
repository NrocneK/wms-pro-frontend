// src/components/inventory/BarcodeScannerModal.jsx
//
// Modal quét barcode bằng camera thiết bị (điện thoại/laptop).
// Dùng thư viện html5-qrcode (dựa trên ZXing-js) — hỗ trợ tốt các loại
// mã vạch sách/xuất bản phẩm: EAN-13, EAN-8, UPC-A/E, CODE-128, CODE-39, ITF, Codabar.
//
// LƯU Ý QUAN TRỌNG:
// - getUserMedia (API camera của trình duyệt) chỉ hoạt động trên HTTPS hoặc localhost.
//   -> Trên Vercel (https) và khi dev local (http://localhost) đều chạy được bình thường.
//   -> Nếu deploy ở domain http:// khác thì camera sẽ bị trình duyệt chặn.
// - Trên iOS Safari, người dùng phải cấp quyền camera thủ công lần đầu.

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } from "html5-qrcode";
import Icon from "../ui/Icon";

const SCANNER_ELEMENT_ID = "barcode-scanner-viewport";

// Giới hạn định dạng cần quét để tăng tốc độ + độ chính xác nhận diện,
// thay vì để thư viện dò tất cả định dạng (bao gồm QR code không cần thiết ở đây).
const BARCODE_FORMATS = [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.CODABAR,
];

export default function BarcodeScannerModal({ onDetected, onClose }) {
    const scannerRef = useRef(null);
    const [error, setError] = useState("");
    const [starting, setStarting] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
            formatsToSupport: BARCODE_FORMATS,
            verbose: false,
        });
        scannerRef.current = scanner;

        scanner
            .start(
                { facingMode: "environment" }, // ưu tiên camera sau (phù hợp quét vật lý)
                { fps: 10, qrbox: { width: 280, height: 160 } },
                (decodedText) => {
                    // Quét thành công — tránh gọi callback nhiều lần nếu camera
                    // bắt được nhiều khung hình liên tiếp trước khi kịp stop().
                    if (cancelled) return;
                    cancelled = true;
                    onDetected(decodedText.trim());
                },
                () => {
                    // Lỗi nhận diện từng khung hình (bình thường, xảy ra liên tục
                    // khi camera chưa bắt được mã vạch) — không cần xử lý.
                }
            )
            .then(() => {
                if (!cancelled) setStarting(false);
            })
            .catch((err) => {
                setStarting(false);
                setError(
                    "Không thể mở camera. Vui lòng cấp quyền truy cập camera cho trình duyệt, " +
                    "hoặc dùng máy quét mã vạch USB thay thế."
                );
                console.error("Barcode scanner start error:", err);
            });

        return () => {
            cancelled = true;
            // Html5Qrcode.stop() chỉ được gọi khi scanner đang thực sự chạy,
            // nếu không sẽ ném lỗi "scanner is not running".
            const s = scannerRef.current;
            if (s && s.getState && s.getState() === Html5QrcodeScannerState.SCANNING) {
                s.stop().catch(() => { }).finally(() => s.clear());
            } else if (s) {
                s.clear();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-[4px] z-[1200] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-card border border-border rounded-2xl w-full max-w-[420px]"
                style={{ boxShadow: "0 24px 80px rgba(0,0,0,.6)" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                    <h3 className="m-0 text-[17px] font-bold text-heading flex items-center gap-2">
                        <Icon name="scan" size={18} />
                        Quét mã vạch
                    </h3>
                    <button
                        onClick={onClose}
                        className="bg-border border-none rounded-lg text-label cursor-pointer p-[6px] flex items-center hover:text-heading transition-colors duration-150"
                    >
                        <Icon name="close" size={16} />
                    </button>
                </div>
                <div className="p-6">
                    {error ? (
                        <div className="text-[13px] text-danger text-center py-6">{error}</div>
                    ) : (
                        <>
                            {starting && (
                                <div className="text-[12px] text-label text-center mb-2">Đang khởi động camera...</div>
                            )}
                            <div
                                id={SCANNER_ELEMENT_ID}
                                className="rounded-xl overflow-hidden bg-black"
                                style={{ minHeight: 220 }}
                            />
                            <div className="text-[11px] text-dim text-center mt-3">
                                Đưa mã vạch vào giữa khung hình để quét tự động.
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
