
import React, { useEffect, useState } from "react";
import { HomeTopCategoryWithProducts } from "../lib/api";
import { useHomeData } from "@/hooks/useHomeData";
import Image from "next/image";

interface TopCategoriesProductsProps {
    selection?: string;
    perPage?: number;
}

const TopCategoriesProducts: React.FC<TopCategoriesProductsProps> = () => {
    const [categories, setCategories] = useState<HomeTopCategoryWithProducts[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);

    const { data: homeData, loading: homeLoading } = useHomeData();

    useEffect(() => {
        if (!homeData) return;

        setLoading(true);
        try {
            const topCategories = homeData.data?.top_categories || [];

            // Chỉ hiển thị 5 danh mục cụ thể (theo thứ tự API trả về)
            const allowedCategories = ["Bách hóa", "Thực phẩm - đồ ăn", "Làm đẹp", "Thiết bị y tế", "Thực phẩm chức năng"];

            const filteredCategories = topCategories
                .filter((cat: HomeTopCategoryWithProducts) => allowedCategories.includes(cat.ten))
                .map((cat: HomeTopCategoryWithProducts) => ({
                    ...cat,
                    // Giới hạn tối đa 12 sản phẩm mỗi category
                    sanpham: cat.sanpham.slice(0, 12)
                }));

            console.log("📊 Filtered Categories:", filteredCategories.length);
            filteredCategories.forEach((cat: HomeTopCategoryWithProducts) => {
                console.log(`\n🏷️ ${cat.ten}: ${cat.sanpham.length} sản phẩm`);
                console.log("   Danh sách sản phẩm:", cat.sanpham.map(p => ({ id: p.id, ten: p.ten })));
            });

            setCategories(filteredCategories);

            // Tự động chọn tab đầu tiên có sản phẩm
            const firstCategoryWithProducts = filteredCategories.findIndex((c: HomeTopCategoryWithProducts) => c.sanpham.length > 0);
            if (firstCategoryWithProducts !== -1) {
                setActiveTab(firstCategoryWithProducts);
            }

            setError(null);
        } catch (err) {
            setError((err as Error).message || "Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, [homeData]); if (loading) return <div>Đang tải danh mục...</div>;
    if (error) return <div className="text-red-500">Lỗi: {error}</div>;

    return (
        <div className="top-categories-section">
            <div className="section-heading mb-24">
                <div className="flex-between flex-align flex-wrap gap-8">
                    <h6 className="mb-0 wow fadeInLeft" style={{ visibility: "visible", animationName: "fadeInLeft" }}>
                        <i className="ph-bold ph-squares-four text-main-600"></i> Danh mục hàng đầu
                    </h6>
                    <ul className="nav common-tab style-two nav-pills wow fadeInRight m-0" id="pills-tab" role="tablist" style={{ visibility: "visible", animationName: "fadeInRight" }}>
                        {categories.map((cat, idx) => (
                            <li key={cat.id} className="nav-item" role="presentation">
                                <button
                                    className={`nav-link fw-medium text-sm hover-border-main-600${activeTab === idx ? " active" : ""}`}
                                    id={`tab-${cat.id}`}
                                    type="button"
                                    role="tab"
                                    aria-controls={`content-${cat.id}`}
                                    aria-selected={activeTab === idx}
                                    onClick={() => setActiveTab(idx)}
                                >
                                    {cat.ten}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="tab-content" id="pills-tabContent">
                {categories.map((cat, idx) => (
                    <div
                        key={cat.id}
                        className={`tab-pane fade${activeTab === idx ? " show active" : ""}`}
                        id={`content-${cat.id}`}
                        role="tabpanel"
                        aria-labelledby={`tab-${cat.id}`}
                        tabIndex={0}
                    >
                        <div className="row g-12">
                            {cat.sanpham.length === 0 ? (
                                <div className="text-gray-500">Chưa có sản phẩm</div>
                            ) : (
                                cat.sanpham.map((sp) => (
                                    <div key={sp.id} className="col-xxl-2 col-xl-3 col-lg-4 col-xs-6">
                                        <div className="product-card h-100 border border-gray-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                            <a href={`/product-details/${sp.slug}?category=${encodeURIComponent(cat.ten)}`} className="flex-center rounded-8 bg-gray-50 position-relative" style={{ height: '210px' }}>
                                                <Image
                                                    src={
                                                        sp.hinh_anh
                                                            ? (sp.hinh_anh.startsWith('http')
                                                                ? sp.hinh_anh
                                                                : sp.hinh_anh.startsWith('/')
                                                                    ? sp.hinh_anh
                                                                    : `/${sp.hinh_anh}`)
                                                            : "/assets/images/thumbs/product-two-img1.png"
                                                    }
                                                    alt={sp.ten}
                                                    width={240}
                                                    height={240}
                                                    className="w-100 rounded-top-2"
                                                    style={{ color: 'transparent', objectFit: 'cover', width: '100%', height: '100%' }}
                                                />
                                            </a>
                                            <div className="product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex px-10 pb-8">
                                                <div>
                                                    <div className="flex-align justify-content-between">
                                                        <div className="flex-align gap-4 w-100">
                                                            <span className="text-main-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                                            <span className="text-gray-500 text-xs" title="Trung Tâm Bán Hàng Siêu Thị Vina" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'inline-block' }}>Trung Tâm Bán Hàng Siêu Thị Vina</span>
                                                        </div>
                                                    </div>
                                                    <h6 className="title text-lg fw-semibold mt-2 mb-2">
                                                        <a href={`/product-details/${sp.slug}?category=${encodeURIComponent(cat.ten)}`} className="link text-line-2" tabIndex={0}>{sp.ten}</a>
                                                    </h6>
                                                    <div className="flex-align justify-content-between mt-2">
                                                        <div className="flex-align gap-6">
                                                            <span className="text-xs fw-medium text-gray-500">Đánh giá</span>
                                                            <span className="text-xs fw-medium text-gray-500">{sp.rating.average?.toFixed(1) || 0} <i className="ph-fill ph-star text-warning-600"></i></span>
                                                        </div>
                                                        <div className="flex-align gap-4">
                                                            <span className="text-xs fw-medium text-gray-500">{parseInt(sp.sold_count || "0")}</span>
                                                            <span className="text-xs fw-medium text-gray-500">Đã bán</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="product-card__price">
                                                    {(sp.gia.discount_percent || 0) > 0 && (
                                                        <div className="flex-align gap-4 text-main-two-600">
                                                            <i className="ph-fill ph-seal-percent text-sm"></i> -{sp.gia.discount_percent}%
                                                            <span className="text-gray-400 text-sm fw-semibold text-decoration-line-through">
                                                                {sp.gia.before_discount.toLocaleString()} đ
                                                            </span>
                                                        </div>
                                                    )}
                                                    <span className="text-heading text-lg fw-semibold">
                                                        {sp.gia.current.toLocaleString()} đ
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="mx-auto w-100 text-center">
                            <a
                                href={`/shop?category=${cat.slug}`}
                                className="btn border-main-600 text-main-600 hover-bg-main-600 hover-border-main-600 hover-text-white rounded-8 px-32 py-12 mt-8"
                                style={{ marginBottom: 0 }}
                            >
                                Xem thêm sản phẩm
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopCategoriesProducts;
