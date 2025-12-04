"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import FullHeader from "@/components/FullHeader";
import AccountShell from "@/components/AccountShell";
import { useAuth } from "@/hooks/useAuth";
import { getTrangThaiDonHang, getPhuongThucThanhToan } from "@/utils/chitietdh"; // Helper Việt hóa trạng thái
import Cookies from "js-cookie";

// --- 1. ĐỊNH NGHĨA TYPE CHUẨN (Khớp với API Laravel) ---

type OrderItem = {
  id: number;
  soluong: number;
  dongia: number;
  // Cấu trúc nested từ Laravel
  bienthe?: {
    sanpham?: {
      // id: number;
      ten?: string;
      hinhanh?: string;
      hinhanhsanpham?: { id?: number; hinhanh?: string }[];
    };
    loaibienthe?: { ten?: string };
  };
  name?: string;
  hinhanh?: string;
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
  chitietnguoidung?: {
    hoten?: string;
    sodienthoai?: string;
    email?: string;
    diachi?: string;
  };
};

type DetailedOrder = Order & {
    phuongthuc?: { id?: number; ten?: string; maphuongthuc?: string };
    phivanchuyen?: { id?: number; ten?: string; phi?: number };
    diachigiaohang?: { hoten?: string; sodienthoai?: string; diachi?: string; tinhthanh?: string; trangthai?: string };
    magiamgia?: { magiamgia?: string; giatri?: number; mota?: string };
    tamtinh?: number;
};

type OrderGroup = {
  label: string;
  trangthai: string;
  soluong: number;
  donhang: Order[]; // Mảng đơn hàng nằm trong đây
};

// Type cho Filter
type FilterStatus = "all" | "pending" | "confirmed" | "processing" | "shipping" | "completed" | "cancelled";

// Map mã phương thức thanh toán (maphuongthuc) sang label hiển thị
  const formatPaymentMethod = (ph?: DetailedOrder["phuongthuc"]) => {
    const code = ph?.maphuongthuc ?? "";
    if (code === "cod") return "Thanh toán khi nhận hàng (COD)";
    if (code === "dbt") return "Chuyển khoản ngân hàng (tự động)";
    if (code === "cp") return "Thanh toán trực tiếp (thủ công)";
    return ph?.ten ?? getPhuongThucThanhToan(ph?.id ?? undefined) ?? "-";
  };

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
  const API = process.env.NEXT_PUBLIC_SERVER_API || "http://148.230.100.215";
  
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<DetailedOrder | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const displayStatusLabel = (status?: string) => {
  const s = (status || "").toString().toLowerCase();
  if (s.includes("đã giao") || s.includes("đã giao hàng") || s.includes("delivered")) return "Đã giao";
  const label = getTrangThaiDonHang(status);
  if (label && label !== "Chưa rõ") return label;
  return status || "Chưa rõ";
};

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
          const groups = (json.data || []) as OrderGroup[];
          // Làm phẳng: Lấy tất cả đơn hàng từ tất cả các nhóm
          const allOrders: Order[] = groups.flatMap(group => group.donhang || []);

          // Sắp xếp theo ID giảm dần (mới nhất lên đầu)
          const sortedList = allOrders.sort((a, b) => b.id - a.id);
          
          setOrders(sortedList);
          // Xử lý response: { data: [...] } hoặc [...]
          // const list = Array.isArray(json) ? json : (json.data || []);
          
          // // Sắp xếp mới nhất lên đầu
          // const sortedList = list.sort((a: Order, b: Order) => b.id - a.id);
          setOrders(sortedList);
        } else {
           console.error("Lỗi API:", res.status);
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
        setLoading(false);
    }
  }, [isLoggedIn]);

  const openDetail = async (id: number) => {
    setDetailOpen(true);
    setLoadingDetail(true);
    try {
      const token = Cookies.get("access_token");
      const res = await fetch(`${API}/api/toi/donhangs/${id}`, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
          "Accept": "application/json",
        },
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        // API returns { data: { ... } }
        setDetailOrder((json && (json.data || json)) as DetailedOrder);
      } else {
        console.error("Lỗi tải chi tiết đơn:", res.status);
        setDetailOrder(null);
      }
    } catch (e) {
      console.error(e);
      setDetailOrder(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailOrder(null);
  };

  // --- HỦY ĐƠN: gọi API + optimistic update ---
  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    try {
      const token = Cookies.get("access_token");
      const res = await fetch(`${API}/api/toi/donhangs/${orderId}/huy`, {
        method: "PATCH",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        // optimistic UI update: mark order as cancelled
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, trangthai: "Đã hủy" } : o));
        alert("Đã hủy đơn hàng thành công!");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Không thể hủy đơn. Vui lòng thử lại.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối đến hệ thống.");
    }
  };
  // Cho phép hủy khi trạng thái còn 'chờ' (cập nhật theo rule dự án)
  const isCancellable = (status: string) => {
    const s = status?.toLowerCase() ?? "";
    return s.includes("chờ") || s.includes("pending");
  };

  // Kiểm tra trạng thái thanh toán chưa thành công / chưa thanh toán
