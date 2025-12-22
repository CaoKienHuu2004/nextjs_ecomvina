"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Cookies from "js-cookie";

// --- Types (Đồng bộ với hệ thống) ---
type OrderItem = {
  id: number;
  soluong: number;
  dongia: number;
  bienthe?: {
    sanpham?: { ten?: string; slug?: string };
    loaibienthe?: { ten?: string };
  };
};

type ServerOrder = {
  id: number;
  madon: string;
  thanhtien: number;
  tamtinh?: number;
  trangthai: string;
  trangthaithanhtoan?: string;
  created_at?: string;
  chitietdonhang?: OrderItem[];
};

export default function OrderLookupResult() {
  const search = useSearchParams();
  const code = search?.get("madon")?.trim() ?? "";
  const phone = search?.get("sodienthoai")?.trim() ?? "";

  const [order, setOrder] = useState<ServerOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatVND = (n?: number) =>
    typeof n === "number" ? n.toLocaleString("vi-VN") + " ₫" : "0 đ";

  useEffect(() => {
    if (!code || !phone) return;

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      setOrder(null);

      try {
        const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";
        const res = await fetch(`${API}/api/v1/don-hang/tra-cuu`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            madon: code,
            sodienthoai: phone
          }),
          cache: "no-store"
        });

        const json = await res.json();

        if (res.ok && json.data) {
          setOrder(json.data);
        } else {
          setError(json.message || "Không tìm thấy đơn hàng hoặc thông tin số điện thoại không khớp.");
        }
      } catch (err) {
        console.error(err);
        setError("Lỗi kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [code, phone]);

  if (!code) return null;

  return (
    <div className="mb-20">
      {loading && (
        <div className="p-16 text-center text-gray-500 bg-white border rounded-8">
          Đang tra cứu thông tin...
        </div>
      )}

      {error && (
        <div className="p-16 text-center border bg-warning-50 border-warning-200 rounded-8 text-danger-600 fw-medium">
          <i className="ph-bold ph-warning-circle me-2"></i> {error}
        </div>
      )}

      {order && (
        <div className="col-lg-12">
          <div className="border border-gray-200 p-20 rounded-8">
            {/* Header */}
            <div className="row border-bottom border-gray-200 pb-16 mb-16">
              <div className="col-lg-4 text-sm text-start">
                <span className="fw-semibold text-sm text-gray-600">Mã đơn hàng:</span>{" "}
                <span className="fst-italic fw-semibold">#{order.madon}</span>
              </div>
              <div className="col-lg-4 text-sm text-center">
                <span className="fw-semibold text-sm text-gray-600">Trạng thái:</span>{" "}
                <span className="fst-italic text-warning-600">{order.trangthai}</span>
              </div>
              <div className="col-lg-4 text-sm text-end">
                <span className="fw-semibold text-sm text-gray-600">Ngày đặt:</span>{" "}
                <span className="fst-italic">
                  {order.created_at ? (() => {
                    const date = new Date(order.created_at);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    return `${day}/${month}/${year} - ${hours}:${minutes}`;
                  })() : ""}
                </span>
              </div>
            </div>

            {/* Tiêu đề */}
            <div className="flex-align gap-8 flex-between">
              <span className="text-md text-gray-900 fw-semibold flex-align gap-8 mb-10">
                <i className="ph-bold ph-shopping-cart text-main-600 text-lg"></i> Chi tiết đơn hàng
              </span>
            </div>

            {/* Danh sách sản phẩm */}
            {order.chitietdonhang?.map((item, idx) => {
              const sp = item.bienthe?.sanpham || {};
              const variant = item.bienthe?.loaibienthe?.ten || "";

              // ✅ Xây dựng URL ảnh từ SLUG
              const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";
              const imageUrl = sp.slug
                ? `${API}/assets/client/images/thumbs/${sp.slug}-1.webp`
                : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Crect fill='%23f3f4f6' width='90' height='90'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='12'%3EKhông có ảnh%3C/text%3E%3C/svg%3E";
              // 🔍 DEBUG: Kiểm tra URL ảnh
              console.log('🖼️ slug:', sp.slug);
              console.log('🖼️ imageUrl:', imageUrl);


              return (
                <div key={idx} className="py-6 px-5">
                  <div className="d-flex align-items-center gap-12">
                    <a href="#" className="border border-gray-100 rounded-8 flex-center" style={{ maxWidth: "90px", maxHeight: "90px", width: "100%", height: "100%" }}>
                      <Image
                        src={imageUrl}
                        alt={sp.ten || "Sản phẩm"}
                        width={90}
                        height={90}
                        className="w-100 rounded-8"
                        style={{ objectFit: "contain" }}
                        unoptimized={true}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Crect fill='%23f3f4f6' width='90' height='90'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='12'%3ELỗi ảnh%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </a>
                    <div className="text-start w-100">
                      <h6 className="title text-md fw-semibold mb-0">
                        <a
                          href="#"
                          className="link text-line-2"
                          title={sp.ten || "Sản phẩm"}
                          style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "500px", display: "inline-block" }}
                        >
                          {sp.ten || "Sản phẩm"}
                        </a>
                      </h6>
                      {variant && (
                        <div className="flex-align gap-16 mb-6">
                          <a href="#" className="btn bg-gray-50 text-heading text-xs py-4 px-6 rounded-8 flex-center gap-8 fw-medium">
                            {variant}
                          </a>
                        </div>
                      )}
                      <div className="product-card__price mb-6">
                        <div className="flex-align gap-24">
                          <span className="text-heading text-sm fw-medium">Số lượng: {item.soluong}</span>
                          <span className="text-main-600 text-md fw-semibold">{formatVND(item.dongia)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Footer */}
            <div className="row border-top border-gray-200 pt-16 mt-16">
              <div className="col-lg-4 text-sm text-start">
                <div className="fw-semibold text-sm text-gray-600">
                  <span className="pe-10">Phương thức thanh toán:</span>
                </div>
                <span className="fw-medium text-gray-900 text-sm">
                  {order.trangthaithanhtoan || "Thanh toán khi nhận hàng"}
                </span>
              </div>
              <div className="col-lg-4 text-sm text-center"></div>
              <div className="col-lg-4 text-sm text-end">
                <div className="fw-semibold text-sm text-gray-600">Tổng giá trị đơn hàng:</div>
                <span className="fw-semibold text-main-600 text-lg">
                  {formatVND(order.thanhtien ?? order.tamtinh)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}