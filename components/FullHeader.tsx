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
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  // wishlist count
  const { count: wishlistCount } = useWishlist();
  // auth state
  const { user, isLoggedIn, logout } = useAuth();


  // ---- Danh mục (All Categories) ----
  type DanhMuc = {
    id: number | string;
    ten?: string;    // API của bạn dùng "ten"
    name?: string;   // fallback nếu sau này đổi field
    slug?: string;
    logo?: string;   // URL logo từ API
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
        {cats.length > 0 ? (
          cats.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
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
                  src={cat.logo || `https://sieuthivina.com/assets/client/images/categories/${cat.slug}.svg`}
                  alt={cat.ten || cat.name || ''}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </span>
              <span>{cat.ten || cat.name}</span>
            </Link>
          ))
        ) : (
          <div style={{ padding: '12px 16px', color: '#999', fontSize: '14px' }}>
            Đang tải danh mục...
          </div>
        )}
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
        const res = await fetch(`${API}/api/danhmucs-all`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) {
          console.warn("API danhmucs-all error:", res.status);
          if (!off) setCats([]);
          return;
        }
        const json = await res.json();
        console.log("API danhmucs-all response:", json);
        // API trả về mảng trực tiếp hoặc trong json.data
        let list: DanhMuc[] = [];
        if (Array.isArray(json)) {
          list = json;
        } else if (Array.isArray(json?.data)) {
          list = json.data;
        }
        console.log("Danh mục loaded:", list.length, "items");
        if (!off) setCats(list);
      } catch (err) {
        console.warn("Lỗi fetch danh mục (có thể server không khả dụng):", err);
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
  const cartRef = useRef<HTMLDivElement>(null);
  const wishlistRef = useRef<HTMLDivElement>(null);

  useClickAway(langRef, () => setLangOpen(false));
  useClickAway(currRef, () => setCurrOpen(false));
  useClickAway(userRef, () => setUserOpen(false));
  useClickAway(catRef, () => setCatOpen(false));
  useClickAway(catRefCategoryBar, () => setCatOpen(false));
  useClickAway(catRefTopBar, () => setCatOpen(false));
  useClickAway(cartRef, () => setCartOpen(false));
  useClickAway(wishlistRef, () => setWishlistOpen(false));

  // đóng các dropdown khác khi mở 1 cái
  function openOnly(which: "lang" | "curr" | "user" | "cat" | "cart" | "wishlist") {
    setLangOpen(which === "lang");
    setCurrOpen(which === "curr");
    setUserOpen(which === "user");
    setCatOpen(which === "cat");
    setCartOpen(which === "cart");
    setWishlistOpen(which === "wishlist");
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
  const { totalItems, items: cart, total: totalPrice, removeItem: removeFromCart } = useCart();

  // Format currency helper
  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };


  return (
    <>
      {renderCategoryDropdown()}
      {/* HEADER MIDDLE */}
      {showTopNav && (
        <header
          className="py-10 header-middle border-bottom border-neutral-40"
          style={{ overflow: "visible", position: "sticky", top: 0, zIndex: 300, background: "#fff" }}//position: "relative"
        >
          <div className="container px-0 container-lg">
            <nav className="gap-8 header-inner flex-between align-items-center">
              {/* Logo */}
              <div className="logo">
                <Link href="/" className="link" aria-label="Home">
                  <Image
                    src="/assets/images/logo/logo_nguyenban.png"
                    alt="Logo"
                    width={160}
                    height={60}
                  />
                </Link>
              </div>

              {/* Desktop Search + Keywords (template style) */}
              <div className="header-menu w-50 d-lg-block d-none">
                <div className="mx-20">
                  {/* <form
                    action="#"
                    className="position-relative w-100 d-md-block d-none"
                  >
                    <input
                      type="text"
                      className="py-8 text-sm shadow-none form-control fw-normal placeholder-italic bg-neutral-30 placeholder-fw-normal placeholder-light ps-30 pe-60"
                      placeholder="Thuốc giảm cân dành cho người béo...."
                    />
                    <button
                      type="submit"
                      className="text-xl position-absolute top-50 translate-middle-y text-main-600 end-0 me-36 line-height-1"
                    >
                      <i className="ph-bold ph-magnifying-glass"></i>
                    </button>
                  </form> */}
                  <SearchBoxWithSuggestions />

                  <div className="gap-12 mt-10 flex-align title">
                    <Link
                      href="#"
                      className="text-sm text-gray-600 link hover-text-main-600 fst-italic"
                    >
                      Máy massage
                    </Link>
                    <Link
                      href="#"
                      className="text-sm text-gray-600 link hover-text-main-600 fst-italic"
                    >
                      điện gia dụng
                    </Link>
                    <Link
                      href="#"
                      className="text-sm text-gray-600 link hover-text-main-600 fst-italic"
                    >
                      mẹ và bé
                    </Link>
                    <Link
                      href="#"
                      className="text-sm text-gray-600 link hover-text-main-600 fst-italic"
                    >
                      móc khóa minecraft
                    </Link>
                    <Link
                      href="#"
                      className="text-sm text-gray-600 link hover-text-main-600 fst-italic"
                    >
                      điện nội thất
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right side + Mobile toggle */}
              <div className="header-right flex-align" style={{ marginLeft: 24 }}>
                <div
                  ref={userRef}
                  className="flex-wrap on-hover-item nav-menu__item has-submenu header-top__right style-two style-three flex-align d-lg-block d-none position-relative"
                >
                  <button
                    type="button"
                    aria-haspopup="menu"
                    {...{ 'aria-expanded': userOpen }}
                    onClick={() =>
                      userOpen ? setUserOpen(false) : openOnly("user")
                    }
                    className="gap-10 px-20 py-10 text-center text-white d-flex justify-content-center flex-align align-content-around fw-medium rounded-pill line-height-1 btn-reset header-login-btn"
                    style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                  >
                    <span className="line-height-1" aria-hidden style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isLoggedIn ? (
                        getAvatarSrc(user) ? (
                          <Image
                            src={getAvatarSrc(user) as string}
                            alt={getDisplayName(user)}
                            width={32}
                            height={32}
                            className="rounded-circle"
                          />
                        ) : (
                          <i className="ph-bold ph-user" style={{ fontSize: 18 }} />
                        )
                      ) : (
                        <i className="ph-bold ph-user" />
                      )}
                    </span>
                    <span style={{ marginLeft: 8 }}>
                      {isLoggedIn ? getDisplayName(user) : "Tài khoản"}
                    </span>
                  </button>
                  {userOpen && (
                    <ul
                      className="bg-white rounded-md shadow common-dropdown nav-submenu scroll-sm position-absolute"
                      style={{ zIndex: 9999 }} // thêm zIndex để dropdown không bị che khuất
                    >
                      <li
                        className="common-dropdown__item nav-submenu__item"
                        role="none"
                      >
                        <Link
                          href="/yeu-thich"
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
                              href="/don-hang"
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
                  aria-label="Toggle mobile menu"
                  className="text-4xl text-gray-800 d-lg-none ms-3n d-flex btn-reset js-open-menu"
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
            <div className="container px-0 container-lg">
              <nav className="gap-16 header-inner d-flex justify-content-between">
                <div className="d-flex flex-grow-1">
                  {/* Category Button */}
                  <div ref={catRefCategoryBar} className="flex-shrink-0 category-two h-100 d-lg-block position-relative">
                    <button
                      type="button"
                      aria-haspopup="menu"
                      {...{ 'aria-expanded': catOpen }}
                      onClick={() =>
                        catOpen ? setCatOpen(false) : openOnly("cat")
                      }
                      className="gap-8 px-20 py-16 text-white category__button flex-align fw-medium bg-main-two-600 h-100 md-rounded-top"
                    >
                      <span className="text-2xl d-md-flex d-none">
                        <i className="ph ph-squares-four text-warning-700" />
                      </span>
                      <span className="d-lg-flex d-none">All</span> Categories
                      <span className="text-md d-flex ms-auto">
                        <i className="ph ph-caret-down" />
                      </span>
                    </button>

                    {/* Desktop Dropdown (React-controlled) */}
                    {catOpen && (
                      <div
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
                          href="/lien-he"
                          onClick={() => setMobileOpen(false)}
                        >
                          Liên Hệ
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
        // CLASSIC HEADER (giữ cấu trúc cũ, nhưng không jQuery)
        <>
          {showClassicTopBar && (
            <div className="header-top bg-main-600 flex-between py-10 d-none d-lg-block">
              <div className="container container-lg">
                <div className="flex-between flex-wrap gap-8">
                  <ul className="header-top__right flex-align flex-wrap gap-16">
                    {!isLoggedIn && (
                      <li className="flex-align">
                        <Link href="/dang-ky" className="text-white text-sm hover-text-white">
                          <i className="ph-bold ph-user text-white"></i> Đăng ký thành viên
                        </Link>
                      </li>
                    )}
                    <li className="flex-align">
                      <Link href="/gioi-thieu" className="text-white text-sm hover-text-white pe-1">
                        <i className="ph-bold ph-info text-white"></i> Giới thiệu về Siêu Thị Vina
                      </Link>
                    </li>
                    <li className="flex-align">
                      <Link href="/lien-he" className="text-white text-sm hover-text-white">
                        <i className="ph-bold ph-chat-dots"></i> Liên hệ hỗ trợ
                      </Link>
                    </li>
                  </ul>

                  <ul className="header-top__right flex-align flex-wrap gap-16">
                    {/* Danh mục */}
                    <li
                      className="d-block on-hover-item text-white flex-shrink-0"
                      ref={categoryButtonRef}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <button
                        className="category__button flex-align gap-4 text-sm text-white rounded-top"
                        type="button"
                        {...{ 'aria-expanded': showCategoryMenu }}
                      >
                        <span className="icon text-sm d-md-flex d-none">
                          <i className="ph ph-squares-four"></i>
                        </span>
                        <span className="d-sm-flex d-none">Danh mục</span>
                      </button>
                    </li>

                    <li className="flex-align">
                      <Link href="/tra-cuu-don-hang" className="text-white text-sm hover-text-white">
                        <i className="ph-bold ph-notepad"></i> Tra cứu đơn hàng
                      </Link>
                    </li>
                    <li className="flex-align">
                      <Link href="/gio-hang" className="text-white text-sm hover-text-white" data-cart-icon>
                        <i className="ph-bold ph-shopping-cart"></i> Giỏ hàng
                        <span className="badge bg-main-two-600 rounded-4 px-6 py-4 ms-6">{totalItems}</span>
                      </Link>
                    </li>
                  </ul>

                </div>
              </div>
            </div>

          )}

          <header
            className="header border-bottom border-neutral-40 pt-16 pb-10 pz99"
            style={{ background: "rgba(250, 250, 250, 0.9)" }}
          >
            <div className="container container-lg">
              <nav className="header-inner flex-between gap-16">
                {/* Logo Start */}
                <div className="logo">
                  <Link href="/" className="link">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/images/logo/logo_nguyenbannnnn.webp"
                      alt="Logo"
                      width={160}
                      height={50}
                    />
                  </Link>
                </div>
                {/* Logo End */}

                {/* Menu Start */}
                <div className="header-menu w-50 d-lg-block d-none">
                  <div className="mx-20">
                    <SearchBoxWithSuggestions />

                    <div className="flex-align mt-10 gap-12 title">
                      <Link href="/tim-kiem?query=Sâm Ngọc Linh" className="text-sm link text-gray-600 hover-text-main-600 fst-italic">
                        Sâm Ngọc Linh
                      </Link>
                      <Link href="/tim-kiem?query=Sách hán ngữ 3" className="text-sm link text-gray-600 hover-text-main-600 fst-italic">
                        Sách hán ngữ 3
                      </Link>
                      <Link href="/tim-kiem?query=Móc khóa genshin" className="text-sm link text-gray-600 hover-text-main-600 fst-italic">
                        Móc khóa genshin
                      </Link>
                      <Link href="/tim-kiem?query=Đồ chơi minecraft" className="text-sm link text-gray-600 hover-text-main-600 fst-italic">
                        Đồ chơi minecraft
                      </Link>
                      <Link href="/tim-kiem?query=Điện nội thất" className="text-sm link text-gray-600 hover-text-main-600 fst-italic">
                        Điện nội thất
                      </Link>
                    </div>
                  </div>
                </div>
                {/* Menu End */}

                {/* Middle Header Right start */}
                <div className="header-right flex-align">
                  {isLoggedIn ? (
                    <ul className="header-top__right style-two style-three flex-align flex-wrap d-lg-block d-none">
                      <li className="d-sm-flex d-none">
                        <div
                          ref={userRef}
                          className="on-hover-item nav-menu__item has-submenu position-relative"
                        >
                          <button
                            type="button"
                            aria-haspopup="menu"
                            {...{ 'aria-expanded': userOpen }}
                            onClick={() =>
                              userOpen ? setUserOpen(false) : openOnly("user")
                            }
                            className="d-flex align-items-center gap-10 fw-medium text-warning-700 py-14 px-24 bg-warning-soft rounded-pill hover-bg-warning-700 hover-text-white"
                          >
                            {user?.avatar ? (
                              <img
                                src={user.avatar.startsWith('http') ? user.avatar : `http://148.230.100.215${user.avatar}`}
                                alt="Avatar"
                                className="rounded-circle"
                                style={{ width: 28, height: 28, objectFit: 'cover' }}
                              />
                            ) : (
                              <span className="d-flex align-items-center justify-content-center rounded-circle bg-warning-700 text-white" style={{ width: 28, height: 28, fontSize: 14 }}>
                                {(user?.hoten || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span className="text d-md-flex d-none">
                              {user?.hoten || "Tài Khoản"}
                            </span>
                            <span className="arrow-icon">
                              <i className="ph ph-caret-down" />
                            </span>
                          </button>
                          {userOpen && (
                            <ul
                              className="bg-white rounded-md shadow common-dropdown nav-submenu scroll-sm position-absolute"
                              style={{ zIndex: 9999 }} // thêm zIndex để dropdown không bị che khuất
                            >
                              <li className="common-dropdown__item nav-submenu__item" role="none">
                                <Link
                                  href="/yeu-thich"
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
                              <li className="common-dropdown__item nav-submenu__item" role="none">
                                <Link
                                  href="/tai-khoan"
                                  role="menuitem"
                                  className="common-dropdown__link nav-submenu__link text-heading-two hover-bg-neutral-100"
                                >
                                  <i className="ph-bold ph-user text-main-600"></i>
                                  Tài khoản
                                </Link>
                              </li>
                              <li className="common-dropdown__item nav-submenu__item" role="none">
                                <Link
                                  href="/don-hang"
                                  role="menuitem"
                                  className="common-dropdown__link nav-submenu__link text-heading-two hover-bg-neutral-100"
                                >
                                  <i className="ph-bold ph-notepad text-main-600"></i>
                                  Đơn hàng của tôi
                                </Link>
                              </li>
                              <li className="common-dropdown__item nav-submenu__item" role="none">
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
                            </ul>
                          )}
                        </div>
                      </li>
                    </ul>
                  ) : (
                    <ul className="header-top__right style-two style-three flex-align flex-wrap d-lg-block d-none">
                      <li className="d-sm-flex d-none">
                        <Link
                          href="/dang-nhap"
                          className="d-flex align-content-around gap-10 fw-medium text-warning-700 py-14 px-24 bg-warning-soft rounded-pill line-height-1 hover-bg-warning-700 hover-text-white"
                        >
                          <span className="d-sm-flex d-none line-height-1">
                            <i className="ph-bold ph-user" />
                          </span>
                          Đăng nhập
                        </Link>
                      </li>
                    </ul>
                  )}

                  {/* Dropdown Select End */}
                  <button
                    type="button"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="toggle-mobileMenu d-lg-none ms-3n text-gray-800 text-4xl d-flex"
                    aria-label="Toggle mobile menu"
                  >
                    <i className="ph ph-list" />
                  </button>
                </div>
                {/* Middle Header Right End */}
              </nav>
            </div>
          </header>

          {mobileOpen && (
            <div className="container container-lg">
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
                          href="/yeu-thich"
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
          )}
        </>
      )}
    </>
  );
}

