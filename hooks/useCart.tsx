"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import Cookies from "js-cookie";

const CART_STORAGE_KEY = "marketpro_cart";
const VOUCHER_STORAGE_KEY = "marketpro_applied_voucher";
const CART_PAYLOAD_KEY = "marketpro_cart_payload";

// ========================================================================
// 1. TYPE Definitions
// ========================================================================

export type VoucherConditionType =
  | 'tatca'
  | 'don_toi_thieu'
  | 'khachhang_moi'
  | 'khachhang_than_thiet'
  | 'freeship'
  | 'unknown';

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
  trangthai?: string;
};

export interface CartSummary {
  tamtinh: number;
  tietkiem: number;
  giamgia_voucher: number;
  tonggiatri: number;
  voucher_info: Coupon | null;
}

export type Gia = { current?: number; before_discount?: number; discount_percent?: number };

export type ProductDisplayInfo = {
  id?: number | string;
  ten?: string;
  name?: string;
  mediaurl?: string;
  hinhanh?: string;
  gia?: Gia;
  loaibienthe?: string;
  thuonghieu?: string;
  slug?: string;
};

export type CartItem = {
  id_giohang: number | string;
  id_bienthe: number | string;
  soluong: number;
  thanhtien?: number;
  product?: ProductDisplayInfo;
};

export interface GiftItem {
  id_bienthe: number | string;
  soluong: number;
  thanhtien: number;
  ten_sanpham?: string;
  ten_loaibienthe?: string;
  thuonghieu?: string;
  hinhanh?: string;
  slug?: string;
  giagoc?: number;
  is_gift?: boolean;
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
  [key: string]: unknown;
};

// ========================================================================
// 2. HELPER FUNCTIONS
// ========================================================================

export const parseVoucherCondition = (dieukien?: string, mota?: string): {
  type: VoucherConditionType;
  minOrderValue: number;
} => {
  const condition = (dieukien || '').toLowerCase();
  const description = (mota || '').toLowerCase();
  const fullText = condition + ' ' + description;

  let minOrderValue = 0;
  const matches6 = fullText.match(/(\d{6,})/g);
  if (matches6 && matches6.length > 0) {
    minOrderValue = Math.max(...matches6.map(Number));
  } else {
    const matchK = fullText.match(/(\d+)k/i);
    if (matchK) minOrderValue = parseInt(matchK[1]) * 1000;
  }

  if (condition === 'tatca') return { type: 'tatca', minOrderValue: 0 };
  if (condition.includes('khachhang_moi')) return { type: 'khachhang_moi', minOrderValue };
  if (condition.includes('khachhang_than_thiet')) return { type: 'khachhang_than_thiet', minOrderValue };
  if (condition.includes('don_toi_thieu') || minOrderValue > 0) return { type: 'don_toi_thieu', minOrderValue };
  if (fullText.includes('freeship') || fullText.includes('mien phi')) return { type: 'freeship', minOrderValue };

  return { type: 'unknown', minOrderValue };
};

export const isVoucherInDateRange = (ngaybatdau?: string, ngayketthuc?: string): boolean => {
  const now = new Date();
  // Reset giờ về 0 để so sánh chính xác theo ngày (tuỳ chọn, nếu muốn chính xác từng giây thì bỏ dòng này)
  // now.setHours(0, 0, 0, 0); 

  if (ngaybatdau) {
    const startDate = new Date(ngaybatdau);
    if (now < startDate) return false; // Chưa đến ngày
  }

  if (ngayketthuc) {
    const endDate = new Date(ngayketthuc);
    // Đặt giờ kết thúc là cuối ngày (23:59:59) để voucher vẫn dùng được trong ngày hết hạn
    endDate.setHours(23, 59, 59, 999);
    if (now > endDate) return false; // Đã quá hạn
  }

  return true;
};
// ========================================================================
// 3. HOOK LOGIC (MAIN)
// ========================================================================

