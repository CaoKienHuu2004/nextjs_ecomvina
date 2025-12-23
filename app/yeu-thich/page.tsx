"use client";

import React from "react";
import AccountShell from "@/components/AccountShell";
import ProductCardV2 from "@/components/ProductCardV2";
import { useWishlist } from "@/hooks/useWishlist";
import FullHeader from "@/components/FullHeader";
import Cookies from "js-cookie";

/** Kiểu tối thiểu cho item trả về từ API */
type WishProduct = {
  is_free?: boolean;
  id?: number | string;
  ten?: string;
  giagiam_min?: number | string;
  giagiam_max?: number | string;
  gia_min?: number | string;
  gia_max?: number | string;
  hinhanhsanpham?: string; // optional in type, we always supply fallback on use
  slug?: string;
};

// Kiểu record trả về từ /api/tai-khoan/yeuthichs
type FavoriteRecord = {
  id: number;
  id_sanpham?: number;
  ten?: string;
  gia_min?: number;
  hinhanh?: string;
  sanpham?: { id?: number; tensanpham?: string; hinhanhsanpham?: { url?: string }[] };
};

export default function WishlistPage() {
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com/api/v1";

  // Hook wishlist (keeps a local Set of IDs for quick UI)
  const { ids, isWished, toggle } = useWishlist();

  const [favoriteRecords, setFavoriteRecords] = React.useState<FavoriteRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<WishProduct[]>([]);

  // helper: lấy auth header từ cookie
  const getAuthHeaders = React.useCallback((): Record<string,string> => {
    const token = Cookies.get("access_token") || Cookies.get("token") || null;
    return token ? { Accept: "application/json", Authorization: `Bearer ${token}` } : { Accept: "application/json" };
  }, []);

  // Fetch favorites (single request)
  const fetchFavorites = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/`, {
        headers: getAuthHeaders(),
        // credentials: 'include',
      });
      if (!res.ok) throw new Error(`Fav API ${res.status}`);
      const j = await res.json();
      const rawList = Array.isArray(j?.data) ? j.data : [];
      const favs = rawList as FavoriteRecord[];

      // map to UI WishProduct shape (ensuring hinhanhsanpham is a string)
      const mapped = favs.map(fr => ({
        id: fr.id_sanpham ?? fr.sanpham?.id,
        ten: fr.ten ?? fr.sanpham?.tensanpham,
        giagiam_min: fr.gia_min ?? undefined,
        hinhanhsanpham: fr.hinhanh ?? fr.sanpham?.hinhanhsanpham?.[0]?.url ?? "",
        is_free: (Number(fr.gia_min ?? 0) === 0)
      })) as WishProduct[];

      setFavoriteRecords(favs);
      setItems(mapped);
    } catch (err) {
      console.error("Lỗi fetch favorites:", err);
      setFavoriteRecords([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [API, getAuthHeaders]);

  // Add favorite (POST)
  const addFavorite = React.useCallback(async (productId: number) => {
    try {
      const res = await fetch(`${API}/api/tai-khoan/yeuthichs`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        // credentials: 'include',
        body: JSON.stringify({ id_sanpham: productId })
      });
      if (!res.ok) throw new Error('Add fav failed');
      const j = await res.json();
      const newFav = j?.data as FavoriteRecord | undefined;
      if (newFav) {
        setFavoriteRecords(prev => [newFav, ...prev]);
        setItems(prev => [{ id: newFav.id_sanpham, ten: newFav.ten, giagiam_min: newFav.gia_min, hinhanhsanpham: newFav.hinhanh ?? "", is_free: Number(newFav.gia_min ?? 0) === 0 }, ...prev]);
      } else {
        // fallback: refetch
        await fetchFavorites();
      }
    } catch (err) {
      console.error(err);
    }
  }, [API, getAuthHeaders, fetchFavorites]);

  // Remove favorite (PATCH) by favorite-record id
  const removeFavorite = React.useCallback(async (productId: number) => {
    // try to find favorite-record in memory
    const rec = favoriteRecords.find(r => (r.id_sanpham === productId) || (r.sanpham?.id === productId));
    if (!rec) {
      // fallback: refetch then return
      await fetchFavorites();
      return;
    }

    const favId = rec.id;
    // optimistic UI: remove immediately
    setItems(prev => prev.filter(it => Number(it.id) !== Number(productId)));
    setFavoriteRecords(prev => prev.filter(r => r.id !== favId));

    try {
      const res = await fetch(`${API}/api/tai-khoan/yeuthichs/${favId}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        // credentials: 'include',
        body: JSON.stringify({ trangthai: "Tạm ẩn" })
      });
      if (!res.ok) {
        // rollback
        await fetchFavorites();
      }
    } catch (err) {
      console.error('Remove fav error', err);
      await fetchFavorites();
    }
  }, [API, getAuthHeaders, favoriteRecords, fetchFavorites]);

  // small helper to parse numbers
  const toNum = React.useCallback((v: unknown): number | undefined => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = parseInt(v, 10);
      if (Number.isFinite(n)) return n;
    }
    return undefined;
  }, []);

  const getPid = React.useCallback((row: WishProduct): number => {
    const cand = toNum(row.id) ?? toNum(row.id);
    return typeof cand === "number" ? cand : 0;
  }, [toNum]);

  // On mount: load favorites once
  React.useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />
      <AccountShell title="Yêu thích" current="wishlist">
        {loading ? (
          <div>Đang tải…</div>
        ) : items.length === 0 ? (
          <div>Danh sách trống.</div>
        ) : (
          <div className="row g-12">
            {items.map((p) => {
              const pid = getPid(p);
              const img = p.hinhanhsanpham ?? "/assets/images/thumbs/product-two-img1.png";
              const name = p.ten ?? `Sản phẩm #${pid}`;
              // price comes from giagiam_min (can be string or number)
              const price = toNum(p.giagiam_min ?? p.gia_min) ?? 0;
              const isFree = price === 0 || p.is_free === true;

              // badge text (string or undefined)
              const badge = isFree ? { text: "Miễn phí", color: "primary" as const } : undefined;

              return (
                <div
                  key={pid || String(p.id)}
                  className="col-xxl-3 col-xl-4 col-lg-4 col-sm-6"
                >
                  <ProductCardV2
                    href={`${p.hinhanhsanpham ?? "#"}`}
                    img={img}
                    title={name}
                    price={price}
                    variantId={pid || undefined}
                    badge={badge}
                    showHeart
                    isWished={pid !== 0 && isWished(pid)}
                    onToggleWish={async () => {
                      const currently = pid !== 0 && isWished(pid);
                      if (currently) {
                        // remove favorite then toggle local set
                        await removeFavorite(pid);
                        toggle(pid);
                      } else {
                        await addFavorite(pid);
                        toggle(pid);
                      }
                    }}
                    showUnwishButton
                    onUnwish={async () => {
                      if (pid !== 0 && isWished(pid)) {
                        await removeFavorite(pid);
                        toggle(pid);
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </AccountShell>
    </>
  );
}