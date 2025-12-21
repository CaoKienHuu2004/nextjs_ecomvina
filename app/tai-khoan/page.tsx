"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthHeaders, useAuth } from "@/hooks/useAuth";
import AccountShell from "@/components/AccountShell";
import FullHeader from "@/components/FullHeader";
import Cookies from "js-cookie";


const pickErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === "object" && "message" in err) {
    const maybe = (err as { message?: unknown }).message;
    if (typeof maybe === "string") {
      const s = maybe.trim();
      if (s && s !== "{}" && s !== "[]") return s;
    }
  }
  return fallback;
};


type OrderItem = { product_id?: number; quantity?: number };
type Order = {
  id: number;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
};

type WishlistRow = {
  product_id?: number;
  product?: { id?: number };
};

type CartRow = {
  id?: number; // row id
  id_bienthesp?: number;
  quantity?: number;
};

type Address = {
  id?: number;
  hoten: string;
  sodienthoai: string;
  diachi: string;
  tinhthanh?: string;
  trangthai?: string;
};

type AuthUser = {
  id?: number| string;
  username?: string | null;
  email?: string | null;
  sodienthoai?: string | null;
  hoten?: string | null;
  name?: string | null;
  gioitinh?: string | null;
  ngaysinh?: string | null; // 'Y-m-d' or null
  avatar?: string | null;
  // vaitro?: string | null;
  // trangthai?: string | null;
  diachi?: Address[] | null;
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const getUserString = (obj: unknown, key: string): string | undefined => {
  if (!isPlainObject(obj)) return undefined;
  const val = (obj as Record<string, unknown>)[key];
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  return undefined;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

function normalizeUser(raw: unknown): AuthUser {
      if (!isPlainObject(raw)) return {};
      const r = raw as Record<string, any>;
      const diachiRaw = Array.isArray(r.diachi) ? r.diachi : r.danh_sach_diachi ?? null;
      const diachi = Array.isArray(diachiRaw)
        ? diachiRaw
            .map((it: any) => {
              if (!it || (it.id == null && it.id === undefined)) return null;
              const idNum = Number(it.id);
              if (!Number.isFinite(idNum)) return null;
              return {
                id: idNum,
                hoten: typeof it.hoten === "string" ? it.hoten : String(it.hoten ?? ""),
                sodienthoai: typeof it.sodienthoai === "string" ? it.sodienthoai : String(it.sodienthoai ?? ""),
                diachi: typeof it.diachi === "string" ? it.diachi : String(it.diachi ?? ""),
                tinhthanh: typeof it.tinhthanh === "string" ? it.tinhthanh : undefined,
                trangthai: typeof it.trangthai === "string" ? it.trangthai : undefined,
              } as Address;
            })
            .filter(Boolean) as Address[]
        : null;
      const mapped: AuthUser = {
        id: r.id ?? r.ID ?? r.user_id ?? undefined,
        username: typeof r.username === "string" ? r.username : r.email ?? undefined,
        hoten: typeof r.hoten === "string" ? r.hoten : r.name ?? undefined,
        sodienthoai: typeof r.sodienthoai === "string" ? r.sodienthoai : r.phone ?? undefined,
        email: typeof r.email === "string" ? r.email : undefined,
        gioitinh: typeof r.gioitinh === "string" ? r.gioitinh : undefined,
        ngaysinh: typeof r.ngaysinh === "string" ? r.ngaysinh : undefined,
        avatar: typeof r.avatar === "string" ? r.avatar : undefined,
        diachi: diachi ?? null,
      };
      return mapped;
    }

export default function Page() {
  const router = useRouter();
  const search = useSearchParams();
  const { login, register, logout, user, isLoggedIn, updateProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Mirror FullHeader token detection -> set x-user-id cookie for mock server
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isLoggedIn) return; // client already knows logged in

    // if cookie already present, nothing to do
    if (document.cookie.match(/\bx-user-id=([^;]+)/)) return;

    
    // candidate token keys used by the app
    const candidates = [
      localStorage.getItem("token"),
      localStorage.getItem("auth_token"),
      localStorage.getItem("mock_token"),
      localStorage.getItem("user_token"),
      (() => {
        try {
          const a = localStorage.getItem("auth");
          if (!a) return null;
          const p = JSON.parse(a);
          return p?.token ?? null;
        } catch {
          return null;
        }
      })(),
    ].filter(Boolean) as string[];

    const raw = candidates[0] || "";
    if (!raw) return;

    let token = raw.replace(/^Bearer\s+/i, "").trim();
    if (!token) return;

    // token format "userId:timestamp" -> extract userId
    if (token.includes(":")) token = token.split(":")[0];
    if (!/^\d+$/.test(token)) return;

    try {
      const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000).toUTCString();
      document.cookie = `x-user-id=${encodeURIComponent(token)}; Path=/; Expires=${expires}`;
      console.debug("[auth] set x-user-id cookie (dev)", token);
    } catch {
      // ignore
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const src =
      (profile && typeof profile.avatar === "string" && profile.avatar) ||
      getUserString(user, "avatar") ||
      null;
    setAvatarPreview(src);
  }, [profile, user]);

  // Chuẩn hoá host để cookie không rớt (localhost ↔ 127.0.0.1)
  const API = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";
    try {
      if (typeof window === "undefined") return raw;
      const u = new URL(raw);
      const host = window.location.hostname; // "localhost" hoặc "127.0.0.1"
      if (
        (u.hostname === "127.0.0.1" && host === "localhost") ||
        (u.hostname === "localhost" && host === "127.0.0.1")
      )
        u.hostname = host;
      return u.origin;
    } catch {
      return raw;
    }
  }, []);
  const token = Cookies.get("access_token");

  const [tab, setTab] = useState<
    "login" | "register" | "wishlist" | "cart" | "orders" | "profile"
  >(() => (search?.get("tab") === "register" ? "register" : "login"));

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Các state “value” không dùng trong UI → chỉ giữ setter để tránh cảnh báo unused
  const [, setWishlist] = useState<WishlistRow[]>([]);
  const [, setCart] = useState<CartRow[]>([]);
  const [, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const src = (profile && (profile.avatar as string)) || (user && (user.avatar as string)) || null;
    setAvatarPreview(src);
  }, [profile, user]);

  useEffect(() => {
    const cls = ["color-two", "font-exo", "header-style-two"];
    const html = document.documentElement;
    cls.forEach((c) => html.classList.add(c));
    return () => {
      cls.forEach((c) => html.classList.remove(c));
    };
  }, []);

  useEffect(() => {
    let alive = true;
    // seed profile from useAuth.user so UI updates immediately after login
    if (user) setProfile(normalizeUser(user) ?? null);

    // refresh detailed profile from server when logged in
    if (!isLoggedIn) return () => { alive = false; };
    (async () => {
      try {
        const latest = await refreshProfile();
        if (alive && latest) setProfile((prev) => {
          // merge and normalize to satisfy TS types
          const normalized = normalizeUser(latest);
          return { ...(prev ?? {}), ...(normalized ?? {}) } as AuthUser;
        });
      } catch {
        // ignore
      }
    })();
    return () => { alive = false; };
  }, [user, isLoggedIn, API, refreshProfile]);
  // Khi đã đăng nhập, nếu đang ở tab login/register thì chuyển sang wishlist
  useEffect(() => {
    if (!isLoggedIn) return;
    if (tab === "login" || tab === "register") setTab("wishlist");
  }, [isLoggedIn, tab]);

  // Tải dữ liệu theo tab (giữ nguyên endpoint, chỉ đổi kiểu)
  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        if (tab === "wishlist") {
          const token = Cookies.get("access_token") || Cookies.get("token") || null;
          const headers: Record<string, string> = { Accept: "application/json" };
          if (token) headers.Authorization = `Bearer ${token}`;
          const res = await fetch(`${API}/api/tai-khoan/yeuthichs`, { credentials: "include", headers });//credentials: "include",
          const data = await res.json();
          setWishlist(Array.isArray(data) ? (data as WishlistRow[]) : (data?.data ?? []));
        } else if (tab === "cart") {
          const res = await fetch(`${API}/api/v1/gio-hang`, {
            method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
              },
              credentials: "include",
              body: JSON.stringify({ /* optional payload, e.g. action: "list" */ }),
            });
          const j = await res.json();
          setCart((j?.data as CartRow[]) ?? []);
        } else if (tab === "orders") {
          const token = Cookies.get("access_token") || Cookies.get("token") || null;
          const headers: Record<string, string> = { Accept: "application/json" };
          if (token) headers.Authorization = `Bearer ${token}`;
          const res = await fetch(`${API}/api/v1/don-hang`, {  credentials: "include", headers });//credentials: "include",
          const j = await res.json();
          setOrders((j?.data as Order[]) ?? []);
        } else if (tab === "profile") {
          const token = Cookies.get("access_token") || Cookies.get("token") || null;
          const headers: Record<string, string> = { Accept: "application/json" };
          if (token) headers.Authorization = `Bearer ${token}`;
          const res = await fetch(`${API}/api/v1/thong-tin-ca-nhan`, {
            method: "GET",
            headers: { ...getAuthHeaders() },
            credentials: "include",
          });
          const j = await res.json();
          setProfile((j?.data ?? j?.user ?? j) as AuthUser ?? null);
        }
      } catch {
        // ignore
      }
    })();
  }, [tab, isLoggedIn, API]);

  const handleSaveProfile: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    setLoading(true);
    setNotice(null);
    const formEl = e.currentTarget;

    try {
      const formData = new FormData(formEl);
      const fd = new FormData();

      const hoten = String(formData.get("hoten") || "");
      const sodienthoai = String(formData.get("sodienthoai") || "");
      const ngaysinh = String(formData.get("ngaysinh") || "");
      const gioitinh = String(formData.get("gioitinh") || "");
      const email = String(formData.get("email") || "");
      const tinhthanh = String(formData.get("address_city") || formData.get("tinhthanh") || "");
      const diachi = String(formData.get("address_street") || formData.get("address") || "");
      const trangthai_diachi = String(formData.get("address_state") || formData.get("trangthai_diachi") || "Mặc định");

      fd.append("hoten", hoten);
      if (sodienthoai) fd.append("sodienthoai", sodienthoai);
      if (ngaysinh) fd.append("ngaysinh", ngaysinh);
      if (gioitinh) fd.append("gioitinh", gioitinh);
      if (email) fd.append("email", email);
      if (tinhthanh) fd.append("tinhthanh", tinhthanh);
      if (diachi) fd.append("diachi", diachi);
      fd.append("trangthai_diachi", trangthai_diachi);

      // avatar file (if user selected one)
      const fileInput = formEl.querySelector<HTMLInputElement>('input[type="file"][name="avatar"]');
      const avatarFile = fileInput?.files?.[0];
      if (avatarFile) fd.append("avatar", avatarFile);

      // send as multipart/form-data (let browser set Content-Type)
      const updated = await updateProfile(fd);
      if (!updated) throw new Error("Cập nhật thất bại");
      const normalizedUpdated = normalizeUser(updated);
      setProfile(normalizedUpdated);

      // update avatar preview + persist for AccountShell/sidebar
      if (updated?.avatar && typeof updated.avatar === "string") {
        setAvatarPreview(String(updated.avatar));
        try { localStorage.setItem("avatar", String(updated.avatar)); } catch { }
      }

      // persist display name / username so sidebar shows immediately
      if (updated?.hoten && typeof updated.hoten === "string") {
        try { localStorage.setItem("fullname", String(updated.hoten)); } catch { }
      }
      if (updated?.username && typeof updated.username === "string") {
        try { localStorage.setItem("username", String(updated.username)); } catch { }
      }
      // if backend returns diachi array, remind user to add address if empty
      const diachiArr = Array.isArray(normalizedUpdated?.diachi) ? (normalizedUpdated!.diachi as Address[]) : undefined;
      if (!diachiArr || diachiArr.length === 0) {
        setNotice({
          type: "success",
          msg: "Đã lưu thông tin. Bạn chưa có địa chỉ giao hàng — vui lòng thêm ở Sổ địa chỉ để sử dụng khi đặt hàng.",
        });
      } else {
        setNotice({ type: "success", msg: "Đã lưu thông tin cá nhân" });
      }
    } catch (err: unknown) {
      setNotice({
        type: "error",
        msg: pickErrorMessage(err, "Không thể lưu thông tin cá nhân"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const current_password = String(form.get("current_password") || "");
    const new_password = String(form.get("new_password") || "");
    const new_password_confirmation = String(form.get("new_password_confirmation") || "");
    setLoading(true);
    try {
      const headers = { "Content-Type": "application/json", ...getAuthHeaders() };
      const res = await fetch(`${API}/api/v1/thong-tin-ca-nhan/cap-nhat-mat-khau`, { 
        method: "PATCH", 
        headers, 
        body: JSON.stringify({ current_password, new_password, new_password_confirmation }) 
      });
      const j = (await res.json().catch(() => null)) as unknown;
      const msg =
        isRecord(j) && typeof (j as Record<string, unknown>).message === "string"
          ? ((j as Record<string, unknown>).message as string)
          : undefined;
      if (!res.ok) throw new Error(msg ?? "Không thể đổi mật khẩu");
      setNotice({ type: "success", msg: msg ?? "Đổi mật khẩu thành công" });
      setShowChangePassword(false);
    } catch (err: unknown) {
      setNotice({ type: "error", msg: pickErrorMessage(err, "Lỗi đổi mật khẩu") });
    } finally {
      setLoading(false);
    }
  };
  // Đồng bộ wishlist khách sau khi đăng nhập (giữ nguyên API)
  const syncGuestWishlist = async () => {
    try {
      const raw = localStorage.getItem("guest_wishlist") || "[]";
      const parsed = JSON.parse(raw);
      const ids: number[] = Array.isArray(parsed) ? parsed : [];
      if (!ids.length) return;
      await Promise.allSettled(
        ids.map((id) =>
          fetch(`${API}/api/tai-khoan/yeuthichs`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            // credentials: "include",
            body: JSON.stringify({ id_sanpham: id }),
          })
        )
      );
    } catch { }
  };


  const handleLogin: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const phonemail = String(form.get("phonemail") || "").trim();
    const password = String(form.get("password") || "").trim();
    setLoading(true);
    setNotice(null);
    try {
      // gọi useAuth.login với key 'username'
      await login({ phonemail, password });
      await syncGuestWishlist();
      router.replace("/");
    } catch (err: unknown) {
      setNotice({
        type: "error",
        msg: pickErrorMessage(err, "Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại."),
      });
    } finally {
      setLoading(false);
    }
  };
  const handleRegister: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const hoten = String(form.get("hoten") || "").trim();
    const username = String(form.get("username") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "").trim();
    const password_confirmation = String(form.get("password_confirmation") || "").trim();
    const sodienthoai = String(form.get("sodienthoai") || "").trim();

    setLoading(true);
    setNotice(null);
    try {
      // gửi payload thuần tiếng Việt theo API ví dụ
      const payload: Record<string, unknown> = {
        hoten,
        username: username || hoten,
        password,
        password_confirmation: password_confirmation || password,
      };
      if (email) payload.email = email;
      if (sodienthoai) payload.sodienthoai = sodienthoai;

      const res = await fetch(`${API}/api/v1/dang-ky`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Đăng ký thất bại (HTTP ${res.status})`);
      }
      const j = await res.json();
      setNotice({ type: "success", msg: j?.message ?? "Đăng ký thành công. Vui lòng đăng nhập." });
      // chuyển sang trang đăng nhập
      if (typeof window !== "undefined") window.location.replace("/tai-khoan?tab=login");
      else setTab("login");
    } catch (err: unknown) {
      setNotice({ type: "error", msg: pickErrorMessage(err, "Đăng ký thất bại. Kiểm tra và thử lại.") });
    } finally {
      setLoading(false);
    }
  };
  const handleRemoveWish = async (productId: number) => {
    try {
      const token = Cookies.get("access_token") || Cookies.get("token") || null;
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch(`${API}/api/tai-khoan/yeuthichs/${productId}`, {
        method: "PATCH",
        // credentials: "include",
        headers,
      });
      setWishlist((prev) =>
        prev.filter((w) => (w.product?.id ?? w.product_id) !== productId)
      );
    } catch { }
  };

  return (
    <>
      {showChangePassword && (
        <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="container modal-content" style={{ maxWidth: 520 }}>
            <div className="mb-20 flex-align flex-between">
              <h6 className="m-0">Đổi mật khẩu</h6>
              <button onClick={() => setShowChangePassword(false)} className="bg-transparent border-0">×</button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="mb-12">
                <label className="form-label">Mật khẩu hiện tại</label>
                <input name="current_password" type="password" className="p-10 form-control" required />
              </div>
              <div className="mb-12">
                <label className="form-label">Mật khẩu mới</label>
                <input name="new_password" type="password" className="p-10 form-control" required />
              </div>
              <div className="mb-12">
                <label className="form-label">Xác nhận mật khẩu</label>
                <input name="new_password_confirmation" type="password" className="p-10 form-control" required />
              </div>
              <div className="gap-8 d-flex">
                <button type="submit" className="btn btn-main-two">Đổi mật khẩu</button>
                <button type="button" onClick={() => setShowChangePassword(false)} className="btn btn-outline-main-two">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <FullHeader showClassicTopBar={true} showTopNav={false} />
      <AccountShell title="Tài khoản" current="profile">
        {!isLoggedIn ? (
          <>
            <div className="gap-16 mb-16 d-flex">
              <button
                className={`btn ${tab === "login" ? "btn-main-two" : "btn-outline-main-two"}`}
                onClick={() => setTab("login")}
              >
                Đăng nhập
              </button>
              <button
                className={`btn ${tab === "register" ? "btn-main-two" : "btn-outline-main-two"}`}
                onClick={() => setTab("register")}
              >
                Đăng ký
              </button>
            </div>

            {notice && (
              <div
                className={`alert ${notice.type === "success" ? "alert-success" : "alert-danger"} py-10 px-12 mb-16`}
              >
                {notice.msg}
              </div>
            )}

            {tab === "login" ? (
              <form onSubmit={handleLogin}>
                <div className="row gy-4">
                  <div className="col-12">
                    <label htmlFor="login-username" className="text-sm text-gray-900 fw-medium">Email hoặc SĐT *</label>
                    <input id="login-username" name="phonemail" type="text" className="common-input" placeholder="email hoặc số điện thoại" autoComplete="username" required />
                  </div>
                  <div className="col-12">
                    <label htmlFor="login-password" className="text-sm text-gray-900 fw-medium">Mật khẩu</label>
                    <input id="login-password" name="password" type="password" className="common-input" placeholder="••••••••" required />
                  </div>
                  <div className="col-12">
                    <button disabled={loading} type="submit" className="btn btn-main-two">
                      {loading ? "Đang xử lý..." : "Đăng nhập"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="row gy-4">
                  <div className="col-12">
                    <label htmlFor="reg-hoten" className="text-sm text-gray-900 fw-medium">Họ tên *</label>
                    <input
                      name="hoten"
                      defaultValue={(profile?.hoten as string) || getUserString(user, "hoten") || ""}
                      className="p-10 form-control"
                      placeholder="Nhập họ và tên của bạn..."
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label htmlFor="reg-username" className="text-sm text-gray-900 fw-medium">Tên tài khoản (username)</label>
                    <input id="reg-username" name="username" type="text" autoComplete="username" className="common-input" placeholder="tùy chọn — để trống sẽ dùng họ tên" />
                    <small className="text-xs text-muted">Bạn có thể đăng nhập bằng email hoặc số điện thoại.</small>
                  </div>
                  <div className="col-12">
                    <label htmlFor="reg-email" className="text-sm text-gray-900 fw-medium">Email</label>
                    <input id="reg-email" name="email" type="email" autoComplete="email" className="common-input" placeholder="you@example.com" />
                  </div>
                  <div className="col-12">
                    <label htmlFor="reg-password" className="text-sm text-gray-900 fw-medium">Mật khẩu *</label>
                    <input id="reg-password" name="password" type="password" autoComplete="new-password" className="common-input" placeholder="••••••••" required />
                  </div>
                  <div className="col-12">
                    <label htmlFor="reg-password-confirm" className="text-sm text-gray-900 fw-medium">Xác nhận mật khẩu *</label>
                    <input id="reg-password-confirm" name="password_confirmation" type="password" autoComplete="new-password" className="common-input" placeholder="Nhập lại mật khẩu" required />
                  </div>
                  <div className="col-12">
                    <label htmlFor="reg-sodienthoai" className="text-sm text-gray-900 fw-medium">Số điện thoại</label>
                    <input id="reg-sodienthoai" name="sodienthoai" type="tel" autoComplete="tel" className="common-input" placeholder="098xxxxxxx" />
                  </div>
                  <div className="col-12">
                    <button disabled={loading} type="submit" className="btn btn-main-two">
                      {loading ? "Đang xử lý..." : "Tạo tài khoản"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </>
        ) : (
          <form key={String(profile?.id ?? "no-profile")} onSubmit={handleSaveProfile} className="row">
            <div className="row g-12">
              <div className="p-16 border border-gray-100 rounded-8 w-100">
                <div className="row">
                  <div className="py-10 col-xl-8">
                    <h6 className="mb-20 text-gray-700 fw-semibold text-md">Thông tin cá nhân</h6>

                    <div className="mb-20 row">
                      <div className="flex-wrap gap-2 col-xl-3 flex-align flex-center">
                        <div className="mx-16 mt-10 mb-0 avatar-container">
                          <img
                            id="avatarImage"
                            src={avatarPreview || "/assets/images/default-avatar.png"}
                            alt="Avatar"
                            className="avatar-img"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/assets/images/default-avatar.png"; }}
                            style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '50%' }}
                          />
                          <input
                            type="file"
                            id="fileInput"
                            name="avatar"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(ev) => {
                              const f = (ev.target as HTMLInputElement).files?.[0];
                              if (f) setAvatarPreview(URL.createObjectURL(f));
                            }}
                          />
                        </div>
                        <label className="text-xs text-gray-500 form-label fw-medium" htmlFor="fileInput" style={{ cursor: 'pointer' }}>
                          <i className="ph-bold ph-pencil-simple" /> đổi ảnh
                        </label>
                      </div>

                      <div className="col-xl-9">
                        <div className="form-group">
                          <label className="text-gray-900 form-label text-md">Tên người dùng:</label>
                          <input
                            type="text"
                            id="username"
                            className="p-10 form-control bg-gray-50 disabled"
                            value={String(profile?.username ?? getUserString(user, "username") ?? "")}
                            readOnly
                          />
                        </div>

                        <div className="mt-10 form-group">
                          <label className="text-gray-900 form-label text-md">Họ và tên:</label>
                          <input
                            name="hoten"
                            defaultValue={(profile?.hoten as string) || getUserString(user, "hoten") || ""}
                            className="p-10 form-control"
                            placeholder="Nhập họ và tên của bạn..."
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-20 row">
                      <div className="col-xl-6">
                        <div className="form-group">
                          <label className="text-gray-900 form-label text-md" htmlFor="gioitinh">Giới tính:</label>
                          <select
                            name="gioitinh"
                            id="gioitinh"
                            defaultValue={(profile?.gioitinh as string) || ""}
                            className="p-10 form-control"
                            required
                          >
                            <option value="">Không xác định</option>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                          </select>
                        </div>
                      </div>

                      <div className="col-xl-6">
                        <div className="form-group">
                          <label className="text-gray-900 form-label text-md" htmlFor="ngaysinh">Ngày sinh:</label>
                          <input
                            type="date"
                            id="ngaysinh"
                            name="ngaysinh"
                            defaultValue={(profile?.ngaysinh as string) || ""}
                            className="p-10 form-control"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      title="Lưu thông tin cá nhân"
                      disabled={loading}
                      type="submit"
                      className="gap-8 px-32 py-12 text-white btn bg-main-600 hover-bg-main-300 hover-text-main-600 rounded-8 w-100 flex-center flex-align"
                    >
                      <i className="ph-bold ph-floppy-disk" /> {loading ? 'Đang lưu...' : 'Lưu thông tin'}
                    </button>
                  </div>

                  <div className="py-10 border-gray-200 col-xl-4 border-start">
                    <h6 className="mb-20 text-gray-700 fw-semibold text-md">Thông tin liên hệ</h6>

                    <div className="mb-10 form-group">
                      <div className="flex-align flex-between">
                        <label className="gap-8 text-gray-900 form-label text-md flex-align" htmlFor="sodienthoai">
                          <i className="ph-bold ph-phone" /> Số điện thoại:
                        </label>
                        <button
                          type="button"
                          onClick={() => { setEditingPhone((v) => !v); if (!editingPhone) setTimeout(() => document.getElementById('sodienthoai')?.focus(), 0); }}
                          className="gap-4 p-0 text-xs bg-transparent border-0 text-primary-700 flex-align fw-normal"
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="ph-bold ph-pencil-simple" /> {editingPhone ? 'Hủy' : 'Chỉnh sửa'}
                        </button>
                      </div>
                      <input
                        type="text"
                        id="sodienthoai"
                        name="sodienthoai"
                        defaultValue={getUserString(profile, "sodienthoai") ?? getUserString(user, "sodienthoai") ?? ""}
                        className={'form-control p-10 ' + (editingPhone ? '' : 'bg-gray-50 disabled')}
                        readOnly={!editingPhone}
                      />
                    </div>

                    <div className="form-group">
                      <div className="flex-align flex-between">
                        <label className="gap-8 text-gray-900 form-label text-md flex-align" htmlFor="email">
                          <i className="ph-bold ph-envelope" /> Email:
                        </label>
                        <button
                          type="button"
                          onClick={() => { setEditingEmail((v) => !v); if (!editingEmail) setTimeout(() => document.getElementById('email')?.focus(), 0); }}
                          className="gap-4 p-0 text-xs bg-transparent border-0 text-primary-700 flex-align fw-normal"
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="ph-bold ph-pencil-simple" /> {editingEmail ? 'Hủy' : 'Chỉnh sửa'}
                        </button>
                      </div>
                      <input
                        type="text"
                        id="email"
                        name="email"
                        defaultValue={getUserString(profile, "email") ?? getUserString(user, "email") ?? ""}
                        className={'form-control p-10 ' + (editingEmail ? '' : 'bg-gray-50 disabled')}
                        readOnly={!editingEmail}
                      />
                    </div>

                    <span className="pt-20 mt-20 text-gray-700 border-gray-100 border-top d-block" />

                    <h6 className="mb-20 text-gray-700 fw-semibold text-md">Thông tin bảo mật</h6>
                    <div className="mb-10 form-group">
                      <div className="flex-align flex-between">
                        <label className="gap-8 m-0 text-gray-900 form-label text-md flex-align">
                          <i className="ph-bold ph-lock" /> Đổi mật khẩu:
                        </label>
                        <button type="button" onClick={() => setShowChangePassword(true)} className="gap-4 p-0 text-sm bg-transparent border-0 text-primary-700 flex-align fw-normal" style={{ cursor: 'pointer' }}>
                          <i className="ph-bold ph-pencil-simple"></i> Chỉnh sửa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </AccountShell>
    </>
  );
}