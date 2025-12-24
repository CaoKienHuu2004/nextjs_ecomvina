export const API_ROUTES = {
  // cong-khai Web/Frontend pages
  TRANG_CHU: "/api/trang-chu",
  TIM_KIEM: "/api/tim-kiem",
  SAN_PHAM_LIST: "/api/sanphams-all",
  SAN_PHAM_SHOW: (id: string | number) => `/api/sanphams-all/${id}`,
  DANH_MUC_LIST: "/api/danhmucs-all",
  TINH_THANH: "/api/tinh-thanh",

  // Routes gọi kèm endpoint khác
  TU_KHOAS: "/api/tukhoas",

  // can-xac-thuc-tai-khoan-truoc Người dùng - Frontend scope - routes đăng nhập token
  TOI_DON_HANGS: "/api/v1/don-hang",
  TOI_DON_HANG_DETAIL: (id: string | number) => `/api/v1/don-hang/${id}`,
  TOI_DON_HANG_HUY: (id: string | number) => `/api/v1/don-hang/${id}/huy`,
  TOI_DON_HANG_MUA_LAI: (id: string | number) => `/api/v1/don-hang/${id}/mua-lai-don-hang`,
  TOI_DON_HANG_THANH_TOAN_LAI: (id: string | number) => `/api/v1/don-hang/${id}/thanh-toan-lai-don-hang`,
  TOI_DON_HANG_PAYMENT_URL: (id: string | number) => `/api/v1/don-hang/${id}/payment-url`,
  TOI_DON_HANG_PHUONG_THUC: (id: string | number) => `/api/v1/don-hang/${id}/phuong-thuc`,
  TOI_DON_HANG_TRANG_THAI: (id: string | number) => `/api/v1/don-hang/${id}/trang-thai`,
  
  TOI_GIO_HANG: "/api/v1/gio-hang",
  TOI_GIO_HANG_ITEM: (id: string | number) => `/api/v1/gio-hang/${id}`,
  TOI_THONG_BAOS: "/api/tai-khoan/thongbaos",
  TOI_DIA_CHIS: "/api/tai-khoan/diachis",
  TOI_DIA_CHI_ITEM: (id: string | number) => `/api/tai-khoan/diachis/${id}`,
  TOI_DANH_GIAS: "/api/toi/danhgias",
  TOI_DANH_GIA_ITEM: (id: string | number) => `/api/toi/danhgias/${id}`,
  TOI_YEU_THICHS: "/api/v1/yeu-thich",
  TOI_YEU_THICH_ITEM: (idSanPham: string | number) => `/api/v1/yeu-thich/${idSanPham}`,

  // xac-thuc-tai-khoan  Auth
  AUTH_DANG_KY: "/api/v1/dang-ky", //POST
  AUTH_DANG_NHAP: "/api/v1/dang-nhap", //POST
  AUTH_DANG_XUAT: "/api/v1/dang-xuat", //POST
  AUTH_ME: "/api/v1/thong-tin-ca-nhan", //POST
  AUTH_ME_UPDATE: "/api/v1/thong-tin-ca-nhan/cap-nhat", //POST

  // Khác (banner, chương trình, mã giảm giá, từ khoá, ...) // ko quan trọng lắm có trong trang-chu
  BANNERS: "/api/bannerquangcaos",
  SU_KIENS: "/api/chuongtrinhsukiens",
  MA_GIAM_GIAS: "/api/magiamgias",
};