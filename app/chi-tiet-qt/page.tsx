'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FullHeader from '@/components/FullHeader';
import { useCart } from '@/hooks/useCart';
import { productDetailUrl } from '@/utils/paths';

const API_URL = 'https://sieuthivina.com';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

// Interface cho sản phẩm được tặng
interface SanPhamDuocTang {
    id: number;
    id_loaibienthe: number;
    id_sanpham: number;
    giagoc: number;
    soluong: number;
    luottang: number;
    luotban: number;
    trangthai: string;
    deleted_at: string | null;
    giadagiam: number;
    pivot: {
        id_quatang: number;
        id_bienthe: number;
        soluongtang: number;
    };
    sanpham: {
        id: number;
        id_thuonghieu: number;
        ten: string;
        slug: string;
        mota: string;
        xuatxu: string;
        sanxuat: string;
        trangthai: string;
        giamgia: number;
        luotxem: number;
        deleted_at: string | null;
        thuonghieu: {
            id: number;
            ten: string;
            slug: string;
            logo: string;
            trangthai: string;
        };
        hinhanhsanpham: Array<{
            id: number;
            id_sanpham: number;
            hinhanh: string;
            trangthai: string;
            deleted_at: string | null;
        }>;
    };
    loaibienthe: {
        id: number;
        ten: string;
        trangthai: string;
    };
}

// Interface cho quà tặng từ API /api/v1/qua-tang/{slug}
interface QuaTangDetail {
    id: number;
    id_chuongtrinh: number | null;
    dieukiensoluong: string;
    dieukiengiatri: number;
    tieude: string;
    slug: string;
    thongtin: string;
    hinhanh: string;
    luotxem: number;
    ngaybatdau: string;
    ngayketthuc: string;
    trangthai: string;
    deleted_at: string | null;
    sanphamduoctang: SanPhamDuocTang[];
}

// Interface cho sản phẩm tham gia chương trình
interface SanPhamThamGia {
    id: number;
    id_loaibienthe: number;
    id_sanpham: number;
    giagoc: number;
    soluong: number;
    luottang: number;
    luotban: number;
    trangthai: string;
    deleted_at: string | null;
    giadagiam: number;
    sanpham: {
        id: number;
        id_thuonghieu: number;
        ten: string;
        slug: string;
        mota: string;
        xuatxu: string;
        sanxuat: string;
        trangthai: string;
        giamgia: number;
        luotxem: number;
        deleted_at: string | null;
        thuonghieu: {
            id: number;
            ten: string;
            slug: string;
            logo: string;
            trangthai: string;
        };
        hinhanhsanpham: Array<{
            id: number;
            id_sanpham: number;
            hinhanh: string;
            trangthai: string;
            deleted_at: string | null;
        }>;
    };
    loaibienthe: {
        id: number;
        ten: string;
        trangthai: string;
    };
}

// Interface cho tiến độ
interface Progress {
    percent: number;
    currentCount: number;
    targetCount: number;
    currentValue: number;
    targetValue: number;
}

interface QuaTangResponse {
    status: number;
    quatang: QuaTangDetail;
    sanphamthamgia: SanPhamThamGia[];
    progress: Progress;
}

