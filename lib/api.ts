import { VoucherConditionType } from "@/hooks/useCart";

// lib/api.ts
const BASE_URL = process.env.SERVER_API || process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";

if (!BASE_URL) {
  console.warn("⚠️ BASE_URL chưa được khai báo trong .env");
}

/**
 * Định nghĩa các tùy chọn có thể được sử dụng khi thực hiện một yêu cầu fetch.
 *
 * @property method - Phương thức HTTP sẽ sử dụng cho yêu cầu (ví dụ: 'GET', 'POST').
 * @property body - Nội dung (body) của yêu cầu. Thường được sử dụng với các phương thức 'POST' hoặc 'PUT'.
 * @property cache - Chỉ định cách yêu cầu tương tác với bộ nhớ đệm HTTP của trình duyệt.
 * @property headers - Một đối tượng chứa các tiêu đề (header) của yêu cầu.
 * @property credentials - Chính sách về thông tin xác thực (credentials) sẽ được sử dụng cho yêu cầu.
 */
type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  cache?: RequestCache;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
};

/**
 * Gửi một yêu cầu HTTP đến một endpoint cụ thể bằng cách sử dụng `fetch`.
 * Hàm này tự động xử lý việc chuyển đổi body thành JSON, đặt các header mặc định,
 * và xử lý lỗi cho các phản hồi không thành công.
 *
 * @template T - Kiểu dữ liệu mong đợi của dữ liệu phản hồi JSON. Mặc định là `any`.
 * @param {string} endpoint - Đường dẫn API cần gọi (sẽ được nối vào `BASE_URL`).
 * @param {FetchOptions} [options={}] - Một đối tượng tùy chọn cho `fetch`, bao gồm `method`, `headers`, `body`, `cache`, v.v.
 * @returns {Promise<T>} Một promise sẽ phân giải thành dữ liệu JSON từ phản hồi.
 * @throws {Error} Ném ra một lỗi nếu yêu cầu mạng thất bại hoặc nếu máy chủ trả về một mã trạng thái không thành công (ví dụ: 4xx, 5xx).
 */
async function request<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: options.method || "GET",
      cache: options.cache || "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers ?? {}),
      },
      credentials: options.credentials,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  } catch (error) {
    console.error(`❌ API Request failed: ${endpoint}`, error);
    throw error;
  }
}


/**
 * API utility object providing HTTP request methods.
 * 
 * @remarks
 * This object provides convenient methods for making HTTP requests with type safety.
 * All methods return promises that resolve to the specified generic type.
 * 
 * @example
 * ```typescript
 * // GET request with type safety
 * const data = await api.get<User>('/api/users/1');
 * 
 * // POST request with data
 * const newUser = await api.post<User>('/api/users', { name: 'John' });
 * 
 * // PUT request to update data
 * const updated = await api.put<User>('/api/users/1', { name: 'Jane' });
 * 
 * // DELETE request
 * await api.delete('/api/users/1');
 * ```
 */
/**
 * Một đối tượng helper chứa các phương thức để tương tác với API.
 * Các phương thức này là các trình bao bọc (wrapper) xung quanh hàm `request`
 * để đơn giản hóa việc thực hiện các yêu cầu HTTP GET, POST, PUT, và DELETE.
 *
 * @example
 * ```typescript
 * // Lấy danh sách sản phẩm
 * const products = await api.get<Product[]>('/products');
 *
 * // Tạo một sản phẩm mới
 * const newProduct = await api.post<Product>('/products', { name: 'New Product', price: 100 });
 * ```
 */
export const api = {
  get: <T = any>(endpoint: string, cache: RequestCache = "no-store") =>
    request<T>(endpoint, { method: "GET", cache }),

  post: <T = any>(endpoint: string, data?: any) =>
    request<T>(endpoint, { method: "POST", body: data }),

  put: <T = any>(endpoint: string, data?: any) =>
    request<T>(endpoint, { method: "PUT", body: data }),

  delete: <T = any>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
};

export type LoginResponse = { token?: string; accessToken?: string;[k: string]: unknown };
export type RegisterResponse = { success?: boolean; message?: string;[k: string]: unknown };

// ============================================
// Homepage API Types & Functions
interface HeaderCategory { id: number; ten: string; slug: string; logo: string; }
interface HeaderHotKeyword { tukhoa: string; luottruycap: number; }
export interface HeaderDataResponse {
  status: number;
  message: string;
  data: {
    danhmuc: HeaderCategory[];
    tukhoa_placeholder: string;
    tukhoa_phobien: HeaderHotKeyword[];
    cart_auth_count: number;
  };
}
// ============================================

// ===== Hot Keywords =====
export interface HotKeyword {
  id: number;
  tukhoa: string;
  luottruycap: number;
  lienket: string;
}

// ===== Banners =====
export interface HomeBanner {
  id: number;
  vitri: string;
  hinhanh: string;
  lienket: string;
  mota: string;
  trangthai: string;
  thutu?: number; // Optional field for banner order
}

// ===== Categories =====
export interface HotCategory {
  id: number;
  ten: string;
  slug: string;
  logo: string;
  total_luotban: string;
  lienket: string;
}

// ===== Products =====
export interface HomeHotSaleProduct {
  id: number;
  slug: string;
  ten: string;
  hinh_anh: string;
  thuonghieu: string;
  rating: {
    average: number;
    count: number;
  };
  sold_count: string;
  gia: {
    current: number;
    before_discount: number;
    discount_percent: number;
  };
  have_gift: boolean;
}

// ===== Gift Events =====
export interface GiftEvent {
  id: number;
  tieude: string;
  slug?: string;
  dieukien: string;
  thongtin: string;
  hinhanh: string;
  luotxem: number;
  ngaybatdau: string;
  ngayketthuc: string;
  thoigian_conlai: string;
  chuongtrinh: {
    id: number;
    tieude: string;
    hinhanh: string;
  };
}

// ===== Top Categories with Products =====
export interface HomeTopCategoryWithProducts {
  id: number;
  ten: string;
  slug: string;
  total_sold: number;
  sanpham: HomeHotSaleProduct[];
}

