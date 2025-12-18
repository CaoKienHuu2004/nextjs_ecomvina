"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function FeatureSection() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(10); // Start at the first real item after clones

  const categories = [
    { name: "Sức khỏe", slug: "suc-khoe", image: "https://sieuthivina.com/assets/client/images/categories/suc-khoe.svg" },
    { name: "Thực phẩm chức năng", slug: "thuc-pham-chuc-nang", image: "https://sieuthivina.com/assets/client/images/categories/thuc-pham-chuc-nang.svg" },
    { name: "Chăm sóc cá nhân", slug: "cham-soc-ca-nhan", image: "https://sieuthivina.com/assets/client/images/categories/cham-soc-ca-nhan.svg" },
    { name: "Làm đẹp", slug: "lam-dep", image: "https://sieuthivina.com/assets/client/images/categories/lam-dep.svg" },
    { name: "Điện máy", slug: "dien-may", image: "https://sieuthivina.com/assets/client/images/categories/dien-may.svg" },
    { name: "Thiết bị y tế", slug: "thiet-bi-y-te", image: "https://sieuthivina.com/assets/client/images/categories/thiet-bi-y-te.svg" },
    { name: "Bách hóa", slug: "bach-hoa", image: "https://sieuthivina.com/assets/client/images/categories/bach-hoa.svg" },
    { name: "Nội thất - Trang trí", slug: "noi-that-trang-tri", image: "https://sieuthivina.com/assets/client/images/categories/noi-that-trang-tri.svg" },
    { name: "Mẹ & bé", slug: "me-va-be", image: "https://sieuthivina.com/assets/client/images/categories/me-va-be.svg" },
    { name: "Thời trang", slug: "thoi-trang", image: "https://sieuthivina.com/assets/client/images/categories/thoi-trang.svg" },
    { name: "Thực phẩm - đồ ăn", slug: "thuc-pham-do-an", image: "https://sieuthivina.com/assets/client/images/categories/thuc-pham-do-an.svg" },
  ];

  // Create clones for infinite loop effect
  const clonedItems = [...categories, ...categories, ...categories];
  const ITEM_WIDTH = 100;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Apply transform based on current index
    track.style.width = `${clonedItems.length * ITEM_WIDTH}px`;
    track.style.transform = `translate3d(-${currentIndex * ITEM_WIDTH}px, 0px, 0px)`;
    track.style.transition = 'transform 0.5s ease';
    track.style.opacity = '1';

    // Reset position without animation when at clone boundaries
    if (currentIndex <= 0) {
      track.style.transition = 'none';
      setCurrentIndex(categories.length);
      setTimeout(() => {
        if (track) track.style.transition = 'transform 0.5s ease';
      }, 50);
    } else if (currentIndex >= categories.length * 2) {
      track.style.transition = 'none';
      setCurrentIndex(categories.length);
      setTimeout(() => {
        if (track) track.style.transition = 'transform 0.5s ease';
      }, 50);
    }
  }, [currentIndex, categories.length, clonedItems.length, ITEM_WIDTH]);

  // Auto slide every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-16 pb-24 mt-10 feature bg-main-two-600 fix-scale-20 pt-28 rounded-6" id="featureSection">
      <div className="px-0">
        <div className="position-relative arrow-center">
          <div className="feature-item-wrapper slick-initialized slick-slider">
            <div className="slick-list draggable">
              <div
                className="slick-track"
                ref={trackRef}
              >
                {clonedItems.map((category, idx) => {
                  const isHidden = idx < currentIndex || idx >= currentIndex + 10;
                  return (
                    <div
                      key={idx}
                      className="slick-slide"
                      data-slick-index={idx - categories.length}
                      aria-hidden={isHidden ? 'true' : 'false'}
                    >
                      <div>
                        <div
                          className="text-center feature-item wow bounceIn aos-init aos-animate"
                          data-aos="fade-up"
                          data-aos-duration="400"
                        >
                          <div className="feature-item__thumb rounded-circle">
                            <Link
                              href={`/shop?category=${category.slug}`}
                              className="p-10 w-100 h-100 flex-center"
                            >
                              <Image
                                src={category.image}
                                alt={category.name}
                                width={32}
                                height={32}
                                unoptimized
                              />
                            </Link>
                          </div>
                          <div className="mt-16 feature-item__content">
                            <h6 className="mb-8 text-md fw-medium">
                              <Link
                                href={`/shop?category=${category.slug}`}
                                className="text-inherit"
                              >
                                {category.name}
                              </Link>
                            </h6>
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
      </div>
      <style jsx>{`
        .feature {
          background-color: #187575 !important; /* Mã màu xanh lá chuẩn */
          /* Hoặc bạn có thể dùng màu xanh đậm hơn: #198754 */
        }
        .feature-item-wrapper {
          position: relative;
          overflow: hidden;
        }
        .slick-list {
          overflow: hidden;
          position: relative;
        }
        .slick-track {
          display: flex;
          position: relative;
          overflow-x: auto; /* Cho phép cuộn ngang nếu nội dung tràn */
          scrollbar-width: none; /* Ẩn thanh cuộn trên Firefox */
        }
        .slick-track::-webkit-scrollbar {
          display: none; /* Ẩn thanh cuộn trên Chrome/Safari */
        }
        .slick-slide {
          flex-shrink: 0;
          width: 100px;
          padding: 0 5px;
        }
        .feature-item {
          width: 100%;
          display: inline-block;
          text-decoration: none;
        }
        .feature-item__thumb {
          background: #e9f7ee;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          transition: all 0.3s ease;
        }
        .feature-item__thumb:hover {
          background: #d5f0dd;
          transform: translateY(-2px);
          box-shadow: 0 3px 10px rgba(0, 178, 7, 0.15);
        }
        .feature-item__thumb img {
          max-width: 32px;
          max-height: 32px;
          object-fit: contain;
        }
        .feature-item__content {
          text-align: center;
        }
        .feature-item__content h6 {
          font-size: 11px;
          line-height: 1.3;
          margin-top: 6px;
          font-weight: 500;
          color: white; /* Đảm bảo chữ màu trắng trên nền xanh */
        }

        @media (max-width: 991px) {
          .feature-item__thumb {
            width: 55px;
            height: 55px;
          }
          .slick-slide {
            width: 90px;
          }
        }
        @media (max-width: 575px) {
          .feature-item__thumb {
            width: 50px;
            height: 50px;
          }
          .slick-slide {
            width: 80px;
          }
        }
      `}</style>
    </div>
  );
}
