"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import Cookies from "js-cookie";

const CART_STORAGE_KEY = "marketpro_cart";
const VOUCHER_STORAGE_KEY = "marketpro_applied_voucher";
const CART_PAYLOAD_KEY = "marketpro_cart_payload";

// ========================================================================
// 1. TYPE Definitions (Giữ nguyên)
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
  now.setHours(0, 0, 0, 0);

  if (ngaybatdau) {
    const startDate = new Date(ngaybatdau);
    startDate.setHours(0, 0, 0, 0);
    if (now < startDate) return false;
  }
  if (ngayketthuc) {
    const endDate = new Date(ngayketthuc);
    endDate.setHours(23, 59, 59, 999);
    if (now > endDate) return false;
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
  const emitTimeoutRef = useRef<number | null>(null); // Dùng để debounce update số lượng

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

  // --- EVENT EMITTER ---
  // Vẫn giữ hàm này để Header có thể lắng nghe và cập nhật số lượng badge
  const emitCartUpdated = useCallback((detail: { count?: number } = {}) => {
    // Không cần debounce ở đây, chỉ dispatch sự kiện ra ngoài
    window.dispatchEvent(new CustomEvent("cart:updated", { detail }));
  }, []);

  // Khôi phục Voucher từ LocalStorage khi mới vào
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
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
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

    return {
      id_giohang: serverItem.id_giohang ?? serverItem.id ?? `temp_${bt.id}`,
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
  // CORE: FETCH CART (Hàm này chỉ chạy khi được GỌI CỤ THỂ)
  // ========================================================================
  const fetchCart = useCallback(async (codeOverride?: string) => {
    if (!isMountedRef.current) return;
    
    // Chỉ hiện loading nếu là lần đầu hoặc cần thiết
    // setLoading(true); 

    try {
      const hasToken = hasValidToken();
      let currentCode = codeOverride;

      // Logic lấy code: Ưu tiên tham số -> LocalStorage
      if (currentCode === undefined && typeof window !== 'undefined') {
          const savedRaw = localStorage.getItem(VOUCHER_STORAGE_KEY);
          if (savedRaw) {
              try {
                  const saved = JSON.parse(savedRaw);
                  currentCode = saved.code || saved.magiamgia || "";
              } catch (e) { currentCode = ""; }
          }
      }

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
        
        // 1. Map Items
        const rawItems = Array.isArray(svData.items) ? svData.items : [];
        const mappedItems = rawItems.map(mapServerItemToLocal);
        
        // 2. Map Gifts
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

        // 3. Map Summary
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

        // 4. Map Available Vouchers
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
        
        // Cập nhật số lượng cho Header (nhưng không gọi fetch lại ở đây)
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

  // --- INIT: Chạy 1 lần duy nhất khi vào trang ---
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
      // Sau khi sync xong thì mới load lại giỏ
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
         // Khách vãng lai: load luôn
         await fetchCart();
      }
    };
    initCart();
  }, [hasValidToken, syncLocalToServer, fetchCart]);

  // ========================================================================
  // QUAN TRỌNG: ĐÃ XÓA useEffect lắng nghe 'cart:updated'
  // Bây giờ API chỉ gọi khi User tương tác (bấm nút) hoặc mới vào trang.
  // ========================================================================

  // ========================================================================
  // 4. ACTIONS (Các hàm này sẽ chủ động gọi API cập nhật)
  // ========================================================================

  const addToCart = useCallback(async (product: AddToCartInput, soluong = 1, id_chuongtrinh?: number | string) => {
    const id_bienthe = product.id_bienthe ?? product.id;
    if (!id_bienthe) return;

    if (hasValidToken()) {
      try {
        const body: any = { id_bienthe, soluong };
        if (id_chuongtrinh) body.id_chuongtrinh = id_chuongtrinh;

        const res = await fetch(`${API}/api/v1/gio-hang/them`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(body),
        });
        if (res.ok) {
           fetchCart(); // Gọi cập nhật sau khi thêm xong
           alert("Đã thêm vào giỏ hàng");
        } else {
           const err = await res.json();
           alert(err.message || "Không thể thêm vào giỏ");
        }
      } catch (e) { console.error(e); }
    } else {
      // Guest logic
      const localItems = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      const existIdx = localItems.findIndex((i: any) => String(i.id_bienthe) === String(id_bienthe));
      const tempItems = [...localItems];
      if (existIdx > -1) {
          tempItems[existIdx].soluong = Number(tempItems[existIdx].soluong) + soluong;
      } else {
          tempItems.push({
             id_giohang: `local_${id_bienthe}_${Date.now()}`,
             id_bienthe,
             soluong,
             product: { 
                 ten: product.ten || "Sản phẩm", 
                 mediaurl: product.mediaurl || product.hinhanh,
                 gia: { current: Number(product.gia) || 0 }
             }
          });
      }

      try {
         const res = await fetch(`${API}/api/v1/gio-hang/them`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                id_bienthe, 
                soluong, 
                cart_local: tempItems.map(i => ({ id_bienthe: i.id_bienthe, soluong: i.soluong })) 
            })
         });
         
         const j = await res.json();
         if (j.status === 200 || j.status === 201) {
             saveLocalCart(tempItems);
             fetchCart(); // Gọi cập nhật
             alert("Đã thêm vào giỏ hàng");
         } else {
             alert(j.message || "Sản phẩm không đủ số lượng");
         }
      } catch (e) { console.error(e); }
    }
  }, [API, hasValidToken, getAuthHeaders, fetchCart, saveLocalCart]);

  const updatesoluong = useCallback(async (id_giohang: number | string, soluong: number) => {
      if (soluong < 1) return;
      
      // 1. Cập nhật UI ngay lập tức (Optimistic)
      setItems(prev => prev.map(i => i.id_giohang === id_giohang ? { ...i, soluong } : i));

      // 2. Debounce gọi API (chờ 500ms sau khi người dùng dừng bấm)
      if (emitTimeoutRef.current) clearTimeout(emitTimeoutRef.current);
      
      emitTimeoutRef.current = window.setTimeout(() => {
          if (hasValidToken()) {
              // Member: Gọi API tính lại (vì bạn chưa có API PUT riêng, dùng fetchCart để BE tính tổng)
              fetchCart();
          } else {
              // Guest: Lưu local rồi gọi API tính
              const localItems = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
              const idx = localItems.findIndex((i: any) => i.id_giohang === id_giohang);
              if (idx > -1) {
                  localItems[idx].soluong = soluong;
                  saveLocalCart(localItems);
                  fetchCart();
              }
          }
      }, 500); // 500ms delay
  }, [hasValidToken, saveLocalCart, fetchCart]);

  const removeItem = useCallback(async (id_giohang: number | string) => {
      // Optimistic update
      setItems(prev => prev.filter(i => i.id_giohang !== id_giohang));
      
      if (hasValidToken()) {
          try {
             const itemToRemove = items.find(i => i.id_giohang === id_giohang);
             const idParam = itemToRemove ? itemToRemove.id_bienthe : id_giohang;

             await fetch(`${API}/api/v1/gio-hang/xoa/${idParam}`, {
                 method: "DELETE",
                 headers: getAuthHeaders()
             });
             fetchCart(); // Xóa xong thì gọi API lấy lại dữ liệu mới
          } catch (e) { fetchCart(); }
      } else {
          const localItems = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
          const newItems = localItems.filter((i: any) => i.id_giohang !== id_giohang);
          saveLocalCart(newItems);
          fetchCart(); // Xóa xong thì gọi API lấy lại dữ liệu mới
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
      // Gọi ngay API để tính toán lại với voucher mới
      fetchCart(voucher.magiamgia ? String(voucher.magiamgia) : voucher.code);
  }, [fetchCart]);

  const removeVoucher = useCallback(() => {
      setAppliedVoucher(null);
      if (typeof window !== "undefined") {
          localStorage.removeItem(VOUCHER_STORAGE_KEY);
      }
      // Gọi ngay API để tính toán lại (không kèm voucher)
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
    
    // [SỬA LỖI]: Trỏ trực tiếp vào fetchCart thay vì tạo hàm nặc danh () => ...
    refreshCart: fetchCart, 
    
    applyVoucher,
    removeVoucher,
    applyVoucherByCode,
    applyVoucherById,
    fetchVouchers,
  };
}