// ===== Top Brands =====
export interface TopBrand {
  id: number;
  ten: string;
  slug: string;
  logo: string;
  mota: string;
  total_sold: number;
}

// ===== Coupons =====
export type Coupon = {
  id: number;
  // Giữ cả 2 tên: `magiamgia` (dùng bởi UI hiện tại) và `code` (internal)
  magiamgia?: string | number;
  code: string;
  giatri: number;
  mota?: string;
  min_order_value?: number;
  dieukien?: string;
  condition_type?: VoucherConditionType;
  trangthai?: string;
  ngaybatdau?: string;
  ngayketthuc?: string;
};

// ===== Blog Posts =====
export interface BlogPost {
  id: number;
  tieude: string;
  slug: string;
  noidung: string;
  luotxem: number;
  hinhanh: string;
  trangthai: string;
}

// Fetch all blog posts from API server
export async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    // API trả về mảng JSON thuần các bài viết
    const posts = await api.get<BlogPost[]>("/api-bai-viet");
    return Array.isArray(posts) ? posts : [];
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
}

// Bài viết nổi bật (exported)
export interface HomeFeaturedPost {
  id: number;
  tieude: string;
  slug: string;
  noidung: string;
  luotxem: number;
  hinhanh: string;
  created_at: string;
  nguoidung?: {
    hoten: string;
    avatar: string;
  };
}

// ===== Main Response =====
export interface HomePageResponse {
  status: boolean;
  message: string;
  data: {
    hot_keywords: HotKeyword[];
    new_banners: HomeBanner[];
    hot_categories: HotCategory[];
    hot_sales: HomeHotSaleProduct[];
    hot_gift: GiftEvent[];
    top_categories: HomeTopCategoryWithProducts[];
    top_brands: TopBrand[];
    best_products: HomeHotSaleProduct[];
    new_launch: HomeHotSaleProduct[];
    most_watched: HomeHotSaleProduct[];
    new_coupon?: Coupon[];
    posts_to_explore?: BlogPost[];
    featured_posts?: HomeFeaturedPost[]; // Bài viết nổi bật
  };
}

// ===== Types cho API mới /api/v1/trang-chu =====
type V1BannerItem = {
  id: number;
  vitri: string;
  hinhanh: string; // Full URL từ API
  lienket: string;
  mota: string;
  trangthai: string;
};

type V1ProductImage = { id: number; url: string };

type V1ProductBrand = {
  id: number;
  ten: string;
  slug?: string;
  logo: string;
  trangthai?: string;
};

type V1ProductCategory = {
  id: number;
  ten: string;
  slug: string;
  logo: string;
};

// Biến thể sản phẩm từ API V1
type V1ProductVariant = {
  id: number;
  id_loaibienthe: number;
  tenbienthe?: string; // Tên biến thể từ API mới
  giagoc: number;
  soluong: number;
  luottang: number;
  luotban: number;
  trangthai: string;
  loaibienthe?: {
    id: number;
    ten: string;
  };
};

type V1Product = {
  id: number;
  id_thuonghieu?: number;
  tensanpham?: string; // Dùng trong list API
  ten?: string; // Dùng trong detail API
  slug: string;
  giamgia?: number;
  mota: string;
  luotxem: number;
  trangthai: string;
  hinhanh: V1ProductImage[];
  thuonghieu: V1ProductBrand;
  danhmuc: V1ProductCategory[];
  gia: {
    giagoc: number;
    giadagiam: number;
    formatted_giagoc: string;
    formatted_giadagiam: string;
  };
  tong_luotban?: number;
  bienthe?: V1ProductVariant[];
  xuatxu?: string;
  sanxuat?: string;
  deleted_at?: string | null;
};

type V1Category = {
  id: number;
  ten: string;
  slug: string;
  logo: string; // Full URL từ API
  parent: number | null;
  sapxep: number;
  trangthai: string;
};

type V1Gift = {
  id: number;
  id_chuongtrinh: number | null;
  dieukiensoluong: string;
  dieukiengiatri: number;
  tieude: string;
  slug: string;
  thongtin: string;
  hinhanh: string; // Filename, cần build URL
  luotxem: number;
  ngaybatdau: string;
  ngayketthuc: string;
  trangthai: string;
  deleted_at: string | null;
};

type V1TopCategoryProducts = {
  category: {
    id: number;
    ten: string;
    slug: string;
    logo: string;
    parent: number | null;
    sapxep: number;
    trangthai: string;
  };
  products: V1Product[];
};

// Cấu trúc mới của danhmuchangdau từ API
type V1DanhMucHangDauCategory = {
  id: number;
  ten: string;
  slug: string;
  logo: string;
  parent: number | null;
  sapxep: number;
  trangthai: string;
};

type V1DanhMucHangDauProduct = {
  id: number;
  ten: string;
  slug: string;
  mota: string;
  giamgia: number;
  luotxem: number;
  trangthai: string;
  product_total_sales: string;
  giadagiam: number;
  hinhanhsanpham: { id: number; hinhanh: string; trangthai: string }[];
  thuonghieu: { id: number; ten: string; slug: string; logo: string };
  danhmuc: { id: number; ten: string; slug: string; logo: string }[];
  bienthe_display?: {
    giagoc: number;
    giadagiam: number;
  };
};

type V1DanhMucHangDau = {
  danhsachdmhangdau: V1DanhMucHangDauCategory[];
  sanphamthuocdanhmuc: Record<string, V1DanhMucHangDauProduct[]>;
};

type V1Brand = {
  id: number;
  ten: string;
  slug: string;
  logo: string; // Full URL từ API
  trangthai: string;
  sanpham_count: number;
};

// Bài viết nổi bật
type V1BaiVietNoiBat = {
  id: number;
  id_nguoidung: number;
  tieude: string;
  slug: string;
  noidung: string;
  luotxem: number;
  hinhanh: string;
  trangthai: string;
  created_at: string;
  updated_at: string;
  nguoidung?: {
    id: number;
    username: string;
    hoten: string;
    avatar: string;
  };
};

