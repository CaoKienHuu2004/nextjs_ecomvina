export const getTrangThaiDonHang = (
  trang_thai: string | undefined | null,
  trangthaithanhtoan?: string | undefined | null
): string => {
  if (!trang_thai && !trangthaithanhtoan) return "Chưa rõ";
  const s = (trang_thai || "").toString().trim().toLowerCase();
  const pay = (trangthaithanhtoan || "").toString().trim().toLowerCase();

  // delivered + paid => Thành công
  if ((s.includes("đã giao") || s.includes("đã giao hàng") || s.includes("delivered")) &&
    (pay.includes("đã thanh toán") || pay.includes("paid") || pay.includes("đã thanh toán"))) {
    return "Thành công";
  }

  if (s.includes("chờ thanh toán") || pay.includes("chờ thanh toán") || s.includes("pending") || pay.includes("pending")) return "Chờ thanh toán";
  if (s.includes("chờ xử lý") || s.includes("đang xử lý") || s.includes("đã xác nhận") || s.includes("xác nhận")) return "Đang xử lý";
  if (s.includes("đang chuẩn bị") || s.includes("đóng gói") || s.includes("preparing")) return "Đang xử lý";
  if (s.includes("đang giao") || s.includes("đang giao hàng") || s.includes("shipping")) return "Đang vận chuyển";
  if (s.includes("đã giao") || s.includes("đã giao hàng") || s.includes("delivered")) return "Đã giao";
  if (s.includes("thành công") || s === "completed" || s === "success") return "Thành công";
  if (s.includes("đã hủy") || s.includes("hủy") || s.includes("cancel")) return "Đã hủy";

  return "Chưa rõ";
};

export const getPhuongThucThanhToan = (id_phuongthuc: number | undefined | null): string => {
  switch (id_phuongthuc) {
    case 1:
      return "Thanh toán qua VNPAY";
    case 2:
      return "Thanh toán qua Ví điện tử";
    case 3:
      return "Thanh toán khi nhận hàng (COD)";
    default:
      return "Chưa rõ";
  }
};// Trả về key dùng cho filter/badge
export const getStatusKey = (status?: string, paymentStatus?: string): string => {
  const s = (status || "").toString().toLowerCase();
  const pay = (paymentStatus || "").toString().toLowerCase();

  if ((s.includes("đã giao") || s.includes("delivered")) &&
    (pay.includes("đã thanh toán") || pay.includes("paid") || pay.includes("thành công"))) {
    return "completed";
  }
  if (s.includes("chờ thanh toán") || pay.includes("chờ thanh toán") || s.includes("pending")) return "pending";
  if (s.includes("chờ xác nhận") || s.includes("đang xử lý") || s.includes("chờ xử lý") || s.includes("xác nhận")) return "processing";
  if (s.includes("đang đóng gói") || s.includes("preparing")) return "shipping";
  if (s.includes("đang giao") || s.includes("đang giao hàng") || s.includes("shipping")) return "delivered";
  if (s.includes("đã giao") || s.includes("delivered")) return "delivered";
  if (s.includes("đã hủy") || s.includes("hủy") || s.includes("cancel")) return "cancelled";
  return "all";
};

export const statusIcon = (status?: string, paymentStatus?: string): string => {
  switch (getStatusKey(status, paymentStatus)) {
    case "pending": return "ph-wallet";
    case "processing": return "ph-clock-countdown";
    case "shipping": return "ph-package";
    case "delivered": return "ph-truck";
    case "completed": return "ph-check-fat";
    case "cancelled": return "ph-prohibit";
    default: return "ph-clock-countdown";
  }
};

export const statusBadgeClass = (status?: string, paymentStatus?: string): string => {
  switch (getStatusKey(status, paymentStatus)) {
    case "pending":
      return "fw-medium text-xs text-warning-700 bg-warning-100 px-6 py-2 rounded-4 flex-align gap-8";
    case "processing":
      return "fw-medium text-xs border border-gray-200 px-6 py-2 rounded-4 flex-align gap-8";
    case "shipping":
      return "fw-medium text-xs text-main-700 bg-main-100 px-6 py-2 rounded-4 flex-align gap-8";
    case "delivered":
      return "fw-medium text-xs text-main-700 bg-main-100 px-6 py-2 rounded-4 flex-align gap-8";
    case "completed":
      return "fw-medium text-xs text-success-700 bg-success-100 px-6 py-2 rounded-4 flex-align gap-8";
    case "cancelled":
      return "fw-medium text-xs text-danger-700 bg-danger-100 px-6 py-2 rounded-4 flex-align gap-8";
    default:
      return "fw-medium text-xs text-gray-700 bg-gray-100 px-6 py-2 rounded-4 flex-align gap-8";
  }
};

export const getStatusBadgeProps = (status?: string, paymentStatus?: string) => {
  return { icon: statusIcon(status, paymentStatus), className: statusBadgeClass(status, paymentStatus) };
};

export const formatPrice = (val?: number | string | null): string => {
  const n = Number(val ?? 0);
  if (isNaN(n)) return "0 ₫";
  return n.toLocaleString("vi-VN") + " ₫";
};