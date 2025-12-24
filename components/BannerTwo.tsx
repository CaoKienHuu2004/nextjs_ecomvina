"use client";

import React from "react";
import Image from "next/image";
import { type HomeBanner } from "@/lib/api";
import { useHomeData } from "@/hooks/useHomeData";
import FeatureSection from "./FeatureSection";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";

const FALLBACK_IMG = "/assets/images/bg/shopee-06.jpg";

const POS = {
  HOME: "home_banner_slider",
  EVENT1: "home_banner_event_1",
  EVENT2: "home_banner_event_2",
  EVENT3: "home_banner_event_3",
  EVENT4: "home_banner_event_4",
} as const;

const buildImgUrl = (file: string) => {
  if (!file) return FALLBACK_IMG;
  if (/^https?:\/\//i.test(file) || file.startsWith("/")) return file;
  return file;
};

export default function BannerTwo() {
  const { data: homeData, loading: homeLoading } = useHomeData();
  const [loading, setLoading] = React.useState(true);
  const [homeSlides, setHomeSlides] = React.useState<HomeBanner[]>([]);
  const [sideBoxes, setSideBoxes] = React.useState<HomeBanner[]>([]);

  // refs cho prev/next và swiper instance
  const prevRef = React.useRef<HTMLButtonElement | null>(null);
  const nextRef = React.useRef<HTMLButtonElement | null>(null);
  const swiperRef = React.useRef<SwiperType | null>(null);

  React.useEffect(() => {
    if (!homeData) return;

    let alive = true;

    const sortByOrder = (a: HomeBanner, b: HomeBanner) =>
      (a.thutu ?? 9999) - (b.thutu ?? 9999) || a.id - b.id;

    try {
      if (!alive) return;

      const raw = homeData.data?.new_banners || [];
      console.log("Raw banners:", raw.length, "Banners:", raw.map(b => ({ id: b.id, vitri: b.vitri, trangthai: b.trangthai })));

      const active = raw.filter((b) => !b.trangthai || b.trangthai === "Hiển thị" || b.trangthai === "hoat_dong");
      console.log("Active banners:", active.length);

      // Tách theo "vitri" như backend quy định
      const home = active.filter((b) => b.vitri === POS.HOME).sort(sortByOrder);

      const wantedOrder = [POS.EVENT1, POS.EVENT2, POS.EVENT3, POS.EVENT4];
      const sidesPicked: HomeBanner[] = [];

      for (const key of wantedOrder) {
        const found = active.find((b) => b.vitri === key);
        if (found) sidesPicked.push(found);
      }

      // Fallback: nếu thiếu ô bên phải, bổ sung những banner còn lại (không trùng)
      if (sidesPicked.length < 4) {
        const used = new Set<number>([
          ...home.map((x) => x.id),
          ...sidesPicked.map((x) => x.id),
        ]);
        const rest = active.filter((b) => !used.has(b.id)).sort(sortByOrder);
        for (const x of rest) {
          if (sidesPicked.length >= 4) break;
          sidesPicked.push(x);
        }
      }

      // Thêm fallback banners nếu không đủ slides
      const finalHomeSlides = [...home];
      if (finalHomeSlides.length < 2) {
        const fallbackBanners: HomeBanner[] = [
          {
            id: 9001,
            vitri: "home_banner_slider",
            hinhanh: "https://sieuthivina.cloud/assets/client/images/bg/banner-droppii-1.png",
            lienket: "https://droppii.vn",
            mota: "Banner Droppii 1",
            trangthai: "Hiển thị",
            thutu: 1
          },
          {
            id: 9002,
            vitri: "home_banner_slider",
            hinhanh: "https://sieuthivina.cloud/assets/client/images/bg/banner-droppii-2.png",
            lienket: "https://droppii.vn",
            mota: "Banner Droppii 2",
            trangthai: "Hiển thị",
            thutu: 2
          }
        ];

        // Thêm các banner chưa có
        fallbackBanners.forEach(fb => {
          if (!finalHomeSlides.find(s => s.hinhanh === fb.hinhanh)) {
            finalHomeSlides.push(fb);
          }
        });
      }

      console.log("Home slides:", finalHomeSlides.length, "Side boxes:", sidesPicked.length);
      setHomeSlides(finalHomeSlides);
      setSideBoxes(sidesPicked.slice(0, 4));
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      if (alive) setLoading(false);
    }

    return () => {
      alive = false;
    };
  }, [homeData]);

  if (loading) {
    return (
      <div className="banner-two">
        <div className="container container-lg">
          <div className="text-center py-5">Đang tải banner...</div>
        </div>
      </div>
    );
  }

  if (homeSlides.length === 0 && sideBoxes.length === 0) {
    console.log("No banners to display");
    return null;
  }

  // Chia 4 ô nhỏ thành 2 cột
  const sideCol1 = sideBoxes.slice(0, 2);
  const sideCol2 = sideBoxes.slice(2, 4);

  return (
    <div className="banner-two fix-scale-20">
      <div className="container container-lg px-0">
        <div className="row g-20">
          {/* Trái: Slider lớn */}
          <div className="col-lg-6">
            <div className="banner-two-wrapper d-flex align-items-start">
              <div className="banner-item-two-wrapper rounded-5 overflow-hidden position-relative arrow-center flex-grow-1 mb-0 mt-20 ms-0">
                <Swiper
                  modules={[Autoplay, Pagination, Navigation]}
                  autoplay={homeSlides.length > 1 ? {
                    delay: 4000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  } : false}
                  loop={homeSlides.length > 1}
                  speed={600}
                  slidesPerView={1}
                  pagination={{
                    clickable: true,
                    dynamicBullets: false
                  }}
                  // navigation={false}
                  onSwiper={(swiper) => { swiperRef.current = swiper; }}
                  className="banner-item-two__slider"
                >
                  {homeSlides.map((b) => {
                    const img = buildImgUrl(b.hinhanh || "");
                    // Nếu banner chứa "qua-tang" hoặc "quatang" trong URL ảnh, link đến trang quà tặng
                    const imgLower = img.toLowerCase();
                    const isQuaTangBanner = imgLower.includes("qua-tang") || imgLower.includes("quatang");
                    const href = isQuaTangBanner ? "/qua-tang" : (b.lienket || "#");
                    const alt = b.mota || "Banner";
                    return (
                      <SwiperSlide key={`main-${b.id}`}>
                        <a href={href} className="d-flex align-items-center justify-content-between flex-wrap-reverse flex-sm-nowrap gap-32">
                          <img
                            src={img}
                            alt={alt}
                            className="d-lg-block d-none rounded-5"
                            style={{ width: "100%", height: "595px", objectFit: "cover" }}
                          />
                          <img
                            src={img}
                            alt={alt}
                            className="d-block d-lg-none rounded-5"
                            style={{ width: "100%", height: "300px", objectFit: "cover" }}
                          />
                        </a>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>

                {homeSlides.length > 0 && (
                  <>
                    <button
                      type="button"
                      id="banner-prev"
                      className="flex-center rounded-circle text-xl position-absolute top-50 translate-middle-y bg-white text-main-600 hover-bg-main-600 hover-text-white transition-1"
                      style={{
                        left: "16px",
                        width: "44px",
                        height: "44px",
                        zIndex: 50,
                        border: "none",
                      }}
                      onClick={() => swiperRef.current?.slidePrev()}
                      aria-label="Slide trước"
                    >
                      <i className="ph-bold ph-caret-left"></i>
                    </button>
                    <button
                      type="button"
                      id="banner-next"
                      className="flex-center rounded-circle text-xl position-absolute top-50 translate-middle-y bg-white text-main-600 hover-bg-main-600 hover-text-white transition-1"
                      style={{
                        right: "16px",
                        width: "44px",
                        height: "44px",
                        zIndex: 50,
                        border: "none",
                      }}
                      onClick={() => swiperRef.current?.slideNext()}
                      aria-label="Slide tiếp theo"
                    >
                      <i className="ph-bold ph-caret-right"></i>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="row">
              {/* Phải: 4 ô nhỏ - Cột 1 */}
              <div className="col-12 col-lg-6 mt-20 ps-10 pe-5 d-lg-block d-none">
                {sideCol1.map((b, idx) => {
                  const img = buildImgUrl(b.hinhanh || "");
                  // Kiểm tra banner theo URL ảnh và link đến shop với filter thương hiệu tương ứng
                  const imgLower = img.toLowerCase();
                  const isNest100Banner = imgLower.includes("nest100");
                  const isChatVietBanner = imgLower.includes("chatviet");
                  const isQuaTangSideBanner = imgLower.includes("uudaiquatang") || imgLower.includes("uu-dai-qua-tang");

                  let href = b.lienket || "#";
                  if (isNest100Banner) {
                    href = "/shop?thuonghieu=global-yen-sao-nest100";
                  } else if (isChatVietBanner) {
                    href = "/shop?thuonghieu=chat-viet-group";
                  } else if (isQuaTangSideBanner) {
                    href = "/qua-tang";
                  }

                  const alt = b.mota || "Banner";
                  return (
                    <div key={`s1-${b.id}-${idx}`} className={idx === 1 ? "row g-24 mt-10 me-0" : "row g-24 me-0"}>
                      <a href={href} className="p-0 m-0">
                        <img
                          src={img}
                          alt={alt}
                          className="p-0 rounded-5"
                          style={{ width: "100%", height: "200px", objectFit: "cover" }}
                        />
                      </a>
                    </div>
                  );
                })}
              </div>

              {/* Phải: 4 ô nhỏ - Cột 2 */}
              <div className="col-12 col-lg-6 mt-20 px-5 d-lg-block d-none">
                {sideCol2.map((b, idx) => {
                  const img = buildImgUrl(b.hinhanh || "");
                  // Kiểm tra banner theo URL ảnh và link đến trang phù hợp
                  const imgLower = img.toLowerCase();
                  const isNest100Banner = imgLower.includes("nest100");
                  const isChatVietBanner = imgLower.includes("chatviet");
                  const isQuaTangSideBanner = imgLower.includes("uudaiquatang") || imgLower.includes("uu-dai-qua-tang");

                  let href = b.lienket || "#";
                  if (isNest100Banner) {
                    href = "/shop?thuonghieu=global-yen-sao-nest100";
                  } else if (isChatVietBanner) {
                    href = "/shop?thuonghieu=chat-viet-group";
                  } else if (isQuaTangSideBanner) {
                    href = "/qua-tang";
                  }

                  const alt = b.mota || "Banner";
                  return (
                    <div key={`s2-${b.id}-${idx}`} className={idx === 1 ? "row g-24 mt-10 ms-0 w-100" : "row g-24 ms-0 w-100"}>
                      <a href={href} className="p-0 m-0">
                        <img
                          src={img}
                          alt={alt}
                          className="p-0 rounded-5"
                          style={{ width: "100%", height: "200px", objectFit: "cover" }}
                        />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="row">
              <div className="col-lg-12 px-0">
                <FeatureSection />
              </div>
            </div>
          </div>

        </div>

        {/* Row dưới: Section Danh mục (Feature Section) */}

      </div>
    </div>
  );
}
