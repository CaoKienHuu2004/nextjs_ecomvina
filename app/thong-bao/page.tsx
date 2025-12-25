"use client";

import React, { JSX } from "react";
import FullHeader from "@/components/FullHeader";
import BenefitsStrip from "@/components/BenefitsStrip";
import AccountShell from "@/components/AccountShell";
import Cookies from "js-cookie";

type ApiNotification = {
  id: number;
  tieude: string;
  noidung?: string | null;
  loaithongbao?: string | null;
  trangthai?: string | null;
  created_at?: string | null;
};

const ThongBaoPage: React.FC = (): JSX.Element => {
  const [list, setList] = React.useState<ApiNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>("Đơn hàng");
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";

  const TAB_ORDER = [
    { key: "Đơn hàng", icon: "ph-notepad" },
    { key: "Khuyến mãi", icon: "ph-ticket" },
    { key: "Quà tặng", icon: "ph-gift" },
    { key: "Hệ thống", icon: "ph-gear" },
  ];

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = Cookies.get("access_token");
      const headers: Record<string, string> = {
        "Accept": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      // 1. SỬA: Gửi đúng tham số query mà Controller đang đợi ($request->input('loaithongbao'))
      const res = await fetch(`${API}/api/v1/thong-bao?loaithongbao=${activeTab}`, {
        method: "GET",
        headers,
      });

      if (!res.ok) throw new Error("Fetch error");

      const j = await res.json();
      
      // 2. SỬA: Vì Controller dùng ->paginate(10), nên dữ liệu nằm trong j.data.data
      const items = j?.data?.data || j?.data || [];
      setList(items);
    } catch (e) {
      console.error("fetch error", e);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [API, activeTab]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  // 3. SỬA: Đã lọc ở Server rồi thì không cần .filter ở Client nữa
  const visible = list;

  const markAllAsRead = async () => {
    try {
      const token = Cookies.get("access_token");
      const headers: Record<string, string> = { "Accept": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      // 4. SỬA: Gọi đúng Route /read-all như đã định nghĩa ở Back-end
      const res = await fetch(`${API}/api/v1/thong-bao/read-all`, {
        method: "POST",
        headers,
      });

      if (res.ok) fetchList();
    } catch (e) {
      console.error(e);
    }
  };

  // 5. BỔ SUNG: Hàm click vào thông báo để đánh dấu đã đọc
  const handleRead = async (id: number) => {
    try {
      const token = Cookies.get("access_token");
      await fetch(`${API}/api/v1/thong-bao/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({ id })
      });
      fetchList();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const token = Cookies.get("access_token");
      const res = await fetch(`${API}/thong-bao/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) fetchList();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />
      <AccountShell title="Thông báo" current="notifications">
        <div className="flex-wrap gap-16 mb-20 flex-between">
          <h6 className="gap-12 mb-0 text-gray-900 flex-align">
            <i className="ph-bold ph-bell-simple-ringing text-main-600" /> Thông báo của tôi
          </h6>
        </div>

        <div className="p-16 border border-gray-100 rounded-8">
          <div className="py-10 mb-20 flex-between flex-align">
            <ul className="m-0 nav common-tab style-two nav-pills" role="tablist">
              {TAB_ORDER.map((t) => (
                <li key={t.key} className="nav-item">
                  <button
                    className={`nav-link flex-align gap-8 fw-medium text-sm ${activeTab === t.key ? "active" : ""}`}
                    onClick={() => setActiveTab(t.key)}
                  >
                    <i className={`ph-bold ${t.icon} text-lg`} /> {t.key}
                  </button>
                </li>
              ))}
            </ul>

            <button onClick={markAllAsRead} className="gap-12 px-10 py-6 text-sm text-white bg-main-600 rounded-8 flex-align">
              <i className="ph-bold ph-check" /> Đánh dấu tất cả là đã đọc
            </button>
          </div>

          <div className="tab-content">
            {loading ? (
              <div className="py-20 text-center">Đang tải...</div>
            ) : visible.length === 0 ? (
              <div className="py-40 text-center">
                <img src="/assets/images/thumbs/placeholder.png" alt="no" className="mx-auto mb-16" width={100} />
                <div className="text-gray-600">Bạn chưa có thông báo nào trong mục {activeTab}.</div>
              </div>
            ) : (
              <div className="row gy-2">
                {visible.map((n) => (
                  <div key={n.id} className="col-12">
                    <div 
                      // 6. SỬA: Thêm màu nền nhạt nếu chưa đọc để dễ phân biệt
                      className={`px-20 py-16 mb-10 border rounded-4 transition-all ${
                        n.trangthai === 'Chưa đọc' ? 'bg-main-50 border-main-200' : 'border-gray-200'
                      }`}
                      onClick={() => n.trangthai === 'Chưa đọc' && handleRead(n.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="gap-12 d-flex flex-align">
                        <span className="flex-shrink-0 text-3xl text-main-600">
                          <i className={`ph-bold ${TAB_ORDER.find(x => x.key === n.loaithongbao)?.icon || 'ph-bell'}`} />
                        </span>
                        <div className="w-100">
                          <div className="gap-12 d-flex flex-between align-items-start">
                            <div>
                              <h6 className={`mb-2 text-md ${n.trangthai === 'Chưa đọc' ? 'fw-bold text-main-900' : 'text-gray-600'}`}>
                                {n.tieude}
                              </h6>
                              <p className="mb-0 text-sm text-gray-700">{n.noidung}</p>
                              <div className="mt-4 text-xs text-muted">{n.created_at}</div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                              className="p-4 text-danger hover-text-main-600"
                            >
                              <i className="ph-bold ph-trash" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AccountShell>
      <BenefitsStrip />
    </>
  );
};

export default ThongBaoPage;