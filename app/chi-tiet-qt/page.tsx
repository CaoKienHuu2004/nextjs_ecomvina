'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FullHeader from '@/components/FullHeader';
import { useCart } from '@/hooks/useCart';

const API_URL = process.env.NEXT_PUBLIC_SERVER_API || 'http://148.230.100.215';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

// Interface cho quà tặng từ API /api/quatangs-all/{slug}
interface QuaTangDetail {
    id: number;
    id_bienthe: number;
    id_chuongtrinh: number;
    thongtin_thuonghieu: {
        id_thuonghieu: number;
        ten_thuonghieu: string;
        slug_thuonghieu: string;
        logo_thuonghieu: string;
    };
    dieukiensoluong: number;
    dieukiengiatri: number;
    phantram_datduoc: number;
    tieude: string;
    slug?: string;
    thongtin: string;
    hinhanh: string;
    luotxem: number;
    ngaybatdau: string;
    thoigian_conlai: number;
    ngayketthuc: string;
    trangthai: string;
    bienthe_quatang?: {
        ten_bienthe_quatang: string;
        ten_loaibienthe_quatang: string;
        slug_bienthe_quatang_sanpham: string;
        hinhanh: string;
        soluong: number;
    };
}

interface SanPhamCoQua {
    id: number;
    ten: string;
    slug: string;
    have_gift: boolean;
    hinh_anh: string;
    rating: {
        average: number;
        count: number;
    };
    luotxem: number;
    sold: {
        total_sold: number;
        total_quantity: number;
    };
    gia: {
        current: number;
        before_discount: number;
        discount_percent: number;
    };
    trangthai: {
        active: string;
        in_stock: boolean;
    };
    id_bienthe_de_them_vao_gio: number;
}

interface QuaTangResponse {
    data: QuaTangDetail;
    sanpham_coqua: SanPhamCoQua[];
}

