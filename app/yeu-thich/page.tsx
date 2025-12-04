"use client";

import React from "react";
import AccountShell from "@/components/AccountShell";
import ProductCardV2 from "@/components/ProductCardV2";
import { useWishlist } from "@/hooks/useWishlist";
import FullHeader from "@/components/FullHeader";

/** Kiểu tối thiểu cho item trả về từ API */
type WishProduct = {
  id?: number | string;
  product_id?: number | string;
  product?: { id?: number | string };
  slug?: string;
  ten?: string;
  name?: string;
  title?: string;
  mediaurl?: string;
  anhsanphams?: { media?: string }[];
  selling_price?: number;
  original_price?: number;
  is_free?: boolean;
  gia?: { current?: number; before_discount?: number };
  bienthes?: { gia?: number | string; giagiam?: number | string }[];
};

export default function WishlistPage() {
  const API = process.env.NEXT_PUBLIC_SERVER_API || "http://localhost:4000";

  // ✅ Gọi hook đúng chuẩn – không bọc IIFE
  const { ids, isWished, toggle } = useWishlist();

  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<WishProduct[]>([]);

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
      toNum(row.product_id) ?? toNum(row.product?.id) ?? toNum(row.id);
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

            const oldPrice =
              typeof p.original_price === "number"
                ? p.original_price
                : typeof p?.gia?.before_discount === "number"
                ? p.gia!.before_discount!
                : sellingFromVariant !== undefined
                ? baseGia.gia
                : undefined;

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
