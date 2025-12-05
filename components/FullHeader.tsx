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
type Cat = { id: number|string; ten?: string; name?: string; slug?: string; children?: Cat[] };

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
    const raw = process.env.NEXT_PUBLIC_SERVER_API || "http://localhost:4000";
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
      {/* HEADER MIDDLE */}
      {showTopNav && (
        <header
          className="py-10 header-middle border-bottom border-neutral-40"
          style={{ overflow: "visible", position: "sticky", top: 0, zIndex: 300, background: "#fff" }}//position: "relative"
        >
          <div className="container container-lg">
            <nav className="gap-8 header-inner flex-between align-items-center">
              {/* Logo */}
              <div className="logo">
                <Link href="/" className="link" aria-label="Home">
                  <Image
                    src="/assets/images/logo/logo_nguyenban.png"
                    alt="Logo"
                    width={140}
                    height={40}
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
                  <SearchBoxWithSuggestions/>

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
              <div className="header-right flex-align"  style={{ marginLeft: 24 }}>
                <div
                  ref={userRef}
                  className="flex-wrap on-hover-item nav-menu__item has-submenu header-top__right style-two style-three flex-align d-lg-block d-none position-relative"
                >
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={userOpen}
                    onClick={() =>
                      userOpen ? setUserOpen(false) : openOnly("user")
                    }
                    className="gap-10 px-20 py-10 text-center text-white d-flex justify-content-center flex-align align-content-around fw-medium bg-success-600 rounded-pill line-height-1 hover-bg-success-500 hover-text-white btn-reset"
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
                      role="menu"
                      className="bg-white rounded-md shadow common-dropdown nav-submenu scroll-sm position-absolute"
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
                          href="/lien-he"
                          onClick={() => setMobileOpen(false)}
                        >
                          Contact
                        </Link>
                      </li>
                      <li className="mt-8">
                        <SearchBoxWithSuggestions/>
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
            <div className="py-10 header-top bg-main-600 d-none d-lg-block">
              <div className="container container-lg">
                <div className="flex-wrap gap-8 flex-between">
                  <ul className="flex-wrap gap-16 header-top__right flex-align">
                    {/* <li className="flex-align">
                      <Link href="#" className="text-sm text-center text-white-6 hover-text-white">
                        <i className="ph-bold ph-storefront text-white-6"></i> Truy cập bán hàng
                      </Link>
                    </li>
                    <li className="flex-align">
                      <Link href="#" className="text-sm text-white-6 hover-text-white">
                        <i className="ph-bold ph-handshake text-white-6"></i> Đăng ký đối tác
                      </Link>
                    </li> */}
                    <li className="flex-align">
                      <Link href="#" className="text-sm text-white-6 hover-text-white pe-1">
                        <i className="ph-bold ph-info text-white-6"></i> Giới thiệu về Siêu Thị Vina
                      </Link>
                    </li>
                    <li className="flex-align">
                      <Link href="/lien-he" className="text-sm text-white-6 hover-text-white">
                        <i className="ph-bold ph-chat-dots text-white-6"></i> Liên hệ hỗ trợ
                      </Link>
                    </li>
                  </ul>

                  <ul className="flex-wrap gap-16 header-top__right flex-align">
                    {/* Danh mục */}
                    <li 
                      className="flex-shrink-0 d-block on-hover-item text-white-6" 
                      ref={categoryButtonRef}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <button
                        className="gap-4 text-sm category__button flex-align text-white-6 rounded-top js-open-menu"
                        type="button"
                        aria-expanded={showCategoryMenu} 
                      >
                        <span className="text-sm icon d-md-flex d-none">
                          <i className="ph ph-squares-four"></i>
                        </span>
                        <span className="d-sm-flex d-none">Danh mục</span>
                      </button>
                    </li>

                    <li className="flex-align">
                      <Link href="/tra-cuu-don-hang" className="text-sm text-white-6 hover-text-white">
                        <i className="ph-bold ph-notepad"></i> Tra cứu đơn hàng
                      </Link>
                    </li>
                    <li className="flex-align">
                      <Link href="/gio-hang" className="text-sm text-white-6 hover-text-white" data-cart-icon>
                        <i className="ph-bold ph-shopping-cart"></i> Giỏ hàng
                        <span className="badge bg-success-600 rounded-circle ms-6">{totalItems}</span>
                      </Link>
                    </li>
                  </ul>

                </div>
              </div>
            </div>

          )}

          <header className="header border-bottom border-neutral-40 pt-14 pb-14">
            <div className="container">
              <nav className="gap-8 header-inner flex-between">
                <div className="logo">
                  <Link href="/" className="link" aria-label="Home">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/images/logo/logo_nguyenban.png"
                      alt="Logo" width={100} height={20}
                    />
                  </Link>
                </div>
                <div className="header-menu w-50 d-lg-block d-none">
                  <div className="relative mx-20">
                    <SearchBoxWithSuggestions/>
                  </div>
                </div>
                <div
                  className="d-lg-block d-none position-relative"
                   style={{ marginLeft: "0px" }}// sát khung tìm kiếm hơn, giống hình
                >
                  {isLoggedIn ? (
                    <div
                      ref={userRef}
                      className="flex-wrap on-hover-item nav-menu__item has-submenu header-top__right style-two style-three flex-align position-relative" 
                    >
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={userOpen}
                        onClick={() =>
                          userOpen ? setUserOpen(false) : openOnly("user")
                        }
                        style={{
                          background: userOpen ? "#E53935" : "#FCE9E8",
                          color: userOpen ? "#fff" : "#E53935",
                          transition: "background 0.2s, color 0.2s",
                          fontSize: "0.98rem", // chữ vừa phải
                          padding: "7px 18px", // nút nhỏ lại
                          minWidth: 0,
                        }}
                        className="gap-6 d-flex justify-content-center flex-align rounded-pill btn-reset fw-medium"
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "#E53935";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={e => {
                          if (!userOpen) {
                            e.currentTarget.style.background = "#FCE9E8";
                            e.currentTarget.style.color = "#E53935";
                          }
                        }}
                      >
                        <span
                          className="line-height-1"
                          aria-hidden
                          style={{
                            fontSize: "0.70rem", // icon nhỏ hơn chữ
                            flex: "0 0 30%",     // icon chỉ chiếm ~1/3 nút
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {getAvatarSrc(user) ? (
                            <Image src={getAvatarSrc(user) as string} alt={getDisplayName(user)} width={28} height={28} className="rounded-circle" />
                          ) : (
                            <i className="ph-bold ph-user" style={{ fontSize: 18 }} />
                          )}
                        </span>
                        <span
                          style={{
                            fontSize: "0.98rem", // chữ vừa phải
                            flex: "1 1 86%",
                            marginLeft: 6,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {getDisplayName(user)}
                        </span>
                      </button>
                      {userOpen && (
                        <ul
                          role="menu"
                          className="bg-white rounded-md shadow common-dropdown nav-submenu scroll-sm position-absolute"
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
                  ) : (
                    <Link
                      href="/dang-nhap"
                      style={{
                        background: "#FCE9E8",
                        color: "#E53935",
                        transition: "background 0.2s, color 0.2s",
                        fontSize: "0.98rem", // chữ vừa phải
                        padding: "7px 18px", // nút nhỏ lại
                        minWidth: 0,
                      }}
                      className="gap-6 d-flex justify-content-center flex-align rounded-pill fw-medium"
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = "#E53935";
                        (e.currentTarget as HTMLElement).style.color = "#fff";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = "#FCE9E8";
                        (e.currentTarget as HTMLElement).style.color = "#E53935";
                      }}
                    >
                      <i className="ph-bold ph-user" style={{ fontSize: "0.85rem" }} />
                      <span style={{ fontSize: "0.98rem", marginLeft: 6 }}>Đăng nhập</span>
                    </Link>
                  )}
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
                        <SearchBoxWithSuggestions/>
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

