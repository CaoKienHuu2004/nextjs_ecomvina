// Types cho API response từ /api/trang-chu

// Type cho từ khóa tìm kiếm
export type TuKhoa = {
  id: number;
  tukhoa: string;
  luottruycap: number;
  lienket: string;
};

// Type cho banner quảng cáo
export type BannerQuangCao = {
  id: number;
  vitri: string;
  hinhanh: string;
  lienket: string;
  mota: string;
  trangthai: string;
};

// Type cho danh mục
export type DanhMuc = {
  id: number;
  ten: string;
  slug: string;
  logo: string;
  total_luotban: string;
  lienket: string;
};

// Type cho sản phẩm
export type SanPham = {
  id: number;
  name: string;
  slug: string;
  originalPrice: number;
  discount: number;
  sold: number;
  rating: number;
  brand: string;
  categories: string[];
  image: string;
};

// Type cho chương trình khuyến mãi/sự kiện
export type ChuongTrinhKhuyenMai = {
  id: number;
  title: string;
  condition: string;
  information: string;
  image: string;
  views: number;
  start_date: string;
  end_date: string;
  time_remaining: string;
  program: {
    id: number;
    title: string;
    image: string;
  };
};

// Type cho danh mục với sản phẩm
export type DanhMucVoiSanPham = {
  id: number;
  name: string;
  slug: string;
  total_sold: number;
  products: SanPham[];
};

// Type cho thương hiệu
export type ThuongHieu = {
  id: number;
  name: string;
  slug: string;
  logo: string;
  description: string;
  total_sold: number;
};

// Union type cho tất cả các item trong response
export type TrangChuItem =
  | TuKhoa
  | BannerQuangCao
  | DanhMuc
  | SanPham
  | ChuongTrinhKhuyenMai
  | DanhMucVoiSanPham
  | ThuongHieu;

// Type guards để xác định loại item
export const isTuKhoa = (item: TrangChuItem): item is TuKhoa => {
  return 'tukhoa' in item && 'luottruycap' in item;
};

export const isBannerQuangCao = (item: TrangChuItem): item is BannerQuangCao => {
  return 'vitri' in item && 'hinhanh' in item;
};

export const isDanhMuc = (item: TrangChuItem): item is DanhMuc => {
  return 'ten' in item && 'logo' in item && 'total_luotban' in item && !('products' in item);
};

export const isSanPham = (item: TrangChuItem): item is SanPham => {
  return 'name' in item && 'originalPrice' in item && 'categories' in item;
};

export const isChuongTrinhKhuyenMai = (item: TrangChuItem): item is ChuongTrinhKhuyenMai => {
  return 'title' in item && 'condition' in item && 'program' in item;
};

export const isDanhMucVoiSanPham = (item: TrangChuItem): item is DanhMucVoiSanPham => {
  return 'name' in item && 'products' in item && Array.isArray((item as any).products);
};

export const isThuongHieu = (item: TrangChuItem): item is ThuongHieu => {
  return 'name' in item && 'description' in item && 'total_sold' in item && !('categories' in item);
};

// Helper functions để lọc các loại item từ response
export const filterTuKhoa = (items: TrangChuItem[]): TuKhoa[] => {
  return items.filter(isTuKhoa);
};

export const filterBannerQuangCao = (items: TrangChuItem[]): BannerQuangCao[] => {
  return items.filter(isBannerQuangCao);
};

export const filterDanhMuc = (items: TrangChuItem[]): DanhMuc[] => {
  return items.filter(isDanhMuc);
};

export const filterSanPham = (items: TrangChuItem[]): SanPham[] => {
  return items.filter(isSanPham);
};

export const filterChuongTrinhKhuyenMai = (items: TrangChuItem[]): ChuongTrinhKhuyenMai[] => {
  return items.filter(isChuongTrinhKhuyenMai);
};

export const filterDanhMucVoiSanPham = (items: TrangChuItem[]): DanhMucVoiSanPham[] => {
  return items.filter(isDanhMucVoiSanPham);
};

