import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { type HomeHotSaleProduct } from '@/lib/api';
import { useHomeData } from '@/hooks/useHomeData';

interface Product {
    id: number;
    ten: string;
    slug: string;
    mediaurl: string;
    selling_price: number;
    original_price?: number;
    shop_name: string;
    rating: number;
    sold: number;
    discount_percent?: number;
}

export default function MostInterestedSection() {
    const { data: homeData, loading: homeLoading } = useHomeData();
    const [products, setProducts] = useState<Product[]>([]);
    const loading = homeLoading;

    useEffect(() => {
        console.log('👀 MostInterestedSection - homeData:', homeData);
        if (!homeData) {
            console.log('⚠️ MostInterestedSection - homeData is null/undefined');
            return;
        }

        try {
            console.log('📦 MostInterestedSection - homeData.data:', homeData.data);
            console.log('📦 MostInterestedSection - most_watched array:', homeData.data?.most_watched);
            console.log('📦 MostInterestedSection - most_watched length:', homeData.data?.most_watched?.length || 0);

            const mostWatched = (homeData.data?.most_watched || []).slice().sort((a, b) => {
                const soldA = parseInt(a.sold_count || "0");
                const soldB = parseInt(b.sold_count || "0");
                return soldB - soldA;
            });

            // Convert sang format của component
            const converted: Product[] = mostWatched.map((item: HomeHotSaleProduct) => ({
                id: item.id,
                ten: item.ten,
                slug: item.slug,
                mediaurl: item.hinh_anh,
                selling_price: item.gia.current,
                original_price: item.gia.before_discount,
                shop_name: item.thuonghieu,
                rating: item.rating.average,
                sold: parseInt(item.sold_count || "0"),
                discount_percent: item.gia.discount_percent,
            }));

            console.log('✅ MostInterestedSection - converted products:', converted.length, converted);
            setProducts(converted);
        } catch (err) {
            console.error('❌ MostInterestedSection - Error processing most interested products:', err);
            setProducts([]);
        }
    }, [homeData]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
        }).format(price);
    };

    if (loading) {
        return (
            <section className="trending-productss overflow-hidden fix-scale-80" style={{ marginTop: "-112px", paddingTop: "0px" }}>
                <div className="container container-lg px-0">
                    <div className="section-heading mb-24">
                        <h6
                            className="mb-0"
                            style={{ marginTop: 0 }}
                        >
                            <i className="ph-bold ph-hand-withdraw text-main-600"></i> Được quan tâm nhiều nhất
                        </h6>
                    </div>
                    <div className="text-center py-40">Đang tải...</div>
                </div>
            </section>
        );
    }
    return (
        <section className="trending-productss overflow-hidden fix-scale-80" style={{ marginTop: "-80px", paddingTop: "0px", marginBottom: "0px" }}>
            <div className="container container-lg px-0">
                <div className="">
                    <div className="section-heading mb-24">
                        <div className="flex-between flex-wrap gap-2">
                            <h6
                                className="mb-0 wow fadeInLeft"
                                style={{ visibility: "visible", animationName: "fadeInLeft", marginTop: 0 }}
                            >
                                <i className="ph-bold ph-hand-withdraw text-main-600"></i> Được quan tâm nhiều nhất
                            </h6>
                            <div className="border-bottom border-2 border-main-600 mb-3 mt-4" style={{ width: "75%" }}></div>
                        </div>
                    </div>

                    <div className="tab-content" id="pills-tabContent">
                        <div className="tab-pane fade show active" id="pills-all" role="tabpanel" aria-labelledby="pills-all-tab" tabIndex={0}>
                            <div className="row g-12">
                                {products.map((product) => (
                                    <div key={product.id} className="col-xxl-2 col-xl-3 col-lg-4 col-xs-6">
                                        <div className="product-card h-100 border border-gray-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                            <a href={`/product-details/${product.slug}?category=${encodeURIComponent("Được quan tâm nhiều nhất")}`} className="flex-center rounded-8 bg-gray-50 position-relative" style={{ height: "210px" }}>
                                                <Image alt={product.ten} loading="lazy" width={240} height={240} decoding="async" className="w-100 rounded-top-2" src={product.mediaurl} style={{ color: "transparent", objectFit: "cover", width: "100%", height: "100%" }} />
                                            </a>
                                            <div className="product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex px-10 pb-8">
                                                <div>
                                                    <div className="flex-align justify-content-between">
                                                        <div className="flex-align gap-4 w-100">
                                                            <span className="text-main-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                                            <span className="text-gray-500 text-xs" title={product.shop_name} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", display: "inline-block" }}>{product.shop_name}</span>
                                                        </div>
                                                    </div>
                                                    <h6 className="title text-lg fw-semibold mt-2 mb-2">
                                                        <a href={`/product-details/${product.slug}?category=${encodeURIComponent("Được quan tâm nhiều nhất")}`} className="link text-line-2" tabIndex={0}>{product.ten}</a>
                                                    </h6>
                                                    <div className="flex-align justify-content-between mt-2">
                                                        <div className="flex-align gap-6">
                                                            <span className="text-xs fw-medium text-gray-500">Đánh giá</span>
                                                            <span className="text-xs fw-medium text-gray-500">{product.rating?.toFixed(1)} <i className="ph-fill ph-star text-warning-600"></i></span>
                                                        </div>
                                                        <div className="flex-align gap-4">
                                                            <span className="text-xs fw-medium text-gray-500">{product.sold}</span>
                                                            <span className="text-xs fw-medium text-gray-500">Đã bán</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="product-card__price">
                                                    {(product.discount_percent || 0) > 0 && (
                                                        <div className="flex-align gap-4 text-main-two-600">
                                                            <i className="ph-fill ph-seal-percent text-sm"></i> -{product.discount_percent}%
                                                            <span className="text-gray-400 text-sm fw-semibold text-decoration-line-through">
                                                                {formatPrice(product.original_price || 0)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <span className="text-heading text-lg fw-semibold">
                                                        {formatPrice(product.selling_price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mx-auto w-100 text-center aos-init aos-animate" data-aos="fade-up" data-aos-duration="200">
                            <a href="/shop?source=most_watched" className="btn border-main-600 text-main-600 hover-bg-main-600 hover-border-main-600 hover-text-white rounded-8 px-32 py-12 mt-40">
                                Xem thêm sản phẩm
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