const isPaymentPending = (order?: DetailedOrder) => {
  if (!order) return false;
  const pay = (order.trangthaithanhtoan || "").toString().toLowerCase();
  const state = (order.trangthai || "").toString().toLowerCase();
  if (pay.includes("chưa") || pay.includes("pending") || pay.includes("unpaid")) return true;
  // fallback: nếu trạng thái chung chỉ ra chưa giao / chưa hoàn tất thanh toán
  if (state.includes("chờ") || state.includes("pending")) return true;
  return false;
};

// Kiểm tra trạng thái có thể đánh giá
const isReviewableStatus = (status?: string) => {
  const s = (status || "").toString().toLowerCase();
  // Chỉ khi trạng thái rõ ràng là 'thành công' hoặc 'delivered' được coi là reviewable
  return s.includes("thành công") || s.includes("delivered") || s.includes("hoàn tất") || s.includes("completed");
};

// Gọi API để lấy payment_url rồi chuyển hướng
const retryPayment = async (orderId: number, provider?: string) => {
  try {
    const token = Cookies.get("access_token");
    const url = `${API}/api/toi/donhangs/${orderId}/payment-url`;
    const body = provider ? JSON.stringify({ provider }) : undefined;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": body ? "application/json" : "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
      },
      body,
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.payment_url) {
      // Option A: điều hướng ngay lập tức
      window.location.href = json.payment_url;
      return;
    }
    alert(json.message || "Không tạo được liên kết thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.");
  } catch (e) {
    console.error("retryPayment error", e);
    alert("Lỗi kết nối. Vui lòng thử lại.");
  }
};

  // --- LOGIC FILTER ---
  // Helper map trạng thái từ API sang key filter
  const getFilterKey = (status: string): FilterStatus => {
    const s = (status || "").toLowerCase();
    if (s.includes("chờ xử lý") || s.includes("chờ thanh toán") || s.includes("pending")) return "pending";
    if (s.includes("đã xác nhận") || s.includes("chờ xác nhận") || s.includes("xác nhận")) return "confirmed";
    if (s.includes("đang chuẩn bị") || s.includes("đang đóng gói") || s.includes("đóng gói") || s.includes("preparing")) return "processing";
    if (s.includes("đang giao") || s.includes("shipping")) return "shipping";
    if (s.includes("đã giao") || s.includes("đã giao hàng") || s.includes("delivered") || s.includes("thành công")) return "completed";
    if (s.includes("đã hủy") || s.includes("hủy") || s.includes("cancel")) return "cancelled";
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
  // if (orders.length > 0 && orders[0].chitietdonhang && orders[0].chitietdonhang.length > 0) {
  //   const fmtMoney = (val: number) => val.toLocaleString("vi-VN") + " ₫";
  // }
  const fmtMoney = (val?: number | string | null) => {
    const n = Number(val ?? 0);
    if (!Number.isFinite(n) || n === 0) return "0 ₫";
    return n.toLocaleString("vi-VN") + " ₫";
  };
  const formatOrderDate = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  };

  

  const toggleExpand = (id: number) => {
      setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  // --- RENDER UI ---
  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      <AccountShell title="Đơn hàng của tôi" current="orders">
        {/* Order Detail Modal / Drawer */}
        {detailOpen && (
          <div className="top-0 position-fixed start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, background: "rgba(0,0,0,0.5)" }}>
            <div className="p-20 bg-white rounded-12" style={{ maxWidth: 1100, width: "95%", maxHeight: "90%", overflowY: "auto" }}>
              <div className="mb-12 d-flex flex-between">
                <h5 className="mb-0">Chi tiết đơn hàng {detailOrder ? `#${detailOrder.madon}` : ""}</h5>
                <button type="button" className="btn btn-black" onClick={closeDetail}>Đóng</button>
              </div>
              {loadingDetail ? (
                <div className="py-20 text-center">Đang tải chi tiết...</div>
              ) : detailOrder ? (
                <>
                  <div className="flex-wrap mb-16 d-flex flex-between">
                    {/* Recipient: ưu tiên diachigiaohang, fallback chitietnguoidung */}
                    <div style={{ width: "32%" }}>
                      <h6 className="text-sm fw-semibold">Người nhận</h6>
                      <div className="p-10 border rounded-4">
                        <div className="fw-medium">
                          {detailOrder.diachigiaohang?.hoten ?? detailOrder.chitietnguoidung?.hoten ?? "-"}
                        </div>
                        <div className="mt-5 text-sm">
                          <span className="fw-medium">Địa chỉ:</span>{" "}
                          {detailOrder.diachigiaohang?.diachi ?? detailOrder.chitietnguoidung?.diachi ?? "-"}
                        </div>
                        <div className="mt-5 text-sm">
                          <span className="fw-medium">SĐT:</span>{" "}
                          {detailOrder.diachigiaohang?.sodienthoai ?? detailOrder.chitietnguoidung?.sodienthoai ?? "-"}
                        </div>
                        {detailOrder.diachigiaohang?.tinhthanh && (
                          <div className="mt-5 text-sm">
                            <span className="fw-medium">Khu vực:</span> {detailOrder.diachigiaohang.tinhthanh}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shipping */}
                    <div style={{ width: "32%" }}>
                      <h6 className="text-sm fw-semibold">Hình thức vận chuyển</h6>
                      <div className="p-10 border rounded-4">
                        <div className="fw-medium">{detailOrder.phivanchuyen?.ten ?? "-"}</div>
                        <div className="mt-5 text-sm"><span className="fw-medium">Phí:</span> {fmtMoney(detailOrder.phivanchuyen?.phi ?? 0)}</div>
                        {/* Khu vực giao: fallback từ địa chỉ nhận */}
                        <div className="mt-5 text-sm"><span className="fw-medium">Khu vực giao:</span> {detailOrder.phivanchuyen?.ten ?? detailOrder.diachigiaohang?.tinhthanh ?? "-"}</div>
                      </div>
                    </div>

                    {/* Payment method */}
                    <div style={{ width: "32%" }}>
                      <h6 className="text-sm fw-semibold">Thanh toán</h6>
                      <div className="p-10 border rounded-4">
                        <div className="fw-medium">
                          {formatPaymentMethod(detailOrder.phuongthuc)}
                        </div>
                        <div className="mt-5 text-sm"><span className="fw-medium">Trạng thái:</span> {detailOrder.trangthaithanhtoan ?? detailOrder.trangthai ?? "-"}</div>
                        {/* {detailOrder.phuongthuc?.maphuongthuc && (
                          <div className="mt-5 text-sm"><span className="fw-medium">Mã PT:</span> {detailOrder.phuongthuc.maphuongthuc}</div>
                        )} */}

                        {/*  Thêm nút thanh toán lại nếu cần */}
                        {/* Thanh toán lại VNPay nếu phương thức là dbt (VNPay) và trạng thái thanh toán còn pending */}
                        {detailOrder.phuongthuc?.maphuongthuc === "dbt" && isPaymentPending(detailOrder) && (
                          <button
                            type="button"
                            onClick={() => retryPayment(detailOrder.id, "dbt")}
                            className="gap-8 px-8 py-4 text-sm border fw-medium text-main-600 border-main-600 hover-bg-main-600 hover-text-white rounded-4 transition-1 flex-align"
                          >
                            <i className="ph-bold ph-credit-card" /> Thanh toán lại (VNPay)
                          </button>
                        )}

                        {/* Tùy chọn VietQR nếu provider 'cp' */}
                        {detailOrder.phuongthuc?.maphuongthuc === "cp" && isPaymentPending(detailOrder) && (
                          <button
                            type="button"
                            onClick={() => retryPayment(detailOrder.id, "cp")}
                            className="gap-8 px-8 py-4 text-sm border fw-medium text-main-600 border-main-600 hover-bg-main-600 hover-text-white rounded-4 transition-1 flex-align"
                          >
                            <i className="ph-bold ph-qrcode" /> Thanh toán lại (VietQR)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-16 border rounded-4">
                    <h6 className="mb-8 text-md fw-semibold"><i className="ph-bold ph-shopping-cart text-main-600" /> Chi tiết mua hàng</h6>
                    {(detailOrder.chitietdonhang ?? []).map((it) => {
                      const sp = it.bienthe?.sanpham || {};
                      return (
                        <div key={it.id} className="gap-12 py-6 d-flex align-items-center">
                          <div style={{ width: 90, height: 90 }} className="overflow-hidden border rounded-8 flex-center">
                            <img
                              src={sp.hinhanhsanpham?.[0]?.hinhanh ?? sp.hinhanh ?? "/assets/images/thumbs/placeholder.png"}
                              alt={sp.ten ?? ""}
                              className="w-100 rounded-8"
                            />
                          </div>
                          <div className="text-start w-100">
                            <div className="fw-semibold">{sp.ten ?? it.name ?? "Sản phẩm"}</div>
                            <div className="text-sm text-gray-600">Số lượng: {it.soluong}</div>
                          </div>
                          <div className="text-end">
                            <div className="text-sm text-gray-600">Đơn giá</div>
                            <div className="fw-semibold">{fmtMoney(it.dongia)}</div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-16 mt-16 border-top">
                      <div className="mb-8 d-flex flex-between">
                        <div>Tạm tính:</div>
                        <div className="fw-semibold">{fmtMoney(detailOrder.tamtinh)}</div>
                      </div>
                      <div className="mb-8 d-flex flex-between">
                        <div>Phí giao hàng:</div>
                        <div className="fw-semibold">{fmtMoney(detailOrder.phivanchuyen?.phi ?? 0)}</div>
                      </div>
                      <div className="d-flex flex-between">
                        <div className="text-xl fw-bold">Tổng tiền:</div>
                        <div className="text-xl text-main-600 fw-bold">{fmtMoney(detailOrder.thanhtien)}</div>
                      </div>
                    </div>
                  </div>
                    <div className="gap-12 mt-10 flex-align flex-between" style={{ width: "100%" }}>
                      <Link href="/don-hang" className="gap-8 mt-10 text-main-600 text-md fw-medium flex-align" onClick={closeDetail}>
                        <i className="ph-bold ph-arrow-fat-lines-left text-main-600 text-md" /> Quay lại đơn hàng của tôi
                      </Link>
                      <div className="gap-12 flex-align">
                        {/* Nếu đơn ở trạng thái reviewable (thành công) hiển thị nút Đánh giá thay vì Hủy */}
                        {detailOrder && isReviewableStatus(detailOrder.trangthai) ? (
                          <Link href={`/danh-gia?order_id=${detailOrder.id}`} className="gap-8 px-8 py-4 text-sm border fw-medium text-main-600 border-main-600 hover-bg-main-600 hover-text-white rounded-4 transition-1 flex-align">
                            <i className="ph ph-star" /> Đánh giá
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => detailOrder && handleCancelOrder(detailOrder.id)}
                            disabled={!isCancellable(detailOrder.trangthai)}
                            className={`fw-medium text-main-600 text-md border border-main-600 hover-bg-main-600 hover-text-white px-8 py-4 rounded-4 transition-1 flex-align gap-8 ${(!detailOrder || !isCancellable(detailOrder.trangthai)) ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <i className="ph-bold ph-trash" /> Hủy đơn
                          </button>
                        )}
                      </div>
                    </div>
                </>
              ) : (
                <div className="py-10 text-center">Không có dữ liệu chi tiết.</div>
              )}
            </div>
          </div>
        )}
        {/* End modal */}
        
        
        <section className="mt-10 overflow-hidden trending-productss fix-scale-80">
          <div style={{ paddingBottom: 120 }}>
          {/* <div className="p-24 border border-gray-100 rounded-8"> */}
            <div className="mb-20 section-heading">
              <div className="flex-wrap gap-8 flex-between flex-align">
                <ul className="pb-2 m-0 mb-3 overflow-auto nav common-tab style-two nav-pills flex-nowrap">
                  {STATUS_OPTIONS.map((opt, idx) => (
                    <li key={idx + "-" + opt.key + "-" + opt.label} className="nav-item">
                      <button
                        type="button"
                        onClick={() => { setFilterStatus(opt.key); setPage(1); }}
                        className={`px-10 py-8 rounded-10 flex-align gap-8 fw-medium text-xs transition-1 me-2 mb-2 ${filterStatus === opt.key ? "bg-main-600 text-white" : "border border-gray-600 text-gray-900 hover-border-main-600 hover-text-main-600"}`}
                      >
                        {opt.icon && <i className={`ph-bold ${opt.icon}`} />}
                        {opt.label} ({orders.filter(o => getFilterKey(o.trangthai) === opt.key).length})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Orders list cards */}
            <div className="mt-4">
              {loading ? (
                <div className="py-5 text-center">Đang tải dữ liệu...</div>
              ) : currentOrders.length === 0 ? (
                <div className="py-5 text-center border rounded-8">
                  <p className="mb-3 text-gray-500">Không tìm thấy đơn hàng nào.</p>
                  <Link href="/" className="px-4 btn btn-main rounded-pill">Mua sắm ngay</Link>
                </div>
              ) : (
                currentOrders.map(order => {
                  const firstItem = order.chitietdonhang?.[0];
                  const spDau = firstItem?.bienthe?.sanpham || {};
                  const tenSpDau = spDau.ten || firstItem?.name || "Sản phẩm";
                  const anhSpDau = spDau.hinhanh || firstItem?.hinhanh || "/assets/images/thumbs/placeholder.png";
                  const soLuongSp = order.chitietdonhang?.length || 0;
                  const loaiBienTheDau = firstItem?.bienthe?.loaibienthe || {};
                  const tenLoaiBienTheDau = loaiBienTheDau.ten || "Loại Biến Thể";
                  return (
                    <div key={order.id} className="my-10 border border-gray-200 p-14 rounded-4">
                      <div className="d-flex flex-align flex-between">
                        <div className="gap-12 flex-align">
                          <span className="text-gray-900 fw-semibold text-md">Đơn hàng #{order.madon}</span>
                        </div>
                        <div className="gap-12 flex-align">
                          <span className={`fw-medium text-xs ${order.trangthai.includes("Hoàn") ? "text-success-700 bg-success-100 px-6 py-4 rounded-4" : order.trangthai.includes("Hủy") ? "text-danger-700 bg-danger-100 px-6 py-4 rounded-4" : "text-warning-700 bg-warning-100 px-6 py-4 rounded-4"}`}>
                            {/* <i className="ph-bold ph-clock-countdown" /> {getTrangThaiDonHang(order.trangthai)} */}
                            {/* displayStatusLabel là helper dùng để lọc và hiển thị thành công thay vì đã giao, xét đánh giá */}
                            <i className="ph-bold ph-clock-countdown" /> {displayStatusLabel(order.trangthai)}
                          </span>
                        </div>
                      </div>

                      <div className="mb-10 d-flex flex-align flex-between">
                        <div className="gap-8 flex-align">
                          <span className="text-sm text-gray-600 fw-medium">Đặt ngày {formatOrderDate(order.created_at)}</span>
                        </div>
                      </div>

                      <div className="px-5 py-6">
                        <div className="gap-12 d-flex align-items-center">
                          <a href="#" className="border border-gray-100 rounded-8 flex-center" style={{ maxWidth: 80, maxHeight: 80 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={anhSpDau} alt={tenSpDau} className="w-100 rounded-8" />
                          </a>
                          <div className="table-product__content text-start">
                            <h6 className="mb-0 text-sm title fw-semibold">
                              <a href="#" className="link text-line-2" title={tenSpDau} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: 350, display: "inline-block" }}>{tenSpDau}</a>
                            </h6>
                            <div className="gap-16 mb-6 flex-align">
                              <a href="#" className="gap-8 px-6 py-4 text-xs btn bg-gray-50 text-heading rounded-8 flex-center fw-medium">{tenLoaiBienTheDau}</a>
                            </div>
                            <div className="mb-6 product-card__price">
                              <div className="gap-24 flex-align">
                                <span className="text-sm text-heading fw-medium">Số lượng: {firstItem?.soluong ?? 1}</span>
                                <span className="text-main-600 text-md fw-bold">{fmtMoney(firstItem?.dongia)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <input type="hidden" className="item-id" value={firstItem?.id ?? 0} />
                      </div>
                      <div className="d-flex flex-align flex-between">
                        <div className="gap-12 flex-align">
                          <span className="text-sm text-gray-600 fw-semibold"></span>
                        </div>
                        <div className="gap-12 flex-align">
                          <span className="text-sm fw-medium">Tổng thanh toán</span>
                        </div>
                      </div>

                      <div className="d-flex flex-align flex-between">
                        <div className="gap-12 flex-align">
                          <div className="gap-12 flex-align">
                            { isReviewableStatus(order.trangthai) ? (
                              <Link href={`/danh-gia?order_id=${order.id}`} className="gap-8 px-8 py-4 text-sm border fw-medium text-main-600 border-main-600 hover-bg-main-600 hover-text-white rounded-4 transition-1 flex-align">
                                <i className="ph ph-star" /> Đánh giá
                              </Link>
                            ) : (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={!isCancellable(order.trangthai)}
                              className={`gap-8 px-8 py-4 text-sm border fw-medium rounded-4 transition-1 flex-align ${
                                isCancellable(order.trangthai)
                                  ? "text-danger-600 border-danger-600 hover-bg-danger-600 hover-text-white cursor-pointer"
                                  : "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                              }`}
                            >
                              <i className="ph-bold ph-trash" /> Hủy đơn
                            </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openDetail(order.id)}
                              className="gap-8 px-8 py-4 text-sm border fw-medium text-main-600 border-main-600 hover-bg-main-600 hover-text-white rounded-4 transition-1 flex-align"
                            >
                              <i className="ph-bold ph-eye" /> Xem chi tiết
                            </button>
                          </div>
                        </div>
                        <div className="gap-12 flex-align">
                          <span className="text-lg fw-bold text-main-600">{fmtMoney(order.thanhtien)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
        {totalPages > 1 && (
          <div className="gap-8 mt-24 d-flex justify-content-center">
            <button className="btn btn-sm btn-black" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</button>
            <span className="px-3 py-1 fw-bold flex-align">{page} / {totalPages}</span>
            <button className="btn btn-sm btn-black" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau</button>
          </div>
        )}
      </AccountShell>
    </>
  );
}

const STATUS_OPTIONS: { key: FilterStatus; label: string; icon?: string }[] = [
  { key: "pending", label: "Chờ xử lý", icon: "ph-wallet" },
  { key: "confirmed", label: "Đã xác nhận", icon: "ph-clock-countdown" },
  { key: "processing", label: "Đang chuẩn bị hàng", icon: "ph-package" },
  { key: "shipping", label: "Đang giao hàng", icon: "ph-truck" },
  { key: "completed", label: "Đã giao hàng", icon: "ph-check-fat" },
  { key: "cancelled", label: "Đã hủy", icon: "ph-prohibit" },
];