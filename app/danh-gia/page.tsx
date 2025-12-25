"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import Cookies from "js-cookie";
import { matchesFilter, formatPrice } from "@/utils/chitietdh"; // Import helper lọc trạng thái

// --- Type Definitions ---
type Review = {
    id: number;
    id_chitietdonhang: number;
    diem: number;
    noi_dung: string;
    created_at?: string;
    sanpham?: { ten?: string; hinhanh?: string };
};

type OrderItem = {
    id: number;
    soluong: number;
    dongia: number;
    tensanpham?: string;
    hinhanh?: string;
    bienthe?: {
        sanpham?: { ten?: string; hinhanh?: string; hinhanhsanpham?: { hinhanh?: string }[] };
    };
};

type Order = {
    id: number;
    madon: string;
    trangthai: string;
    trangthaithanhtoan: string;
    created_at: string;
    chitietdonhang: OrderItem[];
};

export default function ReviewsPage() {
    const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";
    const searchParams = useSearchParams();
    const router = useRouter();

    // State
    const [loading, setLoading] = useState(false);
    const [completedOrders, setCompletedOrders] = useState<Order[]>([]); // Danh sách đơn thành công
    const [reviewedIds, setReviewedIds] = useState<number[]>([]);
    // Form State
    const [selectedOrderId, setSelectedOrderId] = useState<string>("");
    const [selectableItems, setSelectableItems] = useState<OrderItem[]>([]); // List sản phẩm của đơn đã chọn

    const [form, setForm] = useState({
        id_chitietdonhang: 0,
        diem: 5,
        noidung: "",
    });

    // --- 1. LẤY DANH SÁCH ĐƠN HÀNG & LỌC ĐƠN THÀNH CÔNG ---
    useEffect(() => {
        const fetchReviewableOrders = async () => {
            setLoading(true);
            try {
                const token = Cookies.get("access_token");
                if (!token) return;

                // Gọi API lấy toàn bộ đơn hàng (GET)
                // Lưu ý: Nên dùng logic fetch all pages như trang don-hang nếu user mua nhiều
                const res = await fetch(`${API}/api/v1/don-hang?page=1`, {
                    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
                });

                const json = await res.json();
                const allOrders: Order[] = json?.data?.data || [];

                // LỌC: Chỉ lấy đơn "Thành công" bằng hàm chuẩn trong utils
                const validOrders = allOrders.filter(o =>
                    matchesFilter('completed', o.trangthai, o.trangthaithanhtoan)
                );

                setCompletedOrders(validOrders);

                // Nếu URL có ?order_id=... thì tự động chọn đơn đó
                const urlOrderId = searchParams.get('order_id');
                if (urlOrderId) {
                    const target = validOrders.find(o => String(o.id) === urlOrderId);
                    if (target) {
                        setSelectedOrderId(String(target.id));
                        setSelectableItems(target.chitietdonhang);
                    }
                }

            } catch (e) {
                console.error("Lỗi tải đơn hàng:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchReviewableOrders();
    }, [API, searchParams]);

    // --- 2. XỬ LÝ KHI CHỌN ĐƠN HÀNG ---
    const handleSelectOrder = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const orderId = e.target.value;
        setSelectedOrderId(orderId);

        // Tìm đơn hàng tương ứng để lấy danh sách sản phẩm
        const order = completedOrders.find(o => String(o.id) === orderId);
        if (order) {
            setSelectableItems(order.chitietdonhang);
            // Reset form sản phẩm
            setForm(prev => ({ ...prev, id_chitietdonhang: 0 }));
        } else {
            setSelectableItems([]);
        }
    };

    // --- 3. GỬI ĐÁNH GIÁ (POST) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.id_chitietdonhang) {
            alert("Vui lòng chọn sản phẩm cần đánh giá!");
            return;
        }
        if (!form.noidung.trim()) {
            alert("Vui lòng viết nội dung đánh giá!");
            return;
        }

        try {
            const token = Cookies.get("access_token");
            // Payload đúng chuẩn Postman của bạn
            const payload = {
                id_chitietdonhang: Number(form.id_chitietdonhang), // ID từ bảng chitietdonhang
                diem: Number(form.diem),
                noidung: form.noidung
            };

            const res = await fetch(`${API}/api/v1/danh-gia`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const json = await res.json();

            if (res.ok) {
                alert("Gửi đánh giá thành công! Cảm ơn bạn.");

                // [MỚI] Thêm ID vừa đánh giá vào danh sách đen
                setReviewedIds(prev => [...prev, payload.id_chitietdonhang]);

                // Reset form
                setForm({ id_chitietdonhang: 0, diem: 5, noidung: "" });
                // Có thể redirect hoặc fetch lại danh sách đánh giá cũ nếu có API get
            } else {
                alert(json.message || "Lỗi khi gửi đánh giá.");

                // [MỚI] Kiểm tra nếu thông báo lỗi có chứa từ khóa "đã đánh giá"
                // (Bạn cần kiểm tra chính xác message server trả về, 
                // dựa theo ảnh bạn gửi thì message là "Sản phẩm này bạn đã đánh giá rồi.")
                const msg = (json.message || "").toLowerCase();
                if (msg.includes("đã đánh giá") || msg.includes("already reviewed")) {

                    // Cũng thêm ID này vào danh sách ẩn luôn để người dùng không chọn lại được nữa
                    setReviewedIds(prev => [...prev, payload.id_chitietdonhang]);

                    // Reset form để người dùng chọn cái khác
                    setForm(prev => ({ ...prev, id_chitietdonhang: 0 }));
                }

            }

        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối.");
        }
    };

    return (
        <AccountShell title="Đánh giá sản phẩm" current="reviews">
            <div className="p-24 bg-white border rounded-8">
                <h5 className="mb-20 fw-bold">Viết đánh giá sản phẩm</h5>

                {loading && <p>Đang tải danh sách đơn hàng...</p>}

                {!loading && completedOrders.length === 0 && (
                    <div className="alert alert-info">
                        Bạn chưa có đơn hàng nào hoàn thành để đánh giá.
                        <Link href="/shop" className="fw-bold ms-2">Mua sắm ngay</Link>
                    </div>
                )}

                {completedOrders.length > 0 && (
                    <form onSubmit={handleSubmit}>
                        {/* 1. Chọn Đơn Hàng */}
                        <div className="mb-16">
                            <label className="mb-8 fw-semibold d-block">Chọn đơn hàng đã mua</label>
                            <select
                                className="form-select common-input rounded-8"
                                value={selectedOrderId}
                                onChange={handleSelectOrder}
                                aria-label="Chọn đơn hàng đã mua"
                            >
                                <option value="">-- Chọn đơn hàng --</option>
                                {completedOrders.map(order => (
                                    <option key={order.id} value={order.id}>
                                        Đơn #{order.madon} — {new Date(order.created_at).toLocaleDateString('vi-VN')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Chọn Sản Phẩm trong đơn đó */}
                        {selectedOrderId && (
                            <div className="mb-16 animation-fade-in">
                                <label className="mb-8 fw-semibold d-block">Chọn sản phẩm</label>
                                <select
                                    className="form-select common-input rounded-8"
                                    value={form.id_chitietdonhang}
                                    onChange={e => setForm({ ...form, id_chitietdonhang: Number(e.target.value) })}
                                    aria-label="Chọn sản phẩm cần đánh giá"
                                >
                                    <option value="0">-- Chọn sản phẩm --</option>
                                    {selectableItems.map(item => {
                                        const name = item.tensanpham || item.bienthe?.sanpham?.ten || "Sản phẩm";
                                        // [MỚI] Kiểm tra xem ID này có trong danh sách đã đánh giá chưa
                                        const isReviewed = reviewedIds.includes(item.id);

                                        return (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                                disabled={isReviewed} // Không cho chọn nếu đã đánh giá
                                                style={isReviewed ? { color: '#aaa' } : {}} // Làm mờ chữ
                                            >
                                                {name} (x{item.soluong}) {isReviewed ? '(Đã đánh giá)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}

                        {/* 3. Form Nhập liệu (Chỉ hiện khi đã chọn sản phẩm) */}
                        {form.id_chitietdonhang > 0 && (
                            <div className="animation-fade-in">
                                <div className="mb-16">
                                    <label className="mb-8 fw-semibold d-block">Mức độ hài lòng</label>
                                    <div className="gap-8 d-flex">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setForm({ ...form, diem: star })}
                                                className={`btn btn-sm ${form.diem >= star ? 'btn-warning text-white' : 'btn-outline-gray'}`}
                                            >
                                                {star} <i className="ph-fill ph-star"></i>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-24">
                                    <label className="mb-8 fw-semibold d-block">Nội dung đánh giá</label>
                                    <textarea
                                        rows={4}
                                        className="p-12 common-input rounded-8 w-100"
                                        placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
                                        value={form.noidung}
                                        onChange={e => setForm({ ...form, noidung: e.target.value })}
                                    ></textarea>
                                </div>

                                <button type="submit" className="btn btn-main w-100 rounded-8 fw-bold">
                                    Gửi đánh giá
                                </button>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </AccountShell>
    );
}