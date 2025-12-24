"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

// --- Cấu hình hằng số ---
const TOKEN_KEY = "access_token";
const USER_INFO_KEY = "user_info";
const PHONE_REGEX = /^0\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- 1. HELPER: CHUẨN HÓA DỮ LIỆU ĐỊA CHỈ ---
// Giúp frontend không bị lỗi khi API trả về tên trường không nhất quán (diachi vs address, phone vs sodienthoai...)
const normalizeAddr = (a: any) => ({
  id: a?.id ?? a?.ID ?? undefined,
  id_nguoidung: a?.id_nguoidung ?? a?.user_id ?? undefined,
  // Ưu tiên hiển thị tên người nhận, fallback sang họ tên user nếu thiếu
  ten_nguoinhan: typeof a?.ten_nguoinhan === "string" ? a.ten_nguoinhan : (typeof a?.hoten === "string" ? a.hoten : (a?.name ? String(a.name) : "")),
  hoten: typeof a?.hoten === "string" ? a.hoten : undefined,
  sodienthoai: typeof a?.sodienthoai === "string" ? a.sodienthoai : (typeof a?.phone === "string" ? a.phone : undefined),
  diachi: typeof a?.diachi === "string" ? a.diachi : (typeof a?.address === "string" ? a.address : ""),
  tinhthanh: typeof a?.tinhthanh === "string" ? a.tinhthanh : undefined,
  trangthai: typeof a?.trangthai === "string" ? a.trangthai : undefined,
});

// --- 2. TYPE DEFINITIONS ---

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
  // Danh sách địa chỉ đã được chuẩn hóa
  danh_sach_diachi?: ReturnType<typeof normalizeAddr>[] | null;
};

