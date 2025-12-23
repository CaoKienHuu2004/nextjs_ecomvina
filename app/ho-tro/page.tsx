"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import FullHeader from "@/components/FullHeader";
import BenefitsStrip from "@/components/BenefitsStrip";
import AccountShell from "@/components/AccountShell";

// 1. Định nghĩa kiểu dữ liệu khớp với bảng `thongbao` trong SQL
interface SupportHistory {
  id: number;
  id_nguoidung: number;
  tieude: string;
  noidung: string;
  duongdan: string;
  loai: string;
  trangthai: "Đã đọc" | "Chưa đọc" | string;
  created_at: string;
  updated_at: string;
}

export default function SupportPage() {
  const [tieude, setTieude] = useState("");
  const [noidung, setNoidung] = useState("");
  
  const [history, setHistory] = useState<SupportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com/api/v1";

  const fetchHistory = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = Cookies.get("access_token");
      const res = await fetch(`${API}/ho-tro`, {
        headers: { 
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
      });
      const j = await res.json();
      if (j.status === 200) {
        // Giả sử API trả về data là mảng các bản ghi từ bảng thongbao
        setHistory(j.data);
      }
    } catch (e) {
      console.error("Fetch history error:", e);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = Cookies.get("access_token");
      const res = await fetch(`${API}/ho-tro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({ tieude, noidung }),
      });

      if (res.ok) {
        alert("Đã gửi yêu cầu hỗ trợ thành công!");
        setTieude("");
        setNoidung("");
        fetchHistory();
      }
    } catch (e) {
      alert("Có lỗi xảy ra khi gửi yêu cầu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      <AccountShell title="Hỗ Trợ" current="support">
        <div className="p-20 border border-gray-100 rounded-8 bg-white">
          <h6 className="mb-20 text-gray-900 flex-align gap-8">
            <i className="ph-bold ph-chats text-main-600"></i> Gửi yêu cầu hỗ trợ mới
          </h6>
          
          <form onSubmit={handleSubmit} className="mb-40">
            <div className="mb-16">
              <label className="text-sm fw-medium text-gray-700 mb-8">Tiêu đề yêu cầu</label>
              <input
                className="common-input"
                placeholder="Ví dụ: Lỗi thanh toán, Tư vấn sản phẩm..."
                value={tieude}
                onChange={(e) => setTieude(e.target.value)}
                required
              />
            </div>
            <div className="mb-16">
              <label className="text-sm fw-medium text-gray-700 mb-8">Nội dung chi tiết</label>
              <textarea
                className="common-input"
                rows={4}
                placeholder="Mô tả vấn đề bạn đang gặp phải..."
                value={noidung}
                onChange={(e) => setNoidung(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-main py-12 px-24" 
              disabled={submitting}
            >
              {submitting ? "Đang gửi..." : "Gửi tin nhắn ngay"}
            </button>
          </form>

          <hr className="my-32 border-gray-100" />

          <h6 className="mb-20 text-gray-900 flex-align gap-8">
            <i className="ph-bold ph-clock-counter-clockwise text-main-600"></i> Lịch sử hỗ trợ
          </h6>

          {loading ? (
            <div className="py-20 text-center">Đang tải lịch sử...</div>
          ) : history.length === 0 ? (
            <div className="py-40 text-center">
              <img src="/assets/images/thumbs/placeholder.png" alt="no-data" className="mx-auto mb-16" width={80} />
              <p className="text-gray-500">Bạn chưa có yêu cầu hỗ trợ nào.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-12">
              {history.map((item) => (
                <div key={item.id} className="p-16 border border-gray-100 rounded-8 transition-all hover-border-main-600">
                  <div className="flex-between gap-12 mb-8">
                    <h6 className="text-md mb-0 text-gray-900">{item.tieude}</h6>
                    <span className={`px-12 py-4 rounded-pill text-xs fw-bold ${
                      item.trangthai === 'Đã đọc' ? 'bg-success-50 text-success-600' : 'bg-warning-50 text-warning-600'
                    }`}>
                      {item.trangthai}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-8">{item.noidung}</p>
                  
                  <div className="mt-12 text-xs text-gray-400 flex-between">
                    <span>Loại: {item.loai}</span>
                    <span>Ngày gửi: {new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AccountShell>

      <BenefitsStrip />
    </>
  );
}