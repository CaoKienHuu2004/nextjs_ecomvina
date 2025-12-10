"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import FullHeader from "@/components/FullHeader";
import AccountShell from "@/components/AccountShell";
import { useAuth } from "@/hooks/useAuth";
import { getTrangThaiDonHang, getPhuongThucThanhToan, getStatusBadgeProps, statusIcon, statusBadgeClass } from "@/utils/chitietdh";
import Cookies from "js-cookie";

// --- 1. ĐỊNH NGHĨA TYPE CHUẨN (Khớp với API Laravel) ---

type OrderItem = {
  id: number;
  soluong: number;
  dongia: number;
  tong_tien?: number;
  // Thêm vài trường fallback vì backend có thể trả tên/ảnh ở các key khác
  tensanpham?: string;
  name?: string;
  hinhanh?: string;
  tenloaibienthe?: string;
  quantity?: number;
  price?: number; 
  bienthe?: {
    id?: number;
    giagoc?: number;
    soluong_kho?: number;
    loaibienthe?: { id?: number; ten?: string };
    tenloaibienthe?: string;
    sanpham?: {
      id?: number;
      ten?: string;
      // backend trả đôi khi 'hinhanh' (string) hoặc 'hinhanhsanpham' (array)
      hinhanh?: string;
      hinhanhsanpham?: { hinhanh?: string }[];
    };
  };
};

type Order = {
  id: number;
  madon: string;
  tongsoluong?: number;
  tamtinh?: number;
  thanhtien?: number;
  trangthaithanhtoan?: string;
  trangthai?: string;
  created_at?: string;
  chitietdonhang: OrderItem[];
  nguoinhan?: string;
  diachinhan?: string;
  sodienthoai?: string;
  khuvucgiao?: string;
  hinhthucvanchuyen?: string;
  phigiaohang?: number;
  mavoucher?: string;
  giagiam?: number;
};

type OrderGroup = { label?: string; trangthai?: string; soluong?: number; donhang: Order[] };

