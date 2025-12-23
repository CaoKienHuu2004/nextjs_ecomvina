"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import FullHeader from "@/components/FullHeader";
import FullFooter from "@/components/FullFooter";
import { useAuth } from "@/hooks/useAuth";
// QUAN TRỌNG: Phải có dòng import này thì mới dùng được useGoogleLogin
import { useGoogleLogin } from "@react-oauth/google"; 

// --- TYPE DEFINITIONS (Giữ lại các type cũ của bạn) ---
type LoginForm = {
    username: string;
    password: string;
    remember: boolean;
};

type MessageState = {
    type: "success" | "error";
    text: string;
};

export default function LoginPage() {
    const [form, setForm] = useState<LoginForm>({ username: "", password: "", remember: false });
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<MessageState | null>(null);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    
    const router = useRouter();
    // Lấy hàm loginGoogle từ useAuth mới
    const { login, loginWithGoogle } = useAuth(); 

    // --- HANDLERS ---
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    };

    const togglePassword = () => setShowPassword((prev) => !prev);

    // --- 1. XỬ LÝ GOOGLE LOGIN (MỚI) ---
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setMessage(null);
            try {
                // Gửi token sang Backend để xác thực
                await loginWithGoogle(tokenResponse.access_token);
                
                setMessage({ type: "success", text: "Đăng nhập Google thành công!" });
                
                // Chuyển hướng
                setTimeout(() => {
                    router.push("/");
                    router.refresh();
                }, 500);
            } catch (err: any) {
                console.error("Google Login Error:", err);
                setMessage({ 
                    type: "error", 
                    text: err.message || "Lỗi xác thực với Google." 
                });
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            setMessage({ type: "error", text: "Đăng nhập Google thất bại (Cửa sổ bị đóng)." });
        }
    });

    // --- 2. XỬ LÝ ĐĂNG NHẬP THƯỜNG ---
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        try {
            await login({ phonemail: form.username, password: form.password });
            
            if (form.remember) {
                Cookies.set("remember_login", "true", { expires: 30 });
            }

            setMessage({ type: "success", text: "Đăng nhập thành công!" });
            
            setTimeout(() => {
                router.push("/");
                router.refresh();
            }, 500);

        } catch (err: any) {
            // Xử lý lỗi (giữ logic hiển thị lỗi của bạn)
            const errorMsg = err.message || "Tài khoản hoặc mật khẩu không chính xác.";
            setMessage({ type: "error", text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <FullHeader showClassicTopBar={true} showTopNav={false} />
            <div className="page">
                <section className="pt-20 account">
                    <div className="container container-lg">
                        <div className="row gy-4 justify-content-center">
                            <div className="col-xl-5">
                                <div className="px-24 py-40 border border-gray-100 shadow-sm rounded-16 h-100">
                                    <h6 className="mb-32 text-xl text-center fw-bold">Đăng nhập tài khoản</h6>

                                    {/* Alert Message */}
                                    {message && (
                                        <div className={`mb-24 p-12 rounded-8 text-sm fw-medium text-center ${message.type === "success" ? "bg-success-50 text-success-700 border border-success-100" : "bg-danger-50 text-danger-700 border border-danger-100"}`}>
                                            {message.text}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-24">
                                            <label className="mb-8 text-gray-900 text-md fw-semibold">Tên đăng nhập</label>
                                            <input 
                                                type="text" 
                                                className="common-input rounded-8" 
                                                name="username" 
                                                value={form.username} 
                                                onChange={handleChange} 
                                                required 
                                                placeholder="Email hoặc số điện thoại" 
                                            />
                                        </div>
                                        <div className="mb-24">
                                            <label className="mb-8 text-gray-900 text-md fw-semibold">Mật khẩu</label>
                                            <div className="position-relative">
                                                <input 
                                                    type={showPassword ? "text" : "password"} 
                                                    className="common-input rounded-8" 
                                                    name="password" 
                                                    value={form.password} 
                                                    onChange={handleChange} 
                                                    required 
                                                    placeholder="Nhập mật khẩu" 
                                                />
                                                <span 
                                                    className={`position-absolute top-50 end-0 me-16 translate-middle-y cursor-pointer text-gray-500 text-xl ph ${showPassword ? "ph-eye" : "ph-eye-slash"}`} 
                                                    onClick={togglePassword}
                                                ></span>
                                            </div>
                                        </div>

                                        <div className="mt-20 mb-24 flex-align flex-between">
                                            <div className="form-check common-check">
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    name="remember" 
                                                    id="remember" 
                                                    checked={form.remember} 
                                                    onChange={handleChange} 
                                                />
                                                <label className="gap-2 text-gray-900 form-check-label flex-align" htmlFor="remember">
                                                    Ghi nhớ đăng nhập
                                                </label>
                                            </div>
                                            <Link href="/quen-mat-khau" className="text-sm text-main-600 fw-semibold hover-text-decoration-underline">
                                                Quên mật khẩu?
                                            </Link>
                                        </div>

                                        <button 
                                            type="submit" 
                                            className="btn btn-main py-14 w-100 rounded-8 fw-bold" 
                                            disabled={loading}
                                        >
                                            {loading ? "Đang xử lý..." : "Đăng nhập"}
                                        </button>
                                    </form>

                                    {/* --- PHẦN LOGIN GOOGLE --- */}
                                    <div className="my-32 position-relative">
                                        <div className="border-gray-100 border-bottom"></div>
                                        <span className="px-16 text-sm text-gray-500 bg-white position-absolute top-50 start-50 translate-middle">
                                            Hoặc
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleGoogleLogin()}
                                        disabled={loading}
                                        className="gap-12 border border-gray-200 w-100 d-flex align-items-center justify-content-center btn hover-border-main-600 hover-text-main-600 py-14 rounded-8 transition-2"
                                    >
                                        <img 
                                            src="https://www.svgrepo.com/show/475656/google-color.svg" 
                                            alt="Google" 
                                            width={24} 
                                            height={24} 
                                        />
                                        <span className="text-gray-900 fw-semibold">Đăng nhập bằng Google</span>
                                    </button>
                                    
                                    <div className="mt-32 text-center text-gray-900">
                                        Bạn chưa có tài khoản?{" "}
                                        <Link href="/dang-ky" className="text-main-600 fw-bold hover-text-decoration-underline">
                                            Đăng ký ngay
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            <FullFooter />
        </>
    );
}