export function useCart() {
  const { isLoggedIn } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const itemsRef = useRef<CartItem[]>(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const [summary, setSummary] = useState<CartSummary>({
    tamtinh: 0,
    tietkiem: 0,
    giamgia_voucher: 0,
    tonggiatri: 0,
    voucher_info: null
  });

  const [availableVouchers, setAvailableVouchers] = useState<Coupon[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);

  const isMountedRef = useRef(true);
  const hasSyncedRef = useRef(false);
  const emitTimeoutRef = useRef<number | null>(null);

  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";

  // --- AUTH ---
  const hasValidToken = useCallback((): boolean => {
    const token = Cookies.get("access_token");
    return !!token && token.length > 0;
  }, []);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (isLoggedIn) {
      const token = Cookies.get("access_token") || Cookies.get("token");
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, [isLoggedIn]);

  const emitCartUpdated = useCallback((detail: { count?: number } = {}) => {
    window.dispatchEvent(new CustomEvent("cart:updated", { detail }));
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== "undefined") {
      try {
        const savedVoucher = localStorage.getItem(VOUCHER_STORAGE_KEY);
        if (savedVoucher) setAppliedVoucher(JSON.parse(savedVoucher));
      } catch (e) { console.error(e); }
    }
    return () => { isMountedRef.current = false; };
  }, []);

  // --- LOCAL STORAGE HELPERS ---
  const loadLocalCartPayload = useCallback(() => {
    if (typeof window === "undefined") return { cart_local: [] };
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return { cart_local: [] };
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return { cart_local: [] };
      const cart_local = parsed.map((i: any) => ({
        id_bienthe: Number(i.id_bienthe) || i.id_bienthe,
        soluong: Number(i.soluong) || 1
      }));
      return { cart_local };
    } catch { return { cart_local: [] }; }
  }, []);

  const saveLocalCart = useCallback((cartItems: CartItem[]) => {
    if (typeof window === "undefined") return;
    try {
      // Lưu toàn bộ item vào storage chính
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      // Lưu payload tối giản để gửi lên API
      const payload = {
        cart_local: cartItems.map(i => ({ id_bienthe: i.id_bienthe, soluong: i.soluong }))
      };
      localStorage.setItem(CART_PAYLOAD_KEY, JSON.stringify(payload));
    } catch (e) { console.error(e); }
  }, []);

  // --- MAPPING HELPERS ---
  const mapServerItemToLocal = useCallback((serverItem: any): CartItem => {
    const bt = serverItem.bienthe || {};
    const sp = bt.sanpham || {};
    const detail = bt.detail || {};

    // [FIX]: Luôn ưu tiên tạo ID dựa trên id_bienthe nếu là Guest để khớp với LocalStorage
    const fallbackId = `local_${bt.id}`;

    return {
      // Nếu có id_giohang từ DB (User) thì lấy, nếu ko (Guest) thì lấy id_giohang server gửi về hoặc fallback
      id_giohang: serverItem.id_giohang ?? serverItem.id ?? fallbackId,
      id_bienthe: bt.id || serverItem.id_bienthe,
      soluong: serverItem.soluong,
      thanhtien: serverItem.thanhtien,
      product: {
        id: bt.id,
        ten: sp.ten || detail.tensanpham || "Sản phẩm",
        mediaurl: sp.hinhanhsanpham?.[0]?.hinhanh || bt.hinhanh || detail.hinhanh || "/assets/images/thumbs/product-placeholder.png",
        gia: {
          current: bt.giadagiam ?? bt.giaban ?? 0,
          before_discount: bt.giagoc ?? 0,
          discount_percent: 0
        },
        loaibienthe: bt.loaibienthe?.ten || "",
        thuonghieu: sp.thuonghieu?.ten || "",
        slug: sp.slug || ""
      }
    };
  }, []);

  // ========================================================================
  // CORE: FETCH CART
  // ========================================================================
  const fetchCart = useCallback(async (codeOverride?: string) => {
    if (!isMountedRef.current) return;

    try {
      const hasToken = hasValidToken();
      let currentCode = codeOverride;

      if (currentCode === undefined && typeof window !== 'undefined') {
        const savedRaw = localStorage.getItem(VOUCHER_STORAGE_KEY);
        if (savedRaw) {
          try {
            const saved = JSON.parse(savedRaw);
            currentCode = saved.code || saved.magiamgia || "";
          } catch (e) { currentCode = ""; }
        }
      }

      // [QUAN TRỌNG]: Luôn load lại local storage mới nhất ngay thời điểm gọi API
      const payload = {
        cart_local: !hasToken ? loadLocalCartPayload().cart_local : [],
        voucher_code: currentCode || ""
      };

      const res = await fetch(`${API}/api/v1/gio-hang`, {
        method: "POST",
        headers: hasToken ? getAuthHeaders() : { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const j = await res.json();

      if (j.status === 200 && j.data) {
        const svData = j.data;
        const rawItems = Array.isArray(svData.items) ? svData.items : [];
        const mappedItems = rawItems.map(mapServerItemToLocal);

        const rawGifts = Array.isArray(svData.gifts) ? svData.gifts : [];
        const mappedGifts = rawGifts.map((g: any) => ({
          id_bienthe: g.id_bienthe,
          soluong: g.soluong,
          thanhtien: 0,
          ten_sanpham: g.bienthe?.sanpham?.ten || "Quà tặng",
          ten_loaibienthe: g.bienthe?.loaibienthe?.ten || "",
          thuonghieu: g.bienthe?.sanpham?.thuonghieu?.ten || "",
          hinhanh: g.bienthe?.sanpham?.hinhanhsanpham?.[0]?.hinhanh || g.hinhanh || "",
          slug: g.bienthe?.sanpham?.slug || "",
          giagoc: g.bienthe?.giagoc || 0,
          is_gift: true
        }));

        if (svData.summary) {
          setSummary(svData.summary);
          if (svData.summary.voucher_info) {
            const vInfo = svData.summary.voucher_info;
            setAppliedVoucher({
              id: vInfo.id,
              code: String(vInfo.magiamgia || vInfo.code || ""),
              magiamgia: vInfo.magiamgia,
              giatri: vInfo.giatri,
              mota: vInfo.mota,
              min_order_value: vInfo.dieukien,
              condition_type: parseVoucherCondition(vInfo.dieukien, vInfo.mota).type
            });
          }
        }

        if (Array.isArray(svData.available_vouchers)) {
          const mappedVouchers = svData.available_vouchers.map((v: any) => ({
            id: v.id,
            code: String(v.magiamgia || v.code || ""),
            magiamgia: v.magiamgia,
            giatri: v.giatri,
            mota: v.mota,
            dieukien: v.dieukien,
            ngaybatdau: v.ngaybatdau,
            ngayketthuc: v.ngayketthuc,
            trangthai: v.trangthai,
            condition_type: parseVoucherCondition(v.dieukien, v.mota).type
          }));
          setAvailableVouchers(mappedVouchers);
        }

        if (isMountedRef.current) {
          setItems(mappedItems);
          setGifts(mappedGifts);
        }

        const totalQty = mappedItems.reduce((acc: number, item: CartItem) => acc + item.soluong, 0);
        emitCartUpdated({ count: totalQty });
      }

    } catch (e) {
      console.error("Lỗi load giỏ hàng:", e);
      if (!hasValidToken()) {
        const rawLocal = localStorage.getItem(CART_STORAGE_KEY);
        if (rawLocal && isMountedRef.current) {
          setItems(JSON.parse(rawLocal));
        }
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [API, hasValidToken, getAuthHeaders, loadLocalCartPayload, mapServerItemToLocal, emitCartUpdated]);

  const syncLocalToServer = useCallback(async () => {
    const { cart_local } = loadLocalCartPayload();
    if (cart_local.length === 0) return;
    try {
      await fetch(`${API}/api/v1/gio-hang/sync`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ cart_items: cart_local }),
      });
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(CART_PAYLOAD_KEY);
      fetchCart();
    } catch (e) { console.warn("Sync failed", e); }
  }, [API, getAuthHeaders, loadLocalCartPayload, fetchCart]);

  useEffect(() => {
    const initCart = async () => {
      if (hasValidToken()) {
        if (!hasSyncedRef.current) {
          hasSyncedRef.current = true;
          await syncLocalToServer();
        } else {
          await fetchCart();
        }
      } else {
        await fetchCart();
      }
    };
    initCart();
  }, [hasValidToken, syncLocalToServer, fetchCart]);

  // ========================================================================
  // 4. ACTIONS
  // ========================================================================

  // ----------------------------------------------------------------------
  // HÀM 2: THÊM VÀO GIỎ (ADD) - ĐÃ SỬA LỖI GUEST
  // ----------------------------------------------------------------------
  const addToCart = useCallback(async (product: AddToCartInput, soluong = 1, id_chuongtrinh?: number | string) => {
    // Lấy ID biến thể (ưu tiên id_bienthe truyền vào, nếu không có thì lấy id product)
    const id_bienthe = product.id_bienthe ?? product.id;
    if (!id_bienthe) {
      console.error("Thiếu id_bienthe", product);
      return;
    }

    // --- CASE A: ĐÃ ĐĂNG NHẬP (USER) ---
    if (hasValidToken()) {
      try {
        const body: any = { id_bienthe, soluong };
        if (id_chuongtrinh) body.id_chuongtrinh = id_chuongtrinh;

        const res = await fetch(`${API}/api/v1/gio-hang/them`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(body),
        });

        // Nếu token hết hạn (401), có thể cân nhắc xử lý logout tại đây
        if (res.ok) {
          fetchCart(); // Load lại giỏ hàng server
          // alert("Đã thêm vào giỏ hàng");
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.message || "Không thể thêm vào giỏ (User)");
        }
      } catch (e) {
        console.error(e);
        alert("Lỗi kết nối khi thêm giỏ hàng");
      }
    }

    // --- CASE B: KHÁCH VÃNG LAI (GUEST) ---
    else {
      // 1. Chuẩn bị dữ liệu LocalStorage
      const localItems = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");

      // Tìm xem sản phẩm đã có trong local chưa (so sánh id_bienthe)
      const existIdx = localItems.findIndex((i: any) => String(i.id_bienthe) === String(id_bienthe));

      const tempItems = [...localItems];
      if (existIdx > -1) {
        // Cộng dồn số lượng
        tempItems[existIdx].soluong = Number(tempItems[existIdx].soluong) + soluong;
      } else {
        // Thêm mới
        const uniq = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        tempItems.push({
          id_giohang: `local_${id_bienthe}_${uniq}`, // ID giả cho React key
          id_bienthe: Number(id_bienthe),
          soluong: Number(soluong),
          product: {
            // Lưu thông tin hiển thị ngay lập tức (Optimistic UI)
            ten: product.ten || "Sản phẩm",
            mediaurl: product.mediaurl || product.hinhanh,
            gia: {
              current: (typeof product.gia === 'object' && product.gia !== null)
                ? (product.gia.current || 0)
                : (Number(product.gia) || 0)
            }
          }
        });
      }

      saveLocalCart(tempItems);

      fetchCart();

      // alert("Đã thêm vào giỏ hàng");
      try {
        const cartPayload = tempItems.map((i: any) => ({
          id_bienthe: i.id_bienthe,
          soluong: i.soluong
        }));

        const res = await fetch(`${API}/api/v1/gio-hang/them`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            id_bienthe,
            soluong,
            cart_local: cartPayload
          })
        });

        const j = await res.json().catch(() => ({}));
        if (res.status === 400 || res.status === 422) {
          console.warn("Lỗi thêm giỏ hàng guest:", j);
        }
      } catch (e) {
        console.warn("Không gọi được API check tồn kho guest:", e);
      }
    }
  }, [API, hasValidToken, getAuthHeaders, fetchCart, saveLocalCart]);

  // [SỬA LỖI CHÍNH]: Hàm updatesoluong cho Guest
  const updatesoluong = useCallback(async (id_giohang: number | string, soluong: number) => {
    if (soluong < 1) return;

    // Optimistic update UI
    setItems(prev => prev.map(i => i.id_giohang === id_giohang ? { ...i, soluong } : i));

    // Debounce
    if (emitTimeoutRef.current) clearTimeout(emitTimeoutRef.current);

    emitTimeoutRef.current = window.setTimeout(async () => {
      // Lấy item hiện tại từ ref để tránh stale closure
      const currentItem = itemsRef.current.find(i => i.id_giohang === id_giohang);

      if (hasValidToken()) {
        // USER: gọi API cập nhật số lượng
        try {
          if (!currentItem) {
            console.warn("Item not found for update (user)", id_giohang);
            await fetchCart();
            return;
          }

          const id_bienthe = currentItem.id_bienthe ?? currentItem.id_giohang ?? (currentItem as any).id;
          const res = await fetch(`${API}/api/v1/gio-hang/cap-nhat`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ id_bienthe, soluong }),
            credentials: "include"
          });

          // Luôn re-sync từ server để đảm bảo giá/khuyến mãi/gift chính xác
          await fetchCart();
          if (!res.ok) console.error("Lỗi update số lượng (user):", res.status);
        } catch (e) {
          console.error("Update quantity error (user)", e);
          await fetchCart();
        }
      } else {
        // GUEST: cập nhật localStorage rồi re-sync UI bằng fetchCart()
        try {
          if (!currentItem) {
            console.warn("Item not found for update (guest)", id_giohang);
            return;
          }
          const localItems = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
          // Tìm bằng id_bienthe trước, fallback id_giohang
          const idx = localItems.findIndex((i: any) => String(i.id_bienthe) === String(currentItem.id_bienthe) || String(i.id_giohang) === String(id_giohang));
          if (idx > -1) {
            localItems[idx].soluong = soluong;
            saveLocalCart(localItems);
            await fetchCart();
          } else {
            console.warn("Không tìm thấy item trong LocalStorage để update (guest)", currentItem);
          }
        } catch (e) {
          console.error("Update quantity error (guest)", e);
        }
      }
    }, 500);
  }, [hasValidToken, saveLocalCart, fetchCart]);

  const removeItem = useCallback(async (id_giohang: number | string) => {
    // Optimistic update
    const itemToRemove = items.find(i => i.id_giohang === id_giohang);
    setItems(prev => prev.filter(i => i.id_giohang !== id_giohang));

    if (hasValidToken()) {
      try {
        const idParam = itemToRemove ? itemToRemove.id_bienthe : id_giohang;
        await fetch(`${API}/api/v1/gio-hang/xoa/${idParam}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });
        fetchCart();
      } catch (e) { fetchCart(); }
    } else {
      const localItems = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      let newItems = [];

      if (itemToRemove) {
        newItems = localItems.filter((i: any) => String(i.id_bienthe) !== String(itemToRemove.id_bienthe));
      } else {
        // Fallback nếu ko tìm thấy trong state (hiếm)
        newItems = localItems.filter((i: any) => i.id_giohang !== id_giohang);
      }

      saveLocalCart(newItems);
      fetchCart();
    }
  }, [hasValidToken, items, getAuthHeaders, API, fetchCart, saveLocalCart]);

  const clearCart = useCallback(() => {
    if (!hasValidToken()) {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(CART_PAYLOAD_KEY);
    }
    setItems([]);
    setGifts([]);
    setSummary({ tamtinh: 0, tietkiem: 0, giamgia_voucher: 0, tonggiatri: 0, voucher_info: null });
    emitCartUpdated({ count: 0 });
  }, [hasValidToken, emitCartUpdated]);

  const applyVoucher = useCallback((voucher: Coupon) => {
    setAppliedVoucher(voucher);
    if (typeof window !== "undefined") {
      localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(voucher));
    }
    fetchCart(voucher.magiamgia ? String(voucher.magiamgia) : voucher.code);
  }, [fetchCart]);

  const removeVoucher = useCallback(() => {
    setAppliedVoucher(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(VOUCHER_STORAGE_KEY);
    }
    fetchCart("");
  }, [fetchCart]);

  const applyVoucherByCode = useCallback((code: string) => {
    fetchCart(code);
  }, [fetchCart]);

  const applyVoucherById = useCallback((id: number | string) => {
    const v = availableVouchers.find(v => v.id === id || String(v.id) === String(id));
    if (v) applyVoucher(v);
    else alert("Voucher không tìm thấy hoặc chưa đủ điều kiện");
  }, [availableVouchers, applyVoucher]);

  const fetchVouchers = useCallback(async () => {
    if (availableVouchers.length === 0) await fetchCart();
  }, [availableVouchers, fetchCart]);

  return {
    items,
    gifts,
    loading,
    subtotal: summary.tamtinh,
    discountAmount: summary.giamgia_voucher,
    total: summary.tonggiatri,
    savedAmount: summary.tietkiem,
    totalItems: items.reduce((s, i) => s + i.soluong, 0),
    totalGifts: gifts.reduce((s, g) => s + g.soluong, 0),
    availableVouchers,
    appliedVoucher,
    addToCart,
    updatesoluong,
    removeItem,
    clearCart,
    refreshCart: fetchCart,
    applyVoucher,
    removeVoucher,
    applyVoucherByCode,
    applyVoucherById,
    fetchVouchers,
  };
}