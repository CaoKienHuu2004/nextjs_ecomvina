// utils/chitietdh.ts

// 1. Định nghĩa các Key trạng thái (Thêm 'packing')
export type OrderStatusKey = 
  | 'all'
  | 'pending'     // Chờ thanh toán
  | 'processing'  // Chờ xác nhận
  | 'packing'     // Đang đóng gói (Mới)
  | 'shipping'    // Đang giao hàng
  | 'delivered'   // Đã giao
  | 'completed'   // Thành công
  | 'cancelled';  // Đã hủy

// Hàm chuẩn hóa chuỗi
const normalize = (str?: string | null) => (str || "").toString().trim().toLowerCase();

// --- 2. LOGIC LỌC ĐƠN HÀNG (QUAN TRỌNG) ---
export const matchesFilter = (
  filter: OrderStatusKey,
  status?: string,
  paymentStatus?: string
): boolean => {
  const s = normalize(status);       
  const p = normalize(paymentStatus); 

  // Các cờ kiểm tra dựa trên dữ liệu API thực tế
  const isHuy = s.includes("hủy") || s.includes("cancel");
  const isHoanThanh = s.includes("hoàn thành") || s.includes("thành công") || s.includes("completed");
  
  // Trạng thái Admin
  const adChoXacNhan = s.includes("chờ xác nhận") || s.includes("processing") || s.includes("pending");
  const adDongGoi    = s.includes("đang đóng gói") || s.includes("packing") || s.includes("chuẩn bị");
  const adDangGiao   = s.includes("đang giao") || s.includes("shipping");
  const adDaGiao     = s.includes("đã giao") || s.includes("delivered");

  // Trạng thái Thanh toán
  const payCho = p.includes("chờ") || p.includes("pending") || p.includes("unpaid") || p.includes("chưa");
  const payXong = p.includes("đã thanh toán") || p.includes("paid");
  const payCOD = p.includes("khi nhận hàng") || p.includes("cod");

  switch (filter) {
    case 'all': return true;

    case 'pending': // LABEL: Chờ thanh toán
      if (isHuy) return false;
      // Logic: Thanh toán là "Chờ..." (Bất kể đơn đang ở đâu, trừ khi đã hủy)
      return payCho;

    case 'processing': // LABEL: Chờ xác nhận
      // Logic: Admin "Chờ xác nhận" VÀ (Đã thanh toán HOẶC COD)
      return adChoXacNhan && (payXong || payCOD);

    case 'packing': // LABEL: Đang đóng gói
      return adDongGoi;

    case 'shipping': // LABEL: Đang giao hàng
      return adDangGiao;

    case 'delivered': // LABEL: Đã giao
      // Logic: Chỉ cần Admin bảo "Đã giao" là hiện
      return adDaGiao;

    case 'completed': // LABEL: Thành công
      // 1. Admin "Hoàn thành"
      if (isHoanThanh) return true;
      // 2. Hoặc: Đã giao + Đã thanh toán
      if (adDaGiao && payXong) return true;
      return false;

    case 'cancelled': // LABEL: Đã hủy
      return isHuy;

    default: return false;
  }
};

// --- 3. HELPER HIỂN THỊ UI (Label & Badge) ---

// Xác định trạng thái ưu tiên để hiển thị Label
export const getDisplayKey = (status?: string, paymentStatus?: string): OrderStatusKey => {
  const s = normalize(status);
  const p = normalize(paymentStatus);

  if (s.includes("hủy")) return 'cancelled';
  if (s.includes("hoàn thành")) return 'completed';
  if (s.includes("đã giao") && p.includes("đã thanh toán")) return 'completed';
  if (s.includes("đã giao")) return 'delivered';
  if (s.includes("đang giao")) return 'shipping';
  if (s.includes("đóng gói")) return 'packing';

  // Phân biệt Chờ xác nhận vs Chờ thanh toán
  if (s.includes("chờ xác nhận")) {
    if (p.includes("chờ") || p.includes("chưa")) return 'pending';
    return 'processing';
  }
  
  if (p.includes("chờ") || s.includes("chờ thanh toán")) return 'pending';
  
  return 'processing';
};

// Hàm lấy Label hiển thị (Thay thế hàm cũ getTrangThaiDonHang)
export const getTrangThaiDonHang = (status?: string, paymentStatus?: string): string => {
  const key = getDisplayKey(status, paymentStatus);
  switch (key) {
    case 'pending': return "Chờ thanh toán";
    case 'processing': return "Chờ xác nhận";
    case 'packing': return "Đang đóng gói";
    case 'shipping': return "Đang giao hàng";
    case 'delivered': return "Đã giao";
    case 'completed': return "Thành công";
    case 'cancelled': return "Đã hủy";
    default: return status || "Chưa rõ";
  }
};

export const getStatusBadgeProps = (status?: string, paymentStatus?: string) => {
  const key = getDisplayKey(status, paymentStatus);
  let icon = "ph-info";
  let className = "gap-8 px-6 py-2 text-xs border fw-medium rounded-4 flex-align";

  switch (key) {
    case 'pending': // Vàng
      icon = "ph-wallet"; className += " text-warning-600 bg-warning-50 border-warning-100"; break;
    case 'processing': // Xanh dương nhạt
      icon = "ph-clipboard-text"; className += " text-info-600 bg-info-50 border-info-100"; break;
    case 'packing': // Tím
      icon = "ph-package"; className += " text-purple-600 bg-purple-50 border-purple-100"; break;
    case 'shipping': // Xanh dương đậm
      icon = "ph-truck"; className += " text-blue-600 bg-blue-50 border-blue-100"; break;
    case 'delivered': // Xanh ngọc
      icon = "ph-map-pin"; className += " text-teal-600 bg-teal-50 border-teal-100"; break;
    case 'completed': // Xanh lá
      icon = "ph-check-circle"; className += " text-success-600 bg-success-50 border-success-100"; break;
    case 'cancelled': // Đỏ
      icon = "ph-x-circle"; className += " text-danger-600 bg-danger-50 border-danger-100"; break;
    default:
      className += " text-gray-600 bg-gray-50 border-gray-100";
  }
  return { icon, className };
};

export const statusIcon = (s?: string, p?: string) => getStatusBadgeProps(s, p).icon;
export const statusBadgeClass = (s?: string, p?: string) => getStatusBadgeProps(s, p).className;

export const formatPrice = (val?: number | string | null): string => {
  const n = Number(val ?? 0);
  if (isNaN(n)) return "0 ₫";
  return n.toLocaleString("vi-VN") + " ₫";
};

export const getPhuongThucThanhToan = (id?: number, code?: string) => {
  if (String(id) === "1" || code === "cod") return "Thanh toán khi nhận hàng (COD)";
  if (String(id) === "3" || code?.includes("qr")) return "Thanh toán qua VNPAY";
  return "Thanh toán khác";
};