"use client";
import React, { useEffect, useState, useRef } from "react";
import { type TopBrand } from "@/lib/api";
import { useHomeData } from "@/hooks/useHomeData";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

const API_URL = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.cloud";

const TopBrandsStaticSection = () => {
    const { data: homeData, loading: homeLoading } = useHomeData();
    const [brands, setBrands] = useState<TopBrand[]>([]);
    const [loading, setLoading] = useState(true);
    const swiperRef = useRef<SwiperType | null>(null);
    const prevRef = useRef<HTMLButtonElement | null>(null);
    const nextRef = useRef<HTMLButtonElement | null>(null);

    // Helper function để build URL ảnh đúng
    const buildImageUrl = (logoPath: string) => {
        if (!logoPath) return "/assets/images/thumbs/placeholder.png";
        // Nếu đã là URL đầy đủ
        if (logoPath.startsWith("http://") || logoPath.startsWith("https://")) {
            return logoPath;
        }
        // Nếu là đường dẫn tương đối, thêm API_URL
        return `${API_URL}/${logoPath.replace(/^\/+/, "")}`;
    };

    useEffect(() => {
        if (!homeData) return;

        let alive = true;
        try {
            if (!alive) return;
            const topBrands = homeData.data?.top_brands || [];
            console.log("🏪 Top Brands từ API:", topBrands.length, topBrands);
            // Lấy tất cả thương hiệu cho Swiper
            setBrands(topBrands);
        } catch (error) {
            console.error("Error fetching top brands:", error);
        } finally {
            if (alive) setLoading(false);
        }
        return () => {
            alive = false;
        };
    }, [homeData]);

    useEffect(() => {
        if (swiperRef.current && prevRef.current && nextRef.current) {
            const swiper = swiperRef.current;
            // Gán navigation buttons
            if (swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
                swiper.navigation.init();
                swiper.navigation.update();
            }
        }
    }, [loading]);

    if (loading) {
        return (
            <section className="top-selling-products overflow-hidden mb-10 fix-scale-30">
                <div className="container container-lg px-0">
                    <div className="text-center py-5">Đang tải thương hiệu...</div>
                </div>
            </section>
        );
    }

    if (brands.length === 0) return null;

    return (
        <section className="top-selling-products overflow-hidden mb-10 fix-scale-30">
            <div className="container container-lg px-0">
                <div className="rounded-16">
                    <div className="section-heading mb-24">
                        <div className="flex-between flex-wrap">
                            <h6 className="mb-0 wow fadeInLeft" style={{ visibility: "visible", animationName: "fadeInLeft" }}>
                                <i className="ph-bold ph-storefront text-main-600"></i> Thương hiệu hàng đầu
                            </h6>
                            <div className="border-bottom border-2 border-main-600 mb-3 mt-4" style={{ width: "70%" }}></div>
                            <div className="flex-align gap-16 wow fadeInRight" style={{ visibility: "visible", animationName: "fadeInRight" }}>
                                <a href="shop.html" className="text-sm fw-semibold text-gray-700 hover-text-main-600 hover-text-decoration-underline">
                                    Xem đầy đủ
                                </a>
                                <div className="flex-align gap-8">
                                    <button type="button" id="top-brand-prev" className="slick-prev flex-center rounded-circle border border-gray-100 hover-border-neutral-600 text-xl hover-bg-neutral-600 hover-text-white transition-1">
                                        <i className="ph ph-caret-left"></i>
                                    </button>
                                    <button type="button" id="top-brand-next" className="slick-next flex-center rounded-circle border border-gray-100 hover-border-neutral-600 text-xl hover-bg-neutral-600 hover-text-white transition-1">
                                        <i className="ph ph-caret-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row g-12">
                        <div className="col-md-12">
                            <Swiper
                                modules={[Navigation, Autoplay]}
                                spaceBetween={16}
                                slidesPerView={5}
                                slidesPerGroup={1}
                                loop={true}
                                speed={800}
                                autoplay={{
                                    delay: 2500,
                                    disableOnInteraction: false,
                                    pauseOnMouseEnter: true,
                                }}
                                navigation={{
                                    prevEl: prevRef.current,
                                    nextEl: nextRef.current,
                                }}
                                onSwiper={(swiper) => {
                                    swiperRef.current = swiper;
                                }}
                                breakpoints={{
                                    320: { slidesPerView: 2, spaceBetween: 12 },
                                    640: { slidesPerView: 3, spaceBetween: 12 },
                                    768: { slidesPerView: 4, spaceBetween: 12 },
                                    1024: { slidesPerView: 5, spaceBetween: 16 },
                                }}
                                className="top-brand-slider"
                            >
                                {brands.map((brand) => (
                                    <SwiperSlide key={brand.id}>
                                        <div data-aos="fade-up" data-aos-duration="200" className="aos-init aos-animate">
                                            <div className="product-card hover-card-shadows h-100 p-5 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2 bg-white justify-content-center">
                                                <a href={`/products?brand=${brand.slug}`} className="product-card__thumb flex-center rounded-8 position-relative" style={{ height: "120px" }} tabIndex={0}>
                                                    <img
                                                        src={buildImageUrl(brand.logo)}
                                                        alt={brand.ten}
                                                        className="object-fit-cover"
                                                        style={{ width: "60%" }}
                                                        onError={(e) => {
                                                            const img = e.currentTarget as HTMLImageElement;
                                                            img.onerror = null;
                                                            img.src = "/assets/images/thumbs/placeholder.png";
                                                        }}
                                                    />
                                                </a>
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TopBrandsStaticSection;
