'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

export default function BlogDetailPage() {
    const searchParams = useSearchParams();
    const idParam = searchParams.get('id');
    const currentId = idParam ? parseInt(idParam, 10) : undefined;

    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const loadPosts = async () => {
            try {
                setLoading(true);
                const data = await fetchBlogPosts();
                setPosts(data);

                if (data.length > 0) {
                    const found = currentId
                        ? data.find((p) => p.id === currentId)
                        : data[0];
                    setCurrentPost(found || data[0]);
                } else {
                    setCurrentPost(null);
                }
            } catch (error) {
                console.error('Error loading blog posts:', error);
                setCurrentPost(null);
            } finally {
                setLoading(false);
            }
        };

        loadPosts();
    }, [currentId]);

    const recentPosts = posts.slice(0, 4);

    const getImageUrl = (url?: string): string => {
        if (!url || !url.trim()) {
            // Ảnh placeholder nội bộ trong dự án (public/assets/...)
            return '/assets/images/thumbs/default-product.png';
        }
        if (url.startsWith('http')) return url;
        // Chuẩn hóa relative path từ API
        return `http://148.230.100.215${url.startsWith('/') ? url : `/${url}`}`;
    };

    return (
        <>
            <FullHeader showClassicTopBar={true} showTopNav={false} />

            <div className="page">
                <section className="blog-details py-80">
                    <div className="container container-lg">
                        <div className="row gy-5">
                            {/* Main Content */}
                            <div className="col-lg-8 pe-xl-4">
                                {loading && (
                                    <div className="text-center py-40">
                                        <div className="spinner-border text-main-600" role="status">
                                            <span className="visually-hidden">Đang tải...</span>
                                        </div>
                                    </div>
                                )}

                                {!loading && !currentPost && (
                                    <div className="text-center py-40">
                                        <p className="text-lg text-gray-600 mb-8">Không tìm thấy bài viết.</p>
                                        <p className="text-sm text-gray-500">Vui lòng quay lại trang chủ hoặc chọn bài khác.</p>
                                    </div>
                                )}

                                {!loading && currentPost && (
                                    <div className="blog-item-wrapper">
                                        <div className="blog-item">
                                            <img
                                                src={getImageUrl(currentPost.hinhanh)}
                                                alt={currentPost.tieude}
                                                className="cover-img rounded-16"
                                                style={{ width: '100%', height: 'auto' }}
                                            />
                                            <div className="blog-item__content mt-24">
                                                <span className="bg-main-50 text-main-600 py-4 px-24 rounded-8 mb-16 d-inline-block">
                                                    Bài viết nổi bật
                                                </span>
                                                <h4 className="mb-24">{currentPost.tieude}</h4>

                                                <div
                                                    className="text-gray-700 mb-24 border-bottom border-gray-100 pb-24"
                                                    dangerouslySetInnerHTML={{ __html: currentPost.noidung }}
                                                />

                                                <div className="flex-align flex-wrap gap-24">
                                                    <div className="flex-align flex-wrap gap-8">
                                                        <span className="text-lg text-main-600">
                                                            <i className="ph ph-chats-circle"></i>
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            <span className="text-gray-500 hover-text-main-600">
                                                                {currentPost.luotxem} Lượt xem
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation */}
                                <div className="my-48 flex-between flex-sm-nowrap flex-wrap gap-24">
                                    <div>
                                        <button
                                            type="button"
                                            className="mb-20 h6 text-gray-500 text-lg fw-normal hover-text-main-600"
                                            disabled
                                        >
                                            Trước đó
                                        </button>
                                    </div>
                                    <div className="text-end">
                                        <button
                                            type="button"
                                            className="mb-20 h6 text-gray-500 text-lg fw-normal hover-text-main-600"
                                            disabled
                                        >
                                            Tiếp theo
                                        </button>
                                    </div>
                                </div>

                                <div className="my-48">
                                    <span className="border-bottom border-gray-100 d-block"></span>
                                </div>
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
                                            className={`d-flex align-items-center flex-sm-nowrap flex-wrap gap-24 ${index !== recentPosts.length - 1 ? 'mb-16' : 'mb-0'}`}
                                        >
                                            <Link
                                                href={`/bai-viet?id=${post.id}`}
                                                className="w-100 h-100 rounded-4 overflow-hidden flex-shrink-0"
                                                style={{ width: '120px', height: '120px', maxWidth: '120px' }}
                                            >
                                                <img
                                                    src={getImageUrl(post.hinhanh as any)}
                                                    alt={post.tieude}
                                                    className="cover-img"
                                                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                                />
                                            </Link>
                                            <div className="flex-grow-1">
                                                <h6 className="text-lg">
                                                    <Link href={`/bai-viet?id=${post.id}`} className="text-line-3">
                                                        {post.tieude}
                                                    </Link>
                                                </h6>
                                                <div className="flex-align flex-wrap gap-8">
                                                    <span className="text-lg text-main-600">
                                                        <i className="ph ph-calendar-dots"></i>
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        <span className="text-gray-500 hover-text-main-600">
                                                            {post.date}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Categories */}
                                <div className="blog-sidebar border border-gray-100 rounded-8 p-32 mb-40">
                                    <h6 className="text-xl mb-32 pb-32 border-bottom border-gray-100">
                                        Danh mục
                                    </h6>
                                    <ul>
                                        {categories.map((category, index) => (
                                            <li key={category.name} className={index !== categories.length - 1 ? 'mb-16' : 'mb-0'}>
                                                <Link
                                                    href={`/bai-viet?category=${encodeURIComponent(category.name)}`}
                                                    className="flex-between gap-8 text-gray-700 border border-gray-100 rounded-4 p-4 ps-16 hover-border-main-600 hover-text-main-600"
                                                >
                                                    <span>{category.name} ({category.count})</span>
                                                    <span className="w-40 h-40 flex-center rounded-4 bg-main-50 text-main-600">
                                                        <i className="ph ph-arrow-right"></i>
                                                    </span>
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
