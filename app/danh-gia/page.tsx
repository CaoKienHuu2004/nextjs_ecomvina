"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AccountShell from "@/components/AccountShell";
import Cookies from "js-cookie";

type Review = {
  id: number;
  id_sanpham?: number | null;
  id_chitietdonhang?: number | null;
  diem: number;
  tieu_de?: string | null;
  noi_dung?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type OrderItem = {
  id: number;
  id_chitietdonhang: number;
  name: string;
  id_sanpham: number;
};

type ProductOption = { id: number; name: string };

export default function ReviewsPage() {
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState<{ id_chitietdonhang: number; diem: number; noidung: string }>({
    id_chitietdonhang: 0,
    diem: 5,
    noidung: "",
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  // Fetch reviews - Currently no GET endpoint available
  // Reviews are created via POST to /api/v1/danh-gia
  const fetchReviews = async () => {
    try {
      setLoading(true);
      // TODO: Backend needs to provide GET endpoint for user's reviews
      // For now, we'll show empty list or fetch from orders
      setReviews([]);
    } catch (e) {
      console.error("fetchReviews error", e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products from user's orders (to allow rating only purchased products)
  const fetchProductsFromOrders = async (urlOrderId?: string) => {
    try {
      const token = Cookies.get("access_token");
      const res = await fetch(`${API}/api/v1/don-hang`, {
        headers: { Authorization: token ? `Bearer ${token}` : "", Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        console.error("fetchOrders failed", res.status);
        return;
      }
      const json = await res.json().catch(() => ({}));
      const groups = (json && json.data) || [];
      // Flatten groups -> orders -> items -> product id/name
      const orders = Array.isArray(groups) ? groups.flatMap((g: any) => g.donhang || []) : [];
      const isOrderCompleted = (status?: string) => {
        const s = (status || "").toString().toLowerCase();
        return s.includes("đã giao") || s.includes("đã giao hàng") || s.includes("thành công") || s.includes("delivered");
      };
      const completedOrders = orders
        .filter((o: any) => isOrderCompleted(o.trangthai))
        .map((o: any) => {
          const items: OrderItem[] = (o.chitietdonhang || []).map((it: any) => {
            const sp = it.bienthe?.sanpham || {};
            const id_sanpham = sp.id ?? it.id ?? null;
            const name = sp.ten ?? it.name ?? `#${id_sanpham ?? "?"}`;
            const id_chitietdonhang = it.id ?? null;
            return (id_sanpham && id_chitietdonhang) ? {
              id: Number(id_sanpham),
              id_chitietdonhang: Number(id_chitietdonhang),
              id_sanpham: Number(id_sanpham),
              name
            } : null;
          }).filter(Boolean) as OrderItem[];
          return { raw: o, id: String(o.id ?? o.madon ?? ""), madon: o.madon, created_at: o.created_at, items };
        });

      setOrders(completedOrders);

      // Check if there's an order_id from URL params
      let targetOrderId = urlOrderId;

      // If order_id from URL, try to find and select that order
      if (targetOrderId) {
        const targetOrder = completedOrders.find(o => o.id === targetOrderId);
        if (targetOrder) {
          setSelectedOrderId(targetOrderId);
          setOrderItems(targetOrder.items);
          if (targetOrder.items.length > 0) {
            setForm(f => ({ ...f, id_chitietdonhang: targetOrder.items[0].id_chitietdonhang }));
          }
          return;
        }
      }

      // Otherwise select first order by default (if any)
      if (completedOrders.length > 0) {
        const firstOrderId = completedOrders[0].id;
        setSelectedOrderId(firstOrderId);
        setOrderItems(completedOrders[0].items);
        // default product selection = first product of that order
        if (completedOrders[0].items.length > 0) {
          setForm(f => ({ ...f, id_chitietdonhang: completedOrders[0].items[0].id_chitietdonhang }));
        }
      } else {
        setOrderItems([]);
      }
    } catch (e) {
      console.error("fetchProductsFromOrders error", e);
    }
  };

  const searchParams = useSearchParams();

  useEffect(() => {
    const orderIdFromUrl = searchParams.get('order_id');
    fetchProductsFromOrders(orderIdFromUrl || undefined);
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const startCreate = () => {
    setEditing(null);
    const selectedOrder = orders.find(o => o.id === selectedOrderId);
    const defaultItemId = selectedOrder?.items?.[0]?.id_chitietdonhang ?? orderItems[0]?.id_chitietdonhang ?? 0;
    setForm({ id_chitietdonhang: defaultItemId, diem: 5, noidung: "" });
  };

  const onSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = orders.find(o => o.id === orderId);
    if (order && Array.isArray(order.items) && order.items.length > 0) {
      setOrderItems(order.items);
      setForm(f => ({ ...f, id_chitietdonhang: order.items[0].id_chitietdonhang }));
    } else {
      setOrderItems([]);
      setForm(f => ({ ...f, id_chitietdonhang: 0 }));
    }
  };

  const startEdit = (r: Review) => {
    setEditing(r);
    setForm({
      id_chitietdonhang: r.id_chitietdonhang ?? 0,
      diem: r.diem ?? 5,
      noidung: r.noi_dung ?? "",
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.id_chitietdonhang) {
      alert("Vui lòng chọn sản phẩm để đánh giá.");
      return;
    }
    try {
      const token = Cookies.get("access_token");
      const payload: any = {
        id_chitietdonhang: form.id_chitietdonhang,
        diem: form.diem,
        noidung: form.noidung,
      };

      const url = `${API}/api/v1/danh-gia`;
      const method = "POST";
      const res = await fetch(url, {
        method,
        headers: { Authorization: token ? `Bearer ${token}` : "", Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        await fetchReviews();
        setEditing(null);
        setForm({ id_chitietdonhang: orderItems[0]?.id_chitietdonhang ?? 0, diem: 5, noidung: "" });
        alert(json.message || "Lưu đánh giá thành công.");
      } else {
        alert(json.message || "Lỗi khi lưu đánh giá.");
      }
    } catch (e) {
      console.error("handleSubmit error", e);
      alert("Lỗi kết nối.");
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    try {
      const token = Cookies.get("access_token");
      const res = await fetch(`${API}/api/toi/danhgias/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "", Accept: "application/json" },
      });
      if (res.ok) {
        await fetchReviews();
        alert("Đã xóa.");
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.message || "Không xóa được.");
      }
    } catch (e) {
      console.error("handleDelete error", e);
      alert("Lỗi kết nối.");
    }
  };

  return (
    <AccountShell title="Đánh giá của tôi" current="reviews">
      <div className="gap-12 d-flex flex-column">
        <div className="d-flex flex-between">
          <h3 className="mb-0">Đánh giá của tôi</h3>
          <div>
            <button type="button" className="btn btn-main" onClick={startCreate}>
              Viết đánh giá mới
            </button>
          </div>
        </div>

        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <>
            {reviews.length === 0 ? (
              <div className="p-12 border rounded-8">Bạn chưa có đánh giá nào.</div>
            ) : (
              <div className="gap-8 d-flex flex-column">
                {reviews.map(r => (
                  <div key={r.id} className="p-12 border rounded-8 d-flex flex-between">
                    <div style={{ maxWidth: "72%" }}>
                      {/* <div className="fw-semibold">{r.tieu_de || "(Không có tiêu đề)"}</div> */}
                      <div className="text-sm text-gray-600" style={{ whiteSpace: "pre-wrap" }}>{r.noi_dung}</div>
                      <div className="text-xs text-gray-400">{r.created_at}</div>
                      <div className="mt-8 text-sm">Sản phẩm: {orderItems.find(p => p.id_chitietdonhang === (r.id_chitietdonhang ?? 0))?.name ?? `#${r.id_chitietdonhang ?? "?"}`}</div>
                    </div>

                    <div className="gap-8 d-flex flex-column align-items-end">
                      <div className="text-sm">{r.diem} ⭐</div>
                      <div className="d-flex flex-column">
                        <button type="button" onClick={() => startEdit(r)} className="px-10 py-8 mb-8 border btn">Sửa</button>
                        <button type="button" onClick={() => handleDelete(r.id)} className="px-10 py-8 btn border-danger">Xóa</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="p-12 mt-12 border rounded-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <label className="mb-4 d-block">Sản phẩm</label>
              <label className="mb-2 d-block">Đơn hàng</label>
              {orders.length === 0 ? (
                <div className="mb-6 text-sm text-gray-500">Không tìm thấy đơn hàng hoàn thành.</div>
              ) : (
                <select
                  value={selectedOrderId}
                  onChange={e => onSelectOrder(e.target.value)}
                  className="px-8 py-6 mb-4 border w-100 rounded-6"
                  aria-label="Chọn đơn hàng"
                >
                  <option value="">-- Chọn đơn hàng --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.madon ?? `#${o.id}`} {o.created_at ? `— ${String(o.created_at).slice(0, 16)}` : ""}
                    </option>
                  ))}
                </select>
              )}

              {/* Product select filtered by order */}
              {orderItems.length === 0 ? (
                <div className="text-sm text-gray-500">Không tìm thấy sản phẩm để đánh giá.</div>
              ) : (
                <select
                  value={form.id_chitietdonhang}
                  onChange={e => setForm(f => ({ ...f, id_chitietdonhang: Number(e.target.value) }))}
                  className="px-8 py-6 mb-8 border w-100 rounded-6"
                  aria-label="Chọn sản phẩm"
                >
                  <option value={0}>-- Chọn sản phẩm --</option>
                  {orderItems.map(item => (
                    <option key={item.id_chitietdonhang} value={item.id_chitietdonhang}>{item.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-8 d-flex flex-column">
              <label className="mb-4">Số sao</label>
              <select value={form.diem} onChange={e => setForm(f => ({ ...f, diem: Number(e.target.value) }))} className="px-8 py-6 border rounded-6" aria-label="Chọn số sao đánh giá">
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} sao</option>)}
              </select>
            </div>

            <div className="mb-8">
              <label className="mb-4 d-block">Nội dung</label>
              <textarea value={form.noidung} onChange={e => setForm(f => ({ ...f, noidung: e.target.value }))} className="px-8 py-6 border w-100 rounded-6" rows={6} aria-label="Nội dung đánh giá" placeholder="Viết đánh giá của bạn..." />
            </div>

            <div className="gap-8 d-flex">
              <button type="submit" className="btn btn-main">{editing ? "Cập nhật" : "Lưu"}</button>
              <button type="button" onClick={() => { setEditing(null); setForm({ id_chitietdonhang: orderItems[0]?.id_chitietdonhang ?? 0, diem: 5, noidung: "" }); }} className="border btn">Hủy</button>
            </div>
          </form>
        </div>
      </div>
    </AccountShell>
  );
}