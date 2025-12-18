"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";


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
  gioitinh?: string;
  ngaysinh?: string;
  avatar?: string;
  diachi?: {
    id?: number;
    hoten?: string;
    sodienthoai?: string;
    diachi?: string;
    tinhthanh?: string;
    trangthai?: string;
  }[];
};

export type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (payload: { username: string; password: string }) => Promise<void>;
  // 2. Sử dụng Type RegisterPayload thay vì any
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateProfile: (payload: Partial<AuthUser>) => Promise<void>;
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
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.cloud";

  const changePassword = useCallback(async (current_password: string, new_password: string, new_password_confirmation: string) => {
    const t = Cookies.get(TOKEN_KEY) || token;
    if (!t) throw new Error("Chưa đăng nhập");
    const res = await fetch(`${API}/api/auth/cap-nhat-mat-khau`, {
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
      const res = await fetch(`${API}/api/auth/thong-tin-nguoi-dung`, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json" 
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
            const mappedUser: AuthUser = {
                id: data.user.id,
                username: data.user.username,
                hoten: data.user.hoten,
                sodienthoai: data.user.sodienthoai,
                gioitinh: data.user.gioitinh,
                ngaysinh: data.user.ngaysinh,
                avatar: data.user.avatar,
                diachi: data.user.diachi
            };
            setUserState(mappedUser);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [API]);

  // --- Login ---
  // Fix eslint: Thêm dependency 'API' và 'fetchMe'
  const login = useCallback(async ({ username, password }: { username: string; password: string }) => {
    const res = await fetch(`${API}/api/auth/dang-nhap`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) throw new Error("Đăng nhập thất bại");

    const data = await res.json();
    
    if (data.success && data.token) {
      Cookies.set(TOKEN_KEY, data.token, { expires: 1, path: '/' });
      setToken(data.token);
      await fetchMe(data.token);
    }
  }, [API, fetchMe]);

  // --- Register ---
  // 3. Fix lỗi any ở tham số payload
  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await fetch(`${API}/api/auth/dang-ky`, {
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
  const updateProfile = useCallback(async (payload: Partial<AuthUser>) => {
    try {
      const t = Cookies.get(TOKEN_KEY) || token;
      if (!t) throw new Error("Chưa đăng nhập");
      const res = await fetch(`${API}/api/auth/cap-nhat-thong-tin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${t}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Cập nhật thất bại");
      }
      const data = await res.json();
      // API có thể trả về user trong data.user hoặc data.data
      const returned = data.user ?? data.data ?? data;
      if (returned) {
        const mappedUser: AuthUser = {
          id: returned.id ?? user?.id ?? "",
          username: returned.username ?? returned.email ?? user?.username,
          hoten: returned.hoten ?? user?.hoten,
          sodienthoai: returned.sodienthoai ?? user?.sodienthoai,
          gioitinh: returned.gioitinh ?? user?.gioitinh,
          ngaysinh: returned.ngaysinh ?? user?.ngaysinh,
          avatar: returned.avatar ?? user?.avatar,
          diachi: returned.diachi ?? user?.diachi,
        };
        setUserState(mappedUser);
      }
    } catch (e) {
      // rethrow so callers can show error
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