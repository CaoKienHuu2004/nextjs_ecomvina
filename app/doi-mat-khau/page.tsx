"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import FullHeader from "@/components/FullHeader";
import BenefitsStrip from "@/components/BenefitsStrip";
import Link from "next/link";

export default function ResetPasswordPage() {
  const search = useSearchParams();
  const token = search.get("token") ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setMessage("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/api/v1/mat-khau/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          token,
          password,
          password_confirmation: passwordConfirm,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Đổi mật khẩu thất bại");
      setMessage("Đổi mật khẩu thành công. Đang chuyển hướng đến đăng nhập...");
      setTimeout(() => router.push("/dang-nhap"), 1200);
    } catch (err: any) {
      setMessage(err?.message || "Có lỗi xảy ra");
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
                  
                  {/* Header Form */}
                  <div className="mb-32 text-center">
                    <div className="mb-16 d-inline-flex align-items-center justify-content-center bg-main-50 text-main-600 rounded-circle" style={{ width: 60, height: 60 }}>
                      <i className="text-3xl ph-duotone ph-password"></i>
                    </div>
                    <h4 className="mb-8 text-gray-900 fw-bold">Đặt lại mật khẩu</h4>
                    <p className="text-sm text-gray-600">
                      Vui lòng nhập email xác thực và thiết lập mật khẩu mới cho tài khoản của bạn.
                    </p>
                  </div>

                  {/* Thông báo lỗi/thành công */}
                  {message && (
                    <div className={`mb-24 p-12 rounded-8 text-sm fw-medium flex-align gap-8 ${message.includes("thành công") ? "bg-success-50 text-success-600 border border-success-100" : "bg-danger-50 text-danger-600 border border-danger-100"}`}>
                      <i className={`text-lg ph-bold ${message.includes("thành công") ? "ph-check-circle" : "ph-warning-circle"}`}></i>
                      {message}
                    </div>
                  )}

                  {/* Cảnh báo thiếu Token */}
                  {!token && (
                    <div className="gap-8 p-12 mb-24 text-sm border rounded-8 fw-medium flex-align bg-warning-50 text-warning-600 border-warning-100">
                      <i className="text-lg ph-bold ph-warning"></i>
                      Đường dẫn không hợp lệ hoặc thiếu mã xác thực (token). Vui lòng kiểm tra lại email.
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    {/* Input Email */}
                    <div className="mb-24">
                      <label className="mb-8 text-gray-900 fw-semibold d-block">
                        Email xác thực <span className="text-danger-600">*</span>
                      </label>
                      <div className="position-relative">
                        <input 
                          className="common-input rounded-8 ps-48"
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

                    {/* Input Mật khẩu mới */}
                    <div className="mb-24">
                      <label className="mb-8 text-gray-900 fw-semibold d-block">
                        Mật khẩu mới <span className="text-danger-600">*</span>
                      </label>
                      <div className="position-relative">
                        <input 
                          className="common-input rounded-8 ps-48"
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          type="password" 
                          required 
                          placeholder="Nhập mật khẩu mới"
                        />
                        <span className="text-gray-500 position-absolute top-50 start-0 translate-middle-y ms-16">
                          <i className="text-xl ph ph-lock"></i>
                        </span>
                      </div>
                    </div>

                    {/* Input Nhập lại mật khẩu */}
                    <div className="mb-24">
                      <label className="mb-8 text-gray-900 fw-semibold d-block">
                        Xác nhận mật khẩu <span className="text-danger-600">*</span>
                      </label>
                      <div className="position-relative">
                        <input 
                          className="common-input rounded-8 ps-48"
                          value={passwordConfirm} 
                          onChange={(e) => setPasswordConfirm(e.target.value)} 
                          type="password" 
                          required 
                          placeholder="Nhập lại mật khẩu mới"
                        />
                        <span className="text-gray-500 position-absolute top-50 start-0 translate-middle-y ms-16">
                          <i className="text-xl ph ph-check-circle"></i>
                        </span>
                      </div>
                    </div>

                    <button 
                      className="gap-8 py-12 btn btn-main w-100 rounded-8 fw-bold flex-center" 
                      type="submit" 
                      disabled={loading || !token}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm"></span> Đang xử lý...
                        </>
                      ) : (
                        "Đổi mật khẩu"
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
              </div>
            </div>
          </div>
        </section>
      </div>

      <BenefitsStrip />
    </>
  );
}