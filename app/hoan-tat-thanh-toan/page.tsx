"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import FullHeader from "@/components/FullHeader";
import BenefitsStrip from "@/components/BenefitsStrip";
import Cookies from "js-cookie";

// ==================================================
// 1. TYPE DEFINITIONS (CHUẨN HÓA)
// ==================================================

type ProductInfo = {
    id?: number | string;
    ten?: string;
    name?: string;
    hinhanh?: string;
    image?: string;
    mediaurl?: string;
};

type VariantInfo = {
    id?: number | string;
    ten?: string;
    sanpham?: ProductInfo;
    loaibienthe?: { ten?: string };
    hinhanh?: string; // Ảnh riêng của biến thể
};

type OrderItem = {
    id: number | string;
    soluong: number;
    dongia: number;
    // Cấu trúc nested từ API
    bienthe?: VariantInfo;
    // Fallback cấu trúc phẳng
    product?: ProductInfo;
};

type ServerOrder = {
    id: string | number;
    madon?: string;
    thanhtien?: number;
    tamtinh?: number;

    // Trạng thái
    trangthai: string;
    trangthaithanhtoan?: string;

    // Phương thức
    id_phuongthuc?: number;
    paymentMethod?: string;
    phuongthucvanchuyen?: string;

    created_at?: string;
    chitietdonhang?: OrderItem[];
};

// Helper: Định dạng tiền tệ
const fmtMoney = (val?: number | string | null) => {
    return Number(val ?? 0).toLocaleString("vi-VN") + " ₫";
};