type V1TrangChuResponse = {
  status: number;
  banners: Record<string, V1BannerItem[]>;
  tatcadanhmuc: V1Category[];
  top_deals: V1Product[];
  chuongtrinhuudaiquatang: V1Gift[];
  danhmuchangdau: V1DanhMucHangDau | V1TopCategoryProducts[];
  top_brands: V1Brand[];
  hangmoichaosan?: V1Product[]; // Hàng mới chào sân - "Sản phẩm mới nhất"
  duocquantamnhieunhat: V1Product[];
  thuonghieuhangdau?: V1Brand[]; // Thương hiệu hàng đầu
  sanphamhangdau?: V1Product[]; // Sản phẩm hàng đầu (best sellers)
  baivietnoibat?: V1BaiVietNoiBat[]; // Bài viết nổi bật
};

/**
 * Fetch homepage data from the API server
 * @param headers - Optional custom headers
 * @param perPage - Number of products per category (default: 6)
 * @returns Promise with homepage data including banners, products, and categories
 */

// Cache cho homepage data
let homePageCache: { data: HomePageResponse | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_DURATION = 60000; // Cache 60 giây

// Retry với exponential backoff
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Nếu là lỗi 429, chờ lâu hơn
      const is429 = lastError.message.includes('429');
      const delay = is429
        ? baseDelay * Math.pow(2, attempt + 1) // 2s, 4s, 8s cho 429
        : baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s cho lỗi khác

      if (attempt < maxRetries - 1) {
        console.log(`⏳ API retry ${attempt + 1}/${maxRetries} sau ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Build URL cho gift image (chỉ còn dùng cho gift vì API trả filename)
function buildGiftImageUrl(filename: string): string {
  if (!filename) return "";
  if (/^https?:\/\//i.test(filename) || filename.startsWith("/")) return filename;
  return `https://sieuthivina.com/assets/client/images/bg/${filename}`;
}

function formatRemainingTime(endAt: string): string {
  const end = new Date(endAt.replace(" ", "T"));
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  if (!Number.isFinite(diff) || diff <= 0) return "0 ngày";

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} ngày`;
  if (hours > 0) return `${hours} giờ`;
  return `${minutes} phút`;
}

// Map V1Product -> HomeHotSaleProduct (API mới đã trả full URL cho ảnh)
function mapV1ProductToHomeProduct(p: V1Product): HomeHotSaleProduct {
  // API mới trả hinhanh[].url là full URL
  let firstImg = "";

  if (Array.isArray(p.hinhanh) && p.hinhanh.length > 0 && p.hinhanh[0]?.url) {
    firstImg = p.hinhanh[0].url;
  } else {
    // Fallback: nếu không có hinhanh array, thử dùng trường khác
    firstImg = (p as any).hinh_anh || (p as any).mediaurl || "/assets/images/thumbs/product-two-img1.png";
    console.warn(`⚠️ Sản phẩm ${p.id} (${p.tensanpham}) không có hinhanh[].url, dùng fallback: ${firstImg}`);
  }

  const current = p.gia?.giadagiam ?? 0;
  const before = p.gia?.giagoc ?? current;
  const discountPercent = p.giamgia ?? (before > 0 ? Math.max(0, Math.round(((before - current) / before) * 100)) : 0);

  return {
    id: p.id,
    slug: p.slug,
    ten: p.tensanpham || p.ten || '',
    hinh_anh: firstImg,
    thuonghieu: p.thuonghieu?.ten ?? "",
    rating: {
      average: 0,
      count: 0,
    },
    sold_count: String(p.tong_luotban ?? 0),
    gia: {
      current,
      before_discount: before,
      discount_percent: discountPercent,
    },
    have_gift: false,
  };
}

// Map V1Gift -> GiftEvent (gift.hinhanh là filename, cần build URL)
function mapV1GiftToGiftEvent(g: V1Gift): GiftEvent {
  return {
    id: g.id,
    tieude: g.tieude,
    slug: g.slug,
    dieukien: g.thongtin || `Mua ${g.dieukiensoluong} sản phẩm`,
    thongtin: g.thongtin,
    hinhanh: buildGiftImageUrl(g.hinhanh),
    luotxem: g.luotxem,
    ngaybatdau: g.ngaybatdau,
    ngayketthuc: g.ngayketthuc,
    thoigian_conlai: formatRemainingTime(g.ngayketthuc),
    chuongtrinh: {
      id: g.id_chuongtrinh ?? 0,
      tieude: "",
      hinhanh: "",
    },
  };
}

export async function fetchHomePage(headers?: Record<string, string>, perPage: number = 6): Promise<HomePageResponse> {
  // Kiểm tra cache
  const now = Date.now();
  if (homePageCache.data && (now - homePageCache.timestamp) < CACHE_DURATION) {
    console.log('📦 Sử dụng cache cho homepage data');
    return homePageCache.data;
  }

  const HOME_API_URL = "https://sieuthivina.com";
  const url = `${HOME_API_URL}/api/v1/trang-chu`;

  const raw = await fetchWithRetry(async () => {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...headers,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Home API error: ${response.status}`);
    }

    return response.json() as Promise<V1TrangChuResponse>;
  }, 3, 1000);

  // Banners - API mới trả full URL cho hinhanh
  const newBanners: HomeBanner[] = Object.values(raw?.banners ?? {})
    .flatMap((arr) => (Array.isArray(arr) ? arr : []))
    .map((b) => ({
      id: b.id,
      vitri: b.vitri,
      hinhanh: b.hinhanh, // Full URL từ API
      lienket: b.lienket,
      mota: b.mota,
      trangthai: b.trangthai,
    }));

  // Products - dùng đúng key từ API mới (thêm Array.isArray check)
  const topDealsRaw = raw?.top_deals;
  const topDeals = (Array.isArray(topDealsRaw) ? topDealsRaw : []).map(mapV1ProductToHomeProduct);
  // Hàng mới chào sân - fallback sang top_deals nếu không có
  const newArrivalsRaw = raw?.hangmoichaosan ?? raw?.top_deals;
  const newArrivals = (Array.isArray(newArrivalsRaw) ? newArrivalsRaw : []).map(mapV1ProductToHomeProduct);
  const mostWatchedRaw = raw?.duocquantamnhieunhat;
  const mostWatched = (Array.isArray(mostWatchedRaw) ? mostWatchedRaw : []).map(mapV1ProductToHomeProduct);

  // Top categories with products - dùng danhmuchangdau (cấu trúc mới)
  const topCategoriesRaw = raw?.danhmuchangdau;
  console.log("🔍 danhmuchangdau raw:", topCategoriesRaw);

  let topCategories: HomeTopCategoryWithProducts[] = [];

  // Kiểm tra cấu trúc mới: { danhsachdmhangdau: [...], sanphamthuocdanhmuc: {...} }
  if (topCategoriesRaw && typeof topCategoriesRaw === 'object' && !Array.isArray(topCategoriesRaw) && 'danhsachdmhangdau' in topCategoriesRaw) {
    const dmhd = topCategoriesRaw as V1DanhMucHangDau;
    const categories = dmhd.danhsachdmhangdau || [];
    const productsByCategory = dmhd.sanphamthuocdanhmuc || {};

    topCategories = categories.map((cat) => {
      const categoryProducts = productsByCategory[String(cat.id)] || [];
      return {
        id: cat.id,
        ten: cat.ten,
        slug: cat.slug,
        total_sold: 0,
        sanpham: categoryProducts.map((p) => ({
          id: p.id,
          ten: p.ten,
          slug: p.slug,
          hinh_anh: p.hinhanhsanpham?.[0]?.hinhanh || "",
          mediaurl: p.hinhanhsanpham?.[0]?.hinhanh || "",
          thuonghieu: p.thuonghieu?.ten || "",
          shop_name: p.thuonghieu?.ten || "Siêu Thị Vina",
          gia: {
            current: p.bienthe_display?.giadagiam ?? p.giadagiam ?? 0,
            before_discount: p.bienthe_display?.giagoc ?? p.giadagiam ?? 0,
            discount_percent: p.giamgia ?? 0,
          },
          rating: { average: 0, count: 0 },
          sold_count: p.product_total_sales || "0",
          have_gift: false,
        })),
      };
    });
  } else if (Array.isArray(topCategoriesRaw)) {
    // Cấu trúc cũ: [{ category: {...}, products: [...] }]
    topCategories = topCategoriesRaw.map((x) => ({
      id: x.category.id,
      ten: x.category.ten,
      slug: x.category.slug,
      total_sold: 0,
      sanpham: (Array.isArray(x.products) ? x.products : []).map(mapV1ProductToHomeProduct),
    }));
  }

  console.log("📊 topCategories mapped:", topCategories.length, topCategories.map(c => ({ id: c.id, ten: c.ten, sanpham: c.sanpham.length })));

  // All categories - dùng tatcadanhmuc, API trả full URL cho logo
  const hotCategoriesRaw = raw?.tatcadanhmuc;
  const hotCategories: HotCategory[] = (Array.isArray(hotCategoriesRaw) ? hotCategoriesRaw : []).map((c) => ({
    id: c.id,
    ten: c.ten,
    slug: c.slug,
    logo: c.logo, // Full URL từ API
    total_luotban: "0",
    lienket: `/shop?category=${encodeURIComponent(c.slug)}`,
  }));

  // Top brands - ưu tiên thuonghieuhangdau, fallback sang top_brands
  // API thuonghieuhangdau trả logo dạng filename, cần build full URL
  const brandSourceRaw = raw?.thuonghieuhangdau ?? raw?.top_brands;
  const brandSource = Array.isArray(brandSourceRaw) ? brandSourceRaw : [];
  const topBrands: TopBrand[] = brandSource.map((b) => ({
    id: b.id,
    ten: b.ten,
    slug: b.slug,
    logo: b.logo?.startsWith('http') ? b.logo : `https://sieuthivina.com/assets/client/images/brands/${b.logo}`,
    mota: "",
    total_sold: b.sanpham_count ?? 0,
  }));

  // Best products - ưu tiên sanphamhangdau (sản phẩm bán chạy nhất), fallback sang top_deals
  const bestProductsRaw = raw?.sanphamhangdau ?? raw?.top_deals;
  const bestProducts = (Array.isArray(bestProductsRaw) ? bestProductsRaw : []).map(mapV1ProductToHomeProduct);
  // Gifts - dùng chuongtrinhuudaiquatang
  const hotGiftsRaw = raw?.chuongtrinhuudaiquatang;
  const hotGifts: GiftEvent[] = (Array.isArray(hotGiftsRaw) ? hotGiftsRaw : []).map(mapV1GiftToGiftEvent);

  // Bài viết nổi bật - dùng baivietnoibat
  const featuredPostsRaw = raw?.baivietnoibat;
  const featuredPosts: HomeFeaturedPost[] = (Array.isArray(featuredPostsRaw) ? featuredPostsRaw : []).map((post) => ({
    id: post.id,
    tieude: post.tieude,
    slug: post.slug,
    noidung: post.noidung,
    luotxem: post.luotxem,
    hinhanh: post.hinhanh,
    created_at: post.created_at,
    nguoidung: post.nguoidung ? {
      hoten: post.nguoidung.hoten,
      avatar: post.nguoidung.avatar,
    } : undefined,
  }));

  const result: HomePageResponse = {
    status: raw?.status === 200,
    message: "",
    data: {
      hot_keywords: [],
      new_banners: newBanners,
      hot_categories: hotCategories,
      hot_sales: topDeals,
      hot_gift: hotGifts,
      top_categories: topCategories,
      top_brands: topBrands,
      best_products: bestProducts, // Dùng sanphamhangdau cho best_products
      new_launch: newArrivals,
      most_watched: mostWatched,
      new_coupon: [],
      posts_to_explore: [],
      featured_posts: featuredPosts, // Bài viết nổi bật
    },
  };

  homePageCache = { data: result, timestamp: now };
  return result;
}

