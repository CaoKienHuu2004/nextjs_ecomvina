"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import ProductMiniCard from "@/components/ProductMiniCard";

type RecommendProduct = {
  id: number;
  ten: string;
  slug?: string;
  mediaurl?: string | null;
  gia?: {
    current: number;
    before_discount: number | null;
    discount_percent: number;
  } | null;
};

export default function RecommendedSection({ title = "Có thể bạn quan tâm", perPage = 8 }: { title?: string; perPage?: number }) {
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.cloud";
  const url = `${API}/api/sanphams-selection?selection=recommend&per_page=${perPage}`;
  const [items, setItems] = React.useState<RecommendProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const prevRef = React.useRef<HTMLButtonElement | null>(null);
  const nextRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    let alive = true;
    fetch(url, { headers: { Accept: "application/json" } })
      .then(r => r.json())
      .then((res) => {
        if (!alive) return;
        if (res?.status && Array.isArray(res.data)) setItems(res.data);
        else setItems([]);
      })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [url]);

  return (
    <section className="pt-32 overflow-hidden">
      <div className="container container-lg">
        <div className="mb-12 section-heading">
          <div className="flex-wrap gap-8 flex-between align-items-center">
            <h6 className="mb-0 fw-semibold text-uppercase">
              <i className="ph-bold ph-sparkle me-6" /> {title.toUpperCase()}
            </h6>
            <div className="gap-8 flex-align ms-8">
              <button type="button" ref={prevRef} className="w-32 h-32 bg-transparent rounded-circle flex-center" style={{ border: "1px solid rgba(0,0,0,.2)" }}>
                <i className="ph ph-caret-left"></i>
              </button>
              <button type="button" ref={nextRef} className="w-32 h-32 bg-transparent rounded-circle flex-center" style={{ border: "1px solid rgba(0,0,0,.2)" }}>
                <i className="ph ph-caret-right"></i>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12">Đang tải…</div>
        ) : items.length === 0 ? (
          <div className="p-12">Không có sản phẩm.</div>
        ) : (
          <Swiper
            modules={[Navigation]}
            speed={500}
            loop={false}
            spaceBetween={16}
            navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
            onBeforeInit={(swiper) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (swiper.params.navigation as any).prevEl = prevRef.current;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (swiper.params.navigation as any).nextEl = nextRef.current;
            }}
            breakpoints={{
              0: { slidesPerView: 2 },
              640: { slidesPerView: 3 },
              992: { slidesPerView: 5 },
              1200: { slidesPerView: 6 },
            }}
          >
            {items.map((p) => (
              <SwiperSlide key={p.id} className="px-6">
                <ProductMiniCard
                  href={`/products/${p.slug || p.id}`}
                  img={p.mediaurl || "/assets/images/thumbs/product-two-img1.png"}
                  title={p.ten}
                  price={p.gia?.current ?? null}
                  priceBefore={p.gia?.before_discount ?? null}
                  variantId={p.id}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
}
