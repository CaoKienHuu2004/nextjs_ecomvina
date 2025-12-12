"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import LatestProductsSection from "@/components/LatestProductsSection";
import MostInterestedSection from "@/components/MostInterestedSection";
import TopBrandsStaticSection from "@/components/TopBrandsStaticSection";
import FeaturedProductsStaticSection from "@/components/FeaturedProductsStaticSection";
import BannerTwo from "@/components/BannerTwo";
import FeatureSection from "@/components/FeatureSection";
import PreloaderFix from "@/components/PreloaderFix";
import OverlayLayers from "@/components/OverlayLayers";
import ScrollTopProgress from "@/components/ScrollTopProgress";
import SearchOverlay from "@/components/SearchOverlay";
import MobileMenu from "@/components/MobileMenu";
import TopDealsSection from "@/components/TopDealsSection";
import GiftEventsSection from "@/components/GiftEventsSection";
import TopCategoriesProducts from "@/components/TopCategoriesProducts";
import BlogSection from "@/components/BlogSection";
import { HomeDataProvider } from "@/hooks/useHomeData";

// types for jQuery-like object (minimal)
// Loại bỏ các kiểu tạm cho jQuery slick (đã chuyển sang Swiper)

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // UI state: overlays
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  // Body scroll lock when overlays open
  useEffect(() => {
    if (!mounted) return;
    const lock = isSearchOpen || isMobileMenuOpen;
    const prev = document.body.style.overflow;
    document.body.style.overflow = lock ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted, isSearchOpen, isMobileMenuOpen]);

  // Delegated open triggers (optional)
  useEffect(() => {
    if (!mounted) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      if (target.closest?.(".js-open-search")) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (target.closest?.(".js-open-menu")) {
        e.preventDefault();
        setIsMobileMenuOpen(true);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [mounted]);


  if (!mounted) return null;

  return (
    <HomeDataProvider>
      {/* Overlay, preloader, scroll, search, mobile menu giữ nguyên, KHÔNG render logo/tìm kiếm/tài khoản ở đầu trang nữa */}
      <PreloaderFix />
      <OverlayLayers
        showOverlay={isSearchOpen}
        showSideOverlay={isMobileMenuOpen}
        onOverlayClick={() => setIsSearchOpen(false)}
        onSideOverlayClick={() => setIsMobileMenuOpen(false)}
      />
      <ScrollTopProgress />
      <SearchOverlay visible={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <MobileMenu visible={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Top header bar */}
      <div className="header-top bg-main-600 flex-between py-10 d-none d-lg-block pz100">
        <div className="container container-lg">
          <div className="flex-between flex-wrap gap-8">
            <ul className="header-top__right flex-align flex-wrap gap-16">
              <li className="flex-align">
                <a
                  href="https://sieuthivina.com/dang-ky"
                  className="text-white-6 text-sm hover-text-white"
                >
                  <i className="ph-bold ph-user text-white-6" />
                  Đăng ký thành viên
                </a>
              </li>
              <li className="flex-align">
                <a href="" className="text-white text-sm hover-text-white pe-1">
                  <i className="ph-bold ph-info text-white" />
                  Giới thiệu về Siêu Thị Vina
                </a>
              </li>
              <li className="flex-align">
                <a href="" className="text-white text-sm hover-text-white">
                  <i className="ph-bold ph-chat-dots" />
                  Liên hệ hỗ trợ
                </a>
              </li>
            </ul>

            <ul className="header-top__right flex-align flex-wrap gap-16">
              <li className="d-block on-hover-item text-white-6 flex-shrink-0">
                <button className="category__button flex-align gap-4 text-sm text-white rounded-top">
                  <span className="icon text-sm d-md-flex d-none">
                    <i className="ph ph-squares-four" />
                  </span>
                  <span className="d-sm-flex d-none">Danh mục</span>
                </button>

                <div className="responsive-dropdown on-hover-dropdown common-dropdown nav-submenu p-0 submenus-submenu-wrapper">
                  <button className="close-responsive-dropdown rounded-circle text-xl position-absolute inset-inline-end-0 inset-block-start-0 mt-4 me-8 d-lg-none d-flex">
                    <i className="ph ph-x" />
                  </button>
                  <div className="logo px-16 d-lg-none d-block">
                    <a href="https://sieuthivina.com" className="link">
                      <img
                        src="https://sieuthivina.com/assets/client/images/logo/logo_nguyenban.png"
                        alt="Logo"
                      />
                    </a>
                  </div>
                  <ul className="scroll-sm p-0 py-8 w-300 max-h-400 overflow-y-auto">
                    <li className="has-submenus-submenu">
                      <a
                        href="https://sieuthivina.com/san-pham?danhmuc=suc-khoe"
                        className="text-gray-600 text-15 py-12 px-16 flex-align gap-4 rounded-0"
                      >
                        <span className="text-xl d-flex">
                          <img
                            src="https://sieuthivina.com/assets/client/images/categories/suc-khoe.svg"
                            alt="Sức khỏe"
                            width="70%"
                          />
                        </span>
                        <span>Sức khỏe</span>
                      </a>
                    </li>
                    <li className="has-submenus-submenu">
                      <a
                        href="https://sieuthivina.com/san-pham?danhmuc=thuc-pham-chuc-nang"
                        className="text-gray-600 text-15 py-12 px-16 flex-align gap-4 rounded-0"
                      >
                        <span className="text-xl d-flex">
                          <img
                            src="https://sieuthivina.com/assets/client/images/categories/thuc-pham-chuc-nang.svg"
                            alt="Thực phẩm chức năng"
                            width="70%"
                          />
                        </span>
                        <span>Thực phẩm chức năng</span>
                      </a>
                    </li>
                    <li className="has-submenus-submenu">
                      <a
                        href="https://sieuthivina.com/san-pham?danhmuc=cham-soc-ca-nhan"
                        className="text-gray-600 text-15 py-12 px-16 flex-align gap-4 rounded-0"
                      >
                        <span className="text-xl d-flex">
                          <img
                            src="https://sieuthivina.com/assets/client/images/categories/cham-soc-ca-nhan.svg"
                            alt="Chăm sóc cá nhân"
                            width="70%"
                          />
                        </span>
                        <span>Chăm sóc cá nhân</span>
                      </a>
                    </li>
                    <li className="has-submenus-submenu">
                      <a
                        href="https://sieuthivina.com/san-pham?danhmuc=lam-dep"
                        className="text-gray-600 text-15 py-12 px-16 flex-align gap-4 rounded-0"
                      >
                        <span className="text-xl d-flex">
                          <img
                            src="https://sieuthivina.com/assets/client/images/categories/lam-dep.svg"
                            alt="Làm đẹp"
                            width="70%"
                          />
                        </span>
                        <span>Làm đẹp</span>
                      </a>
                    </li>
                    <li className="has-submenus-submenu">
                      <a
                        href="https://sieuthivina.com/san-pham?danhmuc=dien-may"
                        className="text-gray-600 text-15 py-12 px-16 flex-align gap-4 rounded-0"
                      >
                        <span className="text-xl d-flex">
                          <img
                            src="https://sieuthivina.com/assets/client/images/categories/dien-may.svg"
                            alt="Điện máy"
                            width="70%"
                          />
                        </span>
                        <span>Điện máy</span>
                      </a>
                    </li>
                    <li className="has-submenus-submenu">
                      <a
                        href="https://sieuthivina.com/san-pham?danhmuc=thiet-bi-y-te"
                        className="text-gray-600 text-15 py-12 px-16 flex-align gap-4 rounded-0"
                      >
                        <span className="text-xl d-flex">
                          <img
                            src="https://sieuthivina.com/assets/client/images/categories/thiet-bi-y-te.svg"
                            alt="Thiết bị y tế"
                            width="70%"
                          />
                        </span>
                        <span>Thiết bị y tế</span>
                      </a>
                    </li>
                    <li className="has-submenus-submenu">
                      <a
                        href="https://sieuthivina.com/san-pham?danhmuc=bach-hoa"
                        className="text-gray-600 text-15 py-12 px-16 flex-align gap-4 rounded-0"
                      >
                        <span className="text-xl d-flex">
                          <img
                            src="https://sieuthivina.com/assets/client/images/categories/bach-hoa.svg"
                            alt="Bách hoá"
                            width="70%"
                          />
                        </span>
                        <span>Bách hoá</span>
                      </a>
                    </li>
                    <li className="has-submenus-submenu">
                      <a
                        href="https://sieuthivina.com/san-pham?danhmuc=noi-that-trang-tri"
                        className="text-gray-600 text-15 py-12 px-16 flex-align gap-4 rounded-0"
                      >
                        <span className="text-xl d-flex">
                          <img
                            src="https://sieuthivina.com/assets/client/images/categories/noi-that-trang-tri.svg"
                            alt="Nội thất - Trang trí"
                            width="70%"
                          />
                        </span>
                        <span>Nội thất - Trang trí</span>
                      </a>
                    </li>
                    <li className="has-submenus-submenu">
                      <a
                        href="https://sieuthivina.com/san-pham?danhmuc=me-va-be"
                        className="text-gray-600 text-15 py-12 px-16 flex-align gap-4 rounded-0"
                      >
                        <span className="text-xl d-flex">
                          <img
                            src="https://sieuthivina.com/assets/client/images/categories/me-va-be.svg"
                            alt="Mẹ &amp; bé"
                            width="70%"
                          />
                        </span>
                        <span>Mẹ &amp; bé</span>
                      </a>
                    </li>
                    <li className="has-submenus-submenu">
                      <a
                        href="https://sieuthivina.com/san-pham?danhmuc=thoi-trang"
                        className="text-gray-600 text-15 py-12 px-16 flex-align gap-4 rounded-0"
                      >
                        <span className="text-xl d-flex">
                          <img
                            src="https://sieuthivina.com/assets/client/images/categories/thoi-trang.svg"
                            alt="Thời trang"
                            width="70%"
                          />
                        </span>
                        <span>Thời trang</span>
                      </a>
                    </li>
                    <li className="has-submenus-submenu">
                      <a
                        href="https://sieuthivina.com/san-pham?danhmuc=thuc-pham-do-an"
                        className="text-gray-600 text-15 py-12 px-16 flex-align gap-4 rounded-0"
                      >
                        <span className="text-xl d-flex">
                          <img
                            src="https://sieuthivina.com/assets/client/images/categories/thuc-pham-do-an.svg"
                            alt="Thực phẩm - đồ ăn"
                            width="70%"
                          />
                        </span>
                        <span>Thực phẩm - đồ ăn</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </li>

              <li className="flex-align">
                <a
                  href="https://sieuthivina.com/tra-cuu-don-hang"
                  className="text-white text-sm hover-text-white"
                >
                  <i className="ph-bold ph-notepad" />
                  Tra cứu đơn hàng
                </a>
              </li>

              <li className="flex-align">
                <a
                  href="https://sieuthivina.com/gio-hang"
                  className="text-white text-sm hover-text-white"
                >
                  <i className="ph-bold ph-shopping-cart" />
                  Giỏ hàng
                  <span className="badge bg-main-two-600 rounded-4 px-6 py-4">0</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Header với giao diện mới cho trang chủ */}
      <header className="header border-bottom border-neutral-40 pt-16 pb-10 pz99">
        <div className="container container-lg">
          <nav className="header-inner flex-between gap-16">
            {/* Logo Start */}
            <div className="logo">
              <a href="https://sieuthivina.com" className="link">
                <img
                  src="https://sieuthivina.com/assets/client/images/logo/logo_nguyenban.png"
                  alt="Logo"
                  style={{ maxHeight: 100, width: "auto" }}
                />
              </a>
            </div>
            {/* Logo End */}

            {/* Menu Start */}
            <div className="header-menu w-50 d-lg-block d-none">
              <div className="mx-20">
                <form
                  action="https://sieuthivina.com/tim-kiem"
                  method="GET"
                  className="position-relative w-100 d-md-block d-none"
                >
                  <input
                    type="text"
                    className="form-control text-sm fw-normal placeholder-italic shadow-none bg-neutral-30 placeholder-fw-normal placeholder-light py-10 ps-30 pe-60"
                    placeholder="chẤt viỆt group...."
                    name="query"
                    required
                  />
                  <button
                    type="submit"
                    className="position-absolute top-50 translate-middle-y text-main-600 end-0 me-36 text-xl line-height-1"
                  >
                    <i className="ph-bold ph-magnifying-glass" />
                  </button>
                </form>
                <div className="flex-align mt-10 gap-12 title">
                  <a
                    href="https://sieuthivina.com/tim-kiem?query=S%C3%A2m%20Ng%E1%BB%8Dc%20Linh"
                    className="text-sm link text-gray-600 hover-text-main-600 fst-italic"
                  >
                    Sâm Ngọc Linh
                  </a>
                  <a
                    href="https://sieuthivina.com/tim-kiem?query=S%C3%A1ch%20h%C3%A1n%20ng%E1%BB%AF%203"
                    className="text-sm link text-gray-600 hover-text-main-600 fst-italic"
                  >
                    Sách hán ngữ 3
                  </a>
                  <a
                    href="https://sieuthivina.com/tim-kiem?query=M%C3%B3c%20kh%C3%B3a%20genshin"
                    className="text-sm link text-gray-600 hover-text-main-600 fst-italic"
                  >
                    Móc khóa genshin
                  </a>
                  <a
                    href="https://sieuthivina.com/tim-kiem?query=%C4%90%E1%BB%93%20ch%C6%A1i%20minecraft"
                    className="text-sm link text-gray-600 hover-text-main-600 fst-italic"
                  >
                    Đồ chơi minecraft
                  </a>
                  <a
                    href="https://sieuthivina.com/tim-kiem?query=%C4%90i%E1%BB%87n%20n%E1%BB%99i%20th%E1%BA%A5t"
                    className="text-sm link text-gray-600 hover-text-main-600 fst-italic"
                  >
                    Điện nội thất
                  </a>
                </div>
              </div>
            </div>
            {/* Menu End */}

            {/* Middle Header Right start */}
            <div className="header-right flex-align">
              {/* ============Nút đăng nhập/đăng ký=============== */}
              <ul className="header-top__right style-two style-three flex-align flex-wrap d-lg-block d-none">
                <li className="d-sm-flex d-none">
                  <a
                    href="https://sieuthivina.com/dang-nhap"
                    className="d-flex align-content-around gap-10 fw-medium text-main-600 py-14 px-24 bg-main-50 rounded-pill line-height-1 hover-bg-main-600 hover-text-white"
                  >
                    <span className="d-sm-flex d-none line-height-1">
                      <i className="ph-bold ph-user" />
                    </span>
                    Đăng nhập
                  </a>
                </li>
              </ul>
              {/* ===============Nút đã đăng nhập============= */}

              {/* Dropdown Select End */}
              <button
                type="button"
                className="toggle-mobileMenu d-lg-none ms-3n text-gray-800 text-4xl d-flex js-open-menu"
              >
                <i className="ph ph-list" />
              </button>
            </div>
            {/* Middle Header Right End */}
          </nav>
        </div>
      </header>

      <main id="main-content" role="main" className="home-two">

        {/* ============================ Banner Section =============================== */}
        <BannerTwo />
        {/* ============================ Banner Section End =============================== */}

        {/* ============================ promotional banner Start ========================== */}
        <FeatureSection />
        {/* ============================ promotional banner End ========================== */}

        {/* ========================= TOP DEALS * SIÊU RẺ ================================ */}

        <TopDealsSection title="Top deal • Siêu rẻ" perPage={10} />
        {/* ========================= TOP DEALS * SIÊU RẺ End ================================ */}

        {/* ========================= QUÀ TẶNG ================================ */}
        <GiftEventsSection />
        {/* ========================= QUÀ TẶNG End ================================ */}

        {/* ========================= 3 Small Banners ============================== */}
        <div className="container px-0 mt-10 container-lg mb-70">
          <div className="row">
            <div className="col-lg-4">
              <div className="rounded-5">
                <a href="#" className="p-0 m-0">
                  <Image
                    src="/assets/images/bg/shopee-04.webp"
                    alt="Banner 1"
                    width={400}
                    height={200}
                    className="mb-10 banner-img w-100 h-100 object-fit-cover rounded-10"
                  />
                </a>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="rounded-5">
                <a href="#" className="p-0 m-0">
                  <Image
                    src="/assets/images/bg/shopee-06.jpg"
                    alt="Banner 2"
                    width={400}
                    height={200}
                    className="mb-10 banner-img w-100 h-100 object-fit-cover rounded-10"
                  />
                </a>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="rounded-5">
                <a href="#" className="p-0 m-0">
                  <Image
                    src="/assets/images/bg/shopee-07.jpg"
                    alt="Banner 3"
                    width={400}
                    height={200}
                    className="mb-10 banner-img w-100 h-100 object-fit-cover rounded-10"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>


        {/* ========================= DANH MỤC HÀNG ĐẦU ================================ */}
        <section className="mt-10 overflow-hidden trending-productss fix-scale-80" style={{ marginBottom: 0 }}>
          <div className="container px-0 container-lg">
            <div
              className="p-24 border border-gray-100 rounded-8"
              style={{ paddingBottom: 0, marginBottom: -64 }}
            >
              <TopCategoriesProducts />
            </div>
          </div>
        </section>
        {/* ========================= DANH MỤC HÀNG ĐẦU End ================================ */}

        {/* ========================= Banner Image ============================== */}
        <div className="container mt-0 mb-24 container-lg" style={{ marginTop: -220 }}>
          <div className="text-center">
            <a href="#" className="p-0 m-0 w-100 d-block">
              <Image
                src="/assets/images/bg/shopee-05.jpg"
                alt="Banner"
                width={1920}
                height={600}
                className="h-auto banner-img w-100 object-fit-cover rounded-10"
              />
            </a>
          </div>
        </div>
        {/* ========================= Banner Image End ============================== */}
        {/* ========================= THƯƠNG HIỆU HÀNG ĐẦU (HTML section) ================================ */}
        <TopBrandsStaticSection />
        {/* ========================= THƯƠNG HIỆU HÀNG ĐẦU (HTML section) End ================================ */}

        {/* ========================= THƯƠNG HIỆU HÀNG ĐẦU ================================ */}

        {/* ========================= Featured Products ============================ */}
        <FeaturedProductsStaticSection />

        {/* Hàng mới chào sân */}
        <LatestProductsSection />

        {/* Được quan tâm nhiều nhất */}
        <MostInterestedSection />

        {/* Bài viết khám phá */}
        <BlogSection />
      </main>
    </HomeDataProvider>
  );
}
