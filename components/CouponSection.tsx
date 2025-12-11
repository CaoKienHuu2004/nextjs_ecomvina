"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { type Coupon } from "@/lib/api";
import { useHomeData } from "@/hooks/useHomeData";
import { useCart } from '@/hooks/useCart';

export default function CouponSection() {
    const { data: homeData } = useHomeData();
    const { availableVouchers } = useCart();

    // Local coupons state (was a const derived value previously)
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const [direction, setDirection] = useState<"next" | "prev">("next");

    const ITEMS_PER_VIEW = 3;

    // Keep coupons in sync with homeData and availableVouchers
    useEffect(() => {
        // get home coupons safely (HomePageResponse.data.new_coupon may be undefined)
        const homeCoupons = (homeData?.data?.new_coupon ?? []) as Coupon[];
        const activeHomeCoupons = homeCoupons.filter((c: Coupon) => c.trangthai === "Hoạt động");

        if (availableVouchers && availableVouchers.length > 0) {
            setCoupons(availableVouchers);
        } else {
            setCoupons(activeHomeCoupons);
        }
    }, [homeData, availableVouchers]);

    useEffect(() => {
        // no-op guard: if we later fetch something async, we can reuse setLoading
        setLoading(false);
    }, []);

    const handleCopyCoupon = (coupon: Coupon) => {
        // Use magiamgia or code; ensure string
        const raw = coupon.magiamgia ?? coupon.code ?? "";
        const code = String(raw);
        navigator.clipboard.writeText(code).then(() => {
            setCopiedId(coupon.id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const totalCoupons = coupons.length;

    const slides = useMemo(() => {
        if (totalCoupons === 0) return [] as Coupon[][];
        const list: Coupon[][] = [];
        for (let start = 0; start < totalCoupons; start += 1) {
            const slide: Coupon[] = [];
            for (let i = 0; i < ITEMS_PER_VIEW; i++) {
                slide.push(coupons[(start + i) % totalCoupons]);
            }
            list.push(slide);
        }
        return list;
    }, [coupons, totalCoupons]);

    const totalSlides = slides.length;

    useEffect(() => {
        setActiveSlide(0);
    }, [totalSlides]);

    const handleNavigate = useCallback((dir: "next" | "prev") => {
        if (totalSlides <= 1) return;
        setDirection(dir);
        setActiveSlide((prev) => {
            if (dir === "next") {
                return (prev + 1) % totalSlides;
            }
            return (prev - 1 + totalSlides) % totalSlides;
        });
    }, [totalSlides]);

    const canNavigate = totalSlides > 1;

    useEffect(() => {
        if (!canNavigate) return;
        const timer = setInterval(() => {
            handleNavigate("next");
        }, 4000);
        return () => clearInterval(timer);
    }, [canNavigate, handleNavigate]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    if (loading) return null;
    if (coupons.length === 0) return null;

    return (
        <section className="py-16 overflow-hidden coupon-section" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #fff5f2 100%)' }}>
            <div className="container container-lg">
                <div className="mb-24 section-heading">
                    <div className="flex-wrap gap-8 flex-between">
                        <div className="gap-10 flex-align">
                            <div className="coupon-icon-badge">
                                <i className="ph-fill ph-ticket text-white"></i>
                            </div>
                            <div>
                                <h2 className="mb-1 fw-bold" style={{ fontSize: '22px', color: '#1a1a1a', letterSpacing: '-0.3px' }}>
                                    Mã giảm giá mới
                                </h2>
                                <p className="mb-0 text-gray-600" style={{ fontSize: '13px' }}>Tiết kiệm nhiều hơn với các ưu đãi đặc biệt</p>
                            </div>
                        </div>
                        <div className="gap-16 flex-align">
                            <a
                                href="/coupons"
                                className="view-all-link text-sm fw-semibold d-flex align-items-center gap-2"
                            >
                                <span>Xem tất cả</span>
                                <i className="ph ph-arrow-right"></i>
                            </a>
                            <div className="gap-8 flex-align">
                                <button
                                    type="button"
                                    className="nav-btn"
                                    onClick={() => handleNavigate("prev")}
                                    disabled={!canNavigate}
                                    aria-label="Xem mã trước"
                                >
                                    <i className="ph-bold ph-caret-left"></i>
                                </button>
                                <button
                                    type="button"
                                    className="nav-btn"
                                    onClick={() => handleNavigate("next")}
                                    disabled={!canNavigate}
                                    aria-label="Xem mã tiếp"
                                >
                                    <i className="ph-bold ph-caret-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="coupon-slider__viewport">
                    <div
                        className={`coupon-slider__track slide-${direction}`}
                        style={{
                            transform: `translateX(-${activeSlide * 100}%)`,
                        }}
                    >
                        {slides.map((slide, slideIdx) => (
                            <div
                                className="coupon-slider__slide"
                                key={`coupon-slide-${slideIdx}`}
                            >
                                <div className="row g-16">
                                    {slide.map((coupon) => (
                                        <div key={coupon.id} className="col-lg-4 col-md-6">
                                            <div className="coupon-card-wrapper">
                                                <div className="overflow-hidden coupon-card">
                                                    <div className="coupon-header">
                                                        <div className="coupon-header-content">
                                                            <div className="coupon-value-container">
                                                                <div className="coupon-label">
                                                                    <i className="ph-fill ph-seal-check me-1"></i>
                                                                    Giảm ngay
                                                                </div>
                                                                <div className="coupon-value">
                                                                    {formatCurrency(coupon.giatri)}
                                                                </div>
                                                            </div>
                                                            <div className="coupon-badge">
                                                                <i className="ph-fill ph-seal-percent"></i>
                                                            </div>
                                                        </div>
                                                        <div className="coupon-wave"></div>
                                                    </div>

                                                    <div className="coupon-body">
                                                        <div className="coupon-title-wrapper">
                                                            <h6 className="coupon-title">
                                                                {coupon.mota}
                                                            </h6>
                                                        </div>

                                                        <div className="coupon-info">
                                                            <div className="info-item">
                                                                <div className="info-icon-wrapper">
                                                                    <i className="ph-fill ph-info"></i>
                                                                </div>
                                                                <span className="info-text">
                                                                    <strong>Điều kiện:</strong> {coupon.dieukien}
                                                                </span>
                                                            </div>
                                                            <div className="info-item">
                                                                <div className="info-icon-wrapper">
                                                                    <i className="ph-fill ph-calendar-check"></i>
                                                                </div>
                                                                <span className="info-text">
                                                                    <strong>HSD:</strong> {formatDate(coupon.ngaybatdau)} - {formatDate(coupon.ngayketthuc)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="coupon-code-section">
                                                            <div className="coupon-code-box">
                                                                <div className="code-label">MÃ GIẢM GIÁ</div>
                                                                <div className="code-value">
                                                                    {String(coupon.magiamgia ?? coupon.code ?? "")}
                                                                </div>
                                                                <div className="code-dashes">
                                                                    <span></span><span></span><span></span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleCopyCoupon(coupon)}
                                                                className={`copy-button ${copiedId === coupon.id ? 'copied' : ''}`}
                                                            >
                                                                <i className={copiedId === coupon.id ? "ph-fill ph-check-circle" : "ph-bold ph-copy"}></i>
                                                                <span>{copiedId === coupon.id ? "Đã sao chép" : "Sao chép"}</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
            /* Section Header Styling */
            .coupon-icon-badge {
              width: 44px;
              height: 44px;
              background: linear-gradient(135deg, #f2572b 0%, #ff6b3c 100%);
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(242, 87, 43, 0.25);
              animation: pulse-icon 2s ease-in-out infinite;
            }
            
            .coupon-icon-badge i {
              font-size: 22px;
            }
            
            @keyframes pulse-icon {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
            
            .view-all-link {
              color: #f2572b;
              text-decoration: none;
              transition: all 0.3s ease;
              padding: 8px 16px;
              border-radius: 8px;
            }
            
            .view-all-link:hover {
              background: rgba(242, 87, 43, 0.1);
              color: #d94a23;
              transform: translateX(4px);
            }
            
            .nav-btn {
              width: 36px;
              height: 36px;
              border: 2px solid #f2572b;
              background: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #f2572b;
              font-size: 16px;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
            }
            
            .nav-btn:hover:not(:disabled) {
              background: #f2572b;
              color: white;
              transform: scale(1.1);
              box-shadow: 0 4px 12px rgba(242, 87, 43, 0.3);
            }
            
            .nav-btn:disabled {
              opacity: 0.4;
              cursor: not-allowed;
            }
            
            /* Card Container */
            .coupon-card-wrapper {
              padding: 8px;
              height: 100%;
            }
            
            .coupon-card {
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
              transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
              height: 100%;
              display: flex;
              flex-direction: column;
              position: relative;
            }
            
            .coupon-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(135deg, rgba(242, 87, 43, 0.05) 0%, rgba(255, 107, 60, 0.05) 100%);
              opacity: 0;
              transition: opacity 0.4s ease;
              pointer-events: none;
            }
            
            .coupon-card:hover {
              transform: translateY(-8px);
              box-shadow: 0 10px 24px rgba(242, 87, 43, 0.18);
            }
            
            .coupon-card:hover::before {
              opacity: 1;
            }
            
            /* Header Section */
            .coupon-header {
              background: linear-gradient(135deg, #f2572b 0%, #ff6b3c 50%, #ff8866 100%);
              padding: 16px;
              position: relative;
              overflow: hidden;
            }
            
            .coupon-header::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -20%;
              width: 200px;
              height: 200px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
              animation: float 6s ease-in-out infinite;
            }
            
            @keyframes float {
              0%, 100% { transform: translate(0, 0) rotate(0deg); }
              50% { transform: translate(-20px, 20px) rotate(180deg); }
            }
            
            .coupon-header-content {
              display: flex;
              justify-content: space-between;
              align-items: center;
              position: relative;
              z-index: 1;
            }
            
            .coupon-value-container {
              flex: 1;
            }
            
            .coupon-label {
              color: rgba(255, 255, 255, 0.95);
              font-size: 10px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              margin-bottom: 4px;
              display: flex;
              align-items: center;
            }
            
            .coupon-value {
              color: white;
              font-size: 22px;
              font-weight: 800;
              line-height: 1;
              text-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
              letter-spacing: -0.5px;
            }
            
            .coupon-badge {
              width: 44px;
              height: 44px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 22px;
              color: white;
              backdrop-filter: blur(10px);
              animation: rotate-badge 20s linear infinite;
            }
            
            @keyframes rotate-badge {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            
            .coupon-wave {
              position: absolute;
              bottom: -1px;
              left: 0;
              width: 100%;
              height: 20px;
              background: white;
              clip-path: polygon(0 50%, 5% 0, 10% 50%, 15% 0, 20% 50%, 25% 0, 30% 50%, 35% 0, 40% 50%, 45% 0, 50% 50%, 55% 0, 60% 50%, 65% 0, 70% 50%, 75% 0, 80% 50%, 85% 0, 90% 50%, 95% 0, 100% 50%, 100% 100%, 0 100%);
            }
            
            /* Body Section */
            .coupon-body {
              padding: 16px;
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            
            .coupon-title-wrapper {
              min-height: 36px;
            }
            
            .coupon-title {
              font-size: 14px;
              font-weight: 700;
              color: #1a1a1a;
              line-height: 1.4;
              margin: 0;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            
            /* Info Section */
            .coupon-info {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            
            .info-item {
              display: flex;
              align-items: flex-start;
              gap: 8px;
              padding: 8px;
              background: #f8f9fa;
              border-radius: 8px;
              transition: all 0.3s ease;
            }
            
            .info-item:hover {
              background: #fff5f2;
              transform: translateX(4px);
            }
            
            .info-icon-wrapper {
              width: 20px;
              height: 20px;
              background: linear-gradient(135deg, #f2572b, #ff6b3c);
              border-radius: 5px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 11px;
              flex-shrink: 0;
            }
            
            .info-text {
              font-size: 11px;
              color: #666;
              line-height: 1.5;
              flex: 1;
            }
            
            .info-text strong {
              color: #333;
              font-weight: 600;
            }
            
            /* Code Section */
            .coupon-code-section {
              margin-top: auto;
              display: flex;
              gap: 12px;
              align-items: stretch;
            }
            
            .coupon-code-box {
              flex: 1;
              background: linear-gradient(135deg, #fff5f2 0%, #ffe8e0 100%);
              border: 2px dashed #f2572b;
              border-radius: 10px;
              padding: 10px;
              position: relative;
              overflow: hidden;
            }
            
            .coupon-code-box::before {
              content: '';
              position: absolute;
              top: -2px;
              left: -2px;
              right: -2px;
              bottom: -2px;
              background: linear-gradient(45deg, #f2572b, #ff6b3c, #f2572b);
              background-size: 200% 200%;
              border-radius: 12px;
              z-index: -1;
              opacity: 0;
              transition: opacity 0.3s ease;
              animation: gradient-shift 3s ease infinite;
            }
            
            @keyframes gradient-shift {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            
            .coupon-code-box:hover::before {
              opacity: 0.3;
            }
            
            .code-label {
              font-size: 9px;
              font-weight: 700;
              color: #f2572b;
              letter-spacing: 0.8px;
              margin-bottom: 6px;
            }
            
            .code-value {
              font-size: 16px;
              font-weight: 800;
              color: #1a1a1a;
              font-family: "Courier New", monospace;
              letter-spacing: 1.5px;
              text-align: center;
            }
            
            .code-dashes {
              display: flex;
              justify-content: center;
              gap: 3px;
              margin-top: 6px;
            }
            
            .code-dashes span {
              width: 14px;
              height: 2px;
              background: #f2572b;
              border-radius: 1px;
            }
            
            .copy-button {
              width: 70px;
              background: linear-gradient(135deg, #f2572b 0%, #ff6b3c 100%);
              border: none;
              border-radius: 10px;
              color: white;
              font-size: 10px;
              font-weight: 700;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 4px;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 3px 10px rgba(242, 87, 43, 0.3);
              position: relative;
              overflow: hidden;
            }
            
            .copy-button::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
              transition: left 0.5s ease;
            }
            
            .copy-button:hover::before {
              left: 100%;
            }
            
            .copy-button i {
              font-size: 18px;
            }
            
            .copy-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(242, 87, 43, 0.4);
            }
            
            .copy-button:active {
              transform: translateY(0);
            }
            
            .copy-button.copied {
              background: linear-gradient(135deg, #00b207 0%, #00d909 100%);
              box-shadow: 0 4px 12px rgba(0, 178, 7, 0.3);
            }
            
            .copy-button.copied::after {
              content: '✓';
              position: absolute;
              font-size: 40px;
              color: white;
              animation: checkmark 0.5s ease;
            }
            
            @keyframes checkmark {
              0% { transform: scale(0) rotate(-45deg); opacity: 0; }
              50% { transform: scale(1.2) rotate(0deg); opacity: 1; }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            
            /* Responsive Design */
            @media (max-width: 768px) {
              .coupon-icon-badge {
                width: 38px;
                height: 38px;
              }
              
              .coupon-icon-badge i {
                font-size: 18px;
              }
              
              .coupon-value {
                font-size: 18px;
              }
              
              .coupon-badge {
                width: 36px;
                height: 36px;
                font-size: 18px;
              }
              
              .nav-btn {
                width: 32px;
                height: 32px;
                font-size: 14px;
              }
              
              .copy-button {
                width: 60px;
                font-size: 9px;
              }
              
              .copy-button i {
                font-size: 16px;
              }
            }
          `}</style>
        </section>
    );
}