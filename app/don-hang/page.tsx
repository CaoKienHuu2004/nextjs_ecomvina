"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import FullHeader from "@/components/FullHeader";
import AccountShell from "@/components/AccountShell";
import { useAuth } from "@/hooks/useAuth";
import { getTrangThaiDonHang, getPhuongThucThanhToan, getStatusBadgeProps, statusIcon, statusBadgeClass, formatPrice } from "@/utils/chitietdh";
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
  phuongthuc?: { id?: number; ten?: string; ma_phuongthuc?: string };
  phivanchuyen?: { id?: number; ten?: string; phi?: number };
  diachigiaohang?: { hoten?: string; sodienthoai?: string; diachi?: string; tinhthanh?: string; trangthai?: string };
  magiamgia?: { magiamgia?: string; giatri?: number; mota?: string };
  chitietnguoidung?: { hoten?: string; diachi?: string; sodienthoai?: string };
  hinhthucthanhtoan?: string;
  phuongthucvanchuyen?: string;
  tamtinh?: number;
};



// Type cho Filter
type FilterStatus = "all" | "pending" | "processing" | "shipping" | "delivered" | "completed" | "cancelled";

// Map mã phương thức thanh toán (ma_phuongthuc) sang label hiển thị
const formatPaymentMethod = (ph?: DetailedOrder["phuongthuc"]) => {
  const code = ph?.ma_phuongthuc ?? "";
  if (code === "cod") return "Thanh toán khi nhận hàng (COD)";
  if (code === "dbt") return "Chuyển khoản ngân hàng (tự động)";
  if (code === "cp") return "Thanh toán trực tiếp (thủ công)";
  return ph?.ten ?? getPhuongThucThanhToan(ph?.id ?? undefined) ?? "-";
};

// --- 2. COMPONENT CHÍNH ---

