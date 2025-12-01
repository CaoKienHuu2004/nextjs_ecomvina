"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* =======================
   Types theo API (không any)
======================= */
type Review = { id: number; diem: number };
type Variant = { id: number; gia: string; giagiam: string; soluong?: number };
type ProductImage = { media: string };
type Brand = { id: number; ten: string };

export type ApiProduct = {
  id: number;
  ten: string;
  slug?: string | null;
  mediaurl?: string | null;
  image_url?: string | null;
  luotxem?: number;
  thuonghieu?: Brand;
  bienthes?: Variant[];
  anhsanphams?: ProductImage[];
  danhgias?: Review[];
  // fields đã chuẩn hoá (nếu có)
  original_price?: number | string | null;
  discount_amount?: number | string | null;
  selling_price?: number | null;
  discount_type?: "Miễn phí" | "Giảm tiền" | "Sold" | null | string;
  is_free?: boolean;
  is_sold?: boolean;
  rating_average?: number;
  rating_count?: number;
  seller_name?: string;
};
export type ApiCategory = {
  id: number;
  ten: string;
  slug: string;
  total_sold: number;
  sanphams: ApiProduct[];
};
type ApiResponseTopCategories = { status: boolean; data: { original: ApiCategory[] } };

type UIProduct = {
  id: number;
  name: string;
  href: string;
  image: string;
  originalPrice: number;
  sellingPrice: number;
  isDiscounted: boolean;
  discountPercent: number;
  isFree: boolean;
  isSold: boolean;
  ratingAverage: number;
  ratingCount: number;
  sellerName?: string;
};

/* =======================
   Helpers mapping
======================= */
const asNumber = (v: unknown, fallback = 0): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
};

const slugify = (s: string, fallback: string): string =>
  (s || fallback)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || fallback;

