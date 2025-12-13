'use client';

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { type HomeHotSaleProduct } from "@/lib/api";
import { useHomeData } from "@/hooks/useHomeData";

interface Product {
    id: number;
    slug: string;
    ten: string;
    mediaurl: string;
    shop_name: string;
    rating: number;
    sold: number;
    selling_price: number;
    original_price: number | null;
    discount_percent: number | null;
}

const FeaturedProductsStaticSection = () => {
    const { data: homeData, loading: homeLoading } = useHomeData();
    const [products, setProducts] = useState<Product[]>([]);
    const loading = homeLoading;
    const [activeSlide, setActiveSlide] = useState(0);
    const [direction, setDirection] = useState<"next" | "prev">("next");
    const VISIBLE_COUNT = 4; // Hiển thị 4 sản phẩm (2 cột x 2 sản phẩm)
    const STEP = 2; // Mỗi lần chuyển dịch 2 sản phẩm

    useEffect(() => {
        if (!homeData) return;

        try {
            const data = (homeData.data?.best_products || []).slice().sort((a, b) => {
                const soldA = parseInt(a.sold_count || "0");
                const soldB = parseInt(b.sold_count || "0");
                return soldB - soldA;
            });

            const converted: Product[] = data.map((item: HomeHotSaleProduct) => ({
                id: item.id,
                slug: item.slug,
                ten: item.ten,
                mediaurl: item.hinh_anh || "",
                shop_name: item.thuonghieu || "Shopee",
                rating: item.rating?.average || 0,
                sold: parseInt(item.sold_count || "0"),
                selling_price: item.gia.current,
                original_price: item.gia.before_discount || null,
                discount_percent: item.gia.discount_percent || null,
            }));

            setProducts(converted);
        } catch (error) {
            console.error('Error processing featured products:', error);
        }
    }, [homeData]);

    const totalProducts = products.length;

    useEffect(() => {
        setActiveSlide(0);
    }, [totalProducts]);

    const slides = useMemo(() => {
        if (totalProducts === 0) return [] as Product[][];
        const list: Product[][] = [];
        for (let start = 0; start < totalProducts; start += STEP) {
            const slideItems: Product[] = [];
            for (let i = 0; i < VISIBLE_COUNT; i++) {
                slideItems.push(products[(start + i) % totalProducts]);
            }
            list.push(slideItems);
        }
        if (list.length === 0) {
            list.push(products.slice(0, totalProducts));
        }
        return list;
    }, [products, totalProducts]);

    const handleNavigate = useCallback((navDirection: "next" | "prev") => {
        if (slides.length === 0) return;
        setDirection(navDirection);
        setActiveSlide((prev) => {
            if (navDirection === "next") {
                return (prev + 1) % slides.length;
            }
            return (prev - 1 + slides.length) % slides.length;
        });
    }, [slides.length]);

    const canNavigate = slides.length > 1;

    useEffect(() => {
        if (!canNavigate) return;
        const timer = setInterval(() => {
            handleNavigate("next");
        }, 4500);
        return () => clearInterval(timer);
    }, [canNavigate, handleNavigate]);

    if (loading) {
        return (
            <section className="featured-products overflow-hidden py-10 fix-scale-30">
                <div className="container container-lg px-0">
                    <div className="text-center py-10">
                        <p>Loading featured products...</p>
                    </div>
                </div>
            </section>
        );
    }

    const renderProduct = (product: Product) => (
        <div key={product.id} className="aos-init aos-animate" data-aos="fade-up" data-aos-duration="800">
            <div className="mt-12 product-card d-flex gap-16 p-0 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2">
                <a href={`/product-details/${product.slug}?category=${encodeURIComponent("Sản phẩm hàng đầu")}`} className="flex-center rounded-8 position-relative w-unset flex-shrink-0">
                    <img src={product.mediaurl} alt={product.ten} className="rounded-start-4" style={{ width: "180px", height: "180px", objectFit: "cover" }} />
                </a>
                <div className="product-card__content w-100 mt-20 mb-10 flex-grow-1 pe-10 align-items-stretch flex-column justify-content-between d-flex">
                    <div>
                        <div className="flex-align gap-4 mb-5">
                            <span className="text-main-two-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                            <span className="text-gray-500 text-xs" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "200px", display: "inline-block" }}>
                                {product.shop_name}
                            </span>
                        </div>
                        <h6 className="title text-lg fw-semibold mb-5">
                            <a href={`/product-details/${product.slug}?category=${encodeURIComponent("Sản phẩm hàng đầu")}`} className="link text-line-2">{product.ten}</a>
                        </h6>
                        <div className="flex-wrap flex-align justify-content-between">
                            <div className="flex-align gap-6">
                                <span className="text-xs fw-medium text-gray-500">Đánh giá</span>
                                <span className="text-xs fw-medium text-gray-500">{product.rating} <i className="ph-fill ph-star text-warning-600"></i></span>
                            </div>
                            <div className="flex-align gap-4">
                                <span className="text-xs fw-medium text-gray-500">{product.sold}</span>
                                <span className="text-xs fw-medium text-gray-500">Đã bán</span>
                            </div>
                        </div>
                    </div>
                    <div className="product-card__price mt-5">
                        {(product.discount_percent || 0) > 0 && (
                            <div className="flex-align gap-4 text-main-two-600">
                                <i className="ph-fill ph-seal-percent text-sm"></i> -{product.discount_percent}%
                                <span className="text-gray-400 text-sm fw-semibold text-decoration-line-through">
                                    {product.original_price?.toLocaleString('vi-VN')} đ
                                </span>
                            </div>
                        )}
                        <span className="text-heading text-lg fw-semibold">{product.selling_price.toLocaleString('vi-VN')} đ</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <section className="featured-products overflow-hidden py-10 fix-scale-30">
                <div className="container container-lg px-0">
                    <div className="row g-3 align-items-stretch flex-wrap-reverse">
                        <div className="col-xxl-9 col-lg-8">
                            <div className="h-100">
                                <div className="section-heading mb-24">
                                    <div className="flex-between flex-wrap gap-2">
                                        <h6 className="mb-0 wow fadeInLeft" style={{ visibility: "visible", animationName: "fadeInLeft" }}>
                                            <i className="ph-bold ph-package text-main-600"></i> Sản phẩm hàng đầu
                                        </h6>
                                        <div className="border-bottom border-2 border-main-600 mb-3 mt-4" style={{ width: "55%" }}></div>
                                        <div className="flex-align gap-16 wow fadeInRight" style={{ visibility: "visible", animationName: "fadeInRight" }}>
                                            <a href="/shop?source=best_products" className="text-sm fw-medium text-gray-700 hover-text-main-600 hover-text-decoration-underline">
                                                Xem tất cả
                                            </a>
                                            <div className="flex-align gap-8">
                                                <button
                                                    type="button"
                                                    id="featured-products-prev"
                                                    className="flex-center rounded-circle border border-gray-100 hover-border-neutral-600 text-xl hover-bg-neutral-600 hover-text-white transition-1"
                                                    style={{ width: "40px", height: "40px" }}
                                                    onClick={() => handleNavigate("prev")}
                                                    disabled={!canNavigate}
                                                    aria-label="Xem sản phẩm trước"
                                                >
                                                    <i className="ph ph-caret-left"></i>
                                                </button>
                                                <button
                                                    type="button"
                                                    id="featured-products-next"
                                                    className="flex-center rounded-circle border border-gray-100 hover-border-neutral-600 text-xl hover-bg-neutral-600 hover-text-white transition-1"
                                                    style={{ width: "40px", height: "40px" }}
                                                    onClick={() => handleNavigate("next")}
                                                    disabled={!canNavigate}
                                                    aria-label="Xem sản phẩm tiếp theo"
                                                >
                                                    <i className="ph ph-caret-right"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="featured-products__viewport">
                                    <div
                                        className={`featured-products__track slide-${direction}`}
                                        style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                                    >
                                        {slides.map((slide, slideIdx) => {
                                            const perColumn = Math.ceil(slide.length / 2);
                                            const columnChunks = [
                                                slide.slice(0, perColumn),
                                                slide.slice(perColumn)
                                            ];
                                            return (
                                                <div className="featured-products__slide" key={`slide-${slideIdx}`}>
                                                    <div className="row gy-3">
                                                        {columnChunks.map((column, columnIdx) => (
                                                            <div className="col-xxl-6 col-lg-6" key={`slide-${slideIdx}-column-${columnIdx}`}>
                                                                {column.map((product) => renderProduct(product))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xxl-3 col-lg-4">
                            <div className="featured-products__banner position-relative rounded-16 overflow-hidden p-28 pb-0 z-1 text-center h-100 aos-init aos-animate" data-aos="fade-up" data-aos-duration="1000">
                                <a href="https://shopee.tw" className="p-0 m-0 w-100 h-100 d-block">
                                    <img src="https://sieuthivina.com/assets/client/images/bg/shopee-09.jfif" alt="shopee-09" className="position-absolute inset-block-start-0 inset-inline-start-0 z-n1 w-100 h-100 cover-img" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default FeaturedProductsStaticSection;
