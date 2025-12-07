"use client";

import React from "react";
import AccountShell from "@/components/AccountShell";
import ProductCardV2 from "@/components/ProductCardV2";
import { useWishlist } from "@/hooks/useWishlist";
import FullHeader from "@/components/FullHeader";
import Cookies from "js-cookie";

/** Kiểu tối thiểu cho item trả về từ API */
type WishProduct = {
  is_free: boolean;
  id?: number | string;
  ten?: string;
  giagiam_min?: number | string;
  giagiam_max?: number | string;
  gia_min?: number | string;
  gia_max?: number | string;
  hinhanhsanpham: string;
  slug?: string;
};

// Kiểu record trả về từ /api/toi/yeuthichs
type FavoriteRecord = {
  id?: number;
  id_nguoidung?: number;
  id_sanpham?: number | string;
  trangthai?: string;
  sanpham?: {
    id?: number;
    tensanpham?: string;
    hinhanhsanpham?: { id?: number; url?: string }[];
  } | null;
};

export default function WishlistPage() {
  const API = process.env.NEXT_PUBLIC_SERVER_API || "http://localhost:4000";

  // ✅ Gọi hook đúng chuẩn – không bọc IIFE
  const { ids, isWished, toggle } = useWishlist();

  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<WishProduct[]>([]);

  // helper: lấy auth header từ cookie
  const getAuthHeaders = (): Record<string,string> => {
    const token = Cookies.get("access_token") || Cookies.get("token") || null;
    return token ? { Accept: "application/json", Authorization: `Bearer ${token}` } : { Accept: "application/json" };
  };

  // Tìm favorite record id của product (trả về null nếu không tìm thấy)
  const findFavoriteRecordId = async (productId: number): Promise<number | null> => {
    try {
      const res = await fetch(`${API}/api/toi/yeuthichs`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) return null;
      const j = await res.json();
      const rawList = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
      const list = rawList as FavoriteRecord[];
      const found = list.find((r: FavoriteRecord) => (r.id_sanpham == productId) || (r.sanpham?.id == productId));
      return found?.id ?? null;
    } catch {
      return null;
    }
  };

  // Handler truyền xuống ProductCardV2.onUnwish
  const handleUnwish = async (productId: number) => {
    // optimistic UI: loại item khỏi state ngay
    setItems(prev => prev.filter(p => (p.id ?? 0) !== productId));
    try {
      // backend có thể yêu cầu favorite-record-id; tìm nếu cần
      const recordId = await findFavoriteRecordId(productId);
      if (!recordId) {
        console.warn("Không tìm record yêu thích, đã bỏ ở UI nhưng không gọi API");
        return;
      }
      await fetch(`${API}/api/toi/yeuthichs/${recordId}`, {
        method: "PATCH", // bạn yêu cầu dùng PATCH
        headers: getAuthHeaders(),
        credentials: "include",
      });
    } catch (err) {
      console.error("Xoá yêu thích thất bại", err);
      // rollback nếu cần: refetch hoặc thêm lại vào items
    }
  };
  
  // Helpers
  const toNum = (v: unknown): number | undefined => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = parseInt(v, 10);
      if (Number.isFinite(n)) return n;
    }
    return undefined;
  };

  const getPid = React.useCallback((row: WishProduct): number => {
    const cand =
      toNum(row.id) ?? toNum(row.id);
    return typeof cand === "number" ? cand : 0;
  }, []);

  React.useEffect(() => {
    let alive = true;
    const listIds = Array.from(ids) as number[]; // ids từ hook: Set<number>

    if (listIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const fetchOne = async (id: number): Promise<WishProduct> => {
      const r = await fetch(`${API}/api/sanphams/${id}`, {
        headers: { Accept: "application/json" },
      });
      const j = await r.json();
      return (j?.data ?? j) as WishProduct;
    };

    (async () => {
      try {
        const settled = await Promise.allSettled(listIds.map(fetchOne));
        const ok = settled
          .filter(
            (s): s is PromiseFulfilledResult<WishProduct> =>
              s.status === "fulfilled"
          )
          .map((s) => s.value);
        if (alive) setItems(ok);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [API, ids]);

  return (
    <>
    <FullHeader showClassicTopBar={true} showTopNav={false} />
    <AccountShell title="Yêu thích" current="wishlist">
      {loading ? (
        <div>Đang tải…</div>
      ) : items.length === 0 ? (
        <div>Danh sách trống.</div>
      ) : (
        <div className="row g-12">
          {items.map((p) => {
            const pid = getPid(p);
            const img =
              p.hinhanhsanpham
              "/assets/images/thumbs/product-two-img1.png";
            const name = p.ten || `Sản phẩm #${pid}`;
            // price comes from giagiam_min (can be string or number)
            const price = toNum(p.giagiam_min) ?? 0;
            const oldPrice = undefined; // not required by request

            const isFree = price === 0 || p.is_free === true;
            const discount = 0;

            const badge = isFree
              ? { text: "Miễn phí", color: "primary" as const }
              : discount > 0
              ? {
                  text: `Giảm ${discount.toLocaleString("vi-VN")} đ`,
                  color: "warning" as const,
                }
              : undefined;

            return (
              <div
                key={pid || String(p.id)}
                className="col-xxl-3 col-xl-4 col-lg-4 col-sm-6"
              >
                <ProductCardV2
                  href={`${p.hinhanhsanpham ?? "#"}`}
                  img={p.hinhanhsanpham ?? img ?? "/assets/images/thumbs/product-two-img1.png" }
                  title={name}
                  price={price}
                  variantId={pid || undefined}
                  badge={badge}
                  showHeart
                  isWished={pid !== 0 && isWished(pid)}
                  onToggleWish={() => {
                    const currently = pid !== 0 && isWished(pid);
                    if (currently)
                      setItems((prev) => prev.filter((it) => getPid(it) !== pid));
                    if (pid !== 0) toggle(pid);
                  }}
                  showUnwishButton
                  onUnwish={() => {
                    if (pid !== 0 && isWished(pid))
                      setItems((prev) => prev.filter((it) => getPid(it) !== pid));
                    if (pid !== 0) toggle(pid);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </AccountShell>
    </>
  );
}
