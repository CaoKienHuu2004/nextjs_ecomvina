import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/utils/api";
import { API_ROUTES } from "./apiRoutes";

// Trang chủ
export function getTrangChu(params?: Record<string, string | number>) {
  const qs = params
    ? `?${new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString()}`
    : "";

  return apiGet<any>(`${API_ROUTES.TRANG_CHU}${qs}`);
}
// Tìm kiếm
export function timKiem(params: { query?: string; danhmuc?: string; thuonghieu?: string; locgia?: string; page?: number; per_page?: number }) {
  const qs = `?${new URLSearchParams(
    Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)]))
  ).toString()}`;
  return apiGet<any>(`${API_ROUTES.TIM_KIEM}${qs}`);
}

// Sản phẩm
export const getSanPhamList = (params?: Record<string, string | number>) => {
  const qs = params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}` : "";
  return apiGet<any>(`${API_ROUTES.SAN_PHAM_LIST}${qs}`);
};
export const getSanPhamById = (id: string | number) => apiGet<any>(API_ROUTES.SAN_PHAM_SHOW(id));

// Danh mục
export const getDanhMucAll = () => apiGet<any>(API_ROUTES.DANH_MUC_LIST);

// Tỉnh thành
export const getTinhThanh = () => apiGet<any>(API_ROUTES.TINH_THANH);

// Yêu thích (yêu cầu đăng nhập nếu backend bắt buộc)
export const getToiYeuThichs = async () => {
  // suppressThrow: true để không làm crash UI khi lỗi mạng / chưa đăng nhập
  return await apiGet<any>(API_ROUTES.TOI_YEU_THICHS, { withAuth: true, suppressThrow: true });
};
export const addToiYeuThich = (payload: { id_sanpham: number | string }) =>
  apiPost<any>(API_ROUTES.TOI_YEU_THICHS, payload, { withAuth: true });
export const toggleToiYeuThich = (idSanPham: number | string) =>
  apiPut<any>(API_ROUTES.TOI_YEU_THICH_ITEM(idSanPham), {}, { withAuth: true });

// Giỏ hàng (thêm/sửa/xoá)
export const getToiGioHang = () => apiGet<any>(API_ROUTES.TOI_GIO_HANG, { withAuth: true });
export const addToiGioHang = (payload: any) => apiPost<any>(API_ROUTES.TOI_GIO_HANG, payload, { withAuth: true });
export const updateToiGioHang = (id: number | string, payload: any) =>
  apiPut<any>(API_ROUTES.TOI_GIO_HANG_ITEM(id), payload, { withAuth: true });
export const deleteToiGioHang = (id: number | string) =>
  apiDelete<any>(API_ROUTES.TOI_GIO_HANG_ITEM(id), { withAuth: true });

// Auth
export const postDangKy = (payload: any) => apiPost<any>(API_ROUTES.AUTH_DANG_KY, payload);
export const postCapNhatThongTinNguoidung = (payload: any) => apiPost<any>(API_ROUTES.AUTH_ME_UPDATE, payload);
export const postDangNhap = (payload: any) => apiPost<any>(API_ROUTES.AUTH_DANG_NHAP, payload);
export const postDangXuat = () => apiPost<any>(API_ROUTES.AUTH_DANG_XUAT, {});
export const getThongTinNguoiDung = () => apiGet<any>(API_ROUTES.AUTH_ME, { withAuth: true });

// Banner, sự kiện, mã giảm giá, từ khoá
export const getBanners = () => apiGet<any>(API_ROUTES.BANNERS);
export const getSuKienList = () => apiGet<any>(API_ROUTES.SU_KIENS);
export const getMaGiamGiaList = () => apiGet<any>(API_ROUTES.MA_GIAM_GIAS);
export const getTuKhoaList = () => apiGet<any>(API_ROUTES.TU_KHOAS);

// ==================== ĐƠN HÀNG APIs ====================

export const getDonHangList = () => 
  apiGet<any>(API_ROUTES.TOI_DON_HANGS, { withAuth: true });

export const getDonHangDetail = (id: string | number) => 
  apiGet<any>(API_ROUTES.TOI_DON_HANG_DETAIL(id), { withAuth: true });

export const huyDonHang = (id: string | number) => 
  apiPatch<any>(API_ROUTES.TOI_DON_HANG_HUY(id), {}, { withAuth: true });

export const muaLaiDonHang = (id: string | number) => 
  apiPatch<any>(API_ROUTES.TOI_DON_HANG_MUA_LAI(id), {}, { withAuth: true });

export const thanhToanLaiDonHang = (id: string | number) => 
  apiPatch<any>(API_ROUTES.TOI_DON_HANG_THANH_TOAN_LAI(id), {}, { withAuth: true });

export const getPaymentUrl = (id: string | number, provider?: string) => 
  apiPost<any>(
    API_ROUTES.TOI_DON_HANG_PAYMENT_URL(id), 
    { provider }, 
    { withAuth: true }
  );

export const capNhatPhuongThucThanhToan = (id: string | number, ma_phuongthuc: string) => 
  apiPatch<any>(
    API_ROUTES.TOI_DON_HANG_PHUONG_THUC(id), 
    { ma_phuongthuc }, 
    { withAuth: true }
  );

export const capNhatTrangThaiDonHang = (id: string | number, payload: Record<string, any>) => 
  apiPatch<any>(
    API_ROUTES.TOI_DON_HANG_TRANG_THAI(id), 
    payload, 
    { withAuth: true }
  );