const pickImage = (p: ApiProduct): string => {
  const raw = p.image_url || p.mediaurl || p.anhsanphams?.[0]?.media || "/assets/images/thumbs/product-two-img1.png";
  if (typeof raw !== "string") return "/assets/images/thumbs/product-two-img1.png";
  if (/^https?:\/\//.test(raw) || raw.startsWith('/')) return raw;
  // Nếu là tên file trần (vd: "yensaonest100_70ml_2.jpg") thì thêm leading '/'
  return `/${raw}`;
};

const computePrices = (p: ApiProduct): { original: number; selling: number; isDiscounted: boolean; percent: number } => {
  let original = asNumber(p.original_price, NaN);
  let selling = asNumber(p.selling_price, NaN);

  if (!Number.isFinite(original) || !Number.isFinite(selling)) {
    const v = p.bienthes?.[0];
    const gia = asNumber(v?.gia, 0);
    const giagiam = asNumber(v?.giagiam, 0);
    if (giagiam > 0 && giagiam < gia) {
      original = gia;
      selling = giagiam;
    } else {
      original = gia;
      selling = Math.max(gia - giagiam, 0);
    }
  }
  const isDiscounted = original > 0 && selling < original;
  const percent = isDiscounted ? Math.round(((original - selling) / original) * 100) : 0;
  return { original, selling, isDiscounted, percent };
};

const computeRating = (p: ApiProduct): { avg: number; count: number } => {
  const avgApi = asNumber(p.rating_average, NaN);
  const countApi = asNumber(p.rating_count, NaN);
  if (Number.isFinite(avgApi) && Number.isFinite(countApi)) return { avg: avgApi, count: countApi };
  const arr = p.danhgias ?? [];
  if (!arr.length) return { avg: 0, count: 0 };
  const sum = arr.reduce((s, r) => s + asNumber(r.diem, 0), 0);
  const avg = Math.round((sum / arr.length) * 10) / 10;
  return { avg, count: arr.length };
};

const toUI = (p: ApiProduct): UIProduct => {
  const { original, selling, isDiscounted, percent } = computePrices(p);
  const { avg, count } = computeRating(p);
  const slug = p.slug ? String(p.slug) : slugify(p.ten, `sp-${p.id}`);
  return {
    id: p.id,
    name: p.ten,
    href: `/products/${slug}-${p.id}`,
    image: pickImage(p),
    originalPrice: original,
    sellingPrice: selling,
    isDiscounted,
    discountPercent: percent,
    isFree: selling === 0 || p.is_free === true,
    isSold: Boolean(p.is_sold) || (p.bienthes?.[0]?.soluong ?? 1) <= 0,
    ratingAverage: avg,
    ratingCount: count,
    sellerName: p.seller_name ?? p.thuonghieu?.ten,
  };
};

/* =======================
   Component
======================= */
export default function TrendingProductsTabs() {
  const [tabs, setTabs] = useState<{ key: string; label: string }[]>([{ key: "all", label: "All" }]);
  const [byTab, setByTab] = useState<Record<string, UIProduct[]>>({ all: [] });
  const [active, setActive] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;
    const API = process.env.NEXT_PUBLIC_SERVER_API || "http://148.230.100.215";
    fetch(`${API}/api/sanphams-selection?selection=top_categories&per_page=6`)
      .then((r) => r.json() as Promise<ApiResponseTopCategories>)
      .then((res) => {
        if (!alive) return;
        const cats = res?.data?.original ?? [];

        const nextTabs: { key: string; label: string }[] = [
          { key: "all", label: "All" },
          ...cats.map((c) => ({ key: c.slug, label: c.ten })),
        ];

        const map: Record<string, UIProduct[]> = { all: [] };
        cats.forEach((c) => {
          const list = (c.sanphams || []).map(toUI);
          map[c.slug] = list;
          map.all = map.all.concat(list);
        });

        setTabs(nextTabs);
        setByTab(map);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Sản phẩm của tab hiện tại
  const viewAllHref =
    active === "all"
      ? "/products?sort=trending"
      : `/products?category=${encodeURIComponent(active)}&sort=trending`;

  // Giới hạn hiển thị (giống bố cục bên trái: 6/12 card)
  const visibleTabs = tabs.slice(0, 5);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(price);

  if (loading) {
    return (
      <section className="trending-productss overflow-hidden mt-10 fix-scale-80">
        <div className="container container-lg px-0">
          <div className="border border-gray-100 p-24 rounded-8">
            <div className="section-heading mb-24">
              <div className="flex-between flex-align flex-wrap gap-8">
                <h6 className="mb-0 wow fadeInLeft" style={{ visibility: "visible", animationName: "fadeInLeft" }}>
                  <i className="ph-bold ph-squares-four text-main-600" /> Danh mục hàng đầu
                </h6>
              </div>
            </div>
            <div className="py-16 text-center text-gray-500">Đang tải danh mục…</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="trending-productss overflow-hidden mt-10 fix-scale-80">
      <div className="container container-lg px-0">
        <div className="border border-gray-100 p-24 rounded-8">
          <div className="section-heading mb-24">
            <div className="flex-between flex-align flex-wrap gap-8">
              <h6 className="mb-0 wow fadeInLeft" style={{ visibility: "visible", animationName: "fadeInLeft" }}>
                <i className="ph-bold ph-squares-four text-main-600" /> Danh mục hàng đầu
              </h6>
              <ul className="nav common-tab style-two nav-pills wow fadeInRight m-0" role="tablist">
                {visibleTabs.map((tab) => (
                  <li className="nav-item" role="presentation" key={tab.key}>
                    <button
                      className={`nav-link fw-medium text-sm hover-border-main-600 ${active === tab.key ? "active" : ""}`}
                      type="button"
                      role="tab"
                      onClick={() => setActive(tab.key)}
                    >
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="tab-content" id="pills-tabContent">
            {visibleTabs.map((tab) => (
              <div
                key={tab.key}
                className={`tab-pane fade ${active === tab.key ? "show active" : ""}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab.key}`}
                tabIndex={0}
              >
                <div className="row g-12">
                  {(byTab[tab.key] || []).slice(0, 12).map((product) => (
                    <div className="col-xxl-2 col-xl-3 col-lg-4 col-xs-6" key={product.id}>
                      <div className="product-card h-100 border border-gray-100 hover-border-main-600 rounded-6 position-relative transition-2">
                        <Link href={product.href} className="flex-center rounded-8 bg-gray-50 position-relative" style={{ height: "210px" }}>
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={240}
                            height={240}
                            className="w-100 rounded-top-2"
                            style={{ color: "transparent", objectFit: "cover", width: "100%", height: "100%" }}
                            unoptimized={/^https?:\/\//.test(product.image)}
                          />
                        </Link>

                        <div className="product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex mt-10 px-10 pb-8">
                          <div>
                            <h6 className="title text-lg fw-semibold mt-2 mb-2">
                              <Link href={product.href} className="link text-line-2">
                                {product.name}
                              </Link>
                            </h6>
                            <div className="flex-align justify-content-between mt-2">
                              <div className="flex-align gap-6">
                                <span className="text-xs fw-medium text-gray-500">Đánh giá</span>
                                <span className="text-xs fw-medium text-gray-500">
                                  {product.ratingAverage.toFixed(1)} <i className="ph-fill ph-star text-warning-600"></i>
                                </span>
                              </div>
                              <div className="flex-align gap-4">
                                <span className="text-xs fw-medium text-gray-500">
                                  {product.ratingCount >= 1000
                                    ? `${Math.round(product.ratingCount / 100) / 10}k`
                                    : product.ratingCount}
                                </span>
                                <span className="text-xs fw-medium text-gray-500">Đã bán</span>
                              </div>
                            </div>
                          </div>
                          <div className="product-card__price mt-5">
                            {product.discountPercent > 0 && (
                              <div className="flex-align gap-4 text-main-two-600">
                                <i className="ph-fill ph-seal-percent text-sm"></i> -{product.discountPercent}%
                                <span className="text-gray-400 text-sm fw-semibold text-decoration-line-through">
                                  {formatPrice(product.originalPrice)}
                                </span>
                              </div>
                            )}
                            <span className="text-heading text-lg fw-semibold">
                              {formatPrice(product.sellingPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mx-auto w-100 text-center">
                  <Link href={viewAllHref} className="btn border-main-600 text-main-600 hover-bg-main-600 hover-border-main-600 hover-text-white rounded-8 px-32 py-12 mt-40">
                    Xem thêm sản phẩm
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
