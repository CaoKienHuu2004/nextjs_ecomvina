
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

// Trả về key trạng thái dùng cho filter / badge (optional)
export const getStatusKey = (status?: string): string => {
  const s = (status || "").toString().toLowerCase();
  if (s.includes("chờ xử lý") || s.includes("chờ thanh toán") || s.includes("pending") || s.includes("chờ duyệt")) return "pending";
  if (s.includes("đã xác nhận") || s.includes("xác nhận") || s.includes("đã thanh toán")) return "confirmed";
  if (s.includes("đang chuẩn bị") || s.includes("đang chuẩn bị hàng") || s.includes("đóng gói") || s.includes("preparing")) return "processing";
  if (s.includes("đang giao") || s.includes("shipping")) return "shipping";
  if (s.includes("đã giao") || s.includes("delivered") || s.includes("thành công")) return "completed";
  if (s.includes("đã hủy") || s.includes("hủy") || s.includes("cancel")) return "cancelled";
  return "all";
};

// Icon theo trạng thái (trả class icon)
export const statusIcon = (status?: string): string => {
  switch (getStatusKey(status)) {
    case "pending": return "ph-clock-countdown";
    case "confirmed": return "ph-clock-countdown";
    case "processing": return "ph-package";
    case "shipping": return "ph-truck";
    case "completed": return "ph-check-fat";
    case "cancelled": return "ph-prohibit";
    default: return "ph-clock-countdown";
  }
};

// ClassName (CSS utility) cho badge theo trạng thái
export const statusBadgeClass = (status?: string): string => {
  switch (getStatusKey(status)) {
    case "pending":
      return "fw-medium text-xs text-warning-700 bg-warning-100 px-6 py-2 rounded-4 flex-align gap-8";
    case "confirmed":
      return "fw-medium text-xs text-warning-700 bg-warning-100 px-6 py-2 rounded-4 flex-align gap-8";
    case "processing":
      return "fw-medium text-xs border border-gray-200 px-6 py-2 rounded-4 flex-align gap-8";
    case "shipping":
      return "fw-medium text-xs text-main-700 bg-main-100 px-6 py-2 rounded-4 flex-align gap-8";
    case "completed":
      return "fw-medium text-xs text-success-700 bg-success-100 px-6 py-2 rounded-4 flex-align gap-8";
    case "cancelled":
      return "fw-medium text-xs text-danger-700 bg-danger-100 px-6 py-2 rounded-4 flex-align gap-8";
    default:
      return "fw-medium text-xs text-gray-700 bg-gray-100 px-6 py-2 rounded-4 flex-align gap-8";
  }
};

// Tiện ích trả full props (icon + class)
export const getStatusBadgeProps = (status?: string) => {
  return { icon: statusIcon(status), className: statusBadgeClass(status) };
};