// ============================================
// Product Detail API Types & Functions
// ============================================

// Danh mục sản phẩm
export interface ProductCategory {
  id_danhmuc: number;
  ten: string;
  slug: string;
}

// Loại biến thể
export interface ProductVariantType {
  id_loaibienthe: number;
  ten: string;
  trangthai: string;
}

// Biến thể sản phẩm
export interface ProductVariant {
  id_bienthe: number;
  id_loaibienthe?: number;
  loai_bien_the: number | string;
  giagoc: number;
  giamgia: number;
  giahientai: number;
  soluong?: number;
  luotban: number;
  luottang?: number;
  trangthai?: string;
}

// Ảnh sản phẩm
export interface ProductImage {
  id: number;
  id_sanpham?: number;
  hinhanh: string;
  trangthai: string;
  deleted_at?: string | null;
}

// Đánh giá chi tiết
export interface ProductRatingDetail {
  average: number;
  count: number;
  sao_5: number;
  sao_4: number;
  sao_3: number;
  sao_2: number;
  sao_1: number;
}

// Một đánh giá từ khách hàng
export interface ProductReview {
  id: number;
  diem: number;
  noidung: string;
  hoten: string;
}

// Sản phẩm tương tự
export interface SimilarProduct {
  id: number;
  ten: string;
  slug: string;
  have_gift: boolean;
  hinh_anh: string;
  rating: {
    average: number;
    count: number;
  };
  luotxem: number;
  sold: {
    total_sold: number;
    total_quantity: number;
  };
  gia: {
    current: number;
    before_discount: number;
    discount_percent: number;
  };
  trangthai: {
    active: string;
    in_stock: boolean;
  };
}

