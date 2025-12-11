"use client";
import React, { useState, useEffect, use, useRef } from "react";
import { useSearchParams } from "next/navigation";
import FullHeader from "@/components/FullHeader";
import FullFooter from "@/components/FullFooter";
import Link from "next/link";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { fetchProductDetail, type ProductDetail, type SimilarProduct } from "@/lib/api";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import Cookies from "js-cookie";

// Thêm type cho item favorite
type FavoriteItem = {
  id?: number;
  id_sanpham?: number | string;
  sanpham_id?: number | string;
  sanpham?: { id?: number } | null;
  // thêm fields nếu API trả thêm (vd: created_at, user_id, ...)
};
export default function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
    const searchParams = useSearchParams();
    const categoryName = searchParams?.get("category") || "";
    const resolvedParams = use(params);
    const slug = resolvedParams.slug;
    const sliderRef = useRef<Slider>(null);
    const API = process.env.NEXT_PUBLIC_SERVER_API ?? "http://148.230.100.215";

    const { addToCart } = useCart();

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState("description");
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [addingToCart, setAddingToCart] = useState(false);
    const [addedSuccess, setAddedSuccess] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [favLoading, setFavLoading] = useState(false);
    const [favoriteId, setFavoriteId] = useState<number | null>(null);

    // Lấy biến thể đang chọn (hoặc biến thể đầu tiên nếu chưa chọn)
    const selectedVariant = product?.bienthe_khichon_loaibienthe_themvaogio?.find(
        v => v.id_bienthe === selectedVariantId
    ) || product?.bienthe_khichon_loaibienthe_themvaogio?.[0];

    // Lấy giá hiển thị (ưu tiên biến thể, fallback sang product.gia)
    const firstVariant = product?.bienthe_khichon_loaibienthe_themvaogio?.[0];
    const displayPrice = selectedVariant?.giahientai || firstVariant?.giahientai || product?.gia?.current || 0;
    const originalPrice = selectedVariant?.giagoc || firstVariant?.giagoc || product?.gia?.before_discount || displayPrice;
    const discountPercent = selectedVariant?.giamgia || firstVariant?.giamgia || product?.gia?.discount_percent || 0;

    // // Debug log
    // console.log("=== Price Debug ===", {
    //     selectedVariant,
    //     firstVariant,
    //     displayPrice,
    //     originalPrice,
    //     discountPercent,
    //     productGia: product?.gia,
    //     bienthe: product?.bienthe_khichon_loaibienthe_themvaogio
    // });

    const getAuthHeaders = (): Record<string, string> => {
        if (typeof window === "undefined") return {};
        
        const token = Cookies.get("token") || Cookies.get("access_token") || null;
        return token ? { Authorization: `Bearer ${token}` } : {};
    };
    // Xử lý thêm vào giỏ hàng
    const handleAddToCart = async () => {
        if (!product) return;

        setAddingToCart(true);
        try {
            const mainImage = product.anh_san_pham?.[0]?.hinhanh || product.hinh_anh;

            // Lấy loại biến thể từ variant đang chọn
            const _rawVariantName = selectedVariant?.loai_bien_the ?? product?.bienthe_khichon_loaibienthe_themvaogio?.[0]?.loai_bien_the ?? "";
            const variantName = _rawVariantName === null || _rawVariantName === undefined
                ? undefined
                : String(_rawVariantName).trim() || undefined;

            const productInput = {
                id_bienthe: selectedVariant?.id_bienthe || product.id,
                ten: product.ten,
                mediaurl: mainImage,
                hinhanh: mainImage,
                gia: {
                    current: displayPrice,
                    before_discount: originalPrice,
                    discount_percent: discountPercent
                },
                price: displayPrice,
                loaibienthe: variantName,
                thuonghieu: product.thuonghieu || "",
                slug: product.slug || slug
            };

            console.log("📦 Adding to cart with full info:", productInput);

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
        fetchProductDetail(slug)
            .then((res) => {
                // console.log("=== API Response ===", res);
                // console.log("=== Product Data ===", res.data);
                // console.log("=== Bien the ===", res.data?.bienthe_khichon_loaibienthe_themvaogio);
                if (res.data) {
                    setProduct(res.data);
                    setSimilarProducts(res.sanpham_tuongtu || []);
                    // Set biến thể mặc định
                    if (res.data.bienthe_khichon_loaibienthe_themvaogio?.length) {
                        setSelectedVariantId(res.data.bienthe_khichon_loaibienthe_themvaogio[0].id_bienthe);
                    }
                    setError(null);
                } else {
                    setError("Không tìm thấy sản phẩm");
                }
            })
            .catch((err) => {
                console.error("=== API Error ===", err);
                setError(err.message || "Lỗi tải dữ liệu sản phẩm");
            })
            .finally(() => setLoading(false));
    }, [slug]);
    useEffect(() => {
        if (!product) return;
        setFavLoading(true);
        fetch(`${API}/api/tai-khoan/yeuthichs`, { credentials: "include" , headers: { ...getAuthHeaders() } })
            .then(async (res) => {
                if (!res.ok) return { status: false, data: [] as FavoriteItem[] };
                return await res.json();
            })
            .then((json) => {
                const list = Array.isArray(json?.data) ? (json.data as FavoriteItem[]) : (Array.isArray(json) ? json as FavoriteItem[] : []);
                const found = list.find((item) =>
                    // phù hợp nhiều trường trả về
                    item.id_sanpham == product.id || item.sanpham?.id == product.id || item.id == product.id
                );
                if (found) {
                    setIsFavorited(true);
                    setFavoriteId(typeof found.id === "number" ? found.id : (found.id ? Number(found.id) : null));
                } else {
                    setIsFavorited(false);
                    setFavoriteId(null);
                }
            })
            .catch((err: unknown) => {
                console.error("Load favorites error", err);
            })
            .finally(() => setFavLoading(false));
    }, [product]);

    // NEW: toggle favorite (POST để thêm, PUT để cập nhật/xóa)
    const toggleFavorite = async () => {
        if (!product) return;
        setFavLoading(true);
        try {
            if (!isFavorited) {
                const res = await fetch(`${API}/api/tai-khoan/yeuthichs`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                    credentials: "include",
                    body: JSON.stringify({ id_sanpham: product.id }),
                });
                const json = await res.json().catch(() => ({}));
                if (res.ok) {
                    setIsFavorited(true);
                    // API thường trả data object chứa id record
                    setFavoriteId(json?.data?.id ?? json?.id ?? null);
                } else {
                    console.error("Failed to add favorite", json);
                }
            } else {
                // dùng favoriteId (id record) để gọi PUT theo API mẫu
                let idToToggle = favoriteId;
                if (!idToToggle) {
                    // không có favoriteId: refetch list nhanh để tìm id
                    const r = await fetch(`${API}/api/tai-khoan/yeuthichs`, { credentials: "include" , headers: { ...getAuthHeaders() } });
                    const j = await r.json().catch(() => ({}));
                    const list = Array.isArray(j?.data) ? j.data as FavoriteItem[] : [];
                    const found = list.find(item => item.id_sanpham == product.id || item.sanpham?.id == product.id);
                    idToToggle = found?.id ?? null;
                }
                if (!idToToggle) {
                    console.error("Cannot find favorite record id to remove");
                } else {
                    const res = await fetch(`${API}/api/tai-khoan/yeuthichs/${idToToggle}`, {
                        method: "PATCH",
                        credentials: "include",
                        headers: { ...getAuthHeaders() },
                    });
                    const json = await res.json().catch(() => ({}));
                    if (res.ok) {
                        setIsFavorited(false);
                        setFavoriteId(null);
                    } else {
                        console.error("Failed to remove favorite", json);
                    }
                }
            }
        } catch (err: unknown) {
            console.error("Toggle favorite error", err);
        } finally {
            setFavLoading(false);
        }
    };

    // Xử lý danh sách hình ảnh từ API mới
    const productImages = product?.anh_san_pham && product.anh_san_pham.length > 0
        ? product.anh_san_pham.map(img => img.hinhanh)
        : product?.images && product.images.length > 0
            ? product.images
            : product?.hinh_anh
                ? [product.hinh_anh]
                : product?.mediaurl
                    ? [product.mediaurl]
                    : ["/assets/images/thumbs/product-two-img1.png"];

    // Helper format giá
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN').format(Math.round(price)) + ' đ';
    };

    // Lấy số đã bán
    const getSoldCount = () => {
        if (typeof product?.sold === 'object' && product.sold?.total_sold !== undefined) {
            return product.sold.total_sold;
        }
        if (typeof product?.sold === 'number') {
            return product.sold;
        }
        if (product?.sold_count) {
            return parseInt(product.sold_count);
        }
        return 0;
    };

    // Lấy rating
    const getRating = () => {
        if (product?.rating) {
            return product.rating.average || 0;
        }
        return 0;
    };

    if (loading) {
        return (
            <>
                <FullHeader showClassicTopBar={true} showTopNav={false} />
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
                <FullHeader showClassicTopBar={true} showTopNav={false} />
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
            <FullHeader showClassicTopBar={true} showTopNav={false} />

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
                                                {discountPercent > 0 && (
                                                    <>
                                                        <span className="text-gray-400 text-md fw-semibold text-decoration-line-through">
                                                            {originalPrice.toLocaleString()} ₫
                                                        </span>
                                                        <span className="px-8 py-4 text-xs text-white bg-main-600 rounded-pill">
                                                            -{discountPercent}%
                                                        </span>
                                                    </>
                                                )}
                                                <h6 className="mb-0 text-2xl text-main-600 mt-30">{displayPrice.toLocaleString()} ₫</h6>
                                            </div>
                                        </div>

                                        {/* Product Variants - Dynamic from API */}
                                        {product.loai_bien_the && product.loai_bien_the.length > 0 && product.bienthe_khichon_loaibienthe_themvaogio && product.bienthe_khichon_loaibienthe_themvaogio.length > 0 && (
                                            <div className="mb-32">
                                                <h6 className="mb-16">Loại sản phẩm</h6>
                                                <div className="flex-wrap gap-16 flex-between align-items-start">
                                                    <div>
                                                        <div className="flex-wrap gap-8 flex-align">
                                                            {product.bienthe_khichon_loaibienthe_themvaogio.map((variant) => {
                                                                // Tìm tên loại biến thể tương ứng
                                                                const variantType = product.loai_bien_the?.find(
                                                                    lt => lt.id_loaibienthe === variant.loai_bien_the
                                                                );
                                                                const variantName = variantType?.ten || `Biến thể ${variant.id_bienthe}`;
                                                                const isSelected = selectedVariantId === variant.id_bienthe;

                                                                return (
                                                                    <React.Fragment key={variant.id_bienthe}>
                                                                        <input
                                                                            type="radio"
                                                                            id={`bienthe-${variant.id_bienthe}`}
                                                                            name="id_bienthe"
                                                                            value={variant.id_bienthe}
                                                                            checked={isSelected}
                                                                            onChange={() => setSelectedVariantId(variant.id_bienthe)}
                                                                            className="d-none"
                                                                        />
                                                                        <label
                                                                            htmlFor={`bienthe-${variant.id_bienthe}`}
                                                                            className={`px-12 py-8 border border-2 color-list__button rounded-8 hover-border-main-600 transition-1 ${isSelected ? 'border-main-600 bg-main-50' : ''}`}
                                                                            style={{ cursor: "pointer" }}
                                                                        >
                                                                            {variantName}
                                                                        </label>
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

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
                                        {(displayPrice * quantity).toLocaleString('vi-VN')} đ
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
                                                                        <button
                                        type="button"
                                        onClick={toggleFavorite}
                                        disabled={favLoading}
                                        className="d-flex text-main-600 text-28 btn-reset"
                                        title={isFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                                        aria-pressed={isFavorited}
                                    >
                                        <i
                                            className={isFavorited ? "ph-fill ph-heart" : "ph ph-heart"}
                                            style={isFavorited ? { color: "#E53935" } : undefined}
                                        />
                                    </button>
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

            {/* Similar Products Section - Dynamic */}
            {similarProducts.length > 0 && (
                <section className="new-arrival pb-120">
                    <div className="container container-lg">
                        <div className="section-heading">
                            <div className="flex-wrap gap-8 flex-between">
                                <h5 className="mb-0">Sản phẩm tương tự</h5>
                                <div className="gap-16 flex-align">
                                    <div className="gap-8 flex-align">
                                        <button
                                            type="button"
                                            title="Sản phẩm trước"
                                            aria-label="Xem sản phẩm trước"
                                            className="text-xl border border-gray-100 slick-prev flex-center rounded-circle hover-border-main-600 hover-bg-main-600 hover-text-white transition-1 similar-nav-btn"
                                            onClick={() => sliderRef.current?.slickPrev()}
                                        >
                                            <i className="ph ph-caret-left"></i>
                                        </button>
                                        <button
                                            type="button"
                                            title="Sản phẩm tiếp"
                                            aria-label="Xem sản phẩm tiếp theo"
                                            className="text-xl border border-gray-100 slick-next flex-center rounded-circle hover-border-main-600 hover-bg-main-600 hover-text-white transition-1 similar-nav-btn"
                                            onClick={() => sliderRef.current?.slickNext()}
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
                            infinite={similarProducts.length > 5}
                            speed={500}
                            slidesToShow={Math.min(5, similarProducts.length)}
                            slidesToScroll={1}
                            arrows={false}
                            responsive={[
                                {
                                    breakpoint: 1400,
                                    settings: {
                                        slidesToShow: Math.min(4, similarProducts.length),
                                        slidesToScroll: 1,
                                    }
                                },
                                {
                                    breakpoint: 1024,
                                    settings: {
                                        slidesToShow: Math.min(3, similarProducts.length),
                                        slidesToScroll: 1,
                                    }
                                },
                                {
                                    breakpoint: 768,
                                    settings: {
                                        slidesToShow: Math.min(2, similarProducts.length),
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
                            {similarProducts.map((similarProduct) => (
                                <div key={similarProduct.id}>
                                    <div className="border border-gray-100 product-card h-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                        <Link href={`/product-details/${similarProduct.slug}`} className="flex-center rounded-8 bg-gray-50 position-relative">
                                            <img
                                                src={similarProduct.hinh_anh}
                                                alt={similarProduct.ten}
                                                className="w-100 rounded-top-2"
                                                onError={(e) => {
                                                    const img = e.currentTarget as HTMLImageElement;
                                                    img.onerror = null;
                                                    img.src = "/assets/images/thumbs/placeholder.png";
                                                }}
                                            />
                                            {similarProduct.have_gift && (
                                                <span className="px-8 py-4 text-sm text-white product-card__badge bg-success-600 position-absolute inset-inline-start-0 inset-block-start-0">
                                                    Có quà
                                                </span>
                                            )}
                                        </Link>
                                        <div className="px-10 pb-8 mt-10 product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex">
                                            <div>
                                                <div className="mt-5 flex-align justify-content-between">
                                                    <div className="gap-4 flex-align w-100">
                                                        <span className="text-main-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                                        <span className="text-xs text-gray-500 text-truncate">Siêu Thị Vina</span>
                                                    </div>
                                                </div>
                                                <h6 className="mt-2 mb-2 text-lg title fw-semibold">
                                                    <Link href={`/product-details/${similarProduct.slug}`} className="link text-line-2">
                                                        {similarProduct.ten}
                                                    </Link>
                                                </h6>
                                                <div className="mt-2 flex-align justify-content-between">
                                                    <div className="gap-6 flex-align">
                                                        <span className="text-xs text-gray-500 fw-medium">Đánh giá</span>
                                                        <span className="text-xs text-gray-500 fw-medium">
                                                            {similarProduct.rating.average.toFixed(1)} <i className="ph-fill ph-star text-warning-600"></i>
                                                        </span>
                                                    </div>
                                                    <div className="gap-4 flex-align">
                                                        <span className="text-xs text-gray-500 fw-medium">{similarProduct.sold.total_sold}</span>
                                                        <span className="text-xs text-gray-500 fw-medium">Đã bán</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-5 product-card__price">
                                                {similarProduct.gia.discount_percent > 0 ? (
                                                    <>
                                                        <div className="gap-4 flex-align text-main-two-600">
                                                            <i className="text-sm ph-fill ph-seal-percent"></i> -{similarProduct.gia.discount_percent}%
                                                            <span className="text-sm text-gray-400 fw-semibold text-decoration-line-through">
                                                                {formatPrice(similarProduct.gia.before_discount)}
                                                            </span>
                                                        </div>
                                                        <span className="text-lg text-heading fw-semibold">
                                                            {formatPrice(similarProduct.gia.current)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-lg text-heading fw-semibold">
                                                        {formatPrice(similarProduct.gia.current)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Slider>
                    </div>
                </section>
            )}

            <FullFooter />
        </>
    );
}
