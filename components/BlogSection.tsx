'use client';
import React from 'react';
import Link from 'next/link';
import { useHomeData } from '@/hooks/useHomeData';

const API_URL = 'https://sieuthivina.cloud';

export default function BlogSection() {
    const { data: homeData, loading } = useHomeData();
    const posts = homeData?.data?.posts_to_explore || [];

    if (!loading && posts.length === 0) {
        return null;
    }

    // Limit to 4 posts
    const displayPosts = posts.slice(0, 4);

    // Helper to get full image URL
    const getImageUrl = (hinhanh: string | undefined) => {
        if (!hinhanh) return '/assets/images/thumbs/placeholder.png';
        if (hinhanh.startsWith('http')) return hinhanh;
        return `${API_URL}${hinhanh}`;
    };

    return (
        <section className="blog pt-0 pb-50" style={{ marginTop: "-80px" }}>
            <div className="container container-lg px-0">
                <div className="section-heading mb-24">
                    <div className="flex-between flex-wrap gap-2">
                        <h6 className="mb-0 wow fadeInLeft" style={{ visibility: 'visible', animationName: 'fadeInLeft' }}>
                            <i className="ph-bold ph-hand-withdraw text-main-600"></i> Nhiều bài viết cần bạn khám phá
                        </h6>
                        <div className="border-bottom border-2 border-main-600 mb-3 mt-4" style={{ width: '71%' }}></div>
                    </div>
                </div>
                <div className="row gy-4">
                    {displayPosts.map((post) => (
                        <div key={post.id} className="col-xxl-3 col-xl-3 col-sm-6 col-xs-6">
                            <div className="border border-gray-100 hover-border-main-600 rounded-6 transition-1 h-100">
                                <Link href={`/bai-viet/${post.slug}`} className="flex-center rounded-8 bg-gray-50 position-relative overflow-hidden d-block">
                                    <img
                                        src={getImageUrl(post.hinhanh)}
                                        alt={post.tieude}
                                        className="w-100 rounded-top-2"
                                        style={{ height: '230px', objectFit: 'cover' }}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "https://sieuthivina.com/assets/client/images/thumbs/ca-phe-bao-tu-linh-chi-pha-vach-giup-tinh-tao-1.webp";
                                        }}
                                    />
                                </Link>
                                <div className="product-card__content w-100 align-items-stretch flex-column justify-content-between d-flex mt-10 px-10 pb-8">
                                    <h6 className="title text-lg fw-semibold mt-2 mb-2">
                                        <Link href={`/bai-viet/${post.slug}`} className="link text-line-2" tabIndex={0}>
                                            {post.tieude}
                                        </Link>
                                    </h6>
                                    <div className="flex-align justify-content-between mt-2">
                                        <div className="flex-align gap-6">
                                            <span className="text-xs fw-medium text-gray-500">
                                                <i className="ph-bold ph-calendar-blank"></i> {post.luotxem || 0} lượt xem
                                            </span>
                                        </div>
                                    </div>
                                    <span className="mt-10 text-gray-600 text-sm fw-normal" style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {post.noidung ? post.noidung.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...' : 'Không có mô tả'}
                                    </span>
                                    <div className="flex-align gap-12 mt-10">
                                        <Link href={`/bai-viet/${post.slug}`} className="text-sm fw-semibold text-main-600 hover-text-decoration-underline transition-1">
                                            Đọc thêm <i className="ph-bold ph-arrow-right"></i>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
