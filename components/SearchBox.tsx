"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Keyword = { id: number; dulieu: string; soluot: number };

type Product = {
  id: number;
  ten: string;
  slug: string;
  hinh_anh: string;
  gia_goc: number;
  gia_ban: number;
};
type CategoryProduct = {
  id: number;
  ten?: string;
  slug?: string;
  hinh_anh?: string;
  thuonghieu?: string;
  category_name?: string;
  gia?: {
    current?: number;
    before_discount?: number;
  };
};

type TopCategory = {
  ten: string;
  sanpham?: CategoryProduct[];
};

type SearchBoxProps = {
  placeholder?: string;
};

export default function SearchBox({ placeholder = "Thuốc giảm cân dành cho người béo..." }: SearchBoxProps) {
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<Keyword[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const router = useRouter();

  // Helper format giá
  const formatPrice = (p: number) => p?.toLocaleString("vi-VN") || "0";

  // Helper tạo URL ảnh
  const getImageUrl = (img: string) => {
    if (!img) return "https://placehold.co/50x50?text=No+Image";
    if (img.startsWith("http")) return img;
    return `${API}/images/sanpham/${img}`;
  };

  // Debounce fetch gợi ý
  React.useEffect(() => {
    const ctrl = new AbortController();
    if (!q.trim()) {
      setItems([]);
      setProducts([]);
      setOpen(false);
      return;
    }
    setLoading(true);

    const t = setTimeout(() => {
      // 1. Fetch từ khóa
      const fetchKeywords = fetch(`${API}/api/tukhoas?per_page=5&q=${encodeURIComponent(q.trim())}`, {
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      }).then((r) => r.json());

      // 2. Fetch sản phẩm gợi ý từ API Trang chủ (Public)
      // Do API /api/sanphams yêu cầu token, ta dùng /api/trang-chu rồi lọc client-side
      const fetchProducts = fetch(`${API}/api/trang-chu`, {
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      })
        .then((r) => r.json())
        .then((res) => {
          const data = res?.data || {};

          // 1. Lấy sản phẩm từ các danh mục (gắn thêm tên danh mục để tìm kiếm)
          const prodsFromCats = (data.top_categories || []).flatMap((c: TopCategory) =>
            (c.sanpham || []).map((p: CategoryProduct) => ({ ...p, category_name: c.ten }))
          );

          // 2. Lấy sản phẩm từ các mục nổi bật khác
          const otherProds = [
            ...(data.hot_sales || []),
            ...(data.best_products || []),
            ...(data.new_launch || []),
            ...(data.most_watched || []),
          ];

          // 3. Gộp lại (ưu tiên prodsFromCats đứng trước để Map lấy sản phẩm có category_name)
          const allProds = [...prodsFromCats, ...otherProds];

          // 4. Loại bỏ trùng lặp theo ID
          const uniqueProds = Array.from(new Map(allProds.map(p => [p.id, p])).values());

          // 5. Lọc thông minh (Tên SP || Danh mục || Thương hiệu)
          const lowerQ = q.trim().toLowerCase();
          return uniqueProds.filter((p) => {
            const matchName = p.ten?.toLowerCase().includes(lowerQ);
            const matchCat = p.category_name?.toLowerCase().includes(lowerQ);
            const matchBrand = p.thuonghieu?.toLowerCase().includes(lowerQ);

            return matchName || matchCat || matchBrand;
          }).map((p) => ({
            id: p.id,
            ten: p.ten,
            slug: p.slug,
            hinh_anh: p.hinh_anh,
            gia_goc: p.gia?.before_discount || p.gia?.current || 0,
            gia_ban: p.gia?.current || 0
          }));
        });

      Promise.all([fetchKeywords, fetchProducts])
        .then(([resKw, prodList]) => {
          setItems(Array.isArray(resKw?.data) ? resKw.data : []);
          setProducts(prodList.slice(0, 5));
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q, API]);

  const goResult = (kw: string) => {
    router.push(`/shop?query=${encodeURIComponent(kw)}`);
    setOpen(false);
  };

  const goProduct = (slug: string) => {
    router.push(`/product/${slug}`);
    setOpen(false);
  };

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const kw = q.trim();
    if (!kw) return;

    const existed = items.find((x) => x.dulieu.toLowerCase() === kw.toLowerCase());
    try {
      if (existed) {
        await fetch(`${API}/api/tukhoas/${existed.id}`, { method: "PUT" });
      } else {
        await fetch(`${API}/api/tukhoas`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ dulieu: kw, soluot: 1 }),
        });
      }
    } catch { }
    setOpen(false);
    goResult(kw);
  };

  return (
    <div className="position-relative w-100">
      <form onSubmit={onSubmit} className="position-relative w-100">
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => q && setOpen(true)}
          className="py-10 text-sm shadow-none form-control fw-normal placeholder-italic bg-neutral-30 placeholder-fw-normal placeholder-light ps-30 pe-60"
          placeholder={placeholder}
          aria-label="Tìm kiếm sản phẩm"
        />
        <button type="submit"
          className="text-xl position-absolute top-50 translate-middle-y text-main-600 end-0 me-36 line-height-1"
          aria-label="Tìm">
          <i className="ph-bold ph-magnifying-glass"></i>
        </button>
      </form>

      {/* Dropdown gợi ý */}
      {open && (q || loading) && (
        <div
          className="mt-2 overflow-hidden bg-white border border-gray-100 shadow-lg position-absolute w-100 rounded-8"
          style={{ zIndex: 50, maxHeight: "80vh", overflowY: "auto" }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {loading && <div className="px-16 py-10 text-sm text-gray-600">Đang tìm kiếm...</div>}

          {!loading && items.length === 0 && products.length === 0 && (
            <div className="px-16 py-10 text-sm text-gray-600">Không có kết quả phù hợp.</div>
          )}

          {/* Phần 1: Sản phẩm gợi ý */}
          {!loading && products.length > 0 && (
            <div className="border-gray-100 border-bottom">
              <div className="px-16 py-8 text-xs text-gray-500 bg-neutral-50 fw-semibold text-uppercase">
                Sản phẩm gợi ý
              </div>
              {products.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="gap-12 px-16 py-8 transition-all cursor-pointer hover-bg-neutral-50 d-flex align-items-center"
                  onClick={() => goProduct(p.slug)}
                >
                  <div className="flex-shrink-0 overflow-hidden border rounded-4" style={{ width: 40, height: 40 }}>
                    <Image
                      src={getImageUrl(p.hinh_anh)}
                      alt={p.ten}
                      width={40}
                      height={40}
                      className="w-100 h-100 object-fit-cover"
                    />
                  </div>
                  <div className="overflow-hidden flex-grow-1">
                    <div className="text-sm text-heading fw-medium text-truncate" title={p.ten}>{p.ten}</div>
                    <div className="gap-8 d-flex align-items-center">
                      <span className="text-xs text-main-600 fw-semibold">{formatPrice(p.gia_ban)}đ</span>
                      {p.gia_goc > p.gia_ban && (
                        <span className="text-xs text-gray-400 text-decoration-line-through">{formatPrice(p.gia_goc)}đ</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Phần 2: Từ khóa phổ biến - ĐÃ XÓA THEO YÊU CẦU */}
        </div>
      )}
    </div>
  );
}
