
export const getTrangThaiDonHang = (trang_thai: string | undefined | null): string => {
  if (!trang_thai) return 'Chưa rõ';
  const s = trang_thai.toString().trim().toLowerCase();
  // Map theo yêu cầu:
  if (s.includes("chờ xử lý") || s.includes("chờ thanh toán") || s.includes("pending") || s.includes("chờ duyệt")) {
    return "Chờ thanh toán";
  }
  if (s.includes("đã xác nhận") || s.includes("xác nhận")) {
    return "Đang xác nhận";
  }
  if (s.includes("đang chuẩn bị") || s.includes("đang chuẩn bị hàng") || s.includes("đóng gói") || s.includes("preparing")) {
    return "Đang đóng gói";
  }
  if (s.includes("đang giao") || s.includes("shipping")) {
    return "Đang giao hàng";
  }
  if (s.includes("đã giao") || s.includes("delivered")) {
    return "Đã giao";
  }
  if (s.includes("đã hủy") || s.includes("cancel") || s.includes("cancelled")) {
    return "Đã hủy";
  }
  // Fallback: nếu gặp 'đã thanh toán' vẫn có thể coi là 'Đã xác nhận'
  if (s.includes("đã thanh toán") || s === "paid") return "Đang xác nhận";
  return "Chưa rõ";
};

/**
 * Ánh xạ phương thức thanh toán (Sử dụng tên trường Việt)
 */
export const getPhuongThucThanhToan = (id_phuongthuc: number | undefined | null): string => {
  switch (id_phuongthuc) {
    case 1:
      return 'Thanh toán qua VNPAY';
    case 2:
      return 'Thanh toán qua Ví điện tử';
    case 3: 
      return 'Thanh toán khi nhận hàng (COD)'; // ID 3 được dùng trong DOCX
    default:
      return 'Chưa rõ';
  }
};

// Bạn cần import và sử dụng các hàm này trong hoan-tat-thanh-toan/page.tsx và orders/page.tsx
// Ví dụ: {getTrangThaiDonHang(order.trangthai)}