'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { productDetailUrl } from '@/utils/paths';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sieuthivina.com';

interface ProductImage {
  id?: number;
  hinhanh?: string;
}

interface BienThe {
  id: number;
  giagoc?: number;
  giadagiam?: number;
  soluong?: number;
  trangthai?: string;
  loaibienthe?: {
    id?: number;
    ten?: string;
  };
}

interface Product {
  id: number;
  ten: string;
  slug: string;
  giamgia?: number;
  luotxem?: number;
  luotban?: number;
  hinhanhsanpham?: ProductImage[];
  bienthe?: BienThe[];
  // Fallback fields
  giagoc?: number;
  giadagiam?: number;
  hinhanh?: string;
}

interface ProductCardProps {
  product: Product;
  category?: string;
  showBadge?: boolean;
  badgeText?: string;
  badgeClass?: string;
}

export default function ProductCard({
  product,
  category,
  showBadge = false,
  badgeText = '',
  badgeClass = 'bg-main-600'
}: ProductCardProps) {
  const { addToCart, loading: cartLoading } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Lấy thông tin biến thể
  const variants = product.bienthe || [];
  const hasOnlyOneVariant = variants.length === 1;
  const firstVariant = variants[0];

  // Lấy giá từ biến thể đầu tiên hoặc fallback
  const price = firstVariant?.giadagiam || firstVariant?.giagoc || product.giadagiam || product.giagoc || 0;
  const originalPrice = firstVariant?.giagoc || product.giagoc || 0;
  const discountPercent = product.giamgia || 0;

  // Kiểm tra còn hàng
  const isInStock = hasOnlyOneVariant
    ? (firstVariant?.trangthai === 'Còn hàng' && (firstVariant?.soluong || 0) > 0)
    : variants.some(v => v.trangthai === 'Còn hàng' && (v.soluong || 0) > 0);

  // Lấy hình ảnh
  const getImageUrl = () => {
    const slug = product.slug;
    if (slug) {
      return `${API_URL}/assets/client/images/thumbs/${slug}-1.webp`;
    }
    const img = product.hinhanhsanpham?.[0]?.hinhanh || product.hinhanh;
    if (!img) return '/assets/images/thumbs/placeholder.png';
    if (img.startsWith('http')) return img;
    return `${API_URL}/assets/client/images/products/${img}`;
  };

  // Format giá
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  // Xử lý thêm vào giỏ hàng (chỉ cho sản phẩm 1 biến thể)
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!hasOnlyOneVariant || !firstVariant || addingToCart || !isInStock) return;

    setAddingToCart(true);
    try {
      await addToCart({
        id_bienthe: firstVariant.id,
        id: product.id,
        ten: product.ten,
        hinhanh: getImageUrl(),
        gia: price,
      }, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const productUrl = productDetailUrl({
    slug: product.slug,
    id: product.id,
  }) + (category ? `&category=${encodeURIComponent(category)}` : '');

  return (
    <div
      className="product-card h-100 p-8 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badge */}
      {showBadge && badgeText && (
        <span className={`product-card__badge ${badgeClass} px-8 py-4 text-sm text-white position-absolute inset-inline-start-0 inset-block-start-0`}>
          {badgeText}
        </span>
      )}

      {/* Discount Badge */}
      {discountPercent > 0 && (
        <span className="product-card__badge bg-danger-600 px-8 py-4 text-sm text-white position-absolute inset-inline-end-0 inset-block-start-0">
          -{discountPercent}%
        </span>
      )}

      {/* Product Image */}
      <Link href={productUrl} className="product-card__thumb flex-center">
        <img
          src={getImageUrl()}
          alt={product.ten}
          className="w-100"
          style={{ height: '180px', objectFit: 'cover' }}
          onError={(e) => {
            const img = e.currentTarget;
            img.onerror = null;
            img.src = '/assets/images/thumbs/placeholder.png';
          }}
        />
      </Link>

      {/* Product Content */}
      <div className="product-card__content p-sm-2">
        <h6 className="title text-lg fw-semibold mt-12 mb-8">
          <Link href={productUrl} className="link text-line-2" title={product.ten}>
            {product.ten}
          </Link>
        </h6>

        {/* Variant info */}
        {hasOnlyOneVariant && firstVariant?.loaibienthe?.ten && (
          <span className="text-xs text-gray-500 mb-8 d-block">
            {firstVariant.loaibienthe.ten}
          </span>
        )}

        {!hasOnlyOneVariant && variants.length > 1 && (
          <span className="text-xs text-gray-500 mb-8 d-block">
            {variants.length} loại
          </span>
        )}

        {/* Price */}
        <div className="product-card__price flex-align gap-8 flex-wrap">
          <span className="text-heading text-md fw-semibold">
            {formatPrice(price)} đ
          </span>
          {discountPercent > 0 && originalPrice > price && (
            <span className="text-gray-400 text-md fw-semibold text-decoration-line-through">
              {formatPrice(originalPrice)} đ
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex-align gap-6 mt-8">
          <span className="text-xs fw-medium text-gray-500">
            Đã bán {product.luotban || 0}
          </span>
        </div>

        {/* ✅ NÚT THÊM GIỎ HÀNG - CHỈ HIỆN KHI CÓ 1 BIẾN THỂ VÀ HOVER */}
        {hasOnlyOneVariant && isHovered && (
          <div className="product-card__cart mt-12">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addingToCart || cartLoading || !isInStock}
              className="product-card__cart-btn bg-main-50 text-main-600 hover-bg-main-600 hover-text-white py-11 px-24 rounded-pill flex-center gap-8 fw-medium w-100 transition-1"
            >
              {!isInStock ? (
                <>
                  <i className="ph ph-x-circle"></i>
                  Hết hàng
                </>
              ) : addingToCart ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Đang thêm...
                </>
              ) : (
                <>
                  <i className="ph ph-shopping-cart"></i>
                  Thêm giỏ hàng
                </>
              )}
            </button>
          </div>
        )}

        {/* ✅ LINK XEM CHI TIẾT - CHỈ HIỆN KHI CÓ NHIỀU BIẾN THỂ VÀ HOVER */}
        {!hasOnlyOneVariant && variants.length > 1 && isHovered && (
          <div className="product-card__cart mt-12">
            <Link
              href={productUrl}
              className="product-card__cart-btn bg-gray-50 text-gray-600 hover-bg-main-600 hover-text-white py-11 px-24 rounded-pill flex-center gap-8 fw-medium w-100 transition-1"
            >
              <i className="ph ph-eye"></i>
              Xem {variants.length} loại
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}