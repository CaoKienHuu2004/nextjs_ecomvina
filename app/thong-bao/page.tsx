"use client";

import React, { JSX } from "react";
import FullHeader from "@/components/FullHeader";
import BenefitsStrip from "@/components/BenefitsStrip";
import AccountShell from "@/components/AccountShell";
import Cookies from "js-cookie";

type ApiNotification = {
  id: number;
  id_nguoidung?: number;
  tieude: string;
  noidung?: string | null;
  lienket?: string | null;
  loaithongbao?: string | null;
  trangthai?: string | null;
  created_at?: string | null;
  thoigian?: string | number | null;
};

export default function ThongBaoPage(): JSX.Element {
  const [list, setList] = React.useState<ApiNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>("Đơn hàng");
  const API = process.env.NEXT_PUBLIC_SERVER_API || "";

  // Shared tick to update countdowns
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const TAB_ORDER = [
    { key: "Đơn hàng", icon: "ph-notepad" },
    { key: "Khuyến mãi", icon: "ph-ticket" },
    { key: "Quà tặng", icon: "ph-gift" },
    { key: "Hệ thống", icon: "ph-gear" },
  ];

  // parseTargetMs: convert various input formats into epoch-ms target (or null)
  const parseTargetMs = (v?: string | number | null): number | null => {
    if (!v) return null;
    if (typeof v === "number") {
      // if seconds -> convert to ms (typical server seconds value)
      return v > 1e12 ? v : v * 1000;
    }
    const num = Number(v);
    if (!isNaN(num)) {
      return num > 1e12 ? num : num * 1000;
    }
    const parsed = Date.parse(v);
    return isNaN(parsed) ? null : parsed;
  };

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = Cookies.get("access_token");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API || ""}/api/tai-khoan/thongbaos`, {
        method: "GET",
        headers,
        // credentials: "include",
      });
      const j = await res.json().catch(() => null);
      const items = Array.isArray(j?.data) ? j.data : [];

      const normalized: ApiNotification[] = items.map((it: any) => {
        // normalize thoigian from several possible server fields
        let rawThoigian: any =
          it.thoigian ?? it.expire_at ?? it.expires_at ?? it.time_left_seconds ?? null;

        // If server gave remaining seconds (small number), convert to a target ms timestamp
        if (typeof rawThoigian === "number" && rawThoigian < 9999999999) {
          // treat as remaining seconds -> compute target ms timestamp
          rawThoigian = Date.now() + rawThoigian * 1000;
        } else if (
          typeof rawThoigian === "string" &&
          /^\d+$/.test(rawThoigian) &&
          rawThoigian.length <= 13
        ) {
          // numeric string: parse to number (could be seconds or ms)
          rawThoigian = Number(rawThoigian);
        }
        return {
          id: it.id,
          id_nguoidung: it.id_nguoidung,
          tieude: it.tieude ?? it.tieu_de ?? "",
          noidung: it.noidung ?? it.noi_dung ?? null,
          lienket: it.lienket ?? null,
          loaithongbao: it.loaithongbao ?? it.loai ?? "Hệ thống",
          trangthai: it.trangthai ?? "Chưa đọc",
          created_at: it.created_at ?? it.createdAt ?? null,
          thoigian: rawThoigian ?? null,
        } as ApiNotification;
      });

      setList(normalized);
      if (!TAB_ORDER.some((t) => t.key === activeTab) && normalized.length) {
        setActiveTab(normalized[0]?.loaithongbao ?? "Đơn hàng");
      }
    } catch (e) {
      console.error("fetch thongbaos", e);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [API, activeTab]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  const visible = list.filter((n) => (n.loaithongbao || "Hệ thống") === activeTab);

  // markAllAsRead: call PATCH per API: /api/tai-khoan/thongbaos/{id}/daxem
  const markAllAsRead = async () => {
    try {
      const token = Cookies.get("access_token");
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const targets = visible.length ? visible : list;
      if (!targets || targets.length === 0) return;

      // Mark all in parallel (change to sequential if server rate-limits)
      await Promise.all(
        targets.map((item: any) =>
          fetch(`${API || ""}/api/tai-khoan/thongbaos/${item.id}/daxem`, {
            method: "PATCH",
            headers,
            // credentials: "include",
          }).catch((err) => {
            console.warn(`Failed marking ${item.id} as read`, err);
            return null;
          })
        )
      );
    } catch (e) {
      console.error("markAllAsRead error", e);
    } finally {
      // refresh
      fetchList();
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
          <div className="flex-wrap gap-16 position-relative flex-align">
            <button
              type="button"
              className="text-2xl border border-gray-100 w-44 h-44 d-lg-none d-flex flex-center rounded-6 sidebar-btn"
            >
              <i className="ph-bold ph-folder-user" />
            </button>
          </div>
        </div>

        <div className="p-16 border border-gray-100 rounded-8">
          <div className="py-10 mb-20 flex-between flex-align">
            <ul className="m-0 nav common-tab style-two nav-pills" role="tablist">
              {TAB_ORDER.map((t) => (
                <li key={t.key} className="nav-item" role="presentation">
                  <button
                    className={`nav-link flex-align gap-8 fw-medium text-sm hover-border-main-600 ${
                      activeTab === t.key ? "active" : ""
                    }`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === t.key}
                    onClick={() => setActiveTab(t.key)}
                  >
                    <i className={`ph-bold ${t.icon} text-lg`} /> {t.key}
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={markAllAsRead}
              className="gap-12 px-10 py-6 text-sm text-white hover-bg-main-800 bg-main-600 rounded-8 flex-align"
            >
              <i className="ph-bold ph-check" /> Đánh dấu tất cả là đã đọc
            </button>
          </div>

          <div className="tab-content" id="pills-tabContent">
            <div className="tab-pane fade show active" role="tabpanel">
              <div>
                {loading ? (
                  <div>Đang tải...</div>
                ) : visible.length === 0 ? (
                  <div className="py-40 text-center">
                    <img src="/assets/images/thumbs/placeholder.png" alt="no" className="mx-auto mb-16" />
                    <div className="text-gray-600">Bạn chưa có thông báo nào.</div>
                  </div>
                ) : (
                  <div className="row gy-2">
                    {visible.map((n) => {
                      // Determine display text for time:
                      // - If `thoigian` is parseable into a target timestamp -> show countdown
                      // - Else if `thoigian` is a human string like "3 giờ trước" -> show it raw
                      // - Else fallback to created_at
                      const targetMs = parseTargetMs(n.thoigian);
                      let timeText = "";

                      if (targetMs) {
                        const sec = Math.max(0, Math.ceil((targetMs - now) / 1000));
                        if (sec <= 0) timeText = "Đã hết hạn";
                        else if (sec >= 3600)
                          timeText = `${Math.floor(sec / 3600)} giờ ${String(
                            Math.floor((sec % 3600) / 60)
                          ).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
                        else timeText = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
                      } else if (typeof n.thoigian === "string" && n.thoigian.trim().length > 0) {
                        // Server gave a human-friendly string like "3 giờ trước"
                        timeText = n.thoigian;
                      } else {
                        timeText = n.created_at ? new Date(n.created_at).toLocaleString() : "";
                      }

                      return (
                        <div key={n.id} className="col-12 col-lg-12">
                          <div className="px-20 py-16 mb-10 border border-gray-200 box-shadow-sm text-main-900 rounded-4">
                            <div className="gap-12 d-flex flex-align">
                              <span className="flex-shrink-0 text-4xl text-main-600">
                                <i className="ph-bold ph-notepad" />
                              </span>
                              <div className="w-100">
                                <div className="gap-12 d-flex flex-between align-items-start">
                                  <div>
                                    <h6 className="mb-2 text-lg text-gray-900">{n.tieude}</h6>
                                    <p className="mb-0 text-gray-700 text-md wrap-80">{n.noidung}</p>
                                    <div className="text-sm text-muted">{timeText}</div>
                                  </div>
                                  <div className="gap-8 text-end flex-column d-flex align-items-end" style={{ minWidth: 160 }}>
                                    <a
                                      href={n.lienket ?? "#"}
                                      className={`border border-main-600 text-main-600 hover-text-white hover-bg-main-600 px-8 py-4 rounded-4 text-sm`}
                                      target={n.lienket ? "_blank" : undefined}
                                      rel={n.lienket ? "noopener noreferrer" : undefined}
                                      onClick={(e) => { /* keep existing handlers if any */ }}
                                    >
                                      Xem chi tiết
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AccountShell>

      <BenefitsStrip />
    </>
  );
}