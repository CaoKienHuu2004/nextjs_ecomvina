"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import FullHeader from "@/components/FullHeader";
import FullFooter from "@/components/FullFooter";
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
            <FullFooter />
        </>
    );
}