"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { api, getTokenFromResponse, type LoginResponse } from "../../lib/api";
import { useRouter } from "next/navigation";
import AuthFooter from "@/components/AuthFooter";
import FullHeader from "@/components/FullHeader";

export default function Page() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    if (!form.identifier.trim()) return "Vui lòng nhập Email/SĐT/Tên đăng nhập";
    if (!form.password) return "Vui lòng nhập mật khẩu";
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    const error = validate();
    if (error) return setMessage({ type: "error", text: error });
    try {
      setLoading(true);
      // Xóa token cũ trước khi đăng nhập để tránh hiểu nhầm trạng thái
      try { localStorage.removeItem("access_token"); } catch { }

      const resp = await api.post<LoginResponse>("/api/auth/dang-nhap", {
        identifier: form.identifier,
        password: form.password,
      }, { credentials: 'include' });
      const token = getTokenFromResponse(resp);
      if (!token) {
        setMessage({ type: "error", text: "Thông tin đăng nhập không hợp lệ." });
        return;
      }
      try { localStorage.setItem("access_token", token); } catch { }
      setMessage({ type: "success", text: "Đăng nhập thành công!" });
      router.push("/");
    } catch (err: unknown) {
      const e = err as { data?: any; message?: string };
      const msg = e?.data?.message || e?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="d-flex flex-column min-vh-100">
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      {/* Hero nền cam */}
      <section
        className="py-40 flex-grow-1"
        style={{ background: "#FF4500", paddingBottom: 120 }}
      >
        <div className="container container-lg">
          <div className="row flex-align" style={{ marginTop: 56 }}>
            {/* Banner trái */}
            <div className="col-lg-7 d-lg-block d-none">
              <div
                className="overflow-hidden position-relative w-100 rounded-10"
                style={{ height: 420 }}
              >
                <Image
                  src="/assets/images/logo/mau-banner-quang-cao-khuyen-mai.jpg"
                  alt="Promo"
                  fill
                  sizes="(max-width: 1200px) 50vw, 700px"
                  className="object-fit-cover"
                  priority
                />
              </div>
            </div>

            {/* Card đăng nhập */}
            <div className="col-lg-5 col-12">
              <div
                className="p-24 bg-white border rounded-10"
                style={{ maxWidth: 420, marginLeft: "auto", borderColor: "#e5e5e5", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
              >
                <div className="mb-8 d-flex flex-between flex-align">
                  <h5 className="mb-0 text-heading fw-semibold">Đăng nhập</h5>
                  <button type="button" className="gap-6 bg-white border btn btn-sm rounded-6 d-flex flex-align" style={{ borderColor: "#ffd1c4", color: "#ee4d2d" }}>
                    <span className="text-sm">Đăng nhập với mã QR</span>
                    <i className="ph ph-qr-code"></i>
                  </button>
                </div>

                {message && (
                  <div
                    className={`mb-16 p-12 rounded-8 ${message.type === "success"
                        ? "bg-success-50 text-success-700 border border-success-100"
                        : "bg-danger-50 text-danger-700 border border-danger-100"
                      }`}
                  >
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-12">
                    <input
                      id="identifier"
                      name="identifier"
                      value={form.identifier}
                      onChange={handleChange}
                      className="px-16 bg-white border shadow-none form-control rounded-6"
                      placeholder="Email/Số điện thoại/Tên đăng nhập"
                      type="text"
                      style={{ height: 46, borderColor: "#e5e5e5", fontSize: 14 }}
                    />
                  </div>
                  <div className="mb-12">
                    <div className="position-relative">
                      <input
                        id="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className="px-16 bg-white border shadow-none form-control rounded-6 pe-40"
                        placeholder="Mật khẩu"
                        type="password"
                        style={{ height: 46, borderColor: "#e5e5e5", fontSize: 14 }}
                      />
                      <i className="ph ph-eye-slash position-absolute" style={{ right: 12, top: 12, color: "#bbb" }}></i>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="py-12 text-white btn w-100 rounded-8 text-uppercase fw-semibold"
                    style={{ background: "#ee4d2d", letterSpacing: 0.5 }}
                  >
                    {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP"}
                  </button>

                  <div className="mt-10 d-flex justify-content-end">
                    <a href="#" className="text-sm" style={{ color: "#ee4d2d" }}>Quên mật khẩu</a>
                  </div>

                  {/* divider */}
                  <div className="gap-12 my-16 d-flex flex-align justify-content-center">
                    <span className="border-bottom" style={{ width: "30%", borderBottomColor: "#efefef", borderBottomWidth: 1, display: "inline-block" }}></span>
                    <span className="text-gray-500" style={{ fontSize: 12, letterSpacing: 1 }}>HOẶC</span>
                    <span className="border-bottom" style={{ width: "30%", borderBottomColor: "#efefef", borderBottomWidth: 1, display: "inline-block" }}></span>
                  </div>

                  {/* Social buttons */}
                  <div className="gap-12 d-flex">
                    <button type="button" className="gap-8 py-12 bg-white border btn rounded-8 w-50 d-flex align-items-center justify-content-center hover-bg-neutral-50 social-btn" style={{ borderColor: "#e5e5e5", color: "#222", fontSize: 15, minWidth: 180 }}>
                      <span className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 24, height: 24, background: "#1877F2" }}>
                        <i className="text-white ph-fill ph-facebook-logo"></i>
                      </span>
                      <strong>Facebook</strong>
                    </button>
                    <button type="button" className="gap-8 py-12 bg-white border btn rounded-8 w-50 d-flex align-items-center justify-content-center hover-bg-neutral-50 social-btn" style={{ borderColor: "#e5e5e5", color: "#222", fontSize: 15, minWidth: 180 }}>
                      <span className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 24, height: 24, background: "#EA4335" }}>
                        <i className="text-white ph ph-google-logo"></i>
                      </span>
                      <strong>Google</strong>
                    </button>
                  </div>

                  {/* Switch to đăng ký */}
                  <div className="mt-16 text-center">
                    <span className="text-sm" style={{ color: "#bdbdbd" }}>Bạn mới đến với Siêu Thị Vina? </span>
                    <Link className="text-sm fw-semibold" href="/dangky" style={{ color: "#ee4d2d" }}>Đăng ký</Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthFooter />

      <style jsx global>{`
        :root, html, body { background: #fff !important; }
        .bg-overlay::before { display: none !important; }
        .gradient-shadow::before, .gradient-shadow::after { display: none !important; }
      `}</style>
      <style jsx>{`
        .social-btn strong {
          display: inline-block !important;
          margin-left: 8px !important;
          color: #111 !important;
          font-weight: 800 !important;
          font-size: 16px !important;
          letter-spacing: .2px;
        }
      `}</style>
    </main>
  );
}