// Fetch chi tiết quà tặng bằng slug - API: /api/quatangs-all/{slug}
async function fetchQuaTangDetail(slug: string): Promise<QuaTangResponse | null> {
    try {
        const response = await fetch(`${API_URL}/api/quatangs-all/${slug}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('Error fetching gift detail:', error);
        return null;
    }
}

export default function GiftDetailPage() {
    const searchParams = useSearchParams();
    const giftSlug = searchParams.get('slug');

    const [gift, setGift] = useState<QuaTangDetail | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<SanPhamCoQua[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [showCartAlert, setShowCartAlert] = useState(false);

    // Cart hook
    const { addToCart, loading: cartLoading, subtotal, totalItems } = useCart();

    // Lấy điều kiện từ API
    const MIN_PRODUCTS = gift?.dieukiensoluong || 3;
    const TARGET_AMOUNT = gift?.dieukiengiatri || 0;
    const hasEnoughProducts = totalItems >= MIN_PRODUCTS;
    const hasEnoughAmount = TARGET_AMOUNT === 0 || subtotal >= TARGET_AMOUNT;

    // Tính progressPercent dựa trên giỏ hàng thực tế (real-time)
    const progressPercent = React.useMemo(() => {
        // Nếu điều kiện giá trị > 0, tính theo giá trị đơn hàng
        if (TARGET_AMOUNT > 0) {
            const percent = Math.min(100, Math.round((subtotal / TARGET_AMOUNT) * 100));
            return percent;
        }
        // Nếu điều kiện số lượng, tính theo số sản phẩm
        if (MIN_PRODUCTS > 0) {
            const percent = Math.min(100, Math.round((totalItems / MIN_PRODUCTS) * 100));
            return percent;
        }
        return 0;
    }, [subtotal, totalItems, TARGET_AMOUNT, MIN_PRODUCTS]);

    // Handle add to cart - gửi kèm id_chuongtrinh để backend áp dụng quà tặng
    const handleAddToCart = async (product: SanPhamCoQua) => {
        // Lấy id_chuongtrinh từ gift data để gửi kèm khi addToCart
        const id_chuongtrinh = gift?.id_chuongtrinh;

        console.log('🛒 Adding to cart with id_chuongtrinh:', id_chuongtrinh);

        await addToCart({
            id_bienthe: product.id_bienthe_de_them_vao_gio,
            id: product.id,
            ten: product.ten,
            hinhanh: product.hinh_anh,
            gia: product.gia?.current || 0,
            id_chuongtrinh: id_chuongtrinh, // Gửi id chương trình để backend áp dụng quà tặng
        }, 1, id_chuongtrinh);

        setShowCartAlert(true);
        // Auto hide after 3 seconds
        setTimeout(() => setShowCartAlert(false), 3000);
    };

    // Fetch gift data từ API /api/quatangs-all/{slug}
    useEffect(() => {
        const loadGiftData = async () => {
            // Cần có slug
            if (!giftSlug) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetchQuaTangDetail(giftSlug);
                console.log('🎁 API Response:', response);
                console.log('🎁 dieukiengiatri:', response?.data?.dieukiengiatri);
                console.log('🎁 dieukiensoluong:', response?.data?.dieukiensoluong);

                if (response?.data) {
                    setGift(response.data);
                    setRelatedProducts(response.sanpham_coqua || []);
                }
            } catch (error) {
                console.error('Error loading gift data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadGiftData();
    }, [giftSlug]);

    // Calculate time left
    const calculateTimeLeft = useCallback((): TimeLeft => {
        if (!gift?.ngayketthuc) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const difference = +new Date(gift.ngayketthuc) - +new Date();

        if (difference > 0) {
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }, [gift?.ngayketthuc]);

    // Update countdown timer
    useEffect(() => {
        if (!gift) return;

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [gift, calculateTimeLeft]);

    // Format price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN').format(price);
    };

    if (loading) {
        return (
            <>
                <FullHeader showClassicTopBar={true} showTopNav={false} />
                <div className="page">
                    <section className="product-details pt-40 pb-80">
                        <div className="container container-lg">
                            <div className="text-center py-80">
                                <div className="spinner-border text-main-600" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-16 text-gray-600">Đang tải thông tin quà tặng...</p>
                            </div>
                        </div>
                    </section>
                </div>
            </>
        );
    }

    if (!gift) {
        return (
            <>
                <FullHeader showClassicTopBar={true} showTopNav={false} />
                <div className="page">
                    <section className="product-details pt-40 pb-80">
                        <div className="container container-lg">
                            <div className="text-center py-80">
                                <i className="ph ph-gift text-6xl text-gray-400 mb-16"></i>
                                <h5 className="text-gray-600">Không tìm thấy thông tin quà tặng</h5>
                                <Link href="/qua-tang" className="btn btn-main mt-16">
                                    Quay lại danh sách quà tặng
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </>
        );
    }

    return (
        <>
            <FullHeader showClassicTopBar={true} showTopNav={false} />
            <div className="page">
                <section className="product-details pt-40 fix-scale-40">
                    <div className="container container-lg">
                        {/* Success Alert */}
                        {showCartAlert && (
                            <div className="alert alert-success alert-dismissible fade show mt-10" role="alert">
                                Đã thêm sản phẩm vào giỏ hàng !
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowCartAlert(false)}
                                    aria-label="Close"
                                ></button>
                            </div>
                        )}
                        <form action="#" method="post" className="row gy-4">
                            {/* Main Content */}
                            <div className="col-xl-9">
                                <div className="row gy-4">
                                    {/* Gift Image */}
                                    <div className="col-xl-6">
                                        <div className="product-details__left">
                                            <div className="product-details__thumb-slider rounded-16 p-0">
                                                <div className="product-details__thumb flex-center h-100">
                                                    <img
                                                        className="rounded-10"
                                                        src={gift.hinhanh}
                                                        alt={gift.tieude}
                                                        style={{ width: '100%', height: '450px', objectFit: 'cover', objectPosition: 'center' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gift Info */}
                                    <div className="col-xl-6">
                                        <div className="product-details__content">
                                            {/* Countdown Timer */}
                                            <div className="flex-center mb-24 flex-wrap gap-16 rounded-8 py-16 px-24 position-relative z-1 bg-hotsales">
                                                <div className="flex-align gap-16">
                                                    <h6 className="text-white text-md fw-medium m-0 p-0">Thời gian còn lại:</h6>
                                                </div>
                                                <div className="countdown" id="countdown-quatang">
                                                    <ul className="countdown-list flex-align flex-wrap">
                                                        <li className="countdown-list__item text-heading flex-align gap-4 text-sm fw-medium w-28 h-28 rounded-4 p-0 flex-center">
                                                            <span className="days">{timeLeft.days}</span>
                                                        </li>
                                                        <li className="countdown-list__item text-heading flex-align gap-4 text-sm fw-medium w-28 h-28 rounded-4 p-0 flex-center">
                                                            <span className="hours">{timeLeft.hours}</span>
                                                        </li>
                                                        <li className="countdown-list__item text-heading flex-align gap-4 text-sm fw-medium w-28 h-28 rounded-4 p-0 flex-center">
                                                            <span className="minutes">{timeLeft.minutes}</span>
                                                        </li>
                                                        <li className="countdown-list__item text-heading flex-align gap-4 text-sm fw-medium w-28 h-28 rounded-4 p-0 flex-center">
                                                            <span className="seconds">{timeLeft.seconds}</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <h5 className="mb-4">{gift.tieude}</h5>

                                            {/* Description */}
                                            <span className="text-md fst-italic fw-normal text-gray-600">
                                                {gift.thongtin || 'Không có thông tin chi tiết'}
                                            </span>

                                            {/* Conditions */}
                                            <ul className="mt-20">
                                                <li className="text-gray-400 mb-14 flex-align gap-14">
                                                    <span className={`w-30 h-30 ${hasEnoughProducts ? 'bg-success-100 text-success-600' : 'bg-main-100 text-main-600'} text-md flex-center rounded-circle`}>
                                                        <i className={`ph-bold ${hasEnoughProducts ? 'ph-check' : 'ph-x'}`}></i>
                                                    </span>
                                                    <span className="text-heading fw-medium">
                                                        Mua tối thiểu <span className={hasEnoughProducts ? 'text-success-600' : 'text-main-600'}>{MIN_PRODUCTS} sản phẩm</span> từ {gift.thongtin_thuonghieu?.ten_thuonghieu || 'nhà cung cấp'}
                                                    </span>
                                                </li>
                                                {(gift.dieukiengiatri ?? 0) > 0 && (
                                                    <li className="text-gray-400 mb-14 flex-align gap-14">
                                                        <span className={`w-30 h-30 ${hasEnoughAmount ? 'bg-success-100 text-success-600' : 'bg-main-100 text-main-600'} text-md flex-center rounded-circle`}>
                                                            <i className={`ph-bold ${hasEnoughAmount ? 'ph-check' : 'ph-x'}`}></i>
                                                        </span>
                                                        <span className="text-heading fw-medium">
                                                            Giá trị đơn hàng tối thiểu <span className={hasEnoughAmount ? 'text-success-600' : 'text-main-600'}>{formatPrice(gift.dieukiengiatri)} đ</span>
                                                        </span>
                                                    </li>
                                                )}
                                            </ul>

                                            <span className="mt-10 mb-10 text-gray-700 border-top border-gray-100 d-block"></span>

                                            {/* Gift Product */}
                                            <span className="flex-align mb-10 mt-10 text-gray-900 text-md fw-medium">
                                                <i className="ph-bold ph-gift text-main-600 text-lg pe-4"></i>
                                                Quà tặng bạn nhận được:
                                            </span>

                                            <div className="d-flex align-items-center gap-12">
                                                <Link
                                                    href={gift.bienthe_quatang ? `/san-pham/${gift.bienthe_quatang.slug_bienthe_quatang_sanpham}` : '#'}
                                                    className="border border-gray-100 rounded-8 flex-center"
                                                    style={{ maxWidth: '80px', maxHeight: '80px', width: '100%', height: '100%' }}
                                                >
                                                    <img
                                                        src={gift.bienthe_quatang?.hinhanh || gift.hinhanh}
                                                        alt={gift.bienthe_quatang?.ten_bienthe_quatang || gift.tieude}
                                                        className="w-100 rounded-8"
                                                    />
                                                </Link>
                                                <div className="table-product__content text-start">
                                                    <h6 className="title text-md fw-semibold mb-0">
                                                        <Link
                                                            href={gift.bienthe_quatang ? `/san-pham/${gift.bienthe_quatang.slug_bienthe_quatang_sanpham}` : '#'}
                                                            className="link text-line-2"
                                                            title={gift.bienthe_quatang?.ten_bienthe_quatang || gift.tieude}
                                                            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '350px', display: 'inline-block' }}
                                                        >
                                                            {gift.bienthe_quatang?.ten_bienthe_quatang || gift.tieude}
                                                        </Link>
                                                    </h6>
                                                    <div className="flex-align gap-16 mb-6">
                                                        <span className="btn bg-gray-50 text-heading text-xs py-4 px-6 rounded-8 flex-center gap-8 fw-medium">
                                                            {gift.bienthe_quatang?.ten_loaibienthe_quatang || 'Quà tặng'}
                                                        </span>
                                                    </div>
                                                    <div className="product-card__price mb-6">
                                                        <div className="flex-align gap-24">
                                                            <span className="text-heading text-sm fw-medium">Số lượng: {gift.bienthe_quatang?.soluong || 1}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <span className="mt-10 mb-20 text-gray-700 border-top border-gray-100 d-block"></span>

                                            {/* Progress */}
                                            <div className="mt-8">
                                                <div className="flex-align">
                                                    <div
                                                        className="progress w-100 bg-color-three rounded-pill h-20"
                                                        role="progressbar"
                                                        aria-label="Progress"
                                                        aria-valuenow={progressPercent}
                                                        aria-valuemin={0}
                                                        aria-valuemax={100}
                                                    >
                                                        <div
                                                            className={`progress-bar ${progressPercent >= 100 ? 'bg-success-600' : 'bg-main-600'} rounded-pill text-center`}
                                                            style={{ width: `${Math.max(progressPercent, 10)}%` }}
                                                        >
                                                            {progressPercent}%
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-gray-900 text-sm fw-medium">
                                                    {progressPercent >= 100
                                                        ? '🎉 Đã đủ điều kiện nhận quà!'
                                                        : TARGET_AMOUNT > 0
                                                            ? `Còn ${formatPrice(Math.max(0, TARGET_AMOUNT - subtotal))} đ nữa để nhận quà`
                                                            : `Cần thêm ${Math.max(0, MIN_PRODUCTS - totalItems)} sản phẩm nữa để nhận quà`
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="col-xl-3">
                                <div className="product-details__sidebar py-30 px-20 border border-gray-100 rounded-16">
                                    <div>
                                        <h6 className="mb-8 text-heading fw-semibold d-block">Chương trình</h6>
                                        <span className="text-xl d-flex">
                                            <i className="ph ph-calendar"></i>
                                        </span>
                                    </div>

                                    <div className="mt-10">
                                        <Link
                                            href={`/san-pham?thuonghieu=${gift.thongtin_thuonghieu?.slug_thuonghieu || ''}`}
                                            className="px-16 py-8 bg-main-50 rounded-8 flex-between gap-12 mb-0"
                                            style={{ justifyContent: 'start' }}
                                        >
                                            <span
                                                className="bg-white text-main-600 rounded-circle flex-center text-xl flex-shrink-0 p-4"
                                                style={{ width: '40px', height: '40px' }}
                                            >
                                                <img
                                                    src={gift.thongtin_thuonghieu?.logo_thuonghieu || gift.hinhanh}
                                                    alt={gift.thongtin_thuonghieu?.ten_thuonghieu}
                                                    className="w-100 rounded-circle"
                                                />
                                            </span>
                                            <span className="text-sm text-neutral-600">
                                                <span className="fw-semibold">{gift.thongtin_thuonghieu?.ten_thuonghieu || 'Nhà cung cấp'}</span>
                                            </span>
                                        </Link>
                                    </div>

                                    {/* Time Info */}
                                    <div className="mt-20">
                                        <div className="flex-align gap-8 mb-8">
                                            <i className="ph ph-clock text-main-600"></i>
                                            <span className="text-sm text-gray-600">
                                                {gift.thoigian_conlai > 0
                                                    ? `Còn ${gift.thoigian_conlai} ngày`
                                                    : <span className="text-danger-600">Đã hết hạn</span>
                                                }
                                            </span>
                                        </div>
                                        <div className="flex-align gap-8 mb-8">
                                            <i className="ph ph-eye text-main-600"></i>
                                            <span className="text-sm text-gray-600">Lượt xem: {gift.luotxem}</span>
                                        </div>
                                    </div>

                                    {/* Share Buttons */}
                                    <div className="mt-32">
                                        <div className="px-32 py-16 rounded-8 border border-gray-100 flex-between gap-8">
                                            <a href="#" className="d-flex text-main-600 text-28">
                                                <i className="ph-fill ph-chats-teardrop"></i>
                                            </a>
                                            <span className="h-26 border border-gray-100"></span>
                                            <div className="dropdown on-hover-item">
                                                <button className="d-flex text-main-600 text-28" type="button">
                                                    <i className="ph-fill ph-share-network"></i>
                                                </button>
                                                <div className="on-hover-dropdown common-dropdown border-0 inset-inline-start-auto inset-inline-end-0">
                                                    <ul className="flex-align gap-16">
                                                        <li>
                                                            <a
                                                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="w-44 h-44 flex-center bg-main-100 text-main-600 text-xl rounded-circle hover-bg-main-600 hover-text-white"
                                                            >
                                                                <i className="ph-fill ph-facebook-logo"></i>
                                                            </a>
                                                        </li>
                                                        <li>
                                                            <a
                                                                href="https://www.twitter.com"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="w-44 h-44 flex-center bg-main-100 text-main-600 text-xl rounded-circle hover-bg-main-600 hover-text-white"
                                                            >
                                                                <i className="ph-fill ph-twitter-logo"></i>
                                                            </a>
                                                        </li>
                                                        <li>
                                                            <a
                                                                href="https://www.instagram.com"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="w-44 h-44 flex-center bg-main-100 text-main-600 text-xl rounded-circle hover-bg-main-600 hover-text-white"
                                                            >
                                                                <i className="ph-fill ph-instagram-logo"></i>
                                                            </a>
                                                        </li>
                                                        <li>
                                                            <a
                                                                href="https://www.linkedin.com"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="w-44 h-44 flex-center bg-main-100 text-main-600 text-xl rounded-circle hover-bg-main-600 hover-text-white"
                                                            >
                                                                <i className="ph-fill ph-linkedin-logo"></i>
                                                            </a>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Related Products Section */}
                        <div className="my-20">
                            <div className="flex-between flex-wrap gap-2">
                                <h6
                                    className="mb-0 wow fadeInLeft gap-4"
                                    style={{ display: 'flex', alignItems: 'flex-start', visibility: 'visible', animationName: 'fadeInLeft' }}
                                >
                                    <i className="ph-bold ph-archive text-main-600"></i>
                                    <div>
                                        Lựa chọn sản phẩm để nhận quà tặng
                                        <div className="text-sm text-gray-600 fw-medium">
                                            * Lưu ý điều kiện quà tặng chỉ áp dụng từng sản phẩm
                                        </div>
                                    </div>
                                </h6>
                                <div className="flex-align gap-16">
                                    <div className="flex-align gap-8">
                                        <button
                                            type="button"
                                            id="new-arrival-prev"
                                            className="slick-prev flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1"
                                        >
                                            <i className="ph ph-caret-left"></i>
                                        </button>
                                        <button
                                            type="button"
                                            id="new-arrival-next"
                                            className="slick-next flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1"
                                        >
                                            <i className="ph ph-caret-right"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Products Grid - sản phẩm có quà */}
                            <div className="new-arrival__slider arrow-style-two mt-20">
                                <div className="d-flex flex-nowrap overflow-auto" style={{ gap: '10px' }}>
                                    {relatedProducts.map((product) => (
                                        <div key={product.id} style={{ width: '240px', minWidth: '240px' }}>
                                            <div className="product-card h-100 border border-gray-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                                {product.have_gift && (
                                                    <span className="product-card__badge bg-main-600 px-8 py-4 text-sm text-white position-absolute inset-inline-start-0 inset-block-start-0">
                                                        <i className="ph-fill ph-gift"></i> Có quà
                                                    </span>
                                                )}
                                                <Link
                                                    href={`/san-pham/${product.slug}`}
                                                    className="flex-center rounded-8 bg-gray-50 position-relative"
                                                >
                                                    <img
                                                        src={product.hinh_anh}
                                                        alt={product.ten}
                                                        className="w-100 rounded-top-2"
                                                    />
                                                </Link>
                                                <div className="product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex mt-10 px-10 pb-8">
                                                    <div>
                                                        <h6 className="title text-lg fw-semibold mt-2 mb-2">
                                                            <Link
                                                                href={`/san-pham/${product.slug}`}
                                                                className="link text-line-2"
                                                            >
                                                                {product.ten}
                                                            </Link>
                                                        </h6>
                                                        <div className="flex-align justify-content-between mt-2">
                                                            <div className="flex-align gap-6">
                                                                <span className="text-xs fw-medium text-gray-500">Đánh giá</span>
                                                                <span className="text-xs fw-medium text-gray-500">
                                                                    {product.rating?.average || 0}
                                                                    <i className="ph-fill ph-star text-warning-600"></i>
                                                                </span>
                                                            </div>
                                                            <div className="flex-align gap-4">
                                                                <span className="text-xs fw-medium text-gray-500">{product.sold?.total_sold || 0}</span>
                                                                <span className="text-xs fw-medium text-gray-500">Đã bán</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="product-card__price mt-5">
                                                        {product.gia?.discount_percent > 0 && (
                                                            <div className="flex-align gap-4 text-main-two-600">
                                                                <i className="ph-fill ph-seal-percent text-sm"></i> -{product.gia.discount_percent}%
                                                                <span className="text-gray-400 text-sm fw-semibold text-decoration-line-through">
                                                                    {formatPrice(product.gia.before_discount)} đ
                                                                </span>
                                                            </div>
                                                        )}
                                                        <span className="text-heading text-lg fw-semibold">
                                                            {formatPrice(product.gia?.current || 0)} đ
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddToCart(product)}
                                                        disabled={cartLoading || !product.trangthai?.in_stock}
                                                        className="mt-6 rounded-bottom-2 bg-gray-50 text-sm text-gray-900 w-100 hover-bg-main-600 hover-text-white py-6 px-24 flex-center gap-8 fw-medium transition-1"
                                                    >
                                                        <i className="ph ph-shopping-cart"></i>
                                                        {!product.trangthai?.in_stock
                                                            ? 'Hết hàng'
                                                            : cartLoading
                                                                ? 'Đang thêm...'
                                                                : 'Thêm vào giỏ hàng'
                                                        }
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {relatedProducts.length === 0 && (
                                        <div className="text-center py-20 w-100">
                                            <p className="text-gray-500">Không có sản phẩm nào trong chương trình này</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
