"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SearchBoxWithSuggestions from "@/components/SearchBoxWithSuggestions";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { initCartAnchorBySelector, setCartAnchor } from "@/utils/flyToCart";
import Cookies from "js-cookie";
import { useCart } from "@/hooks/useCart";


type FullHeaderProps = {
  showTopNav?: boolean;
  showCategoriesBar?: boolean;
  showClassicTopBar?: boolean;
};

type ApiCartItem = { quantity?: number };
type ApiCartResponse = { data?: ApiCartItem[] };
type Cat = { id: number | string; ten?: string; name?: string; slug?: string; children?: Cat[] };

function useClickAway<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onAway: () => void
) {
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) onAway();
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onAway();
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onEsc);
    };
  }, [ref, onAway]);
}

export default function FullHeader({
  showTopNav = true,
  showCategoriesBar = true,
  showClassicTopBar = true,
}: FullHeaderProps) {
  // header dropdown states
  const [langOpen, setLangOpen] = useState(false);
  const [currOpen, setCurrOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // wishlist count
  const { count: wishlistCount } = useWishlist();
  // auth state
  const { user, isLoggedIn, logout } = useAuth();
  const displayName = useMemo(() => {
    if (!isLoggedIn) return "Đăng nhập";
    return user?.hoten?.trim() || user?.username || "Tài khoản";
  }, [user, isLoggedIn]);


  // ---- Danh mục (All Categories) ----
  type DanhMuc = {
    id: number | string;
    ten?: string;    // API của bạn dùng "ten"
    name?: string;   // fallback nếu sau này đổi field
    slug?: string;
    children?: DanhMuc[]; // nếu API có trả con
  };
  const [cats, setCats] = useState<DanhMuc[]>([]);

  // Render dropdown danh mục
  const renderCategoryDropdown = () => {
    if (!showCategoryMenu || !categoryButtonRef.current) return null;

    const rect = categoryButtonRef.current.getBoundingClientRect();

    return (
      <div
        style={{
          position: 'fixed',
          top: `${rect.bottom + 4}px`,
          left: `${rect.left}px`,
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '280px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 999999,
          padding: '8px 0'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {[
          { icon: 'suc-khoe.svg', label: 'Sức khỏe', value: 'suc-khoe' },
          { icon: 'thuc-pham-chuc-nang.svg', label: 'Thực phẩm chức năng', value: 'thuc-pham-chuc-nang' },
          { icon: 'cham-soc-ca-nhan.svg', label: 'Chăm sóc cá nhân', value: 'cham-soc-ca-nhan' },
          { icon: 'lam-dep.svg', label: 'Làm đẹp', value: 'lam-dep' },
          { icon: 'dien-may.svg', label: 'Điện máy', value: 'dien-may' },
          { icon: 'thiet-bi-y-te.svg', label: 'Thiết bị y tế', value: 'thiet-bi-y-te' },
          { icon: 'bach-hoa.svg', label: 'Bách hóa', value: 'bach-hoa' },
          { icon: 'noi-that-trang-tri.svg', label: 'Nội thất - Trang trí', value: 'noi-that-trang-tri' },
          { icon: 'me-va-be.svg', label: 'Mẹ & bé', value: 'me-va-be' },
          { icon: 'thoi-trang.svg', label: 'Thời trang', value: 'thoi-trang' },
          { icon: 'thuc-pham-do-an.svg', label: 'Thực phẩm - đồ ăn', value: 'thuc-pham-do-an' }
        ].map((cat) => (
          <Link
            key={cat.value}
            href={`/shop?category=${cat.value}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              color: '#666',
              textDecoration: 'none',
              fontSize: '15px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ display: 'flex', width: '24px', height: '24px' }}>
              <img
                src={`https://sieuthivina.com/assets/client/images/categories/${cat.icon}`}
                alt={cat.label}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </span>
            <span>{cat.label}</span>
          </Link>
        ))}
      </div>
    );
  };
  const [showCategoryMenu, setShowCategoryMenu] = useState<boolean>(false);
  const categoryButtonRef = useRef<HTMLLIElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hàm xử lý đóng dropdown với delay
  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowCategoryMenu(false);
    }, 1500);
  };

  // Hàm xử lý giữ dropdown mở
  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setShowCategoryMenu(true);
  };



  // Chuẩn hoá host để cookie không rớt (localhost ↔ 127.0.0.1)
  const API = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_SERVER_API || "http://148.230.100.215";
    try {
      if (typeof window === "undefined") return raw;
      const u = new URL(raw);
      const host = window.location.hostname; // "localhost" | "127.0.0.1" | domain
      if (
        (u.hostname === "127.0.0.1" && host === "localhost") ||
        (u.hostname === "localhost" && host === "127.0.0.1")
      ) {
        u.hostname = host;
      }
      return u.origin;
    } catch {
      return raw;
    }
  }, []);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        // dùng API đã chuẩn hoá origin ở biến API
        const res = await fetch(`${API}/api/danhmucs?per_page=100`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
        if (!off) setCats(list);
      } catch {
        if (!off) setCats([]);
      }
    })();
    return () => { off = true; };
  }, [API]);

  const flagEmoji = (cc?: string | null) => {
    const code = (cc || "").trim().toUpperCase();
    if (!code || code.length !== 2) return "🌐";
    const base = 127397; // 'A' regional indicator base
    const chars = Array.from(code).map((c) =>
      String.fromCodePoint(base + c.charCodeAt(0))
    );
    return chars.join("");
  };

  const getDisplayName = (u?: typeof user) => {
    if (!u) return "Tài khoản";
    return u.hoten || u.username || "Tài khoản";
  };

  // helper avatar src (nếu có)
  const getAvatarSrc = (u?: typeof user) => {
    return u?.avatar ? String(u.avatar) : null;
  };

  // ===== refs & click-away =====
  const langRef = useRef<HTMLLIElement>(null);
  const currRef = useRef<HTMLLIElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLLIElement | null>(null);
  const cartIconRef = useRef<HTMLElement | null>(null);
  const catRefCategoryBar = useRef<HTMLDivElement | null>(null);
  const catRefTopBar = useRef<HTMLLIElement | null>(null);

  useClickAway(langRef, () => setLangOpen(false));
  useClickAway(currRef, () => setCurrOpen(false));
  useClickAway(userRef, () => setUserOpen(false));
  useClickAway(catRef, () => setCatOpen(false));
  useClickAway(catRefCategoryBar, () => setCatOpen(false));
  useClickAway(catRefTopBar, () => setCatOpen(false));

  // đóng các dropdown khác khi mở 1 cái
  function openOnly(which: "lang" | "curr" | "user" | "cat") {
    setLangOpen(which === "lang");
    setCurrOpen(which === "curr");
    setUserOpen(which === "user");
    setCatOpen(which === "cat");
  }

  // ===== Cart anchor for fly-to-cart =====
  useEffect(() => {
    // Tự dò [data-cart-icon], #cart-icon, .js-cart-icon
    initCartAnchorBySelector();
  }, []);
  useEffect(() => {
    // Nếu muốn xác định chính xác icon, set bằng ref
    if (cartIconRef.current) setCartAnchor(cartIconRef.current);
  }, [cartIconRef]);

  // ===== Cart count helpers =====
  const { totalItems } = useCart();


  return (
    <>
      {renderCategoryDropdown()}

      {/* Thanh đỏ trên cùng */}
      {showTopNav && (
        <div style={{ background: "rgb(229, 57, 53)", width: "100%", padding: "10px 0px", display: "block" }}>
          <div className="container container-lg">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {/* Nhóm trái */}
              <ul style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "16px", listStyle: "none", margin: 0, padding: 0 }}>
                <li style={{ display: "flex", alignItems: "center" }}>
                  <Link href="/dangky" style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "14px", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                    <i className="ph-bold ph-user"></i> Đăng ký thành viên
                  </Link>
                </li>
                <li style={{ display: "flex", alignItems: "center" }}>
                  <a href="#" style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "14px", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                    <i className="ph-bold ph-info"></i> Giới thiệu về Siêu Thị Vina
                  </a>
                </li>
                <li style={{ display: "flex", alignItems: "center" }}>
                  <a href="#" style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "14px", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                    <i className="ph-bold ph-chat-dots"></i> Liên hệ hỗ trợ
                  </a>
                </li>
              </ul>
              {/* Nhóm phải */}
              <ul style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "16px", listStyle: "none", margin: 0, padding: 0 }}>
                <li style={{ display: "flex", alignItems: "center", position: "relative" }}>
                  <a href="#" style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "14px", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                    <i className="ph ph-squares-four"></i> Danh mục
                  </a>
                </li>
                <li style={{ display: "flex", alignItems: "center" }}>
                  <Link href="/orders" style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "14px", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                    <i className="ph-bold ph-notepad"></i> Tra cứu đơn hàng
                  </Link>
                </li>
                <li style={{ display: "flex", alignItems: "center" }}>
                  <Link href="/gio-hang" style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "14px", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                    <i className="ph-bold ph-shopping-cart"></i> Giỏ hàng
                    <span style={{ background: "rgb(0, 230, 118)", color: "rgb(255, 255, 255)", borderRadius: "4px", padding: "2px 6px", marginLeft: "4px", fontSize: "13px" }}>
                      {totalItems}
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* HEADER MIDDLE */}
      {showTopNav && (
        <header className="header border-bottom border-neutral-40 pt-16 pb-10" style={{ zIndex: 99, overflow: 'visible' }}>
          <div className="container container-lg" style={{ overflow: 'visible' }}>
            <nav className="header-inner flex-between gap-16" style={{ overflow: 'visible' }}>
              {/* Logo */}
              <div className="logo">
                <Link href="/" className="link" aria-label="Trang chủ Siêu Thị Vina">
                  <img
                    src="https://sieuthivina.com/assets/client/images/logo/logo_nguyenban.png"
                    alt="Logo"
                    width={140}
                    height={40}
                  />
                </Link>
              </div>

              {/* Desktop Search + Keywords */}
              <div className="header-menu w-50 d-lg-block d-none" style={{ overflow: 'visible' }}>
                <div className="mx-20" style={{ overflow: 'visible' }}>
                  <SearchBoxWithSuggestions placeholder="Sâm Ngọc Linh...." />
                  <div className="flex-align mt-10 gap-12 title">
                    <Link href="/shop?query=sâm ngọc linh" className="text-sm link text-gray-600 hover-text-main-600 fst-italic">
                      Sâm Ngọc Linh
                    </Link>
                    <Link href="/shop?query=sách hán ngữ 3" className="text-sm link text-gray-600 hover-text-main-600 fst-italic">
                      Sách hán ngữ 3
                    </Link>
                    <Link href="/shop?query=móc khóa genshin" className="text-sm link text-gray-600 hover-text-main-600 fst-italic">
                      Móc khóa genshin
                    </Link>
                    <Link href="/shop?query=đồ chơi minecraft" className="text-sm link text-gray-600 hover-text-main-600 fst-italic">
                      Đồ chơi minecraft
                    </Link>
                    <Link href="/shop?query=điện nội thất" className="text-sm link text-gray-600 hover-text-main-600 fst-italic">
                      Điện nội thất
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right side + Mobile toggle */}
              <div className="header-right flex-align">
                <ul className="header-top__right style-two style-three flex-align flex-wrap d-lg-block d-none">
                  <li className="d-sm-flex d-none">
                    <Link
                      className="d-flex align-items-center gap-10 fw-medium text-main-600 py-10 px-20 bg-main-50 rounded-pill line-height-1 hover-bg-main-600 hover-text-white"
                      href={isLoggedIn ? "/account" : "/dang-nhap"}
                      style={{ transition: 'all 0.3s ease' }}
                    >
                      {isLoggedIn && user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={displayName}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #f2572b'
                          }}
                        />
                      ) : (
                        <span className="d-flex line-height-1">
                          <i className="ph-bold ph-user"></i>
                        </span>
                      )}
                      <span>{displayName}</span>
                    </Link>
                  </li>
                </ul>
                <div
                  ref={userRef}
                  className="d-none"
                >
                  {userOpen && (
                    <ul
                      role="menu"
                      className="bg-white rounded-md shadow common-dropdown nav-submenu scroll-sm position-absolute"
                    >
                      <li
                        className="common-dropdown__item nav-submenu__item"
                        role="none"
                      >
                        <Link
                          href="/wishlist"
                          role="menuitem"
                          className="common-dropdown__link nav-submenu__link text-heading-two hover-bg-neutral-100"
                          data-cart-icon
                        >
                          <i className="ph-bold ph-heart text-main-600"></i>
                          Yêu thích
                          <span className="badge bg-success-600 rounded-circle ms-8">
                            {wishlistCount}
                          </span>
                        </Link>
                      </li>
                      {isLoggedIn ? (
                        <>
                          <li
                            className="common-dropdown__item nav-submenu__item"
                            role="none"
                          >
                            <Link
                              href="/dang-nhap"
                              role="menuitem"
                              className="common-dropdown__link nav-submenu__link text-heading-two hover-bg-neutral-100"
                            >
                              <i className="ph-bold ph-user text-main-600"></i>
                              Tài khoản
                            </Link>
                          </li>
                          <li
                            className="common-dropdown__item nav-submenu__item"
                            role="none"
                          >
                            <Link
                              href="/orders"
                              role="menuitem"
                              className="common-dropdown__link nav-submenu__link text-heading-two hover-bg-neutral-100"
                            >
                              <i className="ph-bold ph-notepad text-main-600"></i>
                              Đơn hàng của tôi
                            </Link>
                          </li>
                          <li
                            className="common-dropdown__item nav-submenu__item"
                            role="none"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                logout();
                                setUserOpen(false);
                              }}
                              className="btn-reset common-dropdown__link nav-submenu__link text-heading-two hover-bg-neutral-100 w-100 text-start"
                            >
                              <i className="ph-bold ph-sign-out text-main-600"></i>
                              Đăng xuất
                            </button>
                          </li>
                        </>
                      ) : (
                        <>
                          <li
                            className="common-dropdown__item nav-submenu__item"
                            role="none"
                          >
                            <Link
                              href="/dang-nhap"
                              role="menuitem"
                              className="common-dropdown__link nav-submenu__link text-heading-two hover-bg-neutral-100"
                            >
                              <i className="ph-bold ph-sign-in text-main-600"></i>
                              Đăng nhập
                            </Link>
                          </li>
                          <li
                            className="common-dropdown__item nav-submenu__item"
                            role="none"
                          >
                            <Link
                              href="/dang-nhap"
                              role="menuitem"
                              className="common-dropdown__link nav-submenu__link text-heading-two hover-bg-neutral-100"
                            >
                              <i className="ph-bold ph-user-plus text-main-600"></i>
                              Đăng ký
                            </Link>
                          </li>
                        </>
                      )}
                    </ul>
                  )}
                </div>

                <button
                  type="button"
                  className="toggle-mobileMenu d-lg-none ms-3n text-gray-800 text-4xl d-flex"
                  onClick={() => setMobileOpen((s) => !s)}
                >
                  <i className="ph ph-list"></i>
                </button>
              </div>
            </nav>
          </div>
        </header>
      )}


      {/* SECOND HEADER (categories/search/actions) */}
      {showTopNav ? (
        showCategoriesBar ? (
          <header
            className="pt-24 bg-white header"
            style={{ overflow: "visible", zIndex: 100 }}
          >
            <div className="container container-lg">
              <nav className="gap-16 header-inner d-flex justify-content-between">
                <div className="d-flex flex-grow-1">
                  {/* Category Button */}
                  <div ref={catRefCategoryBar} className="flex-shrink-0 category-two h-100 d-lg-block position-relative">
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={catOpen}
                      onClick={() =>
                        catOpen ? setCatOpen(false) : openOnly("cat")
                      }
                      className="gap-8 px-20 py-16 text-white category__button flex-align fw-medium bg-main-two-600 h-100 md-rounded-top"
                    >
                      <span className="text-2xl d-md-flex d-none">
                        <i className="ph ph-squares-four" />
                      </span>
                      <span className="d-lg-flex d-none">All</span> Categories
                      <span className="text-md d-flex ms-auto">
                        <i className="ph ph-caret-down" />
                      </span>
                    </button>

                    {/* Desktop Dropdown (React-controlled) */}
                    {catOpen && (
                      <div
                        role="menu"
                        className="p-0 bg-white rounded-md shadow responsive-dropdown common-dropdown nav-submenu submenus-submenu-wrapper position-absolute"
                      >
                        <ul className="p-0 py-8 overflow-y-auto scroll-sm w-300 max-h-400">
                          {cats.map((c) => (
                            <li key={(c.id ?? c.slug) as React.Key} className="position-relative">
                              <div className="gap-8 px-16 py-12 text-gray-700 text-15 d-flex align-items-center">
                                <span>{c.ten ?? c.name}</span>
                              </div>

                              {/* Nếu API trả children thì render danh mục con */}
                              {Array.isArray(c.children) && c.children.length > 0 && (
                                <div className="py-16 border-top">
                                  <h6 className="px-16 text-lg">{c.ten ?? c.name}</h6>
                                  <ul className="overflow-y-auto max-h-300 scroll-sm">
                                    {c.children.map((sub) => (
                                      <li key={(sub.id ?? sub.slug) as React.Key}>
                                        <Link
                                          href={`/category/${sub.slug ?? sub.id}`}
                                          className="px-16 py-8 d-block hover-bg-neutral-100"
                                        >
                                          {sub.ten ?? sub.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>

                      </div>
                    )}
                  </div>

                  {/* Search */}
                  {/* <form
                    action="#"
                    className="position-relative ms-20 w-100 d-md-block d-none me-16"
                    role="search"
                  >
                    <input
                      type="text"
                      className="py-16 form-control ps-30 pe-60 bg-neutral-30 placeholder-italic placeholder-light"
                      placeholder="Search for products, categories or brands..."
                      aria-label="Search products"
                    />
                    <button
                      type="submit"
                      className="text-xl position-absolute top-50 translate-middle-y text-main-600 end-0 me-36 line-height-1 js-open-search"
                      aria-label="Search"
                    >
                      <i className="ph-bold ph-magnifying-glass"></i>
                    </button>
                  </form> */}
                </div>

                {/* Right actions */}
                <div className="gap-16 d-flex align-items-center flex-nowrap">
                  <Link
                    href="/compare"
                    className="gap-8 text-gray-900 d-flex align-items-center text-nowrap"
                  >
                    <span className="position-relative d-inline-flex">
                      <i className="ph-bold ph-git-compare"></i>
                      <span className="top-0 badge bg-success-600 rounded-circle position-absolute start-100 translate-middle">
                        2
                      </span>
                    </span>
                    <span className="text-nowrap">Compare</span>
                  </Link>
                  <Link
                    href="/gio-hang"
                    className="gap-8 text-gray-900 d-flex align-items-center text-nowrap"
                    data-cart-icon
                  >
                    <span className="position-relative d-inline-flex">
                      <i
                        className="ph-bold ph-shopping-cart"
                        ref={cartIconRef}
                      ></i>
                      {totalItems > 0 && (
                        <span className="top-0 badge bg-success-600 rounded-circle position-absolute start-100 translate-middle">
                          {totalItems}
                        </span>
                      )}
                    </span>
                    <span className="text-nowrap">Cart</span>
                  </Link>
                  {/* removed duplicate user dropdown to avoid double dang-nhap menu */}
                </div>
              </nav>

              {/* Mobile menu drawer (simple) */}
              {mobileOpen && (
                <div className="mt-12 d-lg-none">
                  <div className="p-16 bg-white border rounded-8">
                    <ul className="flex flex-col gap-8">
                      <li>
                        <Link href="/" onClick={() => setMobileOpen(false)}>
                          Home
                        </Link>
                      </li>
                      <li>
                        <Link href="/shop" onClick={() => setMobileOpen(false)}>
                          Shop
                        </Link>
                      </li>
                      <li>
                        <Link href="/pages" onClick={() => setMobileOpen(false)}>
                          Pages
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/vendors"
                          onClick={() => setMobileOpen(false)}
                        >
                          Vendors
                        </Link>
                      </li>
                      <li>
                        <Link href="/blog" onClick={() => setMobileOpen(false)}>
                          Blog
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/contact"
                          onClick={() => setMobileOpen(false)}
                        >
                          Contact
                        </Link>
                      </li>
                      <li className="mt-8">
                        <SearchBoxWithSuggestions />
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </header>
        ) : null
      ) : (
        // CLASSIC HEADER (giống TopHeaderBar)
        <>
          {showClassicTopBar && (
            <div style={{ background: "rgb(229, 57, 53)", width: "100%", padding: "10px 0px", display: "block" }}>
              <div className="container container-lg">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {/* Nhóm trái: Đăng ký / Giới thiệu / Liên hệ */}
                  <ul
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                      listStyle: "none",
                      margin: 0,
                      padding: 0,
                    }}
                  >
                    <li style={{ display: "flex", alignItems: "center" }}>
                      <Link
                        href="/dangky"
                        style={{
                          color: "rgba(255, 255, 255, 0.9)",
                          fontSize: "14px",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <i className="ph-bold ph-user"></i> Đăng ký thành viên
                      </Link>
                    </li>
                    <li style={{ display: "flex", alignItems: "center" }}>
                      <a
                        href="#"
                        style={{
                          color: "rgba(255, 255, 255, 0.9)",
                          fontSize: "14px",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <i className="ph-bold ph-info"></i> Giới thiệu về Siêu Thị Vina
                      </a>
                    </li>
                    <li style={{ display: "flex", alignItems: "center" }}>
                      <a
                        href="#"
                        style={{
                          color: "rgba(255, 255, 255, 0.9)",
                          fontSize: "14px",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <i className="ph-bold ph-chat-dots"></i> Liên hệ hỗ trợ
                      </a>
                    </li>
                  </ul>

                  {/* Nhóm phải: Danh mục / Tra cứu đơn hàng / Giỏ hàng */}
                  <ul
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                      listStyle: "none",
                      margin: 0,
                      padding: 0,
                    }}
                  >
                    <li
                      style={{ display: "flex", alignItems: "center", position: "relative" }}
                      ref={categoryButtonRef}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <a
                        href="#"
                        style={{
                          color: "rgba(255, 255, 255, 0.9)",
                          fontSize: "14px",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <i className="ph ph-squares-four"></i> Danh mục
                      </a>
                    </li>
                    <li style={{ display: "flex", alignItems: "center" }}>
                      <Link
                        href="/orders"
                        style={{
                          color: "rgba(255, 255, 255, 0.9)",
                          fontSize: "14px",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <i className="ph-bold ph-notepad"></i> Tra cứu đơn hàng
                      </Link>
                    </li>
                    <li style={{ display: "flex", alignItems: "center" }}>
                      <Link
                        href="/gio-hang"
                        style={{
                          color: "rgba(255, 255, 255, 0.9)",
                          fontSize: "14px",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <i className="ph-bold ph-shopping-cart"></i> Giỏ hàng
                        <span
                          style={{
                            background: "rgb(0, 230, 118)",
                            color: "rgb(255, 255, 255)",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            marginLeft: "4px",
                            fontSize: "13px",
                          }}
                        >
                          {totalItems}
                        </span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Header chính */}
          <header className="header border-bottom border-neutral-40 pt-16 pb-10" style={{ zIndex: 99, overflow: 'visible' }}>
            <div className="container container-lg" style={{ overflow: 'visible' }}>
              <nav className="header-inner flex-between gap-16" style={{ overflow: 'visible' }}>
                <div className="logo">
                  <Link className="link" aria-label="Trang chủ Siêu Thị Vina" href="/">
                    <Image
                      alt="Logo"
                      width={140}
                      height={40}
                      src="/assets/images/logo/logo_nguyenban.png"
                    />
                  </Link>
                </div>
                <div className="header-menu w-50 d-lg-block d-none" style={{ overflow: 'visible' }}>
                  <div className="mx-20" style={{ overflow: 'visible' }}>
                    <SearchBoxWithSuggestions placeholder="Sâm Ngọc Linh...." />
                    <div className="flex-align mt-10 gap-12 title">
                      <Link className="text-sm link text-gray-600 hover-text-main-600 fst-italic" href="/shop?query=sâm ngọc linh">
                        Sâm Ngọc Linh
                      </Link>
                      <Link className="text-sm link text-gray-600 hover-text-main-600 fst-italic" href="/shop?query=sách hán ngữ 3">
                        Sách hán ngữ 3
                      </Link>
                      <Link className="text-sm link text-gray-600 hover-text-main-600 fst-italic" href="/shop?query=móc khóa genshin">
                        Móc khóa genshin
                      </Link>
                      <Link className="text-sm link text-gray-600 hover-text-main-600 fst-italic" href="/shop?query=đồ chơi minecraft">
                        Đồ chơi minecraft
                      </Link>
                      <Link className="text-sm link text-gray-600 hover-text-main-600 fst-italic" href="/shop?query=điện nội thất">
                        Điện nội thất
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="header-right flex-align">
                  <ul className="header-top__right style-two style-three flex-align flex-wrap d-lg-block d-none">
                    <li className="d-sm-flex d-none">
                      <Link
                        className="d-flex align-items-center gap-10 fw-medium text-main-600 py-10 px-20 bg-main-50 rounded-pill line-height-1 hover-bg-main-600 hover-text-white"
                        href={isLoggedIn ? "/account" : "/dang-nhap"}
                        style={{ transition: 'all 0.3s ease' }}
                      >
                        {isLoggedIn && user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={displayName}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #f2572b'
                            }}
                          />
                        ) : (
                          <span className="d-flex line-height-1">
                            <i className="ph-bold ph-user"></i>
                          </span>
                        )}
                        <span>{displayName}</span>
                      </Link>
                    </li>
                  </ul>
                  <button
                    type="button"
                    className="toggle-mobileMenu d-lg-none ms-3n text-gray-800 text-4xl d-flex"
                    onClick={() => setMobileOpen((s) => !s)}
                  >
                    <i className="ph ph-list"></i>
                  </button>
                </div>
              </nav>
              {mobileOpen && (
                <div className="mt-12 d-lg-none">
                  <div className="p-16 bg-white border rounded-8">
                    <ul className="flex flex-col gap-8">
                      <li>
                        <Link href="/" onClick={() => setMobileOpen(false)}>
                          Trang chủ
                        </Link>
                      </li>
                      <li>
                        <Link href="/shop" onClick={() => setMobileOpen(false)}>
                          Cửa hàng
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/wishlist"
                          onClick={() => setMobileOpen(false)}
                        >
                          Yêu thích
                        </Link>
                      </li>
                      <li>
                        <Link href="/gio-hang" onClick={() => setMobileOpen(false)}>
                          Giỏ hàng
                        </Link>
                      </li>
                      <li className="mt-8">
                        <SearchBoxWithSuggestions />
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </header>
        </>
      )}
    </>
  );
}

