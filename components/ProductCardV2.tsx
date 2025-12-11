"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { flyToCart } from "@/utils/flyToCart";
import { useCart } from "@/hooks/useCart";

type BadgeColor = "primary" | "danger" | "warning";
type SoldInfo = string | { current: number; total: number } | number;

type Props = {
  href?: string;
  img: string;
  title: string;
  price: number | string;
  oldPrice?: number | string;
  sold?: SoldInfo;
  ratingAverage?: number;
  ratingCount?: number;
  rating?: string;     // fallback text (vd: "4.8")
  reviews?: string;    // fallback text (vd: "(17k)")
  showHeart?: boolean;
  isWished?: boolean;
  onToggleWish?: () => void;
  // Optional secondary action to explicitly remove from wishlist
  showUnwishButton?: boolean;
  onUnwish?: () => void;
  badge?: { text: string; color: BadgeColor }; // vd: { text: "Miễn phí", color: "primary" }
  variantId?: number; // id biến thể chuẩn để AddToCart chính xác
  id_chuongtrinh?: number; // ID chương trình quà tặng
  loaibienthe?: string; // Loại biến thể (ví dụ: "Đỏ - Size M")
  thuonghieu?: string;  // Thương hiệu
  slug?: string;        // Slug sản phẩm
  uiStyle?: "default" | "shop";
};

const colorMap: Record<BadgeColor, string> = {
  primary: "bg-primary-600",
  danger: "bg-danger-600",
  warning: "bg-warning-600",
};

const fmtVND = (v?: number | string) =>
  typeof v === "number" ? v.toLocaleString("vi-VN") + " đ" : v;

const deriveSold = (sold?: SoldInfo): { percent: number; label: string } => {
  if (sold == null) return { percent: 35, label: "Sold: 18/35" };
  if (typeof sold === "number") {
    const p = Math.max(0, Math.min(100, Math.round(sold)));
    return { percent: p, label: `Sold: ${p}%` };
  }
  if (typeof sold === "string") {
    const m = sold.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (m) {
      const cur = parseInt(m[1], 10);
      const tot = Math.max(1, parseInt(m[2], 10));
      const p = Math.max(0, Math.min(100, Math.round((cur / tot) * 100)));
      return { percent: p, label: `Sold: ${cur}/${tot}` };
    }
    return { percent: 35, label: `Sold: ${sold}` };
  }
  const cur = Math.max(0, Math.round(sold.current));
  const tot = Math.max(1, Math.round(sold.total));
  const p = Math.max(0, Math.min(100, Math.round((cur / tot) * 100)));
  return { percent: p, label: `Sold: ${cur}/${tot}` };
};