export default function HoanTatThanhToanPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("order_id") || "";

    const [loading] = useState<boolean>(true);
    const [order, setOrder] = useState<ServerOrder | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 2. FETCH DATA (Sử dụng logic "Lấy danh sách -> Lọc" để tránh lỗi 404)
    useEffect(() => {
        const checkPayment = async () => {
            if (!orderId) return;
            try {
                const API = process.env.NEXT_PUBLIC_SERVER_API || "http://148.230.100.215";
                const token = Cookies.get("access_token");

                // Gọi API danh sách đơn hàng (API này ổn định nhất)
                // const res = await fetch(`${API}/api/toi/donhangs`, {
                //     headers: { 
                //         "Accept": "application/json",
                //         ...(token ? { "Authorization": `Bearer ${token}` } : {})
                //     },
                //     credentials: "include" 
                // });
                const res = await fetch(`${API}/api/toi/donhangs/${orderId}/payment-status`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                    credentials: "include"
                });

                const json = await res.json();
                if (json.status) {
                    setOrder((prev) => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            trangthaithanhtoan: json.payment_status,
                            trangthai: json.order_status
                        };
                    });
                }
            } catch (err) {
                console.log("Payment check failed");
            }
        };

        checkPayment();
    }, [orderId]);

    // Chuẩn bị dữ liệu hiển thị
    const isSuccess = !!order;
    const orderCode = order?.madon || orderId || "#UNKNOWN";
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            // Kiểm tra nếu date không hợp lệ (Invalid Date)
            if (isNaN(date.getTime())) return dateString; // Trả về nguyên gốc nếu không parse được
            return date.toLocaleString("vi-VN");
        } catch {
            return dateString || "";
        }
    };
    const orderDate = order?.created_at ?? "";


    const paymentText = order?.trangthaithanhtoan || "Thanh toán khi nhận hàng";
    const totalAmount = fmtMoney(order?.thanhtien);
    const shippingMethod = order?.phuongthucvanchuyen || "Giao hàng tiêu chuẩn (Nội tỉnh)";

    return (
        <>
            <FullHeader showClassicTopBar={true} showTopNav={false} />

            <div className="page bg-white-50">
                <section className="py-40 mt-20 mb-10">
                    <div className="container container-lg">

                        {/* HEADER THÔNG BÁO */}
                        <div className="mb-40 text-center">
                            {isSuccess ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="#2ABC79" viewBox="0 0 256 256" className="d-inline-block">
                                        <path d="M176.49,95.51a12,12,0,0,1,0,17l-56,56a12,12,0,0,1-17,0l-24-24a12,12,0,1,1,17-17L112,143l47.51-47.52A12,12,0,0,1,176.49,95.51ZM236,128A108,108,0,1,1,128,20,108.12,108.12,0,0,1,236,128Zm-24,0a84,84,0,1,0-84,84A84.09,84.09,0,0,0,212,128Z"></path>
                                    </svg>
                                    <h4 className="mt-16 mb-8 text-success-600">Bạn đã đặt hàng thành công!</h4>
                                    <div className="gap-8 text-gray-600 text-md flex-align justify-content-center">
                                        <i className="text-2xl ph-bold ph-smiley-wink text-warning-600"></i>
                                        <span>Siêu Thị Vina đã nhận được đơn hàng của bạn và sớm giao hàng đến tận tay bạn</span>
                                        <i className="text-2xl ph-bold ph-smiley-wink text-warning-600"></i>
                                    </div>
                                </>
                            ) : loading ? (
                                <div className="spinner-border text-main-600" role="status"></div>
                            ) : (
                                <div className="text-danger-600">
                                    <h4>{error || "Có lỗi xảy ra"}</h4>
                                    <Link href="/" className="mt-4 btn btn-main rounded-pill">Về trang chủ</Link>
                                </div>
                            )}
                        </div>

                        {/* CHI TIẾT ĐƠN HÀNG */}
                        {order && (
                            <div className="row flex-align-center justify-content-center">
                                <div className="col-lg-9">
                                    <div className="p-24 bg-white border border-gray-200 shadow-sm rounded-12">

                                        {/* Thông tin chung */}
                                        <div className="pb-16 mb-16 border-gray-200 row border-bottom g-3">
                                            <div className="col-md-4 text-start">
                                                <span className="text-sm text-gray-500 fw-semibold d-block">Mã đơn hàng:</span>
                                                <span className="fw-bold text-heading fst-italic">#{orderCode}</span>
                                            </div>
                                            <div className="col-md-4 text-md-center text-start">
                                                <span className="text-sm text-gray-500 fw-semibold d-block">Trạng thái thanh toán:</span>
                                                <span className={`fw-medium fst-italic ${order.trangthaithanhtoan?.includes('Đã') ? 'text-success-600' : 'text-warning-600'}`}>
                                                    {paymentText}
                                                </span>
                                            </div>
                                            <div className="col-md-4 text-md-end text-start">
                                                <span className="text-sm text-gray-500 fw-semibold d-block">Ngày đặt:</span>
                                                <span className="fw-medium text-heading fst-italic">{orderDate}</span>
                                            </div>
                                        </div>

                                        {/* Header Danh sách */}
                                        <div className="gap-8 mb-16 flex-align flex-between">
                                            <span className="gap-8 text-gray-900 text-md fw-bold flex-align">
                                                <i className="text-xl ph-bold ph-shopping-cart text-main-600"></i>
                                                Chi tiết đơn hàng
                                            </span>
                                            <Link href={`/don-hang`} className="gap-4 text-sm text-gray-600 fw-semibold hover-text-main-600 transition-1 flex-align">
                                                <i className="ph-bold ph-notepad"></i> Xem chi tiết đầy đủ
                                            </Link>
                                        </div>

                                        {/* Danh sách sản phẩm */}
                                        <div className="px-5 py-6 bg-gray-50 rounded-8">
                                            {order.chitietdonhang?.map((item, idx) => {
                                                // Logic map dữ liệu (Không dùng any)
                                                const sp = item.bienthe?.sanpham || item.product || {};

                                                const tenSP = sp.ten ?? sp.name ?? "Sản phẩm";
                                                // Ưu tiên ảnh biến thể -> ảnh sản phẩm -> fallback
                                                const anhRaw = item.bienthe?.hinhanh ?? sp.hinhanh ?? sp.image ?? sp.mediaurl ?? "/assets/images/thumbs/placeholder.png";
                                                // Xử lý URL tương đối
                                                const anhSP = anhRaw.startsWith("http") ? anhRaw : `http://148.230.100.215${anhRaw.startsWith('/') ? '' : '/'}${anhRaw}`;

                                                const loaiSP = item.bienthe?.loaibienthe?.ten;

                                                return (
                                                    <div key={idx} className="gap-16 p-16 border-gray-200 d-flex align-items-center border-bottom last:border-0">
                                                        {/* Hình ảnh */}
                                                        <Link href="#" className="bg-white border border-gray-200 rounded-8 flex-center" style={{ width: 80, height: 80, flexShrink: 0 }}>
                                                            <Image src={anhSP} alt={tenSP} width={80} height={80} className="w-100 h-100 object-fit-contain rounded-8" unoptimized />
                                                        </Link>

                                                        {/* Nội dung */}
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-4 title text-md fw-semibold">
                                                                <span className="link text-line-2" title={tenSP}>{tenSP}</span>
                                                            </h6>

                                                            {loaiSP && (
                                                                <div className="mb-4">
                                                                    <span className="px-8 py-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-pill">
                                                                        {loaiSP}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div className="mt-8 flex-between">
                                                                <span className="text-sm text-gray-500 fw-medium">
                                                                    Số lượng: <b className="text-heading">{item.soluong}</b>
                                                                </span>
                                                                <span className="text-main-600 text-md fw-bold">
                                                                    {fmtMoney(item.dongia)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Footer */}
                                        <div className="pt-20 mt-20 border-gray-200 border-top">
                                            <div className="row align-items-center gy-3">
                                                <div className="col-md-6">
                                                    <div className="mb-1 text-sm text-gray-500">Phương thức vận chuyển:</div>
                                                    <div className="fw-medium text-heading">{shippingMethod}</div>
                                                </div>
                                                <div className="col-md-6 text-md-end">
                                                    <div className="mb-1 text-sm text-gray-500">Tổng giá trị đơn hàng:</div>
                                                    <div className="text-xl fw-bold text-main-600">{totalAmount}</div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="gap-12 mb-20 flex-align flex-between">
                                        <Link href="/shop" className="gap-8 mt-10 text-main-600 hover-text-gray-900 text-md fw-medium flex-align">
                                            <i className="ph-bold ph-arrow-fat-lines-left text-md"></i> Tiếp tục mua sắm
                                        </Link>
                                        <Link href="/don-hang" className="gap-8 mt-10 text-main-600 hover-text-gray-900 text-md fw-medium flex-align">
                                            Đơn hàng của tôi <i className="ph-bold ph-arrow-fat-lines-right text-md"></i>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <BenefitsStrip />
        </>
    );
}