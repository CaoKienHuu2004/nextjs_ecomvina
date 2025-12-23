"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import FullHeader from "@/components/FullHeader";
import BenefitsStrip from "@/components/BenefitsStrip";

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
    <div className="container py-20">
      <h6>Đặt lại mật khẩu</h6>
      {!token && <div className="mb-12 text-danger">Thiếu token, vui lòng dùng link trong email.</div>}
      <form onSubmit={handleSubmit}>
        <label className="mb-8 d-block">
          Email liên kết
          <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label className="mb-8 d-block">
          Mật khẩu mới
          <input className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <label className="mb-8 d-block">
          Nhập lại mật khẩu
          <input className="form-control" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} type="password" required />
        </label>
        <button className="btn btn-main" type="submit" disabled={loading || !token}>
          {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
        </button>
      </form>
      {message && <div className="mt-12">{message}</div>}
    </div>
    <BenefitsStrip />
    </>
  );
}