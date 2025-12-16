"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import FullHeader from "@/components/FullHeader";
import { productDetailUrl } from "@/utils/paths";

type PriceRange = { label: string; min: number; max: number };
type Sidebar = {
  categories: { id: number; ten: string; slug?: string; sanpham_count?: number | null }[];
  brands: { id: number; ten: string }[];
  colors: { id: number; ten: string }[];
  filters: { price: PriceRange[] };
};

type ProductCard = {
  id: number;
  ten: string;
  slug: string;
  mediaurl?: string | null;
  rating?: { average: number; count: number };
  gia: { current: number; before_discount: number | null; discount_percent: number };
  trangthai?: { active?: string; in_stock?: boolean };
};

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SERVER_API || "http://localhost:3001";

function numberWithDots(n: number) {
  try { return new Intl.NumberFormat("vi-VN").format(n); } catch { return String(n); }
}

function asNumber(v: string | null) { return v ? Number(v) : NaN; }

export default function Page() {
  const router = useRouter();
  const qs = useSearchParams();

  // ---- state ----
  const [sidebar, setSidebar] = React.useState<Sidebar | null>(null);
  const [items, setItems] = React.useState<ProductCard[]>([]);
  const [total, setTotal] = React.useState(0);

  const page = Number(qs.get("page") || 1);
  const perPage = Number(qs.get("per_page") || 24);
  const category = qs.get("category") || ""; // "1,2"
  const q = qs.get("q") || "";
  const sort = qs.get("sort") || "recent";
  const priceMin = qs.get("price_min") || "";
  const priceMax = qs.get("price_max") || "";

  // ---- fetch sidebar once ----
  React.useEffect(() => {
    fetch(`${API}/api/shop/sidebar`, { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        const data = (res?.data ?? res) as Sidebar;
        setSidebar(data);
      })
      .catch(() => setSidebar({ categories: [], brands: [], colors: [], filters: { price: [] } }));
  }, []);

  // ---- fetch products when query changes ----
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (priceMin) params.set("price_min", priceMin);
    if (priceMax) params.set("price_max", priceMax);
    if (sort) params.set("sort", sort);
    params.set("page", String(page));
    params.set("per_page", String(perPage));

    fetch(`${API}/api/shop/products?` + params.toString(), { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        setItems(res?.data || []);
        setTotal(res?.meta?.total || 0);
      });
  }, [q, category, priceMin, priceMax, sort, page, perPage]);

  // ---- helpers to push query ----
  const push = (patch: Record<string, string | number | null | undefined>) => {
    const next = new URLSearchParams(qs.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "" || v === "all") next.delete(k);
      else next.set(k, String(v));
    });
    // reset page khi đổi filter
    if (patch.category || patch.price_min || patch.price_max || patch.sort || patch.q) {
      next.set("page", "1");
    }
    router.push(`/san-pham?${next.toString()}`);
  };

  const toggleCategory = (id: number) => {
    const ids = (category ? category.split(",").map((x) => +x) : []);
    const idx = ids.indexOf(id);
    if (idx === -1) ids.push(id); else ids.splice(idx, 1);
    push({ category: ids.length ? ids.join(",") : null });
  };

  // ---- UI ----
  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      <section className="py-32">
        <div className="container container-lg">
          {/* TOP BAR */}
          <div className="flex-wrap gap-16 mb-24 d-flex justify-content-between align-items-center">
            <form
              className="input-group max-w-418"
              onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); push({ q: String(fd.get("q") || "") }); }}
            >
              <input name="q" defaultValue={q} type="text" className="form-control common-input rounded-start-3" placeholder="Tìm sản phẩm..." />
              <button type="submit" className="px-24 text-2xl text-white border-0 input-group-text bg-main-two-600 rounded-end-3 hover-bg-main-two-700" aria-label="Tìm kiếm">
                <i className="ph ph-magnifying-glass"></i>
              </button>
            </form>

            <div className="flex-wrap gap-12 d-flex align-items-center">
              <div className="text-gray-600 text-md"><span className="text-neutral-900 fw-semibold">{total}</span> sản phẩm</div>
              <select
                className="w-auto form-select"
                value={sort}
                onChange={(e) => push({ sort: e.target.value })}
                aria-label="Sắp xếp sản phẩm"
              >
                <option value="recent">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
                <option value="rating">Đánh giá cao</option>
                <option value="sold">Bán chạy</option>
              </select>
            </div>
          </div>

          <div className="row">
            {/* SIDEBAR */}
            <div className="mb-24 col-xl-3 col-lg-4">
              <div className="p-16 bg-white border rounded-12">
                <h6 className="mb-12">Danh mục</h6>
                <div className="gap-8 d-flex flex-column">
                  {sidebar?.categories?.map((c) => {
                    const active = (category || "").split(",").map((x) => +x).includes(c.id);
                    return (
                      <label key={c.id} className="gap-8 d-flex align-items-center">
                        <input type="checkbox" checked={active} onChange={() => toggleCategory(c.id)} />
                        <span>{c.ten}</span>
                        {c.sanpham_count != null ? <span className="text-gray-600 ms-auto">{c.sanpham_count}</span> : null}
                      </label>
                    );
                  })}
                </div>

                <hr className="my-16" />

                <h6 className="mb-12">Khoảng giá</h6>
                <div className="gap-8 d-flex flex-column">
                  {sidebar?.filters?.price?.map((p) => {
                    const selected = (asNumber(priceMin) === p.min) && (asNumber(priceMax) === p.max);
                    return (
                      <label key={p.label} className="gap-8 d-flex align-items-center">
                        <input
                          type="radio"
                          name="pr"
                          checked={selected}
                          onChange={() => push({ price_min: p.min, price_max: p.max })}
                        />
                        <span>{p.label}</span>
                      </label>
                    );
                  })}
                  {/* Clear price */}
                  <button className="mt-6 btn btn-sm btn-light" onClick={() => push({ price_min: null, price_max: null })}>Xóa lọc giá</button>
                </div>
              </div>
            </div>

            {/* GRID */}
            <div className="col-xl-9 col-lg-8">
              {items.length === 0 ? (
                <div className="p-24 bg-white border rounded-12">Không có sản phẩm phù hợp.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 24 }}>
                  {items.map((p) => (
                    <div key={p.id} className="overflow-hidden bg-white border rounded-12 hover-border-main-two-600 transition-2">
                      <div className="position-relative" style={{ height: 200 }}>
                        {p.mediaurl ? (
                          <Image
                            src={p.mediaurl}
                            alt={p.ten}
                            fill
                            sizes="(max-width: 1200px) 33vw, 300px"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className="bg-gray-100 w-100 h-100" />
                        )}
                      </div>

                      <div className="p-16">
                        <div className="mb-8 text-md fw-semibold line-clamp-2">{p.ten}</div>

                        <div className="gap-8 mb-8 d-flex align-items-center">
                          <div className="d-flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`text-xs d-flex ${i < Math.round(p.rating?.average || 0) ? 'text-warning-600' : 'text-gray-300'}`}>
                                <i className="ph-fill ph-star" />
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-600">({p.rating?.count || 0})</span>
                        </div>

                        <div className="gap-8 d-flex align-items-baseline">
                          <div className="text-main-two-600 fw-semibold">{numberWithDots(p.gia.current)}₫</div>
                          {p.gia.before_discount ? (
                            <del className="text-sm text-gray-600">{numberWithDots(p.gia.before_discount)}₫</del>
                          ) : null}
                          {p.gia.discount_percent ? (
                            <span className="badge bg-danger-subtle text-danger ms-auto">-{p.gia.discount_percent}%</span>
                          ) : null}
                        </div>

                        <div className="gap-8 mt-12 d-flex">
                          <Link
                            href={productDetailUrl({ slug: p.slug, id: p.id })}
                            className="text-white btn btn-sm bg-neutral-600 hover-bg-neutral-700 w-100"
                          >
                            Xem chi tiết
                          </Link>

                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              // fallback add-to-cart client action — bạn có thể thay bằng hàm dispatch/gio-hang action
                              fetch(`/api/cart/add`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ product_id: p.id, qty: 1 }),
                              }).catch(() => { });
                            }}
                          >
                            Thêm vào giỏ
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="mt-24 d-flex justify-content-center">
                <nav>
                  <ul className="gap-8 pagination">
                    <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => push({ page: Math.max(1, page - 1) })} aria-label="Trang trước"><i className="ph ph-caret-left" /></button>
                    </li>
                    <li className="page-item"><span className="page-link">{page}</span></li>
                    <li className={`page-item ${items.length < perPage ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => push({ page: page + 1 })} aria-label="Trang sau"><i className="ph ph-caret-right" /></button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
