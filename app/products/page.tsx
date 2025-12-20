"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import ProductCardV2 from "@/components/ProductCardV2";

/** * Kiểu dữ liệu khớp với JSON API trả về 
 * Dựa trên: { id, ten, slug, hinh_anh, gia: { current, before_discount }, id_chuongtrinh... }
 */
type ProductListItem = {
  id: number | string;
  slug?: string;
  ten?: string;
  hinh_anh?: string; // API trả về key này

  // Các trường giá từ JSON
  gia?: {
    current?: number;
    before_discount?: number;
    discount_percent?: number;
  };

  // Các trường hỗ trợ hiển thị/logic
  selling_price?: number; // Fallback cũ
  original_price?: number; // Fallback cũ
  is_free?: boolean;
  id_chuongtrinh?: number; // Quan trọng cho logic quà tặng/khuyến mãi

  loaibienthe?: string;
  thuonghieu?: string;
};

export default function ProductsPage() {
  const sp = useSearchParams();
  const source = (sp.get("source") || "hot_sales").toLowerCase();
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";

  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<ProductListItem[]>([]);

  React.useEffect(() => {
    let alive = true;

    // Xây dựng URL API
    // const url = `${API}/api/sanphams-all?per_page=${perPage}`;
    const url = `${API}/api/sanphams-all`;
    // Nếu cần filter theo source:
    // const url = `${API}/api/sanphams-all?selection=${encodeURIComponent(source)}&per_page=${perPage}`;

    setLoading(true);
    fetch(url, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((res: { status?: boolean; data?: unknown }) => {
        if (!alive) return;

        // Kiểm tra kỹ cấu trúc trả về
        if (res?.status && Array.isArray(res.data)) {
          setItems(res.data as ProductListItem[]);
        } else if (Array.isArray(res)) {
          // Trường hợp API trả về mảng trực tiếp không bọc trong data
          setItems(res as ProductListItem[]);
        } else {
          setItems([]);
        }
      })
      .catch((err) => {
        console.error("Lỗi tải sản phẩm:", err);
        if (alive) setItems([]);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [API, source]);

  const heading = source === "hot_sales" ? "Top deal • Siêu rẻ" : "Danh sách sản phẩm";

  /** * Mapper: Chuyển dữ liệu API thô -> Props chuẩn cho ProductCardV2 
   */
  const toCardProps = (p: ProductListItem) => {
    // 1. Xử lý Link
    const href = `/products/${String(p.slug ?? p.id ?? "")}`;

    // 2. Xử lý Ảnh (Ưu tiên hinh_anh từ API)
    const img = (typeof p.hinh_anh === "string" && p.hinh_anh.trim())
      ? p.hinh_anh
      : "/assets/images/thumbs/product-two-img1.png";

    // 3. Xử lý Tiêu đề
    const title = p.ten ?? "Sản phẩm";

    // 4. Xử lý Giá (Ưu tiên lấy từ object `gia` theo cấu trúc JSON mới)
    const price = typeof p.gia?.current === "number"
      ? p.gia.current
      : (p.selling_price ?? 0);

    const oldPrice = typeof p.gia?.before_discount === "number"
      ? p.gia.before_discount
      : p.original_price;

    // 5. Logic Variant & Chương trình
    const idNum = Number(p.id);
    const variantId = Number.isFinite(idNum) ? idNum : undefined; // Dùng ID sản phẩm làm fallback cho variantId

    // 6. Logic Badge Miễn phí
    const isFree = Boolean(p.is_free) || price === 0;
    const badge = isFree
      ? ({ text: "Miễn phí", color: "primary" } as const)
      : undefined;

    return {
      href,
      img, // Đã map từ hinh_anh -> img (mediaurl)
      title,
      price,
      oldPrice,
      variantId,
      badge,
      loaibienthe: p.loaibienthe || "",
      thuonghieu: p.thuonghieu || "",
      slug: String(p.slug || ""),
      id_chuongtrinh: p.id_chuongtrinh, // Truyền thêm ID chương trình nếu ProductCardV2 hỗ trợ
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
          <div className="p-16 text-center border rounded-12 text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center border rounded-12 text-gray-500">
            Không có sản phẩm nào.
          </div>
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
                    // Nếu ProductCardV2 của bạn hỗ trợ id_chuongtrinh để add to cart
                    id_chuongtrinh={card.id_chuongtrinh}
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