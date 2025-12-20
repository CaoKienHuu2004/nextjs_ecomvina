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
    sanpham?: { ten?: string; hinhanh?: string };
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

type ServerGroup = {
  label: string;
  donhang: ServerOrder[];
};

export default function OrderLookupResult() {
  const search = useSearchParams();
  const code = search?.get("madon")?.trim() ?? "";

  const [order, setOrder] = useState<ServerOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const formatVND = (n?: number) =>
    typeof n === "number" ? n.toLocaleString("vi-VN") + " ₫" : "0 đ";

  useEffect(() => {
    if (!code) return;

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      setOrder(null);

      try {
        const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";
        const token = Cookies.get("access_token");

        // Gọi API Public
        // const res = await fetch(`${API}/api/web/tracuu-donhang?madon=${encodeURIComponent(code)}`, {
        // comment token bearer va mo headers: { "Accept": "application/json" }, neu khong dung auth
        const res = await fetch(`${API}/web/tracuu-donhang?madon=${encodeURIComponent(code)}`, {
          headers: { "Accept": "application/json" },
          // headers: {
          //     "Authorization": `Bearer ${token}`,
          // },
          cache: "no-store"
        });

        if (res.ok) {
          const json = await res.json();
          // API trả về danh sách nhóm (ApiGroup[]), ta cần tìm đơn hàng trong đó
          const groups = (Array.isArray(json) ? json : json.data || []) as ServerGroup[];

          let found: ServerOrder | null = null;

          // Duyệt qua các nhóm để tìm mã đơn khớp
          for (const group of groups) {
            if (group.donhang) {
              const match = group.donhang.find(o =>
                o.madon?.toLowerCase() === code.toLowerCase() ||
                String(o.id) === code
              );
              if (match) {
                found = match;
                break;
              }
            }
          }

          if (found) {
            setOrder(found);
          } else {
            setError("Không tìm thấy đơn hàng với mã này.");
          }
        } else {
          setError("Không tìm thấy đơn hàng hoặc lỗi hệ thống.");
        }
      } catch (err) {
        console.error(err);
        setError("Lỗi kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [code]);

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
        <div className="p-16 bg-white border border-gray-100 shadow-sm rounded-12">
          {/* Header đơn hàng */}
          <div className="flex-wrap gap-12 d-flex justify-content-between align-items-start">
            <div className="gap-12 d-flex flex-grow-1">
              {/* Ảnh đại diện (Sản phẩm đầu tiên) */}
              <div className="flex-shrink-0 overflow-hidden border rounded-8" style={{ width: 72, height: 72 }}>
                <Image
                  src={order.chitietdonhang?.[0]?.bienthe?.sanpham?.hinhanh || "/assets/images/thumbs/default.png"}
                  alt="Product"
                  width={72}
                  height={72}
                  className="w-100 h-100 object-fit-cover"
                />
              </div>

              {/* Thông tin chính */}
              <div>
                <div className="gap-8 mb-1 d-flex align-items-center">
                  <span className="fw-bold text-heading">#{order.madon}</span>
                  <span className="px-8 py-2 text-xs badge bg-info-50 text-info-600 rounded-pill">
                    {order.trangthai}
                  </span>
                </div>
                <div className="mb-2 text-sm text-gray-500">
                  {order.created_at ? new Date(order.created_at).toLocaleDateString("vi-VN") : ""}
                </div>

                {/* Tên sản phẩm đầu tiên */}
                {order.chitietdonhang?.[0] && (
                  <div className="text-sm text-gray-900 fw-medium line-clamp-1">
                    {order.chitietdonhang[0].bienthe?.sanpham?.ten || "Sản phẩm"}
                  </div>
                )}
              </div>
            </div>

            {/* Tổng tiền & Actions */}
            <div className="text-end">
              <div className="text-sm text-gray-500">Tổng cộng</div>
              <div className="mb-12 text-lg fw-bold text-main-600">
                {formatVND(order.thanhtien ?? order.tamtinh)}
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-main-two rounded-pill"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Thu gọn" : "Xem chi tiết"}
              </button>
            </div>
          </div>

          {/* Chi tiết mở rộng */}
          {expanded && (
            <div className="pt-16 mt-16 border-gray-100 border-top">
              <h6 className="mb-12 text-sm fw-bold">Danh sách sản phẩm</h6>
              <div className="gap-12 d-flex flex-column">
                {order.chitietdonhang?.map((item, idx) => {
                  const sp = item.bienthe?.sanpham || {};
                  return (
                    <div key={idx} className="p-8 d-flex justify-content-between align-items-center bg-gray-50 rounded-8">
                      <div className="gap-12 d-flex align-items-center">
                        <span className="text-sm text-gray-500 fw-medium">x{item.soluong}</span>
                        <span className="text-sm text-gray-900 line-clamp-1" style={{ maxWidth: 200 }}>
                          {sp.ten || "Sản phẩm"}
                        </span>
                      </div>
                      <span className="text-sm text-gray-900 fw-bold">
                        {formatVND(item.dongia)}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-12 text-sm text-end">
                <span className="text-gray-500 me-2">Thanh toán:</span>
                <span className={`fw-bold ${order.trangthaithanhtoan?.includes("Đã") ? "text-success-600" : "text-warning-600"}`}>
                  {order.trangthaithanhtoan || "Chưa thanh toán"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}