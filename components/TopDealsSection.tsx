"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { type HomeHotSaleProduct } from "@/lib/api";
import { useHomeData } from "@/hooks/useHomeData";

type ProductHotDeal = {
  id: number | string;
  slug?: string | null;
  ten?: string | null;
  mediaurl?: string | null;
  hinh_anh?: string | null;
  selling_price?: number | null;
  original_price?: number | null;
  shop_name?: string | null;
  thuonghieu?: string | null;
  rating?: number | null;
  sold?: number | null;
  discount_percent?: number | null;
  gia?: {
    current: number;
    before_discount: number;
    discount_percent: number;
  };
  sold_count?: string;
};

const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";

export default function TopDealsSection({
  title = "Vũ trụ quà tặng",
  perPage = 10,
}: {
  title?: string;
  perPage?: number;
}) {
  const { data: homeData, loading: homeLoading } = useHomeData();
  const [items, setItems] = React.useState<ProductHotDeal[]>([]);
  const loading = homeLoading;
  const prevRef = React.useRef<HTMLButtonElement | null>(null);
  const nextRef = React.useRef<HTMLButtonElement | null>(null);

  // track/slide layout (transform-based carousel)
  const HEADER_LEFT = 18;
  const HEADER_WIDTH = 334; // header image size you confirmed
  const HEADER_SPACING = 35;
  const HEADER_MARGIN_LEFT = HEADER_LEFT + HEADER_WIDTH + HEADER_SPACING; // space between header and slides
  const PRODUCT_TOP_OFFSET = 35; //khoảng cách từ header đến sản phẩm
  const SLIDE_WIDTH = 236; // px per card (matches screenshot inspector)
  const SLIDE_GAP = 16;
  const VISIBLE_COUNT = 5; // hiển thị 5 sản phẩm cùng lúc, dịch từng 1 sản phẩm
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const [activeSlide, setActiveSlide] = React.useState<number>(0);
  const [direction, setDirection] = React.useState<"next" | "prev">("next");
  const autoplayRef = React.useRef<number | null>(null);
  const [isHover, setIsHover] = React.useState(false);

  React.useEffect(() => {
    console.log('🔥 TopDealsSection - homeData:', homeData);
    if (!homeData) {
      console.log('⚠️ TopDealsSection - homeData is null/undefined');
      return;
    }

    try {
      console.log('📦 TopDealsSection - homeData.data:', homeData.data);
      console.log('📦 TopDealsSection - hot_sales array:', homeData.data?.hot_sales);
      console.log('📦 TopDealsSection - hot_sales length:', homeData.data?.hot_sales?.length || 0);

      // Lấy hot_sales từ homeData context và sắp xếp theo lượt bán giảm dần
      const hotSales = (homeData.data?.hot_sales || []).slice().sort((a, b) => {
        const soldA = parseInt(a.sold_count || "0");
        const soldB = parseInt(b.sold_count || "0");
        return soldB - soldA;
      });

      // Convert sang format của component
      const converted: ProductHotDeal[] = hotSales.slice(0, perPage).map((item: HomeHotSaleProduct) => ({
        id: item.id,
        slug: item.slug,
        ten: item.ten,
        mediaurl: item.hinh_anh,
        hinh_anh: item.hinh_anh,
        selling_price: item.gia.current,
        original_price: item.gia.before_discount,
        shop_name: item.thuonghieu,
        thuonghieu: item.thuonghieu,
        rating: item.rating.average,
        sold: parseInt(item.sold_count || "0"),
        discount_percent: item.gia.discount_percent,
        gia: item.gia,
        sold_count: item.sold_count,
      }));

      console.log('✅ TopDealsSection - converted items:', converted.length, converted);
      setItems(converted);
    } catch (error) {
      console.error("❌ TopDealsSection - Error processing hot sales:", error);
      setItems([]);
    }
  }, [homeData, perPage]);

  // nhóm sản phẩm thành các slide dạng "cửa sổ trượt" 5 sản phẩm, dịch từng 1 sp
  const slides = React.useMemo(() => {
    if (!items || items.length === 0) return [] as ProductHotDeal[][];
    const total = items.length;
    const result: ProductHotDeal[][] = [];

    // Mỗi slide bắt đầu tại index i và chứa tối đa 5 sản phẩm, lấy vòng tròn
    for (let start = 0; start < total; start += 1) {
      const windowItems: ProductHotDeal[] = [];
      const count = Math.min(VISIBLE_COUNT, total);
      for (let offset = 0; offset < count; offset += 1) {
        const idx = (start + offset) % total;
        windowItems.push(items[idx]);
      }
      result.push(windowItems);
    }

    return result;
  }, [items]);

  const totalSlides = slides.length;

  React.useEffect(() => {
    setActiveSlide(0);
  }, [totalSlides]);

  const handleNavigate = React.useCallback(
    (dir: "next" | "prev") => {
      if (totalSlides <= 1) return;
      setDirection(dir);
      setActiveSlide((prev) => {
        if (dir === "next") {
          return (prev + 1) % totalSlides;
        }
        return (prev - 1 + totalSlides) % totalSlides;
      });
    },
    [totalSlides]
  );

  // autoplay (advance index), pause on hover
  React.useEffect(() => {
    const start = () => {
      stop();
      autoplayRef.current = window.setInterval(() => {
        if (isHover || totalSlides <= 1) return;
        handleNavigate("next");
      }, 3000);
    };
    const stop = () => {
      if (autoplayRef.current !== null) {
        window.clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
    start();
    return stop;
  }, [isHover, totalSlides, handleNavigate]);

  const prev = () => handleNavigate("prev");
  const next = () => handleNavigate("next");

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget as HTMLImageElement;
    img.onerror = null;
    img.src = "/assets/images/thumbs/placeholder.png";
  };

  const navigateTo = (href: string) => {
    if (!href) return;
    try {
      if (href.startsWith("http")) window.location.href = href;
      else window.location.assign(href);
    } catch {
      window.location.href = href;
    }
  };

  // compute transform for slide-based track (mỗi slide chiếm 100%)
  const translateX = activeSlide * 100;

  return (
    <>
      <section className="pt-0 mt-0 overflow-hidden">
        <div className="container container-lg">
          <div
            className="p-16 pr-20 border border-gray-100 rounded-10 bg-hotsales position-relative"
            style={{
              overflow: "hidden",
            }}
          >
            {/* decorative header image at top-left */}
            <Image
              src="/assets/images/thumbs/top-deal-sieu-re.png"
              alt="Top deal"
              width={334}
              height={60}
              priority
              style={{
                position: "absolute",
                left: 18,
                top: 18,
                objectFit: "contain",
                opacity: 1,
                pointerEvents: "none",
              }}
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.onerror = null;
                img.style.display = "none";
              }}
            />

            {/* controls (no title text) */}
            <div className="mb-24 section-heading" style={{ marginLeft: HEADER_MARGIN_LEFT }}>
              <div className="flex-wrap gap-8 flex-between align-items-center">
                <div /> {/* spacer */}
                <div className="gap-16 flex-align">
                  <Link href={`/shop?source=hot_sales`} className="text-sm text-white fw-semibold hover-text-gray-100 hover-text-decoration-underline">
                    Xem tất cả
                  </Link>
                  <div className="gap-4 flex-align">
                    <button
                      type="button"
                      ref={prevRef}
                      className="text-xl text-white bg-transparent hover-text-white flex-center rounded-circle transition-1 w-50"
                      style={{ border: "none" }}
                      aria-label="Previous slide"
                    >
                      <i className="ph ph-caret-left" />
                    </button>
                    <button
                      type="button"
                      ref={nextRef}
                      className="text-xl text-white bg-transparent hover-text-white flex-center rounded-circle transition-1 w-50"
                      style={{ border: "none" }}
                      aria-label="Next slide"
                    >
                      <i className="ph ph-caret-right" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-white" style={{ marginLeft: HEADER_MARGIN_LEFT }}>
                Đang tải…
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-white" style={{ marginLeft: HEADER_MARGIN_LEFT }}>
                Không có sản phẩm.
              </div>
            ) : (
              <div
                style={{
                  marginLeft: 15,
                  marginTop: PRODUCT_TOP_OFFSET,
                  overflow: "hidden",
                  position: "relative",
                  paddingBottom: 6,
                }}
                onMouseEnter={() => setIsHover(true)}
                onMouseLeave={() => setIsHover(false)}
              >
                <Swiper
                  modules={[Navigation, Autoplay]}
                  speed={600}
                  loop={items.length > VISIBLE_COUNT}
                  spaceBetween={SLIDE_GAP}
                  slidesPerView={VISIBLE_COUNT}
                  slidesPerGroup={1}
                  autoplay={
                    items.length > VISIBLE_COUNT
                      ? {
                        delay: 3000,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                      }
                      : false
                  }
                  navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
                  onBeforeInit={(swiper) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (swiper.params.navigation as any).prevEl = prevRef.current;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (swiper.params.navigation as any).nextEl = nextRef.current;
                  }}
                >
                  {items.map((product) => {
                    const image =
                      product?.mediaurl && typeof product.mediaurl === "string"
                        ? product.mediaurl.startsWith("http")
                          ? product.mediaurl
                          : `${API}/${product.mediaurl.replace(/^\/+/, "")}`
                        : "/assets/images/thumbs/placeholder.png";
                    const name = product?.ten ?? "(Không có tên)";
                    const shop = product?.shop_name ?? "Cửa hàng";
                    const rating = product?.rating ?? null;
                    const sold = product?.sold ?? 0;
                    const originalPrice = product?.original_price ?? 0;
                    const price = product?.selling_price ?? 0;
                    const href =
                      product?.slug
                        ? `/product-details/${encodeURIComponent(String(product.slug))}?category=${encodeURIComponent("Top deal • Siêu rẻ")}`
                        : `/product-details/${String(product?.id ?? "")}?category=${encodeURIComponent("Top deal • Siêu rẻ")}`;
                    const discount =
                      product?.discount_percent ??
                      (originalPrice ? Math.max(0, Math.round(((originalPrice - price) / originalPrice) * 100)) : 0);
                    const normalizedName = (product?.ten ?? "").trim().toLowerCase();
                    const normalizedSlug = (product?.slug ?? "").trim().toLowerCase();
                    const isCaPheSamCanada =
                      normalizedName.includes("cà phê sâm canada") || normalizedSlug.includes("ca-phe-sam-canada");
                    const priceClass = ["product-card__price", !isCaPheSamCanada && "mt-6"]
                      .filter(Boolean)
                      .join(" ");
                    const ariaLabel = name || "Sản phẩm";

                    return (
                      <SwiperSlide key={String(product.id)} className="flex-shrink-0" style={{ width: SLIDE_WIDTH }}>
                        <div
                          className="bg-white product-card hover-card-shadows rounded-10 position-relative transition-2"
                          style={{ display: "flex", flexDirection: "column", height: "100%" }}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => navigateTo(href)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") navigateTo(href);
                            }}
                            className="thumbhover flex-center rounded-10 position-relative bg-gray-50 w-100"
                            aria-label={ariaLabel}
                            style={{ height: 260, overflow: "hidden" }}
                          >
                            <span className="px-8 py-4 text-sm text-white product-card__badge bg-main-600 position-absolute inset-inline-start-0 inset-block-start-0 rounded-tl-10 rounded-br-10">
                              Quà tặng
                            </span>
                            {/* image fills entire slide area (width 100%) */}
                            <img
                              src={image}
                              alt={ariaLabel}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                              onError={handleImgError}
                            />
                          </div>

                          <div className="px-12 pb-12 mt-4 product-card__content w-100" style={{ flex: "1 0 auto" }}>
                            <div className="mt-2 flex-align justify-content-between">
                              <div className="gap-4 flex-align w-100">
                                <span className="text-main-600 text-md d-flex">
                                  <i className="ph-fill ph-storefront" />
                                </span>
                                <span className="text-xs text-gray-500 text-truncate" title={shop}>
                                  {shop}
                                </span>
                              </div>
                            </div>

                            <h6 className="mt-6 mb-6 text-md title fw-semibold">
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => navigateTo(href)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") navigateTo(href);
                                }}
                                className="link text-line-2"
                              >
                                {name}
                              </div>
                            </h6>

                            <div className="flex-wrap mt-2 flex-align justify-content-between">
                              <div className="gap-6 flex-align">
                                <span className="text-xs text-gray-500 fw-medium">Đánh giá</span>
                                <span className="text-xs text-gray-500 fw-medium">
                                  {rating === null ? "N/A" : String(rating)}
                                  {rating !== null && <i className="ph-fill ph-star text-warning-600 ms-1" />}
                                </span>
                              </div>
                              <div className="gap-4 flex-align">
                                <span className="text-xs text-gray-500 fw-medium">Đã bán</span>
                                <span className="text-xs text-gray-500 fw-medium">{sold}</span>
                              </div>
                            </div>

                            <div className={priceClass} style={isCaPheSamCanada ? { marginTop: 25 } : undefined}>
                              {originalPrice ? (
                                <span className="text-xs text-gray-400 fw-semibold text-decoration-line-through me-2">
                                  {originalPrice.toLocaleString("vi-VN")} ₫
                                </span>
                              ) : null}
                              <span className="text-heading text-md fw-semibold">{price.toLocaleString("vi-VN")} ₫</span>
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}