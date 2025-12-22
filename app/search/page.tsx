"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import FullHeader from "@/components/FullHeader";
import Link from "next/link";
import Image from "next/image";

// Type cho sản phẩm hiển thị trên UI
type DisplayProduct = {
    id: number;
    name: string;
    slug: string;
    image: string;
    brand: string;
    price: number;
    originalPrice: number;
    discount: number;
    rating: number;
    sold: number;
};

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get("query") || "";

    const [products, setProducts] = useState<DisplayProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
    const [minRating, setMinRating] = useState<number>(0);
    const [currentSort, setCurrentSort] = useState<"relevance" | "price_asc" | "price_desc" | "rating" | "sales">("relevance");

    // Lấy dữ liệu tìm kiếm
    useEffect(() => {
        if (!query.trim()) {
            setProducts([]);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Gọi API tìm kiếm
                // 1. GỌI API THỰC TẾ
                // Lưu ý: Thay đổi domain nếu chạy local hoặc production
                const res = await fetch(`https://sieuthivina.com/api/v1/tim-kiem?query=${query}`);
                
                if (!res.ok) {
                    throw new Error("Không thể kết nối đến máy chủ");
                }
                const result = await res.json();
                const apiData = result.products?.data || [];

                // 3. MAP DỮ LIỆU TỪ API SANG UI (DisplayProduct)
                const mappedProducts: DisplayProduct[] = apiData.map((item: any) => {
                    // Xử lý giá
                    const currentPrice = item.gia?.giadagiam || 0;
                    const originalPrice = item.gia?.giagoc || currentPrice;
                    
                    // Tính phần trăm giảm giá thủ công vì API trả về giamgia: 0
                    let discountPercent = 0;
                    if (originalPrice > currentPrice) {
                        discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
                    }

                    // Xử lý hình ảnh (API trả về mảng object [{id, url}, ...])
                    let imageUrl = "/assets/images/thumbs/product-placeholder.png";
                    if (item.hinhanh && Array.isArray(item.hinhanh) && item.hinhanh.length > 0) {
                        imageUrl = item.hinhanh[0].url; 
                    }

                    // Xử lý rating (API hiện tại thiếu field rating, tạm gán mặc định hoặc random để test UI)
                    // API có "luotxem" nhưng chưa có "danhgia", tạm để 5 sao
                    const ratingValue = 5; 

                    return {
                        id: item.id,
                        name: item.tensanpham, // API trả về 'tensanpham'
                        slug: item.slug,
                        image: imageUrl,
                        brand: item.thuonghieu?.ten || "Không rõ", // API trả về object thuonghieu { id, ten, ... }
                        price: currentPrice,
                        originalPrice: originalPrice,
                        discount: discountPercent,
                        rating: ratingValue,
                        sold: item.tong_luotban || 0, // API trả về 'tong_luotban'
                    };
                });

                // Sắp xếp theo loại
                const sorted = [...mappedProducts];
                switch (currentSort) {
                    case "price_asc":
                        sorted.sort((a, b) => a.price - b.price);
                        break;
                    case "price_desc":
                        sorted.sort((a, b) => b.price - a.price);
                        break;
                    case "rating":
                        sorted.sort((a, b) => b.rating - a.rating);
                        break;
                    case "sales":
                        sorted.sort((a, b) => b.sold - a.sold);
                        break;
                    default: // relevance
                        break;
                }

                // Lọc giá và rating
                const filtered = sorted.filter((p) => {
                    return p.price >= priceRange[0] && p.price <= priceRange[1] && p.rating >= minRating;
                });

                setProducts(filtered);

                // Gọi API tăng lượt truy cập từ khóa (optional - không block nếu lỗi)
                try {
                    await trackKeywordAccess(query);
                } catch (err) {
                    // Bỏ qua lỗi tracking, không ảnh hưởng tới hiển thị sản phẩm
                    console.debug("Keyword tracking:", err);
                }
            } catch (err: unknown) {
                const e = err as { message?: string };
                setError(e.message || "Lỗi khi tìm kiếm");
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [query, currentSort, priceRange, minRating]);

    if (loading) {
        return (
            <>
                <FullHeader showClassicTopBar={true} showTopNav={false} />
                <section className="breadcrumb mb-0 py-26 bg-main-two-50">
                    <div className="container container-lg">
                        <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
                            <h6 className="mb-0">Tìm kiếm</h6>
                        </div>
                    </div>
                </section>
                <section className="py-40">
                    <div className="container container-lg">
                        <div className="text-center">
                            <p className="text-xl text-gray-600">Đang tìm kiếm...</p>
                        </div>
                    </div>
                </section>
            </>
        );
    }

    return (
        <>
            <FullHeader showClassicTopBar={true} showTopNav={false} />

            {/* Breadcrumb */}
            <section className="breadcrumb mb-0 py-26 bg-main-two-50">
                <div className="container container-lg">
                    <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
                        <h6 className="mb-0">Kết quả tìm kiếm</h6>
                        <ul className="flex-align gap-8 flex-wrap">
                            <li className="text-sm">
                                <Link href="/" className="text-gray-900 flex-align gap-8 hover-text-main-600">
                                    <i className="ph ph-house"></i>
                                    Trang chủ
                                </Link>
                            </li>
                            <li className="flex-align">
                                <i className="ph ph-caret-right"></i>
                            </li>
                            <li className="text-sm text-main-600">Tìm kiếm: &quot;{query}&quot;</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Search Results */}
            <section className="py-40">
                <div className="container container-lg">
                    <div className="mb-40">
                        <h4 className="text-2xl fw-semibold">
                            Kết quả tìm kiếm cho: <span className="text-main-600">&quot;{query}&quot;</span>
                        </h4>
                        <p className="text-gray-600 mt-8">
                            Tìm thấy <span className="fw-semibold">{products.length}</span> sản phẩm
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-danger py-20 px-24 rounded-8 mb-40">
                            <p className="mb-0">Lỗi: {error}</p>
                        </div>
                    )}

                    {products.length === 0 && !error && (
                        <div className="text-center py-40">
                            <i className="mb-16 text-6xl text-gray-300 ph ph-magnifying-glass"></i>
                            <h5 className="mb-8 fw-semibold">Không tìm thấy sản phẩm nào</h5>
                            <p className="text-gray-600">Thử tìm kiếm với từ khóa khác</p>
                        </div>
                    )}

                    {products.length > 0 && (
                        <div className="row g-24">
                            {/* Sidebar Filter */}
                            <div className="col-lg-3">
                                <div className="shop-sidebar">
                                    {/* Price Filter */}
                                    <div className="p-24 mb-24 bg-white border border-gray-100 rounded-8">
                                        <h6 className="mb-20 fw-semibold">Khoảng giá</h6>
                                        <div className="mb-16">
                                            <label className="mb-8 text-sm">Từ:</label>
                                            <input
                                                type="number"
                                                className="w-100 px-12 py-8 border border-gray-100 rounded-6"
                                                value={priceRange[0]}
                                                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                                placeholder="Giá thấp nhất"
                                            />
                                        </div>
                                        <div className="mb-16">
                                            <label className="mb-8 text-sm">Đến:</label>
                                            <input
                                                type="number"
                                                className="w-100 px-12 py-8 border border-gray-100 rounded-6"
                                                value={priceRange[1]}
                                                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                                placeholder="Giá cao nhất"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setPriceRange([0, 10000000])}
                                            className="w-100 px-16 py-8 text-sm bg-gray-50 hover-bg-gray-100 rounded-6"
                                        >
                                            Đặt lại
                                        </button>
                                    </div>

                                    {/* Rating Filter */}
                                    <div className="p-24 bg-white border border-gray-100 rounded-8">
                                        <h6 className="mb-20 fw-semibold">Đánh giá tối thiểu</h6>
                                        <div className="gap-12 d-flex flex-column">
                                            {[5, 4, 3, 2, 1, 0].map((rating) => (
                                                <button
                                                    key={rating}
                                                    onClick={() => setMinRating(rating)}
                                                    className={`px-12 py-8 text-sm rounded-6 text-start ${minRating === rating ? "bg-main-600 text-white" : "bg-gray-50 hover-bg-gray-100"}`}
                                                >
                                                    <span className="gap-4 d-flex align-items-center">
                                                        {rating === 0 ? "Tất cả" : (
                                                            <>
                                                                {[...Array(rating)].map((_, i) => (
                                                                    <i key={i} className="ph-fill ph-star text-warning-600"></i>
                                                                ))}
                                                                {rating < 5 && <span className="ms-4">trở lên</span>}
                                                            </>
                                                        )}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Products Section */}
                            <div className="col-lg-9">
                                {/* Sort bar */}
                                <div className="p-16 mb-24 bg-white border border-gray-100 rounded-8">
                                    <div className="gap-12 d-flex align-items-center flex-wrap">
                                        <span className="text-sm fw-medium">Sắp xếp:</span>
                                        <div className="flex-wrap gap-8 d-flex">
                                            {[
                                                { value: "relevance" as const, label: "Liên quan" },
                                                { value: "sales" as const, label: "Bán chạy" },
                                                { value: "price_asc" as const, label: "Giá thấp" },
                                                { value: "price_desc" as const, label: "Giá cao" },
                                                { value: "rating" as const, label: "Đánh giá" },
                                            ].map((sort) => (
                                                <button
                                                    key={sort.value}
                                                    onClick={() => setCurrentSort(sort.value)}
                                                    className={`px-16 py-8 text-sm rounded-6 ${currentSort === sort.value ? "bg-main-600 text-white" : "bg-gray-50 hover-bg-gray-100"}`}
                                                >
                                                    {sort.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Products Grid */}
                                <div className="row g-24">
                                    {products.map((product) => (
                                        <div key={product.id} className="col-xxl-4 col-lg-6 col-sm-6">
                                            <div className="product-card h-100 border border-gray-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                                <Link
                                                    href={`/product-details/${product.slug}`}
                                                    className="flex-center rounded-8 bg-gray-50 position-relative"
                                                >
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        width={300}
                                                        height={300}
                                                        className="w-100 rounded-top-2"
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                </Link>
                                                <div className="product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex mt-10 px-10 pb-8">
                                                    <div>
                                                        <h6 className="title text-lg fw-semibold mt-2 mb-2">
                                                            <Link href={`/product-details/${product.slug}`} className="link text-line-2">
                                                                {product.name}
                                                            </Link>
                                                        </h6>
                                                        <div className="flex-align justify-content-between mt-2">
                                                            <div className="flex-align gap-6">
                                                                <span className="text-xs fw-medium text-gray-500">Đánh giá</span>
                                                                <span className="text-xs fw-medium text-gray-500">
                                                                    {product.rating.toFixed(1)} <i className="ph-fill ph-star text-warning-600"></i>
                                                                </span>
                                                            </div>
                                                            <div className="flex-align gap-4">
                                                                <span className="text-xs fw-medium text-gray-500">{product.sold}</span>
                                                                <span className="text-xs fw-medium text-gray-500">Đã bán</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="product-card__price mt-5">
                                                        {product.discount > 0 && (
                                                            <div className="flex-align gap-4 text-main-two-600 mb-8">
                                                                <i className="ph-fill ph-seal-percent text-sm"></i> -{product.discount}%
                                                                <span className="text-decoration-line-through">
                                                                    {product.originalPrice.toLocaleString()} đ
                                                                </span>
                                                            </div>
                                                        )}
                                                        <span className="text-heading text-lg fw-semibold">
                                                            {product.price.toLocaleString()} đ
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

        </>
    );
}
