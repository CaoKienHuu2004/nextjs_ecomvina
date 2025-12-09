'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import FullHeader from '@/components/FullHeader';
import FullFooter from '@/components/FullFooter';

interface Product {
    id: number;
    ten: string;
    slug: string;
    mediaurl?: string;
    hinh_anh?: string;
    selling_price?: number;
    original_price?: number | null;
    shop_name?: string;
    store?: { name: string };
    rating?: number;
    rating_obj?: { average: number; count: number };
    sold?: number;
    discount_percent?: number | null;
    gia?: { current: number; before_discount?: number; discount_percent?: number };
}

export default function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [selectedImage, setSelectedImage] = useState(0);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const resolvedParams = React.use(params);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const slug = resolvedParams.slug;
                const API = process.env.NEXT_PUBLIC_SERVER_API || 'http://148.230.100.215';

                const response = await fetch(`${API}/api/featured-products`);
                const data = await response.json();
                const products = data.data || data;
                let found = products.find((p: Product) => p.slug === slug);

                if (!found) {
                    const categoryResponse = await fetch(`${API}/api/sanphams-selection`);
                    const categoryData = await categoryResponse.json();
                    const categories = categoryData.data?.top_categories || [];

                    for (const category of categories) {
                        const product = category.sanpham?.find((p: Product) => p.slug === slug);
                        if (product) {
                            found = {
                                id: product.id,
                                ten: product.ten,
                                slug: product.slug,
                                mediaurl: product.hinh_anh,
                                hinh_anh: product.hinh_anh,
                                selling_price: product.gia?.current || 0,
                                original_price: product.gia?.before_discount || null,
                                shop_name: product.store?.name || 'Shop',
                                rating: product.rating?.average || 0,
                                sold: product.rating?.count || 0,
                                discount_percent: product.gia?.discount_percent || null
                            };
                            break;
                        }
                    }
                }

                if (found) {
                    setProduct(found);
                    setRelatedProducts(products.slice(0, 3));
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [resolvedParams.slug]);

    if (loading) {
        return (
            <>
                <FullHeader showClassicTopBar={true} showTopNav={false} />
                <div className="py-40 text-center">Đang tải...</div>
                <FullFooter />
            </>
        );
    }

    if (!product) {
        return (
            <>
                <FullHeader showClassicTopBar={true} showTopNav={false} />
                <div className="py-40 text-center">Không tìm thấy sản phẩm</div>
                <FullFooter />
            </>
        );
    }

    const discountedPrice = product.selling_price || product.gia?.current || 0;
    const originalPrice = product.original_price || product.gia?.before_discount || null;
    const discountPercent = product.discount_percent || product.gia?.discount_percent || null;
    const shopName = product.shop_name || product.store?.name || 'Shop';
    const productRating = product.rating || product.rating_obj?.average || 0;
    const productSold = product.sold || product.rating_obj?.count || 0;
    const imageUrl = product.mediaurl || product.hinh_anh || '/assets/images/thumbs/product-two-img1.png';

    // Tạo array ảnh (giả định có 6 ảnh)
    const images = Array(6).fill(imageUrl);

    return (
        <>
            <FullHeader showClassicTopBar={true} showTopNav={false} />

            <section className="pt-40 product-details">
                <div className="container container-lg">
                    <div className="row gy-4">
                        {/* Left Column - Image Gallery */}
                        <div className="col-xl-9">
                            <div className="row gy-4">
                                <div className="col-xl-6">
                                    <div className="product-details__left">
                                        {/* Main Image */}
                                        <div className="p-0 mb-24 border border-gray-100 product-details__thumb-slider rounded-16">
                                            <div className="product-details__thumb flex-center h-100">
                                                <img
                                                    src={images[selectedImage]}
                                                    alt={product.ten}
                                                    className="rounded-10 w-100"
                                                    style={{ height: '450px', objectFit: 'cover' }}
                                                />
                                            </div>
                                        </div>

                                        {/* Thumbnail Gallery */}
                                        <div className="product-details__images-slider">
                                            <div className="gap-8 overflow-auto d-flex">
                                                {images.map((img, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`max-w-120 max-h-120 h-100 flex-center rounded-16 border cursor-pointer transition-all ${selectedImage === idx ? 'border-main-600 border-2' : 'border-gray-100'
                                                            }`}
                                                        onClick={() => setSelectedImage(idx)}
                                                    >
                                                        <img
                                                            src={img}
                                                            alt={`thumbnail-${idx}`}
                                                            className="rounded-10 w-100 h-100"
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Product Info */}
                                <div className="col-xl-6">
                                    <div className="product-details__content">
                                        <h5 className="mb-12">{product.ten}</h5>

                                        {/* Rating & Sales */}
                                        <div className="flex-wrap gap-12 mt-10 flex-align">
                                            <div className="flex-wrap gap-4 flex-align">
                                                <div className="gap-8 flex-align">
                                                    <span className="text-xl fw-medium text-warning-600 d-flex">
                                                        <i className="ph-fill ph-star"></i>
                                                    </span>
                                                </div>
                                                <span className="text-md fw-medium text-neutral-600">{productRating} </span>
                                                <span className="text-sm text-gray-500 fw-medium">({productSold})</span>
                                            </div>
                                            <span className="text-gray-500 text-md fw-medium">|</span>
                                            <div className="gap-8 flex-align">
                                                <span className="text-md fw-medium text-neutral-600">Lượt bán: </span>
                                                <span className="text-gray-500 text-md fw-medium">{productSold}</span>
                                            </div>
                                        </div>

                                        {/* Product Details List */}
                                        <ul className="mt-30">
                                            <li className="text-gray-400 mb-14 flex-align gap-14">
                                                <span className="w-20 h-20 text-xs bg-main-50 text-main-600 flex-center rounded-circle">
                                                    <i className="ph ph-check"></i>
                                                </span>
                                                <span className="text-heading fw-medium">
                                                    Cửa hàng: <span className="text-gray-500">{shopName}</span>
                                                </span>
                                            </li>
                                            <li className="text-gray-400 mb-14 flex-align gap-14">
                                                <span className="w-20 h-20 text-xs bg-main-50 text-main-600 flex-center rounded-circle">
                                                    <i className="ph ph-check"></i>
                                                </span>
                                                <span className="text-heading fw-medium">
                                                    Tình trạng: <span className="text-gray-500">Còn hàng</span>
                                                </span>
                                            </li>
                                        </ul>

                                        {/* Price */}
                                        <div className="flex-wrap gap-16 mb-32 flex-align mt-30">
                                            <div className="gap-8 flex-align">
                                                <h6 className="mb-0 text-2xl text-main-600">
                                                    {discountedPrice.toLocaleString('vi-VN')} ₫
                                                </h6>
                                            </div>
                                            {originalPrice && discountPercent && (
                                                <span className="text-gray-400 text-decoration-line-through">
                                                    {originalPrice.toLocaleString('vi-VN')} ₫
                                                </span>
                                            )}
                                        </div>

                                        <span className="mt-32 text-gray-700 border-gray-100 pt-30 border-top d-block"></span>

                                        {/* Contact Button */}
                                        <a
                                            href="https://www.whatsapp.com"
                                            className="gap-8 py-16 mt-32 btn btn-black flex-center rounded-8"
                                        >
                                            <i className="text-lg ph ph-whatsapp-logo"></i>
                                            Liên hệ với cửa hàng
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Description & Reviews Tabs */}
                            <div className="pt-80">
                                <div className="border product-dContent rounded-24">
                                    <div className="flex-wrap gap-16 border-gray-100 product-dContent__header border-bottom flex-between">
                                        <ul className="mb-3 nav common-tab nav-pills">
                                            <li className="nav-item">
                                                <button
                                                    className={`nav-link ${activeTab === 'description' ? 'active' : ''}`}
                                                    onClick={() => setActiveTab('description')}
                                                >
                                                    Mô tả sản phẩm
                                                </button>
                                            </li>
                                            <li className="nav-item">
                                                <button
                                                    className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
                                                    onClick={() => setActiveTab('reviews')}
                                                >
                                                    Đánh giá
                                                </button>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="py-20 product-dContent__box">
                                        {activeTab === 'description' && (
                                            <div className="tab-pane fade show active">
                                                <div className="p-24 mb-40">
                                                    <h6 className="mb-24">Mô tả về sản phẩm</h6>
                                                    <p className="mb-16 text-gray-600">{product.ten}</p>
                                                    <ul className="mt-32 list-inside ms-16">
                                                        <li className="mb-4 text-gray-400">Sản phẩm chất lượng cao</li>
                                                        <li className="mb-4 text-gray-400">Giá cạnh tranh trên thị trường</li>
                                                        <li className="mb-4 text-gray-400">Giao hàng nhanh chóng</li>
                                                        <li className="mb-4 text-gray-400">Hỗ trợ khách hàng 24/7</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'reviews' && (
                                            <div className="tab-pane fade show active">
                                                <div className="p-24">
                                                    <div className="row g-4">
                                                        <div className="col-lg-6">
                                                            <h6 className="mb-24 title">Đánh giá từ khách hàng</h6>
                                                            <div className="gap-24 pb-24 d-flex align-items-start">
                                                                <div className="flex-shrink-0 w-52 h-52 bg-main-100 text-main-600 rounded-circle flex-center">
                                                                    <i className="text-2xl ph-fill ph-user"></i>
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                    <h6 className="mb-12 text-md">Khách hàng ẩn danh</h6>
                                                                    <div className="gap-8 flex-align">
                                                                        {Array(5).fill(0).map((_, i) => (
                                                                            <span key={i} className="text-md fw-medium text-warning-600 d-flex">
                                                                                <i className="ph-fill ph-star"></i>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    <p className="mt-10 text-gray-700">Sản phẩm tốt, giao hàng nhanh</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-6">
                                                            <div className="px-40 text-center border border-gray-100 rounded-8 py-52 flex-center flex-column">
                                                                <h2 className="mb-6 text-main-600">{productRating}</h2>
                                                                <div className="gap-8 flex-center">
                                                                    {Array(5).fill(0).map((_, i) => (
                                                                        <span key={i} className="text-xs fw-medium text-warning-600 d-flex">
                                                                            <i className="ph-fill ph-star"></i>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <span className="mt-16 text-gray-500">Điểm đánh giá trung bình</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="col-xl-3">
                            <div className="px-32 py-40 border border-gray-100 product-details__sidebar rounded-16">
                                <div className="mb-20">
                                    <h6 className="mb-8 text-heading fw-semibold d-block">Giỏ hàng</h6>
                                    <div className="overflow-hidden d-flex rounded-4">
                                        <button
                                            type="button"
                                            className="flex-shrink-0 w-48 h-48 quantity__minus text-neutral-600 bg-gray-50 flex-center hover-bg-main-600 hover-text-white"
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        >
                                            <i className="ph ph-minus"></i>
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            min="1"
                                            className="w-32 px-16 text-center border border-gray-100 quantity__input flex-grow-1 border-start-0 border-end-0"
                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        />
                                        <button
                                            type="button"
                                            className="flex-shrink-0 w-48 h-48 quantity__plus text-neutral-600 bg-gray-50 flex-center hover-bg-main-600 hover-text-white"
                                            onClick={() => setQuantity(quantity + 1)}
                                        >
                                            <i className="ph ph-plus"></i>
                                        </button>
                                    </div>
                                </div>

                                <Link
                                    href="/gio-hang"
                                    className="gap-8 py-16 mt-10 btn btn-main flex-center rounded-8 fw-normal w-100"
                                >
                                    <i className="text-lg ph ph-shopping-cart-simple"></i>
                                    Thêm vào giỏ hàng
                                </Link>

                                <div className="mt-32">
                                    <a href="#" className="gap-12 px-16 py-8 mb-0 bg-main-50 rounded-8 flex-between d-flex align-items-center">
                                        <span className="flex-shrink-0 text-xl bg-white text-main-600 rounded-circle flex-center" style={{ width: '40px', height: '40px' }}>
                                            <i className="ph-fill ph-storefront"></i>
                                        </span>
                                        <span className="text-sm text-neutral-600">
                                            <span className="fw-semibold">{shopName}</span>
                                        </span>
                                    </a>
                                </div>

                                <div className="mt-32">
                                    <div className="gap-8 px-32 py-16 border border-gray-100 rounded-8 flex-between">
                                        <a href="#" className="d-flex text-main-600 text-28">
                                            <i className="ph-fill ph-chats-teardrop"></i>
                                        </a>
                                        <span className="border border-gray-100 h-26"></span>
                                        <div className="dropdown on-hover-item">
                                            <button className="d-flex text-main-600 text-28" type="button">
                                                <i className="ph-fill ph-share-network"></i>
                                            </button>
                                            <div className="border-0 on-hover-dropdown common-dropdown">
                                                <ul className="gap-16 flex-align">
                                                    {[
                                                        { icon: 'ph-fill ph-facebook-logo', url: 'https://www.facebook.com' },
                                                        { icon: 'ph-fill ph-twitter-logo', url: 'https://www.twitter.com' },
                                                        { icon: 'ph-fill ph-instagram-logo', url: 'https://www.instagram.com' }
                                                    ].map((social, idx) => (
                                                        <li key={idx}>
                                                            <a
                                                                href={social.url}
                                                                className="text-xl w-44 h-44 flex-center bg-main-100 text-main-600 rounded-circle hover-bg-main-600 hover-text-white"
                                                            >
                                                                <i className={social.icon}></i>
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="mt-40 new-arrival pb-80">
                    <div className="container">
                        <div className="section-heading">
                            <div className="flex-wrap gap-8 flex-between">
                                <h5 className="mb-0">Sản phẩm liên quan</h5>
                            </div>
                        </div>
                        <div className="row g-12">
                            {relatedProducts.slice(0, 4).map((p) => (
                                <div key={p.id} className="col-lg-3 col-md-6">
                                    <div className="p-8 border border-gray-100 product-card h-100 hover-border-main-600 rounded-16 position-relative transition-2">
                                        {p.discount_percent ? (
                                            <span className="px-8 py-4 text-sm text-white product-card__badge bg-danger-600">
                                                -{p.discount_percent}%
                                            </span>
                                        ) : null}
                                        <Link href={`/product-details/${p.slug}`} className="overflow-hidden product-card__thumb flex-center">
                                            <img
                                                src={p.mediaurl || p.hinh_anh}
                                                alt={p.ten}
                                                style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                                            />
                                        </Link>
                                        <div className="product-card__content p-sm-2 w-100">
                                            <h6 className="mt-12 mb-8 text-sm title fw-semibold">
                                                <Link href={`/product-details/${p.slug}`} className="link text-line-2">
                                                    {p.ten}
                                                </Link>
                                            </h6>
                                            <div className="mt-12 product-card__content">
                                                <div className="mb-8 product-card__price">
                                                    <span className="text-heading text-md fw-semibold">
                                                        {(p.selling_price || p.gia?.current || 0).toLocaleString('vi-VN')} ₫
                                                    </span>
                                                </div>
                                                <div className="gap-6 flex-align">
                                                    <span className="text-xs text-gray-600 fw-bold">{p.rating || p.rating_obj?.average || 0}</span>
                                                    <span className="text-sm fw-bold text-warning-600 d-flex">
                                                        <i className="ph-fill ph-star"></i>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <FullFooter />
        </>
    );
}
