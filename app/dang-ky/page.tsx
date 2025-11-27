"use client";

import React, { useState, ChangeEvent, FormEvent, } from "react";
import Link from "next/link";
import Image from "next/image";
// Giả định 'api' là một đối tượng fetch đã được cấu hình (ví dụ: từ /lib/api)
import { api } from "../../lib/api";
import AuthFooter from "@/components/AuthFooter";
import FullHeader from "@/components/FullHeader";

// Định nghĩa kiểu (type) cho state của form
// Các trường này khớp với yêu cầu của server Laravel 
type FormState = {
    hoten: string;
    sodienthoai: string;
    username: string;
    password: string;
    password_confirmation: string;
};
// chào bạn 
// Định nghĩa kiểu cho phản hồi (response) từ API
type ApiResponse = {
    success: boolean;
    message?: string;
    token?: string;
    // Thêm các trường lỗi chi tiết nếu có, ví dụ:
    // errors?: Record<string, string[]>; 
};

// Định nghĩa kiểu cho thông báo lỗi
type MessageState = {
    type: "success" | "error";
    text: string;
};

// Định nghĩa kiểu cho lỗi API (để thay thế 'any')
// Đây là cấu trúc lỗi phổ biến khi fetch thất bại
type ApiError = {
    data?: {
        message?: string;
        // errors?: Record<string, string[]>;
    };
    message?: string;
};

/**
 * Hàm type guard để kiểm tra xem một lỗi có phải là ApiError không
 */
const laLoiApi = (error: unknown): error is ApiError => {
    return typeof error === 'object' && error !== null && ('data' in error || 'message' in error);
};


export default function Page() {
    // 1. STATE ĐÃ VIỆT HÓA
    const [form, setForm] = useState<FormState>({
        hoten: "",
        sodienthoai: "",
        username: "",
        password: "",
        password_confirmation: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<MessageState | null>(null);

    // Hàm `handleChange` đã được định kiểu (type) an toàn
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // 2. HÀM VALIDATE ĐÃ VIỆT HÓA
    const validate = (): string | null => {
        if (!form.hoten.trim()) return "Vui lòng nhập họ tên";
        if (!form.sodienthoai.trim()) return "Vui lòng nhập số điện thoại";
        if (!/^\d{9,12}$/.test(form.sodienthoai)) return "Số điện thoại không hợp lệ";
        if (!form.username.trim()) return "Vui lòng nhập tên tài khoản";
        if (!form.password) return "Vui lòng nhập mật khẩu";
        if (form.password.length < 6) return "Mật khẩu tối thiểu 6 ký tự";
        if (form.password !== form.password_confirmation) return "Hai mật khẩu không trùng khớp";
        return null;
    };

    // 3. HÀM SUBMIT ĐÃ VIỆT HÓA VÀ LOẠI BỎ 'ANY'
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
                username: form.username,
                sodienthoai: form.sodienthoai,
                password: form.password,
                password_confirmation: form.password_confirmation,
            };

            console.debug("REGISTER payload:", payload);

            const resp = await api.post<ApiResponse>(
                "http://148.230.100.215/api/auth/dang-ky",
                payload
            );

            if (resp.success) {
                setMessage({ type: "success", text: resp.message || "Đăng Ký Thành Công!" });
                setForm({ hoten: "", sodienthoai: "", username: "", password: "", password_confirmation: "" });
            } else {
                setMessage({ type: "error", text: resp.message || "Đăng ký thất bại." });
            }
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
        <main className="d-flex flex-column min-vh-100">
            <FullHeader showClassicTopBar={true} showTopNav={false} />

            {/* Nội dung chính */}
            <section className="py-40 flex-grow-1" style={{ background: "#FF4500", paddingBottom: 120 }}>
                <div className="container container-lg">
                    <div className="row flex-align">
                        {/* Banner trái */}
                        {/* <div className="col-lg-7 d-lg-block d-none">
                            <div className="overflow-hidden position-relative w-100 rounded-10" style={{ height: 420 }}>
                                <Image
                                    src="/assets/images/logo/mau-banner-quang-cao-khuyen-mai.jpg"
                                    alt="Promo"
                                    fill
                                    sizes="(max-width: 1200px) 50vw, 700px"
                                    className="object-fit-cover"
                                    priority
                                />
                            </div>
                        </div> */}

                        {/* Form card phải */}
                        <div className="col-lg-5 col-12">
                            <div className="p-24 bg-white border rounded-10" style={{ maxWidth: 420, marginLeft: "auto", borderColor: "#e5e5e5", boxShadow: "0 0px 0px rgba(0,0,0,0)" }}>
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
                                    {/* 4. FORM ĐÃ CẬP NHẬT TÊN TRƯỜNG TIẾNG VIỆT */}
                                    <div className="mb-12">
                                        <input
                                            id="hoten"
                                            name="hoten" // Sửa
                                            value={form.hoten} // Sửa
                                            onChange={handleChange}
                                            className="px-16 bg-white border shadow-none form-control rounded-6"
                                            placeholder="Họ và tên"
                                            type="text"
                                            style={{ height: 46, borderColor: "#e5e5e5", fontSize: 14 }}
                                        />
                                    </div>

                                    <div className="mb-12">
                                        <input
                                            id="sodienthoai"
                                            name="sodienthoai" // Sửa
                                            value={form.sodienthoai} // Sửa
                                            onChange={handleChange}
                                            className="px-16 bg-white border shadow-none form-control rounded-6"
                                            placeholder="Số điện thoại"
                                            type="tel"
                                            style={{ height: 46, borderColor: "#e5e5e5", fontSize: 14 }}
                                        />
                                    </div>

                                    {/* Trường Username mới */}
                                    <div className="mb-12">
                                        <input
                                            id="username"
                                            name="username"
                                            value={form.username}
                                            onChange={handleChange}
                                            className="px-16 bg-white border shadow-none form-control rounded-6"
                                            placeholder="Tên tài khoản (username)"
                                            type="text"
                                            style={{ height: 46, borderColor: "#e5e5e5", fontSize: 14 }}
                                        />
                                    </div>

                                    <div className="mb-12">
                                        <input
                                            id="password"
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            className="px-16 bg-white border shadow-none form-control rounded-6"
                                            placeholder="Mật khẩu"
                                            type="password"
                                            style={{ height: 46, borderColor: "#e5e5e5", fontSize: 14 }}
                                        />
                                    </div>

                                    <div className="mb-12">
                                        <input
                                            id="password_confirmation"
                                            name="password_confirmation" // Sửa
                                            value={form.password_confirmation} // Sửa
                                            onChange={handleChange}
                                            className="px-16 bg-white border shadow-none form-control rounded-6"
                                            placeholder="Nhập lại mật khẩu"
                                            type="password"
                                            style={{ height: 46, borderColor: "#e5e5e5", fontSize: 14 }}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="py-12 text-white btn w-100 rounded-8 text-uppercase fw-semibold"
                                        style={{ background: "#f86f5c", letterSpacing: "0.5px" }}
                                    >
                                        {loading ? "ĐANG XỬ LÝ..." : "Đăng Ký"}
                                    </button>

                                    {/* ... Phần còn lại của form (social, links) ... */}
                                </form>

                                <div className="mt-16 text-center">
                                    <span className="text-sm" style={{ color: "#bdbdbd" }}>Bạn đã có tài khoản? </span>
                                    <Link className="text-sm fw-semibold" href="/dang-nhap" style={{ color: "#ee4d2d" }}>Đăng nhập</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <AuthFooter />
        </main>
    );
}