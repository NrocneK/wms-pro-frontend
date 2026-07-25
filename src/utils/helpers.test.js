// src/utils/helpers.test.js
//
// Đây là file TEST — không phải code chạy trong app thật, chỉ chạy khi
// gõ `npm test`. Nhiệm vụ: gọi từng hàm trong helpers.js với 1 số đầu vào
// đã biết trước, so sánh kết quả với đáp án đúng.
//
// Cấu trúc chuẩn của 1 file test:
//   describe("tên nhóm", () => {          // gom nhiều test liên quan lại
//     test("mô tả trường hợp", () => {     // 1 trường hợp cụ thể
//       expect(kết_quả_thực_tế).toBe(đáp_án_đúng);
//     });
//   });

import { describe, test, expect } from "vitest";
import { fmtNum, fmtCur, fmtCompact, calcStatus, daysDiff, applyZeroReclaim } from "./helpers";

describe("fmtNum — định dạng số có dấu chấm ngăn cách hàng nghìn", () => {
    test("số nguyên bình thường", () => {
        expect(fmtNum(1500)).toBe("1.500");
    });

    test("số 0", () => {
        expect(fmtNum(0)).toBe("0");
    });

    test("giá trị null/undefined phải coi như 0, không được lỗi", () => {
        expect(fmtNum(null)).toBe("0");
        expect(fmtNum(undefined)).toBe("0");
    });
});

describe("fmtCur — định dạng tiền tệ VNĐ", () => {
    // LƯU Ý QUAN TRỌNG: Intl.NumberFormat chèn NON-BREAKING SPACE (\u00A0)
    // giữa số và ký hiệu "₫" — nhìn y hệt dấu cách thường nhưng là 2 ký tự
    // KHÁC NHAU. Gõ dấu cách thường vào chuỗi so sánh sẽ làm test luôn FAIL
    // dù giá trị "trông" giống hệt nhau. Đây là lý do phải dùng \u00A0 thay
    // vì gõ tay dấu cách trong các test bên dưới.
    test("số dương", () => {
        expect(fmtCur(15000)).toBe("15.000\u00A0₫");
    });

    test("số 0", () => {
        expect(fmtCur(0)).toBe("0\u00A0₫");
    });
});

describe("fmtCompact — rút gọn số tiền lớn (dùng cho biểu đồ, KPI card)", () => {
    test("dưới 1 triệu thì vẫn hiện đầy đủ như fmtCur", () => {
        expect(fmtCompact(500000)).toBe("500.000\u00A0₫");
    });

    test("từ 1 triệu trở lên thì rút gọn dạng 'x,xxM đ'", () => {
        expect(fmtCompact(2_500_000)).toBe("2,50M đ");
    });

    test("từ 1 tỷ trở lên thì rút gọn dạng 'x,xxB đ'", () => {
        expect(fmtCompact(1_200_000_000)).toBe("1,20B đ");
    });
});

describe("calcStatus — xác định trạng thái tồn kho theo số lượng", () => {
    // Đây là hàm NGHIỆP VỤ quan trọng — sai hàm này sẽ khiến cảnh báo tồn
    // kho hiển thị sai trên toàn bộ Dashboard/Reports, nên test kỹ từng mốc.
    test("số lượng = 0 → 'zero' (hết hàng)", () => {
        expect(calcStatus(0, 5)).toBe("zero");
    });

    test("số lượng <= tồn tối thiểu → 'low' (sắp hết, cần nhập gấp)", () => {
        expect(calcStatus(5, 5)).toBe("low");
        expect(calcStatus(3, 5)).toBe("low");
    });

    test("số lượng <= 2 lần tồn tối thiểu → 'warning' (nên chú ý)", () => {
        expect(calcStatus(10, 5)).toBe("warning");
        expect(calcStatus(6, 5)).toBe("warning");
    });

    test("số lượng dư dả → 'ok'", () => {
        expect(calcStatus(11, 5)).toBe("ok");
        expect(calcStatus(1000, 5)).toBe("ok");
    });

    test("dùng tồn tối thiểu mặc định = 5 khi không truyền vào", () => {
        expect(calcStatus(5)).toBe("low");
    });
});

describe("daysDiff — số ngày đã trôi qua kể từ 1 mốc thời gian", () => {
    test("không có ngày truyền vào → trả về 9999 (coi như rất lâu rồi)", () => {
        expect(daysDiff(null)).toBe(9999);
        expect(daysDiff("")).toBe(9999);
    });

    test("ngày hôm nay → 0 ngày", () => {
        const today = new Date().toISOString();
        expect(daysDiff(today)).toBe(0);
    });

    test("ngày 5 hôm trước → đúng 5 ngày", () => {
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
        expect(daysDiff(fiveDaysAgo)).toBe(5);
    });
});

describe("applyZeroReclaim — thu hồi vị trí kho của sản phẩm hết hàng lâu ngày", () => {
    test("sản phẩm hết hàng ĐỦ 3 ngày → xóa vị trí, đánh dấu 'zero'", () => {
        const oldZeroDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
        const input = [{ id: 1, quantity: 0, zeroSince: oldZeroDate, location: "A1.2", status: "low" }];
        const result = applyZeroReclaim(input);
        expect(result[0].location).toBe("");
        expect(result[0].status).toBe("zero");
    });

    test("sản phẩm hết hàng nhưng CHƯA ĐỦ 3 ngày → giữ nguyên vị trí", () => {
        const recentZeroDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
        const input = [{ id: 1, quantity: 0, zeroSince: recentZeroDate, location: "A1.2", status: "low" }];
        const result = applyZeroReclaim(input);
        expect(result[0].location).toBe("A1.2");
    });

    test("sản phẩm còn hàng → không bị đụng vào, giữ nguyên mọi thứ", () => {
        const input = [{ id: 1, quantity: 10, zeroSince: null, location: "A1.2", status: "ok" }];
        const result = applyZeroReclaim(input);
        expect(result[0]).toEqual(input[0]);
    });
});