export type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  
  // Các hành động Auth
  login: (payload: { phonemail: string; password: string }) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>; // <--- MỚI
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  
  // Quản lý Profile
  updateProfile: (payload: Partial<AuthUser> | FormData) => Promise<AuthUser | null>;
  refreshProfile: () => Promise<AuthUser | null>;
  changePassword: (current_password: string, new_password: string, new_password_confirmation: string) => Promise<void>;
  
  setUser: (u: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

// ========================================================================
// 3. MAIN PROVIDER
// ========================================================================

export function AuthProvider({
  children,
  initialUser
}: {
  children: React.ReactNode;
  initialUser: AuthUser | null;
}) {
  const [user, setUserState] = useState<AuthUser | null>(initialUser);
  const [token, setToken] = useState<string | null>(() => Cookies.get(TOKEN_KEY) || null);

  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";
  // Giới hạn thời gian gọi lại refresh profile (5 phút) để tránh spam API
  const REFRESH_PROFILE_MIN_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_PROFILE_REFRESH_INTERVAL_MS) || 300000;
  const lastRefreshRef = React.useRef<number>(0);

  // Load token từ cookie khi mount (để đồng bộ state)
  useEffect(() => {
    const currentToken = Cookies.get(TOKEN_KEY);
    if (currentToken) setToken(currentToken);
    
    // Nếu có user info lưu trong cookie thì load lên luôn cho nhanh (Optimistic)
    const savedUser = Cookies.get(USER_INFO_KEY);
    if (savedUser && !user) {
      try { setUserState(JSON.parse(savedUser)); } catch {}
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Helper: Map User từ API về AuthUser chuẩn ---
  const mapUserResponse = useCallback((data: any): AuthUser => {
    const candidate = data.user ?? data.data?.user ?? data.data ?? data;
    return {
      id: candidate.id ?? candidate.user_id ?? candidate.ID ?? "",
      username: candidate.username ?? candidate.email ?? candidate.name,
      hoten: candidate.hoten ?? candidate.name,
      sodienthoai: candidate.sodienthoai ?? candidate.phone,
      email: candidate.email,
      gioitinh: candidate.gioitinh,
      ngaysinh: candidate.ngaysinh,
      avatar: candidate.avatar ?? candidate.photo,
      danh_sach_diachi: Array.isArray(candidate.danh_sach_diachi ?? candidate.diachi ?? candidate.address)
        ? (candidate.danh_sach_diachi ?? candidate.diachi ?? candidate.address).map(normalizeAddr)
        : null,
    };
  }, []);

  // --- Action: Lấy thông tin user (Fetch Me) ---
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
        // Token hết hạn -> Logout
        Cookies.remove(TOKEN_KEY);
        Cookies.remove(USER_INFO_KEY);
        setToken(null);
        setUserState(null);
        return null;
      }

      const data = await res.json().catch(() => null);
      if (!data) return null;

      const mappedUser = mapUserResponse(data);
      
      setUserState(mappedUser);
      Cookies.set(USER_INFO_KEY, JSON.stringify(mappedUser), { expires: 7, path: "/" });
      
      if (!token) setToken(accessToken);
      return mappedUser;
    } catch (e) {
      console.error("fetchMe error:", e);
      return null;
    }
  }, [API, token, mapUserResponse]);

  // --- Action: Đăng nhập thường ---
  const login = useCallback(async ({ phonemail, password }: { phonemail: string; password: string }) => {
    if (!phonemail || !password) throw new Error("Vui lòng nhập thông tin đăng nhập.");
    
    // Validate cơ bản
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
    if (!res.ok) throw new Error(data?.message || "Đăng nhập thất bại");

    // Lưu token
    const accessToken = data?.access_token ?? data?.token;
    if (accessToken) {
      Cookies.set(TOKEN_KEY, String(accessToken), { expires: 7, path: "/" });
      setToken(String(accessToken));
    }

    // Lưu user info
    if (data?.user || data?.data) {
      const mapped = mapUserResponse(data);
      setUserState(mapped);
      Cookies.set(USER_INFO_KEY, JSON.stringify(mapped), { expires: 7, path: "/" });
    } else if (accessToken) {
      // Nếu API login không trả về user đầy đủ thì gọi fetchMe
      await fetchMe(String(accessToken));
    }
  }, [API, fetchMe, mapUserResponse]);

  // --- Action: Đăng nhập Google (MỚI) ---
  const loginWithGoogle = useCallback(async (googleAccessToken: string) => {
    if (!googleAccessToken) throw new Error("Không tìm thấy Google Access Token");

    const res = await fetch(`${API}/api/v1/login-google`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ access_token: googleAccessToken }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Đăng nhập Google thất bại");

    // Xử lý giống login thường
    const accessToken = data?.access_token ?? data?.token;
    if (accessToken) {
      Cookies.set(TOKEN_KEY, String(accessToken), { expires: 7, path: "/" });
      setToken(String(accessToken));
    }

    if (data?.user || data?.data) {
      const mapped = mapUserResponse(data);
      setUserState(mapped);
      Cookies.set(USER_INFO_KEY, JSON.stringify(mapped), { expires: 7, path: "/" });
    } else if (accessToken) {
      await fetchMe(String(accessToken));
    }
    
    router.refresh();
  }, [API, fetchMe, mapUserResponse, router]);

  // --- Action: Đăng ký ---
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

  // --- Action: Cập nhật Profile ---
  const updateProfile = useCallback(async (payload: Partial<AuthUser> | FormData): Promise<AuthUser | null> => {
    const t = Cookies.get(TOKEN_KEY) || token;
    if (!t) throw new Error("Chưa đăng nhập");

    const isForm = payload instanceof FormData;
    const options: RequestInit = {
      method: "POST", // Laravel thường dùng POST cho update có file (avatar)
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${t}`,
      },
      credentials: "include",
    };

    if (isForm) {
      options.body = payload as FormData;
    } else {
      // @ts-ignore
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(payload);
    }

    const res = await fetch(`${API}/api/v1/thong-tin-ca-nhan/cap-nhat`, options);
    const j = await res.json().catch(() => ({}));
    
    if (!res.ok) throw new Error(j?.message ?? "Cập nhật thất bại");

    // Update state với data mới từ server trả về
    const mapped = mapUserResponse(j);
    
    // Giữ lại danh sách địa chỉ cũ nếu server không trả về địa chỉ trong API update
    if (!mapped.danh_sach_diachi && user?.danh_sach_diachi) {
      mapped.danh_sach_diachi = user.danh_sach_diachi;
    }

    Cookies.set(USER_INFO_KEY, JSON.stringify(mapped), { expires: 7, path: "/" });
    setUserState(mapped);
    return mapped;
  }, [API, token, user, mapUserResponse]);

  // --- Action: Refresh Profile (Thủ công hoặc định kỳ) ---
  const refreshProfile = useCallback(async (): Promise<AuthUser | null> => {
    const now = Date.now();
    // Throttle: Không refresh quá thường xuyên nếu không cần thiết
    if (now - lastRefreshRef.current < REFRESH_PROFILE_MIN_INTERVAL_MS) {
      return user;
    }
    lastRefreshRef.current = now;

    const t = Cookies.get(TOKEN_KEY) || token;
    if (!t) return null;

    return await fetchMe(t);
  }, [user, token, fetchMe, REFRESH_PROFILE_MIN_INTERVAL_MS]);

  // --- Action: Đổi mật khẩu ---
  const changePassword = useCallback(async (current_password: string, new_password: string, new_password_confirmation: string) => {
    const t = Cookies.get(TOKEN_KEY) || token;
    if (!t) throw new Error("Chưa đăng nhập");
    
    const res = await fetch(`${API}/api/v1/thong-tin-ca-nhan/cap-nhat-mat-khau`, {
      method: "POST", // Hoặc PATCH tùy route backend
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify({ current_password, new_password, new_password_confirmation }),
    });
    
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.message ?? "Không thể đổi mật khẩu");
  }, [API, token]);

  // --- Action: Đăng xuất ---
  const logout = useCallback(() => {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(USER_INFO_KEY);
    setToken(null);
    setUserState(null);
    router.refresh();
    router.push("/dang-nhap");
  }, [router]);

  // --- Context Value ---
  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    isLoggedIn: !!user,
    login,
    loginWithGoogle, // <--- Export
    register,
    updateProfile,
    logout,
    refreshProfile,
    setUser: setUserState,
    changePassword,
  }), [user, token, login, loginWithGoogle, register, updateProfile, logout, refreshProfile, changePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

// Helper để lấy header auth ở nơi khác nếu cần
export const getAuthHeaders = (): Record<string, string> => {
  const t = Cookies.get(TOKEN_KEY) || null;
  const base: Record<string, string> = { Accept: "application/json" };
  if (t) base.Authorization = `Bearer ${t}`;
  return base;
};
