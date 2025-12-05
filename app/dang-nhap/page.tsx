"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import FullHeader from "@/components/FullHeader";
import { useAuth } from "@/hooks/useAuth";

// Định nghĩa kiểu cho phản hồi (response) từ API Laravel
type LoginForm = {
    username: string;
    password: string;
    remember: boolean;
};

type ApiResponse = {
    success?: boolean;
    message?: string;
    token?: string;
    errors?: Record<string, string[]>;
    data?: unknown;
};

type ApiError = {
    errors?: Record<string, string[]>;
    message?: string;
    data?: unknown;
};

type MessageState = {
    type: "success" | "error";
    text: string;
};

const isApiError = (err: unknown): err is ApiError =>
    typeof err === "object" && err !== null && ("errors" in err || "message" in err);

export default function Page() {
    const [form, setForm] = useState<LoginForm>({ username: "", password: "", remember: false });
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<MessageState | null>(null);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    };

    const togglePassword = () => {
        setShowPassword((prev) => !prev);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setMessage(null);

        const formEl = e.currentTarget as HTMLFormElement;
        const fd = new FormData(formEl);
        const username = String(fd.get("username") ?? "").trim();
        const password = String(fd.get("password") ?? "");

        if (!username) {
            setMessage({ type: "error", text: "Vui lòng nhập Tên đăng nhập" });
            return;
        }
        if (!password) {
            setMessage({ type: "error", text: "Vui lòng nhập mật khẩu" });
            return;
        }

        setLoading(true);
        try {
            try { localStorage.removeItem("access_token"); } catch { }

            await login({ username, password });

            if (form.remember) {
                const token = Cookies.get("access_token");
                if (token) {
                    Cookies.set("access_token", token, { expires: 1, path: "/" });
                }
            }

            setMessage({ type: "success", text: "Đăng nhập thành công!" });
            router.push("/");
        } catch (err: unknown) {
            console.error("Login error:", err);
            let msg = "Đăng nhập thất bại. Vui lòng thử lại.";
            if (isApiError(err)) {
                msg = err.message ?? msg;
            } else if (err instanceof Error) {
                msg = err.message;
            }
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
                <section className="pt-20 account">
                    <div className="container container-lg">
                        <div className="row gy-4 justify-content-center">
                            {/* Login Card */}
                            <div className="col-xl-5">
                                <div className="px-24 py-40 border border-gray-100 rounded-16 h-100">
                                    <h6 className="mb-32 text-xl">Đăng nhập</h6>

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
                                        <div className="mb-24">
                                            <label htmlFor="username" className="mb-8 text-lg text-neutral-900 fw-medium">
                                                Tên đăng nhập <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="text-md common-input"
                                                id="username"
                                                name="username"
                                                placeholder="Nhập tên đăng nhập"
                                                value={form.username}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="mb-24">
                                            <label htmlFor="password" className="mb-8 text-lg text-neutral-900 fw-medium">
                                                Mật khẩu <span className="text-danger">*</span>
                                            </label>
                                            <div className="position-relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className="text-md common-input"
                                                    id="password"
                                                    name="password"
                                                    placeholder="Nhập mật khẩu"
                                                    value={form.password}
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <span
                                                    className={`toggle-password position-absolute top-50 inset-inline-end-0 me-16 translate-middle-y cursor-pointer ph ${showPassword ? "ph-eye" : "ph-eye-slash"
                                                        }`}
                                                    onClick={togglePassword}
                                                ></span>
                                            </div>
                                        </div>

                                        <div className="mt-20 mb-24">
                                            <div className="flex-wrap gap-48 flex-align">
                                                <button type="submit" className="px-40 btn btn-main py-18" disabled={loading}>
                                                    {loading ? "Đang xử lý..." : "Đăng nhập"}
                                                </button>
                                                <div className="form-check common-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="remember"
                                                        name="remember"
                                                        checked={form.remember}
                                                        onChange={handleChange}
                                                    />
                                                    <label className="form-check-label flex-grow-1" htmlFor="remember">
                                                        Ghi nhớ đăng nhập
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="gap-24 mt-20 flex-align flex-between">
                                            <Link href="/quen-mat-khau" className="p-0 m-0 text-sm text-danger-600 fw-semibold hover-text-decoration-underline">
                                                Quên mật khẩu ?
                                            </Link>
                                            <span className="text-sm text-gray-900 fw-normal">
                                                Bạn chưa có tài khoản ?{" "}
                                                <Link href="/dang-ky" className="text-sm text-main-600 hover-text-decoration-underline fw-semibold">
                                                    Đăng ký ngay
                                                </Link>
                                            </span>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <footer className="overflow-hidden footer pt-30 border-top fix-scale-20">
                <div className="container container-lg">
                    <div className="flex-wrap footer-item-two-wrapper d-flex align-items-start">
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
                            <div className="gap-16 mb-16 flex-align">
                                <span className="flex-shrink-0 w-32 h-32 border border-gray-100 flex-center rounded-circle text-main-two-600 text-md">
                                    <i className="ph-fill ph-phone-call"></i>
                                </span>
                                <a href="tel:+886911975996" className="text-gray-900 text-md hover-text-main-600">
                                    +886 0911 975 996
                                </a>
                            </div>
                            <div className="gap-16 mb-16 flex-align">
                                <span className="flex-shrink-0 w-32 h-32 border border-gray-100 flex-center rounded-circle text-main-two-600 text-md">
                                    <i className="ph-fill ph-envelope"></i>
                                </span>
                                <a href="mailto:hotro@sieuthivina.com" className="text-gray-900 text-md hover-text-main-600">
                                    hotro@sieuthivina.com
                                </a>
                            </div>
                            <div className="gap-16 mb-16 flex-align">
                                <span className="flex-shrink-0 w-32 h-32 border border-gray-100 flex-center rounded-circle text-main-two-600 text-md">
                                    <i className="ph-fill ph-map-pin"></i>
                                </span>
                                <span className="text-gray-900 text-md">801/2A Phạm Thế Hiển, Phường 4, Quận 8, TP.HCM</span>
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
                            <ul className="gap-16 flex-align">
                                <li>
                                    <a
                                        href="https://www.facebook.com/sieuthivina"
                                        className="text-xl w-44 h-44 flex-center bg-main-two-50 text-main-two-600 rounded-8 hover-bg-main-two-600 hover-text-white"
                                    >
                                        <i className="ph-fill ph-facebook-logo"></i>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.twitter.com"
                                        className="text-xl w-44 h-44 flex-center bg-main-two-50 text-main-two-600 rounded-8 hover-bg-main-two-600 hover-text-white"
                                    >
                                        <i className="ph-fill ph-twitter-logo"></i>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.instagram.com"
                                        className="text-xl w-44 h-44 flex-center bg-main-two-50 text-main-two-600 rounded-8 hover-bg-main-two-600 hover-text-white"
                                    >
                                        <i className="ph-fill ph-instagram-logo"></i>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.linkedin.com"
                                        className="text-xl w-44 h-44 flex-center bg-main-two-50 text-main-two-600 rounded-8 hover-bg-main-two-600 hover-text-white"
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
            <div className="py-8 bottom-footer bg-color-three">
                <div className="container container-lg">
                    <div className="flex-wrap gap-16 py-16 bottom-footer__inner flex-between">
                        <p className="bottom-footer__text wow fadeInLeftBig">Bản quyền thuộc về Sieuthivina.com</p>
                        <div className="flex-wrap gap-8 flex-align wow fadeInRightBig">
                            <span className="text-sm text-heading">Hỗ trợ thanh toán</span>
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