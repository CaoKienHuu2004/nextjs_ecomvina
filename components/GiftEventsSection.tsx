"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { type GiftEvent } from "@/lib/api";
import { useHomeData } from "@/hooks/useHomeData";

// Hàm tạo slug từ tiêu đề
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Bỏ dấu tiếng Việt
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9\s-]/g, "") // Bỏ ký tự đặc biệt
    .replace(/\s+/g, "-") // Thay khoảng trắng bằng -
    .replace(/-+/g, "-") // Bỏ - lặp
    .trim();
}

export default function GiftEventsSection() {
  const { data: homeData, loading: homeLoading } = useHomeData();
  const [gifts, setGifts] = useState<GiftEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 4;

  useEffect(() => {
    if (!homeData) return;

    let alive = true;
    try {
      if (!alive) return;
      const hotGifts = homeData.data?.hot_gift || [];
      console.log("✅ Quà tặng từ API:", hotGifts.length, "items");
      console.log("Hiển thị:", itemsPerPage, "items");
      console.log("Có mũi tên?", hotGifts.length > itemsPerPage);
      setGifts(hotGifts);
    } catch (error) {
      console.error("Error fetching gift events:", error);
    } finally {
      if (alive) setLoading(false);
    }
    return () => {
      alive = false;
    };
  }, [homeData]);

  if (loading) {
    return (
      <section className="deals-weeek pt-10 overflow-hidden fix-scale-30">
        <div className="container container-lg px-0">
          <div className="text-center py-5">Đang tải chương trình quà tặng...</div>
        </div>
      </section>
    );
  }

  if (gifts.length === 0) return null;

  // Tính toán items hiển thị (5 items)
  const displayedGifts = gifts.slice(currentIndex, currentIndex + itemsPerPage);

  // Nếu không đủ 5 items, lấy thêm từ đầu (circular)
  if (displayedGifts.length < itemsPerPage && gifts.length >= itemsPerPage) {
    const remaining = itemsPerPage - displayedGifts.length;
    displayedGifts.push(...gifts.slice(0, remaining));
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev - 1;
      // Quay vòng: nếu < 0 thì về cuối
      return newIndex < 0 ? Math.max(0, gifts.length - itemsPerPage) : newIndex;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev + 1;
      // Quay vòng: nếu vượt quá thì về đầu
      return newIndex >= gifts.length ? 0 : newIndex;
    });
  };

  // Luôn cho phép navigation nếu có nhiều hơn 5 items (để chuyển ảnh)
  const showNavigation = gifts.length > itemsPerPage;

  return (
    <section className="deals-weeek pt-10 overflow-hidden fix-scale-30">
      <div className="container container-lg px-0">
        <div className="">
          <div className="section-heading mb-24">
            <div className="flex-between flex-align flex-wrap gap-8 w-100">
              <h6
                className="mb-0 wow fadeInLeft flex-align gap-8"
                style={{ visibility: "visible", animationName: "fadeInLeft" }}
              >
                <i className="ph-bold ph-gift text-warning-700"></i> Chương trình ưu đãi quà tặng
              </h6>
              <div
                className="border-bottom border-2 border-warning-700 mb-3 mt-4"
                style={{ width: "55%" }}
              ></div>
              <div
                className="flex-align gap-16 wow fadeInRight"
                style={{ visibility: "visible", animationName: "fadeInRight" }}
              >
                <Link
                  href="/qua-tang"
                  className="text-sm fw-semibold text-warning-700 hover-text-warning-700 hover-text-decoration-underline"
                >
                  Xem tất cả
                </Link>
                <div className="flex-align gap-8">
                  <button
                    type="button"
                    id="gift-event-prev"
                    title="Quà trước"
                    aria-label="Xem quà trước"
                    onClick={handlePrev}
                    className="slick-prev flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 gift-nav-btn"
                  >
                    <i className="ph ph-caret-left"></i>
                  </button>
                  <button
                    type="button"
                    id="gift-event-next"
                    title="Quà tiếp"
                    aria-label="Xem quà tiếp theo"
                    onClick={handleNext}
                    className="slick-next flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 gift-nav-btn"
                  >
                    <i className="ph ph-caret-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="gift-event-slider arrow-style-two">
            <div className="d-flex flex-wrap justify-content-center" style={{ gap: "12px", marginLeft: "40px" }}>
              {displayedGifts.map((gift) => {
                // Tạo slug từ tieude nếu không có sẵn
                const giftSlug = gift.slug || createSlug(gift.tieude);
                return (
                  <div key={gift.id} style={{ width: "244px", display: "inline-block" }}>
                    <div className="product-card p-card border border-gray-100 rounded-16 position-relative transition-2" style={{ height: "340px" }}>
                      <Link href={`/chi-tiet-qt?slug=${giftSlug}`}>
                        <div
                          className="rounded-16"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundImage: `url('${gift.hinhanh}')`,
                            backgroundSize: "cover",
                            backgroundRepeat: "no-repeat",
                            zIndex: 1,
                            backgroundPosition: "center"
                          }}
                        >
                          <div
                            className="card-overlay rounded-16 transition-1"
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              width: "100%",
                              height: "50%",
                              background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
                              zIndex: 1
                            }}
                          ></div>
                        </div>
                      </Link>

                      <div
                        className="card-content p-14 w-100 position-absolute d-flex flex-column align-items-center"
                        style={{ bottom: 0, left: 0, zIndex: 2 }}
                      >
                        <div className="title text-lg fw-semibold mt-5 mb-5 text-center w-100">
                          <Link
                            href={`/chi-tiet-qt?slug=${giftSlug}`}
                            className="link text-line-2"
                            style={{ color: "white", display: "block" }}
                          >
                            {gift.tieude}
                          </Link>
                        </div>

                        <div className="flex-align gap-4 bg-gray-50 p-5 rounded-8">
                          <span className="text-main-600 text-md d-flex">
                            <i className="ph-bold ph-timer"></i>
                          </span>
                          <span className="text-gray-500 text-xs">
                            Còn lại <strong>{gift.thoigian_conlai}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}