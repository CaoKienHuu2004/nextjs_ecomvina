const CART_STORAGE_KEY = "marketpro_cart";
import Cookies from "js-cookie";

type LocalCartItem = {
  id_bienthe: number;
  soluong: number;
};

// Kiểm tra xem user đã đăng nhập chưa (dựa vào cookie access_token)
function isUserLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  const token = Cookies.get("access_token");
  return !!token && token.length > 10;
}

// Lưu vào localStorage
function saveToLocalCart(id_bienthe: number, soluong: number) {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    const cart: LocalCartItem[] = saved ? JSON.parse(saved) : [];

    const existingIndex = cart.findIndex(item => item.id_bienthe === id_bienthe);

    if (existingIndex >= 0) {
      cart[existingIndex].soluong += soluong;
    } else {
      cart.push({ id_bienthe, soluong });
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (err) {
    console.error("Lỗi lưu giỏ hàng local:", err);
  }
}

export async function addToCart(id_bienthe: number, soluong = 1) {
  console.log("🛒 addToCart called:", { id_bienthe, soluong });

  // Chuẩn hoá API base để cookie đi kèm
  const raw = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";
  const API = (() => {
    try {
      if (typeof window === "undefined") return raw;
      const u = new URL(raw);
      const host = window.location.hostname; // "localhost" | "127.0.0.1"
      if (
        (u.hostname === "127.0.0.1" && host === "localhost") ||
        (u.hostname === "localhost" && host === "127.0.0.1")
      ) u.hostname = host;
      return u.origin;
    } catch { return raw; }
  })();

  const loggedIn = isUserLoggedIn();
  console.log("🔐 User logged in:", loggedIn);
  console.log("🌐 API URL:", API);

  // Nếu chưa đăng nhập, lưu vào localStorage
  if (!loggedIn) {
    console.log("💾 Saving to localStorage...");
    saveToLocalCart(id_bienthe, soluong);
    console.log("✅ Saved to localStorage successfully");
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY) || "[]";
      const cart = JSON.parse(saved) as unknown;
      const count = Array.isArray(cart)
        ? cart.reduce((s: number, it: unknown) => {
          const obj = it as Record<string, unknown>;
          const q = (it && typeof it === 'object' && 'soluong' in obj) ? Number(String(obj.soluong)) || 0 : 0;
          return s + q;
        }, 0)
        : 0;
      window.dispatchEvent(new CustomEvent("cart:updated", { detail: { count } }));
    } catch { }
    return { status: true, message: "Đã thêm vào giỏ hàng" };
  }

  // Đã đăng nhập, gọi API server
  const token = Cookies.get("access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}/api/toi/giohang/init`, {
    method: "POST",
    headers,
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify({ id_bienthe: String(id_bienthe), soluong: Number(soluong) }),
  });

  if (!res.ok) {
    let msg = `Thêm vào giỏ thất bại (HTTP ${res.status}).`;
    try { const data = await res.json(); if (data?.message) msg += ` ${String(data.message)}`; } catch { }
    console.warn(msg); // <-- nhìn console để biết lý do (401/422…)
    throw new Error(msg);
  }

  try {
    // Fetch server cart to compute count
    try {
      const listRes = await fetch(`${API}/api/toi/giohang`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (listRes.ok) {
        const j = await listRes.json();
        const data = j?.data as unknown;
        const count = Array.isArray(data)
          ? data.reduce((s: number, it: unknown) => {
            const obj = it as Record<string, unknown>;
            const q = (it && typeof it === 'object' && 'soluong' in obj) ? Number(String(obj.soluong)) || 0 : 0;
            return s + q;
          }, 0)
          : 0;
        window.dispatchEvent(new CustomEvent("cart:updated", { detail: { count } }));
      } else {
        window.dispatchEvent(new CustomEvent("cart:updated"));
      }
    } catch {
      window.dispatchEvent(new CustomEvent("cart:updated"));
    }
  } catch { }
  return res.json();
}