export interface ProductDetail {
  id: number;
  slug: string;
  ten: string;
  have_gift?: boolean;
  hinh_anh?: string;
  mediaurl?: string;
  images?: string[];
  thuonghieu?: string;
  shop_name?: string;
  nhacungcap?: {
    ten?: string;
    slug?: string;
    logo?: string;
  };
  mota?: string;
  mo_ta?: string;
  thong_tin_chi_tiet?: string;
  danhmuc?: ProductCategory[];
  rating?: ProductRatingDetail | {
    average: number;
    count: number;
  };
  sold_count?: string;
  sold?: {
    total_sold: number;
    total_quantity: number;
  } | number;
  luotxem?: number;
  gia?: {
    current: number;
    before_discount?: number;
    discount_percent?: number;
  };
  selling_price?: number;
  original_price?: number;
  discount_percent?: number;
  loai_bien_the?: ProductVariantType[];
  bienthe_khichon_loaibienthe_themvaogio?: ProductVariant[];
  anh_san_pham?: ProductImage[];
  danh_gia?: ProductReview[];
  variants?: unknown[];
  category?: string;
  tags?: string[];
  xuatxu?: string;
  sanxuat?: string;
  trangthai?: {
    active: string;
    in_stock: boolean;
  };
}

export interface ProductDetailResponse {
  status?: boolean;
  data: ProductDetail;
  sanpham_tuongtu?: SimilarProduct[];
}

// ============================================
// V1 Product Detail API Response Type
// (Uses existing V1Product, V1ProductImage, V1ProductBrand, V1ProductCategory types defined above)
// ============================================

export interface V1ProductDetailResponse {
  status: string;
  data: V1Product;
  related: V1Product[];
}

/**
 * Fetch product detail by slug from the V1 API server
 * Uses https://sieuthivina.com/api/v1/san-pham/{slug} endpoint
 * @param slug - Product slug
 * @returns Promise with product detail data (converted to legacy format)
 */
