"use client";
import React, { useState, useEffect, use, useRef } from "react";
import { useSearchParams } from "next/navigation";
import FullHeader from "@/components/FullHeader";
import FullFooter from "@/components/FullFooter";
import Link from "next/link";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { fetchHomePage, type HomeHotSaleProduct, ProductDetail } from "@/lib/api";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";

export default function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
    const searchParams = useSearchParams();
    const categoryName = searchParams?.get("category") || "";
    const resolvedParams = use(params);
    const slug = resolvedParams.slug;
    const sliderRef = useRef<Slider>(null);

    const { addToCart } = useCart();

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState("description");
    const [selectedVariant, setSelectedVariant] = useState("30");
    const [selectedImage, setSelectedImage] = useState(0);
    const [addingToCart, setAddingToCart] = useState(false);
    const [addedSuccess, setAddedSuccess] = useState(false);

    // Xử lý thêm vào giỏ hàng
    const handleAddToCart = async () => {
        if (!product) return;

        setAddingToCart(true);
        try {
            // Chuẩn bị dữ liệu đúng chuẩn AddToCartInput của useCart mới
            // Lưu ý: ProductDetail hiện tại dùng 'hinh_anh', cần map sang 'hinhanh' hoặc 'mediaurl'
            const productInput = {
                id_bienthe: product.id, // ID sản phẩm
                ten: product.ten,
                // Map hình ảnh để hiển thị ngay (Optimistic UI)
                mediaurl: product.hinh_anh,
                hinhanh: product.hinh_anh,
                // Map giá (quan trọng để tính tiền ở client trước khi sync)
                gia: product.gia,
                price: typeof product.gia === 'object' ? product.gia?.current : Number(product.gia),
            };

            // GỌI HÀM MỚI: Chỉ truyền 2 tham số (product object, quantity)
            await addToCart(productInput, quantity);

            setAddedSuccess(true);
            setTimeout(() => setAddedSuccess(false), 2000);
        } catch (err) {
            console.error("Lỗi thêm vào giỏ:", err);
            alert("Có lỗi xảy ra khi thêm vào giỏ hàng");
        } finally {
            setAddingToCart(false);
        }
    };

    useEffect(() => {
        if (!slug) return;

        setLoading(true);
        fetchHomePage()
            .then((res) => {
                // Gộp tất cả sản phẩm từ trang chủ
                const allProducts: HomeHotSaleProduct[] = [
                    ...(res.data.hot_sales || []),
                    ...(res.data.best_products || []),
                    ...(res.data.new_launch || []),
                    ...(res.data.most_watched || []),
                ];

                // Tìm sản phẩm theo slug
                const foundProduct = allProducts.find(p => p.slug === slug);

                if (foundProduct) {
                    // Convert sang ProductDetail format
                    const productDetail: ProductDetail = {
                        id: foundProduct.id,
                        slug: foundProduct.slug,
                        ten: foundProduct.ten,
                        hinh_anh: foundProduct.hinh_anh,
                        thuonghieu: foundProduct.thuonghieu,
                        rating: foundProduct.rating,
                        sold_count: foundProduct.sold_count,
                        gia: foundProduct.gia,
                    };
                    setProduct(productDetail);
                    setError(null);
                } else {
                    setError("Không tìm thấy sản phẩm");
                }
            })
            .catch((err) => {
                setError(err.message || "Lỗi tải dữ liệu sản phẩm");
            })
            .finally(() => setLoading(false));
    }, [slug]);

    // Xử lý danh sách hình ảnh
    const productImages = product?.images && product.images.length > 0
        ? product.images
        : product?.hinh_anh
            ? [product.hinh_anh]
            : product?.mediaurl
                ? [product.mediaurl]
                : ["/assets/images/thumbs/product-two-img1.png"];

    if (loading) {
        return (
            <>
                <FullHeader showClassicTopBar={true} showTopNav={false} showCategoriesBar={false} />
                <div className="container text-center py-80">
                    <div className="spinner-border text-main-600" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                </div>
                <FullFooter />
            </>
        );
    }

    if (error || !product) {
        return (
            <>
                <FullHeader showClassicTopBar={false} showTopNav={true} showCategoriesBar={false} />
                <div className="container text-center py-80">
                    <h4 className="text-danger">Lỗi: {error || "Không tìm thấy sản phẩm"}</h4>
                    <Link href="/" className="mt-3 btn btn-main-600">Về trang chủ</Link>
                </div>
                <FullFooter />
            </>
        );
    }

    return (
        <>
            <FullHeader showClassicTopBar={false} showTopNav={true} showCategoriesBar={false} />

            {/* Breadcrumb */}
            <section className="mb-0 breadcrumb py-26 bg-main-two-50">
                <div className="container container-lg">
                    <div className="flex-wrap gap-16 breadcrumb-wrapper flex-between">
                        <h6 className="mb-0">Chi tiết sản phẩm</h6>
                        <ul className="flex-wrap gap-8 flex-align">
                            <li className="text-sm">
                                <Link href="/" className="gap-8 text-gray-900 flex-align hover-text-main-600">
                                    <i className="ph ph-house"></i>
                                    Trang chủ
                                </Link>
                            </li>
                            <li className="flex-align">
                                <i className="ph ph-caret-right"></i>
                            </li>
                            <li className="text-sm text-main-600">Chi tiết sản phẩm</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Product Details */}
            <section className="py-40 product-details fix-scale-40">
                <div className="container">
                    <div className="row gy-4">
                        <div className="col-xl-9">
                            <div className="row gy-4">
                                <div className="col-xl-6">
                                    <div className="product-details__left">
                                        <div className="p-0 product-details__thumb-slider rounded-16">
                                            <div className="product-details__thumb flex-center h-100">
                                                <Image
                                                    className="rounded-10"
                                                    src={productImages[selectedImage].startsWith('http')
                                                        ? productImages[selectedImage]
                                                        : productImages[selectedImage].startsWith('/')
                                                            ? productImages[selectedImage]
                                                            : `/${productImages[selectedImage]}`}
                                                    alt={product.ten}
                                                    width={600}
                                                    height={450}
                                                    style={{ width: "100%", height: "450px", objectFit: "cover", objectPosition: "center" }}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-24">
                                            <Slider
                                                ref={sliderRef}
                                                dots={false}
                                                infinite={productImages.length > 4}
                                                speed={500}
                                                slidesToShow={Math.min(4, productImages.length)}
                                                slidesToScroll={1}
                                                arrows={false}
                                                responsive={[
                                                    {
                                                        breakpoint: 1024,
                                                        settings: {
                                                            slidesToShow: Math.min(4, productImages.length),
                                                            slidesToScroll: 1,
                                                        }
                                                    },
                                                    {
                                                        breakpoint: 768,
                                                        settings: {
                                                            slidesToShow: Math.min(3, productImages.length),
                                                            slidesToScroll: 1,
                                                        }
                                                    }
                                                ]}
                                            >
                                                {productImages.map((img, index) => (
                                                    <div key={index} style={{ padding: "0 4px" }}>
                                                        <div
                                                            className={`max-w-120 max-h-120 h-100 flex-center rounded-16 ${selectedImage === index ? "border border-main-600" : ""}`}
                                                            onClick={() => setSelectedImage(index)}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            <Image
                                                                className="rounded-10"
                                                                src={img.startsWith('http') ? img : img.startsWith('/') ? img : `/${img}`}
                                                                alt={`${product.ten} - ${index + 1}`}
                                                                width={120}
                                                                height={120}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </Slider>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-6">
                                    <div className="product-details__content">

                                        {/* Nhãn loại sản phẩm lấy từ query param */}
                                        {categoryName && (() => {
                                            const categoryMap: Record<string, { label: string; color: string }> = {
                                                "Bách hóa": { label: "Bách hóa", color: "#E53935" },
                                                "Thực phẩm - đồ ăn": { label: "Thực phẩm - đồ ăn", color: "#43A047" },
                                                "Thiết bị y tế": { label: "Thiết bị y tế", color: "#1E88E5" },
                                                "Làm đẹp": { label: "Làm đẹp", color: "#8E24AA" },
                                                "Thực phẩm chức năng": { label: "Thực phẩm chức năng", color: "#3949AB" },
                                                "Sản phẩm hàng đầu": { label: "Sản phẩm hàng đầu", color: "#FF6F00" },
                                                "Hàng mới chào sân": { label: "Hàng mới chào sân", color: "#00ACC1" },
                                                "Được quan tâm nhiều nhất": { label: "Được quan tâm nhiều nhất", color: "#D32F2F" },
                                                "Top deal • Siêu rẻ": { label: "Top deal • Siêu rẻ", color: "#FF5722" },
                                            };
                                            const info = categoryMap[categoryName];
                                            if (!info) return null;
                                            return (
                                                <span style={{ background: info.color, color: '#fff', borderRadius: '8px', padding: '4px 12px', fontWeight: 600, display: 'inline-block', fontSize: '15px', marginBottom: '8px' }}>
                                                    {info.label}
                                                </span>
                                            );
                                        })()}
                                        <h4 className="mb-8 text-lg title">{product.ten}</h4>
                                        <div className="gap-16 mb-24 flex-align" style={{ marginBottom: '8px' }}>
                                            <span className="gap-4 flex-align">
                                                <i className="ph-fill ph-star" style={{ color: '#FFA800' }}></i>
                                                <span className="fw-semibold text-md" style={{ color: '#FFA800' }}>4.7</span>
                                                <span className="text-xs text-gray-500">(21,676)</span>
                                            </span>
                                            <span className="text-gray-500 text-md fw-medium">|</span>
                                            <span className="gap-4 flex-align">
                                                <span className="text-md fw-medium text-neutral-600">Lượt bán:</span>
                                                <span className="text-gray-500 text-md fw-medium">13,600</span>
                                            </span>
                                            <span className="text-gray-500 text-md fw-medium">|</span>
                                            <span className="gap-4 flex-align">
                                                <span className="text-md fw-medium text-neutral-600">15</span>
                                                <span className="text-gray-500 text-md fw-medium">người xem</span>
                                            </span>
                                        </div>
                                        <ul className="mt-10">
                                            <li className="mb-8 text-gray-400 flex-align gap-14">
                                                <span className="w-20 h-20 text-xs bg-main-50 text-main-600 flex-center rounded-circle">
                                                    <i className="ph ph-check"></i>
                                                </span>
                                                <span className="text-heading fw-medium">
                                                    Xuất xứ:
                                                    <span className="text-gray-500"> Việt Nam</span>
                                                </span>
                                            </li>
                                            <li className="mb-8 text-gray-400 flex-align gap-14">
                                                <span className="w-20 h-20 text-xs bg-main-50 text-main-600 flex-center rounded-circle">
                                                    <i className="ph ph-check"></i>
                                                </span>
                                                <span className="text-heading fw-medium">
                                                    Nơi sản xuất:
                                                    <span className="text-gray-500"> Việt Nam</span>
                                                </span>
                                            </li>
                                        </ul>

                                        {/* Product Attributes */}
                                        <ul className="mt-30">
                                            {product.xuatxu && (
                                                <li className="text-gray-400 mb-14 flex-align gap-14">
                                                    <span className="w-20 h-20 text-xs bg-main-50 text-main-600 flex-center rounded-circle">
                                                        <i className="ph ph-check"></i>
                                                    </span>
                                                    <span className="text-heading fw-medium">
                                                        Xuất xứ:
                                                        <span className="text-gray-500"> {product.xuatxu}</span>
                                                    </span>
                                                </li>
                                            )}
                                            {product.sanxuat && (
                                                <li className="text-gray-400 mb-14 flex-align gap-14">
                                                    <span className="w-20 h-20 text-xs bg-main-50 text-main-600 flex-center rounded-circle">
                                                        <i className="ph ph-check"></i>
                                                    </span>
                                                    <span className="text-heading fw-medium">
                                                        Nơi sản xuất:
                                                        <span className="text-gray-500"> {product.sanxuat}</span>
                                                    </span>
                                                </li>
                                            )}
                                            {product.thuonghieu && (
                                                <li className="text-gray-400 mb-14 flex-align gap-14">
                                                    <span className="w-20 h-20 text-xs bg-main-50 text-main-600 flex-center rounded-circle">
                                                        <i className="ph ph-check"></i>
                                                    </span>
                                                    <span className="text-heading fw-medium">
                                                        Thương hiệu:
                                                        <span className="text-gray-500"> {product.thuonghieu}</span>
                                                    </span>
                                                </li>
                                            )}
                                        </ul>

                                        {/* Price */}
                                        <div className="flex-wrap gap-16 mb-32 flex-align">
                                            <div className="gap-8 flex-align">
                                                {(() => {
                                                    // Xử lý cả 2 cấu trúc: product.gia (top_categories) và product.discount_percent (latest/most_interested)
                                                    const prod = product as { gia?: { discount_percent?: number; before_discount?: number; current?: number }; discount_percent?: number; original_price?: number; selling_price?: number };
                                                    const discountPercent = Number(prod.gia?.discount_percent || prod.discount_percent || 0);
                                                    const beforeDiscount = Number(prod.gia?.before_discount || prod.original_price || 0);
                                                    const currentPrice = Number(prod.gia?.current || prod.selling_price || 0);

                                                    return (
                                                        <>
                                                            {discountPercent > 0 && (
                                                                <>
                                                                    <span className="text-gray-400 text-md fw-semibold text-decoration-line-through">
                                                                        {beforeDiscount.toLocaleString()} ₫
                                                                    </span>
                                                                    <span className="px-8 py-4 text-xs text-white bg-main-600 rounded-pill">
                                                                        -{discountPercent}%
                                                                    </span>
                                                                </>
                                                            )}
                                                            <h6 className="mb-0 text-2xl text-main-600 mt-30">{currentPrice.toLocaleString()} ₫</h6>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        {/* Product Variants */}
                                        <div className="mb-32">
                                            <h6 className="mb-16">Loại sản phẩm</h6>
                                            <div className="flex-wrap gap-16 flex-between align-items-start">
                                                <div>
                                                    <div className="gap-8 flex-align">
                                                        <input
                                                            type="radio"
                                                            id="bienthe-30"
                                                            name="id_bienthe"
                                                            value="30"
                                                            checked={selectedVariant === "30"}
                                                            onChange={(e) => setSelectedVariant(e.target.value)}
                                                            className="d-none"
                                                        />
                                                        <label
                                                            htmlFor="bienthe-30"
                                                            className="px-12 py-8 border border-2 color-list__button rounded-8 hover-border-main-600 transition-1"
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            Có đường (190ml/lon)
                                                        </label>
                                                        <input
                                                            type="radio"
                                                            id="bienthe-31"
                                                            name="id_bienthe"
                                                            value="31"
                                                            checked={selectedVariant === "31"}
                                                            onChange={(e) => setSelectedVariant(e.target.value)}
                                                            className="d-none"
                                                        />
                                                        <label
                                                            htmlFor="bienthe-31"
                                                            className="px-12 py-8 border border-2 border-gray-900 color-list__button rounded-8 hover-border-main-600 transition-1"
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            Plus ít đường (190ml/lon)
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <span className="pt-32 mt-32 text-gray-700 border-gray-100 border-top d-block" />

                                        <div className="mt-32">
                                            <div className="gap-8 mb-16 flex-align">
                                                <span className="text-md fw-medium text-main-600">Cửa hàng:</span>
                                                <span className="text-gray-600 text-md fw-medium">GLOBAL (Yến Sào NEST100)</span>
                                            </div>
                                        </div>

                                        <span className="mt-16 text-gray-700 border-gray-100 border-top d-block" />

                                        <a href="https://www.whatsapp.com" className="gap-8 py-16 mt-16 btn btn-black flex-center rounded-8">
                                            <i className="text-lg ph ph-whatsapp-logo" /> Liên hệ với cửa hàng
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* End of row gy-4 */}
                        <div className="col-xl-3">
                            <div className="px-32 py-40 border border-gray-100 product-details__sidebar rounded-16">
                                {/* Quantity */}
                                <h6 className="mb-8 text-heading fw-semibold d-block">Số lượng</h6>
                                <div className="overflow-hidden d-flex rounded-4">
                                    <button
                                        type="button"
                                        className="flex-shrink-0 w-48 h-48 quantity__minus text-neutral-600 bg-gray-50 flex-center hover-bg-main-600 hover-text-white"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        title="Giảm số lượng"
                                        aria-label="Giảm số lượng"
                                    >
                                        <i className="ph ph-minus" />
                                    </button>
                                    <input
                                        type="number"
                                        className="w-32 px-16 text-center border border-gray-100 quantity__input flex-grow-1"
                                        value={quantity}
                                        min={1}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        title="Số lượng sản phẩm"
                                        aria-label="Số lượng sản phẩm"
                                    />
                                    <button
                                        type="button"
                                        className="flex-shrink-0 w-48 h-48 quantity__plus text-neutral-600 bg-gray-50 flex-center hover-bg-main-600 hover-text-white"
                                        onClick={() => setQuantity(quantity + 1)}
                                        title="Tăng số lượng"
                                        aria-label="Tăng số lượng"
                                    >
                                        <i className="ph ph-plus" />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-32">
                                <div className="flex-wrap gap-8 pb-16 mb-16 border-gray-100 flex-between border-bottom">
                                    <span className="text-gray-500">Tổng giá</span>
                                    <h6 className="mb-0 text-lg">
                                        {((product?.gia?.current || 0) * quantity).toLocaleString('vi-VN')} đ
                                    </h6>
                                </div>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={addingToCart}
                                className="gap-8 py-16 mt-48 btn btn-main flex-center rounded-8 fw-normal w-100 justify-content-center"
                            >
                                {addingToCart ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        Đang thêm...
                                    </>
                                ) : addedSuccess ? (
                                    <>
                                        <i className="text-lg ph ph-check-circle" /> Đã thêm vào giỏ!
                                    </>
                                ) : (
                                    <>
                                        <i className="text-lg ph ph-shopping-cart-simple" /> Thêm vào giỏ hàng
                                    </>
                                )}
                            </button>

                            {addedSuccess && (
                                <Link href="/gio-hang" className="gap-8 py-12 mt-12 btn btn-outline-main flex-center rounded-8 fw-normal w-100 justify-content-center">
                                    <i className="text-lg ph ph-shopping-cart" /> Xem giỏ hàng
                                </Link>
                            )}

                            <div className="mt-32">
                                <div className="gap-12 px-16 py-12 mb-0 bg-main-50 rounded-8 flex-between">
                                    <span className="flex-shrink-0 w-32 h-32 text-lg bg-white text-main-600 rounded-circle flex-center">
                                        <i className="ph-fill ph-storefront" />
                                    </span>
                                    <span className="text-sm text-neutral-600 flex-grow-1">
                                        <span className="fw-semibold">GLOBAL (Yến Sào NEST100)</span>
                                    </span>
                                </div>
                            </div>

                            <div className="mt-32">
                                <div className="gap-8 px-32 py-16 border border-gray-100 rounded-8 flex-between">
                                    <a href="#" className="d-flex text-main-600 text-28" title="Liên hệ hỗ trợ" aria-label="Liên hệ hỗ trợ">
                                        <i className="ph-fill ph-chats-teardrop" />
                                    </a>
                                    <span className="border border-gray-100 h-26" />
                                    <div className="dropdown on-hover-item">
                                        <button className="d-flex text-main-600 text-28" type="button" title="Chia sẻ sản phẩm" aria-label="Chia sẻ sản phẩm">
                                            <i className="ph-fill ph-share-network" />
                                        </button>
                                        <div className="border-0 on-hover-dropdown common-dropdown inset-inline-start-auto inset-inline-end-0">
                                            <ul className="gap-16 flex-align">
                                                <li>
                                                    <a href="https://www.facebook.com" className="text-xl w-44 h-44 flex-center bg-main-100 text-main-600 rounded-circle hover-bg-main-600 hover-text-white" title="Chia sẻ trên Facebook" aria-label="Chia sẻ trên Facebook">
                                                        <i className="ph-fill ph-facebook-logo" />
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="https://www.twitter.com" className="text-xl w-44 h-44 flex-center bg-main-100 text-main-600 rounded-circle hover-bg-main-600 hover-text-white" title="Chia sẻ trên Twitter" aria-label="Chia sẻ trên Twitter">
                                                        <i className="ph-fill ph-twitter-logo" />
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="https://www.pinterest.com" className="text-xl w-44 h-44 flex-center bg-main-100 text-main-600 rounded-circle hover-bg-main-600 hover-text-white" title="Chia sẻ trên Pinterest" aria-label="Chia sẻ trên Pinterest">
                                                        <i className="ph-fill ph-pinterest-logo" />
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Description & Reviews Tabs */}
            <section className="py-40">
                <div className="container container-lg">
                    {/* Tab Header */}
                    <div className="flex-wrap gap-16 mb-24 border-gray-100 product-dContent__header border-bottom flex-between">
                        <ul className="mb-0 nav common-tab nav-pills" role="tablist">
                            <li className="nav-item" role="presentation">
                                <button
                                    className={`nav-link ${activeTab === "description" ? "active" : ""}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === "description"}
                                    onClick={() => setActiveTab("description")}
                                >
                                    Mô tả sản phẩm
                                </button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button
                                    className={`nav-link ${activeTab === "reviews" ? "active" : ""}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === "reviews"}
                                    onClick={() => setActiveTab("reviews")}
                                >
                                    Đánh giá về sản phẩm
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Tab Content */}
                    {activeTab === "description" && (
                        <div className="p-24 product-dContent__box">
                            <div className="tab-content">
                                <div className="tab-pane fade show active">
                                    <p className="text-gray-700">
                                        Nước Yến Sào cao cấp NEST100 được sản xuất từ yến sào, chứa nhiều acid amin và nguyên tố vi lượng cần thiết giúp Giải khát và làm mát cơ thể an toàn. Tăng cường sức khỏe, giảm căng thẳng, mệt mỏi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "reviews" && (
                        <div className="row g-4 justify-content-center">
                            <div className="col-lg-6">
                                <h6 className="mb-24 title">Đánh giá về sản phẩm</h6>
                                <div className="gap-24 border-gray-100 d-flex align-items-start pb-44 border-bottom mb-44">
                                    <img src="https://sieuthivina.com/assets/client/images/thumbs/comment-img1.png" alt="" className="flex-shrink-0 w-52 h-52 object-fit-cover rounded-circle" />
                                    <div className="flex-grow-1">
                                        <div className="gap-8 flex-between align-items-start">
                                            <div>
                                                <h6 className="mb-12 text-md">Nicolas cage</h6>
                                                <div className="gap-8 flex-align">
                                                    <span className="text-md fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-md fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-md fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-md fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-md fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-800">3 ngày trước</span>
                                        </div>
                                        <p className="mt-10 text-gray-700">There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour</p>
                                        <div className="gap-20 mt-10 flex-align">
                                            <button className="gap-12 text-gray-700 flex-align hover-text-main-600">
                                                <i className="ph-bold ph-thumbs-up"></i>
                                                Hữu ích
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-56">
                                    <div>
                                        <h6 className="mb-24">Viết bài đánh giá</h6>
                                        <span className="mb-8 text-heading">Bạn có hài lòng với sản phẩm này không?</span>
                                        <div className="gap-8 flex-align">
                                            <span className="text-2xl fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                            <span className="text-2xl fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                            <span className="text-2xl fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                            <span className="text-2xl fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                            <span className="text-2xl fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                        </div>
                                    </div>
                                    <div className="mt-32">
                                        <form action="#">
                                            <div className="mb-10">
                                                <label htmlFor="desc" className="mb-8 text-neutral-600">Nội dung</label>
                                                <textarea className="common-input rounded-8" id="desc" placeholder="Nhập những dòng suy nghĩ của bạn..."></textarea>
                                            </div>
                                            <button type="submit" className="mt-20 btn btn-main rounded-pill">Đăng tải</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-6">
                                <div className="ms-xxl-5">
                                    <h6 className="mb-24 text-center">Đánh giá từ khách hàng</h6>
                                    <div className="flex-wrap d-flex gap-44 justify-content-center">
                                        <div className="flex-shrink-0 px-40 text-center border border-gray-100 rounded-8 py-52 flex-center flex-column">
                                            <h2 className="mb-6 text-main-600">4.8</h2>
                                            <div className="gap-8 flex-center">
                                                <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                            </div>
                                            <span className="mt-16 text-gray-500">Điểm đánh giá trung bình</span>
                                        </div>
                                        <div className="px-24 py-40 border border-gray-100 rounded-8 flex-grow-1">
                                            <div className="gap-8 mb-20 flex-align">
                                                <span className="flex-shrink-0 text-gray-900">5</span>
                                                <div className="h-8 bg-gray-100 progress w-100 rounded-pill" role="progressbar" aria-label="5 sao" aria-valuenow={70} aria-valuemin={0} aria-valuemax={100}>
                                                    <div className="progress-bar bg-main-600 rounded-pill" style={{ width: '70%' }}></div>
                                                </div>
                                                <div className="gap-4 flex-align">
                                                    <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                </div>
                                                <span className="flex-shrink-0 text-gray-900">124</span>
                                            </div>
                                            <div className="gap-8 mb-20 flex-align">
                                                <span className="flex-shrink-0 text-gray-900">4</span>
                                                <div className="h-8 bg-gray-100 progress w-100 rounded-pill" role="progressbar" aria-label="4 sao" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}>
                                                    <div className="progress-bar bg-main-600 rounded-pill" style={{ width: '50%' }}></div>
                                                </div>
                                                <div className="gap-4 flex-align">
                                                    <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs text-gray-400 fw-medium d-flex"><i className="ph-fill ph-star"></i></span>
                                                </div>
                                                <span className="flex-shrink-0 text-gray-900">52</span>
                                            </div>
                                            <div className="gap-8 mb-20 flex-align">
                                                <span className="flex-shrink-0 text-gray-900">3</span>
                                                <div className="h-8 bg-gray-100 progress w-100 rounded-pill" role="progressbar" aria-label="3 sao" aria-valuenow={35} aria-valuemin={0} aria-valuemax={100}>
                                                    <div className="progress-bar bg-main-600 rounded-pill" style={{ width: '35%' }}></div>
                                                </div>
                                                <div className="gap-4 flex-align">
                                                    <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs text-gray-400 fw-medium d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs text-gray-400 fw-medium d-flex"><i className="ph-fill ph-star"></i></span>
                                                </div>
                                                <span className="flex-shrink-0 text-gray-900">12</span>
                                            </div>
                                            <div className="gap-8 mb-20 flex-align">
                                                <span className="flex-shrink-0 text-gray-900">2</span>
                                                <div className="h-8 bg-gray-100 progress w-100 rounded-pill" role="progressbar" aria-label="2 sao" aria-valuenow={20} aria-valuemin={0} aria-valuemax={100}>
                                                    <div className="progress-bar bg-main-600 rounded-pill" style={{ width: '20%' }}></div>
                                                </div>
                                                <div className="gap-4 flex-align">
                                                    <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs text-gray-400 fw-medium d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs text-gray-400 fw-medium d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs text-gray-400 fw-medium d-flex"><i className="ph-fill ph-star"></i></span>
                                                </div>
                                                <span className="flex-shrink-0 text-gray-900">5</span>
                                            </div>
                                            <div className="gap-8 mb-0 flex-align">
                                                <span className="flex-shrink-0 text-gray-900">1</span>
                                                <div className="h-8 bg-gray-100 progress w-100 rounded-pill" role="progressbar" aria-label="1 sao" aria-valuenow={5} aria-valuemin={0} aria-valuemax={100}>
                                                    <div className="progress-bar bg-main-600 rounded-pill" style={{ width: '5%' }}></div>
                                                </div>
                                                <div className="gap-4 flex-align">
                                                    <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs text-gray-400 fw-medium d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs text-gray-400 fw-medium d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs text-gray-400 fw-medium d-flex"><i className="ph-fill ph-star"></i></span>
                                                    <span className="text-xs text-gray-400 fw-medium d-flex"><i className="ph-fill ph-star"></i></span>
                                                </div>
                                                <span className="flex-shrink-0 text-gray-900">2</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section >

            {/* Similar Products Section */}
            <section className="new-arrival pb-120">
                <div className="container container-lg">
                    <div className="section-heading">
                        <div className="flex-wrap gap-8 flex-between">
                            <h5 className="mb-0">Sản phẩm tương tự</h5>
                            <div className="gap-16 flex-align">
                                <div className="gap-8 flex-align">
                                    <button
                                        type="button"
                                        className="text-xl border border-gray-100 slick-prev flex-center rounded-circle hover-border-main-600 hover-bg-main-600 hover-text-white transition-1"
                                        onClick={() => sliderRef.current?.slickPrev()}
                                        style={{ width: '40px', height: '40px' }}
                                    >
                                        <i className="ph ph-caret-left"></i>
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xl border border-gray-100 slick-next flex-center rounded-circle hover-border-main-600 hover-bg-main-600 hover-text-white transition-1"
                                        onClick={() => sliderRef.current?.slickNext()}
                                        style={{ width: '40px', height: '40px' }}
                                    >
                                        <i className="ph ph-caret-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Slider
                        ref={sliderRef}
                        className="similar-products-slider arrow-style-two"
                        dots={false}
                        infinite={true}
                        speed={500}
                        slidesToShow={5}
                        slidesToScroll={1}
                        arrows={false}
                        responsive={[
                            {
                                breakpoint: 1400,
                                settings: {
                                    slidesToShow: 4,
                                    slidesToScroll: 1,
                                }
                            },
                            {
                                breakpoint: 1024,
                                settings: {
                                    slidesToShow: 3,
                                    slidesToScroll: 1,
                                }
                            },
                            {
                                breakpoint: 768,
                                settings: {
                                    slidesToShow: 2,
                                    slidesToScroll: 1,
                                }
                            },
                            {
                                breakpoint: 480,
                                settings: {
                                    slidesToShow: 1,
                                    slidesToScroll: 1,
                                }
                            }
                        ]}
                    >
                        <div>
                            <div className="border border-gray-100 product-card h-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                <Link href="/product-details/nuoc-yen-sao-dong-trung" className="flex-center rounded-8 bg-gray-50 position-relative">
                                    <img src="https://sieuthivina.com/assets/client/images/thumbs/banh-trung-thu-2025-thu-an-nhien-banh-chay-hop-2-banh-1-tra-4.webp" alt="Nước Yến sào Đông trùng hạ thảo Nest100 - Có đường" className="w-100 rounded-top-2" />
                                </Link>
                                <div className="px-10 pb-8 mt-10 product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex">
                                    <div>
                                        <div className="mt-5 flex-align justify-content-between">
                                            <div className="gap-4 flex-align w-100">
                                                <span className="text-main-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                                <span className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'inline-block' }}>Trung Tâm Bán Hàng Siêu Thị Vina</span>
                                            </div>
                                        </div>
                                        <h6 className="mt-2 mb-2 text-lg title fw-semibold">
                                            <Link href="/product-details/nuoc-yen-sao-dong-trung" className="link text-line-2">Nước Yến sào Đông trùng hạ thảo Nest100 - Có đường</Link>
                                        </h6>
                                        <div className="mt-2 flex-align justify-content-between">
                                            <div className="gap-6 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">Đánh giá</span>
                                                <span className="text-xs text-gray-500 fw-medium">4.8 <i className="ph-fill ph-star text-warning-600"></i></span>
                                            </div>
                                            <div className="gap-4 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">2386</span>
                                                <span className="text-xs text-gray-500 fw-medium">Đã bán</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 product-card__price">
                                        <span className="text-lg text-heading fw-semibold">43.000 đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="border border-gray-100 product-card h-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                <Link href="/product-details/nuoc-yen-sao-nest100-hop-5" className="flex-center rounded-8 bg-gray-50 position-relative">
                                    <img src="https://sieuthivina.com/assets/client/images/thumbs/nuoc-yen-sao-nest100-lon-190ml-hop-5-lon-1.webp" alt="Nước Yến Sào NEST100 - Lon 190ml Hộp 5 Lon" className="w-100 rounded-top-2" />
                                </Link>
                                <div className="px-10 pb-8 mt-10 product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex">
                                    <div>
                                        <div className="mt-5 flex-align justify-content-between">
                                            <div className="gap-4 flex-align w-100">
                                                <span className="text-main-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                                <span className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'inline-block' }}>Trung Tâm Bán Hàng Siêu Thị Vina</span>
                                            </div>
                                        </div>
                                        <h6 className="mt-2 mb-2 text-lg title fw-semibold">
                                            <Link href="/product-details/nuoc-yen-sao-nest100-hop-5" className="link text-line-2">Nước Yến Sào NEST100 - Lon 190ml Hộp 5 Lon</Link>
                                        </h6>
                                        <div className="mt-2 flex-align justify-content-between">
                                            <div className="gap-6 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">Đánh giá</span>
                                                <span className="text-xs text-gray-500 fw-medium">4.8 <i className="ph-fill ph-star text-warning-600"></i></span>
                                            </div>
                                            <div className="gap-4 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">10800</span>
                                                <span className="text-xs text-gray-500 fw-medium">Đã bán</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 product-card__price">
                                        <span className="text-lg text-heading fw-semibold">51.000 đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="border border-gray-100 product-card h-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                <Link href="/product-details/nuoc-yen-sao-nest100-sang-khoang" className="flex-center rounded-8 bg-gray-50 position-relative">
                                    <img src="https://sieuthivina.com/assets/client/images/thumbs/banh-trung-thu-2025-thu-an-nhien-banh-chay-hop-2-banh-1-tra-1.webp" alt="Nước yến sào Nest100 lon 190ml - Sáng khoáng" className="w-100 rounded-top-2" />
                                </Link>
                                <div className="px-10 pb-8 mt-10 product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex">
                                    <div>
                                        <div className="mt-5 flex-align justify-content-between">
                                            <div className="gap-4 flex-align w-100">
                                                <span className="text-main-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                                <span className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'inline-block' }}>Trung Tâm Bán Hàng Siêu Thị Vina</span>
                                            </div>
                                        </div>
                                        <h6 className="mt-2 mb-2 text-lg title fw-semibold">
                                            <Link href="/product-details/nuoc-yen-sao-nest100-sang-khoang" className="link text-line-2">Nước yến sào Nest100 lon 190ml - Sáng khoáng</Link>
                                        </h6>
                                        <div className="mt-2 flex-align justify-content-between">
                                            <div className="gap-6 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">Đánh giá</span>
                                                <span className="text-xs text-gray-500 fw-medium">4.8 <i className="ph-fill ph-star text-warning-600"></i></span>
                                            </div>
                                            <div className="gap-4 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">3245</span>
                                                <span className="text-xs text-gray-500 fw-medium">Đã bán</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 product-card__price">
                                        <span className="text-lg text-heading fw-semibold">52.000 đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="border border-gray-100 product-card h-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                <Link href="/product-details/nuoc-yen-sao-nest100-khay-30" className="flex-center rounded-8 bg-gray-50 position-relative">
                                    <img src="https://sieuthivina.com/assets/client/images/thumbs/nuoc-yen-sao-nest100-lon-190ml-khay-30-lon-1.webp" alt="Nước yến sào Nest100 lon 190ml - Khay 30 lon" className="w-100 rounded-top-2" />
                                </Link>
                                <div className="px-10 pb-8 mt-10 product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex">
                                    <div>
                                        <div className="mt-5 flex-align justify-content-between">
                                            <div className="gap-4 flex-align w-100">
                                                <span className="text-main-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                                <span className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'inline-block' }}>Trung Tâm Bán Hàng Siêu Thị Vina</span>
                                            </div>
                                        </div>
                                        <h6 className="mt-2 mb-2 text-lg title fw-semibold">
                                            <Link href="/product-details/nuoc-yen-sao-nest100-khay-30" className="link text-line-2">Nước yến sào Nest100 lon 190ml - Khay 30 lon</Link>
                                        </h6>
                                        <div className="mt-2 flex-align justify-content-between">
                                            <div className="gap-6 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">Đánh giá</span>
                                                <span className="text-xs text-gray-500 fw-medium">4.8 <i className="ph-fill ph-star text-warning-600"></i></span>
                                            </div>
                                            <div className="gap-4 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">1568</span>
                                                <span className="text-xs text-gray-500 fw-medium">Đã bán</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 product-card__price">
                                        <span className="text-lg text-heading fw-semibold">285.000 đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="border border-gray-100 product-card h-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                <Link href="/product-details/nuoc-yen-sam-ginnest" className="flex-center rounded-8 bg-gray-50 position-relative">
                                    <img src="https://sieuthivina.com/assets/client/images/thumbs/nuoc-yen-sam-ginnest-co-duong-1.webp" alt="Nước Yến Sâm Ginnest – Có đường" className="w-100 rounded-top-2" />
                                </Link>
                                <div className="px-10 pb-8 mt-10 product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex">
                                    <div>
                                        <div className="mt-5 flex-align justify-content-between">
                                            <div className="gap-4 flex-align w-100">
                                                <span className="text-main-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                                <span className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'inline-block' }}>Trung Tâm Bán Hàng Siêu Thị Vina</span>
                                            </div>
                                        </div>
                                        <h6 className="mt-2 mb-2 text-lg title fw-semibold">
                                            <Link href="/product-details/nuoc-yen-sam-ginnest" className="link text-line-2">Nước Yến Sâm Ginnest – Có đường</Link>
                                        </h6>
                                        <div className="mt-2 flex-align justify-content-between">
                                            <div className="gap-6 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">Đánh giá</span>
                                                <span className="text-xs text-gray-500 fw-medium">4.8 <i className="ph-fill ph-star text-warning-600"></i></span>
                                            </div>
                                            <div className="gap-4 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">1253</span>
                                                <span className="text-xs text-gray-500 fw-medium">Đã bán</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 product-card__price">
                                        <span className="text-lg text-heading fw-semibold">44.000 đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="border border-gray-100 product-card h-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                <Link href="/product-details/ca-phe-sam-canada" className="flex-center rounded-8 bg-gray-50 position-relative">
                                    <img src="https://sieuthivina.com/assets/client/images/thumbs/ca-phe-sam-canada-1.webp" alt="Cà Phê Sâm Canada" className="w-100 rounded-top-2" />
                                </Link>
                                <div className="px-10 pb-8 mt-10 product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex">
                                    <div>
                                        <div className="mt-5 flex-align justify-content-between">
                                            <div className="gap-4 flex-align w-100">
                                                <span className="text-main-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                                <span className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'inline-block' }}>Trung Tâm Bán Hàng Siêu Thị Vina</span>
                                            </div>
                                        </div>
                                        <h6 className="mt-2 mb-2 text-lg title fw-semibold">
                                            <Link href="/product-details/ca-phe-sam-canada" className="link text-line-2">Cà Phê Sâm Canada</Link>
                                        </h6>
                                        <div className="mt-2 flex-align justify-content-between">
                                            <div className="gap-6 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">Đánh giá</span>
                                                <span className="text-xs text-gray-500 fw-medium">4.8 <i className="ph-fill ph-star text-warning-600"></i></span>
                                            </div>
                                            <div className="gap-4 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">13600</span>
                                                <span className="text-xs text-gray-500 fw-medium">Đã bán</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 product-card__price">
                                        <span className="text-lg text-heading fw-semibold">110.000 đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="border border-gray-100 product-card h-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                <Link href="/product-details/ca-phe-linh-chi" className="flex-center rounded-8 bg-gray-50 position-relative">
                                    <img src="https://sieuthivina.com/assets/client/images/thumbs/ca-phe-bao-tu-linh-chi-pha-vach-giup-tinh-tao-1.webp" alt="Cà phê bào tử Linh Chi phá vách" className="w-100 rounded-top-2" />
                                </Link>
                                <div className="px-10 pb-8 mt-10 product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex">
                                    <div>
                                        <div className="mt-5 flex-align justify-content-between">
                                            <div className="gap-4 flex-align w-100">
                                                <span className="text-main-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                                <span className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'inline-block' }}>Trung Tâm Bán Hàng Siêu Thị Vina</span>
                                            </div>
                                        </div>
                                        <h6 className="mt-2 mb-2 text-lg title fw-semibold">
                                            <Link href="/product-details/ca-phe-linh-chi" className="link text-line-2">Cà phê bào tử Linh Chi phá vách – Giúp tỉnh táo</Link>
                                        </h6>
                                        <div className="mt-2 flex-align justify-content-between">
                                            <div className="gap-6 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">Đánh giá</span>
                                                <span className="text-xs text-gray-500 fw-medium">4.8 <i className="ph-fill ph-star text-warning-600"></i></span>
                                            </div>
                                            <div className="gap-4 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">10300</span>
                                                <span className="text-xs text-gray-500 fw-medium">Đã bán</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 product-card__price">
                                        <div className="gap-4 flex-align text-main-two-600">
                                            <i className="text-sm ph-fill ph-seal-percent"></i> -10%
                                            <span className="text-sm text-gray-400 fw-semibold text-decoration-line-through">340.000 đ</span>
                                        </div>
                                        <span className="text-lg text-heading fw-semibold">306.000 đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="border border-gray-100 product-card h-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                <Link href="/product-details/hat-dieu-rang-muoi" className="flex-center rounded-8 bg-gray-50 position-relative">
                                    <img src="https://sieuthivina.com/assets/client/images/thumbs/hat-dieu-rang-muoi-loai-1-con-vo-lua-happy-nuts-500g-1.webp" alt="Hạt điều rang muối Happy Nuts 500g" className="w-100 rounded-top-2" />
                                </Link>
                                <div className="px-10 pb-8 mt-10 product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex">
                                    <div>
                                        <div className="mt-5 flex-align justify-content-between">
                                            <div className="gap-4 flex-align w-100">
                                                <span className="text-main-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                                <span className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'inline-block' }}>Trung Tâm Bán Hàng Siêu Thị Vina</span>
                                            </div>
                                        </div>
                                        <h6 className="mt-2 mb-2 text-lg title fw-semibold">
                                            <Link href="/product-details/hat-dieu-rang-muoi" className="link text-line-2">Hạt điều rang muối loại 1 (còn vỏ lụa) Happy Nuts 500g</Link>
                                        </h6>
                                        <div className="mt-2 flex-align justify-content-between">
                                            <div className="gap-6 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">Đánh giá</span>
                                                <span className="text-xs text-gray-500 fw-medium">4.8 <i className="ph-fill ph-star text-warning-600"></i></span>
                                            </div>
                                            <div className="gap-4 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">782</span>
                                                <span className="text-xs text-gray-500 fw-medium">Đã bán</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 product-card__price">
                                        <div className="gap-4 flex-align text-main-two-600">
                                            <i className="text-sm ph-fill ph-seal-percent"></i> -10%
                                            <span className="text-sm text-gray-400 fw-semibold text-decoration-line-through">282.000 đ</span>
                                        </div>
                                        <span className="text-lg text-heading fw-semibold">253.800 đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="border border-gray-100 product-card h-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                <Link href="/product-details/banh-trung-thu" className="flex-center rounded-8 bg-gray-50 position-relative">
                                    <img src="https://sieuthivina.com/assets/client/images/thumbs/banh-trung-thu-2025-thu-an-nhien-banh-chay-hop-2-banh-1-tra-1.webp" alt="Bánh Trung Thu 2025" className="w-100 rounded-top-2" />
                                </Link>
                                <div className="px-10 pb-8 mt-10 product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex">
                                    <div>
                                        <div className="mt-5 flex-align justify-content-between">
                                            <div className="gap-4 flex-align w-100">
                                                <span className="text-main-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                                <span className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'inline-block' }}>Trung Tâm Bán Hàng Siêu Thị Vina</span>
                                            </div>
                                        </div>
                                        <h6 className="mt-2 mb-2 text-lg title fw-semibold">
                                            <Link href="/product-details/banh-trung-thu" className="link text-line-2">Bánh Trung Thu 2025 - Thu An Nhiên (bánh chay hộp 2 bánh 1 trà)</Link>
                                        </h6>
                                        <div className="mt-2 flex-align justify-content-between">
                                            <div className="gap-6 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">Đánh giá</span>
                                                <span className="text-xs text-gray-500 fw-medium">4.8 <i className="ph-fill ph-star text-warning-600"></i></span>
                                            </div>
                                            <div className="gap-4 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">472</span>
                                                <span className="text-xs text-gray-500 fw-medium">Đã bán</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 product-card__price">
                                        <div className="gap-4 flex-align text-main-two-600">
                                            <i className="text-sm ph-fill ph-seal-percent"></i> -70%
                                            <span className="text-sm text-gray-400 fw-semibold text-decoration-line-through">369.000 đ</span>
                                        </div>
                                        <span className="text-lg text-heading fw-semibold">110.700 đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="border border-gray-100 product-card h-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                <Link href="/product-details/keo-qua-sam" className="flex-center rounded-8 bg-gray-50 position-relative">
                                    <img src="https://sieuthivina.com/assets/client/images/thumbs/keo-qua-sam-khong-duong-free-suger-ginseng-berry-s-candy-200g-1.webp" alt="Kẹo Quả Sâm không đường" className="w-100 rounded-top-2" />
                                </Link>
                                <div className="px-10 pb-8 mt-10 product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex">
                                    <div>
                                        <div className="mt-5 flex-align justify-content-between">
                                            <div className="gap-4 flex-align w-100">
                                                <span className="text-main-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                                <span className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'inline-block' }}>Trung Tâm Bán Hàng Siêu Thị Vina</span>
                                            </div>
                                        </div>
                                        <h6 className="mt-2 mb-2 text-lg title fw-semibold">
                                            <Link href="/product-details/keo-qua-sam" className="link text-line-2">Kẹo Quả Sâm không đường Free Suger Ginseng Berry S candy 200g</Link>
                                        </h6>
                                        <div className="mt-2 flex-align justify-content-between">
                                            <div className="gap-6 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">Đánh giá</span>
                                                <span className="text-xs text-gray-500 fw-medium">4.8 <i className="ph-fill ph-star text-warning-600"></i></span>
                                            </div>
                                            <div className="gap-4 flex-align">
                                                <span className="text-xs text-gray-500 fw-medium">187</span>
                                                <span className="text-xs text-gray-500 fw-medium">Đã bán</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 product-card__price">
                                        <div className="gap-4 flex-align text-main-two-600">
                                            <i className="text-sm ph-fill ph-seal-percent"></i> -25%
                                            <span className="text-sm text-gray-400 fw-semibold text-decoration-line-through">249.000 đ</span>
                                        </div>
                                        <span className="text-lg text-heading fw-semibold">186.750 đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Slider>
                </div>
            </section>

            <FullFooter />
        </>
    );
}
