"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "./useAuth";
import Cookies from "js-cookie";

const CART_STORAGE_KEY = "marketpro_cart";
const VOUCHER_STORAGE_KEY = "marketpro_applied_voucher";
const CART_PAYLOAD_KEY = "marketpro_cart_payload";
const DEFAULT_VOUCHER_CODE = "";

// ========================================================================
// 1. TYPE Definitions
// ========================================================================

export type Coupon = {
  id: number;
  code: string;
  magiamgia?: string | number;
  giatri: number;
  mota?: string;
  min_order_value?: number;
  dieukien?: string;
  condition_type?: VoucherConditionType;
  ngaybatdau?: string;
  ngayketthuc?: string;
};

// Interface cho dữ liệu Voucher thô từ Server
interface ServerVoucherRaw {
  id: number;
  magiamgia?: number | string;
  code?: string;
  ma?: string;
  giatri?: number;
  amount?: number;
  mota?: string;
  dieukien?: string;
  description?: string;
  min_order_value?: number;
  don_toi_thieu?: number;
  trangthai?: string;
  ngaybatdau?: string;
  ngayketthuc?: string;
  [key: string]: unknown;
}

// --- Add safe JSON extractors (avoid `any`) ---
function extractObjectData<T = Record<string, unknown>>(json: unknown): T | null {
  if (json === null || json === undefined) return null;
  if (Array.isArray(json)) return null; // object extractor không trả mảng
  if (typeof json !== "object") return null;

  const obj = json as Record<string, unknown>;
  if ("data" in obj) {
    const d = obj.data;
    if (d && typeof d === "object" && !Array.isArray(d)) return d as T;
    return null;
  }

  // json là object chứa trực tiếp payload
  return json as T;
}

function extractListData<T = unknown>(json: unknown): T[] {
  if (json === null || json === undefined) return [];
  if (Array.isArray(json)) return json as T[];

  if (typeof json === "object") {
    const obj = json as Record<string, unknown>;
    // ưu tiên các trường phổ biến trả mảng
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.cart)) return obj.cart as T[];

    // Nếu data là object đơn lẻ, wrap thành mảng để xử lý đồng nhất
    if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
      return [obj.data as T];
    }
  }

  return [];
}

// Loại điều kiện voucher
export type VoucherConditionType =
  | 'tatca'           // Tất cả đơn hàng
  | 'don_toi_thieu'   // Đơn hàng tối thiểu X đồng
  | 'khachhang_moi'   // Khách hàng mới
  | 'khachhang_than_thiet' // Khách hàng thân thiết
  | 'freeship'        // Miễn phí ship
  | 'unknown';

// Parse điều kiện voucher từ string
export const parseVoucherCondition = (dieukien?: string, mota?: string): {
  type: VoucherConditionType;
  minOrderValue: number;
} => {
  const condition = (dieukien || '').toLowerCase();
  const description = (mota || '').toLowerCase();
  const fullText = condition + ' ' + description;

  // Parse giá trị đơn tối thiểu từ text
  let minOrderValue = 0;

  // Tìm số có 6 chữ số (ví dụ: 500000)
  const matches6 = fullText.match(/(\d{6,})/g);
  if (matches6 && matches6.length > 0) {
    minOrderValue = Math.max(...matches6.map(Number));
  } else {
    // Tìm pattern "500k" hoặc "500K"
    const matchK = fullText.match(/(\d+)k/i);
    if (matchK) {
      minOrderValue = parseInt(matchK[1]) * 1000;
    }
  }

  // Xác định loại điều kiện
  if (condition === 'tatca') {
    return { type: 'tatca', minOrderValue: 0 };
  }

  if (condition.includes('khachhang_moi') || condition === 'khachhang_moi') {
    return { type: 'khachhang_moi', minOrderValue };
  }

  if (condition.includes('khachhang_than_thiet') || condition === 'khachhang_than_thiet') {
    return { type: 'khachhang_than_thiet', minOrderValue };
  }

  if (condition.includes('donhang_toi_thieu') || condition.includes('don_toi_thieu') || minOrderValue > 0) {
    return { type: 'don_toi_thieu', minOrderValue };
  }

  if (fullText.includes('freeship') || fullText.includes('miễn phí vận chuyển') || fullText.includes('free ship')) {
    return { type: 'freeship', minOrderValue };
  }

  return { type: 'unknown', minOrderValue };
};

// Kiểm tra voucher còn hạn không
export const isVoucherInDateRange = (ngaybatdau?: string, ngayketthuc?: string): boolean => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (ngaybatdau) {
    const startDate = new Date(ngaybatdau);
    startDate.setHours(0, 0, 0, 0);
    if (now < startDate) return false; // Chưa đến ngày bắt đầu
  }

  if (ngayketthuc) {
    const endDate = new Date(ngayketthuc);
    endDate.setHours(23, 59, 59, 999);
    if (now > endDate) return false; // Đã quá ngày kết thúc
  }

  return true;
};

const parseMinOrderValue = (condition?: string, description?: string): number => {
  const text = (condition || "") + " " + (description || "");
  const matches = text.match(/(\d{3,})/g);
  if (matches && matches.length > 0) {
    return Math.max(...matches.map(Number));
  }
  return 0;
};

export type Gia = { current?: number; before_discount?: number; discount_percent?: number };

export type ProductDisplayInfo = {
  id?: number | string;
  ten?: string;
  name?: string;
  mediaurl?: string;
  hinhanh?: string;
  category?: string;
  gia?: Gia;
  ratingAverage?: number;
  ratingCount?: number;
  thuonghieu?: string;
  loaibienthe?: string;
  slug?: string;
};

export type CartItem = {
  id_giohang: number | string;
  id_bienthe: number | string;
  soluong: number;
  id_chuongtrinh?: number | string;  // ID chương trình khuyến mãi
  product?: ProductDisplayInfo;
};

