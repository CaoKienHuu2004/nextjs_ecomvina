"use client";

import React from "react";
import Image from "next/image";
import { useHomeData } from "@/hooks/useHomeData";

interface DynamicBannersProps {
    /** Loại banner cần hiển thị */
    bannerType: "promotion" | "ads";
    /** Class bổ sung cho container */
    className?: string;
}

/**
 * Component hiển thị banners động từ API
 * - promotion: 3 banner khuyến mãi nhỏ (home_banner_promotion_1, 2, 3)
 * - ads: 1 banner quảng cáo lớn (home_banner_ads)
 */
export default function DynamicBanners({ bannerType, className = "" }: DynamicBannersProps) {
    const { data, loading } = useHomeData();

    // Lấy banners theo vitri
    const getBannersByVitri = (vitri: string) => {
        return data?.data?.new_banners?.filter(b => b.vitri === vitri) || [];
    };

    if (bannerType === "promotion") {
        const banner1 = getBannersByVitri("home_banner_promotion_1")[0];
        const banner2 = getBannersByVitri("home_banner_promotion_2")[0];
        const banner3 = getBannersByVitri("home_banner_promotion_3")[0];

        // Fallback images nếu API chưa có dữ liệu
        const fallbackBanners = [
            { hinhanh: "/assets/images/bg/banner3_hopquatang.webp", lienket: "#", mota: "Banner 1" },
            { hinhanh: "/assets/images/bg/banner3_vienuonggiairuou.webp", lienket: "#", mota: "Banner 2" },
            { hinhanh: "/assets/images/bg/banner3_yensam.webp", lienket: "#", mota: "Banner 3" },
        ];

        const banners = [
            banner1 || fallbackBanners[0],
            banner2 || fallbackBanners[1],
            banner3 || fallbackBanners[2],
        ];

        return (
            <div className={`container px-0 mt-10 container-lg mb-70 ${className}`}>
                <div className="row">
                    {banners.map((banner, index) => (
                        <div key={index} className="col-lg-4">
                            <div className="rounded-5">
                                <a href={banner.lienket || "#"} className="p-0 m-0">
                                    {loading ? (
                                        <div
                                            className="mb-10 banner-img w-100 rounded-10 bg-gray-100 animate-pulse"
                                            style={{ height: '130px' }}
                                        />
                                    ) : (
                                        <Image
                                            src={banner.hinhanh}
                                            alt={banner.mota || `Banner ${index + 1}`}
                                            width={600}
                                            height={260}
                                            quality={100}
                                            className="mb-10 banner-img w-100 object-fit-cover rounded-10"
                                            style={{ height: '130px', objectFit: 'cover' }}
                                            unoptimized={banner.hinhanh?.startsWith('http')}
                                        />
                                    )}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (bannerType === "ads") {
        const adsBanner = getBannersByVitri("home_banner_ads")[0];
        const fallbackBanner = {
            hinhanh: "/assets/images/bg/banner5.webp",
            lienket: "#",
            mota: "Banner quảng cáo"
        };

        const banner = adsBanner || fallbackBanner;

        return (
            <div className={`container mt-0 mb-24 container-lg ${className}`} style={{ marginTop: -220 }}>
                <div className="text-center">
                    <a href={banner.lienket || "#"} className="p-0 m-0 w-100 d-block">
                        {loading ? (
                            <div
                                className="h-auto banner-img w-100 rounded-10 bg-gray-100 animate-pulse"
                                style={{ height: '200px' }}
                            />
                        ) : (
                            <Image
                                src={banner.hinhanh}
                                alt={banner.mota || "Banner"}
                                width={1920}
                                height={600}
                                className="h-auto banner-img w-100 object-fit-cover rounded-10"
                                unoptimized={banner.hinhanh?.startsWith('http')}
                            />
                        )}
                    </a>
                </div>
            </div>
        );
    }

    return null;
}
