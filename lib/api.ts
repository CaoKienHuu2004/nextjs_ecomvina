import { VoucherConditionType } from "@/hooks/useCart";

// lib/api.ts
const BASE_URL = process.env.SERVER_API || process.env.NEXT_PUBLIC_SERVER_API || "http://148.230.100.215";

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
  };
}

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

export async function fetchHomePage(headers?: Record<string, string>, perPage: number = 6): Promise<HomePageResponse> {
  // Kiểm tra cache
  const now = Date.now();
  if (homePageCache.data && (now - homePageCache.timestamp) < CACHE_DURATION) {
    console.log('📦 Sử dụng cache cho homepage data');
    return homePageCache.data;
  }

  const HOME_API_URL = "http://148.230.100.215";
  const url = `${HOME_API_URL}/api/trang-chu${perPage !== 6 ? `?per_page=${perPage}` : ''}`;

  const result = await fetchWithRetry(async () => {
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

    return response.json() as Promise<HomePageResponse>;
  }, 3, 1000);

  // Lưu vào cache
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
  loai_bien_the: number;
  giagoc: number;
  giamgia: number;
  giahientai: number;
  luotban: number;
}

// Ảnh sản phẩm
export interface ProductImage {
  id: number;
  hinhanh: string;
  trangthai: string;
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
  danh_gia?: unknown[];
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

/**
 * Fetch product detail by slug from the API server
 * Uses /api/sanphams-all/{slug} endpoint
 * @param slug - Product slug
 * @returns Promise with product detail data
 */
export async function fetchProductDetail(slug: string): Promise<ProductDetailResponse> {
  const HOME_API_URL = "http://148.230.100.215";
  const url = `${HOME_API_URL}/api/sanphams-all/${slug}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Product detail API error: ${response.status}`);
  }

  return response.json() as Promise<ProductDetailResponse>;
}

// ============================================
// Search Products API Types & Functions
// ============================================

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
}

export interface SearchProductsResponse {
  status: boolean;
  data: SearchProduct[];
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

/**
 * Fetch all products from shop API with filters
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
  const HOME_API_URL = "http://148.230.100.215";

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