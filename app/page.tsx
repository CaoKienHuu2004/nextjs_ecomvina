"use client";
import React, { useEffect, useState } from "react";
import LatestProductsSection from "@/components/LatestProductsSection";
import MostInterestedSection from "@/components/MostInterestedSection";
import TopBrandsStaticSection from "@/components/TopBrandsStaticSection";
import FeaturedProductsStaticSection from "@/components/FeaturedProductsStaticSection";
import BannerTwo from "@/components/BannerTwo";
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
import FullHeader from "@/components/FullHeader";
import DynamicBanners from "@/components/DynamicBanners";

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


      {/* Header với giao diện mới qua FullHeader */}
      <FullHeader showClassicTopBar={true} showTopNav={false} />


      <main className="home-two">
        {/* ============================ Banner Section =============================== */}
        <BannerTwo />
        {/* ============================ Banner Section End =============================== */}


        {/* ========================= TOP DEALS * SIÊU RẺ ================================ */}
        <TopDealsSection title="Top deal • Siêu rẻ" perPage={10} />
        {/* ========================= TOP DEALS * SIÊU RẺ End ================================ */}

        {/* ========================= QUÀ TẶNG ================================ */}
        <GiftEventsSection />
        {/* ========================= QUÀ TẶNG End ================================ */}

        {/* ========================= 3 Small Banners (Dynamic) ============================== */}
        <DynamicBanners bannerType="promotion" />

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

        {/* ========================= Banner Image (Dynamic) ============================== */}
        <DynamicBanners bannerType="ads" />
        {/* ========================= Banner Image End ============================== */}
        {/* ========================= THƯƠNG HIỆU HÀNG ĐẦU (HTML section) ================================ */}
        <TopBrandsStaticSection />
        {/* ========================= THƯƠNG HIỆU HÀNG ĐẦU (HTML section) End ================================ */}

        {/* ========================= Featured Products ============================ */}
        <FeaturedProductsStaticSection />

        {/* Hàng mới chào sân */}
        <LatestProductsSection />

        {/* Được quan tâm nhiều nhất */}
        <MostInterestedSection />

        {/* Bài viết khám phá (đã tích hợp baivietnoibat từ API V1) */}
        <BlogSection />
      </main>
    </HomeDataProvider >
  );
}