// Interface cho quà tặng trong giỏ hàng
export interface GiftItem {
  // Server may now reference gifts by `id_giohang` (cart row id).
  // Keep the name `id_bienthe` for compatibility but allow it to be either
  // the original variant id or the cart-row id when the server reports a gift.
  id_bienthe: number | string;
  soluong: number;
  thanhtien: number;
  ten_sanpham?: string;
  ten_loaibienthe?: string;
  thuonghieu?: string;
  hinhanh?: string;
  slug?: string;
  giagoc?: number;
}

interface ServerCartItemRaw {
  id?: number | string;              // ID của item trong giỏ hàng (từ API mới)
  id_giohang?: number | string;      // ID giỏ hàng (từ API cũ)
  id_nguoidung?: number | string;    // ID người dùng
  id_bienthe?: number | string;      // ID biến thể sản phẩm
  soluong?: number;                  // Số lượng
  thanhtien?: number;                // Thành tiền
  trangthai?: string;                // Trạng thái
  id_chuongtrinh?: number | string;  // ID chương trình khuyến mãi

  // Cấu trúc bienthe từ API mới
  bienthe?: {
    id?: number;
    soluong?: number;
    giagoc?: number;
    giaban?: number;
    thanhtien?: number;
    tamtinh?: number;
    ten?: string;      // Tên biến thể (ví dụ: "Đỏ", "Size M")
    hinhanh?: string;  // Hình ảnh biến thể
    // Cấu trúc nested từ API mới
    sanpham?: {
      id?: number;
      ten?: string;          // Tên sản phẩm
      tensanpham?: string;   // Tên sản phẩm (alias)
      slug?: string;
      gia?: number;
      thuonghieu?: { ten?: string } | string;
      loaisanpham?: { ten?: string } | string;
      hinhanhsanpham?: Array<{ url?: string; hinhanh?: string }>;
    };
    loaibienthe?: {
      ten?: string;      // Tên loại biến thể (ví dụ: "Màu sắc")
    };
    // Cấu trúc detail từ API cũ
    detail?: {
      thuonghieu?: string;
      tensanpham?: string;
      loaisanpham?: string;
      loaibienthe?: string;
      ten_loaibienthe?: string;
      giamgia?: string | number;
      giagoc?: number;
      giaban?: number;
      hinhanh?: string;
      slug?: string;
    };
  };
  bienthe_quatang?: {
    id_bienthe?: number;
    soluong?: number;
    giagoc?: number;
    thanhtien?: number;
    tamtinh?: number;
    // Cấu trúc API thực tế trả về
    detail?: {
      thuonghieu?: string;
      tensanpham?: string;
      loaisanpham?: string;
      giagoc?: number;
      hinhanh?: string;
      slug?: string;
    };
    // Cấu trúc cũ (backup)
    bienthe?: {
      id?: number;
      giagoc?: number;
      sanpham?: {
        ten?: string;
        slug?: string;
        thuonghieu?: { ten?: string };
        hinhanhsanpham?: Array<{ hinhanh?: string }>;
      };
      loaibienthe?: { ten?: string };
    };
  };
}

export type AddToCartInput = {
  id_bienthe?: number | string;
  id?: number | string;
  ten: string;
  hinhanh: string;
  mediaurl?: string;
  gia?: number | Gia;
  loaibienthe?: string;
  thuonghieu?: string;
  slug?: string;
  id_chuongtrinh?: number | string; // ID chương trình khuyến mãi (nếu có)
  [key: string]: unknown;
};

// ========================================================================
// 2. HOOK LOGIC
// ========================================================================

