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
<<<<<<< HEAD
  name?: string;
  title?: string;
  mediaurl?: string;
  anhsanphams?: { media?: string }[];
  selling_price?: number;
  original_price?: number;
  is_free?: boolean;
  gia?: { current?: number; before_discount?: number };
  bienthes?: { gia?: number | string; giagiam?: number | string }[];
  loaibienthe?: string;
  thuonghieu?: string;
  thuong_hieu?: string;
=======
  giagiam_min?: number | string;
  giagiam_max?: number | string;
  gia_min?: number | string;
  gia_max?: number | string;
  hinhanhsanpham: string;
  slug?: string;
};

// Kiểu record trả về từ /api/tai-khoan/yeuthichs
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
>>>>>>> 5b15ce02da55ecefb1019828678cbadd7d5e04ac
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
      const res = await fetch(`${API}/api/tai-khoan/yeuthichs`, {
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
      await fetch(`${API}/api/tai-khoan/yeuthichs/${recordId}`, {
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
<<<<<<< HEAD
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
                p.mediaurl ||
                p?.anhsanphams?.[0]?.media ||
                "/assets/images/thumbs/product-two-img1.png";
              const name = p.ten || p.name || p.title || `Sản phẩm #${pid}`;

              // Lấy giá: ưu tiên selling_price → giá biến thể → gia.current
              const toNumLoose = (x: unknown): number =>
                typeof x === "string"
                  ? parseFloat(x)
                  : typeof x === "number"
                    ? x
                    : 0;

              const v0 = p?.bienthes?.[0];
              const baseGia = v0
                ? { gia: toNumLoose(v0.gia), giagiam: toNumLoose(v0.giagiam) }
                : {
                  gia: toNumLoose(p?.gia?.before_discount),
                  giagiam: toNumLoose(p?.gia?.current),
                };

              const sellingFromVariant = v0
                ? baseGia.giagiam > 0 && baseGia.giagiam < baseGia.gia
                  ? baseGia.giagiam
                  : Math.max(baseGia.gia - baseGia.giagiam, 0)
                : undefined;

              const price =
                typeof p.selling_price === "number"
                  ? p.selling_price
                  : sellingFromVariant ??
                  (typeof p?.gia?.current === "number" ? p.gia.current! : 0);
=======
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
>>>>>>> 5b15ce02da55ecefb1019828678cbadd7d5e04ac

              const oldPrice =
                typeof p.original_price === "number"
                  ? p.original_price
                  : typeof p?.gia?.before_discount === "number"
                    ? p.gia!.before_discount!
                    : sellingFromVariant !== undefined
                      ? baseGia.gia
                      : undefined;

<<<<<<< HEAD
              const isFree = price === 0 || p.is_free === true;
              const discount =
                !isFree && typeof oldPrice === "number" && oldPrice > price
                  ? oldPrice - price
                  : 0;

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
                    href={`/products/${p.slug || pid}`}
                    img={img}
                    title={name}
                    price={price}
                    oldPrice={oldPrice}
                    variantId={pid || undefined}
                    badge={badge}
                    loaibienthe={p.loaibienthe || ""}
                    thuonghieu={p.thuonghieu || p.thuong_hieu || ""}
                    slug={p.slug || String(pid)}
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
=======
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
>>>>>>> 5b15ce02da55ecefb1019828678cbadd7d5e04ac
    </>
  );
}