export const filterThuongHieu = (items: TrangChuItem[]): ThuongHieu[] => {
  return items.filter(isThuongHieu);
};

// Type cho response chính từ API
export type TrangChuResponse = TrangChuItem[];

// Type cho dữ liệu đã được phân loại
export type PhanLoaiTrangChu = {
  tuKhoas: TuKhoa[];
  bannerQuangCaos: BannerQuangCao[];
  danhMucs: DanhMuc[];
  sanPhams: SanPham[];
  chuongTrinhKhuyenMais: ChuongTrinhKhuyenMai[];
  danhMucVoiSanPhams: DanhMucVoiSanPham[];
  thuongHieus: ThuongHieu[];
};

// Hàm phân loại dữ liệu từ API response
export const phanLoaiTrangChu = (response: TrangChuResponse): PhanLoaiTrangChu => {
  return {
    tuKhoas: filterTuKhoa(response),
    bannerQuangCaos: filterBannerQuangCao(response),
    danhMucs: filterDanhMuc(response),
    sanPhams: filterSanPham(response),
    chuongTrinhKhuyenMais: filterChuongTrinhKhuyenMai(response),
    danhMucVoiSanPhams: filterDanhMucVoiSanPham(response),
    thuongHieus: filterThuongHieu(response),
  };
};

// Helper function để lấy banner theo vị trí
export const getBannerByViTri = (banners: BannerQuangCao[], viTri: string): BannerQuangCao[] => {
  return banners.filter(banner => banner.vitri === viTri);
};

// Helper function để lấy sản phẩm theo danh mục
export const getSanPhamByDanhMuc = (sanPhams: SanPham[], danhMuc: string): SanPham[] => {
  return sanPhams.filter(sp => sp.categories.includes(danhMuc));
};

// Helper function để lấy sản phẩm có discount
export const getSanPhamKhuyenMai = (sanPhams: SanPham[]): SanPham[] => {
  return sanPhams.filter(sp => sp.discount > 0);
};

// Helper function để lấy sản phẩm bán chạy
export const getSanPhamBanChay = (sanPhams: SanPham[], limit: number = 10): SanPham[] => {
  return sanPhams
    .filter(sp => sp.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, limit);
};

// Helper function để tính giá sau discount
export const tinhGiaSauDiscount = (sanPham: SanPham): number => {
  return sanPham.originalPrice * (1 - sanPham.discount / 100);
};

// Helper function để format tiền
export const formatTien = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

// Helper function để lấy rating stars
export const getRatingStars = (rating: number): string => {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
};

// Type cho filter options
export type FilterOptions = {
  danhMuc?: string;
  thuongHieu?: string;
  giaMin?: number;
  giaMax?: number;
  discount?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'sold' | 'rating';
};

// Hàm filter sản phẩm
export const filterSanPhams = (sanPhams: SanPham[], options: FilterOptions): SanPham[] => {
  let filtered = [...sanPhams];

  if (options.danhMuc) {
    filtered = filtered.filter(sp => sp.categories.includes(options.danhMuc!));
  }

  if (options.thuongHieu) {
    filtered = filtered.filter(sp => sp.brand === options.thuongHieu);
  }

  if (options.giaMin !== undefined) {
    filtered = filtered.filter(sp => tinhGiaSauDiscount(sp) >= options.giaMin!);
  }

  if (options.giaMax !== undefined) {
    filtered = filtered.filter(sp => tinhGiaSauDiscount(sp) <= options.giaMax!);
  }

  if (options.discount) {
    filtered = filtered.filter(sp => sp.discount > 0);
  }

  // Sort
  if (options.sortBy) {
    switch (options.sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => tinhGiaSauDiscount(a) - tinhGiaSauDiscount(b));
        break;
      case 'price_desc':
        filtered.sort((a, b) => tinhGiaSauDiscount(b) - tinhGiaSauDiscount(a));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'sold':
        filtered.sort((a, b) => b.sold - a.sold);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
    }
  }

  return filtered;
};