export async function fetchProductDetail(slug: string): Promise<ProductDetailResponse> {
  const V1_API_URL = "https://sieuthivina.com";
  // Encode slug để xử lý các ký tự đặc biệt
  const encodedSlug = encodeURIComponent(slug);
  const url = `${V1_API_URL}/api/v1/san-pham/${encodedSlug}`;

  console.log(`🔍 Fetching product from V1 API: ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error(`❌ API returned ${response.status} for slug: "${slug}"`);
    throw new Error(`Product detail API error: ${response.status}`);
  }

  const v1Response = await response.json() as V1ProductDetailResponse;

  // Convert V1 API response to legacy ProductDetailResponse format
  return convertV1ToLegacyProductDetail(v1Response);
}

/**
 * Convert V1 API response to legacy ProductDetailResponse format
 * This ensures backward compatibility with existing components
 */
function convertV1ToLegacyProductDetail(v1Response: V1ProductDetailResponse): ProductDetailResponse {
  const v1Data = v1Response.data;

  // Convert variants (biến thể) từ API mới
  const convertedVariants: ProductVariant[] = (v1Data.bienthe || []).map(variant => ({
    id_bienthe: variant.id,
    id_loaibienthe: variant.id_loaibienthe,
    // Ở tầng ProductVariant, loai_bien_the là ID (để map với mảng loai_bien_the)
    loai_bien_the: variant.id_loaibienthe,
    giagoc: variant.giagoc,
    giahientai: variant.giagoc, // API v1 hiện không trả giá khuyến mãi riêng cho biến thể
    giamgia: v1Data.giamgia || 0,
    soluong: variant.soluong,
    luotban: variant.luotban,
    luottang: variant.luottang,
    trangthai: variant.trangthai,
  }));

  // Tạo danh sách loại biến thể từ mảng biến thể
  // Ưu tiên dùng tenbienthe (API mới) > loaibienthe.ten > fallback sang ID
  const variantTypes: ProductVariantType[] = Array.from(
    new Map(
      (v1Data.bienthe || []).map(v => [
        v.id_loaibienthe,
        {
          id_loaibienthe: v.id_loaibienthe,
          ten: v.tenbienthe || v.loaibienthe?.ten || `Biến thể ${v.id_loaibienthe}`,
          trangthai: v.trangthai,
        } as ProductVariantType,
      ])
    ).values()
  );

  // Tính tổng số lượng đã bán từ tất cả biến thể
  const totalSold = v1Data.bienthe?.reduce((sum, v) => sum + (v.luotban || 0), 0) || v1Data.tong_luotban || 0;

  // Xử lý logo thương hiệu - thêm domain nếu cần
  let brandLogo = v1Data.thuonghieu?.logo || '';
  if (brandLogo && !brandLogo.startsWith('http')) {
    brandLogo = `https://sieuthivina.com/assets/client/images/brands/${brandLogo}`;
  }

  // Xử lý hình ảnh với fallback - API có thể trả về:
  // 1. hinhanh: [{id, url}] - full URL (dùng cho related products)
  // 2. hinhanhsanpham: [{id, hinhanh}] - chỉ filename (dùng cho product detail)
  const IMAGE_BASE_URL = 'https://sieuthivina.com/assets/client/images/thumbs/';

  let productImages: { id: number; url: string }[] = [];

  // Ưu tiên hinhanh nếu có full URL
  if (Array.isArray(v1Data.hinhanh) && v1Data.hinhanh.length > 0 && v1Data.hinhanh[0]?.url) {
    productImages = v1Data.hinhanh;
  }
  // Fallback sang hinhanhsanpham (cần build full URL)
  else if (Array.isArray((v1Data as any).hinhanhsanpham) && (v1Data as any).hinhanhsanpham.length > 0) {
    productImages = (v1Data as any).hinhanhsanpham.map((img: any) => ({
      id: img.id,
      url: img.hinhanh?.startsWith('http') ? img.hinhanh : `${IMAGE_BASE_URL}${img.hinhanh}`
    }));
  }

  // Debug log để kiểm tra dữ liệu hình ảnh và biến thể
  console.log(`📸 Product ${v1Data.id} (${v1Data.slug}):`, {
    hinhanh_source: Array.isArray(v1Data.hinhanh) && v1Data.hinhanh.length > 0 ? 'hinhanh' : 'hinhanhsanpham',
    hinhanh_count: productImages.length,
    hinhanh_urls: productImages.map(img => img.url),
    bienthe_count: v1Data.bienthe?.length || 0,
    bienthe_info: v1Data.bienthe?.map(v => ({
      id: v.id,
      id_loaibienthe: v.id_loaibienthe,
      tenbienthe: v.tenbienthe || v.loaibienthe?.ten || '(không có)'
    }))
  });

  if (productImages.length === 0) {
    console.warn(`⚠️ Sản phẩm ${v1Data.id} (${v1Data.slug}) không có hinhanh từ API chi tiết`);
  }

  // Convert main product data
  const productDetail: ProductDetail = {
    id: v1Data.id,
    slug: v1Data.slug,
    // API v1: field có thể là "tensanpham" (trong các list) hoặc "ten" (trong chi tiết)
    ten: (v1Data as any).tensanpham || (v1Data as any).ten || '',
    hinh_anh: productImages[0]?.url || '/assets/images/thumbs/product-two-img1.png',
    images: productImages.map(img => img.url),
    anh_san_pham: productImages.map(img => ({
      id: img.id,
      id_sanpham: v1Data.id,
      hinhanh: img.url,
      trangthai: 'active',
      deleted_at: null
    })),
    thuonghieu: v1Data.thuonghieu?.ten || '',
    nhacungcap: {
      ten: v1Data.thuonghieu?.ten || '',
      slug: v1Data.thuonghieu?.slug || v1Data.thuonghieu?.ten?.toLowerCase().replace(/\s+/g, '-') || '',
      logo: brandLogo
    },
    mota: v1Data.mota || '',
    danhmuc: v1Data.danhmuc?.map(cat => ({
      id_danhmuc: cat.id,
      ten: cat.ten,
      slug: cat.slug
    })) || [],
    gia: {
      current: v1Data.gia?.giadagiam || v1Data.gia?.giagoc || 0,
      before_discount: v1Data.gia?.giagoc || 0,
      discount_percent: v1Data.giamgia || 0
    },
    luotxem: v1Data.luotxem || 0,
    sold: {
      total_sold: totalSold,
      total_quantity: v1Data.bienthe?.reduce((sum, v) => sum + (v.soluong || 0), 0) || 0
    },
    sold_count: String(totalSold),
    rating: {
      average: 0,
      count: 0
    },
    trangthai: {
      active: v1Data.trangthai || 'Công khai',
      in_stock: v1Data.bienthe?.some(v => v.soluong > 0) ?? true
    },
    xuatxu: v1Data.xuatxu || '',
    sanxuat: v1Data.sanxuat || '',
    loai_bien_the: variantTypes.length > 0 ? variantTypes : undefined,
    bienthe_khichon_loaibienthe_themvaogio: convertedVariants.length > 0 ? convertedVariants : undefined
  };

  // Convert related products
  const similarProducts: SimilarProduct[] = (v1Response.related || []).map(related => ({
    id: related.id,
    ten: related.tensanpham || related.ten || '',
    slug: related.slug,
    hinh_anh: related.hinhanh?.[0]?.url || '',
    have_gift: false,
    gia: {
      current: related.gia?.giadagiam || related.gia?.giagoc || 0,
      before_discount: related.gia?.giagoc || 0,
      discount_percent: related.giamgia || 0
    },
    rating: {
      average: 0,
      count: 0
    },
    luotxem: related.luotxem || 0,
    sold: {
      total_sold: related.tong_luotban || 0,
      total_quantity: 0
    },
    trangthai: {
      active: related.trangthai || 'Công khai',
      in_stock: true
    }
  }));

  return {
    status: v1Response.status === 'success',
    data: productDetail,
    sanpham_tuongtu: similarProducts
  };
}

// ============================================
// Search Products API Types & Functions
// ============================================

