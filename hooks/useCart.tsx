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
  quantity: number;
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
  id_giohang?: number | string;
  id_nguoidung?: number | string;
  trangthai?: string;
  bienthe?: {
    soluong?: number;
    giagoc?: number;
    thanhtien?: number;
    tamtinh?: number;
    detail?: {
      thuonghieu?: string;
      tensanpham?: string;
      loaisanpham?: string;
      loaibienthe?: string;
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
  gia?: number | Gia;
  [key: string]: unknown;
};

// ========================================================================
// 2. HOOK LOGIC
// ========================================================================

export function useCart() {
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Gift State - Quà tặng trong giỏ hàng
  const [gifts, setGifts] = useState<GiftItem[]>([]);

  // Voucher State
  const [appliedVoucher, setAppliedVoucher] = useState<Coupon | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<Coupon[]>([]);

  const hasSyncedRef = useRef(false);

  const API = process.env.NEXT_PUBLIC_SERVER_API || "http://148.230.100.215";

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

    const id_giohang = sItem.id_giohang ?? `temp_${Date.now()}_${Math.random()}`;
    const quantity = Number(sItem.bienthe?.soluong ?? 1);
    const detail = sItem.bienthe?.detail;

    let productInfo: ProductDisplayInfo | undefined = undefined;

    if (detail) {
      const currentPrice = Number(detail.giaban ?? detail.giagoc ?? 0);
      const originPrice = Number(detail.giagoc ?? 0);
      const discountPercent = originPrice > currentPrice && originPrice > 0
        ? Math.round(((originPrice - currentPrice) / originPrice) * 100)
        : (typeof detail.giamgia === 'number' ? detail.giamgia : Number(detail.giamgia) || 0);

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
        loaibienthe: detail.loaibienthe || detail.loaisanpham, // Ưu tiên loaibienthe, fallback sang loaisanpham
        slug: detail.slug
      };
    }

    return {
      id_giohang,
      id_bienthe: id_giohang,
      quantity,
      product: productInfo
    };
  }, []);

  // --- FETCH CART ---
  const loadServerCart = useCallback(async (): Promise<{ items: CartItem[], gifts: GiftItem[] }> => {
    try {
      const res = await fetch(`${API}/api/toi/giohang`, {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
      if (!res.ok) return { items: [], gifts: [] };
      const j: unknown = await res.json();

      // DEBUG: Log raw response để xem cấu trúc
      // console.log('🛒 Raw cart API response:', JSON.stringify(j, null, 2));

      let rawData: unknown[] = [];
      if (Array.isArray(j)) {
        rawData = j;
      } else if (j && typeof j === 'object' && 'data' in j && Array.isArray((j as { data: unknown[] }).data)) {
        rawData = (j as { data: unknown[] }).data;
      }

      // DEBUG: Log từng item để tìm quà tặng
      // console.log('🎁 Checking for gifts in cart items:', rawData.length, 'items');
      rawData.forEach((item, index) => {
        const sItem = item as ServerCartItemRaw;
        // console.log(`  Item ${index}:`, {
        //   id_giohang: sItem.id_giohang,
        //   has_bienthe: !!sItem.bienthe,
        //   has_bienthe_quatang: !!sItem.bienthe_quatang,
        //   bienthe_quatang: sItem.bienthe_quatang
        // });
      });

      // Lọc: Chỉ lấy items có bienthe (sản phẩm thường), loại bỏ items chỉ có bienthe_quatang (quà tặng)
      const regularItems = rawData.filter((item) => {
        const sItem = item as ServerCartItemRaw;
        return sItem.bienthe !== null && sItem.bienthe !== undefined;
      });
      // console.log('🛒 Regular cart items (with bienthe):', regularItems.length);

      const cartItems = regularItems.map(mapServerDataToCartItem);

      // Extract gifts from cart items - items có bienthe_quatang
      const giftItems: GiftItem[] = [];
      rawData.forEach((item) => {
        const sItem = item as ServerCartItemRaw;
        if (sItem.bienthe_quatang) {
          const qt = sItem.bienthe_quatang;
          // Ưu tiên đọc từ detail (API mới), fallback sang bienthe (cấu trúc cũ)
          if (qt.detail) {
            // Cấu trúc API mới: bienthe_quatang.detail
            giftItems.push({
              id_bienthe: qt.id_bienthe || sItem.id_giohang as number || 0,
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
            // Cấu trúc cũ: bienthe_quatang.bienthe
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
      // console.log('🎁 Gift items extracted:', giftItems.length, giftItems);

      return { items: cartItems, gifts: giftItems };
    } catch (e) {
      console.error("Lỗi load server cart:", e);
      return { items: [], gifts: [] };
    }
  }, [API, getAuthHeaders, mapServerDataToCartItem]);

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
        await fetch(`${API}/api/toi/giohang`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id_bienthe: item.id_bienthe,
            soluong: item.quantity,
          }),
        }).catch(() => { });
      }
      clearLocalCart();
      const { items: serverItems, gifts: serverGifts } = await loadServerCart();
      setItems(serverItems);
      setGifts(serverGifts);
      try {
        const count = serverItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        window.dispatchEvent(new CustomEvent("cart:updated", { detail: { count } }));
      } catch { }
    } finally { setLoading(false); }
  }, [API, getAuthHeaders, loadLocalCart, clearLocalCart, loadServerCart]);

  // --- INIT EFFECT ---
  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      if (isLoggedIn) {
        const { items: serverItems, gifts: serverGifts } = await loadServerCart();
        setItems(serverItems);
        setGifts(serverGifts);
      } else {
        const localCart = loadLocalCart();
        setItems(localCart);
        setGifts([]);
      }
    } finally { setLoading(false); }
  }, [isLoggedIn, loadServerCart, loadLocalCart]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (isLoggedIn) {
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
    })();
    return () => { mounted = false; };
  }, [isLoggedIn, syncLocalToServer, fetchCart, loadLocalCart]);

  useEffect(() => {
    const onUpdated = () => fetchCart();
    window.addEventListener("cart:updated", onUpdated);
    return () => window.removeEventListener("cart:updated", onUpdated);
  }, [fetchCart]);

  // --- ACTIONS ---
  const addToCart = useCallback(async (product: AddToCartInput, quantity = 1) => {
    const id_bienthe = product.id_bienthe ?? product.id;
    if (!id_bienthe) return;

    setLoading(true);
    try {
      if (isLoggedIn) {
        const res = await fetch(`${API}/api/toi/giohang`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id_bienthe: String(id_bienthe),
            soluong: quantity
          }),
        });
        if (res.ok) {
          const { items: serverItems, gifts: serverGifts } = await loadServerCart();
          setItems(serverItems);
          setGifts(serverGifts);
          const count = serverItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
          window.dispatchEvent(new CustomEvent("cart:updated", { detail: { count } }));
        }
      } else {
        const localCart = loadLocalCart();
        const existingIndex = localCart.findIndex(i => i.id_bienthe == id_bienthe);

        const priceVal = typeof product.gia === 'number' ? product.gia : (product.gia?.current ?? 0);
        const displayItem: CartItem = {
          id_giohang: `local_${Date.now()}`,
          id_bienthe: id_bienthe,
          quantity: quantity,
          product: {
            id: id_bienthe,
            ten: product.ten ?? "Sản phẩm",
            mediaurl: product.hinhanh ?? "/assets/images/thumbs/placeholder.png",
            gia: { current: Number(priceVal) }
          }
        };

        if (existingIndex >= 0) localCart[existingIndex].quantity += quantity;
        else localCart.push(displayItem);

        saveLocalCart(localCart);
        setItems(localCart);
        const count = localCart.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        window.dispatchEvent(new CustomEvent("cart:updated", { detail: { count } }));
      }
    } finally { setLoading(false); }
  }, [isLoggedIn, API, getAuthHeaders, loadServerCart, loadLocalCart, saveLocalCart]);

  const updateQuantity = useCallback(async (id_giohang: number | string, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(it => it.id_giohang === id_giohang ? { ...it, quantity } : it));

    if (isLoggedIn) {
      await fetch(`${API}/api/toi/giohang/${id_giohang}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ soluong: quantity }),
      }).catch(() => fetchCart());
    } else {
      const local = loadLocalCart();
      const updated = local.map(it => it.id_giohang === id_giohang ? { ...it, quantity } : it);
      saveLocalCart(updated);
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent("cart:updated"));
  }, [isLoggedIn, API, getAuthHeaders, fetchCart, loadLocalCart, saveLocalCart]);

  const removeItem = useCallback(async (id_giohang: number | string) => {
    setItems(prev => prev.filter(it => it.id_giohang !== id_giohang));
    if (isLoggedIn) {
      await fetch(`${API}/api/toi/giohang/${id_giohang}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      }).catch(() => fetchCart());
    } else {
      const local = loadLocalCart();
      const updated = local.filter(it => it.id_giohang !== id_giohang);
      saveLocalCart(updated);
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent("cart:updated"));
  }, [isLoggedIn, API, getAuthHeaders, fetchCart, loadLocalCart, saveLocalCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    if (!isLoggedIn) clearLocalCart();
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent("cart:updated", { detail: { count: 0 } }));
  }, [isLoggedIn, clearLocalCart]);

  // ========================================================================
  // 3. VOUCHER LOGIC
  // ========================================================================

  const subtotal = items.reduce((sum, it) => {
    const pPrice = it.product?.gia?.current;
    const price = Number(pPrice || 0);
    const qty = Number(it.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const applyVoucher = useCallback((voucher: Coupon) => {
    if (voucher.min_order_value && subtotal < voucher.min_order_value) {
      alert(`Đơn hàng chưa đạt giá trị tối thiểu ${voucher.min_order_value.toLocaleString("vi-VN")}đ`);
      return;
    }
    setAppliedVoucher(voucher);
  }, [subtotal]);

  // Lấy danh sách voucher
  const fetchVouchers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/ma-giam-gia`, {
        headers: getAuthHeaders(),
        cache: "no-store"
      });

      if (res.ok) {
        const json: unknown = await res.json();
        let list: unknown[] = [];
        if (json && typeof json === 'object' && 'data' in json && Array.isArray((json as { data: unknown[] }).data)) {
          list = (json as { data: unknown[] }).data;
        } else if (Array.isArray(json)) {
          list = json;
        }

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
      console.error("Lỗi lấy danh sách voucher:", e);
    }
  }, [API, getAuthHeaders]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const applyVoucherByCode = useCallback(async (code: string) => {
    if (!code) return;
    setLoading(true);
    try {
      await fetchVouchers();

      const res = await fetch(`${API}/api/ma-giam-gia`, { headers: getAuthHeaders() });
      const json = await res.json();

      let list: unknown[] = [];
      if (json && typeof json === 'object' && 'data' in json) {
        list = (json as { data: unknown[] }).data;
      } else if (Array.isArray(json)) {
        list = json;
      }

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

  const discountAmount = appliedVoucher ? appliedVoucher.giatri : 0;
  const total = Math.max(0, subtotal - discountAmount);
  const totalItems = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const totalGifts = gifts.reduce((sum, g) => sum + (g.soluong || 0), 0);

  return {
    items, loading, addToCart, updateQuantity, removeItem, clearCart, refreshCart: fetchCart,
    subtotal,
    totalItems,
    gifts,
    totalGifts,
    appliedVoucher,
    applyVoucher,
    applyVoucherByCode,
    removeVoucher,
    discountAmount,
    total,
    availableVouchers
  };
}