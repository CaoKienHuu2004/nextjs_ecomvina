// utils/format.ts

/**
 * Định dạng số tiền sang chuẩn Việt Nam
 * Input: 100000, "200000", null, undefined
 * Output: "100.000 đ", "200.000 đ", "0 đ"
 */
export const formatVND = (value: number | string | null | undefined): string => {
  // 1. Chuyển đổi input về số
  const amount = Number(value);

  // 2. Kiểm tra nếu không phải số hợp lệ hoặc bằng 0
  if (Number.isNaN(amount) || amount === 0) {
    return "0 đ";
  }

  // 3. Format theo locale vi-VN (dùng dấu chấm phân cách hàng nghìn)
  return amount.toLocaleString("vi-VN") + " đ";
};

/**
 * (Tùy chọn) Hàm tính % giảm giá an toàn
 */
export const calculateDiscountPercent = (original: number, current: number): number => {
  if (!original || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
};