"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import LatestProductsSection from "@/components/LatestProductsSection";
import MostInterestedSection from "@/components/MostInterestedSection";
import TopBrandsStaticSection from "@/components/TopBrandsStaticSection";
import FeaturedProductsStaticSection from "@/components/FeaturedProductsStaticSection";
import BannerTwo from "@/components/BannerTwo";
import FeatureSection from "@/components/FeatureSection";
import FullHeader from "@/components/FullHeader";
import PreloaderFix from "@/components/PreloaderFix";
import OverlayLayers from "@/components/OverlayLayers";
import ScrollTopProgress from "@/components/ScrollTopProgress";
import SearchOverlay from "@/components/SearchOverlay";
import MobileMenu from "@/components/MobileMenu";
import TopDealsSection from "@/components/TopDealsSection";
import GiftEventsSection from "@/components/GiftEventsSection";
import TopCategoriesProducts from "@/components/TopCategoriesProducts";
import CouponSection from "@/components/CouponSection";
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

      {/* Header với thanh đỏ và header chính */}
      <FullHeader showClassicTopBar={true} showTopNav={false} />

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
        <div className="container container-lg mt-10 mb-70 px-0">
          <div className="row">
            <div className="col-lg-4">
              <div className="rounded-5">
                <a href="#" className="p-0 m-0">
                  <Image
                    src="/assets/images/bg/shopee-04.webp"
                    alt="Banner 1"
                    width={400}
                    height={200}
                    className="banner-img w-100 h-100 object-fit-cover rounded-10 mb-10"
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
                    className="banner-img w-100 h-100 object-fit-cover rounded-10 mb-10"
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
                    className="banner-img w-100 h-100 object-fit-cover rounded-10 mb-10"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>


        {/* ========================= DANH MỤC HÀNG ĐẦU ================================ */}
        <section className="trending-productss overflow-hidden mt-10 fix-scale-80" style={{ marginBottom: 0 }}>
          <div className="container container-lg px-0">
            <div
              className="border border-gray-100 p-24 rounded-8"
              style={{ paddingBottom: 0, marginBottom: -64 }}
            >
              <TopCategoriesProducts />
            </div>
          </div>
        </section>
        {/* ========================= DANH MỤC HÀNG ĐẦU End ================================ */}

        {/* ========================= Banner Image ============================== */}
        <div className="container container-lg mt-0 mb-24" style={{ marginTop: -220 }}>
          <div className="text-center">
            <a href="#" className="p-0 m-0 w-100 d-block">
              <Image
                src="/assets/images/bg/shopee-05.jpg"
                alt="Banner"
                width={1920}
                height={600}
                className="banner-img w-100 h-auto object-fit-cover rounded-10"
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

        {/* ========================= MÃ GIẢM GIÁ ================================ */}
        <CouponSection />
        {/* ========================= MÃ GIẢM GIÁ End ================================ */}

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
