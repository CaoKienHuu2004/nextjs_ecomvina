"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const PHONE_REGEX = /^0\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegisterPayload = {
  hoten: string;
  username: string;
  password: string;
  password_confirmation: string;
  sodienthoai: string;
  email?: string;
};

export type AuthUser = {
  id: number | string;
  username?: string;
  hoten?: string;
  sodienthoai?: string;
  email?: string;
  gioitinh?: string;
  ngaysinh?: string;
  avatar?: string;
  danh_sach_diachi?: {
    id: number;
    id_nguoidung: number;
    hoten?: string;
    sodienthoai?: string;
    diachi: string;
    tinhthanh?: string;
    trangthai?: string;
  }[];
};

export type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (payload: { phonemail: string; password: string }) => Promise<void>;
  // 2. Sử dụng Type RegisterPayload thay vì any
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateProfile: (payload: Partial<AuthUser> | FormData) => Promise<AuthUser | null>;
  refreshProfile: () => Promise<AuthUser | null>;
  setUser: (u: AuthUser | null) => void;
  changePassword: (current_password: string, new_password: string, new_password_confirmation: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);
const TOKEN_KEY = "access_token";

export function AuthProvider({
  children,
  initialUser
}: {
  children: React.ReactNode;
  initialUser: AuthUser | null
}) {
  const [user, setUserState] = useState<AuthUser | null>(initialUser);
  const [token, setToken] = useState<string | null>(() => Cookies.get(TOKEN_KEY) || null);

  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";

  const REFRESH_PROFILE_MIN_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_PROFILE_REFRESH_INTERVAL_MS) || 300000;//300s
  const lastRefreshRef = React.useRef<number>(0);

  const changePassword = useCallback(async (current_password: string, new_password: string, new_password_confirmation: string) => {
    const t = Cookies.get(TOKEN_KEY) || token;
    if (!t) throw new Error("Chưa đăng nhập");
    
    const res = await fetch(`${API}/api/v1/thong-tin-ca-nhan/cap-nhat-mat-khau`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${t}`,
      },
      credentials: "include",
      body: JSON.stringify({ current_password, new_password, new_password_confirmation }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.message ?? "Không thể đổi mật khẩu");
    return;
  }, [API, token]);
  // Fix eslint: Thêm dependency 'token'
  // useEffect(() => {
  //   const currentToken = Cookies.get(TOKEN_KEY);
  //   if (currentToken && currentToken !== token) {
  //     setToken(currentToken);
  //   }
  // }, [token]);
  useEffect(() => {
    const currentToken = Cookies.get(TOKEN_KEY);
    if (currentToken) setToken(currentToken);
  }, []);
  // --- Fetch Me Helper ---
  // Dùng useCallback để tránh warning dependency ở login
  const fetchMe = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch(`${API}/api/v1/thong-tin-ca-nhan`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        credentials: "include",
      });
      if (res.status === 401) {
        Cookies.remove(TOKEN_KEY);
        setToken(null);
        setUserState(null);
        return null;
      }
      const data = await res.json().catch(() => null);
      const candidate = (data && (data.user ?? data.data?.user ?? data.data ?? data)) || null;
      if (!candidate) return null;
      const mappedUser: AuthUser = {
        id: candidate.id ?? candidate.user_id ?? candidate.ID ?? "",
        username: candidate.username ?? candidate.email ?? candidate.name,
        hoten: candidate.hoten ?? candidate.name ?? undefined,
        sodienthoai: candidate.sodienthoai ?? candidate.phone ?? undefined,
        email: candidate.email ?? undefined,
        gioitinh: candidate.gioitinh ?? undefined,
        ngaysinh: candidate.ngaysinh ?? undefined,
        avatar: candidate.avatar ?? candidate.photo ?? undefined,
        danh_sach_diachi: candidate.diachi ?? candidate.address ?? undefined,
      };
      setUserState(mappedUser);
      if (!token) setToken(accessToken);
      return mappedUser;
    } catch (e) {
      console.error("fetchMe error:", e);
      return null;
    }
  }, [API, token]);

  // Public: refreshProfile - lấy dữ liệu user mới nhất từ server (dùng cookie/token)
  const refreshProfile = useCallback(async (): Promise<AuthUser | null> => {
    const now = Date.now();
    // if called too frequently, return current cached user immediately
    if (now - lastRefreshRef.current < REFRESH_PROFILE_MIN_INTERVAL_MS) {
      return user;
    }
    lastRefreshRef.current = now;
    try {
      const t = Cookies.get(TOKEN_KEY) || token;
      const headers: Record<string, string> = { Accept: "application/json" };
      if (t) headers.Authorization = `Bearer ${t}`;
      const res = await fetch(`${API}/api/v1/thong-tin-ca-nhan`, {
        method: "GET",
        headers,
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) {
          Cookies.remove(TOKEN_KEY);
          setToken(null);
          setUserState(null);
        }
        return null;
      }
      const data = await res.json().catch(() => null);
      const candidate = (data && (data.user ?? data.data ?? data)) || null;
      if (!candidate) return null;
      const mapped: AuthUser = {
        id: candidate.id ?? candidate.user_id ?? candidate.ID ?? "",
        username: candidate.username ?? candidate.email ?? undefined,
        hoten: candidate.hoten ?? candidate.name ?? undefined,
        sodienthoai: candidate.sodienthoai ?? candidate.phone ?? undefined,
        email: candidate.email ?? undefined,
        gioitinh: candidate.gioitinh ?? undefined,
        ngaysinh: candidate.ngaysinh ?? undefined,
        avatar: candidate.avatar ?? candidate.photo ?? undefined,
        danh_sach_diachi: candidate.diachi ?? candidate.address ?? undefined,
      };
      setUserState(mapped);
      try { Cookies.set("user_info", JSON.stringify(mapped), { expires: 7, path: "/" }); } catch {}
      return mapped;
    } catch (e) {
      console.error("refreshProfile error:", e);
      return null;
    }
  }, [API, token]);

  // --- Login ---
  // Fix eslint: Thêm dependency 'API' và 'fetchMe'
  //  const login= useCallback(async ({ phonemail, password }: { phonemail: string; password: string }) => {
  //   if (!phonemail || !password) {
  //     throw new Error("Vui lòng nhập Email hoặc Số điện thoại và mật khẩu.");
  //   }
  //   // validate phonemail: phải là email hoặc số điện thoại theo regex
  //   if (!PHONE_REGEX.test(phonemail) && !EMAIL_REGEX.test(phonemail)) {
  //     throw new Error("Vui lòng nhập Email hoặc Số điện thoại hợp lệ.");
  //   }

  //   const res = await fetch(`${API}/api/v1/dang-nhap`, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json", Accept: "application/json" },
  //     credentials: "include",
  //     body: JSON.stringify({ phonemail, password }),
  //   });

  //   if (!res.ok) {
  //     const err = await res.json().catch(() => ({}));
  //     throw new Error(err.message || "Đăng nhập thất bại");
  //   }

  //   const data = await res.json();

  //   if (data.success && data.token) {
  //     Cookies.set(TOKEN_KEY, data.token, { expires: 1, path: '/' });
  //     setToken(data.token);
  //     await fetchMe(data.token);
  //   }
  // }, [API, fetchMe]);

  const login = useCallback(async ({ phonemail, password }: { phonemail: string; password: string }) => {
    if (!phonemail || !password) {
      throw new Error("Vui lòng nhập Email hoặc Số điện thoại và mật khẩu.");
    }
    if (!PHONE_REGEX.test(phonemail) && !EMAIL_REGEX.test(phonemail)) {
      throw new Error("Vui lòng nhập Email hoặc Số điện thoại hợp lệ.");
    }

    const res = await fetch(`${API}/api/v1/dang-nhap`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "include",
      body: JSON.stringify({ phonemail, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || "Đăng nhập thất bại");
    }

    // server trả access_token và user (theo ví dụ bạn gửi)
    const accessToken = data?.access_token ?? data?.token ?? data?.accessToken ?? null;
    const userPayload = data?.user ?? data?.data ?? null;

    if (accessToken) {
      // lưu cookie cục bộ (dùng fallback nếu server không dùng httpOnly cookie)
      Cookies.set(TOKEN_KEY, String(accessToken), { expires: 1, path: "/" });
      setToken(String(accessToken));
    }

    if (userPayload) {
      const mapped: AuthUser = {
        id: userPayload.id ?? userPayload.user_id ?? "",
        username: userPayload.username ?? userPayload.email ?? undefined,
        hoten: userPayload.hoten ?? userPayload.name ?? undefined,
        sodienthoai: userPayload.sodienthoai ?? userPayload.phone ?? undefined,
        email: userPayload.email ?? undefined,
        gioitinh: userPayload.gioitinh ?? undefined,
        ngaysinh: userPayload.ngaysinh ?? undefined,
        avatar: userPayload.avatar ?? userPayload.photo ?? undefined,
        danh_sach_diachi: userPayload.danh_sach_diachi ?? userPayload.diachi ?? undefined,
      };
      setUserState(mapped);
    } else if (accessToken) {
      // nếu server chỉ trả token, gọi fetchMe để lấy user
      await fetchMe(String(accessToken));
    }
  }, [API, fetchMe]);

  // --- Register ---
  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await fetch(`${API}/api/v1/dang-ky`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Đăng ký thất bại");
    }
  }, [API]);
  // --- Update profile ---
  const updateProfile = useCallback(async (payload: Partial<AuthUser> | FormData): Promise<AuthUser | null> => {
    try {
      const t = Cookies.get(TOKEN_KEY) || token;
      if (!t) throw new Error("Chưa đăng nhập");
      
      const isForm = payload instanceof FormData;
      // Server accepts POST only — always use POST. Send FormData as multipart, JSON as application/json.
      const method = "POST";
      const url = `${API}/api/v1/thong-tin-ca-nhan/cap-nhat`;
      const options: RequestInit = {
        method,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${t}`,
        },
        credentials: "include",
      };

      if (isForm) {
        options.body = payload as FormData;
        // do NOT set Content-Type header; browser will set multipart boundary
      } else {
        options.headers = { ...options.headers, "Content-Type": "application/json" };
        options.body = JSON.stringify(payload as Partial<AuthUser>);
      }
      const res = await fetch(url, options);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message ?? "Cập nhật thất bại");
      const returned = j.user ?? j.data ?? j ?? payload;
      const mappedUser: AuthUser = {
        id: returned.id ?? user?.id ?? "",
        username: returned.username ?? returned.email ?? user?.username,
        hoten: returned.hoten ?? user?.hoten,
        sodienthoai: returned.sodienthoai ?? user?.sodienthoai,
        email: returned.email ?? user?.email,
        gioitinh: returned.gioitinh ?? user?.gioitinh,
        ngaysinh: returned.ngaysinh ?? user?.ngaysinh,
        avatar: returned.avatar ?? user?.avatar,
        danh_sach_diachi: returned.danh_sach_diachi ?? user?.danh_sach_diachi,
      };
      Cookies.set("user_info", JSON.stringify(mappedUser), { expires: 7, path: "/" });
      setUserState(mappedUser);
      return mappedUser;
    } catch (e) {
      throw e;
    }
  }, [API, token, user]);

  const logout = useCallback(() => {
    Cookies.remove(TOKEN_KEY);
    setToken(null);
    setUserState(null);
    router.refresh();
    router.push("/dang-nhap");
  }, [router]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    isLoggedIn: !!user,
    login,
    register,
    updateProfile,
    logout,
    refreshProfile,
    setUser: setUserState,
    changePassword,
  }), [user, token, login, register, updateProfile, logout, changePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export const getAuthHeaders = (): Record<string, string> => {
  const t = Cookies.get(TOKEN_KEY) || null;
  const base: Record<string, string> = { Accept: "application/json" };
  if (t) base.Authorization = `Bearer ${t}`;
  return base;
};
