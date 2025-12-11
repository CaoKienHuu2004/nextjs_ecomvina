// types/product.ts
export interface ProductVariant {
  id_bienthe?: number;
  giahientai?: number;
  giagoc?: number;
  giamgia?: number;
  loai_bien_the?: number | string;
  // thêm các trường khác nếu API trả về
}

export interface VariantType {
  id_loaibienthe?: number;
  ten?: string;
}

export interface PriceInfo {
  current?: number;
  before_discount?: number;
  discount_percent?: number;
}

export interface ProductImageItem {
  hinhanh?: string;
}

export interface RatingInfo {
  average?: number;
  // có thể thêm total, count...
}

export interface SoldInfo {
  total_sold?: number;
  // hoặc có thể là number
}

export interface ProductDetail {
  id?: number | string;
  ten?: string;
  slug?: string;
  hinh_anh?: string;
  images?: string[];
  mediaurl?: string;
  anh_san_pham?: ProductImageItem[];
  gia?: PriceInfo;
  bienthe_khichon_loaibienthe_themvaogio?: ProductVariant[];
  loai_bien_the?: VariantType[];
  thuonghieu?: string;
  xuatxu?: string;
  sanxuat?: string;
  sold?: SoldInfo | number;
  sold_count?: number | string;
  rating?: RatingInfo;
  // thêm các trường khác tùy API
}