interface V1SearchProductItem {
  id: number;
  tensanpham: string;
  slug: string;
  hinhanh: Array<{ id: number; url: string }>;
  thuonghieu: { id: number; ten: string; logo: string } | null;
  danhmuc: Array<{ id: number; ten: string; slug: string }>;
  gia: {
    giagoc: number;
    giadagiam: number;
    formatted_giagoc: string;
    formatted_giadagiam: string;
  };
  tong_luotban: number;
}
export async function fetchHeaderData(): Promise<HeaderDataResponse['data']> {
  const res = await fetch('https://sieuthivina.com/api/v1/header-data', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Header API error ${res.status}`);
  const json: HeaderDataResponse = await res.json();
  return json.data;
}

// ============================================
// đanh gia san pham
// ============================================
export interface ProductReviewItem {
  id: number;
  hoten: string;
  avatar?: string;
  diem: number;
  noidung: string;
  created_at?: string;
  nguoidung?: {
    id: number;
    hoten: string;
    avatar?: string;
  };
}

export interface ProductReviewStats {
  diem_trung_binh: number;
  tong_so_danh_gia: number;
  chi_tiet_sao: {
    '5_sao': number;
    '4_sao': number;
    '3_sao': number;
    '2_sao': number;
    '1_sao': number;
  };
}

export interface ProductReviewsResponse {
  status: number;
  thong_ke: ProductReviewStats;
  data: {
    current_page: number;
    data: ProductReviewItem[];
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Fetch product reviews from API
 * @param slug - Product slug
 * @param page - Page number (default 1)
 * @returns Promise with reviews data and statistics
 */
export async function fetchProductReviews(slug: string, page: number = 1): Promise<ProductReviewsResponse> {
  const url = `https://sieuthivina.com/api/v1/san-pham/${slug}/danh-gia?page=${page}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Product Reviews API error ${res.status}`);
  return res.json();
}

// ============================================
// bai viet 
// ============================================
export interface BlogDetailAuthor {
  id: number;
  username: string;
  hoten: string;
  avatar?: string;
}

export interface BlogDetailData {
  id: number;
  id_nguoidung: number;
  tieude: string;
  slug: string;
  noidung: string;
  luotxem: number;
  hinhanh: string;
  trangthai: string;
  created_at: string;
  updated_at: string;
  nguoidung?: BlogDetailAuthor;
}

export interface BlogDetailResponse {
  status: number;
  data: BlogDetailData;
}

/**
 * Fetch blog detail by slug from API
 * @param slug - Blog post slug
 * @returns Promise with blog detail data
 */
export async function fetchBlogDetail(slug: string): Promise<BlogDetailResponse> {
  const url = `https://sieuthivina.com/api/v1/bai-viet/${slug}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Blog Detail API error ${res.status}`);
  return res.json();
}

interface V1SearchSidebar {
  danhsachdanhmuc: Array<{ id: number; ten: string; slug: string }>;
  danhsachthuonghieu: Array<{ id: number; ten: string; slug: string }>;
  bannerquangcao: Array<{ id: number; hinhanh: string; lienket: string }>;
}

interface V1SearchResponse {
  status: number;
  keyword: string;
  products: {
    data: V1SearchProductItem[];
  };
  sidebar: V1SearchSidebar;
}
export interface SearchProduct {
  id: number;
  ten: string;
  slug: string;
  hinh_anh: string;
  mediaurl?: string;
  thuonghieu: string;
  danhmuc?: string;
  gia: {
    current: number;
    before_discount: number;
    discount_percent: number;
  };
  rating?: {
    average: number;
    count: number;
  };
  sold?: number;
  sold_count?: string;
  has_variant?: boolean; // Trường kiểm tra có biến thể hay không
  bienthe?: any[]; // Mảng biến thể nếu API trả về chi tiết
}

export interface SearchProductsResponse {
  status: boolean;
  data: SearchProduct[];
}

/**
 * Fetch search suggestions from api/v1/tim-kiem (server-side filtering)
 */
export async function fetchV1SearchProducts(keyword: string): Promise<SearchProduct[]> {
  const trimmed = keyword.trim();
  console.log('🔍 fetchV1SearchProducts called with keyword:', trimmed);

  if (!trimmed) {
    console.log('⚠️ Empty keyword, returning empty array');
    return [];
  }

  const url = `https://sieuthivina.com/api/v1/tim-kiem?query=${encodeURIComponent(trimmed)}`;
  console.log('🌐 Fetching URL:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error('❌ Search API error:', response.status);
    throw new Error(`Search API error: ${response.status}`);
  }

  const data: V1SearchResponse = await response.json();
  console.log('📦 Search API response:', {
    keyword: data.keyword,
    results_count: data.products?.data?.length || 0,
  });

  const items = data.products?.data ?? [];

  return items.map(item => {
    // Extract first image URL from array
    const imageUrl = item.hinhanh?.[0]?.url || '';

    return {
      id: item.id,
      ten: item.tensanpham,
      slug: item.slug,
      hinh_anh: imageUrl,
      thuonghieu: item.thuonghieu?.ten || "",
      gia: {
        current: item.gia?.giadagiam ?? 0,
        before_discount: item.gia?.giagoc ?? 0,
        discount_percent: 0,
      },
    };
  });
}

/**
 * Search products by keyword from the API server
 * Since production API doesn't have a dedicated search endpoint,
 * we fetch all products from homepage and filter locally
 * @param query - Search query keyword
 * @returns Promise with search results
 */
export async function fetchSearchProducts(query: string): Promise<SearchProduct[]> {
  try {
    // Fetch all products from homepage API
    const homePage = await fetchHomePage();

    // Combine all product arrays INCLUDING top_categories products
    const allProducts: HomeHotSaleProduct[] = [
      ...(homePage.data.hot_sales || []),
      ...(homePage.data.best_products || []),
      ...(homePage.data.new_launch || []),
      ...(homePage.data.most_watched || []),
      // Add products from all top_categories
      ...(homePage.data.top_categories || []).flatMap(cat => cat.sanpham || []),
    ];

    // Remove duplicates by id
    const uniqueProducts = Array.from(
      new Map(allProducts.map(p => [p.id, p])).values()
    );

    // Filter by search query (case-insensitive)
    const lowerQuery = query.toLowerCase().trim();
    const filtered = lowerQuery
      ? uniqueProducts.filter(p =>
        p.ten?.toLowerCase().includes(lowerQuery) ||
        p.thuonghieu?.toLowerCase().includes(lowerQuery)
      )
      : uniqueProducts;

    // Convert to SearchProduct format
    return filtered.map(p => ({
      id: p.id,
      ten: p.ten,
      slug: p.slug,
      hinh_anh: p.hinh_anh,
      thuonghieu: p.thuonghieu,
      gia: {
        current: p.gia.current,
        before_discount: p.gia.before_discount,
        discount_percent: p.gia.discount_percent,
      },
      rating: {
        average: p.rating?.average || 0,
        count: p.rating?.count || 0,
      },
      sold: parseInt(p.sold_count || "0"),
      sold_count: p.sold_count,
    }));
  } catch (error) {
    console.error('Error fetching search products:', error);
    return [];
  }
}

