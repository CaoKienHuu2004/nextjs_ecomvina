"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import FullHeader from "@/components/FullHeader";

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
            const rawResp = await fetch("http://148.230.100.215/api/auth/dang-ky", {
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
            <FullHeader showTopNav={true} showCategoriesBar={false} />

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
            <footer className="footer pt-30 overflow-hidden border-top fix-scale-20">
                <div className="container container-lg">
                    <div className="footer-item-two-wrapper d-flex align-items-start flex-wrap">
                        {/* Footer Column 1 */}
                        <div className="footer-item max-w-275" data-aos="fade-up" data-aos-duration="200">
                            <div className="footer-item__logo">
                                <Link href="/">
                                    <Image
                                        src="/assets/images/logo/logo_nguyenban.png"
                                        alt="Siêu Thị Vina"
                                        width={180}
                                        height={60}
                                        style={{ objectFit: "contain" }}
                                    />
                                </Link>
                            </div>
                            <p className="mb-24">
                                Trang thương mại điện tử Siêu Thị Vina cung cấp các sản phẩm đa dạng đến với khách hàng
                            </p>
                            <div className="flex-align gap-16 mb-16">
                                <span className="w-32 h-32 flex-center rounded-circle border border-gray-100 text-main-two-600 text-md flex-shrink-0">
                                    <i className="ph-fill ph-phone-call"></i>
                                </span>
                                <a href="tel:+886911975996" className="text-md text-gray-900 hover-text-main-600">
                                    +886 0911 975 996
                                </a>
                            </div>
                            <div className="flex-align gap-16 mb-16">
                                <span className="w-32 h-32 flex-center rounded-circle border border-gray-100 text-main-two-600 text-md flex-shrink-0">
                                    <i className="ph-fill ph-envelope"></i>
                                </span>
                                <a href="mailto:hotro@sieuthivina.com" className="text-md text-gray-900 hover-text-main-600">
                                    hotro@sieuthivina.com
                                </a>
                            </div>
                            <div className="flex-align gap-16 mb-16">
                                <span className="w-32 h-32 flex-center rounded-circle border border-gray-100 text-main-two-600 text-md flex-shrink-0">
                                    <i className="ph-fill ph-map-pin"></i>
                                </span>
                                <span className="text-md text-gray-900">801/2A Phạm Thế Hiển, Phường 4, Quận 8, TP.HCM</span>
                            </div>
                        </div>

                        {/* Footer Column 2 - Về chúng tôi */}
                        <div className="footer-item" data-aos="fade-up" data-aos-duration="400">
                            <h6 className="footer-item__title">Về chúng tôi</h6>
                            <ul className="footer-menu">
                                <li className="mb-16">
                                    <Link href="/gioi-thieu" className="text-gray-600 hover-text-main-600">
                                        Giới thiệu về Siêu thị Vina
                                    </Link>
                                </li>
                                <li className="mb-16">
                                    <Link href="/lien-he" className="text-gray-600 hover-text-main-600">
                                        Liên hệ hỗ trợ
                                    </Link>
                                </li>
                                <li className="mb-16">
                                    <Link href="/dieu-khoan" className="text-gray-600 hover-text-main-600">
                                        Điều khoản sử dụng
                                    </Link>
                                </li>
                                <li className="mb-16">
                                    <Link href="/chinh-sach-mua-hang" className="text-gray-600 hover-text-main-600">
                                        Chính sách mua hàng
                                    </Link>
                                </li>
                                <li className="mb-16">
                                    <Link href="/chinh-sach-nguoi-dung" className="text-gray-600 hover-text-main-600">
                                        Chính sách người dùng
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Footer Column 3 - Tài khoản */}
                        <div className="footer-item" data-aos="fade-up" data-aos-duration="600">
                            <h6 className="footer-item__title">Tài khoản</h6>
                            <ul className="footer-menu">
                                <li className="mb-16">
                                    <Link href="/thong-tin-ca-nhan" className="text-gray-600 hover-text-main-600">
                                        Truy cập tài khoản
                                    </Link>
                                </li>
                                <li className="mb-16">
                                    <Link href="/lich-su-don-hang" className="text-gray-600 hover-text-main-600">
                                        Lịch sử đơn hàng
                                    </Link>
                                </li>
                                <li className="mb-16">
                                    <Link href="/yeu-thich" className="text-gray-600 hover-text-main-600">
                                        Danh sách yêu thích
                                    </Link>
                                </li>
                                <li className="mb-16">
                                    <Link href="/gio-hang" className="text-gray-600 hover-text-main-600">
                                        Giỏ hàng của bạn
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Footer Column 4 - Thông tin khác */}
                        <div className="footer-item" data-aos="fade-up" data-aos-duration="1000">
                            <h6 className="footer-item__title">Thông tin khác</h6>
                            <ul className="footer-menu">
                                <li className="mb-16">
                                    <Link href="/san-pham" className="text-gray-600 hover-text-main-600">
                                        Danh sách sản phẩm
                                    </Link>
                                </li>
                                <li className="mb-16">
                                    <Link href="/cua-hang" className="text-gray-600 hover-text-main-600">
                                        Các cửa hàng
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Footer Column 5 - Kết nối */}
                        <div className="footer-item" data-aos="fade-up" data-aos-duration="1200">
                            <h6>Kết nối & theo dõi</h6>
                            <p className="mb-16">
                                Truy cập các nền tảng mạng xã hội <br /> của chúng tôi.
                            </p>
                            <ul className="flex-align gap-16">
                                <li>
                                    <a
                                        href="https://www.facebook.com/sieuthivina"
                                        className="w-44 h-44 flex-center bg-main-two-50 text-main-two-600 text-xl rounded-8 hover-bg-main-two-600 hover-text-white"
                                    >
                                        <i className="ph-fill ph-facebook-logo"></i>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.twitter.com"
                                        className="w-44 h-44 flex-center bg-main-two-50 text-main-two-600 text-xl rounded-8 hover-bg-main-two-600 hover-text-white"
                                    >
                                        <i className="ph-fill ph-twitter-logo"></i>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.instagram.com"
                                        className="w-44 h-44 flex-center bg-main-two-50 text-main-two-600 text-xl rounded-8 hover-bg-main-two-600 hover-text-white"
                                    >
                                        <i className="ph-fill ph-instagram-logo"></i>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.linkedin.com"
                                        className="w-44 h-44 flex-center bg-main-two-50 text-main-two-600 text-xl rounded-8 hover-bg-main-two-600 hover-text-white"
                                    >
                                        <i className="ph-fill ph-linkedin-logo"></i>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Bottom Footer */}
            <div className="bottom-footer bg-color-three py-8">
                <div className="container container-lg">
                    <div className="bottom-footer__inner flex-between flex-wrap gap-16 py-16">
                        <p className="bottom-footer__text wow fadeInLeftBig">Bản quyền thuộc về Sieuthivina.com</p>
                        <div className="flex-align gap-8 flex-wrap wow fadeInRightBig">
                            <span className="text-heading text-sm">Hỗ trợ thanh toán</span>
                            <Image
                                src="/assets/images/thumbs/payment-method.png"
                                alt="Payment methods"
                                width={220}
                                height={28}
                                style={{ width: "auto", height: "auto" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}