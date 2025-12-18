"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import FullHeader from "@/components/FullHeader";
import FullFooter from "@/components/FullFooter";

// Định nghĩa kiểu cho state của form
type FormState = {
    hoten: string;
    email: string;
    sodienthoai: string;
    username: string;
    password: string;
    password_confirmation: string;
};

// Định nghĩa kiểu cho phản hồi từ API
type ApiResponse = {
    success?: boolean;
    message?: string;
    token?: string;
    errors?: Record<string, string[]>;
};

// Định nghĩa kiểu cho thông báo
type MessageState = {
    type: "success" | "error";
    text: string;
};

// Định nghĩa kiểu cho lỗi API
type ApiError = {
    data?: {
        message?: string;
    };
    message?: string;
};

const laLoiApi = (error: unknown): error is ApiError => {
    return typeof error === 'object' && error !== null && ('data' in error || 'message' in error);
};

export default function Page() {
    const [form, setForm] = useState<FormState>({
        hoten: "",
        email: "",
        sodienthoai: "",
        username: "",
        password: "",
        password_confirmation: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<MessageState | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const togglePassword = (field: 'password' | 'confirm') => {
        if (field === 'password') {
            setShowPassword((prev) => !prev);
        } else {
            setShowConfirmPassword((prev) => !prev);
        }
    };

    const validate = (): string | null => {
        if (!form.hoten.trim()) return "Vui lòng nhập họ tên";
        if (!form.username.trim()) return "Vui lòng nhập tên đăng nhập";
        if (!form.email.trim()) return "Vui lòng nhập email";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Email không hợp lệ";
        if (!form.sodienthoai.trim()) return "Vui lòng nhập số điện thoại";
        if (!/^\d{9,12}$/.test(form.sodienthoai)) return "Số điện thoại không hợp lệ";
        if (!form.password) return "Vui lòng nhập mật khẩu";
        if (form.password.length < 6) return "Mật khẩu tối thiểu 6 ký tự";
        if (form.password !== form.password_confirmation) return "Hai mật khẩu không trùng khớp";
        return null;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);
        const err = validate();
        if (err) {
            setMessage({ type: "error", text: err });
            return;
        }
        setLoading(true);
        try {
            const payload = {
                hoten: form.hoten,
                email: form.email,
                username: form.username,
                sodienthoai: form.sodienthoai,
                password: form.password,
                password_confirmation: form.password_confirmation,
            };

            console.debug("REGISTER payload:", payload);

            // Sử dụng fetch trực tiếp giống trang đăng nhập
            const rawResp = await fetch("https://sieuthivina.cloud/api/auth/dang-ky", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const parsed = await rawResp.json().catch(() => ({}));
            console.debug("REGISTER response:", rawResp.status, parsed);

            const resp: ApiResponse = parsed as ApiResponse;

            if (resp.success) {
                setMessage({ type: "success", text: resp.message || "Đăng ký thành công!" });
                setForm({ hoten: "", email: "", sodienthoai: "", username: "", password: "", password_confirmation: "" });
                return;
            }

            if (resp.errors && typeof resp.errors === "object") {
                const firstKey = Object.keys(resp.errors)[0];
                const firstMsg = resp.errors[firstKey]?.[0];
                if (firstMsg) {
                    setMessage({ type: "error", text: firstMsg });
                    return;
                }
            }

            if (!rawResp.ok) {
                setMessage({ type: "error", text: resp.message || `Yêu cầu thất bại (${rawResp.status}).` });
                return;
            }

            setMessage({ type: "error", text: resp.message || "Đăng ký thất bại." });
        } catch (err) {
            console.error("Register error:", err);
            let msg = "Đăng ký thất bại. Vui lòng thử lại.";
            if (laLoiApi(err)) msg = err.data?.message || err.message || msg;
            else if (err instanceof Error) msg = err.message;
            setMessage({ type: "error", text: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* FullHeader - giống trang chủ */}
            <FullHeader showClassicTopBar={true} showTopNav={false} />

            {/* Main Content */}
            <div className="page">
                <section className="account pt-20">
                    <div className="container container-lg">
                        <div className="row gy-4 justify-content-center">
                            {/* Register Card */}
                            <div className="col-xl-5">
                                <div className="border border-gray-100 rounded-16 px-24 py-40">
                                    <h6 className="text-xl mb-32">Đăng ký tài khoản</h6>

                                    {/* Message */}
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
                                        {/* Họ và tên */}
                                        <div className="row">
                                            <div className="col-md-12 mb-24">
                                                <label htmlFor="hoten" className="text-neutral-900 text-md mb-8 fw-medium">
                                                    Họ và tên <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="py-14 px-18 text-sm common-input"
                                                    id="hoten"
                                                    name="hoten"
                                                    placeholder="Nhập họ và tên"
                                                    value={form.hoten}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>

                                        {/* Tên đăng nhập */}
                                        <div className="row">
                                            <div className="col-md-12 mb-24">
                                                <label htmlFor="username" className="text-neutral-900 text-md mb-8 fw-medium">
                                                    Tên đăng nhập <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="py-14 px-18 text-sm common-input"
                                                    id="username"
                                                    name="username"
                                                    placeholder="Nhập tên đăng nhập"
                                                    value={form.username}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>

                                        {/* Email và Số điện thoại */}
                                        <div className="row">
                                            <div className="col-md-6 mb-24">
                                                <label htmlFor="email" className="text-neutral-900 text-md mb-8 fw-medium">
                                                    Email <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    className="py-14 px-18 text-sm common-input"
                                                    id="email"
                                                    name="email"
                                                    placeholder="Nhập email"
                                                    value={form.email}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-24">
                                                <label htmlFor="sodienthoai" className="text-neutral-900 text-md mb-8 fw-medium">
                                                    Số điện thoại <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    className="py-14 px-18 text-sm common-input"
                                                    id="sodienthoai"
                                                    name="sodienthoai"
                                                    placeholder="Nhập số điện thoại"
                                                    value={form.sodienthoai}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>

                                        {/* Mật khẩu */}
                                        <div className="row">
                                            <div className="col-md-6 mb-24">
                                                <label htmlFor="password" className="text-neutral-900 text-md mb-8 fw-medium">
                                                    Mật khẩu <span className="text-danger">*</span>
                                                </label>
                                                <div className="position-relative">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        className="py-14 px-18 text-sm common-input"
                                                        id="password"
                                                        name="password"
                                                        placeholder="Nhập mật khẩu"
                                                        value={form.password}
                                                        onChange={handleChange}
                                                    />
                                                    <span
                                                        className={`toggle-password position-absolute top-50 inset-inline-end-0 me-16 translate-middle-y cursor-pointer ph ${showPassword ? "ph-eye" : "ph-eye-slash"
                                                            }`}
                                                        onClick={() => togglePassword('password')}
                                                    ></span>
                                                </div>
                                            </div>
                                            <div className="col-md-6 mb-24">
                                                <label htmlFor="password_confirmation" className="text-neutral-900 text-md mb-8 fw-medium">
                                                    Xác nhận mật khẩu <span className="text-danger">*</span>
                                                </label>
                                                <div className="position-relative">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        className="py-14 px-18 text-sm common-input"
                                                        id="password_confirmation"
                                                        name="password_confirmation"
                                                        placeholder="Nhập lại mật khẩu"
                                                        value={form.password_confirmation}
                                                        onChange={handleChange}
                                                    />
                                                    <span
                                                        className={`toggle-password position-absolute top-50 inset-inline-end-0 me-16 translate-middle-y cursor-pointer ph ${showConfirmPassword ? "ph-eye" : "ph-eye-slash"
                                                            }`}
                                                        onClick={() => togglePassword('confirm')}
                                                    ></span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chính sách */}
                                        <div className="mt-20">
                                            <p className="text-gray-500">
                                                Dữ liệu cá nhân của bạn sẽ được lưu trữ bảo mật, khi bạn nhấn vào <strong>Đăng ký</strong> cũng như đồng ý với các nội dung điều khoản và{" "}
                                                <Link href="/chinh-sach-nguoi-dung" className="text-main-600 text-decoration-underline">
                                                    chính sách bảo mật
                                                </Link>{" "}
                                                từ nền tảng.
                                            </p>
                                        </div>

                                        {/* Nút đăng ký */}
                                        <div className="mt-20">
                                            <div className="d-flex gap-3">
                                                <button type="submit" className="btn btn-main py-14 px-40" disabled={loading}>
                                                    {loading ? "Đang xử lý..." : "Đăng ký"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Link đăng nhập */}
                                        <div className="mt-20">
                                            <div className="d-flex gap-3">
                                                <span className="text-gray-900 text-sm fw-normal">
                                                    Bạn đã là thành viên ?{" "}
                                                    <Link href="/dang-nhap" className="text-main-600 hover-text-decoration-underline text-sm fw-semibold">
                                                        Đăng nhập ngay
                                                    </Link>
                                                </span>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <FullFooter />
        </>
    );
}