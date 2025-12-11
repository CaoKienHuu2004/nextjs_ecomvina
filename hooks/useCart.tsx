"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "./useAuth";
import Cookies from "js-cookie";

const CART_STORAGE_KEY = "marketpro_cart";

// ========================================================================
// 1. TYPE Definitions
// ========================================================================

export type Coupon = {
  id: number;
  code: string;
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
  id_bienthe: number;
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
  ten?: string;
  hinhanh?: string;
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

  // Phí vận chuyển hiện tại (component set khi có giá ship)
  const [shippingCost, setShippingCost] = useState<number>(0);

  // Gift State - Quà tặng trong giỏ hàng
  const [gifts, setGifts] = useState<GiftItem[]>([]);

  // Voucher State
  const [appliedVoucher, setAppliedVoucher] = useState<Coupon | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<Coupon[]>([]);

  const hasSyncedRef = useRef(false);

  const API = process.env.NEXT_PUBLIC_SERVER_API || "http://148.230.100.215";

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
    const token = Cookies.get("access_token") || Cookies.get("token");
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, [isLoggedIn]);
  // --- HELPER MAP DATA ---
  const mapServerDataToCartItem = useCallback((serverItem: unknown): CartItem => {
    const sItem = serverItem as ServerCartItemRaw;

    const id_giohang = sItem.id_giohang ?? sItem.id ?? `temp_${Date.now()}_${Math.random()}`;
    const soluong = Number(sItem.soluong ?? sItem.bienthe?.soluong ?? 1);
    const bienthe = sItem.bienthe;
    const detail = bienthe?.detail;
    const sanpham = bienthe?.sanpham;

    // DEBUG: Log để xem cấu trúc
    console.log('📦 Cart item bienthe:', bienthe);
    console.log('📦 Cart item sanpham:', sanpham);
    console.log('📦 Cart item detail:', detail);

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
      id_bienthe: sItem.id_bienthe ?? id_giohang,
      soluong,
      id_chuongtrinh: sItem.id_chuongtrinh,
      product: productInfo
    };
  }, []);

  const extractCartPayload = useCallback((payload: unknown): unknown[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as unknown[];
      if (Array.isArray(obj.items)) return obj.items as unknown[];
      if (Array.isArray(obj.cart)) return obj.cart as unknown[];
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
        if (qt.detail) {
          giftItems.push({
            id_bienthe: qt.id_bienthe || (sItem.id_giohang as number) || 0,
            soluong: qt.soluong || 1,
            thanhtien: qt.thanhtien || 0,
            ten_sanpham: qt.detail.tensanpham,
            ten_loaibienthe: qt.detail.loaisanpham,
            thuonghieu: qt.detail.thuonghieu,
            hinhanh: qt.detail.hinhanh,
            slug: qt.detail.slug,
            giagoc: qt.detail.giagoc || qt.giagoc
          });
        } else if (qt.bienthe) {
          const bienthe = qt.bienthe;
          giftItems.push({
            id_bienthe: qt.id_bienthe || bienthe?.id || 0,
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
      let res: Response;
      try {
        res = await fetch(`${API}/api/tai-khoan/giohang`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        });
      } catch (fetchErr) {
        console.warn("⚠️ Network error khi load cart (server có thể không khả dụng):", fetchErr);
        return { items: [], gifts: [] };
      }
      if (!res.ok) {
        console.warn("⚠️ API trả về lỗi:", res.status);
        return { items: [], gifts: [] };
      }
      const j: unknown = await res.json();

      // DEBUG: Log raw response để xem cấu trúc
      console.log('🛒 Raw cart API response:', JSON.stringify(j, null, 2));

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
      return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
    } catch { return []; }
  }, []);

  const saveLocalCart = useCallback((cart: CartItem[]) => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); } catch { }
  }, []);

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
      for (const item of localItems) {
        await fetch(`${API}/api/tai-khoan/giohang`, {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({
            id_bienthe: String(item.id_bienthe),
            soluong: Number(item.soluong || 1),
          }),
        }).catch(() => { });
      }
      clearLocalCart();
      const { items: serverItems, gifts: serverGifts } = await loadServerCart();
      setItems(serverItems);
      setGifts(serverGifts);
      const count = serverItems.reduce((s, it) => s + (Number(it.soluong) || 0), 0);
      window.dispatchEvent(new CustomEvent("cart:updated", { detail: { count } }));
    } finally { setLoading(false); }
  }, [API, getAuthHeaders, loadLocalCart, clearLocalCart, loadServerCart]);

  // --- INIT EFFECT ---
  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const hasToken = hasValidToken();
      if (hasToken) {
        const { items: serverItems, gifts: serverGifts } = await loadServerCart();
        setItems(serverItems);
        setGifts(serverGifts);
      } else {
        const localCart = loadLocalCart();
        setItems(localCart);
        setGifts([]);
      }
    } finally { setLoading(false); }
  }, [hasValidToken, loadServerCart, loadLocalCart]);

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
    const onUpdated = () => fetchCart();
    window.addEventListener("cart:updated", onUpdated);
    return () => window.removeEventListener("cart:updated", onUpdated);
  }, [fetchCart]);

  // --- ACTIONS ---
  const addToCart = useCallback(async (product: AddToCartInput, soluong = 1, id_chuongtrinh?: number | string) => {
    const id_bienthe = product.id_bienthe ?? product.id;
    if (!id_bienthe) {
      console.error("❌ addToCart: Không có id_bienthe");
      return;
    }

    // Lấy id_chuongtrinh từ tham số hoặc từ product
    const programId = id_chuongtrinh ?? product.id_chuongtrinh;

    // Kiểm tra token thực sự có trong cookie, không chỉ dựa vào isLoggedIn state
    const hasToken = hasValidToken();
    console.log("🛒 addToCart called:", { id_bienthe, soluong, id_chuongtrinh: programId, isLoggedIn, hasToken });

    setLoading(true);
    try {
      if (hasToken) {
        // ĐÃ ĐĂNG NHẬP → Dùng /api/tai-khoan/giohang (lưu vào database, có đầy đủ thông tin)
        const requestBody: { id_bienthe: string; soluong: number; id_chuongtrinh?: number } = {
          id_bienthe: String(id_bienthe),
          soluong: Number(soluong)
        };

        // Thêm id_chuongtrinh nếu có (cho chương trình khuyến mãi/quà tặng)
        if (programId) {
          requestBody.id_chuongtrinh = Number(programId);
        }

        const cartUrl = `${API}/api/tai-khoan/giohang`;
        console.log("🌐 Cart API URL (logged in):", cartUrl);
        console.log("📤 Cart API payload:", requestBody);

        const res = await fetch(cartUrl, {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(requestBody),
        });

        console.log("📥 Cart API status:", res.status);
        const responseData = await res.json().catch(() => null);
        console.log("📥 Cart API data:", responseData);

        if (res.ok) {
          // API trả về toàn bộ giỏ hàng sau khi cập nhật
          const rawData = extractCartPayload(responseData);
          if (rawData.length > 0) {
            const { items: serverItems, gifts: serverGifts } = buildCartStateFromRaw(rawData);
            setItems(serverItems);
            setGifts(serverGifts);
            const count = serverItems.reduce((s, it) => s + (Number(it.soluong) || 0), 0);
            window.dispatchEvent(new CustomEvent("cart:updated", { detail: { count } }));
            console.log("✅ Cart updated successfully, items:", serverItems.length, "gifts:", serverGifts.length);
          } else {
            // Nếu response không phải array, reload cart
            const { items: serverItems, gifts: serverGifts } = await loadServerCart();
            setItems(serverItems);
            setGifts(serverGifts);
            const count = serverItems.reduce((s, it) => s + (Number(it.soluong) || 0), 0);
            window.dispatchEvent(new CustomEvent("cart:updated", { detail: { count } }));
            console.log("✅ Cart reloaded after add");
          }
        } else {
          console.error("❌ Cart API Error:", res.status, responseData);
        }
      } else {
        // CHƯA ĐĂNG NHẬP → Dùng /web/giohang (session) hoặc localStorage
        console.log("💾 User not logged in, trying session cart API...");

        const sessionRequestBody: { id_bienthe: string; soluong: number; id_chuongtrinh?: number } = {
          id_bienthe: String(id_bienthe),
          soluong: Number(soluong)
        };

        if (programId) {
          sessionRequestBody.id_chuongtrinh = Number(programId);
        }

        try {
          const sessionCartUrl = `${API}/web/giohang`;
          console.log("🌐 Session Cart API URL:", sessionCartUrl);
          console.log("📤 Session Cart API payload:", sessionRequestBody);

          const sessionRes = await fetch(sessionCartUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            credentials: "include",
            body: JSON.stringify(sessionRequestBody),
          });

          console.log("📥 Session Cart API status:", sessionRes.status);
          const sessionData = await sessionRes.json().catch(() => null);
          console.log("📥 Session Cart API data:", sessionData);

          if (sessionRes.ok && sessionData?.status === true) {
            // Session cart API thành công - nhưng response không có detail
            // Nên vẫn lưu vào localStorage để hiển thị
            console.log("✅ Session cart updated on server");
          }
        } catch (error) {
          console.warn("⚠️ Session cart API failed, using localStorage only:", error);
        }

        // Luôn lưu vào localStorage để hiển thị (vì session API không trả về detail)
        const localCart = loadLocalCart();
        const existingIndex = localCart.findIndex(i => i.id_bienthe == id_bienthe);

        // Lấy đầy đủ thông tin giá
        const giaObj = typeof product.gia === 'number'
          ? { current: product.gia, before_discount: 0, discount_percent: 0 }
          : {
            current: Number(product.gia?.current ?? 0),
            before_discount: Number(product.gia?.before_discount ?? 0),
            discount_percent: Number(product.gia?.discount_percent ?? 0)
          };

        const displayItem: CartItem = {
          id_giohang: `local_${Date.now()}`,
          id_bienthe: id_bienthe,
          soluong: soluong,
          id_chuongtrinh: programId,
          product: {
            id: id_bienthe,
            ten: product.ten ?? "Sản phẩm",
            mediaurl: product.hinhanh || product.mediaurl || "/assets/images/thumbs/placeholder.png",
            gia: giaObj,
            loaibienthe: product.loaibienthe ?? "",
            thuonghieu: product.thuonghieu ?? "",
            slug: product.slug ?? ""
          }
        };

        console.log("📦 Product info to save:", displayItem);

        if (existingIndex >= 0) {
          localCart[existingIndex].soluong += soluong;
        } else {
          localCart.push(displayItem);
        }

        saveLocalCart(localCart);
        setItems(localCart);
        const count = localCart.reduce((s, it) => s + (Number(it.soluong) || 0), 0);
        window.dispatchEvent(new CustomEvent("cart:updated", { detail: { count } }));
        console.log("✅ Cart saved to localStorage");
      }
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, hasValidToken, getAuthHeaders, API, extractCartPayload, buildCartStateFromRaw, loadServerCart, loadLocalCart, saveLocalCart]);

  const updatesoluong = useCallback(async (id_giohang: number | string, soluong: number) => {
    if (soluong < 1) return;
    setItems(prev => prev.map(it => it.id_giohang === id_giohang ? { ...it, soluong } : it));

    const hasToken = hasValidToken();
    if (hasToken) {
      await fetch(`${API}/api/tai-khoan/giohang/${id_giohang}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ soluong: soluong }),
      }).catch(() => fetchCart());
    } else {
      const local = loadLocalCart();
      const updated = local.map(it => it.id_giohang === id_giohang ? { ...it, soluong } : it);
      saveLocalCart(updated);
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent("cart:updated"));
  }, [hasValidToken, API, getAuthHeaders, fetchCart, loadLocalCart, saveLocalCart]);

  const removeItem = useCallback(async (id_giohang: number | string) => {
    setItems(prev => prev.filter(it => it.id_giohang !== id_giohang));
    const hasToken = hasValidToken();
    if (hasToken) {
      await fetch(`${API}/api/tai-khoan/giohang/${id_giohang}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      }).catch(() => fetchCart());
    } else {
      const local = loadLocalCart();
      const updated = local.filter(it => it.id_giohang !== id_giohang);
      saveLocalCart(updated);
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent("cart:updated"));
  }, [hasValidToken, API, getAuthHeaders, fetchCart, loadLocalCart, saveLocalCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    const hasToken = hasValidToken();
    if (!hasToken) clearLocalCart();
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent("cart:updated", { detail: { count: 0 } }));
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
      alert(`Đơn hàng chưa đạt giá trị tối thiểu ${voucher.min_order_value.toLocaleString("vi-VN")}đ`);
      return;
    }
    setAppliedVoucher(voucher);
  }, [subtotal]);

// Áp voucher theo id (gọi API /api/ma-giam-gia/:id)
  const applyVoucherById = useCallback(async (id: number | string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/ma-giam-gia/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) {
        alert("Không thể lấy chi tiết mã giảm giá");
        return;
      }
      const json: unknown = await res.json().catch(() => null);
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
          code: String(foundRaw.magiamgia),
          giatri: Number(foundRaw.giatri),
          mota: foundRaw.mota,
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

  const removeVoucher = useCallback(() => setAppliedVoucher(null), []);

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