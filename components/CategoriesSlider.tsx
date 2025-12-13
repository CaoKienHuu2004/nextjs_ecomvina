"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import { type HotCategory } from "@/lib/api";
import { useHomeData } from "@/hooks/useHomeData";

const CATEGORY_ICONS: { [key: string]: string } = {
    "Sức khỏe": "ph-heart",
    "Thực phẩm chức năng": "ph-jar",
    "Chăm sóc cá nhân": "ph-user-focus",
    "Làm đẹp": "ph-magic-wand",
    "Điện máy": "ph-newspaper",
    "Thiết bị y tế": "ph-first-aid-kit",
    "Bách hóa": "ph-storefront",
    "Nội thất - Trang trí": "ph-couch",
    "Mẹ & bé": "ph-baby-carriage",
    "Thời trang": "ph-t-shirt",
    "Thực phẩm - đồ ăn": "ph-fork-knife",
};

export default function CategoriesSlider() {
    const { data: homeData, loading: homeLoading } = useHomeData();
    const [categories, setCategories] = useState<HotCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!homeData) return;

        try {
            const hotCategories = homeData.data?.hot_categories || [];
            setCategories(hotCategories);
        } catch (error) {
            console.error('Error processing categories:', error);
        } finally {
            setLoading(false);
        }
    }, [homeData]);

    if (loading) return null;
    if (categories.length === 0) return null;
    return (
        <section className="categories-slider py-24">
            <div className="container container-lg">
                <div className="p-24 border border-gray-100 rounded-16">
                    <div className="mb-16 section-heading d-flex flex-between align-items-center">
                        <h6 className="mb-0">
                            <i className="ph-bold ph-squares-four text-warning-700"></i> Danh mục nổi bật
                        </h6>
                    </div>

                    <Swiper
                        modules={[Autoplay, Navigation]}
                        spaceBetween={12}
                        slidesPerView={8}
                        navigation
                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                        loop={categories.length > 8}
                        breakpoints={{
                            0: { slidesPerView: 2 },
                            424: { slidesPerView: 3 },
                            575: { slidesPerView: 4 },
                            992: { slidesPerView: 6 },
                            1200: { slidesPerView: 8 },
                        }}
                        className="categories-swiper"
                    >
                        {categories.map((cat) => {
                            const iconClass = CATEGORY_ICONS[cat.ten] || "ph-squares-four";
                            return (
                                <SwiperSlide key={cat.id}>
                                    <a
                                        href={`/products?category=${cat.slug}`}
                                        className="d-flex flex-column align-items-center text-center p-12 text-decoration-none"
                                    >
                                        <div
                                            className="category-circle mb-12 flex-center rounded-circle"
                                            style={{
                                                width: "64px",
                                                height: "64px",
                                                backgroundColor: "#f0f9ff",
                                                border: "1px solid #e5e7eb",
                                            }}
                                        >
                                            <i
                                                className={`ph-bold ${iconClass}`}
                                                style={{ fontSize: "28px", color: "#374151" }}
                                            ></i>
                                        </div>
                                        <div className="text-sm fw-medium text-gray-900 text-line-2">{cat.ten}</div>
                                    </a>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>
                </div>
            </div>
        </section>
    );
}
