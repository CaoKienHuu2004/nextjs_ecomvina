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
  const { items, gifts, subtotal, total, discountAmount, clearCart, loading, appliedVoucher, removeVoucher, summary } = useCart();

  const shippingFee = Number(summary?.shipping_fee ?? 0); // nếu backend trả phí vận chuyển, đặt tên trường tương ứng
  const displaySubtotal = Number(summary?.tamtinh ?? subtotal);
  const displayVoucherDiscount = Number(summary?.giamgia_voucher ?? 0);
  const displayTietKiem = Number(summary?.tietkiem ?? 0);
  const displayTotal = Number(summary?.tonggiatri ?? total) + shippingFee;

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

  const rawMain = items;
  const rawGifts = gifts;

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

      // CASE 2: COD -> Trang Hoàn tất
      const orderId = json.data?.id || json.order_id || json.id; 
      router.push(`/hoan-tat-thanh-toan?order_id=${orderId}`);

    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối hoặc hệ thống. Vui lòng thử lại sau.");
      setIsSubmitting(false);
    }
  };

  // --- RENDER ---

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

      <div className="page">
        <section className="py-20 cart">
          <div className="container container-lg">
            <form onSubmit={handlePlaceOrder} className="row gy-4">
              <div className="col-xl-7 col-lg-8">
                <div className="px-20 py-20 pb-20 border border-gray-100 cart-sidebar rounded-8">
                  <div className="gap-8 mb-20 flex-align flex-between">
                    <h6 className="gap-4 m-0 text-lg flex-align">
                      <i className="text-xl ph-bold ph-map-pin-area text-main-600"></i>Người nhận hàng
                    </h6>
                    <span
                      id="openModalBtn"
                      style={{ cursor: "pointer" }}
                      className="gap-1 text-xs text-primary-700 flex-align fw-normal"
                      onClick={() => setShowAddressModal(true)}
                    >
                      <i className="ph-bold ph-pencil-simple"></i> Thay đổi
                    </span>
                  </div>

                  <div className="flex-wrap flex-align">
                    <span className="text-gray-600 border-gray-600 text-md fw-semibold border-end me-8 pe-10">
                      {selectedAddress?.hoten || "Bạn chưa chọn địa chỉ"}
                    </span>
                    <span className="text-gray-600 text-md fw-medium">
                      {selectedAddress?.sodienthoai || ""}
                    </span>
                  </div>

                  <div className="flex-wrap gap-4 mt-10 flex-align">
                    {selectedAddress?.trangthai === "Mặc định" && (
                      <span className="py-1 text-xs text-white fw-semibold rounded-4 bg-main-two-600 px-7">Mặc định</span>
                    )}
                    <span className="text-sm text-gray-600 fw-normal">
                      {selectedAddress ? `${selectedAddress.diachi}, ${selectedAddress.tinhthanh}` : "Bạn chưa có địa chỉ nhận hàng."}
                    </span>
                  </div>

                  <input type="hidden" name="id_diachinguoidung" value={String(selectedAddress?.id ?? "")} />

                  {!selectedAddress && (
                    <div className="px-8 py-4 mt-20 border border-warning-400 bg-warning-100 rounded-4 text-warning-900">
                      <span className="gap-8 text-sm fw-medium flex-align"><i className="text-2xl ph-bold ph-warning-circle"></i> Vui lòng chọn địa chỉ để tiếp tục.</span>
                    </div>
                  )}
                </div>

                <div className="pb-0 mt-20 border border-gray-100 cart-table rounded-8 p-30">
                  <div className="overflow-x-auto scroll-sm scroll-sm-horizontal">
                    <table className="table mb-20 style-three">
                      <thead>
                        <tr className="py-10 my-10 ">
                          <th className="gap-24 p-0 pb-10 mb-0 text-lg h6 fw-bold flex-align" colSpan={2}>
                            <div>
                              <i className="text-lg ph-bold ph-shopping-cart text-main-600 pe-6"></i>
                              Tóm tắt đơn hàng ({items.length} sản phẩm)
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {mainItems.map((item, i) => renderSummaryRow(item, false, i))}
                        {giftItems.length > 0 && giftItems.map((item, i) => renderSummaryRow(item, true, i))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="px-20 py-20 pb-20 mt-20 border border-gray-100 cart-sidebar rounded-8">
                  <h6 className="mb-20 flex-between flex-align">
                    <span className="gap-8 text-lg flex-align">
                      <i className="text-xl ph-bold ph-wallet text-main-600"></i>Phương thức thanh toán
                    </span>
                  </h6>

                  <label className={`w-100 mt-10 border py-16 px-12 rounded-4 transition-1 ${paymentMethod === "1" ? "border-main-600 bg-main-50" : "border-gray-100"}`} style={{ cursor: "pointer" }}>
                    <div className="">
                      <div className="mb-0 form-check common-check common-radio">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="id_phuongthuc"
                          id="phuongthuc1"
                          value="1"
                          checked={paymentMethod === "1"}
                          onChange={() => setPaymentMethod("1")}
                        />
                        <label className="text-sm form-check-label fw-medium text-neutral-600 w-100" htmlFor="phuongthuc1">Thanh toán khi nhận hàng (COD)</label>
                      </div>
                    </div>
                  </label>

                  <label className={`w-100 mt-10 border py-16 px-12 rounded-4 transition-1 ${paymentMethod === "3" ? "border-main-600 bg-main-50" : "border-gray-100"}`} style={{ cursor: "pointer" }}>
                    <div className="">
                      <div className="mb-0 form-check common-check common-radio">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="id_phuongthuc"
                          id="phuongthuc3"
                          value="3"
                          checked={paymentMethod === "3"}
                          onChange={() => setPaymentMethod("3")}
                        />
                        <label className="text-sm form-check-label fw-medium text-neutral-600 w-100" htmlFor="phuongthuc3">Thanh toán qua QR Code</label>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="col-xl-5 col-lg-4">
                <div className="px-20 py-20 pb-20 border border-gray-100 cart-sidebar rounded-8">
                  <h6 className="mb-20 flex-between flex-align">
                    <span className="gap-8 text-lg flex-align">
                      <i className="text-xl ph-bold ph-ticket text-main-600"></i>Áp dụng Voucher
                    </span>
                    <Link href="/gio-hang" className="gap-1 text-xs text-primary-700 flex-align fw-normal">
                      <i className="ph-bold ph-pencil-simple"></i> Thay đổi
                    </Link>
                  </h6>

                  <div className="gap-8 px-12 py-10 mt-10 border-gray-200 border-dashed flex-align flex-between rounded-4">
                    {appliedVoucher ? (
                      <>
                        <span className="gap-8 text-sm text-gray-900 flex-align fw-medium pe-10">
                          <i className="text-2xl ph-bold ph-ticket text-main-600"></i>
                          <div className="text-sm d-flex flex-column">
                            <span className="text-sm text-gray-900 w-100">
                              Giảm {Number(appliedVoucher.giatri).toLocaleString()} ₫
                            </span>
                            <span className="text-xs text-gray-500 w-100">
                              {appliedVoucher.code}
                            </span>
                          </div>
                        </span>

                        <span className="gap-8 text-xs text-gray-900 flex-align fw-medium">
                          <button
                            className="p-6 text-xs text-white border btn bg-main-two-600 hover-bg-white hover-border-main-two-600 hover-text-main-two-600 rounded-4"
                            style={{ cursor: "pointer" }}
                            disabled
                          >
                            Đã chọn
                          </button>
                        </span>
                      </>
                    ) : (
                      <div className="gap-8 px-0 py-0 mt-0 flex-align flex-center rounded-4 w-100">
                        <div className="text-sm text-gray-900">Không có áp dụng Voucher !</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-20 py-20 mt-20 border border-gray-100 cart-sidebar rounded-8">
                  <div className="mb-20">
                    <h6 className="gap-4 mb-6 text-lg flex-align"><i className="text-xl ph-bold ph-notepad text-main-600"></i>Đơn hàng</h6>
                    <div className="text-sm text-gray-600"> {items.length} sản phẩm {giftItems.length > 0 && `+ ${giftItems.length} quà tặng`}</div>
                  </div>

                  <div className="gap-8 mb-20 flex-between">
                    <span className="text-gray-900 font-heading-two">Tổng tiền hàng:</span>
                    <span className="text-gray-900 fw-semibold">{displaySubtotal.toLocaleString()} ₫</span>
                  </div>

                  <div className="gap-8 mb-20 flex-between">
                    <span className="text-gray-900 font-heading-two d-flex flex-column">
                      <span>Phí vận chuyển:</span>
                      <span className="text-xs">{shippingFee > 0 ? "- Ngoại tỉnh (các vùng lân cận)" : "Miễn phí"}</span>
                    </span>
                    <span className="text-gray-900 fw-semibold">{shippingFee.toLocaleString()} ₫</span>
                  </div>

                  {displayVoucherDiscount > 0 && (
                    <div className="gap-8 mb-8 flex-between">
                      <span className="text-gray-900 font-heading-two">Giảm giá:</span>
                      <span className="text-benefit fw-semibold">- {displayVoucherDiscount.toLocaleString()} ₫</span>
                    </div>
                  )}

                  <div className="pt-24 my-20 border-gray-100 border-top">
                    <div className="gap-8 flex-between">
                      <span className="text-lg text-gray-900 fw-semibold">Tổng thanh toán:</span>
                      <span className="text-lg text-main-600 fw-semibold">{displayTotal.toLocaleString()} ₫</span>
                    </div>
                    <div className="gap-8 mt-8 text-end">
                      <span className="text-benefit fw-normal">Tiết kiệm:</span>
                      <span className="text-benefit fw-normal"> {displayTietKiem.toLocaleString()} ₫</span>
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="btn btn-main py-14 w-100 rounded-8">
                    {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
                  </button>
                </div>
                <span className="mt-20 w-100 d-block">
                  <Link href="/gio-hang" className="text-sm text-main-two-600 fw-medium flex-align d-flex flex-center transition-1">
                    <i className="ph-bold ph-arrow-fat-lines-left text-main-two-600 text-md pe-10"></i> <span>Quay lại giỏ hàng</span>
                  </Link>
                </span>
              </div>
            </form>
          </div>
        </section>

        {/* Modal: Thay đổi địa chỉ (JSX controlled bằng state) */}
        <div
          id="deliveryAddressModal"
          className={`modal ${showAddressModal ? "d-block" : ""}`}
          style={{ display: showAddressModal ? "block" : "none", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddressModal(false); }}
        >
          <div className="container modal-content container-lg">
            <div className="flex-align flex-between">
              <span className="pb-10 text-lg text-gray-900 fw-semibold">Thay đổi địa chỉ giao hàng</span>
              <button className="pb-10 text-2xl text-gray-900 rounded-circle 0 fw-semibold close-btn" style={{ cursor: "pointer", border: 0, background: "transparent" }} onClick={() => setShowAddressModal(false)}>&times;</button>
            </div>

            <div className="row gy-4">
              {user?.danh_sach_diachi?.map((addr) => (
                <div className="col-lg-6 col-xl-6" key={addr.id}>
                  <div
                    className={`border-dashed border-2 text-main-900 rounded-8 px-10 py-8 mb-10 ${selectedAddress?.id === addr.id ? "bg-main-50 border-main-600" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => { setSelectedAddress(addr); setShowAddressModal(false); }}
                  >
                    <div className="gap-24 d-flex flex-align flex-between">
                      <div className="gap-12 flex-align">
                        <span className="text-gray-900 border-gray-600 fw-semibold text-md border-end pe-10">{addr.ten_nguoinhan}</span>
                        <span className="text-gray-900 fw-semibold text-md">{addr.sodienthoai}</span>
                      </div>
                      {addr.trangthai === "Mặc định" && <span className="px-6 py-2 text-xs fw-medium text-main-two-700 bg-main-two-100 rounded-4">Mặc định</span>}
                    </div>
                    <div className="gap-24 pt-10 d-flex flex-align">
                      <div className="gap-12 flex-align">
                        <span className="text-sm text-gray-900 fw-medium">Địa chỉ: {addr.diachi}, {addr.tinhthanh}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <BenefitsStrip />
    </>
  );
}