export default function ProductCardV2(props: Props) {
  const {
    href,
    img,
    title,
    price,
    oldPrice,
    sold,
    ratingAverage,
    ratingCount,
    rating,
    reviews,
    badge,
    showHeart = true,
    isWished,
    onToggleWish,
    variantId,
    showUnwishButton,
    onUnwish,
    loaibienthe,
    thuonghieu,
    id_chuongtrinh,
    slug,
    uiStyle = "default",
  } = props;

  // UI variants
  const isShopStyle = uiStyle === "shop";

  const containerClass = isShopStyle
    ? "product-card h-100 border border-gray-100 hover-border-main-600 rounded-6 position-relative transition-2"
    : "p-16 bg-white border border-gray-100 product-card h-100 hover-border-main-600 rounded-16 position-relative transition-2";

  const contentClass = isShopStyle
    ? "product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex mt-10 px-10 pb-8"
    : "mt-16 product-card__content";

  const priceValueClass = isShopStyle ? "text-heading text-lg fw-semibold" : "text-heading text-md fw-semibold";
  const oldPriceClass = isShopStyle ? "text-gray-400 text-sm fw-semibold text-decoration-line-through" : "text-gray-400 text-md fw-semibold text-decoration-line-through";

  const dest = href || "/product-details";
  const priceText = fmtVND(price) || "";
  const oldText = fmtVND(oldPrice);
  const ratingText =
    typeof ratingAverage === "number" ? ratingAverage.toFixed(1) : (rating ?? "4.8");
  const reviewsText =
    typeof ratingCount === "number" ? `(${ratingCount})` : (reviews ?? "(17k)");
  const soldInfo = deriveSold(sold);

  const thumbRef = useRef<HTMLAnchorElement | null>(null);
  const { addToCart } = useCart();

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.nativeEvent as any).stopImmediatePropagation?.();

    try {
      let id = variantId;
      if (!id) return; {
        const url = new URL(dest, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        const last = url.pathname.split('/').pop();
        const parsed = last ? parseInt(last, 10) : NaN;
        if (Number.isFinite(parsed)) id = parsed;
      }
      if (!id) {
        // console.error("❌ Không xác định được sản phẩm");
        return;
      }

      // Xây dựng payload theo AddToCartInput của useCart
      const productInput = {
        id_bienthe: id,
        id,
        ten: title,
        hinhanh: img,
        gia: typeof price === "number" ? { current: price, before_discount: typeof oldPrice === "number" ? oldPrice : 0 } : undefined,
        loaibienthe: loaibienthe || "",
        thuonghieu: thuonghieu || "",
        id_chuongtrinh: id_chuongtrinh || "",
        slug: slug || href?.split('/').pop() || "",
      };

      await addToCart(productInput, 1,props.id_chuongtrinh);
      const el = thumbRef.current;
      if (el) flyToCart(el);
    } catch (err) {
      console.error("❌ ProductCardV2: Error:", err);
    }
  };

  return (
    <div
      className={containerClass}
      style={{ position: "relative" }}
    >
      {/* === BADGE (ví dụ: Miễn phí) — góc trái trên === */}
      {badge ? (
        <span
          className={`product-card__badge ${colorMap[badge.color]} text-white text-sm px-8 py-4 position-absolute inset-block-start-0 inset-inline-start-0`}
          style={{ lineHeight: 1, zIndex: 50, top: 8, left: 8 }}
        >
          {badge.text}
        </span>
      ) : null}

      {/* === WISHLIST: đặt NGOÀI <Link>, mirror sang góc phải trên (logical inset) === */}
      {showHeart && (
        <button
          data-wish
          type="button"
          aria-label={isWished ? "Bỏ yêu thích" : "Yêu thích"}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWish?.(); }}
          className={isWished
            ? "bg-danger-600 text-white flex-center rounded-circle w-36 h-36"
            : "bg-white text-gray-700 flex-center rounded-circle w-36 h-36"}
          style={{
            position: "absolute",
            top: 8,          // <-- bắt buộc có
            right: 8,        // <-- bắt buộc có
            left: "auto",
            bottom: "auto",
            transform: "none",
            zIndex: 60,
            boxShadow: "0 2px 8px rgba(0,0,0,.06)",
            cursor: "pointer",
          }}
        >
          <i className={isWished ? "ph-fill ph-heart" : "ph ph-heart"} />
        </button>
      )}


      {/* === THUMBNAIL === */}
      <Link
        href={dest}
        ref={thumbRef}
        className="overflow-hidden product-card__thumb flex-center rounded-8 bg-gray-50 position-relative"
      >
        <Image
          src={img}
          alt={title}
          width={220}
          height={180}
          className="w-auto"
          unoptimized={/^https?:\/\//.test(img)}
        />
      </Link>

      {/* === CONTENT === */}
      <div className={contentClass}>
        <h6 className="mt-12 mb-8 text-lg title fw-semibold">
          <Link href={dest} className="link text-line-2">
            {title}
          </Link>
        </h6>

        {/* rating block unchanged */}

        <div className="product-card__price mt-5">
          {oldText ? (
            <span className={oldPriceClass}>
              {" "}{oldText}
            </span>
          ) : null}
          <span className={priceValueClass}>
            {priceText}
          </span>
        </div>

        {/* {!isShopStyle && (
          <div className="gap-8 d-flex mt-12">
            <button
              type="button"
              onClick={handleAdd}
              className="gap-8 px-24 product-card__cart btn bg-gray-50 text-heading hover-bg-main-600 hover-text-white py-11 rounded-8 flex-center fw-medium flex-grow-1"
              style={{
                pointerEvents: 'auto',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 100
              }}
            >
              Thêm vào giỏ hàng <i className="ph ph-shopping-cart" />
            </button>
            {showUnwishButton && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnwish?.(); }}
                className="gap-8 px-16 product-card__cart btn bg-gray-50 text-heading hover-bg-main-600 hover-text-white py-11 rounded-8 flex-center fw-medium"
                title="Bỏ yêu thích"
              >
                <i className="ph ph-heart-break" />
              </button>
            )}
          </div>
        )} */}

        <div className="gap-6 mt-16 mb-20 flex-align">
          <span className="text-xs text-gray-500 fw-medium">{ratingText}</span>
          <span className="text-xs fw-medium text-warning-600 d-flex">
            <i className="ph-fill ph-star" />
          </span>
          <span className="text-xs text-gray-500 fw-medium">{reviewsText}</span>
        </div>

        <div className="mt-8">
          <div
            className="h-4 progress w-100 bg-color-three rounded-pill"
            role="progressbar"
            aria-valuenow={soldInfo.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="progress-bar bg-main-two-600 rounded-pill"
              style={{ width: `${soldInfo.percent}%` }}
            />
          </div>
          <span className="mt-8 text-xs text-gray-900 fw-medium">{soldInfo.label}</span>
        </div>

        <div className="my-20 product-card__price">
          {oldText ? (
            <span className="text-gray-400 text-md fw-semibold text-decoration-line-through">
              {" "}{oldText}
            </span>
          ) : null}
          <span className="text-heading text-md fw-semibold ">
            {priceText} <span className="text-gray-500 fw-normal">/Qty</span>
          </span>
        </div>

        <div className="gap-8 d-flex">
          <button
            type="button"
            onClick={handleAdd}
            className="gap-8 px-24 product-card__cart btn bg-gray-50 text-heading hover-bg-main-600 hover-text-white py-11 rounded-8 flex-center fw-medium flex-grow-1"
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 100
            }}
          >
            Thêm vào giỏ hàng <i className="ph ph-shopping-cart" />
          </button>
          {showUnwishButton && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnwish?.(); }}
              className="gap-8 px-16 product-card__cart btn bg-gray-50 text-heading hover-bg-main-600 hover-text-white py-11 rounded-8 flex-center fw-medium"
              title="Bỏ yêu thích"
            >
              <i className="ph ph-heart-break" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
