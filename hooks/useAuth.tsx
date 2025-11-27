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
  setUser: (u: AuthUser | null) => void;
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
  const API = process.env.NEXT_PUBLIC_SERVER_API || "http://148.230.100.215";

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

  // Fix eslint: Thêm dependency 'token'
  useEffect(() => {
    const currentToken = Cookies.get(TOKEN_KEY);
    if (currentToken && currentToken !== token) {
      setToken(currentToken);
    }
  }, [token]);

  useEffect(() => {
    if (token && !user) {
      fetchMe(token);
    }
  }, [token, user, fetchMe]);

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
    logout,
    setUser: setUserState,
  }), [user, token, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}