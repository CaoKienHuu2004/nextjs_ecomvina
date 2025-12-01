"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import FullHeader from "@/components/FullHeader";
import AccountShell from "@/components/AccountShell";
import { useAuth } from "@/hooks/useAuth";
import { getTrangThaiDonHang } from "@/utils/chitietdh"; // Helper Việt hóa trạng thái
import Cookies from "js-cookie";

// --- 1. ĐỊNH NGHĨA TYPE CHUẨN (Khớp với API Laravel) ---

type OrderItem = {
  id: number;
  soluong: number;
  dongia: number;
  // Cấu trúc nested từ Laravel
  bienthe?: {
    sanpham?: {
      ten?: string;
      hinhanh?: string;
    };
    loaibienthe?: { ten?: string };
  };
  // Fallback nếu API trả phẳng
  name?: string;
  image?: string;
  price?: number;
  quantity?: number;
};

type Order = {
  id: number;
  madon: string;
  created_at: string;
  trangthai: string; 
  thanhtien: number;
  trangthaithanhtoan?: string;
  chitietdonhang: OrderItem[];
};

// Type cho Filter
type FilterStatus = "all" | "pending" | "processing" | "shipping" | "completed" | "cancelled";

// --- 2. COMPONENT CHÍNH ---

export default function OrdersPage() {
  const { user, isLoggedIn } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Filter & Pagination
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const API = process.env.NEXT_PUBLIC_SERVER_API || "http://148.230.100.215";
        const token = Cookies.get("access_token");

        const res = await fetch(`${API}/api/toi/donhangs`, {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
            "Accept": "application/json",
          },
          cache: "no-store"
        });

        if (res.ok) {
          const json = await res.json();
          // Xử lý response: { data: [...] } hoặc [...]
          const list = Array.isArray(json) ? json : (json.data || []);
          
          // Sắp xếp mới nhất lên đầu
          const sortedList = list.sort((a: Order, b: Order) => b.id - a.id);
          setOrders(sortedList);
        } else {
           console.error("Lỗi API:", res.status);
           // Nếu API lỗi 401 (Unauthorized), có thể redirect login
        }
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
        fetchOrders();
    } else {
        setLoading(false); // Chưa login thì ko load
    }
  }, [isLoggedIn]);

  // --- LOGIC FILTER ---
  // Helper map trạng thái từ API sang key filter
  const getFilterKey = (status: string): FilterStatus => {
      const s = status.toLowerCase();
      if (s.includes("chờ") || s.includes("pending")) return "pending";
      if (s.includes("xử lý") || s.includes("processing")) return "processing";
      if (s.includes("giao") || s.includes("shipping")) return "shipping";
      if (s.includes("hoàn tất") || s.includes("thành công") || s.includes("completed")) return "completed";
      if (s.includes("hủy") || s.includes("cancelled")) return "cancelled";
      return "all";
  };

  const filteredOrders = useMemo(() => {
    if (filterStatus === "all") return orders;
    return orders.filter(o => getFilterKey(o.trangthai) === filterStatus);
  }, [orders, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const currentOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  // --- HELPER RENDER ---
  const fmtMoney = (val: number) => val.toLocaleString("vi-VN") + " ₫";

  const toggleExpand = (id: number) => {
      setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  // --- RENDER UI ---
  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      <AccountShell title="Đơn hàng của tôi" current="orders">
        
        {/* 1. BỘ LỌC TRẠNG THÁI */}
        <div className="p-12 mb-16 overflow-x-auto bg-white border rounded-8">
          <div className="flex-wrap gap-8 d-flex">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => { setFilterStatus(opt.key); setPage(1); }}
                className={`btn btn-sm text-nowrap ${filterStatus === opt.key ? "btn-main-two" : "btn-outline-main-two"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. DANH SÁCH ĐƠN HÀNG */}
        <div className="gap-16 d-flex flex-column">
            {loading ? (
                <div className="py-5 text-center">Đang tải dữ liệu...</div>
            ) : currentOrders.length === 0 ? (
                <div className="py-5 text-center border rounded-8">
                    <p className="mb-3 text-gray-500">Không tìm thấy đơn hàng nào.</p>
                    <Link href="/" className="px-4 btn btn-main rounded-pill">Mua sắm ngay</Link>
                </div>
            ) : (
                currentOrders.map((order) => {
                    // Lấy sản phẩm đầu tiên làm đại diện
                    const firstItem = order.chitietdonhang?.[0];
                    const spDau = firstItem?.bienthe?.sanpham || {};
                    const tenSpDau = spDau.ten || firstItem?.name || "Sản phẩm";
                    const anhSpDau = spDau.hinhanh || firstItem?.image || "/assets/images/thumbs/placeholder.png";
                    const soLuongSp = order.chitietdonhang?.length || 0;

                    return (
                        <div key={order.id} className="p-16 bg-white border border-gray-200 shadow-sm rounded-12">
                            {/* Header Đơn hàng */}
                            <div className="pb-12 mb-12 d-flex justify-content-between align-items-center border-bottom">
                                <div>
                                    <span className="fw-bold text-heading me-2">#{order.madon}</span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(order.created_at).toLocaleDateString("vi-VN")}
                                    </span>
                                </div>
                                <div className="gap-2 d-flex align-items-center">
                                    <span className={`badge rounded-pill px-3 py-1 ${
                                        order.trangthai.includes("Hoàn tất") ? "bg-success-100 text-success-700" : 
                                        order.trangthai.includes("Hủy") ? "bg-danger-100 text-danger-700" : 
                                        "bg-warning-100 text-warning-700"
                                    }`}>
                                        {/* Dùng hàm helper để hiển thị tiếng Việt chuẩn */}
                                        {getTrangThaiDonHang(order.trangthai)}
                                    </span>
                                </div>
                            </div>

                            {/* Body Đơn hàng (Sản phẩm đại diện) */}
                            <div className="gap-16 d-flex align-items-center">
                                <div className="flex-shrink-0 overflow-hidden border rounded-8" style={{width: 80, height: 80}}>
                                    <Image src={anhSpDau} alt={tenSpDau} width={80} height={80} className="w-100 h-100 object-fit-contain" />
                                </div>
                                <div className="flex-grow-1">
                                    <h6 className="mb-1 text-md fw-semibold line-clamp-2">{tenSpDau}</h6>
                                    <p className="mb-0 text-sm text-gray-500">
                                        {soLuongSp > 1 ? `và ${soLuongSp - 1} sản phẩm khác` : `Số lượng: ${firstItem?.soluong || 1}`}
                                    </p>
                                </div>
                                <div className="text-end">
                                    <div className="text-sm text-gray-500">Tổng tiền</div>
                                    <div className="text-lg fw-bold text-main-600">{fmtMoney(order.thanhtien)}</div>
                                </div>
                            </div>

                            {/* Footer Đơn hàng (Actions) */}
                            <div className="gap-12 pt-12 mt-16 d-flex justify-content-end border-top">
                                <button 
                                    className="btn btn-sm btn-outline-gray rounded-pill"
                                    onClick={() => toggleExpand(order.id)}
                                >
                                    {expandedOrderId === order.id ? "Thu gọn" : "Xem chi tiết"}
                                </button>
                                <Link 
                                    href={`/don-hang/${order.id}`} 
                                    className="btn btn-sm btn-main-two rounded-pill"
                                >
                                    Theo dõi đơn
                                </Link>
                            </div>

                            {/* Expand View (Chi tiết mở rộng) */}
                            {expandedOrderId === order.id && (
                                <div className="p-12 pt-16 mt-16 border-top bg-gray-50 rounded-8">
                                    <h6 className="mb-12 text-sm fw-bold">Chi tiết sản phẩm:</h6>
                                    <div className="gap-12 d-flex flex-column">
                                        {order.chitietdonhang.map((item) => {
                                            const sp = item.bienthe?.sanpham || {};
                                            return (
                                                <div key={item.id} className="d-flex justify-content-between align-items-center">
                                                    <div className="gap-8 d-flex align-items-center">
                                                        <span className="text-sm text-gray-400">x{item.soluong}</span>
                                                        <span className="text-sm fw-medium">{sp.ten || "Sản phẩm"}</span>
                                                    </div>
                                                    <span className="text-sm fw-semibold">{fmtMoney(item.dongia)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>

        {/* 3. PHÂN TRANG */}
        {totalPages > 1 && (
            <div className="gap-8 mt-24 d-flex justify-content-center">
                <button 
                    className="btn btn-sm btn-outline-gray" 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                >Trước</button>
                <span className="px-3 py-1 fw-bold flex-align">{page} / {totalPages}</span>
                <button 
                    className="btn btn-sm btn-outline-gray" 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                >Sau</button>
            </div>
        )}

      </AccountShell>
    </>
  );
}

const STATUS_OPTIONS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xác nhận" },
  { key: "processing", label: "Đang xử lý" },
  { key: "shipping", label: "Đang giao" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
];