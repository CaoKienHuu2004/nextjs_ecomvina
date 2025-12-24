"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import FullHeader from "@/components/FullHeader";
import { useCart } from "@/hooks/useCart";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sieuthivina.com';

interface BienThe {
  id: number;
  id_loaibienthe: number;
  tenbienthe: string;
  giagoc: number;
  soluong: number;
  luottang: number;
  luotban: number;
  trangthai: string;
}

interface Product {
  id: number;
  ten: string;
  slug: string;
  mota?: string;
  giamgia?: number;
  bienthe: BienThe[];
  hinhanhsanpham?: Array<{ hinhanh: string }>;
}

export default function Page() {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<BienThe | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Lấy slug từ URL (giả sử bạn có slug trong route)
        const slug = "nuoc-yen-sao-nest100-duong-an-kieng-lo-70ml"; // Thay bằng dynamic slug
        const response = await fetch(`${API_URL}/api/v1/san-pham/${slug}`);
        const data = await response.json();

        if (data.status === 200 && data.sanpham) {
          setProduct(data.sanpham);
          // Chọn biến thể đầu tiên mặc định
          if (data.sanpham.bienthe && data.sanpham.bienthe.length > 0) {
            setSelectedVariant(data.sanpham.bienthe[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, []);

  // Xử lý thay đổi số lượng
  const handleQuantityChange = (newQty: number) => {
    if (!selectedVariant) return;

    // Giới hạn số lượng theo tồn kho
    const maxQty = selectedVariant.soluong;
    if (newQty < 1) newQty = 1;
    if (newQty > maxQty) newQty = maxQty;

    setQuantity(newQty);
  };

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return;

    if (selectedVariant.trangthai !== "Còn hàng" || selectedVariant.soluong < 1) {
      alert("Sản phẩm hiện đã hết hàng");
      return;
    }

    try {
      await addToCart({
        id_bienthe: selectedVariant.id,
        id: product.id,
        ten: product.ten,
        hinhanh: product.hinhanhsanpham?.[0]?.hinhanh || '',
        gia: selectedVariant.giagoc,
      }, quantity);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert("Có lỗi khi thêm vào giỏ hàng");
    }
  };

  // Kiểm tra trạng thái hết hàng
  const isOutOfStock = !selectedVariant || selectedVariant.trangthai !== "Còn hàng" || selectedVariant.soluong < 1;

  if (loading) {
    return (
      <>
        <FullHeader showClassicTopBar={true} showTopNav={false} />
        <div className="container py-80 text-center">
          <div className="spinner-border text-main-600" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <FullHeader showClassicTopBar={true} showTopNav={false} />
        <div className="container py-80 text-center">
          <p>Không tìm thấy sản phẩm</p>
        </div>
      </>
    );
  }

  const sampleImgs = product.hinhanhsanpham?.slice(0, 5) || [];
  const discountPercent = product.giamgia || 0;
  const originalPrice = selectedVariant?.giagoc || 0;
  const finalPrice = originalPrice;

  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      <div className="pt-40 mb-0 breadcrumb bg-main-two-60">
        <div className="container">
          <div className="flex-wrap gap-16 breadcrumb-wrapper flex-between">
            <h6 className="mb-0">Thông tin sản phẩm</h6>
            <ul className="flex-wrap gap-8 flex-align">
              <li className="text-sm">
                <Link href="/" className="gap-8 text-gray-900 flex-align hover-text-main-600">
                  <i className="ph ph-house" /> Trang chủ
                </Link>
              </li>
              <li className="flex-align">
                <i className="ph ph-caret-right" />
              </li>
              <li className="text-sm text-main-600">{product.ten}</li>
            </ul>
          </div>
        </div>
      </div>

      <section className="py-40 product-details">
        <div className="container">
          <div className="row gy-4">
            <div className="col-xl-9">
              <div className="row gy-4">
                <div className="col-xl-6">
                  <div className="product-details__left">
                    <div className="border border-gray-100 product-details__thumb-slider rounded-16">
                      {sampleImgs.map((img, i) => (
                        <div key={i} className="product-details__thumb flex-center h-100">
                          <img
                            src={`${API_URL}/assets/client/images/products/${img.hinhanh}`}
                            alt={`${product.ten}-${i}`}
                            onError={(e) => {
                              e.currentTarget.src = '/assets/images/thumbs/placeholder.png';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-xl-6">
                  <div className="product-details__content">
                    <h5 className="mb-12">{product.ten}</h5>

                    {/* ✅ TRẠNG THÁI SẢN PHẨM */}
                    <div className="mb-16">
                      {isOutOfStock ? (
                        <span className="px-12 py-6 text-sm text-white bg-danger-600 rounded-pill">
                          <i className="ph ph-x-circle me-1"></i>
                          Hết hàng
                        </span>
                      ) : (
                        <span className="px-12 py-6 text-sm text-white bg-success-600 rounded-pill">
                          <i className="ph ph-check-circle me-1"></i>
                          Còn hàng ({selectedVariant.soluong} sản phẩm)
                        </span>
                      )}
                    </div>

                    {/* GIÁ */}
                    <div className="flex-wrap gap-16 my-32 flex-align">
                      {discountPercent > 0 && (
                        <div className="gap-8 flex-align">
                          <div className="gap-8 flex-align text-main-two-600">
                            <i className="text-xl ph-fill ph-seal-percent" /> -{discountPercent}%
                          </div>
                        </div>
                      )}
                      <h6 className="mb-0">{new Intl.NumberFormat('vi-VN').format(finalPrice)} đ</h6>
                    </div>

                    <span className="pt-32 mt-32 text-gray-700 border-gray-100 border-top d-block" />

                    {/* ✅ CHỌN LOẠI SẢN PHẨM (BIẾN THỂ) */}
                    {product.bienthe && product.bienthe.length > 1 && (
                      <div className="mt-10">
                        <h6 className="mb-16">Loại sản phẩm</h6>
                        <div className="flex-wrap gap-8 flex-align">
                          {product.bienthe.map((variant) => (
                            <button
                              key={variant.id}
                              onClick={() => {
                                setSelectedVariant(variant);
                                setQuantity(1);
                              }}
                              className={`px-12 py-8 text-sm border rounded-8 ${selectedVariant?.id === variant.id
                                ? 'border-main-600 text-main-600 bg-main-50'
                                : 'border-gray-200 text-gray-900 hover-border-main-600'
                                }`}
                              disabled={variant.trangthai !== "Còn hàng" || variant.soluong < 1}
                            >
                              {variant.tenbienthe}
                              {(variant.trangthai !== "Còn hàng" || variant.soluong < 1) && (
                                <span className="ms-2 text-danger-600">(Hết)</span>
                              )}
                            </button>
                          ))}
                        </div>
                        <span className="pt-32 mt-32 text-gray-700 border-gray-100 border-top d-block" />
                      </div>
                    )}

                    <a href="https://www.whatsapp.com" className="gap-8 py-16 mt-16 btn btn-black flex-center rounded-8">
                      <i className="text-lg ph ph-whatsapp-logo" /> Liên hệ với cửa hàng
                    </a>
                  </div>
                </div>
              </div>

              {/* MÔ TẢ & ĐÁNH GIÁ */}
              <div className="pt-80">
                <div className="border product-dContent rounded-24">
                  <div className="flex-wrap gap-16 border-gray-100 product-dContent__header border-bottom flex-between">
                    <ul className="mb-3 nav common-tab nav-pills" role="tablist">
                      <li className="nav-item" role="presentation">
                        <button className="nav-link active" type="button" role="tab" aria-selected="true">Mô tả sản phẩm</button>
                      </li>
                    </ul>
                  </div>

                  <div className="product-dContent__box">
                    <div className="tab-content">
                      <div className="tab-pane fade show active">
                        <div className="mb-40">
                          <h6 className="mb-24">Mô tả về sản phẩm</h6>
                          <p>{product.mota || "Chưa có mô tả sản phẩm"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ SIDEBAR GIỎ HÀNG */}
            <div className="col-xl-3">
              <div className="px-32 py-40 border border-gray-100 product-details__sidebar rounded-16">
                <div className="mb-32">
                  <h6 className="mb-8 text-heading fw-semibold d-block">Số lượng</h6>

                  {/* ✅ HIỂN thị SỐ LƯỢNG TỒN KHO */}
                  {selectedVariant && (
                    <p className="mb-16 text-sm text-gray-600">
                      Còn lại: <span className="fw-semibold text-main-600">{selectedVariant.soluong}</span> sản phẩm
                    </p>
                  )}

                  {/* ✅ INPUT SỐ LƯỢNG VỚI GIỚI HẠN */}
                  <div className="overflow-hidden d-flex rounded-4">
                    <button
                      type="button"
                      className="flex-shrink-0 w-48 h-48 quantity__minus text-neutral-600 bg-gray-50 flex-center hover-bg-main-600 hover-text-white"
                      aria-label="Giảm số lượng"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={isOutOfStock || quantity <= 1}
                    >
                      <i className="ph ph-minus" />
                    </button>
                    <input
                      type="number"
                      className="w-32 px-16 text-center border border-gray-100 quantity__input flex-grow-1"
                      value={quantity}
                      min={1}
                      max={selectedVariant?.soluong || 1}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      aria-label="Số lượng"
                      disabled={isOutOfStock}
                    />
                    <button
                      type="button"
                      className="flex-shrink-0 w-48 h-48 quantity__plus text-neutral-600 bg-gray-50 flex-center hover-bg-main-600 hover-text-white"
                      aria-label="Tăng số lượng"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={isOutOfStock || quantity >= (selectedVariant?.soluong || 0)}
                    >
                      <i className="ph ph-plus" />
                    </button>
                  </div>
                </div>

                <div className="mb-32">
                  <div className="flex-wrap gap-8 pb-16 mb-16 border-gray-100 flex-between border-bottom">
                    <span className="text-gray-500">Giá</span>
                    <h6 className="mb-0 text-lg">
                      {new Intl.NumberFormat('vi-VN').format(finalPrice)} đ
                    </h6>
                  </div>
                </div>

                {/* ✅ NÚT THÊM GIỎ HÀNG VỚI DISABLE KHI HẾT HÀNG */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`gap-8 py-16 mt-48 btn flex-center rounded-8 fw-normal w-100 ${isOutOfStock
                    ? 'btn-secondary cursor-not-allowed'
                    : 'btn-main'
                    }`}
                >
                  {isOutOfStock ? (
                    <>
                      <i className="text-lg ph ph-x-circle" /> Hết hàng
                    </>
                  ) : (
                    <>
                      <i className="text-lg ph ph-shopping-cart-simple" /> Thêm vào giỏ hàng
                    </>
                  )}
                </button>

                <div className="mt-32">
                  <div className="gap-8 px-32 py-16 border border-gray-100 rounded-8 flex-between">
                    <a href="#" className="d-flex text-main-600 text-28" aria-label="Chat với cửa hàng">
                      <i className="ph-fill ph-chats-teardrop" />
                    </a>
                    <span className="border border-gray-100 h-26" />
                    <button className="d-flex text-main-600 text-28" type="button" aria-label="Chia sẻ sản phẩm">
                      <i className="ph-fill ph-share-network" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}