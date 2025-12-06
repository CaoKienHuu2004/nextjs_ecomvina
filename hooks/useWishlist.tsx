"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Ctx = {
  ids: Set<number>;
  isWished: (id: number) => boolean;
  add: (id: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  toggle: (id: number) => Promise<void>;
  count: number;
  loading: boolean;
};

const WishlistContext = createContext<Ctx | null>(null);

function useWishlistCore(): Ctx {
  const API = process.env.NEXT_PUBLIC_SERVER_API || "http://148.230.100.215";
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  // load lần đầu
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(`${API}/api/toi/yeuthichs`, {
          headers: { Accept: "application/json" },
          credentials: "include",
        });

        if (res.status === 401) {
          // guest mode (localStorage)
          const raw = localStorage.getItem("guest_wishlist") || "[]";
          const arr = JSON.parse(raw) as number[];
          if (alive) setIds(new Set(arr));
          return;
        }

        const json = await res.json();

        // ----- parse data không dùng any -----
        const raw = Array.isArray(json?.data) ? json.data : json?.data?.data || [];

        const hasId = (v: unknown): v is { id: unknown } =>
          typeof v === "object" && v !== null && "id" in v;

        const hasProduct = (v: unknown): v is { product: unknown } =>
          typeof v === "object" && v !== null && "product" in v;

        const toNumber = (x: unknown): number | null => {
          const n = typeof x === "number" ? x : typeof x === "string" ? parseFloat(x) : NaN;
          return Number.isFinite(n) ? n : null;
        };

        const toId = (row: unknown): number | null => {
          // 1) { product: { id } }
          if (hasProduct(row) && hasId((row as { product: unknown }).product)) {
            return toNumber((row as { product: { id: unknown } }).product.id);
          }
          // 2) { product_id }
          if (typeof row === "object" && row !== null && "product_id" in (row as Record<string, unknown>)) {
            return toNumber((row as { product_id: unknown }).product_id);
          }
          // 3) { id } – fallback
          if (hasId(row)) return toNumber((row as { id: unknown }).id);
          return null;
        };

        const arr = Array.isArray(raw) ? raw : [];
        const idList = arr.map(toId).filter((n): n is number => n !== null);

        if (alive) setIds(new Set(idList));
      } catch (error) {
        // API không khả dụng - sử dụng guest mode từ localStorage
        console.warn("Wishlist API không khả dụng, sử dụng localStorage:", error);
        const raw = localStorage.getItem("guest_wishlist") || "[]";
        try {
          const arr = JSON.parse(raw) as number[];
          if (alive) setIds(new Set(arr));
        } catch {
          if (alive) setIds(new Set());
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [API]);

  // persist guest wishlist ids
  const persistGuest = useCallback((next: Set<number>) => {
    localStorage.setItem("guest_wishlist", JSON.stringify(Array.from(next)));
  }, []);

  const isWished = useCallback((id: number) => ids.has(id), [ids]);

  const add = useCallback(async (id: number) => {
    setIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev); next.add(id);
      return next;
    });
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API}/api/toi/yeuthichs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: id }),
      });
      if (res.status === 401) {
        // guest mode
        setIds(prev => { const next = new Set(prev); next.add(id); persistGuest(next); return next; });
      }
    } catch {
      // rollback nhẹ nếu muốn
    }
  }, [API, persistGuest]);

  const remove = useCallback(async (id: number) => {
    setIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev); next.delete(id);
      return next;
    });
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API}/api/toi/yeuthichs/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (res.status === 401) {
        // guest mode
        setIds(prev => { const next = new Set(prev); next.delete(id); persistGuest(next); return next; });
      }
    } catch {
      // rollback nhẹ nếu muốn
    }
  }, [API, persistGuest]);

  const toggle = useCallback(async (id: number) => {
    if (ids.has(id)) await remove(id); else await add(id);
  }, [ids, add, remove]);

  const count = ids.size;

  return useMemo(() => ({ ids, isWished, add, remove, toggle, count, loading }), [ids, isWished, add, remove, toggle, count, loading]);
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const value = useWishlistCore();
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within <WishlistProvider>");
  return ctx;
}
