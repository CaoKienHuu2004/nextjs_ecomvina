'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import FullHeader from '@/components/FullHeader';
import { BlogPost, fetchBlogPosts } from '@/lib/api';

const categories = [
    { name: 'Gaming', count: 12 },
    { name: 'Smart Gadget', count: 5 },
    { name: 'Software', count: 29 },
    { name: 'Electronics', count: 24 },
    { name: 'Laptop', count: 8 },
    { name: 'Mobile & Accessories', count: 16 },
    { name: 'Apliance', count: 24 }
];

export default function BlogDetailSlugPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    const slug = resolvedParams.slug;

    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadPosts = async () => {
            try {
                setLoading(true);
                const data = await fetchBlogPosts();
                setPosts(data);

                // Tìm bài viết theo slug
                const found = data.find((p) => p.slug === slug);
                setCurrentPost(found || null);
            } catch (error) {
                console.error('Error loading blog posts:', error);
                setCurrentPost(null);
            } finally {
                setLoading(false);
            }
        };

        loadPosts();
    }, [slug]);

    const recentPosts = posts.filter(p => p.slug !== slug).slice(0, 4);

    const getImageUrl = (url?: string): string => {
        if (!url || !url.trim()) {
            return '/assets/images/thumbs/default-product.png';
        }
        if (url.startsWith('http')) return url;
        return `http://148.230.100.215${url.startsWith('/') ? url : `/${url}`}`;
    };

    if (loading) {
        return (
            <>
                <FullHeader showClassicTopBar={true} showTopNav={false} />
                <div className="container text-center py-80">
                    <div className="spinner-border text-main-600" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                </div>
            </>
        );
    }

    if (!currentPost) {
        return (
            <>
                <FullHeader showClassicTopBar={true} showTopNav={false} />
                <div className="container text-center py-80">
                    <h4 className="text-danger mb-3">Không tìm thấy bài viết</h4>
                    <p className="text-gray-600 mb-4">Bài viết bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
                    <Link href="/" className="btn btn-main-600">Về trang chủ</Link>
                </div>
            </>
        );
    }

    return (
        <>
            <FullHeader showClassicTopBar={true} showTopNav={false} />

            <div className="page">
                {/* Breadcrumb */}
                <section className="breadcrumb py-26 bg-main-two-50">
                    <div className="container container-lg">
                        <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
                            <h6 className="mb-0">Chi tiết bài viết</h6>
                            <ul className="flex-align gap-8 flex-wrap">
                                <li className="text-sm">
                                    <Link href="/" className="text-gray-900 flex-align gap-8 hover-text-main-600">
                                        <i className="ph ph-house"></i>
                                        Trang chủ
                                    </Link>
                                </li>
                                <li className="flex-align">
                                    <i className="ph ph-caret-right"></i>
                                </li>
                                <li className="text-sm text-main-600">Bài viết</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="blog-details py-80">
                    <div className="container container-lg">
                        <div className="row gy-5">
                            {/* Main Content */}
                            <div className="col-lg-8 pe-xl-4">
                                <div className="blog-item-wrapper">
                                    <div className="blog-item">
                                        <img
                                            src={getImageUrl(currentPost.hinhanh)}
                                            alt={currentPost.tieude}
                                            className="cover-img rounded-16"
                                            style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'cover' }}
                                        />
                                        <div className="blog-item__content mt-24">
                                            <span className="bg-main-50 text-main-600 py-4 px-24 rounded-8 mb-16 d-inline-block">
                                                Bài viết nổi bật
                                            </span>
                                            <h4 className="mb-24">{currentPost.tieude}</h4>

                                            <div className="flex-align flex-wrap gap-24 mb-24 pb-24 border-bottom border-gray-100">
                                                <div className="flex-align flex-wrap gap-8">
                                                    <span className="text-lg text-main-600">
                                                        <i className="ph ph-calendar-dots"></i>
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {currentPost.date || new Date().toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                                <div className="flex-align flex-wrap gap-8">
                                                    <span className="text-lg text-main-600">
                                                        <i className="ph ph-eye"></i>
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {currentPost.luotxem || 0} Lượt xem
                                                    </span>
                                                </div>
                                            </div>

                                            <div
                                                className="text-gray-700 mb-24"
                                                style={{
                                                    lineHeight: '1.8',
                                                    fontSize: '16px'
                                                }}
                                                dangerouslySetInnerHTML={{ __html: currentPost.noidung }}
                                            />

                                            {/* Tags */}
                                            <div className="mt-40 pt-40 border-top border-gray-100">
                                                <div className="flex-align flex-wrap gap-16">
                                                    <span className="text-gray-900 fw-semibold">Tags:</span>
                                                    <div className="flex-align flex-wrap gap-8">
                                                        <Link href="#" className="text-sm bg-gray-50 px-16 py-8 rounded-8 hover-bg-main-600 hover-text-white transition-1">
                                                            Tin tức
                                                        </Link>
                                                        <Link href="#" className="text-sm bg-gray-50 px-16 py-8 rounded-8 hover-bg-main-600 hover-text-white transition-1">
                                                            Sức khỏe
                                                        </Link>
                                                        <Link href="#" className="text-sm bg-gray-50 px-16 py-8 rounded-8 hover-bg-main-600 hover-text-white transition-1">
                                                            Khuyến mãi
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Between Posts */}
                                {posts.length > 1 && (
                                    <div className="my-48 flex-between flex-sm-nowrap flex-wrap gap-24">
                                        <div>
                                            {(() => {
                                                const currentIndex = posts.findIndex(p => p.slug === slug);
                                                const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
                                                return prevPost ? (
                                                    <Link
                                                        href={`/bai-viet/${prevPost.slug}`}
                                                        className="h6 text-gray-500 text-lg fw-normal hover-text-main-600"
                                                    >
                                                        <i className="ph ph-arrow-left me-2"></i>
                                                        Bài trước
                                                    </Link>
                                                ) : (
                                                    <span className="h6 text-gray-300 text-lg fw-normal">
                                                        <i className="ph ph-arrow-left me-2"></i>
                                                        Bài trước
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <div className="text-end">
                                            {(() => {
                                                const currentIndex = posts.findIndex(p => p.slug === slug);
                                                const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
                                                return nextPost ? (
                                                    <Link
                                                        href={`/bai-viet/${nextPost.slug}`}
                                                        className="h6 text-gray-500 text-lg fw-normal hover-text-main-600"
                                                    >
                                                        Bài tiếp
                                                        <i className="ph ph-arrow-right ms-2"></i>
                                                    </Link>
                                                ) : (
                                                    <span className="h6 text-gray-300 text-lg fw-normal">
                                                        Bài tiếp
                                                        <i className="ph ph-arrow-right ms-2"></i>
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="col-lg-4 ps-xl-4">
                                {/* Recent Posts */}
                                <div className="blog-sidebar border border-gray-100 rounded-8 p-32 mb-40">
                                    <h6 className="text-xl mb-32 pb-32 border-bottom border-gray-100">
                                        Bài viết gần đây
                                    </h6>

                                    {recentPosts.map((post, index) => (
                                        <div
                                            key={post.id}
                                            className={`d-flex align-items-center flex-sm-nowrap flex-wrap gap-24 ${index !== recentPosts.length - 1 ? 'mb-24 pb-24 border-bottom border-gray-100' : 'mb-0'}`}
                                        >
                                            <Link
                                                href={`/bai-viet/${post.slug}`}
                                                className="rounded-4 overflow-hidden flex-shrink-0"
                                                style={{ width: '100px', height: '100px' }}
                                            >
                                                <img
                                                    src={getImageUrl(post.hinhanh as any)}
                                                    alt={post.tieude}
                                                    className="w-100 h-100"
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            </Link>
                                            <div className="flex-grow-1">
                                                <h6 className="text-md mb-8">
                                                    <Link href={`/bai-viet/${post.slug}`} className="text-line-2 hover-text-main-600">
                                                        {post.tieude}
                                                    </Link>
                                                </h6>
                                                <div className="flex-align gap-8">
                                                    <span className="text-sm text-main-600">
                                                        <i className="ph ph-calendar-blank"></i>
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {post.date || 'Mới đăng'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {recentPosts.length === 0 && (
                                        <p className="text-sm text-gray-500 text-center py-20">
                                            Chưa có bài viết khác
                                        </p>
                                    )}
                                </div>

                                {/* Categories */}
                                <div className="blog-sidebar border border-gray-100 rounded-8 p-32">
                                    <h6 className="text-xl mb-32 pb-32 border-bottom border-gray-100">
                                        Danh mục
                                    </h6>
                                    <ul>
                                        {categories.map((category, index) => (
                                            <li key={category.name} className={index !== categories.length - 1 ? 'mb-16' : 'mb-0'}>
                                                <Link
                                                    href={`/bai-viet?category=${encodeURIComponent(category.name)}`}
                                                    className="flex-between gap-8 text-gray-700 border border-gray-100 rounded-4 p-12 ps-16 hover-border-main-600 hover-text-main-600 transition-1"
                                                >
                                                    <span>{category.name}</span>
                                                    <span className="text-sm text-gray-500">({category.count})</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

        </>
    );
}