export default function OrdersPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<OrderGroup[]>([]);

  // State Filter & Pagination
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<DetailedOrder | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const displayStatusLabel = (status?: string) => {
    const label = getTrangThaiDonHang(status);
    return label && label !== "Chưa rõ" ? label : (status || "Chưa rõ");
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";
        const token = Cookies.get("access_token");
        console.log("don-hang: fetching orders with token:", token ? token.substring(0, 20) + "..." : null);

        const res = await fetch(`${API}/api/v1/don-hang`, {
          method: "GET",
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
            "Accept": "application/json",
          },
          cache: "no-store",
          credentials: "include",
        });
        console.log("don-hang: API response status:", res.status);

        if (res.ok) {
          const json: any = await res.json().catch(() => ({}));
          console.log("don-hang: API response data:", json);

          // API trả về: { status: 200, message: "...", data: { current_page: 1, data: [...orders], ... } }
          // Orders nằm ở json.data.data
          const ordersArray = json?.data?.data ?? [];
          console.log("don-hang: orders array:", ordersArray, "length:", ordersArray.length);

          // Đây là array trực tiếp của orders, không có groups
          const allOrders: Order[] = Array.isArray(ordersArray) ? ordersArray : [];

          // Sort by id descending
          const sortedList = [...allOrders].sort((a, b) => b.id - a.id);

          setOrders(sortedList);
          console.log("don-hang: set orders complete, count:", sortedList.length);
        } else {
          console.error("Lỗi API:", res.status);
        }
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    console.log("don-hang: isLoggedIn =", isLoggedIn);
    if (isLoggedIn) {
      fetchOrders();
    } else {
      // Nếu chưa đăng nhập, kiểm tra xem có token không để fetch trực tiếp
      const token = Cookies.get("access_token");
      if (token) {
        console.log("don-hang: có token nhưng isLoggedIn=false, vẫn fetch orders");
        fetchOrders();
      } else {
        setLoading(false);
      }
    }
  }, [isLoggedIn]);

  //tự mở detail khi có openOrderMadon trong sessionStorage khi đặt hàng thành công
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Ưu tiên lấy madon, fallback sang id nếu cần
    const pendingMadon = sessionStorage.getItem("openOrderMadon");
    const pendingId = sessionStorage.getItem("openOrderId");

    if (pendingMadon) {
      sessionStorage.removeItem("openOrderMadon");
      openDetail(pendingMadon);
      return;
    }

    if (pendingId) {
      sessionStorage.removeItem("openOrderId");
      // Tìm order trong danh sách để lấy madon
      const id = Number(pendingId);
      if (!Number.isNaN(id) && orders.length > 0) {
        const order = orders.find(o => o.id === id);
        if (order?.madon) {
          openDetail(order.madon);
        }
      }
    }
  }, [orders]);

  const openDetail = async (madon: string) => {
    setDetailOpen(true);
    setLoadingDetail(true);
    try {
      const token = Cookies.get("access_token");
      // API sử dụng madon (mã đơn hàng) thay vì id
      const res = await fetch(`${API}/api/v1/don-hang/${madon}`, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
          "Accept": "application/json",
        },
        cache: "no-store",
      });

      if (res.ok) {
        const json = await res.json();
        console.log("Chi tiết đơn hàng:", json);
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
  const handleCancelOrder = async (orderId: number, madon?: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    try {
      const token = Cookies.get("access_token");
      console.log("handleCancelOrder: orderId=", orderId, "madon=", madon, "token=", token ? "exists" : "missing");

      // API endpoint: /api/v1/don-hang/huy-don-hang
      const res = await fetch(`${API}/api/v1/don-hang/huy-don-hang`, {
        method: "POST",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: orderId,
          madon: madon
        }),
      });
      console.log("handleCancelOrder: response status=", res.status);

      const data = await res.json().catch(() => ({}));
      console.log("handleCancelOrder: response=", data);

      if (res.ok || data.status === 200) {
        // optimistic UI update: mark order as cancelled
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, trangthai: "Đã hủy" } : o));
        // Nếu đang xem chi tiết đơn này, cập nhật luôn
        if (detailOrder && detailOrder.id === orderId) {
          setDetailOrder({ ...detailOrder, trangthai: "Đã hủy" });
        }
        alert(data.message || "Đã hủy đơn hàng thành công!");
      } else {
        alert(data.message || "Không thể hủy đơn. Vui lòng thử lại.");
      }
    } catch (e) {
      console.error("handleCancelOrder error:", e);
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
      const url = `${API}/api/v1/don-hang/${orderId}/payment-url`;
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

  // --------------------------
  // Payment-choice modal state
  // --------------------------
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalOrderId, setPaymentModalOrderId] = useState<number | null>(null);
  const [paymentModalAction, setPaymentModalAction] = useState<"reorder" | "retry" | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // tạo form popup chọn phương thức thanh toán
  const modalRef = useRef<HTMLDivElement | null>(null);
  const primaryBtnRef = useRef<HTMLButtonElement | null>(null);

  // lock body scroll and handle ESC key while modal open
  useEffect(() => {
    if (!paymentModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePaymentModal();
      if (e.key === "Tab" && modalRef.current) {
        // simple focus trap: keep focus inside modal
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          (last as HTMLElement).focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          (first as HTMLElement).focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    // set initial focus
    setTimeout(() => primaryBtnRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [paymentModalOpen]);


  const openPaymentModal = (orderId: number, action: "reorder" | "retry") => {
    setPaymentModalOrderId(orderId);
    setPaymentModalAction(action);
    setPaymentModalOpen(true);
  };
  const closePaymentModal = () => {
    if (paymentProcessing) return;
    setPaymentModalOpen(false);
    setPaymentModalOrderId(null);
    setPaymentModalAction(null);
  };

  // helper to set payment method for an order
  const setOrderPaymentMethod = async (orderId: number, methodCode: string) => {
    const token = Cookies.get("access_token");
    const res = await fetch(`${API}/api/v1/don-hang/${orderId}/phuong-thuc`, {
      method: "PATCH",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ ma_phuongthuc: methodCode }),
    });
    return res;
  };

  // helper: map payment method -> default status to send to /trang-thai
  const getStatusForMethod = (methodCode: string, action: "reorder" | "retry") => {
    // Trả về cả trạng thái đơn và trạng thái thanh toán để gửi lên server.
    // Điều chỉnh string theo spec backend nếu cần (ví dụ đổi key thành 'trangthai' / 'trangthaithanhtoan').
    if (methodCode === "dbt") {
      // Trạng thái đơn khi tạo/chuẩn bị thanh toán: chờ xử lý.
      // Trạng thái thanh toán ban đầu: chưa thanh toán (server sẽ cập nhật thành 'Đã thanh toán' sau callback của VNPay).
      return { orderStatus: "Chờ xử lý", paymentStatus: "Chưa thanh toán" };
    }
    if (methodCode === "cod") {
      // COD: tạo đơn và giữ trạng thái chưa thanh toán
      return { orderStatus: "Chờ xử lý", paymentStatus: "Chưa thanh toán" };
    }
    // default
    return { orderStatus: "Chờ xử lý", paymentStatus: "Chưa thanh toán" };
  };
  // optional: call endpoint to update order status (server-side will decide new status)
  const setOrderStatus = async (orderId: number, payload: Record<string, unknown> = {}) => {
    const token = Cookies.get("access_token");
    const res = await fetch(`${API}/api/v1/don-hang/${orderId}/trang-thai`, {
      method: "PATCH",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(payload),
    });
    return res;
  };

  // core: process chosen method for reorder / retry
  const processPaymentChoice = async (methodCode: string) => {
    if (!paymentModalOrderId || !paymentModalAction) return;
    setPaymentProcessing(true);
    try {
      if (paymentModalAction === "reorder") {
        // 1) create new order by mua-lai
        const token = Cookies.get("access_token");
        const res = await fetch(`${API}/api/v1/don-hang/${paymentModalOrderId}/mua-lai-don-hang`, {
          method: "PATCH",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "",
          },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(json.message || "Không thể mua lại đơn hàng. Vui lòng thử lại.");
          return;
        }
        // try to extract new order id
        const newId = json.id ?? json.id_donhang ?? (() => {
          const m = String(json.message || "").match(/(\d{2,})/);
          return m ? Number(m[1]) : undefined;
        })();
        if (!newId) {
          alert("Đã mua lại nhưng không xác định được mã đơn mới. Vui lòng kiểm tra giỏ hàng.");
          router.push("/gio-hang");
          return;
        }

        // Nếu chọn VNPay (dbt) => gán phương thức + set trạng thái -> lấy payment_url -> redirect
        // Lấy mapping trạng thái cho phương thức
        const mapped = getStatusForMethod(methodCode, "reorder");
        // 2) Gán phương thức
        await setOrderPaymentMethod(newId, methodCode);
        // 3) Set trạng thái đơn + trạng thái thanh toán (gửi cả trường trạng thái thanh toán để backend lưu)
        // Gửi payload với hai khóa phổ biến: 'status' (hoặc 'trangthai') và 'trangthaithanhtoan'.
        await setOrderStatus(newId, { status: mapped.orderStatus, trangthaithanhtoan: mapped.paymentStatus });

        // 4) Nếu là VNPay (dbt) -> gọi payment-url để redirect
        if (methodCode === "dbt") {
          await retryPayment(newId);
          return;
        }
        // Với COD hoặc khác: không redirect, chuyển về danh sách đơn
        router.push("/don-hang");

      } else if (paymentModalAction === "retry") {
        // 1) ask server to prepare order for retry (thanh-toan-lai-don-hang)
        const token = Cookies.get("access_token");
        const res = await fetch(`${API}/api/v1/don-hang/${paymentModalOrderId}/thanh-toan-lai-don-hang`, {
          method: "PATCH",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "",
          },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(json.message || "Không thể yêu cầu thanh toán lại. Vui lòng thử lại.");
          return;
        }

        // Nếu chọn VNPay (dbt) => gán + set trạng thái -> redirect tới payment_url
        // Map trạng thái theo phương thức
        const mapped = getStatusForMethod(methodCode, "retry");
        // Gán phương thức
        await setOrderPaymentMethod(paymentModalOrderId, methodCode);
        // Set trạng thái đơn + trạng thái thanh toán
        await setOrderStatus(paymentModalOrderId!, { status: mapped.orderStatus, trangthaithanhtoan: mapped.paymentStatus });
        // Nếu dbt -> redirect sang cổng
        if (methodCode === "dbt") {
          await retryPayment(paymentModalOrderId);
          return;
        }

        // Với COD hoặc khác: refresh detail view
        // Tìm madon từ orderId
        const orderToRefresh = orders.find(o => o.id === paymentModalOrderId);
        if (orderToRefresh?.madon) {
          await openDetail(orderToRefresh.madon);
        }
        alert(json.message || "Đã cập nhật phương thức. Bạn có thể kiểm tra trạng thái đơn.");
      }
    } catch (err) {
      console.error("processPaymentChoice error", err);
      alert("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setPaymentProcessing(false);
      closePaymentModal();
    }
  };
  // --------------------------
  // END payment-choice modal
  // 

  // --- MUA LẠI ĐƠN HÀNG: mở modal chọn phương thức thanh toán ---
  // legacy handler kept for compatibility (not used if using modal flow)
  const handleReorder = async (orderId: number) => {
    // fallback: open modal to choose payment method
    openPaymentModal(orderId, "reorder");
  };

  // --- Thanh toán lại cho đơn đã hủy (server cập nhật trạng thái -> gọi payment-url) ---
  const handleRetryPaymentFromCancelled = async (orderId: number) => {
    // open modal to choose payment method then proceed
    openPaymentModal(orderId, "retry");
  };

  // --- LOGIC FILTER ---
  // Helper map trạng thái từ API sang key filter
  const getFilterKey = (status?: string): FilterStatus => {
    const s = (status || "").toLowerCase();
    if (s.includes("chờ thanh toán")) return "pending";
    if (s.includes("chờ xác nhận") || s.includes("đang xử lý")) return "processing";
    if (s.includes("đang đóng gói")) return "shipping";
    if (s.includes("đang giao hàng") || s.includes("đang giao")) return "delivered";
    if (s.includes("đã giao")) return "completed";
    if (s.includes("đã hủy") || s.includes("cancel")) return "cancelled";
    return "all";
  };

  const filteredOrders = useMemo(() => {
    if (filterStatus === "all") return orders;
    return orders.filter(o => getFilterKey(o.trangthai) === filterStatus);
  }, [orders, filterStatus]);

  const countsByFilter = useMemo(() => {
    const map: Record<FilterStatus, number> = {
      all: 0,
      pending: 0,
      processing: 0,
      shipping: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
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
  //   const formatPrice = (val: number) => val.toLocaleString("vi-VN") + " ₫";
  // }
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
                <span className={statusBadgeClass(detailOrder.trangthai)}>
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
                    <span className="fst-italic">{formatPrice(detailOrder.phivanchuyen?.phi ?? detailOrder.phigiaohang ?? 0)}</span>
                  </div>
                  <div className="mt-5 text-sm text-gray-800">
                    <span className="fw-medium">Khu vực giao:</span>{" "}
                    <span className="fst-italic">{detailOrder.khuvucgiao ?? detailOrder.diachigiaohang?.tinhthanh ?? "-"}</span>
                  </div>
                </div>
              </div>

              {/* Thanh toán (fallbacks: phuongthuc.ma_phuongthuc / phuongthuc.ten / trangthaithanhtoan) */}
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
                  {detailOrder.phuongthuc?.ma_phuongthuc === "dbt" && isPaymentPending(detailOrder) && (
                    <button
                      type="button"
                      onClick={() => retryPayment(detailOrder.id, "dbt")}
                      className="gap-6 px-12 py-6 mt-4 text-white border-0 fw-medium rounded-8 flex-center"
                      style={{ background: "#2563eb", fontSize: 13, cursor: "pointer", width: "100%" }}
                    >
                      <i className="ph-bold ph-credit-card" /> Thanh toán VNPay
                    </button>
                  )}
                  {/* {detailOrder.phuongthuc?.ma_phuongthuc === "cp" && isPaymentPending(detailOrder) && (
                    <button
                      type="button"
                      onClick={() => retryPayment(detailOrder.id, "cp")}
                      className="gap-6 px-12 py-6 mt-4 text-white border-0 fw-medium rounded-8 flex-center"
                      style={{ background: "#7c3aed", fontSize: 13, cursor: "pointer", width: "100%" }}
                    >
                      <i className="ph-bold ph-qr-code" /> Thanh toán VietQR
                    </button>
                  )} */}
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

                  {(() => {
                    const items = (detailOrder.chitietdonhang ?? []);
                    const purchased = items.filter(it => Number(it.dongia ?? it.price ?? 0) > 0);
                    const gifts = items.filter(it => Number(it.dongia ?? it.price ?? 0) === 0);

                    const renderItem = (it: OrderItem) => {
                      const variant = it.bienthe ?? undefined;
                      const sp = (variant as OrderItem["bienthe"])?.sanpham ?? {};
                      const title = sp.ten ?? it.tensanpham ?? it.name ?? "Sản phẩm";

                      // Lấy tên file ảnh từ API
                      const imgFileName = sp.hinhanhsanpham?.[0]?.hinhanh ?? sp.hinhanh ?? it.hinhanh;

                      // Xây dựng đường dẫn ảnh
                      let imgSrc = "/assets/images/thumbs/placeholder.png";
                      if (imgFileName) {
                        if (String(imgFileName).startsWith("http")) {
                          imgSrc = String(imgFileName);
                        } else {
                          // Đường dẫn theo cấu trúc API: /assets/client/images/thumbs/{filename}
                          imgSrc = `${API}/assets/client/images/thumbs/${imgFileName}`;
                        }
                      }
                      const variantLabel =
                        (variant as OrderItem["bienthe"])?.loaibienthe?.ten ??
                        (variant as OrderItem["bienthe"])?.tenloaibienthe ??
                        it.tenloaibienthe ??
                        it.bienthe?.tenloaibienthe ??
                        "";
                      const qty = it.soluong ?? it.quantity ?? 0;
                      const price = Number(it.dongia ?? it.price ?? 0);
                      const orig = Number((it.bienthe as any)?.giagoc ?? (it as any).giagoc ?? (it as any).price ?? price);
                      const hasDiscount = orig > price && orig > 0;
                      const discountPct = hasDiscount ? Math.round((orig - price) / orig * 100) : 0;
                      return (
                        <div key={it.id} className="gap-12 mb-12 d-flex align-items-center">
                          <a href="#" className="border border-gray-100 rounded-8 flex-center" style={{ width: 72, height: 72, flexShrink: 0 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imgSrc} alt={title} className="object-cover rounded-6" style={{ width: 72, height: 72 }} />
                          </a>
                          <div className="text-start w-100">
                            <h6 className="mb-2 title text-md fw-semibold" style={{ maxWidth: 520, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {title}
                            </h6>
                            <div className="gap-12 mb-6 flex-align">
                              <div className="gap-8 px-6 py-4 text-sm btn bg-gray-50 text-heading rounded-8 flex-center fw-normal">{variantLabel}</div>
                              <div className="text-sm text-gray-600">Số lượng: <span className="fw-medium">{qty}</span></div>
                            </div>
                          </div>
                          <div className="text-end" style={{ minWidth: 160 }}>
                            {price === 0 ? (
                              <>
                                <div className="text-sm text-gray-500">Quà tặng miễn phí</div>
                                <div className="text-gray-700 text-md fw-semibold">0 ₫</div>
                              </>
                            ) : (
                              <>
                                {hasDiscount && <div className="text-sm text-gray-500"><s>{formatPrice(orig)}</s> <span className="ms-2 text-danger-600 fw-medium">-{discountPct}%</span></div>}
                                <div className="text-md fw-semibold text-main-600">{formatPrice(price)}</div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <>
                        {/* Purchased items */}
                        {purchased.map(renderItem)}
                        {/* Divider + Gifts */}
                        {gifts.length > 0 && (
                          <>
                            <div className="my-6 border-gray-200 border-top" />
                            <div className="mb-4 text-sm text-gray-600">Quà tặng nhận được</div>
                            <div style={{ paddingLeft: 20 }}>
                              {gifts.map(renderItem)}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Tổng tiền */}
                <div className="pt-16 mt-16 border-gray-300 border-top border-1">
                  <div className="gap-8 mb-8 flex-between">
                    <span></span>
                    <div className="gap-24 flex-align flex-between" style={{ width: "22%" }}>
                      <span className="text-gray-700 text-md">Tạm tính:</span>
                      <span className="text-gray-900 text-md fw-semibold">{formatPrice(detailOrder.tamtinh ?? detailOrder.thanhtien ?? 0)}</span>
                    </div>
                  </div>

                  <div className="gap-8 mb-8 flex-between">
                    <span></span>
                    <div className="gap-24 flex-align flex-between" style={{ width: "22%" }}>
                      <span className="text-gray-700 text-md">Phí giao hàng:</span>
                      <span className="text-md text-info-900 fw-semibold">{formatPrice(detailOrder.phivanchuyen?.phi ?? detailOrder.phigiaohang ?? 0)}</span>
                    </div>
                  </div>

                  {detailOrder.magiamgia?.giatri ? (
                    <div className="gap-8 mb-8 flex-between">
                      <span></span>
                      <div style={{ width: "22%" }} className="gap-24 flex-align flex-between">
                        <span className="text-gray-700 text-md">Giảm giá:</span>
                        <span className="text-md text-success-600 fw-semibold">-{formatPrice(detailOrder.magiamgia.giatri)}</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="gap-8 flex-between">
                    <span></span>
                    <div className="gap-24 flex-align">
                      <span className="text-xl text-gray-900 fw-bold">Tổng tiền:</span>
                      <span className="text-xl text-main-600 fw-bold">{formatPrice(detailOrder.thanhtien ?? detailOrder.tamtinh ?? 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="gap-12 mt-10 flex-align flex-between">
                <a onClick={closeDetail} className="gap-8 mt-10 text-main-600 text-md fw-medium flex-align" style={{ cursor: "pointer" }}>
                  <i className="ph-bold ph-arrow-fat-lines-left text-main-600 text-md"></i> Quay lại đơn hàng của tôi
                </a>

                <div className="gap-12 flex-align">
                  {/* Nếu đơn đang ở trạng thái chờ thanh toán -> hiển thị Quay lại thanh toán */}
                  {getFilterKey(detailOrder.trangthai) === "pending" && (
                    <button
                      type="button"
                      onClick={() => retryPayment(detailOrder.id, "dbt")}
                      className="gap-8 px-8 py-4 text-sm border fw-medium text-main-600 border-main-600 hover-bg-main-600 hover-text-white rounded-4 transition-1 flex-align"
                    >
                      <i className="ph-bold ph-credit-card" /> Quay lại thanh toán
                    </button>
                  )}

                  {isCancellable(detailOrder.trangthai) && (
                    <button onClick={() => handleCancelOrder(detailOrder.id, detailOrder.madon)} className="gap-8 px-8 py-4 border fw-medium text-main-600 text-md border-main-600 hover-bg-main-600 hover-text-white rounded-4 transition-1 flex-align">
                      <i className="ph-bold ph-trash"></i> Hủy đơn
                    </button>
                  )}
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
                          {(order.chitietdonhang ?? []).length === 0 ? (
                            <div className="py-3 text-sm text-center text-gray-500">Không có sản phẩm</div>
                          ) : (
                            (() => {
                              const items = order.chitietdonhang ?? [];
                              const purchased = items.filter(it => Number(it.dongia ?? it.price ?? 0) > 0);
                              const gifts = items.filter(it => Number(it.dongia ?? it.price ?? 0) === 0);

                              const renderCompact = (it: OrderItem) => {
                                const title = it.bienthe?.sanpham?.ten ?? it.tensanpham ?? it.name ?? "Sản phẩm";
                                const slug = (it.bienthe?.sanpham as any)?.slug;

                                // Lấy tên file ảnh từ API - ưu tiên hinhanhsanpham[0].hinhanh
                                const imgFileName = it.bienthe?.sanpham?.hinhanhsanpham?.[0]?.hinhanh
                                  ?? it.bienthe?.sanpham?.hinhanh
                                  ?? it.hinhanh;

                                // Xây dựng đường dẫn ảnh
                                let img = "/assets/images/thumbs/placeholder.png";
                                if (imgFileName) {
                                  if (String(imgFileName).startsWith("http")) {
                                    img = String(imgFileName);
                                  } else {
                                    // Đường dẫn theo cấu trúc API: /assets/client/images/thumbs/{filename}
                                    img = `${API}/assets/client/images/thumbs/${imgFileName}`;
                                  }
                                } else if (slug) {
                                  // Fallback dùng slug nếu không có hình ảnh trực tiếp
                                  img = `${API}/assets/client/images/thumbs/${slug}-1.webp`;
                                }
                                const qty = it.soluong ?? it.quantity ?? 0;
                                const price = Number(it.dongia ?? it.price ?? 0);
                                const variantName = it.bienthe?.loaibienthe?.ten ?? it.tenloaibienthe ?? "";

                                return (
                                  <div key={it.id} className="py-6 px-5">
                                    <div className="d-flex align-items-center gap-12">
                                      <a href="#" className="border border-gray-100 rounded-8 flex-center" style={{ maxWidth: 80, maxHeight: 80, width: "100%", height: "100%" }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={img} alt={title} className="w-100 rounded-8" style={{ objectFit: "cover" }} />
                                      </a>
                                      <div className="table-product__content text-start">
                                        <h6 className="title text-sm fw-semibold mb-0">
                                          <a href="#" className="link text-line-2" title={title} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: 350, display: "inline-block" }}>
                                            {title}
                                          </a>
                                        </h6>
                                        {variantName && (
                                          <div className="flex-align gap-16 mb-6">
                                            <a href="#" className="btn bg-gray-50 text-heading text-xs py-4 px-6 rounded-8 flex-center gap-8 fw-medium">
                                              {variantName}
                                            </a>
                                          </div>
                                        )}
                                        <div className="product-card__price mb-6">
                                          <div className="flex-align gap-24">
                                            <span className="text-heading text-sm fw-medium">Số lượng: {qty}</span>
                                            <span className="text-main-600 text-md fw-bold">{formatPrice(price)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              };

                              const renderGift = (g: OrderItem, idx: number) => {
                                const title = g.tensanpham ?? g.name ?? g.bienthe?.sanpham?.ten ?? "Quà tặng";
                                const slug = (g.bienthe?.sanpham as any)?.slug;

                                // Lấy tên file ảnh từ API - ưu tiên hinhanhsanpham[0].hinhanh
                                const imgFileName = g.bienthe?.sanpham?.hinhanhsanpham?.[0]?.hinhanh
                                  ?? g.bienthe?.sanpham?.hinhanh
                                  ?? g.hinhanh;

                                // Xây dựng đường dẫn ảnh
                                let img = "/assets/images/thumbs/placeholder.png";
                                if (imgFileName) {
                                  if (String(imgFileName).startsWith("http")) {
                                    img = String(imgFileName);
                                  } else {
                                    // Đường dẫn theo cấu trúc API: /assets/client/images/thumbs/{filename}
                                    img = `${API}/assets/client/images/thumbs/${imgFileName}`;
                                  }
                                } else if (slug) {
                                  // Fallback dùng slug nếu không có hình ảnh trực tiếp
                                  img = `${API}/assets/client/images/thumbs/${slug}-1.webp`;
                                }

                                const qty = g.soluong ?? g.quantity ?? 1;
                                const orig = Number(g.bienthe?.giagoc ?? (g as any).giagoc ?? 0);
                                return (
                                  <div key={String(g.bienthe?.id ?? g.id ?? idx)} className="py-2 d-flex align-items-center justify-content-between">
                                    <div className="gap-12 d-flex align-items-center" style={{ maxWidth: 420 }}>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={img} alt={title} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
                                      <div style={{ minWidth: 0 }}>
                                        <div className="text-sm fw-medium text-truncate" style={{ maxWidth: 320 }}>{title}</div>
                                        <div className="text-xs text-gray-500">Số lượng: <span className="fw-medium">{qty}</span></div>
                                      </div>
                                    </div>
                                    <div className="text-end" style={{ minWidth: 120 }}>
                                      {orig > 0 && (
                                        <div className="text-xs text-gray-400 fw-semibold text-decoration-line-through">{formatPrice(orig)}</div>
                                      )}
                                      <div className="gap-4 text-xs flex-align text-main-two-600"><i className="text-sm ph-fill ph-seal-percent"></i> Quà tặng miễn phí</div>
                                    </div>
                                  </div>
                                );
                              };
                              return (
                                <>
                                  {purchased.map(renderCompact)}

                                  {gifts.length > 0 && (
                                    <>
                                      <div className="my-3 border-gray-200 border-top" />
                                      <div className="mb-2 text-sm text-gray-600 d-flex align-items-center">
                                        <i className="ph-bold ph-gift text-main-600 me-2"></i>
                                        <span>Quà tặng của bạn</span>
                                      </div>
                                      <div style={{ paddingLeft: 12 }}>
                                        {gifts.map(renderGift)}
                                      </div>
                                    </>
                                  )}
                                </>
                              );
                            })()
                          )}
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
                              {/* Nút Quay lại thanh toán đã được ẩn theo yêu cầu */}

                              {isReviewableStatus(order.trangthai) ? (
                                <Link href={`/danh-gia?order_id=${order.id}`} className="gap-8 px-8 py-4 text-sm border fw-medium text-main-600 border-main-600 hover-bg-main-600 hover-text-white rounded-4 transition-1 flex-align">
                                  <i className="ph ph-star" /> Đánh giá
                                </Link>
                              ) : (
                                <button
                                  onClick={() => handleCancelOrder(order.id, order.madon)}
                                  disabled={!isCancellable(order.trangthai)}
                                  className={`gap-8 px-8 py-4 text-sm border fw-medium rounded-4 transition-1 flex-align ${isCancellable(order.trangthai)
                                    ? "text-danger-600 border-danger-600 hover-bg-danger-600 hover-text-white cursor-pointer"
                                    : "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                                    }`}
                                >
                                  <i className="ph-bold ph-trash" /> Hủy đơn
                                </button>
                              )}


                              {/* Mua lại cho đơn đã giao / hoàn tất */}
                              {isReviewableStatus(order.trangthai) && (
                                <button
                                  type="button"
                                  onClick={() => handleReorder(order.id)}
                                  className="gap-8 px-8 py-4 text-sm border fw-medium text-main-600 border-main-600 hover-bg-main-600 hover-text-white rounded-4 transition-1 flex-align"
                                >
                                  <i className="ph ph-shopping-cart" /> Mua lại
                                </button>
                              )}

                              {/* Thanh toán lại cho đơn đã hủy */}
                              {/* {getFilterKey(order.trangthai) === "cancelled" && (
                              <button
                                type="button"
                                onClick={() => handleRetryPaymentFromCancelled(order.id)}
                                className="gap-8 px-8 py-4 text-sm border fw-medium text-main-600 border-main-600 hover-bg-main-600 hover-text-white rounded-4 transition-1 flex-align"
                              >
                                <i className="ph-bold ph-credit-card" /> Thanh toán lại
                              </button>
                            )} */}

                              <button
                                type="button"
                                onClick={() => openDetail(order.madon)}
                                className="gap-8 px-8 py-4 text-sm border fw-medium text-main-600 border-main-600 hover-bg-main-600 hover-text-white rounded-4 transition-1 flex-align"
                              >
                                <i className="ph-bold ph-eye" /> Xem chi tiết
                              </button>
                            </div>
                          </div>
                          <div className="gap-12 flex-align">
                            <span className="text-lg fw-bold text-main-600">{formatPrice(order.thanhtien)}</span>
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

        {/* Payment method choice modal */}
        {paymentModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onMouseDown={(e) => {
              // nếu click ngoài dialog (backdrop) thì đóng
              if (e.target === e.currentTarget) closePaymentModal();
            }}
          >
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-modal-title"
              className="w-full max-w-md p-20 bg-white rounded-8"
              onMouseDown={(e) => e.stopPropagation()} // tránh bubble backdrop khi click trong dialog
            >
              <h5 id="payment-modal-title" className="mb-6 fw-semibold">Chọn phương thức thanh toán</h5>
              <p className="mb-6 text-sm text-gray-600">Chọn phương thức để tiếp tục {paymentModalAction === "reorder" ? "mua lại" : "thanh toán lại"}.</p>
              <div className="gap-8 mb-6 d-flex flex-column">
                <button
                  ref={primaryBtnRef}
                  disabled={paymentProcessing}
                  onClick={() => processPaymentChoice("dbt")}
                  className="gap-6 px-12 py-8 text-sm border fw-medium text-main-600 border-main-600 hover-bg-main-600 hover-text-white rounded-6"
                >
                  Thanh toán VNPay
                </button>
                <button
                  disabled={paymentProcessing}
                  onClick={() => processPaymentChoice("cod")}
                  className="gap-6 px-12 py-8 text-sm border fw-medium rounded-6"
                >
                  Thanh toán khi nhận hàng
                </button>
                {/* <button disabled={paymentProcessing} onClick={() => processPaymentChoice("cp")} className="gap-6 px-12 py-8 text-sm border fw-medium rounded-6">
                  Thanh toán trực tiếp (cp)
                </button> */}
              </div>
              <div className="text-end">
                <button disabled={paymentProcessing} onClick={closePaymentModal} className="px-12 py-8 text-sm border rounded-6">Hủy</button>
              </div>
            </div>
          </div>
        )}
      </AccountShell>
    </>
  );
}

const STATUS_OPTIONS: { key: FilterStatus; label: string; icon?: string }[] = [
  { key: "pending", label: "Chờ thanh toán", icon: "ph-wallet" },
  { key: "processing", label: "Chờ xác nhận", icon: "ph-clock-countdown" },
  { key: "shipping", label: "Đang đóng gói", icon: "ph-package" },
  { key: "delivered", label: "Đang giao hàng", icon: "ph-truck" },
  { key: "completed", label: "Đã giao", icon: "ph-check-fat" },
  { key: "cancelled", label: "Đã hủy", icon: "ph-prohibit" },
];