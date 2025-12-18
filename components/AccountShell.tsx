"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"; 
import { useWishlist } from "@/hooks/useWishlist";

export type AccountShellProps = {
  title?: string;
  current?: "wishlist" | "cart" | "orders" | "profile" | string;
  children: React.ReactNode;
};

export default function AccountShell({
  title = "Tài khoản",
  current = "wishlist",
  children,
}: AccountShellProps) {
  const router = useRouter();
  
  // 2. Lấy thông tin user và hàm logout từ AuthContext toàn cục
  // Dữ liệu này đã được đồng bộ từ Server (layout.tsx) nên sẽ có ngay lập tức
  const { user, logout } = useAuth();
  const { count: wishlistCount } = useWishlist();

  // 3. Helper xử lý ảnh Avatar (giống logic FullHeader)
  const getAvatarUrl = (path?: string) => {
    const defaultAvatar = "/assets/images/default-avatar.png";
    if (!path) return defaultAvatar;
    
    // Nếu ảnh đã là link tuyệt đối (google, facebook...) thì giữ nguyên
    if (path.startsWith("http")) return path;
    
    // Nếu ảnh từ server Laravel (tương đối), nối thêm domain
    // Bạn có thể thay hardcode IP bằng process.env.NEXT_PUBLIC_SERVER_API
    return `https://sieuthivina.cloud${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // 4. Chuẩn bị dữ liệu hiển thị
  const avatarSrc = getAvatarUrl(user?.avatar);
  const displayName = user?.hoten || user?.username || "Khách";
  const displayUsername = user?.username ? `@${user.username}` : "";

  // Mock notification counts
  const notifications = {
    unread: 1,
    orders: 0,
    vouchers: 0,
    news: 0,
  };

  const tabs: { key: AccountShellProps["current"]; label: string; href: string; icon: string }[] = [
    { key: "profile", label: "Thông tin cá nhân", href: "/tai-khoan", icon: "ph ph-user" },
    { key: "notifications", label: "Hiện thông báo", href: "/thong-bao", icon: "ph ph-bell" },
    { key: "orders", label: "Đơn hàng của tôi", href: "/don-hang", icon: "ph ph-notepad" },
    { key: "addresses", label: "Sổ địa chỉ", href: "/dia-chi", icon: "ph ph-map-pin" },
    { key: "reviews", label: "Đánh giá sản phẩm", href: "/danh-gia", icon: "ph ph-star" },
    { key: "wishlist", label: "Sản phẩm yêu thích", href: "/yeu-thich", icon: "ph ph-heart" },
    // { key: "cart", label: "Giỏ hàng", href: "/gio-hang", icon: "ph ph-shopping-cart" },
    { key: "support", label: "Hỗ trợ khách hàng", href: "/tai-khoan/support", icon: "ph ph-headset" },
  ];

  const handleLogout = () => {
    logout(); // Gọi hàm logout chuẩn của useAuth (xóa cookie, reset state, redirect)
  };

  return (
    <>
      <section className="py-24">
        <div className="container container-lg">
          <div className="gap-8 mb-16 text-sm text-gray-600 d-flex align-items-center">
            <Link href="/" className="link">Trang chủ</Link>
            <span>/</span>
            <span>{title}</span>
          </div>

          <div className="row g-16">
            <aside className="col-lg-3">
              <div className="shop-sidebar">
                <button type="button" className="w-32 h-32 mt-8 border border-gray-100 shop-sidebar__close d-lg-none d-flex flex-center rounded-circle hover-bg-main-600 position-absolute inset-inline-end-0 me-10 hover-text-white hover-border-main-600">
                  <i className="ph ph-x" />
                </button>

                <div className="p-16 pb-0 mb-20 bg-white border border-gray-100 shop-sidebar__box rounded-8">
                  <div className="pb-16 mb-16 border-gray-100 border-bottom">
                    <Link href="/thong-tin-ca-nhan" className="gap-12 px-16 py-8 mb-0 bg-gray-50 rounded-8 flex-between d-flex" style={{ justifyContent: "start" }}>
                      <span className="flex-shrink-0 text-xl bg-white text-main-600 rounded-circle flex-center" style={{ width: 45, height: 45 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatarSrc} alt="avatar" className="w-100 h-100 object-fit-cover rounded-circle" />
                      </span>
                      <div className="d-flex flex-column">
                        <span className="text-xs text-neutral-600"><span className="fw-medium">{displayUsername.replace(/^@/, "")}</span></span>
                        <span className="text-md text-neutral-600"><span className="fw-semibold">{displayName}</span></span>
                      </div>
                    </Link>
                  </div>

                  <ul className="overflow-y-auto max-h-540 scroll-sm" style={{ listStyle: "none", paddingLeft: 0 }}>
                    {tabs.map((t) => {
                      const isCurrent = current === t.key;
                      return (
                        <li key={t.key} className="mb-6">
                          <Link
                            href={t.href}
                            className={`px-16 py-8 d-flex justify-content-start align-items-center gap-12 mb-0 rounded-8 w-100 ${isCurrent ? "border border-main-600 text-main-600" : "text-neutral-600 hover-bg-main-50 hover-text-main-600"}`}
                            style={{ display: "flex", justifyContent: "start", alignItems: "center" }}
                          >
                            <span className="gap-12 fw-medium text-md d-flex align-items-center">
                              <i className={t.icon} /> <span>{t.label}</span>
                            </span>
                            {t.key === "wishlist" && wishlistCount > 0 && (
                              <span className="px-6 py-4 badge bg-success-600 ms-auto" aria-label={`Yêu thích: ${wishlistCount}`}>
                                {wishlistCount}
                              </span>
                            )}
                            {t.key === "notifications" && notifications.unread > 0 && <span className="px-6 py-4 badge bg-main-600 ms-auto">!</span>}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mb-32 shop-sidebar__box rounded-8 d-flex justify-content-between">
                  <button type="button" title="Đăng xuất" onClick={handleLogout} className="gap-8 px-32 py-12 btn border-main-600 text-main-600 hover-bg-main-600 hover-border-main-600 hover-text-white rounded-8 w-100 d-flex justify-content-center align-items-center">
                    <i className="ph ph-sign-out" /> <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </aside>
            

            <main className="col-lg-9">
              
                {children}
              
            </main>
          </div>
        </div>
      </section>
    </>
  );
}