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
  TOI_DON_HANGS: "/api/tai-khoan/donhangs",
  TOI_GIO_HANG: "/api/toi/giohang",
  TOI_GIO_HANG_ITEM: (id: string | number) => `/api/toi/giohang/${id}`,
  TOI_THONG_BAOS: "/api/toi/thongbaos",
  TOI_DIA_CHIS: "/api/tai-khoan/diachis",
  TOI_DIA_CHI_ITEM: (id: string | number) => `/api/tai-khoan/diachis/${id}`,
  TOI_DANH_GIAS: "/api/toi/danhgias",
  TOI_DANH_GIA_ITEM: (id: string | number) => `/api/toi/danhgias/${id}`,
  TOI_YEU_THICHS: "/api/tai-khoan/yeuthichs",
  TOI_YEU_THICH_ITEM: (idSanPham: string | number) => `/api/tai-khoan/yeuthichs/${idSanPham}`,

  // xac-thuc-tai-khoan  Auth
  AUTH_DANG_KY: "/api/auth/dang-ky", //POST
  AUTH_DANG_NHAP: "/api/auth/dang-nhap", //POST
  AUTH_DANG_XUAT: "/api/auth/dang-xuat", //POST
  AUTH_ME: "/api/auth/thong-tin-nguoi-dung", //POST
  AUTH_ME_UPDATE: "/api/auth/cap-nhat-thong-tin", //POST

  // Khác (banner, chương trình, mã giảm giá, từ khoá, ...) // ko quan trọng lắm có trong trang-chu
  
  BANNERS: "/api/bannerquangcaos",
  SU_KIENS: "/api/chuongtrinhsukiens",
  MA_GIAM_GIAS: "/api/magiamgias",
  
};