"use client";

import React, { useEffect, useState } from "react";
import AccountShell from "@/components/AccountShell";
import Cookies from "js-cookie";

type Review = {
  id: number;
  id_sanpham?: number | null;
  diem: number;
  tieu_de?: string | null;
  noi_dung?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProductOption = { id: number; name: string };

export default function ReviewsPage() {
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState<{ id_sanpham: number; diem: number; noidung: string }>({
    id_sanpham: 0,
    diem: 5,
    noidung: "",
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("access_token");
      const res = await fetch(`${API}/api/toi/danhgias`, {
        headers: { Authorization: token ? `Bearer ${token}` : "", Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        console.error("fetchReviews failed", res.status);
        setReviews([]);
        return;
      }
      const json = await res.json().catch(() => ({}));
      // API likely returns { data: [...] }
      const list = (json && json.data) || [];
      setReviews(list);
    } catch (e) {
      console.error("fetchReviews error", e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products from user's orders (to allow rating only purchased products)
  const fetchProductsFromOrders = async () => {
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
          const items: ProductOption[] = (o.chitietdonhang || []).map((it: any) => {
            const sp = it.bienthe?.sanpham || {};
            const id = sp.id ?? it.id ?? null;
            const name = sp.ten ?? it.name ?? `#${id ?? "?"}`;
            return id ? { id: Number(id), name } : null;
          }).filter(Boolean) as ProductOption[];
          return { raw: o, id: String(o.id ?? o.madon ?? ""), madon: o.madon, created_at: o.created_at, items };
        });

      setOrders(completedOrders);
      // select first order by default (if any)
      if (completedOrders.length > 0) {
        const firstOrderId = completedOrders[0].id;
        setSelectedOrderId(firstOrderId);
        setProducts(completedOrders[0].items);
        // default product selection = first product of that order
        if (completedOrders[0].items.length > 0) {
          setForm(f => ({ ...f, id_sanpham: completedOrders[0].items[0].id }));
        }
      } else {
        // fallback: aggregated unique products from all orders (previous behavior)
        const map = new Map<number, string>();
        orders.forEach((o: any) => {
          (o.chitietdonhang || []).forEach((it: any) => {
            const sp = it.bienthe?.sanpham || {};
            const id = sp.id ?? it.id ?? null;
            const name = sp.ten ?? it.name ?? "Sản phẩm";
            if (id) map.set(Number(id), name);
          });
        });
        const list = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
        setProducts(list);
        if (list.length > 0) setForm(f => ({ ...f, id_sanpham: list[0].id }));
      }
    } catch (e) {
      console.error("fetchProductsFromOrders error", e);
    }
  };

  useEffect(() => {
    fetchProductsFromOrders();
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCreate = () => {
    setEditing(null);
    const selectedOrder = orders.find(o => o.id === selectedOrderId);
    const defaultProductId = selectedOrder?.items?.[0]?.id ?? products[0]?.id ?? 0;
    setForm(f => ({ ...f, diem: 5, noidung: "", id_sanpham: defaultProductId }));
  };

  const onSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = orders.find(o => o.id === orderId);
    if (order && Array.isArray(order.items) && order.items.length > 0) {
      setProducts(order.items);
      setForm(f => ({ ...f, id_sanpham: order.items[0].id }));
    } else {
      // no items -> clear product list
      setProducts([]);
      setForm(f => ({ ...f, id_sanpham: 0 }));
    }
  };

  const startEdit = (r: Review) => {
    setEditing(r);
    setForm({
      id_sanpham: r.id_sanpham ?? 0,
      diem: r.diem ?? 5,
      noidung: r.noi_dung ?? "",
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.id_sanpham) {
      alert("Vui lòng chọn sản phẩm để đánh giá.");
      return;
    }
    try {
      const token = Cookies.get("access_token");
      const payload: any = {
        id_sanpham: form.id_sanpham,
        diem: form.diem,
        noidung: form.noidung,
      };

      const url = editing ? `${API}/api/toi/danhgias/${editing.id}` : `${API}/api/toi/danhgias`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { Authorization: token ? `Bearer ${token}` : "", Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        await fetchReviews();
        setEditing(null);
        setForm({ id_sanpham: products[0]?.id ?? 0, diem: 5, noidung: "" });
        alert("Lưu đánh giá thành công.");
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
                      <div className="mt-8 text-sm">Sản phẩm: {products.find(p => p.id === (r.id_sanpham ?? 0))?.name ?? `#${r.id_sanpham ?? "?"}`}</div>
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
              {products.length === 0 ? (
                <div className="text-sm text-gray-500">Không tìm thấy sản phẩm để đánh giá.</div>
              ) : (
                <select
                  value={form.id_sanpham}
                  onChange={e => setForm(f => ({ ...f, id_sanpham: Number(e.target.value) }))}
                  className="px-8 py-6 mb-8 border w-100 rounded-6"
                >
                  <option value={0}>-- Chọn sản phẩm --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-8 d-flex flex-column">
              <label className="mb-4">Số sao</label>
              <select value={form.diem} onChange={e => setForm(f => ({ ...f, diem: Number(e.target.value) }))} className="px-8 py-6 border rounded-6">
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} sao</option>)}
              </select>
            </div>

            <div className="mb-8">
              <label className="mb-4 d-block">Nội dung</label>
              <textarea value={form.noidung} onChange={e => setForm(f => ({ ...f, noidung: e.target.value }))} className="px-8 py-6 border w-100 rounded-6" rows={6} />
            </div>

            <div className="gap-8 d-flex">
              <button type="submit" className="btn btn-main">{editing ? "Cập nhật" : "Lưu"}</button>
              <button type="button" onClick={() => { setEditing(null); setForm({ id_sanpham: products[0]?.id ?? 0, diem: 5, noidung: "" }); }} className="border btn">Hủy</button>
            </div>
          </form>
        </div>
      </div>
    </AccountShell>
  );
}