"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Cookies from "js-cookie";
import FullHeader from "@/components/FullHeader";
import BenefitsStrip from "@/components/BenefitsStrip";

export default function HoanTatThanhToanPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State quản lý trạng thái xác thực
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState("Đang xác thực giao dịch với VNPAY...");
  const [orderId, setOrderId] = useState<string | null>(null);

  // Ref để đảm bảo API chỉ được gọi 1 lần (React 18 Strict Mode hay gọi 2 lần)
  const hasVerified = useRef(false);
  
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";

  useEffect(() => {
    // Nếu đã verify rồi thì không chạy lại
    if (hasVerified.current) return;
    
    const verifyTransaction = async () => {
      // 1. Lấy thông tin từ URL
      const vnpSecureHash = searchParams.get("vnp_SecureHash");
      const vnpResponseCode = searchParams.get("vnp_ResponseCode");
      // Lấy Order ID từ vnp_TxnRef (hoặc order_id nếu là COD)
      const txnRef = searchParams.get("vnp_TxnRef") || searchParams.get("order_id");
      
      setOrderId(txnRef);

      // --- TRƯỜNG HỢP A: THANH TOÁN VNPAY (Có SecureHash) ---
      if (vnpSecureHash) {
        hasVerified.current = true; // Đánh dấu đang xử lý

        try {
          // Lấy toàn bộ query string (vnp_Amount=...&vnp_BankCode=...)
          const queryString = searchParams.toString();
          
          console.log("Đang gửi verify về server:", queryString);

          // GỌI API BACKEND ĐỂ CHECK HASH
          // Backend sẽ dùng SecretKey để tính lại Hash và so sánh
          const res = await fetch(`${API}/api/v1/thanh-toan/vnpay-return?${queryString}`, {
            method: "GET",
            headers: {
              "Accept": "application/json",
              // Nếu API yêu cầu đăng nhập thì gửi token, nhưng thường return url là public
              // "Authorization": `Bearer ${Cookies.get("access_token")}` 
            }
          });

          const data = await res.json().catch(() => ({}));

          // Kiểm tra kết quả từ Backend
          // Backend trả về { status: 200, RspCode: '00', ... } nếu thành công
          if (res.ok && (data.RspCode === '00' || data.status === 200 || data.code === '00')) {
            setStatus('success');
            setMessage("Giao dịch thành công! Đơn hàng đã được thanh toán.");
          } else {
            setStatus('failed');
            // Hiển thị lỗi từ Backend hoặc từ VNPAY (ví dụ: Giao dịch bị hủy)
            setMessage(data.message || getVnpayErrorMessage(vnpResponseCode));
          }

        } catch (error) {
          console.error("Lỗi kết nối:", error);
          setStatus('failed');
          setMessage("Lỗi kết nối đến hệ thống. Vui lòng liên hệ CSKH.");
        }
      } 
      
      // --- TRƯỜNG HỢP B: THANH TOÁN COD (Không có Hash, chỉ có order_id) ---
      else if (txnRef) {
        hasVerified.current = true;
        setStatus('success');
        setMessage("Đặt hàng thành công! (Thanh toán khi nhận hàng)");
      }
      
      // --- TRƯỜNG HỢP C: KHÔNG CÓ THÔNG TIN ---
      else {
        setStatus('failed');
        setMessage("Không tìm thấy thông tin đơn hàng.");
        hasVerified.current = true;
      }
    };

    verifyTransaction();
  }, [searchParams, API]);

  // Helper: Dịch mã lỗi VNPAY sang tiếng Việt dễ hiểu
  const getVnpayErrorMessage = (code: string | null) => {
    switch (code) {
      case "24": return "Giao dịch đã bị hủy bởi khách hàng.";
      case "11": return "Giao dịch thất bại: Hết hạn chờ thanh toán.";
      case "13": return "Giao dịch thất bại: Quý khách đã nhập sai mật khẩu xác thực quá số lần quy định.";
      case "51": return "Giao dịch thất bại: Tài khoản không đủ số dư.";
      case "65": return "Giao dịch thất bại: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.";
      case "75": return "Ngân hàng thanh toán đang bảo trì.";
      default: return "Giao dịch thất bại. Vui lòng thử lại.";
    }
  };

  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      <section className="py-80 bg-gray-50">
        <div className="container container-lg">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="p-40 text-center bg-white shadow-sm rounded-16">
                
                {/* 1. ĐANG XỬ LÝ */}
                {status === 'loading' && (
                  <div className="py-5">
                    <div className="mb-3 spinner-border text-main-600" role="status" style={{width: '3rem', height: '3rem'}}></div>
                    <h5 className="text-gray-600 fw-medium">{message}</h5>
                    <p className="mt-2 text-sm text-gray-400">Vui lòng không tắt trình duyệt...</p>
                  </div>
                )}

                {/* 2. THÀNH CÔNG */}
                {status === 'success' && (
                  <div className="py-4 animation-fade-in">
                    <div className="p-4 mb-4 d-inline-flex bg-success-50 rounded-circle">
                      <i className="text-6xl ph-fill ph-check-circle text-success-600"></i>
                    </div>
                    <h3 className="mb-2 text-gray-900 fw-bold">Thanh toán thành công!</h3>
                    <p className="mb-2 text-gray-600">{message}</p>
                    {orderId && <p className="mb-32 text-sm text-gray-500">Mã đơn hàng: <span className="text-gray-900 fw-bold">#{orderId}</span></p>}
                    
                    <div className="gap-3 d-flex justify-content-center">
                      <Link href="/don-hang" className="px-32 py-12 btn btn-outline-main rounded-pill fw-bold">
                        Xem đơn hàng
                      </Link>
                      <Link href="/shop" className="px-32 py-12 btn btn-main rounded-pill fw-bold">
                        Tiếp tục mua sắm
                      </Link>
                    </div>
                  </div>
                )}

                {/* 3. THẤT BẠI */}
                {status === 'failed' && (
                  <div className="py-4 animation-fade-in">
                    <div className="p-4 mb-4 d-inline-flex bg-danger-50 rounded-circle">
                      <i className="text-6xl ph-fill ph-x-circle text-danger-600"></i>
                    </div>
                    <h3 className="mb-2 text-gray-900 fw-bold">Thanh toán thất bại</h3>
                    <p className="mb-4 text-danger-600 fw-medium">{message}</p>
                    
                    <div className="gap-3 d-flex justify-content-center">
                      <Link href="/thanh-toan" className="px-32 py-12 btn btn-main rounded-pill fw-bold">
                        Thử lại
                      </Link>
                      <Link href="/" className="px-32 py-12 btn btn-outline-gray rounded-pill fw-bold">
                        Về trang chủ
                      </Link>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </section>

      <BenefitsStrip />
    </>
  );
}