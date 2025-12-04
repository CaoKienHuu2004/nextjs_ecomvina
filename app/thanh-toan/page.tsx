"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import FullHeader from "@/components/FullHeader";
import BenefitsStrip from "@/components/BenefitsStrip";
import { useAuth } from "@/hooks/useAuth";
import { useCart, Gia } from "@/hooks/useCart";
import LoadingRedirect from "@/components/LoadingRedirect";
import Cookies from "js-cookie";

type Address = {
  id?: number | string;
  ten_nguoinhan?: string;
  sodienthoai?: string;
  diachi?: string;
  tinhthanh?: string;
  trangthai?: string;
  [key: string]: unknown;
};
type UserWithAddress = {
  hoten?: string;
  diachi?: Address[];
  [key: string]: unknown;
};
// --- Helper Price ---
type PriceInput = number | Gia | undefined | null;
const getDefaultAddress = (user: UserWithAddress | null) => {
  if (!user?.diachi || user.diachi.length === 0) return null;
  return user.diachi.find((d) => d.trangthai === "Mặc định") || user.diachi[0];
};
const getPrice = (gia: PriceInput): number => {
  if (typeof gia === "number") return gia;
  return Number(gia?.current ?? 0);
};

export default function ThanhToanPage() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { items, subtotal, total, discountAmount, clearCart } = useCart();
  
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod"); // 1: COD, 3: QR
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  

  // 1. Load địa chỉ mặc định khi user load xong
  useEffect(() => {
    if (user) {
        const def = getDefaultAddress(user);
        setSelectedAddress(def);
    }
  }, [user]);

  // Redirect nếu chưa login hoặc giỏ hàng trống
  useEffect(() => {
    if (!isLoggedIn && typeof window !== 'undefined') {
        // router.push("/dang-nhap?redirect=/thanh-toan");
    }
    if (items.length === 0 && typeof window !== 'undefined') {
        // router.push("/gio-hang");
    }
  }, [isLoggedIn, items, router]);

  // Tách sản phẩm chính và quà tặng (để render giống UI mẫu)
  const mainItems = items.filter(it => getPrice(it.product?.gia) > 0);
  const giftItems = items.filter(it => getPrice(it.product?.gia) === 0);

  // Xử lý đặt hàng
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddress) {
        alert("Vui lòng chọn địa chỉ nhận hàng.");
        return;
    }

    setIsSubmitting(true);
    try {
        const API = process.env.NEXT_PUBLIC_SERVER_API || "http://148.230.100.215";
        const token = Cookies.get("access_token");

        const payload = {
            id_diachigiaohang: selectedAddress.id,
            ma_phuongthuc: paymentMethod, // 1 hoặc 3
            //{
            // "ma_phuongthuc": "cod",
            // "ma_magiamgia": null
            // }
            
        };

        const res = await fetch(`${API}/api/toi/donhangs`, { 
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const json = await res.json();
            const orderId = json.data?.id || json.id;

            // COD
            if (paymentMethod === "cod") {
                clearCart();
                router.push(`/hoan-tat-thanh-toan?order_id=${orderId}`);
                return;
            }

            // VNPay / QR
            if (paymentMethod === "dbt") {
                const resPay = await fetch(`${API}/api/toi/donhangs/${orderId}/payment-url`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                const payJson = await resPay.json();

                if (payJson.status && payJson.payment_url) {
                    clearCart();

                    // Hiện animation loading
                    setRedirecting(true);

                    // Delay 500ms cho UI kịp hiển thị
                    setTimeout(() => {
                        window.location.href = payJson.payment_url;
                    }, 500);

                    return;
                } else {
                    alert(payJson.message || "Không tạo được liên kết VNPay");
                }
            }
            if (paymentMethod === "cp") {
                const resPay = await fetch(`${API}/api/toi/donhangs/${orderId}/payment-url`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ provider: "cp" }) // hoặc server chấp nhận khác
                });

                const payJson = await resPay.json();
                if (payJson.status && payJson.payment_url) {
                    clearCart();
                    setRedirecting(true);
                    setTimeout(() => { window.location.href = payJson.payment_url; }, 500);
                    return;
                } else {
                    alert(payJson.message || "Không tạo được liên kết VietQR");
                }
            }
        } else {
            alert("Đặt hàng thất bại. Vui lòng thử lại.");
        }
    } catch (error) {
        console.error(error);
        alert("Lỗi kết nối.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (redirecting) {
    return <LoadingRedirect message="Đang chuyển sang VNPay..." />;
    }

  // Render 1 dòng sản phẩm trong bảng tóm tắt
  const renderSummaryRow = (item: typeof items[0], isGift = false) => {
    const sp = item.product || {};
    const price = getPrice(sp.gia);
    const totalRow = price * item.quantity;
    const img = sp.mediaurl || "/assets/images/thumbs/placeholder.png";
    const name = sp.ten || sp.name || "Sản phẩm";

    return (
        <tr key={item.id_giohang}>
            <td className="px-5 py-10 rounded-4">
                {isGift && (
                     <span className="mb-10 text-sm flex-align fw-medium">
                        <i className="text-lg ph-bold ph-gift text-main-600 pe-4"></i>Quà tặng nhận được
                     </span>
                )}
                <div className="gap-12 d-flex align-items-center">
                    <div className="border border-gray-100 rounded-8 flex-center" style={{maxWidth: 80, maxHeight: 80, width: "100%", height: "100%"}}>
                        <Image src={img} alt={name} width={80} height={80} className="w-100 rounded-8 object-fit-contain" />
                    </div>
                    <div className="table-product__content text-start">
                        <h6 className="mb-0 text-sm title fw-semibold">
                            <span className="link text-line-2" title={name}>{name}</span>
                        </h6>
                        <div className="gap-16 mb-6 flex-align">
                            <span className="gap-8 px-6 py-4 text-xs btn bg-gray-50 text-heading rounded-8 flex-center fw-medium">
                                {sp.category || "Sản phẩm"}
                            </span>
                        </div>
                        <div className="mb-6 product-card__price">
                            <div className="gap-12 flex-align">
                                <span className="px-6 py-4 text-xs bg-gray-100 text-heading fw-medium rounded-4">x {item.quantity}</span>
                                <span className="text-sm text-main-600 fw-bold">{totalRow.toLocaleString("vi-VN")} ₫</span>
                            </div>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    );
  };

  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      <section className="py-20 cart bg-white-50">
        <div className="container container-lg">
          <form onSubmit={handlePlaceOrder} className="row gy-4">
            
            {/* LEFT: Thông tin giao hàng + Sản phẩm */}
            <div className="col-xl-7 col-lg-8">
                
                {/* 1. ĐỊA CHỈ NHẬN HÀNG */}
                <div className="px-20 py-20 pb-20 bg-white border border-gray-100 shadow-sm cart-sidebar rounded-8">
                    <div className="gap-8 mb-20 flex-align flex-between">
                        <h6 className="gap-4 m-0 text-lg flex-align">
                            <i className="text-xl ph-bold ph-map-pin-area text-main-600"></i>Người nhận hàng
                        </h6>
                        <button 
                            type="button"
                            onClick={() => setShowAddressModal(true)}
                            className="gap-1 p-0 text-xs bg-transparent border-0 text-primary-700 flex-align fw-normal" 
                        >
                            <i className="ph-bold ph-pencil-simple"></i> Thay đổi
                        </button>
                    </div>

                    {selectedAddress ? (
                        <>
                            <div className="flex-wrap flex-align">
                                <span className="text-gray-600 border-gray-600 text-md fw-semibold border-end me-8 pe-10">
                                    {selectedAddress.ten_nguoinhan || user?.hoten}
                                </span>
                                <span className="text-gray-600 text-md fw-medium">
                                    {selectedAddress.sodienthoai}
                                </span>
                            </div>
                            <div className="flex-wrap gap-4 mt-10 flex-align">
                                <span className="text-sm text-gray-600 fw-normal">
                                    {selectedAddress.trangthai === "Mặc định" && (
                                        <span className="px-6 text-xs text-white fw-semibold rounded-4 bg-success-400 me-2">Mặc định</span>
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
                        <div className="px-8 py-4 mt-20 border border-warning-400 bg-warning-100 rounded-4 text-warning-900">
                            <span className="gap-8 text-sm fw-medium flex-align">
                                <i className="text-2xl ph-bold ph-warning-circle"></i> Vui lòng chọn địa chỉ để tiếp tục.
                            </span>
                        </div>
                    )}
                </div>

                {/* 2. TÓM TẮT ĐƠN HÀNG */}
                <div className="pb-0 mt-20 bg-white border border-gray-100 shadow-sm cart-table rounded-8 p-30">
                    <div className="overflow-x-auto scroll-sm scroll-sm-horizontal">
                        <table className="table mb-20 style-three">
                            <thead>
                                <tr className="py-10 my-10">
                                    <th className="gap-24 p-0 pb-10 mb-0 text-lg h6 fw-bold flex-align" colSpan={2}>
                                        <div>
                                            <i className="text-lg ph-bold ph-shopping-cart text-main-600 pe-6"></i>
                                            Tóm tắt đơn hàng ( {items.length} sản phẩm )
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {mainItems.map(item => renderSummaryRow(item, false))}
                                {giftItems.map(item => renderSummaryRow(item, true))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. PHƯƠNG THỨC THANH TOÁN */}
                <div className="px-20 py-20 pb-20 mt-20 bg-white border border-gray-100 shadow-sm cart-sidebar rounded-8">
                    <h6 className="mb-20 flex-between flex-align">
                        <span className="gap-8 text-lg flex-align">
                            <i className="text-xl ph-bold ph-wallet text-main-600"></i>Phương thức thanh toán
                        </span>
                    </h6>
                    
                    <label 
                        className={`w-100 mt-10 border ${paymentMethod === "cod" ? "border-main-600 bg-main-50" : "border-gray-100"} hover-border-main-600 py-16 px-12 rounded-4 transition-1 cursor-pointer`}
                        onClick={() => setPaymentMethod("cod")}
                    >
                        <div className="mb-0 form-check common-check common-radio">
                            <input className="form-check-input" type="radio" name="payment" checked={paymentMethod === "cod"} readOnly />
                            <label className="text-sm form-check-label fw-medium text-neutral-600 w-100">
                                Thanh toán khi nhận hàng (COD)
                            </label>
                        </div>
                    </label>

                    <label 
                        className={`w-100 mt-10 border ${paymentMethod === "dbt" ? "border-main-600 bg-main-50" : "border-gray-100"} hover-border-main-600 py-16 px-12 rounded-4 transition-1 cursor-pointer`}
                        onClick={() => setPaymentMethod("dbt")}
                    >
                        <div className="mb-0 form-check common-check common-radio">
                            <input className="form-check-input" type="radio" name="payment" checked={paymentMethod === "dbt"} readOnly />
                            <label className="text-sm form-check-label fw-medium text-neutral-600 w-100">
                                Thanh toán qua QR Code (VNPAY)
                            </label>
                        </div>
                    </label>
                    <label 
                        className={`w-100 mt-10 border ${paymentMethod === "cp" ? "border-main-600 bg-main-50" : "border-gray-100"} hover-border-main-600 py-16 px-12 rounded-4 transition-1 cursor-pointer`}
                        onClick={() => setPaymentMethod("cp")}
                    >
                        <div className="mb-0 form-check common-check common-radio">
                            <input className="form-check-input" type="radio" name="payment" checked={paymentMethod === "cp"} readOnly />
                            <label className="text-sm form-check-label fw-medium text-neutral-600 w-100">
                                Thanh toán qua VietQR (QR Code)
                            </label>
                        </div>
                    </label>
                </div>
            </div>

            {/* RIGHT: Sidebar Tổng tiền */}
            <div className="col-xl-5 col-lg-4">
                 {/* Voucher (Read-only hoặc Link về giỏ hàng) */}
                 <div className="px-20 py-20 pb-20 mb-20 bg-white border border-gray-100 shadow-sm cart-sidebar rounded-8">
                    <h6 className="mb-20 flex-between flex-align">
                        <span className="gap-8 text-lg flex-align">
                            <i className="text-xl ph-bold ph-ticket text-main-600"></i>Áp dụng Voucher
                        </span>
                        <Link href="/gio-hang" className="gap-1 text-xs text-primary-700 flex-align fw-normal">
                            <i className="ph-bold ph-pencil-simple"></i> Thay đổi
                        </Link>
                    </h6>
                    <div className="gap-8 px-12 py-10 mt-10 flex-align flex-center rounded-4 bg-gray-50">
                        <span className="text-sm text-gray-900">
                            {discountAmount > 0 ? `Đã giảm ${discountAmount.toLocaleString()}đ` : "Không có áp dụng Voucher !"}
                        </span>
                    </div>
                 </div>

                 {/* Tổng tiền & Nút Đặt hàng */}
                 <div className="px-20 py-20 bg-white border border-gray-100 shadow-sm cart-sidebar rounded-8">
                    <div className="mb-20">
                        <h6 className="gap-4 mb-6 text-lg flex-align">
                            <i className="text-xl ph-bold ph-notepad text-main-600"></i>Đơn hàng
                        </h6>
                        <span className="gap-1 text-sm text-gray-600 flex-align fw-medium">
                            {mainItems.length} sản phẩm {giftItems.length > 0 && `+ ${giftItems.length} quà tặng`}
                        </span>
                    </div>

                    <div className="gap-8 mb-20 flex-between">
                        <span className="text-gray-900 font-heading-two">Tổng tiền hàng:</span>
                        <span className="text-gray-900 fw-semibold">{subtotal.toLocaleString("vi-VN")} ₫</span>
                    </div>
                    
                    {/* Phí ship (Mock tạm = 0 hoặc tính toán sau) */}
                    <div className="gap-8 mb-20 flex-between">
                        <span className="text-gray-900 font-heading-two d-flex flex-column">
                            <span>Phí vận chuyển:</span>
                            {/* <span className="text-xs">- Nội tỉnh (TP.HCM)</span> */}
                        </span>
                        <span className="text-gray-900 fw-semibold">0 ₫</span>
                    </div>

                    <div className="pt-24 my-20 border-gray-100 border-top">
                        <div className="gap-8 flex-between">
                            <span className="text-lg text-gray-900 fw-semibold">Tổng thanh toán:</span>
                            <span className="text-lg text-main-600 fw-semibold">{total.toLocaleString("vi-VN")} ₫</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="gap-8 text-end">
                                <span className="text-sm text-success-600 fw-normal">Tiết kiệm: </span>
                                <span className="text-sm text-success-600 fw-normal">{discountAmount.toLocaleString("vi-VN")} ₫</span>
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-main py-14 w-100 rounded-8"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
                    </button>
                 </div>

                 <span className="mt-20 text-center w-100 d-block">
                    <Link href="/gio-hang" className="text-sm text-main-600 fw-medium flex-align d-flex flex-center transition-1 link">
                        <i className="ph-bold ph-arrow-fat-lines-left text-main-600 text-md pe-10"></i> <span>Quay lại giỏ hàng</span>
                    </Link>
                </span>
            </div>

          </form>
        </div>
      </section>

      {/* MODAL CHỌN ĐỊA CHỈ */}
      {showAddressModal && (
        <div className="modal" style={{display: 'block', background: 'rgba(0,0,0,0.5)'}}>
            <div className="container modal-content container-lg" style={{maxWidth: 600}}>
                <div className="mb-20 flex-align flex-between">
                    <span className="pb-10 text-lg text-gray-900 fw-semibold">Chọn địa chỉ giao hàng</span>
                    <button onClick={() => setShowAddressModal(false)} className="pb-10 text-2xl text-gray-900 bg-transparent border-0" style={{cursor: 'pointer'}}>&times;</button>
                </div>
                <div className="overflow-y-auto row gy-4 max-h-400">
                    {user?.diachi?.map((addr: Address) => (
                <div key={addr.id} className="col-12" onClick={() => { setSelectedAddress(addr); setShowAddressModal(false); }}>
                    <div className={`border rounded-8 p-16 cursor-pointer hover-bg-gray-50 ${selectedAddress?.id === addr.id ? 'border-main-600 bg-main-50' : 'border-gray-200'}`}>
                        <div className="gap-12 mb-2 flex-align">
                            <span className="text-gray-900 border-gray-600 fw-semibold text-md border-end pe-10">
                                {addr.ten_nguoinhan || user.hoten}
                            </span>
                            <span className="text-gray-900 fw-semibold text-md">
                                {addr.sodienthoai}
                            </span>
                            {addr.trangthai === "Mặc định" && <span className="px-6 text-xs text-white rounded bg-success-500">Mặc định</span>}
                        </div>
                        <p className="m-0 text-sm text-gray-600">{addr.diachi}, {addr.tinhthanh}</p>
                    </div>
                </div>
            ))}
                    <div className="mt-3 text-center col-12">
                         <Link href="/dia-chi" className="px-24 btn btn-outline-main rounded-pill">+ Thêm địa chỉ mới</Link>
                    </div>
                </div>
            </div>
        </div>
      )}

      <BenefitsStrip />
      
      {/* Styles Modal (Giữ nguyên hoặc đưa vào CSS global) */}
      <style jsx>{`
        .modal { position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; }
        .modal-content { background-color: #fefefe; margin: 50px auto; padding: 20px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
      `}</style>
    </>
  );
}