type DetailedOrder = Order & {
  phuongthuc?: { id?: number; ten?: string; maphuongthuc?: string };
  phivanchuyen?: { id?: number; ten?: string; phi?: number };
  diachigiaohang?: { hoten?: string; sodienthoai?: string; diachi?: string; tinhthanh?: string; trangthai?: string };
  magiamgia?: { magiamgia?: string; giatri?: number; mota?: string };
  chitietnguoidung?: { hoten?: string; diachi?: string; sodienthoai?: string };
  hinhthucthanhtoan?: string;
  phuongthucvanchuyen?: string;
  tamtinh?: number;
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
  const [groups, setGroups] = useState<OrderGroup[]>([]);

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

        const res = await fetch(`${API}/api/tai-khoan/donhangs`, {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
            "Accept": "application/json",
          },
          cache: "no-store"
        });

        if (res.ok) {
        const json = await res.json().catch(() => ({}));
        // Normalize payload: accept either array-of-groups (server sample) or an array-of-orders
        const payload = Array.isArray(json) ? json : (json.data ?? []);

        // If payload looks like groups (items have `donhang`), treat as OrderGroup[]
        const groupsResp: OrderGroup[] =
            Array.isArray(payload) &&
            payload.length > 0 &&
            typeof ((payload[0] as Record<string, unknown>).donhang) !== "undefined"
              ? (payload as OrderGroup[])
              : [];
        // Save groups (useful if you want to display server-provided counts later)
        setGroups(groupsResp);

        // Build flat order list:
        const allOrders: Order[] = groupsResp.length
          ? groupsResp.flatMap(g => g.donhang ?? [])
          : (Array.isArray(payload) ? (payload as Order[]) : []);

        // Sort without mutating original
        const sortedList = [...allOrders].sort((a, b) => b.id - a.id);

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

  //tự mở detail khi có openOrderId trong sessionStorage khi đặt hàng thành công
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pending = sessionStorage.getItem("openOrderId");
    if (!pending) return;
    // clear immediately to avoid re-opening on refresh
    sessionStorage.removeItem("openOrderId");
    const id = Number(pending);
    if (Number.isNaN(id)) return;
    // Nếu trang vẫn đang tải dữ liệu đơn hàng, đợi đến khi loadingDetail false (openDetail sẽ fetch chi tiết)
    // openDetail sẽ setDetailOpen(true) và setDetailOrder(...) khi xong
    openDetail(id);
  }, [/* note: empty deps OK since openDetail is stable in this module; if linter complains, wrap with useCallback or disable rule */]);

  const openDetail = async (id: number) => {
    setDetailOpen(true);
    setLoadingDetail(true);
    try {
      const token = Cookies.get("access_token");
      const res = await fetch(`${API}/api/tai-khoan/donhangs/${id}`, {
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
      const res = await fetch(`${API}/api/tai-khoan/donhangs/${orderId}/huy`, {
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
  const isCancellable = (status?: string) => {
  const s = (status || "").toLowerCase();
    return s.includes("chờ") || s.includes("pending");
  };

  // Kiểm tra trạng thái thanh toán chưa thành công / chưa thanh toán
  const isPaymentPending = (order?: DetailedOrder | null) => {
    if (!order) return false;
    const pay = (order.trangthaithanhtoan || "").toString().toLowerCase();
    const state = (order.trangthai || "").toString().toLowerCase();
    if (pay.includes("chưa") || pay.includes("pending") || pay.includes("unpaid")) return true;
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
      const url = `${API}/api/tai-khoan/donhangs/${orderId}/payment-url`;
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
  const getFilterKey = (status?: string): FilterStatus => {
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

  const countsByFilter = useMemo(() => {
  const map: Record<FilterStatus, number> = {
    all: 0, pending: 0, confirmed: 0, processing: 0, shipping: 0, completed: 0, cancelled: 0
  };
  map.all = orders.length;
  for (const o of orders) {
    const k = getFilterKey(o.trangthai);
    map[k] = (map[k] ?? 0) + 1;
  }
  return map;
}, [orders]);

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
        {/* Detail view replaces list when an order is opened */}
        {detailOpen && detailOrder ? (
          <div>
            <div className="flex-wrap gap-16 mb-10 flex-between">
              <h6 className="mb-0 text-gray-900">Chi tiết đơn hàng</h6>
              <div className="flex-wrap gap-16 position-relative flex-align">
                <button
                  type="button"
                  className="text-2xl border border-gray-100 w-44 h-44 d-lg-none d-flex flex-center rounded-6 sidebar-btn"
                  onClick={closeDetail}
                  title="Đóng"
                >
                  <i className="ph-bold ph-folder-user"></i>
                </button>
              </div>
            </div>

            <div className="flex-wrap gap-16 mb-20 flex-between">
              <h6 className="gap-12 mb-0 text-gray-600 text-md fw-medium flex-align">
                Mã đơn: #{detailOrder.madon}
                <span className="p-4 text-sm bg-warning-200 text-warning-900 fw-semibold rounded-4 ms-2">
                  {detailOrder.trangthai ?? "Chờ xác nhận"}
                </span>
              </h6>

              <div className="gap-8 mb-20 flex-align">
                <i className="text-gray-600 ph-bold ph-clock-countdown text-md"></i>
                <span className="text-sm text-gray-600 fw-normal">
                  <span className="fw-medium">Ngày đặt hàng:</span> {formatOrderDate(detailOrder.created_at)}
                </span>
              </div>
            </div>

            <div className="row">
              {/* Địa chỉ người nhận */}
              <div className="gap-5 p-0 px-6 col-lg-4 d-flex flex-column">
                <span className="text-lg text-gray-900 fw-semibold">Địa chỉ người nhận</span>
                <div className="px-10 py-10 border border-gray-300 rounded-4 h-100">
                  <div className="text-sm text-gray-900 fw-semibold">
                    {detailOrder.diachigiaohang?.hoten ?? detailOrder.nguoinhan ?? "-"}
                  </div>
                  <div className="mt-5 text-sm text-gray-800">
                    <span className="fw-medium">Địa chỉ:</span>{" "}
                    {detailOrder.diachigiaohang?.diachi ?? detailOrder.diachinhan ?? "-"}
                  </div>
                  <div className="mt-5 text-sm text-gray-800">
                    <span className="fw-medium">Số điện thoại:</span>{" "}
                    {detailOrder.diachigiaohang?.sodienthoai ?? detailOrder.sodienthoai ?? "-"}
                  </div>
                  {detailOrder.diachigiaohang?.tinhthanh && (
                    <div className="mt-5 text-sm text-gray-800">
                      <span className="fw-medium">Tỉnh / Thành:</span> {detailOrder.diachigiaohang.tinhthanh}
                    </div>
                  )}
                </div>
              </div>

              {/* Vận chuyển (fallbacks: phivanchuyen, hinhthucvanchuyen, phigiaohang, khuvucgiao) */}
              <div className="gap-5 p-0 px-6 col-lg-4 d-flex flex-column">
                <span className="text-lg text-gray-900 fw-semibold">Hình thức vận chuyển</span>
                <div className="px-10 py-10 border border-gray-300 rounded-4 h-100">
                  <div className="text-sm text-gray-900 fw-semibold">
                    {detailOrder.phivanchuyen?.ten ?? detailOrder.hinhthucthanhtoan ?? detailOrder.phuongthucvanchuyen ?? "Giao hàng tiêu chuẩn (Nội tỉnh)"}
                  </div>
                  <div className="mt-5 text-sm text-gray-800">
                    <span className="fw-medium">Phí vận chuyển:</span>{" "}
                    <span className="fst-italic">{fmtMoney(detailOrder.phivanchuyen?.phi ?? detailOrder.phigiaohang ?? 0)}</span>
                  </div>
                  <div className="mt-5 text-sm text-gray-800">
                    <span className="fw-medium">Khu vực giao:</span>{" "}
                    <span className="fst-italic">{detailOrder.khuvucgiao ?? detailOrder.diachigiaohang?.tinhthanh ?? "-"}</span>
                  </div>
                </div>
              </div>

              {/* Thanh toán (fallbacks: phuongthuc.maphuongthuc / phuongthuc.ten / trangthaithanhtoan) */}
              <div className="gap-5 p-0 px-6 col-lg-4 d-flex flex-column">
                <span className="text-lg text-gray-900 fw-semibold">Hình thức thanh toán</span>
                <div className="px-10 py-10 border border-gray-300 rounded-4 h-100">
                  <div className="text-sm text-gray-900 fw-semibold">
                    {formatPaymentMethod(detailOrder.phuongthuc)}
                  </div>
                  <div className="mt-5 text-sm text-gray-800">
                    <span className="fw-medium">Trạng thái:</span>{" "}
                    <span className={`fst-italic ${(detailOrder.trangthaithanhtoan ?? detailOrder.trangthai ?? "").toLowerCase().includes("chưa") ? "text-warning-600" : "text-success-600"}`}>
                      {detailOrder.trangthaithanhtoan ?? detailOrder.trangthai ?? "-"}
                    </span>
                  </div>

                  {/* Thanh toán lại nếu cần */}
                  {detailOrder.phuongthuc?.maphuongthuc === "dbt" && isPaymentPending(detailOrder) && (
                    <button
                      type="button"
                      onClick={() => retryPayment(detailOrder.id, "dbt")}
                      className="gap-6 px-12 py-6 mt-4 text-white border-0 fw-medium rounded-8 flex-center"
                      style={{ background: "#2563eb", fontSize: 13, cursor: "pointer", width: "100%" }}
                    >
                      <i className="ph-bold ph-credit-card" /> Thanh toán VNPay
                    </button>
                  )}
                  {detailOrder.phuongthuc?.maphuongthuc === "cp" && isPaymentPending(detailOrder) && (
                    <button
                      type="button"
                      onClick={() => retryPayment(detailOrder.id, "cp")}
                      className="gap-6 px-12 py-6 mt-4 text-white border-0 fw-medium rounded-8 flex-center"
                      style={{ background: "#7c3aed", fontSize: 13, cursor: "pointer", width: "100%" }}
                    >
                      <i className="ph-bold ph-qr-code" /> Thanh toán VietQR
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Chi tiết mua hàng */}
            <div className="mt-20 row">
              <div className="p-0 px-6 col-lg-12">
                <div className="p-16 border border-gray-300 rounded-4">
                  <div className="mb-6 d-flex align-items-center justify-content-between">
                    <div className="gap-8 text-lg text-gray-900 fw-semibold flex-align">
                      <i className="text-lg ph-bold ph-shopping-cart text-main-600"></i> Chi tiết mua hàng
                    </div>
                    <div className="text-sm text-gray-600">{(detailOrder.chitietdonhang ?? []).length} sản phẩm</div>
                  </div>

                  <div className="px-5 py-6">
                    {(detailOrder.chitietdonhang ?? []).map((it) => {
                      // Fallbacks for variant / product name / image / variant label
                      const variant = it.bienthe ?? undefined;
                      const sp = (variant as OrderItem["bienthe"])?.sanpham ?? {};
                      const title = sp.ten ?? it.tensanpham ?? it.name ?? "Sản phẩm";
                      const imgRaw =
                        (sp.hinhanhsanpham?.[0]?.hinhanh as string | undefined) ??
                        (sp.hinhanh as string | undefined) ??
                        (it.hinhanh as string | undefined) ??
                        "/assets/images/thumbs/placeholder.png";
                      const imgSrc = String(imgRaw).startsWith("http")
                        ? String(imgRaw)
                        : `${API}${String(imgRaw).startsWith("/") ? "" : "/"}${String(imgRaw)}`;
                      const variantLabel =
                        (variant as OrderItem["bienthe"])?.loaibienthe?.ten ??
                        (variant as OrderItem["bienthe"])?.tenloaibienthe ??
                        it.tenloaibienthe ??
                        it.bienthe?.tenloaibienthe ??
                        "";
                      const qty = it.soluong ?? it.quantity ?? 0;
                      const price = it.dongia ?? it.price ?? 0;

                      return (
                        <div key={it.id} className="gap-12 mb-12 d-flex align-items-center">
                          <a href="#" className="border border-gray-100 rounded-8 flex-center" style={{ maxWidth: 90, maxHeight: 90 }}>
                            <Image src={imgSrc} alt={title} width={90} height={90} className="object-cover w-100 rounded-8" unoptimized />
                          </a>

                          <div className="text-start w-100">
                            <h6 className="mb-0 title text-md fw-semibold">
                              <a href="#" className="link text-line-2" title={title} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: 350, display: "inline-block" }}>
                                {title}
                              </a>
                            </h6>

                            <div className="gap-16 mb-6 flex-align">
                              <div className="gap-8 px-6 py-4 text-sm btn bg-gray-50 text-heading rounded-8 flex-center fw-normal">
                                {variantLabel}
                              </div>
                            </div>

                            <div className="mb-6 product-card__price">
                              <div className="gap-24 flex-align flex-between">
                                <span className="text-heading text-md fw-medium">Số lượng: {qty}</span>
                                <span className="text-gray-600 text-md fw-semibold">{fmtMoney(price)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tổng tiền */}
                  <div className="pt-16 mt-16 border-gray-300 border-top border-1">
                    <div className="gap-8 mb-8 flex-between">
                      <span></span>
                      <div className="gap-24 flex-align flex-between" style={{ width: "22%" }}>
                        <span className="text-gray-700 text-md">Tạm tính:</span>
                        <span className="text-gray-900 text-md fw-semibold">{fmtMoney(detailOrder.tamtinh ?? detailOrder.thanhtien ?? 0)}</span>
                      </div>
                    </div>

                    <div className="gap-8 mb-8 flex-between">
                      <span></span>
                      <div className="gap-24 flex-align flex-between" style={{ width: "22%" }}>
                        <span className="text-gray-700 text-md">Phí giao hàng:</span>
                        <span className="text-md text-info-900 fw-semibold">{fmtMoney(detailOrder.phivanchuyen?.phi ?? detailOrder.phigiaohang ?? 0)}</span>
                      </div>
                    </div>

                    {detailOrder.magiamgia?.giatri ? (
                      <div className="gap-8 mb-8 flex-between">
                        <span></span>
                        <div style={{ width: "22%" }} className="gap-24 flex-align flex-between">
                          <span className="text-gray-700 text-md">Giảm giá:</span>
                          <span className="text-md text-success-600 fw-semibold">-{fmtMoney(detailOrder.magiamgia.giatri)}</span>
                        </div>
                      </div>
                    ) : null}

                    <div className="gap-8 flex-between">
                      <span></span>
                      <div className="gap-24 flex-align">
                        <span className="text-xl text-gray-900 fw-bold">Tổng tiền:</span>
                        <span className="text-xl text-main-600 fw-bold">{fmtMoney(detailOrder.thanhtien ?? detailOrder.tamtinh ?? 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="gap-12 mt-10 flex-align flex-between">
                  <a onClick={closeDetail} className="gap-8 mt-10 text-main-600 text-md fw-medium flex-align" style={{ cursor: "pointer" }}>
                    <i className="ph-bold ph-arrow-fat-lines-left text-main-600 text-md"></i> Quay lại đơn hàng của tôi
                  </a>

                  <div className="gap-12 flex-align">
                    {isCancellable(detailOrder.trangthai) && (
                      <button onClick={() => handleCancelOrder(detailOrder.id)} className="gap-8 px-8 py-4 border fw-medium text-main-600 text-md border-main-600 hover-bg-main-600 hover-text-white rounded-4 transition-1 flex-align">
                        <i className="ph-bold ph-trash"></i> Hủy đơn
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ELSE: render original orders list section (paste your existing section here) */
          <section className="mt-10 overflow-hidden trending-productss fix-scale-80">
          <div className="p-24 border border-gray-100 rounded-8" style={{ paddingBottom: 120 }}>
            {/* <div className="p-24 border border-gray-100 rounded-8"> */}
            <div className="mb-20 section-heading">
              <div className="flex-wrap gap-8 flex-between flex-align">
                <ul className="pb-2 m-0 mb-3 overflow-auto nav common-tab style-two nav-pills flex-nowrap">
                  {STATUS_OPTIONS.map((opt) => {
                    const active = filterStatus === opt.key;
                    return (
                      <li key={opt.key} className="nav-item">
                        <button
                          type="button"
                          onClick={() => { setFilterStatus(opt.key); setPage(1); }}
                          className={`px-10 py-8 rounded-10 flex-align gap-8 fw-medium text-xs transition-1 me-2 mb-2 ${active ? "bg-main-600 text-white" : "border border-gray-600 text-gray-900 hover-border-main-600 hover-text-main-600"}`}
                        >
                          {opt.icon && <i className={`ph-bold ${opt.icon}`} />}
                          {opt.label} ({countsByFilter[opt.key] ?? 0})
                        </button>
                      </li>
                    );
                  })}
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
                          {(() => {
                            const badge = getStatusBadgeProps(order.trangthai);
                              return (
                                <span className={badge.className}>
                                  <i className={`ph-bold ${badge.icon}`} /> {displayStatusLabel(order.trangthai)}
                                </span>
                              );
                          })()}
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
                            {isReviewableStatus(order.trangthai) ? (
                              <Link href={`/danh-gia?order_id=${order.id}`} className="gap-8 px-8 py-4 text-sm border fw-medium text-main-600 border-main-600 hover-bg-main-600 hover-text-white rounded-4 transition-1 flex-align">
                                <i className="ph ph-star" /> Đánh giá
                              </Link>
                            ) : (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={!isCancellable(order.trangthai)}
                                className={`gap-8 px-8 py-4 text-sm border fw-medium rounded-4 transition-1 flex-align ${isCancellable(order.trangthai)
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
        )}

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