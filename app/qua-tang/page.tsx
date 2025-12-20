'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import FullHeader from '@/components/FullHeader';

const API_URL = 'https://sieuthivina.com';

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

// Interface cho dữ liệu quà tặng từ API mới
interface QuaTang {
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

interface Provider {
    id: number;
    ten: string;
    slug: string;
    logo: string;
    trangthai: string;
}

interface QuaTangPagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// API trả về object từ /api/v1/qua-tang
interface QuaTangResponse {
    status: number;
    data: {
        current_page: number;
        data: QuaTang[];
        last_page: number;
        per_page: number;
        total: number;
    };
    providers: Provider[];
}

// Hàm tính thời gian còn lại
function calculateDaysLeft(endDate: string): number {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 0;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Hàm fetch quà tặng từ API mới
async function fetchQuaTangs(params?: { page?: number }): Promise<QuaTangResponse> {
    let url = `${API_URL}/api/v1/qua-tang`;
    if (params?.page) url += `?page=${params.page}`;

    const response = await fetch(url, {
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
}

export default function GiftPromotionPage() {
    const [gifts, setGifts] = useState<QuaTang[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [pagination, setPagination] = useState<QuaTangPagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Fetch dữ liệu quà tặng từ API
    useEffect(() => {
        const loadGifts = async () => {
            try {
                setLoading(true);
                const response = await fetchQuaTangs({
                    page: currentPage,
                });

                if (response.status === 200 && response.data?.data) {
                    // Lọc chỉ lấy các quà tặng đang hiển thị và chưa hết hạn
                    let activeGifts = response.data.data.filter((gift) => {
                        const now = new Date();
                        const endDate = new Date(gift.ngayketthuc);
                        return gift.trangthai === 'Hiển thị' && endDate > now;
                    });

                    // Lọc theo provider nếu có
                    if (selectedProvider !== null) {
                        activeGifts = activeGifts.filter((gift) => {
                            return gift.sanphamduoctang?.some(
                                (sp) => sp.sanpham?.thuonghieu?.id === selectedProvider
                            );
                        });
                    }

                    setGifts(activeGifts);
                    setProviders(response.providers || []);
                    setPagination({
                        current_page: response.data.current_page,
                        last_page: response.data.last_page,
                        per_page: response.data.per_page,
                        total: response.data.total,
                    });
                }
            } catch (error) {
                console.error('Error loading gifts:', error);
                setGifts([]);
            } finally {
                setLoading(false);
            }
        };
        loadGifts();
    }, [currentPage, selectedProvider]);

    const handleProviderChange = (id: number | null) => {
        setSelectedProvider(id);
        setCurrentPage(1);
    };

    const handleClearFilter = () => {
        setSelectedProvider(null);
        setCurrentPage(1);
    };

    return (
        <>
            <FullHeader showClassicTopBar={true} showTopNav={false} />

            {/* Custom CSS */}
            <style>{`
                .text-line-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-height: 1.5;
                    max-height: 3em;
                }
            `}</style>

            {/* Breadcrumb */}
            <div className="breadcrumb mb-0 pt-40 bg-main-two-60">
                <div className="container container-lg">
                    <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
                        <h6 className="mb-0">Ưu đãi quà tặng</h6>
                        <ul className="flex-align gap-8">
                            <li><Link href="/" className="text-sm text-gray-700">Trang chủ</Link></li>
                            <li><i className="ph ph-caret-right text-sm text-gray-500"></i></li>
                            <li><span className="text-sm text-main-600">Quà tặng</span></li>
                        </ul>
                    </div>
                </div>
            </div>

            <section className="shop py-30 gift-promotion-page">
                <div className="container container-lg">
                    <div className="row">
                        {/* Sidebar */}
                        <div className="col-lg-3">
                            <div className={`shop-sidebar ${sidebarOpen ? 'active' : ''}`}>
                                <button
                                    type="button"
                                    className="shop-sidebar__close d-lg-none d-flex w-32 h-32 flex-center border border-gray-100 rounded-circle hover-bg-main-600 position-absolute inset-inline-end-0 me-10 mt-8 hover-text-white hover-border-main-600"
                                    onClick={() => setSidebarOpen(false)}
                                    aria-label="Đóng sidebar"
                                >
                                    <i className="ph ph-x"></i>
                                </button>

                                {/* Nhà cung cấp */}
                                {providers && providers.length > 0 && (
                                    <div className="shop-sidebar__box border border-gray-100 rounded-8 p-26 pb-0 mb-32">
                                        <h6 className="text-xl border-bottom border-gray-100 pb-16 mb-24">Nhà cung cấp</h6>
                                        <ul className="max-h-540 overflow-y-auto scroll-sm">
                                            <li className="mb-16">
                                                <div className="form-check common-check common-radio">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="provider"
                                                        id="provider-all"
                                                        checked={selectedProvider === null}
                                                        onChange={() => handleProviderChange(null)}
                                                    />
                                                    <label className="form-check-label" htmlFor="provider-all">
                                                        Tất cả
                                                    </label>
                                                </div>
                                            </li>
                                            {providers.map(provider => (
                                                <li className="mb-16" key={provider.id}>
                                                    <div className="form-check common-check common-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="provider"
                                                            id={`provider-${provider.id}`}
                                                            checked={selectedProvider === provider.id}
                                                            onChange={() => handleProviderChange(provider.id)}
                                                        />
                                                        <label className="form-check-label flex-align gap-8" htmlFor={`provider-${provider.id}`}>
                                                            <img
                                                                src={`${API_URL}/assets/client/images/brands/${provider.logo}`}
                                                                alt={provider.ten}
                                                                className="rounded-circle"
                                                                style={{ width: '24px', height: '24px', objectFit: 'cover' }}
                                                                onError={(e) => {
                                                                    const img = e.currentTarget;
                                                                    img.onerror = null;
                                                                    img.src = '/assets/images/thumbs/placeholder.png';
                                                                }}
                                                            />
                                                            {provider.ten}
                                                        </label>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Xóa bộ lọc */}
                                <div className="shop-sidebar__box rounded-8 flex-align justify-content-between mb-32">
                                    <button
                                        onClick={handleClearFilter}
                                        className="btn border-main-600 text-main-600 hover-bg-main-600 hover-border-main-600 hover-text-white rounded-8 px-32 py-12 w-100"
                                    >
                                        Xóa bộ lọc
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="col-lg-9">
                            {/* Top bar */}
                            <div className="flex-between gap-16 flex-wrap mb-40">
                                <span className="text-gray-900">
                                    Hiển thị {gifts.length} trên {pagination?.total || gifts.length} kết quả
                                </span>
                                <div className="position-relative flex-align gap-16 flex-wrap">
                                    <button
                                        type="button"
                                        className="w-44 h-44 d-lg-none d-flex flex-center border border-gray-100 rounded-6 text-2xl sidebar-btn"
                                        onClick={() => setSidebarOpen(true)}
                                        aria-label="Mở bộ lọc"
                                    >
                                        <i className="ph-bold ph-funnel"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Loading state */}
                            {loading && (
                                <div className="text-center py-40">
                                    <div className="spinner-border text-main-600" role="status">
                                        <span className="visually-hidden">Đang tải...</span>
                                    </div>
                                </div>
                            )}

                            {/* Gift cards grid */}
                            {!loading && (
                                <>
                                    <div className="row g-12">
                                        {gifts.map((gift) => {
                                            const daysLeft = calculateDaysLeft(gift.ngayketthuc);
                                            const totalGiftQuantity = gift.sanphamduoctang?.reduce(
                                                (sum, sp) => sum + (sp.pivot?.soluongtang || 1), 0
                                            ) || 0;
                                            const firstProduct = gift.sanphamduoctang?.[0];
                                            const brandInfo = firstProduct?.sanpham?.thuonghieu;

                                            return (
                                                <div key={gift.id} className="col-xxl-6 col-xl-6 col-lg-6 col-sm-12 col-md-6 col-xs-12">
                                                    <div className="flex-align gap-4 border border-gray-100 hover-border-main-600 rounded-6 transition-2 position-relative" style={{ height: '180px' }}>
                                                        {/* Badge số lượng quà tặng */}
                                                        {totalGiftQuantity > 0 && (
                                                            <div
                                                                className="position-absolute d-flex align-items-center gap-4 bg-warning-600 text-white px-8 py-4 rounded-8"
                                                                style={{ top: '8px', left: '8px', zIndex: 3 }}
                                                            >
                                                                <i className="ph-fill ph-gift text-sm"></i>
                                                                <span className="text-xs fw-semibold">x{totalGiftQuantity}</span>
                                                            </div>
                                                        )}

                                                        <Link
                                                            href={`/chi-tiet-qt?slug=${gift.slug}`}
                                                            className="rounded-8 bg-gray-50 h-100 position-relative"
                                                            style={{ width: '70%' }}
                                                        >
                                                            <img
                                                                src={gift.hinhanh}
                                                                alt={gift.tieude}
                                                                className="rounded-start-2 h-100 w-100"
                                                                style={{ objectFit: 'cover' }}
                                                                onError={(e) => {
                                                                    const img = e.currentTarget;
                                                                    img.onerror = null;
                                                                    img.src = '/assets/images/thumbs/placeholder.png';
                                                                }}
                                                            />

                                                            {/* Hiển thị ảnh sản phẩm được tặng */}
                                                            {gift.sanphamduoctang && gift.sanphamduoctang.length > 0 && (
                                                                <div
                                                                    className="position-absolute d-flex gap-4"
                                                                    style={{ bottom: '8px', right: '8px', zIndex: 3 }}
                                                                >
                                                                    {gift.sanphamduoctang.slice(0, 2).map((sp, idx) => {
                                                                        const productImage = sp.sanpham?.hinhanhsanpham?.[0]?.hinhanh;
                                                                        const imageUrl = productImage
                                                                            ? `${API_URL}/assets/client/images/products/${productImage}`
                                                                            : gift.hinhanh;
                                                                        return (
                                                                            <div
                                                                                key={sp.id || idx}
                                                                                className="bg-white rounded-circle border border-2 border-white shadow-sm"
                                                                                style={{ width: '32px', height: '32px', overflow: 'hidden' }}
                                                                                title={sp.sanpham?.ten || 'Sản phẩm tặng'}
                                                                            >
                                                                                <img
                                                                                    src={imageUrl}
                                                                                    alt={sp.sanpham?.ten || 'Sản phẩm tặng'}
                                                                                    className="w-100 h-100"
                                                                                    style={{ objectFit: 'cover' }}
                                                                                    onError={(e) => {
                                                                                        const img = e.currentTarget;
                                                                                        img.onerror = null;
                                                                                        img.src = gift.hinhanh;
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {gift.sanphamduoctang.length > 2 && (
                                                                        <div
                                                                            className="bg-gray-700 text-white rounded-circle d-flex align-items-center justify-content-center text-xs fw-semibold"
                                                                            style={{ width: '32px', height: '32px' }}
                                                                        >
                                                                            +{gift.sanphamduoctang.length - 2}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Link>
                                                        <div className="w-100 h-100 align-items-stretch flex-column justify-content-between d-flex px-10 py-10" style={{ height: '180px' }}>
                                                            {/* Thương hiệu */}
                                                            {brandInfo && (
                                                                <div className="flex-align gap-4">
                                                                    <span
                                                                        className="bg-white text-main-600 border border-1 border-gray-100 rounded-circle flex-center text-xl flex-shrink-0"
                                                                        style={{ width: '30px', height: '30px' }}
                                                                    >
                                                                        <img
                                                                            src={`${API_URL}/assets/client/images/brands/${brandInfo.logo}`}
                                                                            alt={brandInfo.ten}
                                                                            className="w-100 rounded-circle"
                                                                            onError={(e) => {
                                                                                const img = e.currentTarget;
                                                                                img.onerror = null;
                                                                                img.src = '/assets/images/thumbs/placeholder.png';
                                                                            }}
                                                                        />
                                                                    </span>
                                                                    <Link
                                                                        href={`/san-pham?thuonghieu=${brandInfo.slug}`}
                                                                        className="text-sm fw-medium text-gray-600"
                                                                    >
                                                                        {brandInfo.ten}
                                                                    </Link>
                                                                </div>
                                                            )}

                                                            {/* Tiêu đề */}
                                                            <h6 className="title text-lg fw-semibold mt-2 mb-2">
                                                                <Link
                                                                    href={`/chi-tiet-qt?slug=${gift.slug}`}
                                                                    className="link text-line-2"
                                                                    tabIndex={0}
                                                                >
                                                                    {gift.tieude}
                                                                </Link>
                                                            </h6>

                                                            {/* Mô tả */}
                                                            <span className="fw-normal fst-italic text-gray-600 text-sm mt-4 text-line-2">
                                                                {gift.thongtin || 'Không có thông tin'}
                                                            </span>

                                                            {/* Thời gian còn lại */}
                                                            <div className="flex-align gap-8 p-4 bg-gray-50 rounded-6">
                                                                <span className="text-main-600 text-md d-flex">
                                                                    <i className="ph-bold ph-timer"></i>
                                                                </span>
                                                                <span className="text-gray-500 text-sm">
                                                                    {daysLeft > 0
                                                                        ? <>Còn <strong>{daysLeft} ngày</strong></>
                                                                        : <span className="text-danger-600">Đã hết hạn</span>
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Empty state */}
                                        {gifts.length === 0 && !loading && (
                                            <div className="col-12 text-center py-40">
                                                <i className="ph ph-gift text-gray-300" style={{ fontSize: '64px' }}></i>
                                                <p className="text-gray-500 mt-16">Chưa có chương trình quà tặng nào</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pagination */}
                                    {pagination && pagination.last_page > 1 && (
                                        <div className="flex-center flex-wrap gap-8 mt-40">
                                            <button
                                                className={`w-40 h-40 flex-center rounded-6 border ${currentPage === 1 ? 'border-gray-200 text-gray-400' : 'border-gray-100 text-gray-700 hover-bg-main-600 hover-text-white hover-border-main-600'}`}
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                aria-label="Trang trước"
                                            >
                                                <i className="ph ph-caret-left"></i>
                                            </button>

                                            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    className={`w-40 h-40 flex-center rounded-6 border ${currentPage === page
                                                        ? 'bg-main-600 text-white border-main-600'
                                                        : 'border-gray-100 text-gray-700 hover-bg-main-600 hover-text-white hover-border-main-600'}`}
                                                    onClick={() => setCurrentPage(page)}
                                                >
                                                    {page}
                                                </button>
                                            ))}

                                            <button
                                                className={`w-40 h-40 flex-center rounded-6 border ${currentPage === pagination.last_page ? 'border-gray-200 text-gray-400' : 'border-gray-100 text-gray-700 hover-bg-main-600 hover-text-white hover-border-main-600'}`}
                                                onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                                                disabled={currentPage === pagination.last_page}
                                                aria-label="Trang sau"
                                            >
                                                <i className="ph ph-caret-right"></i>
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

            </section>


        </>
    );
}