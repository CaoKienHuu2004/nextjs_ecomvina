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
  slug?: string;
  name?: string;
  hinhanh?: string;
  image?: string;
  hinhanhsanpham?: { id?: number; hinhanh?: string }[];
};

type VariantInfo = {
  id?: number | string;
  id_loaibienthe?: number;
  id_sanpham?: number;
  giagoc?: number;
  // nested product
  sanpham?: ProductInfo;

  // đôi khi API cung cấp tên loại ngay trên chitiet
  tenloaibienthe?: string;
  hinhanh?: string;
};

type OrderItem = {
  id: number | string;
  id_bienthe?: number;
  tensanpham?: string;
  tenloaibienthe?: string;
  soluong: number;
  dongia: number;
  // Cấu trúc nested từ API
  id_donhang?: number;
  bienthe?: VariantInfo;

  name?: string;
  hinhanh?: string;
  price?: number;
  quantity?: number;
};

type ServerOrder = {

  id: number | string;
  madon?: string;
  thanhtien?: number;
  tamtinh?: number;

  trangthaithanhtoan?: string;

  trangthai?: string;
  sodienthoai?: string;
  diachinhan?: string;
  nguoinhan?: string;
  khuvucgiao?: string;
  phigiaohang?: number;
  phuongthucvanchuyen?: string;
  
  hinhthucthanhtoan?: string;
  created_at?: string;
  chitietdonhang?: OrderItem[];

  // chitietdonhang?: Array<{
  //   id: number;
  //   id_bienthe?: number;
  //   tensanpham?: string;
  //   soluong?: number;
  //   dongia?: number;
  //   bienthe?: {
  //     hinhanh?: string;
  //     sanpham?: {
  //       ten?: string;
  //       hinhanh?: string;
  //       image?: string;
  //       mediaurl?: string;
  //     }
  //   }
  // }>;
}

// Helper: Định dạng tiền tệ
const fmtMoney = (val?: number | string | null) => {
  return Number(val ?? 0).toLocaleString("vi-VN") + " ₫";
};

