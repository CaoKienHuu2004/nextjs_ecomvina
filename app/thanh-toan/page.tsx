"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import FullHeader from "@/components/FullHeader";
import BenefitsStrip from "@/components/BenefitsStrip";
import { useAuth, AuthUser } from "@/hooks/useAuth"; // Import AuthUser để dùng Type chuẩn
import { useCart, Gia } from "@/hooks/useCart";
import LoadingRedirect from "@/components/LoadingRedirect";
import Cookies from "js-cookie";

// ========================================================================
// 1. HELPER FUNCTIONS
// ========================================================================

type PriceInput = number | Gia | undefined | null;

// Lấy địa chỉ mặc định từ User đã được chuẩn hóa trong useAuth
const getDefaultAddress = (user: AuthUser | null) => {
  if (!user || !user.danh_sach_diachi || user.danh_sach_diachi.length === 0) return null;
  // Tìm địa chỉ mặc định, nếu không có lấy cái đầu tiên
  return user.danh_sach_diachi.find((d) => d.trangthai === "Mặc định") || user.danh_sach_diachi[0];
};

const getPrice = (gia: PriceInput): number => {
  if (typeof gia === "number") return gia;
  return Number(gia?.current ?? 0);
};

// ========================================================================
// 2. MAIN COMPONENT
// ========================================================================

