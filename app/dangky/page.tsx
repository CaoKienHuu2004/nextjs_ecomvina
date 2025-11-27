"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "../../lib/api";
import AuthFooter from "@/components/AuthFooter";
import FullHeader from "@/components/FullHeader";

export default function Page() {
    // Đơn giản theo flow giống ảnh: đăng ký bằng số điện thoại
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const validate = () => {
        if (!form.name.trim()) return "Vui lòng nhập họ tên";
        if (!form.email.trim()) return "Vui lòng nhập email";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Email không hợp lệ";
        if (!form.phone.trim()) return "Vui lòng nhập số điện thoại";
        if (!/^\d{9,12}$/.test(form.phone)) return "Số điện thoại không hợp lệ";
        if (!form.password) return "Vui lòng nhập mật khẩu";
        if (form.password.length < 6) return "Mật khẩu tối thiểu 6 ký tự";
        if (form.password !== form.confirmPassword) return "Hai mật khẩu không trùng khớp";
        return null;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);
        const error = validate();
        if (error) {
            setMessage({ type: "error", text: error });
            return;
        }
        try {
            setLoading(true);
            const resp = await api.post<{ message?: string }>("/auth/register", {
                name: form.name,
                email: form.email,
                phone: form.phone,
                password: form.password,
                confirmPassword: form.confirmPassword,
            });
            setMessage({ type: "success", text: resp?.message || "Mã xác minh đã được gửi tới số điện thoại của bạn." });
            setForm({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
        } catch (err: any) {
            console.error("Register error:", err);
            const msg = err?.data?.message || err?.message || "Đăng ký thất bại. Vui lòng thử lại.";
            setMessage({ type: "error", text: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="d-flex flex-column min-vh-100">
            <FullHeader showClassicTopBar={true} showTopNav={false} />
            {/* Hero đỏ theo layout */}
            <section className="py-40 flex-grow-1" style={{
                background: "#FF4500",
                paddingBottom: 120,
            }}>
                <div className="container container-lg">
                    <div className="row flex-align">
                        {/* Banner trái */}
                        <div className="col-lg-7 d-lg-block d-none">
                            <div className="position-relative w-100 rounded-10 overflow-hidden" style={{ height: 420 }}>
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

                        {/* Form card phải */}
                        <div className="col-lg-5 col-12">
                            <div className="bg-white rounded-10 p-24 border" style={{ maxWidth: 420, marginLeft: "auto", borderColor: "#e5e5e5", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                                <h5 className="mb-12 text-heading fw-semibold">Đăng ký</h5>

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
                                            id="name"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            className="form-control bg-white border shadow-none rounded-6 px-16"
                                            placeholder="Họ và tên"
                                            type="text"
                                            style={{ height: 46, borderColor: "#e5e5e5", fontSize: 14 }}
                                        />
                                    </div>

                                    <div className="mb-12">
                                        <input
                                            id="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            className="form-control bg-white border shadow-none rounded-6 px-16"
                                            placeholder="Email"
                                            type="email"
                                            style={{ height: 46, borderColor: "#e5e5e5", fontSize: 14 }}
                                        />
                                    </div>

                                    <div className="mb-12">
                                        <input
                                            id="phone"
                                            name="phone"
                                            value={form.phone}
                                            onChange={handleChange}
                                            className="form-control bg-white border shadow-none rounded-6 px-16"
                                            placeholder="Số điện thoại"
                                            type="tel"
                                            style={{ height: 46, borderColor: "#e5e5e5", fontSize: 14 }}
                                        />
                                    </div>

                                    <div className="mb-12">
                                        <input
                                            id="password"
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            className="form-control bg-white border shadow-none rounded-6 px-16"
                                            placeholder="Mật khẩu"
                                            type="password"
                                            style={{ height: 46, borderColor: "#e5e5e5", fontSize: 14 }}
                                        />
                                    </div>

                                    <div className="mb-12">
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={form.confirmPassword}
                                            onChange={handleChange}
                                            className="form-control bg-white border shadow-none rounded-6 px-16"
                                            placeholder="Nhập lại mật khẩu"
                                            type="password"
                                            style={{ height: 46, borderColor: "#e5e5e5", fontSize: 14 }}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn w-100 rounded-8 py-12 text-white text-uppercase fw-semibold"
                                        style={{ background: "#f86f5c", letterSpacing: "0.5px" }}
                                    >
                                        {loading ? "ĐANG XỬ LÝ..." : "TIẾP THEO"}
                                    </button>

                                    {/* divider */}
                                    <div className="my-16 d-flex flex-align gap-12 justify-content-center">
                                        <span className="border-bottom" style={{ width: "30%", borderBottomColor: "#efefef", borderBottomWidth: 1, display: "inline-block" }}></span>
                                        <span className="text-gray-500" style={{ fontSize: 12, letterSpacing: 1 }}>HOẶC</span>
                                        <span className="border-bottom" style={{ width: "30%", borderBottomColor: "#efefef", borderBottomWidth: 1, display: "inline-block" }}></span>
                                    </div>

                                    {/* Social buttons */}
                                    <div className="d-flex gap-12">
                                        <button type="button" aria-label="Đăng ký bằng Facebook" className="btn bg-white border rounded-8 py-12 w-50 d-flex align-items-center justify-content-center gap-8 hover-bg-neutral-50 social-btn" style={{ borderColor: "#e5e5e5", color: "#222", fontSize: 15, minWidth: 180 }}>
                                            <span className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 24, height: 24, background: "#1877F2" }}>
                                                <i className="ph-fill ph-facebook-logo text-white"></i>
                                            </span>
                                            <strong className="ms-4" style={{ fontWeight: 800, whiteSpace: "nowrap", color: "#222", fontSize: 15, display: "inline-block" }}>Facebook</strong>
                                        </button>
                                        <button type="button" aria-label="Đăng ký bằng Google" className="btn bg-white border rounded-8 py-12 w-50 d-flex align-items-center justify-content-center gap-8 hover-bg-neutral-50 social-btn" style={{ borderColor: "#e5e5e5", color: "#222", fontSize: 15, minWidth: 180 }}>
                                            <span className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 24, height: 24, background: "#EA4335" }}>
                                                <i className="ph ph-google-logo text-white"></i>
                                            </span>
                                            <strong className="ms-4" style={{ fontWeight: 800, whiteSpace: "nowrap", color: "#222", fontSize: 15, display: "inline-block" }}>Google</strong>
                                        </button>
                                    </div>
                                    {/* Terms (center, no checkbox) */}
                                    <p className="text-center mt-16" style={{ color: "#666", fontSize: 12, lineHeight: 1.5 }}>
                                        Bằng việc đăng ký, bạn đã đồng ý với Siêu Thị Vina về
                                        <Link href="/dieukhoan" style={{ color: "#ee4d2d" }}> Điều khoản dịch vụ</Link>
                                        &nbsp;&
                                        <Link href="/chinhsach" style={{ color: "#ee4d2d" }}> Chính sách bảo mật</Link>
                                    </p>
                                </form>

                                <div className="text-center mt-16">
                                    <span className="text-sm" style={{ color: "#bdbdbd" }}>Bạn đã có tài khoản? </span>
                                    <Link className="text-sm fw-semibold" href="/dangnhap" style={{ color: "#ee4d2d" }}>Đăng nhập</Link>
                                </div>
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

