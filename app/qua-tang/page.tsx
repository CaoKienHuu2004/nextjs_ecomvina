'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import FullHeader from '@/components/FullHeader';

const API_URL = process.env.NEXT_PUBLIC_SERVER_API || 'http://148.230.100.215';

// Interface cho dữ liệu quà tặng từ API mới
interface QuaTang {
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
    tieude: string;
    slug: string;
    thongtin: string;
    hinhanh: string;
    luotxem: number;
    ngaybatdau: string;
    thoigian_conlai: number;
    ngayketthuc: string;
    trangthai: string;
}

interface QuaTangFilters {
    popular: { label: string; param: string; value: string };
    newest: { label: string; param: string; value: string };
    expiring: { label: string; param: string; value: string };
    thuonghieus: { id: number; ten: string }[];
}

interface QuaTangPagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// API trả về object: {data: [...], filters: {...}, pagination: {...}}
interface QuaTangResponse {
    data: QuaTang[];
    filters: QuaTangFilters;
    pagination: QuaTangPagination;
}

// Hàm fetch quà tặng từ API mới
async function fetchQuaTangs(params?: { sort?: string; thuonghieu?: number; page?: number }): Promise<QuaTangResponse> {
    const url = new URL(`${API_URL}/api/quatangs-all`);

    if (params?.sort) url.searchParams.append('sort', params.sort);
    if (params?.thuonghieu) url.searchParams.append('thuonghieu', params.thuonghieu.toString());
    if (params?.page) url.searchParams.append('page', params.page.toString());

    const response = await fetch(url.toString(), {
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
    const [filters, setFilters] = useState<QuaTangFilters | null>(null);
    const [pagination, setPagination] = useState<QuaTangPagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortType, setSortType] = useState<string>('popular');
    const [selectedThuongHieu, setSelectedThuongHieu] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Fetch dữ liệu quà tặng từ API
    useEffect(() => {
        const loadGifts = async () => {
            try {
                setLoading(true);
                const response = await fetchQuaTangs({
                    sort: sortType,
                    thuonghieu: selectedThuongHieu || undefined,
                    page: currentPage,
                });
                // API trả về object: {data, filters, pagination}
                setGifts(response.data || []);
                setFilters(response.filters || null);
                setPagination(response.pagination || null);
            } catch (error) {
                console.error('Error loading gifts:', error);
                setGifts([]);
            } finally {
                setLoading(false);
            }
        };
        loadGifts();
    }, [sortType, selectedThuongHieu, currentPage]);

    // Reset page khi thay đổi filter
    const handleSortChange = (value: string) => {
        setSortType(value);
        setCurrentPage(1);
    };

    const handleThuongHieuChange = (id: number | null) => {
        setSelectedThuongHieu(id);
        setCurrentPage(1);
    };

    const handleClearFilter = () => {
        setSortType('popular');
        setSelectedThuongHieu(null);
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

            <section className="shop py-40">
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

                                {/* Sắp xếp */}
                                <div className="shop-sidebar__box border border-gray-100 rounded-8 p-26 pb-0 mb-32">
                                    <h6 className="text-xl border-bottom border-gray-100 pb-16 mb-16">Sắp xếp ưu đãi</h6>
                                    <ul className="max-h-540 overflow-y-auto scroll-sm">
                                        {[
                                            { value: 'popular', label: filters?.popular?.label || 'Phổ biến' },
                                            { value: 'newest', label: filters?.newest?.label || 'Mới nhất' },
                                            { value: 'expiring', label: filters?.expiring?.label || 'Sắp hết hạn' }
                                        ].map(item => (
                                            <li className="mb-20" key={item.value}>
                                                <div className="form-check common-check common-radio">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="sort"
                                                        id={item.value}
                                                        value={item.value}
                                                        checked={sortType === item.value}
                                                        onChange={() => handleSortChange(item.value)}
                                                    />
                                                    <label className="form-check-label" htmlFor={item.value}>
                                                        {item.label}
                                                    </label>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Nhà cung cấp */}
                                {filters?.thuonghieus && filters.thuonghieus.length > 0 && (
                                    <div className="shop-sidebar__box border border-gray-100 rounded-8 p-26 pb-0 mb-32">
                                        <h6 className="text-xl border-bottom border-gray-100 pb-16 mb-24">Nhà cung cấp</h6>
                                        <ul className="max-h-540 overflow-y-auto scroll-sm">
                                            <li className="mb-16">
                                                <div className="form-check common-check common-radio">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="thuonghieu"
                                                        id="thuonghieu-all"
                                                        checked={selectedThuongHieu === null}
                                                        onChange={() => handleThuongHieuChange(null)}
                                                    />
                                                    <label className="form-check-label" htmlFor="thuonghieu-all">
                                                        Tất cả
                                                    </label>
                                                </div>
                                            </li>
                                            {filters.thuonghieus.map(th => (
                                                <li className="mb-16" key={th.id}>
                                                    <div className="form-check common-check common-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="thuonghieu"
                                                            id={`thuonghieu-${th.id}`}
                                                            checked={selectedThuongHieu === th.id}
                                                            onChange={() => handleThuongHieuChange(th.id)}
                                                        />
                                                        <label className="form-check-label" htmlFor={`thuonghieu-${th.id}`}>
                                                            {th.ten}
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
                                        {gifts.map((gift) => (
                                            <div key={gift.id} className="col-xxl-6 col-xl-6 col-lg-6 col-sm-12 col-md-6 col-xs-12">
                                                <div className="flex-align gap-4 border border-gray-100 hover-border-main-600 rounded-6 transition-2" style={{ height: '180px' }}>
                                                    <Link
                                                        href={`/chi-tiet-qt?slug=${gift.slug}`}
                                                        className="rounded-8 bg-gray-50 h-100"
                                                        style={{ width: '70%' }}
                                                    >
                                                        <img
                                                            src={gift.hinhanh?.startsWith('http') ? gift.hinhanh : `${API_URL}${gift.hinhanh}`}
                                                            alt={gift.tieude}
                                                            className="rounded-start-2 h-100 w-100"
                                                            style={{ objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                const img = e.currentTarget;
                                                                img.onerror = null;
                                                                img.src = '/assets/images/thumbs/placeholder.png';
                                                            }}
                                                        />
                                                    </Link>
                                                    <div className="w-100 h-100 align-items-stretch flex-column justify-content-between d-flex px-10 py-10" style={{ height: '180px' }}>
                                                        {/* Thương hiệu */}
                                                        {gift.thongtin_thuonghieu && (
                                                            <div className="flex-align gap-4">
                                                                <span
                                                                    className="bg-white text-main-600 border border-1 border-gray-100 rounded-circle flex-center text-xl flex-shrink-0"
                                                                    style={{ width: '30px', height: '30px' }}
                                                                >
                                                                    <img
                                                                        src={gift.thongtin_thuonghieu.logo_thuonghieu?.startsWith('http')
                                                                            ? gift.thongtin_thuonghieu.logo_thuonghieu
                                                                            : `${API_URL}${gift.thongtin_thuonghieu.logo_thuonghieu}`}
                                                                        alt={gift.thongtin_thuonghieu.ten_thuonghieu}
                                                                        className="w-100"
                                                                        onError={(e) => {
                                                                            const img = e.currentTarget;
                                                                            img.onerror = null;
                                                                            img.src = '/assets/images/thumbs/placeholder.png';
                                                                        }}
                                                                    />
                                                                </span>
                                                                <Link
                                                                    href={`/san-pham?thuonghieu=${gift.thongtin_thuonghieu.slug_thuonghieu}`}
                                                                    className="text-sm fw-medium text-gray-600"
                                                                >
                                                                    {gift.thongtin_thuonghieu.ten_thuonghieu}
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
                                                                {gift.thoigian_conlai > 0
                                                                    ? <>Còn <strong>{gift.thoigian_conlai} ngày</strong></>
                                                                    : <span className="text-danger-600">Đã hết hạn</span>
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

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