export default function ThanhToanPage() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { items, subtotal, total, discountAmount, clearCart, loading, appliedVoucher, removeVoucher } = useCart();

  // State địa chỉ: Dùng Type lấy từ AuthUser["danh_sach_diachi"] cho chuẩn xác
  const [selectedAddress, setSelectedAddress] = useState<NonNullable<AuthUser["danh_sach_diachi"]>[0] | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // "1": COD, "3": VNPay (Theo quy ước DB)
  const [paymentMethod, setPaymentMethod] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // --- EFFECTS ---

  // 1. Tự động chọn địa chỉ mặc định khi load trang
  useEffect(() => {
    if (user) {
      const def = getDefaultAddress(user);
      if (def) setSelectedAddress(def);
    }
  }, [user]);

  // --- LOGIC XỬ LÝ SẢN PHẨM ---

  const isGiftItem = (it: any) => {
    try {
      if (it?.bienthe_quatang) {
        const bt = it.bienthe_quatang;
        if (Number(bt.thanhtien ?? bt.tamtinh ?? NaN) === 0) return true;
      }
      if (Number(it.thanhtien ?? it.tamtinh ?? NaN) === 0 && (it.thanhtien !== undefined || it.tamtinh !== undefined)) return true;
      if (it.is_gift === true) return true;
      if (getPrice(it.product?.gia) === 0) return true;
      return false;
    } catch { return false; }
  };

  const rawMain = items.filter((it) => !isGiftItem(it));
  const rawGifts = items.filter((it) => isGiftItem(it));

  // Gộp item giống nhau
  const groupItems = (arr: any[]) => {
    const map = new Map<string, any>();
    for (const it of arr) {
      const key = String(it.product?.id ?? it.id ?? it.bienthe?.id ?? it.id_bienthe);
      if (map.has(key)) {
        const ex = map.get(key);
        ex.quantity = Number(ex.quantity ?? ex.soluong ?? 0) + Number(it.quantity ?? it.soluong ?? 1);
      } else {
        map.set(key, { ...it, quantity: Number(it.quantity ?? it.soluong ?? 1) });
      }
    }
    return Array.from(map.values());
  };

  const mainItems = groupItems(rawMain);
  const giftItems = groupItems(rawGifts);

  // --- XỬ LÝ ĐẶT HÀNG ---
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập để thanh toán.");
      router.push("/dang-nhap?redirect=/thanh-toan");
      return;
    }

    if (!selectedAddress) {
      alert("Vui lòng chọn địa chỉ nhận hàng.");
      return;
    }

    setIsSubmitting(true);

    try {
      const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";
      const token = Cookies.get("access_token");

      // Payload gửi đi (Gọn gàng nhờ dữ liệu chuẩn)
      const payload = {
        id_diachi: selectedAddress.id,
        // Fallback thông tin text phòng khi server cần lưu cứng text vào đơn hàng
        nguoinhan: selectedAddress.ten_nguoinhan, // Đã chuẩn hóa ở useAuth
        sodienthoai: selectedAddress.sodienthoai, // Đã chuẩn hóa ở useAuth
        diachi_chitiet: `${selectedAddress.diachi}, ${selectedAddress.tinhthanh}`,

        id_phuongthuc: paymentMethod,
        voucher_code: appliedVoucher?.code || null,
        ghi_chu: ""
      };

      // GỌI 1 API DUY NHẤT
      const res = await fetch(`${API}/api/v1/thanh-toan/dat-hang`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.status === false) {
        const msg = json.message;
        const alertMsg = (typeof msg === 'object')
          ? Object.values(msg).flat().join("\n")
          : (msg || "Đặt hàng thất bại. Vui lòng thử lại.");
        alert(alertMsg);
        setIsSubmitting(false);
        return;
      }

      // THÀNH CÔNG -> Xóa giỏ
      clearCart();

      // Lấy link thanh toán (kiểm tra cả ở ngoài và trong biến data)
      const paymentUrl = json.payment_url || json.data?.payment_url;

      // CASE 1: VNPay -> Redirect
      if (paymentUrl) {
        setRedirecting(true);
        // "Chạy" đường dẫn bằng cách gán cho window.location.href
        window.location.href = paymentUrl;
        return;
      }

      // Trường hợp 2: Thanh toán COD (Thành công luôn, không có link)
      const orderId = json.data?.id || json.data?.donhang?.id || json.id || json.order_id || json.data?.madon;
      console.log("Order ID extracted:", orderId, "from json:", json);
      router.push(`/hoan-tat-thanh-toan?order_id=${orderId}`);

    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối hoặc hệ thống. Vui lòng thử lại sau.");
      setIsSubmitting(false);
    }
  };

  if (redirecting) {
    return <LoadingRedirect message="Đang chuyển sang VNPay..." />;
  }

  // Helper render dòng sản phẩm
  const renderSummaryRow = (item: any, isGift = false, idx = 0) => {
    const sp = item.product || item.bienthe?.sanpham || {};
    const price = isGift ? 0 : getPrice(item.product?.gia || item.bienthe?.giadagiam);
    const quantity = Number(item.quantity || item.soluong || 1);
    const totalRow = price * quantity;
    const img = sp.mediaurl || sp.hinhanh || item.hinhanh || "/assets/images/thumbs/placeholder.png";
    const name = sp.ten || sp.name || item.ten_sanpham || "Sản phẩm";
    const category = sp.loaibienthe || item.ten_loaibienthe || "";

    const keyVal = (item.id_giohang ?? item.id ?? item.id_sanpham) ?? `${name}_${idx}`;

    return (
      <tr key={String(keyVal)}>
        <td className="px-5 py-10 rounded-4">
          {isGift && (
            <span className="mb-10 text-sm flex-align fw-medium text-warning-600">
              <i className="text-lg ph-bold ph-gift me-1"></i>Quà tặng nhận được
            </span>
          )}
          <div className="gap-12 d-flex align-items-center">
            <div className="border border-gray-100 rounded-8 flex-center" style={{ width: 64, height: 64, flexShrink: 0 }}>
              <Image
                src={String(img)}
                alt={String(name)}
                width={64}
                height={64}
                className="w-100 h-100 rounded-8 object-fit-contain"
              />
            </div>
            <div className="table-product__content text-start">
              <h6 className="mb-1 text-sm title fw-semibold">
                <span className="text-line-2" title={String(name)}>{String(name)}</span>
              </h6>
              <div className="gap-10 mb-1 flex-align">
                <span className="px-6 py-2 text-xs bg-gray-100 text-heading fw-medium rounded-4">x {quantity}</span>
                {category && (
                  <span className="px-6 py-2 text-xs text-gray-500 bg-gray-50 rounded-4">
                    {category}
                  </span>
                )}
              </div>
              <div className="product-card__price">
                <span className="text-sm text-main-600 fw-bold">{(isGift ? 0 : totalRow).toLocaleString("vi-VN")} ₫</span>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  if (redirecting) {
    return <LoadingRedirect message="Đang chuyển sang cổng thanh toán VNPay..." />;
  }

  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      <section className="py-20 cart bg-white-50">
        <div className="container container-lg">
          <form onSubmit={handlePlaceOrder} className="row gy-4">

            {/* CỘT TRÁI */}
            <div className="col-xl-7 col-lg-8">

              {/* 1. ĐỊA CHỈ NHẬN HÀNG */}
              <div className="px-20 py-20 pb-20 mb-20 bg-white border border-gray-100 shadow-sm cart-sidebar rounded-8">
                <div className="gap-8 mb-3 flex-align flex-between">
                  <h6 className="gap-4 m-0 text-lg flex-align fw-bold">
                    <i className="text-xl ph-bold ph-map-pin-area text-main-600"></i>Người nhận hàng
                  </h6>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="gap-1 p-0 text-xs bg-transparent border-0 text-primary-700 flex-align fw-medium hover-underline"
                    aria-label="Thay đổi địa chỉ giao hàng"
                  >
                    <i className="ph-bold ph-pencil-simple"></i> Thay đổi
                  </button>
                </div>

                {selectedAddress ? (
                  <>
                    <div className="flex-wrap mb-1 flex-align">
                      <span className="text-gray-900 border-gray-400 fw-bold border-end me-2 pe-2">
                        {/* Dùng trường chuẩn hóa từ useAuth, không cần fallback phức tạp */}
                        {selectedAddress.ten_nguoinhan}
                      </span>
                      <span className="text-gray-900 fw-medium">
                        {selectedAddress.sodienthoai}
                      </span>
                    </div>
                    <div className="flex-wrap gap-2 flex-align">
                      <span className="text-sm text-gray-600">
                        {selectedAddress.trangthai === "Mặc định" && (
                          <span className="px-6 py-2 text-xs text-white fw-semibold rounded-4 bg-success-500 me-2">Mặc định</span>
                        )}
                        {selectedAddress.diachi}, {selectedAddress.tinhthanh}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <p className="mb-2 text-sm text-gray-500">Bạn chưa có địa chỉ nhận hàng.</p>
                    <Link href="/dia-chi" className="text-sm text-main-600 fw-medium hover-underline">
                      + Thêm địa chỉ mới
                    </Link>
                  </div>
                )}

                {!selectedAddress && (
                  <div className="px-12 py-8 mt-3 border border-warning-200 bg-warning-50 rounded-4 text-warning-700">
                    <span className="gap-8 text-sm fw-medium flex-align">
                      <i className="text-lg ph-bold ph-warning-circle"></i> Vui lòng chọn địa chỉ để tiếp tục.
                    </span>
                  </div>
                )}
              </div>

              {/* 2. DANH SÁCH SẢN PHẨM */}
              <div className="px-20 py-20 mb-20 bg-white border border-gray-100 shadow-sm rounded-8">
                <h6 className="gap-2 mb-3 text-lg fw-bold flex-align">
                  <i className="text-xl ph-bold ph-shopping-bag text-main-600"></i>
                  Danh sách sản phẩm ({items.length})
                </h6>
                <div className="overflow-y-auto max-h-400 custom-scrollbar">
                  <table className="table mb-0 style-three">
                    <tbody>
                      {mainItems.map((item, i) => renderSummaryRow(item, false, i))}
                      {giftItems.length > 0 && giftItems.map((item, i) => renderSummaryRow(item, true, i))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. PHƯƠNG THỨC THANH TOÁN */}
              <div className="px-20 py-20 bg-white border border-gray-100 shadow-sm rounded-8">
                <h6 className="gap-2 mb-3 text-lg fw-bold flex-align">
                  <i className="text-xl ph-bold ph-wallet text-main-600"></i>
                  Phương thức thanh toán
                </h6>

                <div className="gap-3 d-flex flex-column">
                  {/* COD */}
                  <label
                    className={`w-100 border rounded-8 p-16 cursor-pointer transition-2 ${paymentMethod === "1" ? "border-main-600 bg-main-50" : "border-gray-200"}`}
                    onClick={() => setPaymentMethod("1")}
                  >
                    <div className="gap-3 d-flex align-items-center">
                      <div className="m-0 form-check common-check common-radio">
                        <input className="form-check-input" type="radio" name="payment" checked={paymentMethod === "1"} readOnly />
                      </div>
                      <div className="flex-grow-1">
                        <div className="text-sm text-gray-900 fw-bold">Thanh toán khi nhận hàng (COD)</div>
                        <div className="mt-1 text-xs text-gray-500">Thanh toán bằng tiền mặt khi shipper giao hàng đến.</div>
                      </div>
                      <i className="text-3xl text-gray-400 ph-fill ph-money" />
                    </div>
                  </label>

                  {/* VNPAY */}
                  <label
                    className={`w-100 border rounded-8 p-16 cursor-pointer transition-2 ${paymentMethod === "3" ? "border-main-600 bg-main-50" : "border-gray-200"}`}
                    onClick={() => setPaymentMethod("3")}
                  >
                    <div className="gap-3 d-flex align-items-center">
                      <div className="m-0 form-check common-check common-radio">
                        <input className="form-check-input" type="radio" name="payment" checked={paymentMethod === "3"} readOnly />
                      </div>
                      <div className="flex-grow-1">
                        <div className="text-sm text-gray-900 fw-bold">Thanh toán qua VNPAY</div>
                        <div className="mt-1 text-xs text-gray-500">Quét mã QR hoặc thẻ ATM/Visa nội địa.</div>
                      </div>
                      <i className="text-3xl text-blue-600 ph-fill ph-qr-code" />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI */}
            <div className="col-xl-5 col-lg-4">

              {/* Voucher Widget */}
              <div className="px-20 py-20 mb-20 bg-white border border-gray-100 shadow-sm rounded-8">
                <div className="mb-3 flex-between">
                  <h6 className="gap-2 text-md fw-bold flex-align">
                    <i className="ph-bold ph-ticket text-main-600"></i> Voucher
                  </h6>
                  <Link href="/gio-hang" className="text-xs text-primary-600 hover-underline">Chọn mã khác</Link>
                </div>

                <div className="p-12 border border-gray-100 border-dashed bg-gray-50 rounded-8">
                  {appliedVoucher ? (
                    <div className="flex-between align-items-center">
                      <div className="gap-2 d-flex align-items-center">
                        <i className="text-xl ph-fill ph-ticket text-main-600"></i>
                        <div>
                          <div className="text-sm text-gray-900 fw-bold">{appliedVoucher.code}</div>
                          <div className="text-xs text-success-600">
                            Giảm {Number(appliedVoucher.giatri).toLocaleString()}đ
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeVoucher}
                        className="text-xs text-danger-500 hover-text-danger-700 fw-medium"
                        aria-label="Bỏ chọn voucher"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-center text-gray-500">
                      Chưa áp dụng mã giảm giá nào.
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary Widget */}
              <div className="px-20 py-20 bg-white border border-gray-100 shadow-sm rounded-8 sticky-top" style={{ top: 100 }}>
                <h6 className="gap-2 mb-3 text-lg fw-bold flex-align">
                  <i className="ph-bold ph-receipt text-main-600"></i> Chi tiết thanh toán
                </h6>

                <div className="mb-2 text-sm d-flex justify-content-between">
                  <span className="text-gray-600">Tổng tiền hàng</span>
                  <span className="fw-medium">{subtotal.toLocaleString()} ₫</span>
                </div>

                {discountAmount > 0 && (
                  <div className="mb-2 text-sm d-flex justify-content-between text-success-600">
                    <span>Giảm giá Voucher</span>
                    <span>- {discountAmount.toLocaleString()} ₫</span>
                  </div>
                )}

                <div className="mb-2 text-sm d-flex justify-content-between">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  <span className="fw-medium">0 ₫</span>
                </div>

                <div className="pt-16 mt-16 border-gray-100 border-top">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-gray-900 text-md fw-bold">Tổng thanh toán</span>
                    <span className="text-xl fw-bold text-main-600">{total.toLocaleString()} ₫</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 text-end">(Đã bao gồm VAT)</div>
                </div>

                <button
                  type="submit"
                  className="mt-20 btn btn-main w-100 py-14 rounded-8 fw-bold shadow-main"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="gap-2 d-flex align-items-center justify-content-center">
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Đang xử lý...
                    </span>
                  ) : (
                    `Đặt hàng (${total.toLocaleString()} ₫)`
                  )}
                </button>

                <div className="mt-3 text-center">
                  <Link href="/gio-hang" className="gap-1 text-sm text-gray-500 hover-text-main-600 flex-center">
                    <i className="ph-bold ph-arrow-left"></i> Quay lại giỏ hàng
                  </Link>
                </div>
              </div>
            </div>

          </form>
        </div>
      </section>

      {/* MODAL CHỌN ĐỊA CHỈ */}
      {showAddressModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: 600 }}>
            <div className="border-0 shadow-lg modal-content rounded-12">
              <div className="pb-0 modal-header border-bottom-0">
                <h5 className="modal-title fw-bold">Chọn địa chỉ giao hàng</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddressModal(false)} aria-label="Đóng"></button>
              </div>
              <div className="modal-body">
                <div className="gap-3 d-flex flex-column">
                  {user?.danh_sach_diachi?.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-16 border rounded-8 cursor-pointer transition-2 ${selectedAddress?.id === addr.id ? 'border-main-600 bg-main-50 shadow-sm' : 'border-gray-200 hover-border-main-200'}`}
                      onClick={() => { setSelectedAddress(addr); setShowAddressModal(false); }}
                    >
                      <div className="mb-1 d-flex justify-content-between align-items-start">
                        <div className="text-gray-900 fw-bold">{addr.ten_nguoinhan} <span className="text-gray-400 fw-normal">|</span> {addr.sodienthoai}</div>
                        {addr.trangthai === "Mặc định" && <span className="badge bg-main-100 text-main-600 rounded-pill">Mặc định</span>}
                      </div>
                      <div className="text-sm text-gray-600">{addr.diachi}, {addr.tinhthanh}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-0 modal-footer border-top-0 justify-content-center">
                <Link href="/dia-chi" className="px-4 py-2 text-sm btn btn-outline-main rounded-pill fw-bold">
                  <i className="ph-bold ph-plus me-1"></i> Thêm địa chỉ mới
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <BenefitsStrip />
    </>
  );
}