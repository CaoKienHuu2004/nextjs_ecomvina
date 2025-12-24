"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FullHeader from "@/components/FullHeader";
import BenefitsStrip from "@/components/BenefitsStrip";
import Link from "next/link";


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setIsSuccess(false);
    try {
      const res = await fetch(`${API}/api/v1/mat-khau/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Yêu cầu thất bại");
      setMessage("Đã gửi email khôi phục. Kiểm tra hòm thư của bạn.");
      setIsSuccess(true);
      // tuỳ muốn: chuyển hướng sau vài giây
      // setTimeout(() => router.push("/dang-nhap"), 3000);
    } catch (err: any) {
      setMessage(err?.message || "Có lỗi xảy ra");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />
      
      <div className="page-content">
        <section className="account py-80">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-xl-5 col-lg-6 col-md-8">
                
                {/* CARD GIAO DIỆN */}
                <div className="p-32 bg-white border border-gray-100 shadow-sm rounded-16">
                  
                  {/* Header của Form */}
                  <div className="mb-32 text-center">
                    <div className="mb-16 d-inline-flex align-items-center justify-content-center bg-main-50 text-main-600 rounded-circle" style={{ width: 60, height: 60 }}>
                      <i className="text-3xl ph-duotone ph-lock-key"></i>
                    </div>
                    <h4 className="mb-8 text-gray-900 fw-bold">Quên mật khẩu?</h4>
                    <p className="text-sm text-gray-600">
                      Đừng lo lắng! Hãy nhập email của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu.
                    </p>
                  </div>

                  {/* Thông báo (Alert) */}
                  {message && (
                    <div className={`mb-24 p-12 rounded-8 text-sm fw-medium flex-align gap-8 ${isSuccess ? "bg-success-50 text-success-600 border border-success-100" : "bg-danger-50 text-danger-600 border border-danger-100"}`}>
                      <i className={`text-lg ph-bold ${isSuccess ? "ph-check-circle" : "ph-warning-circle"}`}></i>
                      {message}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-24">
                      <label className="mb-8 text-gray-900 fw-semibold d-block">
                        Email liên kết tài khoản <span className="text-danger-600">*</span>
                      </label>
                      <div className="position-relative">
                        <input 
                          className="common-input rounded-8 ps-48" // Dùng class common-input của project
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          type="email" 
                          required 
                          placeholder="nhap-email-cua-ban@gmail.com" 
                        />
                        <span className="text-gray-500 position-absolute top-50 start-0 translate-middle-y ms-16">
                          <i className="text-xl ph ph-envelope"></i>
                        </span>
                      </div>
                    </div>

                    <button 
                      className="gap-8 py-12 btn btn-main w-100 rounded-8 fw-bold flex-center" 
                      type="submit" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm"></span> Đang xử lý...
                        </>
                      ) : (
                        <>Gửi yêu cầu <i className="ph-bold ph-paper-plane-right"></i></>
                      )}
                    </button>
                  </form>

                  {/* Nút quay lại */}
                  <div className="mt-32 text-center">
                    <Link href="/dang-nhap" className="gap-8 text-gray-600 fw-semibold hover-text-main-600 flex-center justify-content-center">
                      <i className="ph-bold ph-caret-left"></i> Quay lại trang đăng nhập
                    </Link>
                  </div>

                </div>
                {/* END CARD */}

              </div>
            </div>
          </div>
        </section>
      </div>

      <BenefitsStrip />
    </>
  );
}