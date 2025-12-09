"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import ProductCardV2 from "@/components/ProductCardV2";

/** Kiểu dữ liệu tối thiểu cho item trả về từ API (đủ dùng để render) */
type ProductListItem = {
  id: number | string;
  slug?: string;
  ten?: string;
  mediaurl?: string;
  selling_price?: number;
  original_price?: number;
  is_free?: boolean;
  gia?: { current?: number; before_discount?: number };
  loaibienthe?: string;
  thuonghieu?: string;
};

export default function ProductsPage() {
  const sp = useSearchParams();
  const source = (sp.get("source") || "hot_sales").toLowerCase();
  const perPage = Number(sp.get("per_page") || 20);
  const API = process.env.NEXT_PUBLIC_SERVER_API || "http://148.230.100.215";

  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<ProductListItem[]>([]);

  React.useEffect(() => {
    let alive = true;
    const selection = source === "hot_sales" ? "hot_sales" : source;
    const url = `${API}/api/sanphams-selection?selection=${encodeURIComponent(
      selection
    )}&per_page=${perPage}`;

    setLoading(true);
    fetch(url, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((res: { status?: boolean; data?: unknown }) => {
        if (!alive) return;
        if (res?.status && Array.isArray(res.data)) {
          setItems(res.data as ProductListItem[]);
        } else {
          setItems([]);
        }
      })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [API, source, perPage]);

  const heading =
    source === "hot_sales" ? "Top deal • Siêu rẻ" : "Danh sách sản phẩm";

  /** Chuẩn hoá 1 item → props của ProductCardV2 (tránh undefined/type lỗi) */
  const toCardProps = (p: ProductListItem) => {
    const href = `/products/${String(p.slug ?? p.id ?? "")}`;
    const img =
      (typeof p.mediaurl === "string" && p.mediaurl.trim()) ||
      "/assets/images/thumbs/product-two-img1.png";
    const title = p.ten ?? "Sản phẩm";
    const price =
      typeof p.selling_price === "number"
        ? p.selling_price
        : typeof p.gia?.current === "number"
          ? p.gia.current!
          : 0;
    const oldPrice =
      typeof p.original_price === "number"
        ? p.original_price
        : typeof p.gia?.before_discount === "number"
          ? p.gia.before_discount!
          : undefined;

    const idNum = Number(p.id);
    const variantId = Number.isFinite(idNum) ? idNum : undefined;

    const isFree =
      Boolean(p.is_free) ||
      price === 0 ||
      (typeof p.gia?.current === "number" && p.gia.current === 0);

    const badge = isFree
      ? ({ text: "Miễn phí", color: "primary" } as const)
      : undefined;

    return {
      href,
      img,
      title,
      price,
      oldPrice,
      variantId,
      badge,
      loaibienthe: p.loaibienthe || "",
      thuonghieu: p.thuonghieu || "",
      slug: String(p.slug || ""),
    };
  };

  return (
    <section className="py-32">
      <div className="container container-lg">
        <div className="flex-wrap gap-12 mb-16 flex-between">
          <h5 className="mb-0">{heading}</h5>
          <div className="text-sm text-gray-600">{items.length} sản phẩm</div>
        </div>

        {loading ? (
          <div className="p-16 border rounded-12">Đang tải…</div>
        ) : items.length === 0 ? (
          <div className="p-16 border rounded-12">Không có sản phẩm.</div>
        ) : (
          <div className="row g-12">
            {items.map((p) => {
              const card = toCardProps(p);
              return (
                <div
                  className="col-xxl-3 col-xl-4 col-lg-4 col-sm-6"
                  key={String(p.id)}
                >
                  <ProductCardV2
                    href={card.href}
                    img={card.img}
                    title={card.title}
                    price={card.price}
                    oldPrice={card.oldPrice}
                    variantId={card.variantId}
                    badge={card.badge}
                    loaibienthe={card.loaibienthe}
                    thuonghieu={card.thuonghieu}
                    slug={card.slug}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