export default function HoanTatThanhToanPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") || "";
  

  const [loading, setLoading] = useState<boolean>(true);
  const [order, setOrder] = useState<ServerOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const API = process.env.NEXT_PUBLIC_SERVER_API || "http://148.230.100.215";
  const getAuthHeaders = (): Record<string, string> => {
  const t = Cookies.get("access_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

  // 2. FETCH DATA (Sử dụng logic "Lấy danh sách -> Lọc" để tránh lỗi 404)
  useEffect(() => {

  const loadOrder = async () => {
  if (!orderId) return;
  setLoading(true);
    try {

      const API = process.env.NEXT_PUBLIC_SERVER_API || "http://148.230.100.215";
      const token = Cookies.get("access_token");
      const headers: Record<string, string> = { "Accept": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      // 1) Try status endpoint first (existing)
      const res = await fetch(`${API}/api/tai-khoan/donhangs/${orderId}/status`, {
        headers,
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));

      if (json.status && json.data) {
        setOrder(json.data as ServerOrder);
        setError(null);
        return;
      }


      // 2) If status endpoint returns only status text, try fetching full detail
      if (json.status && (json.payment_status || json.order_status)) {
        try {
          const res2 = await fetch(`${API}/api/tai-khoan/donhangs/${orderId}`, {
            headers,
            credentials: "include",
          });
          const json2 = await res2.json().catch(() => ({}));
          if (json2.status && json2.data) {
            setOrder(json2.data as ServerOrder);
            setError(null);
            return;
          }
        } catch (e) {
          // ignore and fallback to minimal
        }


        // 3) fallback: build a minimal order object from status response
        const minimal: Partial<ServerOrder> = {
          id: orderId,
          madon: json.data?.madon ?? json.madon ?? orderId,
          trangthaithanhtoan: json.payment_status ?? undefined,
          trangthai: json.order_status ?? undefined,
          created_at: undefined,
          chitietdonhang: undefined,
        };
        setOrder(minimal as ServerOrder);
        setError(null);
        return;
      }

      // 4) If none -> error
      setOrder(null);
      setError(json.message || "Không lấy được đơn hàng");
    } catch (err) {

      console.error(err);
      setOrder(null);
      setError("Lỗi khi lấy dữ liệu đơn hàng");
    } finally {
      setLoading(false);
    }
  };


  loadOrder();
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

  const shippingMethod = order?.phuongthucvanchuyen ?? order?.khuvucgiao ?? "Giao hàng tiêu chuẩn (Nội tỉnh)";

  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />


      <div className="page">
        <section className="mt-20 mb-10">
          <div className="container container-lg">

            <div className="text-center mb-20">
              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="#2ABC79" viewBox="0 0 256 256" className="d-inline-block">
                <path d="M176.49,95.51a12,12,0,0,1,0,17l-56,56a12,12,0,0,1-17,0l-24-24a12,12,0,1,1,17-17L112,143l47.51-47.52A12,12,0,0,1,176.49,95.51ZM236,128A108,108,0,1,1,128,20,108.12,108.12,0,0,1,236,128Zm-24,0a84,84,0,1,0-84,84A84.09,84.09,0,0,0,212,128Z"></path>
              </svg>
              <h6 className="mt-10 mb-6">Bạn đã đặt hàng thành công !</h6>
              <div className="text-md text-gray-700">
                <i className="ph-bold ph-smiley-wink text-2xl text-warning-600"></i>
                <span className="mx-2">Siêu Thị Vina đã nhận được đơn hàng của bạn và sớm giao hàng đến tận tay bạn</span>
                <i className="ph-bold ph-smiley-wink text-2xl text-warning-600"></i>
              </div>
            </div>


            <div className="row flex-align-center justify-content-center">
              <div className="col-lg-9">
                <div className="border border-gray-200 p-20 rounded-8 bg-white">
                  <div className="row border-bottom border-gray-200 pb-16 mb-16">
                    <div className="col-lg-4 text-sm text-start">
                      <span className="fw-semibold text-sm text-gray-600">Mã đơn hàng:</span>
                      <span className="fst-italic fw-semibold"> {order ? `#${orderCode}` : orderId ? `#${orderId}` : "#UNKNOWN"}</span>
                    </div>
                    <div className="col-lg-4 text-sm text-center">
                      <span className="fw-semibold text-sm text-gray-600">Trạng thái thanh toán:</span>
                      <div className={`fst-italic ${paymentText?.includes("Đã") ? "text-success-600" : "text-warning-600"}`}>{paymentText}</div>
                    </div>
                    <div className="col-lg-4 text-sm text-end">
                      <span className="fw-semibold text-sm text-gray-600">Ngày đặt:</span>
                      <span className="fst-italic"> {order?.created_at ? new Date(order.created_at).toLocaleString("vi-VN") : orderDate}</span>
                    </div>
                  </div>


                  <div className="flex-align gap-8 flex-between mb-10">
                    <span className="text-md text-gray-900 fw-semibold flex-align gap-8"><i className="ph-bold ph-shopping-cart text-main-600 text-lg"></i> Chi tiết đơn hàng</span>
                    <Link
                      href="/don-hang"
                      onClick={() => {
                        if (typeof window !== "undefined" && order?.id) {
                          try { sessionStorage.setItem("openOrderId", String(order.id)); } catch {}
                        }
                      }}
                      className="fw-semibold text-sm text-gray-600 hover-text-main-600 transition-1 flex-align gap-4 mb-0 pb-0"
                    >
                      <i className="ph-bold ph-notepad"></i> Xem chi tiết
                    </Link>
                  </div>


                  <div className="py-6 px-5">
                    {order?.chitietdonhang && order.chitietdonhang.length > 0 ? (
                      order.chitietdonhang.map((item, idx) => {
                        const tenSP = item.tensanpham ?? item.bienthe?.sanpham?.ten ?? item.name ?? "Sản phẩm";
                        const imgRaw = item.bienthe?.sanpham?.hinhanhsanpham?.[0]?.hinhanh ?? item.bienthe?.sanpham?.hinhanh ?? item.hinhanh ?? "/assets/images/thumbs/placeholder.png";
                        const anhSP = String(imgRaw).startsWith("http") ? String(imgRaw) : `${API}${String(imgRaw).startsWith("/") ? "" : "/"}${String(imgRaw)}`;
                        const qty = item.soluong ?? item.quantity ?? 0;
                        const price = item.dongia ?? item.price ?? 0;
                        const productHref = item.bienthe?.sanpham?.slug ? `/san-pham/${item.bienthe.sanpham.slug}` : "#";


                        return (
                          <div key={item.id ?? idx} className="d-flex align-items-center gap-12 mb-12">
                            <Link href={productHref} className="border border-gray-100 rounded-8 flex-center" style={{ maxWidth: 90, maxHeight: 90, width: "100%", height: "100%" }}>
                              <Image src={anhSP} alt={tenSP} width={90} height={90} className="w-100 rounded-8 object-cover" unoptimized />
                            </Link>
                            <div className="text-start w-100">
                              <h6 className="title text-md fw-semibold mb-0">
                                <Link href={productHref} className="link text-line-2" title={tenSP} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: 350, display: "inline-block" }}>
                                  {tenSP}
                                </Link>
                              </h6>
                              <div className="flex-align gap-16 mb-6">
                                <div className="btn bg-gray-50 text-heading text-xs py-4 px-6 rounded-8 flex-center gap-8 fw-medium">{item.tenloaibienthe ?? item.bienthe?.tenloaibienthe ?? ""}</div>
                              </div>
                              <div className="product-card__price mb-6">
                                <div className="flex-align gap-24">
                                  <span className="text-heading text-sm fw-medium">Số lượng: {qty}</span>
                                  <span className="text-main-600 text-md fw-semibold">{fmtMoney(price)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10 text-gray-600">Không có sản phẩm để hiển thị</div>
                    )}
                  </div>

                  <div className="row border-top border-gray-200 pt-16 mt-16">
                    <div className="col-lg-4 text-sm text-start">
                      <div className="fw-semibold text-sm text-gray-600"><span className="pe-10">Phương thức vận chuyển:</span></div>
                      <span className="fw-medium text-gray-900 text-sm">{shippingMethod}</span>
                    </div>
                    <div className="col-lg-4 text-sm text-center"></div>
                    <div className="col-lg-4 text-sm text-end">
                      <div className="fw-semibold text-sm text-gray-600">Tổng giá trị đơn hàng:</div>
                      <span className="fw-semibold text-main-600 text-lg">{totalAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-align flex-between gap-12 mb-20 mt-16">
                  <Link href="/shop" className="text-main-600 hover-text-gray-900 text-md fw-medium flex-align gap-8 mt-10"><i className="ph-bold ph-arrow-fat-lines-left text-md"></i> Tiếp tục mua sắm</Link>
                  <Link href="/don-hang" className="text-main-600 hover-text-gray-900 text-md fw-medium flex-align gap-8 mt-10">Xem đơn hàng của tôi <i className="ph-bold ph-arrow-fat-lines-right text-md"></i></Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <BenefitsStrip />
    </>
  );
}