/**
 * Track keyword access for analytics
 * Records search queries to help track popular search terms
 * @param keyword - Search keyword to track
 * @returns Promise<void>
 */
export async function trackKeywordAccess(keyword: string): Promise<void> {
  if (!keyword || !keyword.trim()) {
    return;
  }

  try {
    // Send keyword tracking to API
    // The API endpoint may not exist yet, so we catch errors silently
    await api.post('/api/tracking/keywords', {
      keyword: keyword.trim(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Silently fail - tracking shouldn't break the user experience
    console.debug('Keyword tracking failed (non-critical):', error);
  }
}

// ============================================
// Shop Products API (sanphams-all)
// ============================================

export interface ShopCategory {
  id: number;
  ten: string;
  slug: string;
  logo: string;
  parent: string;
  trangthai: string;
  tong_sanpham: number;
}

export interface ShopPriceRange {
  label: string;
  min: number;
  max: number | null;
  value: string;
}

export interface ShopBrand {
  id: number;
  ten: string;
  slug: string;
}

export interface ShopProductItem {
  id: number;
  ten: string;
  slug: string;
  have_gift: boolean;
  hinh_anh: string;
  rating: {
    average: number;
    count: number;
  };
  luotxem: number;
  sold: {
    total_sold: number;
    total_quantity: number;
  };
  gia: {
    current: number;
    before_discount: number;
    discount_percent: number;
  };
  trangthai: {
    active: string;
    in_stock: boolean;
  };
}

export interface ShopFilters {
  danhmucs: ShopCategory[];
  price_ranges: ShopPriceRange[];
  thuonghieus: ShopBrand[];
}

export interface ShopProductsResponse {
  status: boolean;
  message: string;
  filters: ShopFilters;
  data: ShopProductItem[];
}

// ============ API V1 SAN PHAM (sieuthivina.com/api/v1/san-pham) ============

// Cấu trúc sản phẩm từ API v1/san-pham
export interface V1ShopProduct {
  id: number;
  tensanpham: string;
  slug: string;
  giamgia: number;
  mota: string;
  luotxem: number;
  trangthai: string;
  hinhanh: { id: number; url: string }[];
  thuonghieu: { id: number; ten: string; logo: string };
  danhmuc: { id: number; ten: string; slug: string; logo: string }[];
  gia: {
    giagoc: number;
    giadagiam: number;
    formatted_giagoc: string;
    formatted_giadagiam: string;
  };
  tong_luotban: number;
}

// Cấu trúc filter category từ API v1
export interface V1ShopCategory {
  id: number;
  ten: string;
  slug: string;
  tong_sanpham?: number;
}

// Cấu trúc filter brand từ API v1
export interface V1ShopBrand {
  id: number;
  ten: string;
  slug: string;
}

// Cấu trúc banner từ API v1
export interface V1ShopBanner {
  id: number;
  vitri: string;
  hinhanh: string;
  lienket: string;
  mota: string;
  trangthai: string;
}

// Cấu trúc pagination meta
export interface V1PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

// Cấu trúc pagination links
export interface V1PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

// Response từ API v1/san-pham
export interface V1ShopProductsResponse {
  status: string;
  data: {
    data: V1ShopProduct[];
    links: V1PaginationLinks;
    meta: V1PaginationMeta;
  };
  filters: {
    categories: V1ShopCategory[];
    brands: V1ShopBrand[];
    banners: V1ShopBanner[];
  };
}



/**
 * Fetch all products from shop API with filters (API cũ - sieuthivina.com)
 * @param params - Optional query parameters for filtering
 * @returns Promise with shop products and filter options
 */
export async function fetchShopProducts(params?: {
  danhmuc?: string;
  min_price?: number;
  max_price?: number;
  thuonghieu?: string;
  query?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}): Promise<ShopProductsResponse> {
  const HOME_API_URL = "https://sieuthivina.com";

  // Build query string from params
  const queryParams = new URLSearchParams();
  if (params?.danhmuc) queryParams.append('danhmuc', params.danhmuc);
  if (params?.min_price !== undefined) queryParams.append('min_price', params.min_price.toString());
  if (params?.max_price !== undefined) queryParams.append('max_price', params.max_price.toString());
  if (params?.thuonghieu) queryParams.append('thuonghieu', params.thuonghieu);
  if (params?.query) queryParams.append('query', params.query);
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

  const queryString = queryParams.toString();
  const url = `${HOME_API_URL}/api/sanphams-all${queryString ? `?${queryString}` : ''}`;

  console.log('🛒 Fetching shop products from:', url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Shop API error: ${response.status}`);
  }

  return response.json() as Promise<ShopProductsResponse>;
}

/**
 * Fetch products from new V1 Shop API (sieuthivina.com/api/v1/san-pham)
 * API này có pagination, filters (categories, brands) và banners
 * @param params - Optional query parameters for filtering and pagination
 * @returns Promise with V1 shop products response
 */
export async function fetchV1ShopProducts(params?: {
  danhmuc?: string;
  thuonghieu?: string;
  page?: number;
  per_page?: number;
}): Promise<V1ShopProductsResponse> {
  const V1_API_URL = "https://sieuthivina.com";

  // Build query string from params
  const queryParams = new URLSearchParams();
  if (params?.danhmuc) queryParams.append('danhmuc', params.danhmuc);
  if (params?.thuonghieu) queryParams.append('thuonghieu', params.thuonghieu);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

  const queryString = queryParams.toString();
  const url = `${V1_API_URL}/api/v1/san-pham${queryString ? `?${queryString}` : ''}`;

  console.log('🛒 Fetching V1 shop products from:', url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`V1 Shop API error: ${response.status}`);
  }

  return response.json() as Promise<V1ShopProductsResponse>;
}
