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
  dongia?: number;
  thanhtien: number;
  tamtinh?: number;
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
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";
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

        const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";
        const token = Cookies.get("access_token");
        const headers: Record<string, string> = { "Accept": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        // 1) Try status endpoint first (existing)
        const res = await fetch(`${API}/api/v1/don-hang/${orderId}/status`, {
          headers,
          // credentials: "include",
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
            const res2 = await fetch(`${API}/api/v1/don-hang/${orderId}`, {
              headers,
              // credentials: "include",
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

            <div className="mb-20 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="#2ABC79" viewBox="0 0 256 256" className="d-inline-block">
                <path d="M176.49,95.51a12,12,0,0,1,0,17l-56,56a12,12,0,0,1-17,0l-24-24a12,12,0,1,1,17-17L112,143l47.51-47.52A12,12,0,0,1,176.49,95.51ZM236,128A108,108,0,1,1,128,20,108.12,108.12,0,0,1,236,128Zm-24,0a84,84,0,1,0-84,84A84.09,84.09,0,0,0,212,128Z"></path>
              </svg>
              <h6 className="mt-10 mb-6">Bạn đã đặt hàng thành công !</h6>
              <div className="text-gray-700 text-md">
                <i className="text-2xl ph-bold ph-smiley-wink text-warning-600"></i>
                <span className="mx-2">Siêu Thị Vina đã nhận được đơn hàng của bạn và sớm giao hàng đến tận tay bạn</span>
                <i className="text-2xl ph-bold ph-smiley-wink text-warning-600"></i>
              </div>
            </div>


            <div className="row flex-align-center justify-content-center">
              <div className="col-lg-9">
                <div className="p-20 bg-white border border-gray-200 rounded-8">
                  <div className="pb-16 mb-16 border-gray-200 row border-bottom">
                    <div className="text-sm col-lg-4 text-start">
                      <span className="text-sm text-gray-600 fw-semibold">Mã đơn hàng:</span>
                      <span className="fst-italic fw-semibold"> {order ? `#${orderCode}` : orderId ? `#${orderId}` : "#UNKNOWN"}</span>
                    </div>
                    <div className="text-sm text-center col-lg-4">
                      <span className="text-sm text-gray-600 fw-semibold">Trạng thái thanh toán:</span>
                      <div className={`fst-italic ${paymentText?.includes("Đã") ? "text-success-600" : "text-warning-600"}`}>{paymentText}</div>
                    </div>
                    <div className="text-sm col-lg-4 text-end">
                      <span className="text-sm text-gray-600 fw-semibold">Ngày đặt:</span>
                      <span className="fst-italic"> {order?.created_at ? new Date(order.created_at).toLocaleString("vi-VN") : orderDate}</span>
                    </div>
                  </div>


                  <div className="gap-8 mb-10 flex-align flex-between">
                    <span className="gap-8 text-gray-900 text-md fw-semibold flex-align"><i className="text-lg ph-bold ph-shopping-cart text-main-600"></i> Chi tiết đơn hàng</span>
                    <Link
                      href="/don-hang"
                      onClick={() => {
                        if (typeof window !== "undefined" && order?.id) {
                          try { sessionStorage.setItem("openOrderId", String(order.id)); } catch { }
                        }
                      }}
                      className="gap-4 pb-0 mb-0 text-sm text-gray-600 fw-semibold hover-text-main-600 transition-1 flex-align"
                    >
                      <i className="ph-bold ph-notepad"></i> Xem chi tiết
                    </Link>
                  </div>


                  <div className="px-5 py-6">
                    {order?.chitietdonhang && order.chitietdonhang.length > 0 ? (
                      (() => {
                        // tách chính / quà tặng
                        const raw = order.chitietdonhang!;
                        const gifts = raw.filter(i => Number(i.thanhtien ?? i.tamtinh ?? i.dongia ?? NaN) === 0);
                        const mains = raw.filter(i => !gifts.includes(i));
                        const renderRow = (item: any, idx: number, isGift = false) => {
                          const tenSP = item.tensanpham ?? item.bienthe?.sanpham?.ten ?? item.name ?? "Sản phẩm";
                          const imgRaw = item.bienthe?.sanpham?.hinhanhsanpham?.[0]?.hinhanh ?? item.bienthe?.sanpham?.hinhanh ?? item.hinhanh ?? "/assets/images/thumbs/placeholder.png";
                          const anhSP = String(imgRaw).startsWith("http") ? String(imgRaw) : `${API}${String(imgRaw).startsWith("/") ? "" : "/"}${String(imgRaw)}`;
                          const qty = item.soluong ?? item.quantity ?? 0;
                          const price = isGift ? 0 : (item.dongia ?? item.price ?? item.thanhtien ?? 0);
                          const productHref = item.bienthe?.sanpham?.slug ? `/san-pham/${item.bienthe.sanpham.slug}` : "#";

                          return (
                            <div key={item.id ?? idx} className="gap-12 mb-12 d-flex align-items-center">
                              <Link href={productHref} className="border border-gray-100 rounded-8 flex-center" style={{ maxWidth: 90, maxHeight: 90, width: "100%", height: "100%" }}>
                                <Image src={anhSP} alt={tenSP} width={90} height={90} className="object-cover w-100 rounded-8" unoptimized />
                              </Link>
                              <div className="text-start w-100">
                                <h6 className="mb-0 title text-md fw-semibold">
                                  <Link href={productHref} className="link text-line-2" title={tenSP} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: 350, display: "inline-block" }}>
                                    {tenSP}
                                  </Link>
                                </h6>
                                <div className="gap-16 mb-6 flex-align">
                                  <div className="gap-8 px-6 py-4 text-xs btn bg-gray-50 text-heading rounded-8 flex-center fw-medium">{item.tenloaibienthe ?? item.bienthe?.tenloaibienthe ?? ""}</div>
                                </div>
                                <div className="mb-6 product-card__price">
                                  <div className="gap-24 flex-align">
                                    <span className="text-sm text-heading fw-medium">Số lượng: {qty}</span>
                                    <span className="text-main-600 text-md fw-semibold">{fmtMoney(price)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        };

                        return (
                          <>
                            {mains.map((it, i) => renderRow(it, i, false))}
                            {gifts.length > 0 && (
                              <>
                                <div className="gap-8 mb-12 flex-align">
                                  <i className="text-lg ph-bold ph-gift text-main-600 pe-6"></i>
                                  <h6 className="m-0 text-md fw-semibold">Quà tặng nhận được</h6>
                                </div>
                                {gifts.map((it, i) => renderRow(it, i, true))}
                              </>
                            )}
                          </>
                        );
                      })()
                    ) : (
                      <div className="py-10 text-center text-gray-600">Không có sản phẩm để hiển thị</div>
                    )}
                  </div>

                  <div className="pt-16 mt-16 border-gray-200 row border-top">
                    <div className="text-sm col-lg-4 text-start">
                      <div className="text-sm text-gray-600 fw-semibold"><span className="pe-10">Phương thức vận chuyển:</span></div>
                      <span className="text-sm text-gray-900 fw-medium">{shippingMethod}</span>
                    </div>
                    <div className="text-sm text-center col-lg-4"></div>
                    <div className="text-sm col-lg-4 text-end">
                      <div className="text-sm text-gray-600 fw-semibold">Tổng giá trị đơn hàng:</div>
                      <span className="text-lg fw-semibold text-main-600">{totalAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="gap-12 mt-16 mb-20 flex-align flex-between">
                  <Link href="/shop" className="gap-8 mt-10 text-main-600 hover-text-gray-900 text-md fw-medium flex-align"><i className="ph-bold ph-arrow-fat-lines-left text-md"></i> Tiếp tục mua sắm</Link>
                  <Link href="/don-hang" className="gap-8 mt-10 text-main-600 hover-text-gray-900 text-md fw-medium flex-align">Xem đơn hàng của tôi <i className="ph-bold ph-arrow-fat-lines-right text-md"></i></Link>
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