// Fetch chi tiết quà tặng bằng slug - API: /api/v1/qua-tang/{slug}
async function fetchQuaTangDetail(slug: string): Promise<QuaTangResponse | null> {
    try {
        const response = await fetch(`${API_URL}/api/v1/qua-tang/${slug}`, {
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
    const [relatedProducts, setRelatedProducts] = useState<SanPhamThamGia[]>([]);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [showCartAlert, setShowCartAlert] = useState(false);

    const { addToCart, loading: cartLoading } = useCart();

    // Lấy điều kiện từ API
    const MIN_PRODUCTS = parseInt(gift?.dieukiensoluong || '0') || 0;
    const TARGET_AMOUNT = gift?.dieukiengiatri || 0;

    // Sử dụng progress từ API
    const progressPercent = progress?.percent || 0;
    const currentCount = progress?.currentCount || 0;
    const targetCount = progress?.targetCount || MIN_PRODUCTS;
    const currentValue = progress?.currentValue || 0;
    const targetValue = progress?.targetValue || TARGET_AMOUNT;

    const hasEnoughProducts = currentCount >= targetCount;
    const hasEnoughAmount = targetValue === 0 || currentValue >= targetValue;

    // Handle add to cart
    const handleAddToCart = async (product: SanPhamThamGia) => {
        const id_chuongtrinh = gift?.id_chuongtrinh;
        const productImage = product.sanpham?.hinhanhsanpham?.[0]?.hinhanh;
        const imageUrl = productImage?.startsWith('http')
            ? productImage
            : `${API_URL}/assets/client/images/products/${productImage}`;

        console.log('🛒 Adding to cart with id_chuongtrinh:', id_chuongtrinh);

        await addToCart({
            id_bienthe: product.id,
            id: product.sanpham.id,
            ten: product.sanpham.ten,
            hinhanh: imageUrl,
            gia: product.giadagiam || product.giagoc,
            id_chuongtrinh: id_chuongtrinh ?? undefined,
        }, 1, id_chuongtrinh ?? undefined);

        setShowCartAlert(true);
        setTimeout(() => setShowCartAlert(false), 3000);
    };

    // Fetch gift data từ API /api/v1/qua-tang/{slug}
    useEffect(() => {
        const loadGiftData = async () => {
            if (!giftSlug) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetchQuaTangDetail(giftSlug);
                console.log('🎁 API Response:', response);

                if (response?.status === 200 && response?.quatang) {
                    setGift(response.quatang);
                    setRelatedProducts(response.sanphamthamgia || []);
                    setProgress(response.progress || null);
                }
            } catch (error) {
                console.error('Error loading gift data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadGiftData();
    }, [giftSlug]);

    //backend tu dong su ly qua tang
    //khi theem san pham voi id_chuongtrinh 
    //kiem tra dieu kien (dieukiengiatri,dieukiensoluong)
    //neu du dieu kien tu them vao bienthe_quatang trong gio hang
    //frontend chi gui id_chuongtrinh trong handleAddToCart

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
                                                    <span
                                                        className={`w-30 h-30 text-md flex-center rounded-circle`}
                                                        style={{ backgroundColor: hasEnoughProducts ? '#e6f7f7' : '#fff3e6', color: hasEnoughProducts ? '#009999' : '#f39016' }}
                                                    >
                                                        <i className={`ph-bold ${hasEnoughProducts ? 'ph-check' : 'ph-x'}`}></i>
                                                    </span>
                                                    <span className="text-heading fw-medium">
                                                        Mua tối thiểu <span style={{ color: hasEnoughProducts ? '#009999' : '#f39016' }}>{targetCount} sản phẩm</span> từ {gift.sanphamduoctang?.[0]?.sanpham?.thuonghieu?.ten || 'nhà cung cấp'}
                                                    </span>
                                                </li>
                                                {(gift.dieukiengiatri ?? 0) > 0 && (
                                                    <li className="text-gray-400 mb-14 flex-align gap-14">
                                                        <span
                                                            className={`w-30 h-30 text-md flex-center rounded-circle`}
                                                            style={{ backgroundColor: hasEnoughAmount ? '#e6f7f7' : '#fff3e6', color: hasEnoughAmount ? '#009999' : '#f39016' }}
                                                        >
                                                            <i className={`ph-bold ${hasEnoughAmount ? 'ph-check' : 'ph-x'}`}></i>
                                                        </span>
                                                        <span className="text-heading fw-medium">
                                                            Giá trị đơn hàng tối thiểu <span style={{ color: hasEnoughAmount ? '#009999' : '#f39016' }}>{formatPrice(gift.dieukiengiatri)} đ</span>
                                                        </span>
                                                    </li>
                                                )}
                                            </ul>

                                            <span className="mt-10 mb-10 text-gray-700 border-top border-gray-100 d-block"></span>

                                            {/* Alert khi đủ điều kiện và đã tự động thêm quà */}
                                            {showCartAlert && (
                                                <div className="alert alert-success alert-dismissible fade show mb-20" role="alert" style={{ backgroundColor: '#e6f7f7', borderColor: '#009999', color: '#006666' }}>
                                                    <div className="flex-align gap-8">
                                                        <i className="ph-fill ph-gift text-xl" style={{ color: '#009999' }}></i>
                                                        <strong>🎉 Chúc mừng!</strong> Quà tặng đã được tự động thêm vào giỏ hàng của bạn.
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn-close"
                                                        onClick={() => setShowCartAlert(false)}
                                                        aria-label="Close"
                                                    ></button>
                                                </div>
                                            )}

                                            {/* Gift Products - Sản phẩm được tặng */}
                                            <span className="flex-align mb-10 mt-10 text-gray-900 text-md fw-medium">
                                                <i className="ph-bold ph-gift text-main-600 text-lg pe-4"></i>
                                                Quà tặng bạn nhận được:
                                            </span>

                                            <div className="d-flex flex-column gap-12">
                                                {gift.sanphamduoctang?.map((giftProduct, idx) => {
                                                    const productImage = giftProduct.sanpham?.hinhanhsanpham?.[0]?.hinhanh;
                                                    const imageUrl = productImage?.startsWith('http')
                                                        ? productImage
                                                        : `${API_URL}/assets/client/images/products/${productImage}`;

                                                    return (
                                                        <div key={giftProduct.id || idx} className="d-flex align-items-center gap-12 p-8 bg-gray-50 rounded-8">
                                                            <Link
                                                                href={`/san-pham/${giftProduct.sanpham?.slug || ''}`}
                                                                className="border border-gray-100 rounded-8 flex-center bg-white"
                                                                style={{ width: '70px', height: '70px', minWidth: '70px' }}
                                                            >
                                                                <img
                                                                    src={imageUrl || gift.hinhanh}
                                                                    alt={giftProduct.sanpham?.ten || gift.tieude}
                                                                    className="w-100 h-100 rounded-8"
                                                                    style={{ objectFit: 'cover' }}
                                                                    onError={(e) => {
                                                                        const img = e.currentTarget;
                                                                        img.onerror = null;
                                                                        img.src = gift.hinhanh;
                                                                    }}
                                                                />
                                                            </Link>
                                                            <div className="table-product__content text-start flex-grow-1">
                                                                <h6 className="title text-md fw-semibold mb-4">
                                                                    <Link
                                                                        href={`/san-pham/${giftProduct.sanpham?.slug || ''}`}
                                                                        className="link text-line-2"
                                                                        title={giftProduct.sanpham?.ten || gift.tieude}
                                                                    >
                                                                        {giftProduct.sanpham?.ten || gift.tieude}
                                                                    </Link>
                                                                </h6>
                                                                <div className="flex-align gap-8 flex-wrap">
                                                                    <span className="btn bg-white text-heading text-xs py-4 px-8 rounded-8 fw-medium border border-gray-100">
                                                                        {giftProduct.loaibienthe?.ten || 'Quà tặng'}
                                                                    </span>
                                                                    <span className="btn bg-warning-100 text-warning-600 text-xs py-4 px-8 rounded-8 fw-semibold">
                                                                        <i className="ph-fill ph-gift me-4"></i>
                                                                        x{giftProduct.pivot?.soluongtang || 1}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {(!gift.sanphamduoctang || gift.sanphamduoctang.length === 0) && (
                                                    <div className="text-center py-16 text-gray-500">
                                                        Chưa có thông tin quà tặng
                                                    </div>
                                                )}
                                            </div>

                                            <span className="mt-10 mb-20 text-gray-700 border-top border-gray-100 d-block"></span>

                                            {/* Progress */}
                                            <div className="mt-8">
                                                <div className="flex-align">
                                                    <div
                                                        className="progress w-100 bg-color-three rounded-pill h-20"
                                                        role="progressbar"
                                                        aria-label="Tiến độ nhận quà tặng"
                                                        {...{
                                                            'aria-valuenow': progressPercent || 0,
                                                            'aria-valuemin': 0,
                                                            'aria-valuemax': 100
                                                        }}
                                                    >
                                                        <div
                                                            className="progress-bar rounded-pill text-center"
                                                            style={{ backgroundColor: progressPercent >= 100 ? '#009999' : '#f39016', width: `${Math.max(progressPercent, 10)}%` }}
                                                        >
                                                            {progressPercent}%
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-gray-900 text-sm fw-medium">
                                                    {progressPercent >= 100
                                                        ? '🎉 Đã đủ điều kiện nhận quà!'
                                                        : targetValue > 0
                                                            ? `Còn ${formatPrice(Math.max(0, targetValue - currentValue))} đ nữa để nhận quà`
                                                            : `Cần thêm ${Math.max(0, targetCount - currentCount)} sản phẩm nữa để nhận quà`
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
                                    {gift.sanphamduoctang?.[0]?.sanpham?.thuonghieu && (
                                        <>
                                            <div>
                                                <h6 className="mb-8 text-heading fw-semibold d-block">Nhà cung cấp</h6>
                                            </div>

                                            <div className="mt-10">
                                                <Link
                                                    href={`/san-pham?thuonghieu=${gift.sanphamduoctang[0].sanpham.thuonghieu.slug || ''}`}
                                                    className="px-16 py-8 bg-main-50 rounded-8 flex-between gap-12 mb-0"
                                                    style={{ justifyContent: 'start' }}
                                                >
                                                    <span
                                                        className="bg-white text-main-600 rounded-circle flex-center text-xl flex-shrink-0 p-4"
                                                        style={{ width: '40px', height: '40px' }}
                                                    >
                                                        <img
                                                            src={`${API_URL}/assets/client/images/brands/${gift.sanphamduoctang[0].sanpham.thuonghieu.logo}`}
                                                            alt={gift.sanphamduoctang[0].sanpham.thuonghieu.ten}
                                                            className="w-100 rounded-circle"
                                                            onError={(e) => {
                                                                const img = e.currentTarget;
                                                                img.onerror = null;
                                                                img.src = gift.hinhanh;
                                                            }}
                                                        />
                                                    </span>
                                                    <span className="text-sm text-neutral-600">
                                                        <span className="fw-semibold">{gift.sanphamduoctang[0].sanpham.thuonghieu.ten || 'Nhà cung cấp'}</span>
                                                    </span>
                                                </Link>
                                            </div>
                                        </>
                                    )}

                                    {/* Share Buttons */}
                                    <div className="mt-32">
                                        <div className="px-32 py-16 rounded-8 border border-gray-100 flex-between gap-8">
                                            <a href="#" className="d-flex text-main-600 text-28" aria-label="Chat">
                                                <i className="ph-fill ph-chats-teardrop"></i>
                                            </a>
                                            <span className="h-26 border border-gray-100"></span>
                                            <div className="dropdown on-hover-item">
                                                <button className="d-flex text-main-600 text-28" type="button" aria-label="Chia sẻ">
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
                                                                aria-label="Chia sẻ trên Facebook"
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
                                                                aria-label="Chia sẻ trên Twitter"
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
                                                                aria-label="Chia sẻ trên Instagram"
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
                                                                aria-label="Chia sẻ trên LinkedIn"
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
                                            aria-label="Sản phẩm trước"
                                        >
                                            <i className="ph ph-caret-left"></i>
                                        </button>
                                        <button
                                            type="button"
                                            id="new-arrival-next"
                                            className="slick-next flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1"
                                            aria-label="Sản phẩm tiếp theo"
                                        >
                                            <i className="ph ph-caret-right"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Products Grid - sản phẩm tham gia chương trình */}
                            <div className="new-arrival__slider arrow-style-two mt-20">
                                <div className="d-flex flex-nowrap overflow-auto" style={{ gap: '10px' }}>
                                    {relatedProducts.map((product) => {
                                        const productImage = product.sanpham?.hinhanhsanpham?.[0]?.hinhanh;
                                        const imageUrl = productImage?.startsWith('http')
                                            ? productImage
                                            : `${API_URL}/assets/client/images/products/${productImage}`;
                                        const discountPercent = product.sanpham?.giamgia || 0;
                                        const isInStock = product.trangthai === 'Còn hàng' && product.soluong > 0;

                                        return (
                                            <div key={product.id} style={{ width: '240px', minWidth: '240px' }}>
                                                <div className="product-card h-100 border border-gray-100 hover-border-main-600 rounded-6 position-relative transition-2">
                                                    <span className="product-card__badge bg-main-600 px-8 py-4 text-sm text-white position-absolute inset-inline-start-0 inset-block-start-0">
                                                        <i className="ph-fill ph-gift"></i> Có quà
                                                    </span>
                                                    <Link
                                                        href={productDetailUrl({ slug: product.sanpham?.slug || '', id: product.sanpham?.id || product.id })}
                                                        className="flex-center rounded-8 bg-gray-50 position-relative"
                                                    >
                                                        <img
                                                            src={imageUrl}
                                                            alt={product.sanpham?.ten || ''}
                                                            className="w-100 rounded-top-2"
                                                            style={{ height: '180px', objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                const img = e.currentTarget;
                                                                img.onerror = null;
                                                                img.src = '/assets/images/thumbs/placeholder.png';
                                                            }}
                                                        />
                                                    </Link>
                                                    <div className="product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex mt-10 px-10 pb-8">
                                                        <div>
                                                            <h6 className="title text-lg fw-semibold mt-2 mb-2">
                                                                <Link
                                                                    href={productDetailUrl({ slug: product.sanpham?.slug || '', id: product.sanpham?.id || product.id })}
                                                                    className="link text-line-2"
                                                                >
                                                                    {product.sanpham?.ten || ''}
                                                                </Link>
                                                            </h6>
                                                            <div className="flex-align justify-content-between mt-2">
                                                                <div className="flex-align gap-6">
                                                                    <span className="text-xs fw-medium text-gray-500">
                                                                        {product.loaibienthe?.ten || 'Loại'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex-align gap-4">
                                                                    <span className="text-xs fw-medium text-gray-500">{product.luotban || 0}</span>
                                                                    <span className="text-xs fw-medium text-gray-500">Đã bán</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="product-card__price mt-5">
                                                            {discountPercent > 0 && (
                                                                <div className="flex-align gap-4 text-main-two-600">
                                                                    <i className="ph-fill ph-seal-percent text-sm"></i> -{discountPercent}%
                                                                    <span className="text-gray-400 text-sm fw-semibold text-decoration-line-through">
                                                                        {formatPrice(product.giagoc)} đ
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <span className="text-heading text-lg fw-semibold">
                                                                {formatPrice(product.giadagiam || product.giagoc)} đ
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="w-100">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddToCart(product)}
                                                            disabled={cartLoading || !isInStock}
                                                            className="mt-6 rounded-bottom-2 bg-gray-50 text-sm text-gray-900 w-100 hover-bg-main-600 hover-text-white py-6 px-24 flex-center gap-8 fw-medium transition-1"
                                                        >
                                                            <i className="ph ph-shopping-cart"></i>
                                                            {!isInStock
                                                                ? 'Hết hàng'
                                                                : cartLoading
                                                                    ? 'Đang thêm...'
                                                                    : 'Thêm vào giỏ hàng'
                                                            }
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

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