export function useCart() {
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const emitTimeoutRef = useRef<number | null>(null);
  const pendingDetailRef = useRef<{ count?: number; force?: boolean } | null>(null);

  const isMountedRef = useRef(true);

  const emitCartUpdated = useCallback((detail: { count?: number; force?: boolean } = {}) => {
    // merge detail: nếu có count mới thì cập nhật, nếu có force thì giữ force
    pendingDetailRef.current = {
      ...(pendingDetailRef.current || {}),
      ...detail,
      force: (pendingDetailRef.current?.force || detail.force) || undefined
    };

    if (emitTimeoutRef.current) {
      window.clearTimeout(emitTimeoutRef.current);
    }
    // debounce 300ms (tùy chỉnh)
    emitTimeoutRef.current = window.setTimeout(() => {
      const d = pendingDetailRef.current || {};
      pendingDetailRef.current = null;
      emitTimeoutRef.current = null;
      window.dispatchEvent(new CustomEvent("cart:updated", { detail: d }));
    }, 300);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // useEffect(() => {
  //   const handleCartUpdated = () => fetchCart(); // Gọi hàm fetchCart cũ của bạn
  //   window.addEventListener("cart:updated", handleCartUpdated);
  //   return () => window.removeEventListener("cart:updated", handleCartUpdated);
  // }, []);

  // Phí vận chuyển hiện tại (component set khi có giá ship)
  const [shippingCost, setShippingCost] = useState<number>(0);

  // Gift State - Quà tặng trong giỏ hàng
  const [gifts, setGifts] = useState<GiftItem[]>([]);

  // Voucher State
  const [appliedVoucher, setAppliedVoucher] = useState<Coupon | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<Coupon[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(VOUCHER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Coupon;
        // nhẹ nhàng validate shape tối thiểu
        if (parsed && typeof parsed === "object" && (parsed.id || parsed.code || parsed.magiamgia)) {
          setAppliedVoucher(parsed);
        }
      }
    } catch (err) {
      console.debug("Không thể parse applied voucher từ localStorage:", err);
    }
  }, []);

  const hasSyncedRef = useRef(false);

  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";

  // Kiểm tra đăng nhập dựa vào token thực sự có trong cookie
  const hasValidToken = useCallback((): boolean => {
    const token = Cookies.get("access_token");
    return !!token && token.length > 0;
  }, []);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    // nếu user chưa đăng nhập => không thêm Authorization (cho phép dùng session cookie)
    if (!isLoggedIn) return headers;
    // Lấy token thật sự từ cookie (nếu có) và chỉ thêm Authorization khi có token
    const token = Cookies.get("access_token") || Cookies.get("token");
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, [isLoggedIn]);
  // --- HELPER MAP DATA ---
  const mapServerDataToCartItem = useCallback((serverItem: unknown): CartItem => {
    const s = (serverItem ?? {}) as Record<string, any>;

    // flat/guest response mapping (your sample)
    if (s && (s.ten_sp || s.hinhanh || s.giaban)) {
      const id_bienthe = s.id_bienthe ?? s.bienthe_id ?? `local_${Date.now()}`;
      const qty = Number(s.soluong ?? 1);
      const price = Number(s.giaban ?? s.gia ?? 0);
      const media = s.hinhanh ?? s.mediaurl ?? "/assets/images/thumbs/product-placeholder.png";
      const name = s.ten_sp ?? s.ten ?? "Sản phẩm";
      const variant = s.ten_bt ?? s.loaibienthe ?? "";

      return {
        id_giohang: s.id_giohang ?? s.id ?? `local_${id_bienthe}_${Date.now()}`,
        id_bienthe,
        soluong: qty,
        product: {
          id: id_bienthe,
          ten: name,
          mediaurl: media,
          gia: { current: price, before_discount: Number(s.giagoc ?? 0), discount_percent: 0 },
          loaibienthe: variant,
          thuonghieu: s.thuonghieu ?? undefined,
          slug: s.slug ?? undefined,
        },
      };
    }

    // existing nested mapping fallback (keep original mapping here)
    const id_giohang = (serverItem as any)?.id_giohang ?? (serverItem as any)?.id ?? `temp_${Date.now()}`;
    const soluong = Number((serverItem as any)?.soluong ?? 1);
    const bienthe = s.bienthe;
    const detail = bienthe?.detail;
    const sanpham = bienthe?.sanpham;


    let productInfo: ProductDisplayInfo | undefined = undefined;

    // Ưu tiên lấy từ sanpham (cấu trúc API mới), fallback về detail (cấu trúc cũ)
    if (sanpham) {
      // sanpham có thể là object hoặc một string; narrow trước khi truy cập thuộc tính
      const sp = typeof sanpham === "object" && sanpham !== null ? (sanpham as {
        ten?: string;
        gia?: number;
        loaisanpham?: { ten?: string };
        hinhanhsanpham?: Array<{ hinhanh?: string }>;
        thuonghieu?: { ten?: string } | string;
        slug?: string;
      }) : undefined;

      const currentPrice = Number(bienthe?.giaban ?? bienthe?.giagoc ?? sp?.gia ?? 0);
      const originPrice = Number(bienthe?.giagoc ?? sp?.gia ?? 0);
      const discountPercent = originPrice > currentPrice && originPrice > 0
        ? Math.round(((originPrice - currentPrice) / originPrice) * 100)
        : 0;
      const loaibienthe = bienthe?.loaibienthe?.ten || bienthe?.ten || '';

      const mediaurl = sp?.hinhanhsanpham?.[0]?.hinhanh || bienthe?.hinhanh || "/assets/images/thumbs/placeholder.png";

      productInfo = {
        id: id_giohang,
        ten: sp?.ten ?? "Sản phẩm",
        mediaurl,
        category: sp?.loaisanpham?.ten,
        gia: {
          current: currentPrice,
          before_discount: originPrice,
          discount_percent: discountPercent
        },
        ratingAverage: 5,
        ratingCount: 0,
        thuonghieu: typeof sp?.thuonghieu === "object" ? (sp?.thuonghieu as { ten?: string }).ten : (sp?.thuonghieu as string | undefined),
        loaibienthe,
        slug: sp?.slug
      };
    } else if (detail) {
      // Fallback cho API cũ
      const currentPrice = Number(detail.giaban ?? detail.giagoc ?? 0);
      const originPrice = Number(detail.giagoc ?? 0);
      const discountPercent = originPrice > currentPrice && originPrice > 0
        ? Math.round(((originPrice - currentPrice) / originPrice) * 100)
        : (typeof detail.giamgia === 'number' ? detail.giamgia : Number(detail.giamgia) || 0);

      const loaibienthe = detail.loaibienthe || detail.ten_loaibienthe || detail.loaisanpham || '';
      console.log('🏷️ loaibienthe (legacy):', loaibienthe);

      productInfo = {
        id: id_giohang,
        ten: detail.tensanpham ?? "Sản phẩm",
        mediaurl: detail.hinhanh ?? "/assets/images/thumbs/placeholder.png",
        category: detail.loaisanpham,
        gia: {
          current: currentPrice,
          before_discount: originPrice,
          discount_percent: discountPercent
        },
        ratingAverage: 5,
        ratingCount: 0,
        thuonghieu: detail.thuonghieu,
        loaibienthe: loaibienthe,
        slug: detail.slug
      };
    }

    return {
      id_giohang,
      id_bienthe: (serverItem as any)?.id_bienthe ?? (serverItem as any)?.bienthe?.id ?? undefined,
      soluong,
      product: {
        id: (serverItem as any)?.id_bienthe ?? (serverItem as any)?.bienthe?.id,
        ten: (serverItem as any)?.bienthe?.sanpham?.ten ?? (serverItem as any)?.bienthe?.detail?.ten ?? "Sản phẩm",
        mediaurl: (serverItem as any)?.bienthe?.sanpham?.hinhanh ?? "/assets/images/thumbs/product-placeholder.png",
        gia: {
          current: Number((serverItem as any)?.bienthe?.gia ?? 0),
          before_discount: Number((serverItem as any)?.bienthe?.gia_old ?? 0),
          discount_percent: 0,
        },
        loaibienthe: (serverItem as any)?.bienthe?.ten ?? undefined,
        thuonghieu: (serverItem as any)?.bienthe?.sanpham?.thuonghieu ?? undefined,
        slug: (serverItem as any)?.bienthe?.sanpham?.slug ?? undefined,
      },
    };
  }, []);

  const extractCartPayload = useCallback((payload: unknown): unknown[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as unknown[];
      if (Array.isArray(obj.items)) return obj.items as unknown[];
      if (Array.isArray(obj.cart)) return obj.cart as unknown[];
      if (obj.item && !Array.isArray(obj.item)) return [obj.item] as unknown[];
      if (Array.isArray(obj.item)) return obj.item as unknown[];
      if (obj.item && typeof obj.item === "object") return Array.isArray(obj.item) ? obj.item as unknown[] : [obj.item];
    }
    return [];
  }, []);

  const buildCartStateFromRaw = useCallback((rawData: unknown[]): { items: CartItem[]; gifts: GiftItem[] } => {
    const regularItems = rawData.filter((item) => {
      const sItem = item as ServerCartItemRaw;
      return sItem?.bienthe !== null && sItem?.bienthe !== undefined;
    });

    const cartItems = regularItems.map(mapServerDataToCartItem);

    const giftItems: GiftItem[] = [];
    rawData.forEach((item) => {
      const sItem = item as ServerCartItemRaw;
      if (sItem?.bienthe_quatang) {
        const qt = sItem.bienthe_quatang;
        // When server marks an entry as a gift it may omit an internal variant id
        // and instead the gift should be referenced by the cart row id (`id_giohang`).
        const resolvedId = qt.id_bienthe ?? sItem.id_giohang ?? qt.bienthe?.id ?? 0;

        if (qt.detail) {
          giftItems.push({
            id_bienthe: resolvedId,
            soluong: qt.soluong || 1,
            thanhtien: qt.thanhtien || 0,
            ten_sanpham: qt.detail.tensanpham,
            ten_loaibienthe: qt.detail.loaisanpham,
            thuonghieu: qt.detail.thuonghieu,
            hinhanh: qt.detail.hinhanh,
            slug: qt.detail.slug,
            giagoc: qt.detail.giagoc ?? qt.giagoc
          });
        } else if (qt.bienthe) {
          const bienthe = qt.bienthe;
          giftItems.push({
            id_bienthe: resolvedId,
            soluong: qt.soluong || 1,
            thanhtien: qt.thanhtien || 0,
            ten_sanpham: bienthe?.sanpham?.ten,
            ten_loaibienthe: bienthe?.loaibienthe?.ten,
            thuonghieu: bienthe?.sanpham?.thuonghieu?.ten,
            hinhanh: bienthe?.sanpham?.hinhanhsanpham?.[0]?.hinhanh,
            slug: bienthe?.sanpham?.slug,
            giagoc: bienthe?.giagoc
          });
        }
      }
    });

    return { items: cartItems, gifts: giftItems };
  }, [mapServerDataToCartItem]);

  // --- FETCH CART ---
  const loadServerCart = useCallback(async (): Promise<{ items: CartItem[], gifts: GiftItem[] }> => {
    try {
      const hasToken = hasValidToken();
      let res: Response;
      if (hasToken) {
        // Logged-in: GET cart from DB
        res = await fetch(`${API}/api/v1/gio-hang`, {
          method: "GET",
          headers: getAuthHeaders(),
          cache: "no-store",
        });
      } else {
        // Guest: ask server to "materialize" local cart (POST cart_local => server computes totals)
        const payload = loadLocalCartPayload();
        res = await fetch(`${API}/api/v1/gio-hang`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
        });
      }
      if (!res.ok) {
        console.warn("⚠️ API trả về lỗi:", res.status);
        return { items: [], gifts: [] };
      }
      const j: unknown = await res.json();

      // DEBUG: Log raw response để xem cấu trúc
      console.log('🛒 Raw cart API response:', j);

      const rawData = extractCartPayload(j);

      // DEBUG: Log từng item để tìm quà tặng
      console.log('🛒 Raw cart data from API:', rawData.length, 'items');
      console.log('🛒 Full API response:', JSON.stringify(rawData, null, 2));
      rawData.forEach((item, index) => {
        const sItem = item as ServerCartItemRaw;
        console.log(`  📦 Item ${index}:`, {
          id_giohang: sItem.id_giohang,
          has_bienthe: !!sItem.bienthe,
          has_bienthe_quatang: !!sItem.bienthe_quatang,
          bienthe_quatang: sItem.bienthe_quatang
        });
      });
      rawData.forEach((item) => {
        const sItem = item as ServerCartItemRaw;
        console.log('🎁 Checking item for gift:', {
          id_giohang: sItem.id_giohang,
          has_bienthe_quatang: !!sItem.bienthe_quatang,
          bienthe_quatang: sItem.bienthe_quatang
        });
      });

      const { items: cartItems, gifts: giftItems } = buildCartStateFromRaw(rawData);
      console.log('🎁 Gift items extracted:', giftItems.length, giftItems);

      return { items: cartItems, gifts: giftItems };
    } catch (e) {
      console.error("Lỗi load server cart:", e);
      return { items: [], gifts: [] };
    }
  }, [API, getAuthHeaders, extractCartPayload, buildCartStateFromRaw]);

  // --- LOCAL STORAGE HELPERS ---
  const loadLocalCart = useCallback((): CartItem[] => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      return parsed.map((p: any, idx: number) => {
        // already normalized shape
        if (p && p.id_bienthe && p.product) return p as CartItem;

        // support minimal shape { id_bienthe, soluong } or server full item
        const id_bienthe = p?.id_bienthe ?? p?.id ?? p?.bienthe?.id ?? `local_${idx}`;
        const soluong = Number(p?.soluong ?? 1);
        const id_giohang = p?.id_giohang ?? `local_${id_bienthe}_${Date.now()}_${idx}`;

        const product: ProductDisplayInfo = {
          id: id_bienthe,
          ten: p?.ten ?? p?.bienthe?.sanpham?.ten ?? 'Sản phẩm',
          mediaurl: p?.product?.mediaurl ?? p?.hinhanh ?? p?.bienthe?.sanpham?.hinhanhsanpham?.[0]?.hinhanh ?? '/assets/images/thumbs/product-placeholder.png',
          gia: {
            current: Number(p?.gia?.current ?? p?.bienthe?.giadagiam ?? p?.bienthe?.giagoc ?? 0),
            before_discount: Number(p?.gia?.before_discount ?? p?.bienthe?.giagoc ?? 0),
            discount_percent: 0,
          },
          loaibienthe: p?.bienthe?.loaibienthe?.ten ?? '',
          thuonghieu: p?.bienthe?.sanpham?.thuonghieu?.ten ?? '',
          slug: p?.bienthe?.sanpham?.slug ?? '',
        };

        return { id_giohang, id_bienthe, soluong, product } as CartItem;
      });
    } catch (err) {
      console.warn("Không thể parse marketpro_cart từ localStorage:", err);
      return [];
    }
  }, []);

  // Normalize cart items before saving to localStorage to ensure id_bienthe exists
  const normalizeCartForSave = (cart: CartItem[]) => {
    return (cart || []).map((it, idx) => {
      const inferredId = it.id_bienthe ?? it.product?.id ?? it.id_giohang ?? `local_${idx}`;
      const product: ProductDisplayInfo = {
        id: it.product?.id ?? inferredId,
        ten: it.product?.ten ?? 'Sản phẩm',
        mediaurl: it.product?.mediaurl ?? it.product?.hinhanh ?? '/assets/images/thumbs/product-placeholder.png',
        gia: it.product?.gia ?? { current: 0, before_discount: 0, discount_percent: 0 },
        loaibienthe: it.product?.loaibienthe ?? '',
        thuonghieu: it.product?.thuonghieu ?? '',
        slug: it.product?.slug ?? '',
      };
      return { ...it, id_bienthe: inferredId, product };
    });
  };

  const saveLocalCart = useCallback((cart: CartItem[]) => {
    if (typeof window === "undefined") return;
    try {
      const normalized = normalizeCartForSave(cart);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
      try {
        const payload = {
          cart_local: normalized.map((m) => ({
            id_bienthe: Number(m.id_bienthe) || m.id_bienthe,
            soluong: Number(m.soluong)
          })),
          voucher_code: DEFAULT_VOUCHER_CODE
        };
        localStorage.setItem(CART_PAYLOAD_KEY, JSON.stringify(payload));
      } catch { }
    } catch (e) {
      console.warn("Lỗi khi lưu marketpro_cart:", e);
    }
  }, []);

  const buildCartLocalPayload = useCallback((cart: CartItem[]) => {
    return {
      cart_local: (cart || []).map(i => ({
        id_bienthe: Number(i.id_bienthe) || i.id_bienthe,
        soluong: Number(i.soluong) || 0
      })),
      voucher_code: (appliedVoucher && (appliedVoucher.magiamgia || appliedVoucher.code)) ? String(appliedVoucher.magiamgia ?? appliedVoucher.code) : DEFAULT_VOUCHER_CODE
    };
  }, [appliedVoucher]);

  const loadLocalCartPayload = useCallback(() => {
    if (typeof window === "undefined") return { cart_local: [], voucher_code: DEFAULT_VOUCHER_CODE };
    try {
      const raw = localStorage.getItem(CART_PAYLOAD_KEY);
      if (!raw) return { cart_local: [], voucher_code: DEFAULT_VOUCHER_CODE };
      return JSON.parse(raw);
    } catch {
      // fallback build from current local cart
      return buildCartLocalPayload(loadLocalCart());
    }
  }, [buildCartLocalPayload, loadLocalCart]);

  const clearLocalCart = useCallback(() => {
    if (typeof window === "undefined") return;
    try { localStorage.removeItem(CART_STORAGE_KEY); } catch { }
  }, []);

  // --- SYNC LOGIC ---
  const syncLocalToServer = useCallback(async () => {
    const localItems = loadLocalCart();
    if (localItems.length === 0) return;
    setLoading(true);
    try {
      const payload = { cart_items: localItems.map(i => ({ id_bienthe: i.id_bienthe, soluong: i.soluong })) };
      const res = await fetch(`${API}/api/v1/sync-gio-hang`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        clearLocalCart();
        const { items: serverItems, gifts: serverGifts } = await loadServerCart();
        if (isMountedRef.current) {
          setItems(serverItems);
          setGifts(serverGifts);
        }
        const count = serverItems.reduce((s, it) => s + (Number(it.soluong) || 0), 0);
        emitCartUpdated({ count });
      } else {
        console.warn("⚠️ Sync failed", await res.text().catch(() => ''));
      }
    } finally { setLoading(false); }
  }, [API, getAuthHeaders, loadLocalCart, clearLocalCart, loadServerCart]);

  // --- INIT EFFECT ---
  const fetchCart = useCallback(async () => {
    if (!isMountedRef.current) return;

    if (isMountedRef.current) setLoading(true);
    try {
      const hasToken = hasValidToken();
      if (hasToken) {
        const { items: serverItems, gifts: serverGifts } = await loadServerCart();
        if (isMountedRef.current) {
          setItems(serverItems);
          setGifts(serverGifts);
        }
      } else {
        const localCart = loadLocalCart();
        if (localCart.length > 0) {
          // Try to materialize guest local cart on server (get full product info/prices).
          // Fallback to localCart if network/API fails or server returns empty.
          try {
            const { items: serverItems, gifts: serverGifts } = await loadServerCart();
            if (serverItems && serverItems.length > 0) {
              if (isMountedRef.current) {
                setItems(serverItems);
                setGifts(serverGifts);
              }
            } else {
              if (isMountedRef.current) {
                setItems(localCart);
                setGifts([]);
              }
            }
          } catch (err) {
            if (isMountedRef.current) {
              setItems(localCart);
              setGifts([]);
            }
          }
        } else {
          if (isMountedRef.current) {
            setItems([]);
            setGifts([]);
          }
        }
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [hasValidToken, loadServerCart, loadLocalCart, isMountedRef]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const hasToken = hasValidToken();
        if (hasToken) {
          const localItems = loadLocalCart();
          if (localItems.length > 0 && !hasSyncedRef.current) {
            hasSyncedRef.current = true;
            await syncLocalToServer();
          } else if (localItems.length === 0) {
            if (mounted) await fetchCart();
          }
        } else {
          hasSyncedRef.current = false;
          if (mounted) await fetchCart();
        }
      } catch (err) {
        console.warn("⚠️ Lỗi khởi tạo giỏ hàng:", err);
      }
    })();
    return () => { mounted = false; };
  }, [hasValidToken, syncLocalToServer, fetchCart, loadLocalCart]);

  useEffect(() => {
    const handleCartUpdated = async () => {
      // [QUAN TRỌNG] Thêm dòng này để bảo vệ component
      if (typeof isMountedRef !== 'undefined' && !isMountedRef.current) return;

      await fetchCart();
    };

    window.addEventListener("cart:updated", handleCartUpdated);

    return () => {
      window.removeEventListener("cart:updated", handleCartUpdated);
    };
  }, [fetchCart]);

  // --- ACTIONS ---
  const addToCart = useCallback(async (product: AddToCartInput, soluong = 1, id_chuongtrinh?: number | string) => {
    // [THÊM] Check mount sớm
    if (!isMountedRef.current) return;

    const id_bienthe = product.id_bienthe ?? product.id;
    if (!id_bienthe) {
      console.error("❌ addToCart: Không có id_bienthe");
      return;
    }

    const programId = id_chuongtrinh ?? product.id_chuongtrinh;
    const hasToken = hasValidToken();

    // Bật loading nếu component còn mount
    if (isMountedRef.current) setLoading(true);
    try {
      if (hasToken) {
        // === (Logic cũ khi logged in) ===
        const requestBody: { id_bienthe?: string; id_giohang?: string; soluong: number; id_chuongtrinh?: number } = {
          id_bienthe: String(id_bienthe),
          id_giohang: product.id_giohang ? String(product.id_giohang) : undefined,
          soluong: Number(soluong)
        };
        if (programId) requestBody.id_chuongtrinh = Number(programId);

        const cartUrl = `${API}/api/v1/gio-hang/them`;
        const res = await fetch(cartUrl, {
          method: "POST",
          headers: getAuthHeaders(),
          // credentials: "include",
          body: JSON.stringify(requestBody),
        });

        if (res.ok) {
          const responseData = await res.json().catch(() => null);
          const rawData = extractCartPayload(responseData);
          if (rawData.length > 0) {
            const { items: serverItems, gifts: serverGifts } = buildCartStateFromRaw(rawData);
            if (isMountedRef.current) {
              setItems(serverItems);
              setGifts(serverGifts);
            }
            // Dispatch event with optional count
            if (typeof window !== "undefined") {
              const count = serverItems.reduce((s, it) => s + (Number(it.soluong) || 0), 0);
              emitCartUpdated({ count });
            }
          } else {
            const { items: serverItems, gifts: serverGifts } = await loadServerCart();
            if (isMountedRef.current) {
              setItems(serverItems);
              setGifts(serverGifts);
            }
            if (typeof window !== "undefined") {
              const count = serverItems.reduce((s, it) => s + (Number(it.soluong) || 0), 0);
              emitCartUpdated({ count });
            }
          }
        } else {
          console.error("❌ Cart API Error:", res.status, await res.text().catch(() => ''));
        }
      } else {
        // Guest flow: store minimal payload { id_bienthe, soluong } in localStorage
        if (typeof window === 'undefined') return;
        try {
          // migrate existing guest_cart_v1 into marketpro_cart if present
          try {
            const legacy = localStorage.getItem('guest_cart_v1');
            if (legacy) {
              const parsedLegacy = JSON.parse(legacy || '[]');
              if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
                const now = Date.now();
                const migrated = parsedLegacy.map((it: any, idx: number) => ({
                  id_bienthe: it.variantId ?? it.id_bienthesp ?? it.id_bienthe,
                  soluong: Number(it.qty ?? it.quantity ?? 1)
                }));
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(migrated));
                localStorage.removeItem('guest_cart_v1');
              }
            }
          } catch (e) { /* ignore legacy migration errors */ }

          const raw = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
          const currentCart = Array.isArray(raw) ? raw : [];
          const existingIndex = currentCart.findIndex((item: any) => String(item.id_bienthe) === String(id_bienthe));

          if (existingIndex > -1) {
            currentCart[existingIndex].soluong = Number(currentCart[existingIndex].soluong || 0) + Number(soluong);
          } else {
            currentCart.push({ id_bienthe: Number(id_bienthe) || id_bienthe, soluong: Number(soluong) });
          }

          // persist minimal cart + payload
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(currentCart));
          try {
            const payload = { cart_local: currentCart.map((i: any) => ({ id_bienthe: Number(i.id_bienthe) || i.id_bienthe, soluong: Number(i.soluong) || 0 })), voucher_code: (appliedVoucher && (appliedVoucher.magiamgia || appliedVoucher.code)) ? String(appliedVoucher.magiamgia ?? appliedVoucher.code) : DEFAULT_VOUCHER_CODE };
            localStorage.setItem(CART_PAYLOAD_KEY, JSON.stringify(payload));
          } catch (e) { /* ignore */ }

          // materialize on server to get full product info/prices for UI
          await fetchCart();

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cart:updated'));
          }
          return;
        } catch (e) {
          console.warn('Guest addToCart error:', e);
        }
      }
    } finally {
      // [THÊM] chỉ tắt loading nếu component vẫn mount
      if (isMountedRef.current) setLoading(false);
    }
  }, [API, buildCartStateFromRaw, isLoggedIn, hasValidToken, getAuthHeaders, extractCartPayload, loadServerCart, loadLocalCart, saveLocalCart, fetchCart]);

  const updatesoluong = useCallback(async (id_giohang: number | string, soluong: number) => {
    if (soluong < 1) return;

    // optimistic update và lấy kết quả updated
    let updatedItems: CartItem[] = [];
    setItems(prev => {
      const updated = prev.filter(it => it.id_giohang !== id_giohang);
      // emit từ updated
      const count = updated.reduce((s, it) => s + (Number(it.soluong) || 0), 0);
      emitCartUpdated({ count });
      return updated;
    });

    const hasToken = hasValidToken();
    if (hasToken) {
      try {
        await fetch(`${API}/api/v1/gio-hang/${id_giohang}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ soluong: soluong }),
        });
      } catch {
        await fetchCart();
      }
    } else {
      const local = loadLocalCart();
      const updated = local.map(it => it.id_giohang === id_giohang ? { ...it, soluong } : it);
      saveLocalCart(updated);
      updatedItems = updated;
    }

    if (typeof window !== 'undefined') {
      const count = updatedItems.reduce((s, it) => s + (Number(it.soluong) || 0), 0);
      emitCartUpdated({ count });
    }
  }, [API, getAuthHeaders, hasValidToken, fetchCart, loadLocalCart, saveLocalCart]);

  const removeItem = useCallback(async (id_giohang: number | string) => {
    //mo comment dong nay de tat request 2 lan (nho bo comment updatedItems = updated; va doan "[SỬA] Không gọi loadServerCart() ở đây — dùng updatedItems để tính count")
    // let updatedItems: CartItem[] = [];
    setItems(prev => prev.filter(it => it.id_giohang !== id_giohang));

    const hasToken = hasValidToken();
    if (hasToken) {
      try {
        await fetch(`${API}/api/v1/gio-hang/xoa/${id_giohang}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
      } catch {
        await fetchCart();
      }
    } else {
      const local = loadLocalCart();
      const updated = local.filter(it => it.id_giohang !== id_giohang);
      saveLocalCart(updated);
      // updatedItems = updated;
    }

    // [THÊM] Bắn sự kiện
    if (typeof window !== 'undefined') {
      const count = items.reduce((s, it) => s + (Number(it.soluong) || 0), 0);
      emitCartUpdated({ count });
    }

    // [SỬA] Không gọi loadServerCart() ở đây — dùng updatedItems để tính count
    // if (typeof window !== 'undefined') {
    //   const count = updatedItems.reduce((s, it) => s + (Number(it.soluong) || 0), 0);
    //   emitCartUpdated({ count });
    // }
  }, [API, getAuthHeaders, hasValidToken, fetchCart, loadLocalCart, saveLocalCart, loadServerCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    const hasToken = hasValidToken();
    if (!hasToken) clearLocalCart();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("cart:updated", { detail: { count: 0 } }));
    }
  }, [hasValidToken, clearLocalCart]);

  // ========================================================================
  // 3. VOUCHER LOGIC
  // ========================================================================

  const subtotal = items.reduce((sum, it) => {
    const pPrice = it.product?.gia?.current;
    const price = Number(pPrice || 0);
    const qty = Number(it.soluong) || 0;
    return sum + price * qty;
  }, 0);

  const applyVoucher = useCallback((voucher: Coupon) => {
    if (voucher.min_order_value && subtotal < voucher.min_order_value) {
      // có thể giữ logic hiện có
      // alert(...) hoặc return false tùy bạn. Giữ nguyên như cũ nếu muốn.
      return;
    }
    setAppliedVoucher(voucher);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(voucher));
      }
    } catch (err) {
      console.debug("Lưu voucher vào localStorage thất bại", err);
    }
  }, [subtotal]);

  // Áp voucher theo id (gọi API /api/ma-giam-gia/:id)
  const applyVoucherById = useCallback(async (id: number | string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/ma-giam-gia/${id}`, { headers: getAuthHeaders() });
      const json: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        alert("Không thể lấy chi tiết mã giảm giá");
        return;
      }

      const raw = extractObjectData<ServerVoucherRaw>(json);
      if (!raw) {
        alert("Mã giảm giá không hợp lệ");
        return;
      }

      if (raw.trangthai !== "Hoạt động" || !isVoucherInDateRange(raw.ngaybatdau, raw.ngayketthuc)) {
        alert("Mã giảm giá chưa kích hoạt hoặc đã hết hạn");
        return;
      }

      const parsed = parseVoucherCondition(raw.dieukien, raw.mota);
      const coupon: Coupon = {
        id: raw.id,
        magiamgia: raw.magiamgia ?? raw.code ?? undefined,
        code: String(raw.magiamgia ?? raw.code ?? "UNKNOWN"),
        giatri: Number(raw.giatri ?? raw.amount ?? 0),
        mota: raw.mota ?? raw.description ?? "Mã giảm giá",
        min_order_value: parsed.minOrderValue,
        dieukien: raw.dieukien,
        condition_type: parsed.type,
        ngaybatdau: raw.ngaybatdau,
        ngayketthuc: raw.ngayketthuc
      };

      applyVoucher(coupon);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi kiểm tra mã giảm giá.");
    } finally {
      setLoading(false);
    }
  }, [API, getAuthHeaders, applyVoucher]);

  // Lấy danh sách voucher
  const fetchVouchers = useCallback(async () => {
    try {
      let res: Response;
      try {
        res = await fetch(`${API}/api/ma-giam-gia`, {
          headers: getAuthHeaders(),
          cache: "no-store"
        });
      } catch (fetchErr) {
        console.warn("⚠️ Network error khi fetch vouchers:", fetchErr);
        return;
      }

      if (res.ok) {
        const json: unknown = await res.json().catch(() => null);
        const list = extractListData(json);

        // SỬA: Filter trước, Map sau để tránh any
        // Thêm check ngày hết hạn
        const activeVouchers = (list as ServerVoucherRaw[])
          .filter(raw => {
            // Check trạng thái
            if (raw.trangthai !== "Hoạt động") return false;
            // Check ngày hết hạn
            if (!isVoucherInDateRange(raw.ngaybatdau, raw.ngayketthuc)) return false;
            return true;
          })
          .map(raw => {
            const parsed = parseVoucherCondition(raw.dieukien, raw.mota);
            return {
              id: raw.id,
              magiamgia: raw.magiamgia ?? raw.code ?? null,
              code: String(raw.magiamgia ?? raw.code ?? "UNKNOWN"),
              giatri: Number(raw.giatri ?? raw.amount ?? 0),
              mota: raw.mota ?? raw.description ?? "Mã giảm giá",
              min_order_value: parsed.minOrderValue,
              dieukien: raw.dieukien,
              condition_type: parsed.type,
              ngaybatdau: raw.ngaybatdau,
              ngayketthuc: raw.ngayketthuc
            } as Coupon;
          });

        setAvailableVouchers(activeVouchers);
      }
    } catch (e) {
      console.warn("⚠️ Lỗi lấy danh sách voucher:", e);
    }
  }, [API, getAuthHeaders]);

  useEffect(() => { fetchVouchers().catch(() => { }); }, [fetchVouchers]);

  const applyVoucherByCode = useCallback(async (code: string) => {
    if (!code) return;
    setLoading(true);
    try {
      await fetchVouchers();

      const res = await fetch(`${API}/api/ma-giam-gia`, { headers: getAuthHeaders() });
      const json: unknown = await res.json().catch(() => null);
      const list = extractListData(json);

      // SỬA: Ép kiểu an toàn + check ngày hết hạn
      const foundRaw = (list as ServerVoucherRaw[]).find((raw) => {
        if (String(raw.magiamgia) !== code) return false;
        if (raw.trangthai !== "Hoạt động") return false;
        if (!isVoucherInDateRange(raw.ngaybatdau, raw.ngayketthuc)) return false;
        return true;
      });

      if (foundRaw) {
        const parsed = parseVoucherCondition(foundRaw.dieukien, foundRaw.mota);
        const coupon: Coupon = {
          id: foundRaw.id,
          magiamgia: foundRaw.magiamgia ?? foundRaw.code ?? undefined,
          code: String(foundRaw.magiamgia ?? foundRaw.code ?? "UNKNOWN"),
          giatri: Number(foundRaw.giatri ?? foundRaw.amount ?? 0),
          mota: foundRaw.mota ?? foundRaw.description ?? "Mã giảm giá",
          min_order_value: parsed.minOrderValue,
          dieukien: foundRaw.dieukien,
          condition_type: parsed.type,
          ngaybatdau: foundRaw.ngaybatdau,
          ngayketthuc: foundRaw.ngayketthuc
        };
        applyVoucher(coupon);
      } else {
        alert("Mã giảm giá không tồn tại, chưa kích hoạt hoặc đã hết hạn.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi khi kiểm tra mã giảm giá.");
    } finally {
      setLoading(false);
    }
  }, [API, getAuthHeaders, fetchVouchers, applyVoucher]);

  const removeVoucher = useCallback(() => {
    setAppliedVoucher(null);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(VOUCHER_STORAGE_KEY);
      }
    } catch (err) {
      console.debug("Xoá voucher từ localStorage thất bại", err);
    }
  }, []);

  // Tính tiền giảm tuỳ loại voucher
  const discountAmount = useMemo(() => {
    if (!appliedVoucher) return 0;
    const amt = Number(appliedVoucher.giatri || 0);
    const type = appliedVoucher.condition_type || 'unknown';

    switch (type) {
      case 'freeship':
        // freeship: giảm bằng phí vận chuyển hiện tại (component phải set shippingCost)
        return Math.min(shippingCost || 0, subtotal); // không vượt quá subtotal
      case 'don_toi_thieu':
      case 'tatca':
      case 'khachhang_moi':
      case 'khachhang_than_thiet':
        // Đây là voucher tiền mặt; giới hạn không vượt quá subtotal
        return Math.min(amt, subtotal);
      default:
        return Math.min(amt, subtotal);
    }
  }, [appliedVoucher, shippingCost, subtotal]);

  const total = Math.max(0, subtotal - discountAmount);
  const totalItems = items.reduce((sum, it) => sum + (Number(it.soluong) || 0), 0);
  const totalGifts = gifts.reduce((sum, g) => sum + (g.soluong || 0), 0);


  return {
    items, loading, addToCart, updatesoluong, removeItem, clearCart, refreshCart: fetchCart,
    subtotal,
    totalItems,
    gifts,
    totalGifts,
    appliedVoucher,
    applyVoucher,
    applyVoucherById,
    shippingCost,
    setShippingCost,
    applyVoucherByCode,
    removeVoucher,
    discountAmount,
    total,
    availableVouchers
  };
}