"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FullHeader from "@/components/FullHeader";
import BenefitsStrip from "@/components/BenefitsStrip";


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/api/v1/mat-khau/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Yêu cầu thất bại");
      setMessage("Đã gửi email khôi phục. Kiểm tra hòm thư của bạn.");
      // tuỳ muốn: chuyển hướng sau vài giây
      // setTimeout(() => router.push("/dang-nhap"), 3000);
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
      <h6>Quên mật khẩu</h6>
      <form onSubmit={handleSubmit}>
        <label className="mb-8 d-block">
          Email liên kết tài khoản
          <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <button className="btn btn-main" type="submit" disabled={loading}>
          {loading ? "Đang gửi..." : "Gửi yêu cầu"}
        </button>
      </form>
      {message && <div className="mt-12">{message}</div>}
    </div>
    <BenefitsStrip />
    </>
  );
}