"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

// Interface cho API quà tặng mới
interface SanPhamDuocTang {
  id: number;
  id_loaibienthe: number;
  id_sanpham: number;
  giagoc: number;
  soluong: number;
  luottang: number;
  luotban: number;
  trangthai: string;
  deleted_at: string | null;
  giadagiam: number;
  pivot: {
    id_quatang: number;
    id_bienthe: number;
    soluongtang: number;
  };
  sanpham: {
    id: number;
    id_thuonghieu: number;
    ten: string;
    slug: string;
    mota: string;
    xuatxu: string;
    sanxuat: string;
    trangthai: string;
    giamgia: number;
    luotxem: number;
    deleted_at: string | null;
    thuonghieu: {
      id: number;
      ten: string;
      slug: string;
      logo: string;
      trangthai: string;
    };
    hinhanhsanpham: Array<{
      id: number;
      id_sanpham: number;
      hinhanh: string;
      trangthai: string;
      deleted_at: string | null;
    }>;
  };
  loaibienthe: {
    id: number;
    ten: string;
    trangthai: string;
  };
}

interface GiftEventAPI {
  id: number;
  id_chuongtrinh: number | null;
  dieukiensoluong: string;
  dieukiengiatri: number;
  tieude: string;
  slug: string;
  thongtin: string;
  hinhanh: string;
  luotxem: number;
  ngaybatdau: string;
  ngayketthuc: string;
  trangthai: string;
  deleted_at: string | null;
  sanphamduoctang: SanPhamDuocTang[];
}

interface GiftEventResponse {
  status: number;
  data: {
    current_page: number;
    data: GiftEventAPI[];
    last_page: number;
    total: number;
  };
}

// Hàm tính thời gian còn lại
function calculateTimeLeft(endDate: string): string {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "Đã kết thúc";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days} ngày ${hours} giờ`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} giờ ${minutes} phút`;
}

export default function GiftEventsSection() {
  const [gifts, setGifts] = useState<GiftEventAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    let alive = true;

    async function fetchGiftEvents() {
      try {
        const response = await fetch("https://sieuthivina.com/api/v1/qua-tang");
        const result: GiftEventResponse = await response.json();

        if (!alive) return;

        if (result.status === 200 && result.data?.data) {
          // Lọc chỉ lấy các quà tặng đang hiển thị và chưa hết hạn
          const activeGifts = result.data.data.filter((gift) => {
            const now = new Date();
            const endDate = new Date(gift.ngayketthuc);
            return gift.trangthai === "Hiển thị" && endDate > now;
          });
          console.log("✅ Quà tặng từ API mới:", activeGifts.length, "items");
          setGifts(activeGifts);
        }
      } catch (error) {
        console.error("Error fetching gift events:", error);
      } finally {
        if (alive) setLoading(false);
      }
    }

    fetchGiftEvents();

    return () => {
      alive = false;
    };
  }, []);

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
            <div className="d-flex flex-wrap justify-content-center" style={{ gap: "12px", marginLeft: "-20px" }}>
              {displayedGifts.map((gift) => {
                const timeLeft = calculateTimeLeft(gift.ngayketthuc);
                return (
                  <div key={gift.id} style={{ width: "244px", display: "inline-block" }}>
                    <div className="product-card p-card border border-gray-100 rounded-16 position-relative transition-2" style={{ height: "340px" }}>
                      <Link href={`/qua-tang?slug=${gift.slug}`}>
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

                      {/* Badge hiển thị số lượng sản phẩm được tặng */}
                      {gift.sanphamduoctang && gift.sanphamduoctang.length > 0 && (
                        <div
                          className="position-absolute d-flex align-items-center gap-4 bg-warning-600 text-white px-8 py-4 rounded-8"
                          style={{ top: "10px", left: "10px", zIndex: 3 }}
                        >
                          <i className="ph-fill ph-gift text-sm"></i>
                          <span className="text-xs fw-semibold">
                            x{gift.sanphamduoctang.reduce((sum, sp) => sum + (sp.pivot?.soluongtang || 1), 0)}
                          </span>
                        </div>
                      )}

                      {/* Hiển thị ảnh sản phẩm được tặng */}
                      {gift.sanphamduoctang && gift.sanphamduoctang.length > 0 && (
                        <div
                          className="position-absolute d-flex gap-4"
                          style={{ top: "10px", right: "10px", zIndex: 3 }}
                        >
                          {gift.sanphamduoctang.slice(0, 2).map((sp, idx) => {
                            const productImage = sp.sanpham?.hinhanhsanpham?.[0]?.hinhanh;
                            const imageUrl = productImage
                              ? `https://sieuthivina.com/assets/client/images/products/${productImage}`
                              : gift.hinhanh;
                            return (
                              <div
                                key={sp.id || idx}
                                className="bg-white rounded-circle border border-2 border-white shadow-sm"
                                style={{ width: "36px", height: "36px", overflow: "hidden" }}
                                title={sp.sanpham?.ten || "Sản phẩm tặng"}
                              >
                                <img
                                  src={imageUrl}
                                  alt={sp.sanpham?.ten || "Sản phẩm tặng"}
                                  className="w-100 h-100"
                                  style={{ objectFit: "cover" }}
                                  onError={(e) => {
                                    const img = e.currentTarget;
                                    img.onerror = null;
                                    img.src = gift.hinhanh;
                                  }}
                                />
                              </div>
                            );
                          })}
                          {gift.sanphamduoctang.length > 2 && (
                            <div
                              className="bg-gray-700 text-white rounded-circle d-flex align-items-center justify-content-center text-xs fw-semibold"
                              style={{ width: "36px", height: "36px" }}
                            >
                              +{gift.sanphamduoctang.length - 2}
                            </div>
                          )}
                        </div>
                      )}

                      <div
                        className="card-content p-14 w-100 position-absolute d-flex flex-column align-items-center"
                        style={{ bottom: 0, left: 0, zIndex: 2 }}
                      >
                        <div className="title text-lg fw-semibold mt-5 mb-5 text-center w-100">
                          <Link
                            href={`/qua-tang?slug=${gift.slug}`}
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
                            Còn lại <strong>{timeLeft}</strong>
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