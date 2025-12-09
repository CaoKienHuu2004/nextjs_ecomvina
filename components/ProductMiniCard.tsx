"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { flyToCart } from "@/utils/flyToCart";

export type ProductMiniCardProps = {
  href: string;
  img: string;
  title: string;
  price?: number | null;
  priceBefore?: number | null;
  variantId?: number;
  loaibienthe?: string;
  thuonghieu?: string;
  slug?: string;
};

const fmtVND = (v?: number | null) =>
  typeof v === "number" ? `${v.toLocaleString("vi-VN")} đ` : v == null ? "Liên hệ" : String(v);

export default function ProductMiniCard({ href, img, title, price, priceBefore, variantId, loaibienthe, thuonghieu, slug }: ProductMiniCardProps) {
  const thumbRef = useRef<HTMLAnchorElement | null>(null);
  const { addToCart } = useCart();

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      let id = variantId;
      if (!id) {
        const url = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        const last = url.pathname.split('/').pop();
        const parsed = last ? parseInt(last, 10) : NaN;
        if (Number.isFinite(parsed)) id = parsed;
      }
      if (!id) {
        console.error("❌ Không xác định được sản phẩm");
        return;
      }

      // Truyền đầy đủ thông tin sản phẩm
      const productInput = {
        id_bienthe: id,
        id,
        ten: title,
        hinhanh: img,
        gia: {
          current: typeof price === "number" ? price : 0,
          before_discount: typeof priceBefore === "number" ? priceBefore : 0,
        },
        loaibienthe: loaibienthe || "",
        thuonghieu: thuonghieu || "",
        slug: slug || href?.split('/').pop() || "",
      };

      await addToCart(productInput, 1);
      flyToCart(thumbRef.current as HTMLElement | null);
    } catch (err) {
      console.error("❌ ProductMiniCard: Error:", err);
    }
  }; const hasSale = typeof priceBefore === 'number' && typeof price === 'number' && priceBefore > price;

  return (
    <div className="p-12 bg-white border border-gray-100 rounded-12 h-100 d-flex flex-column">
      <Link href={href} ref={thumbRef} className="bg-gray-50 rounded-8 d-flex align-items-center justify-content-center" style={{ height: 140 }}>
        <Image src={img} alt={title} width={180} height={140} className="w-auto h-100" />
      </Link>
      <div className="mt-10 flex-grow-1 d-flex flex-column">
        <h6 className="text-sm fw-semibold line-clamp-2 mb-8">
          <Link href={href} className="link">{title}</Link>
        </h6>
        <div className="mb-10">
          {hasSale ? (
            <>
              <span className="text-xs text-gray-400 text-decoration-line-through">{fmtVND(priceBefore)}</span>
              <span className="ms-8 text-sm text-heading fw-semibold">{fmtVND(price)}</span>
            </>
          ) : (
            <span className="text-sm text-heading fw-semibold">{fmtVND(price)}</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="mt-auto btn bg-gray-50 hover-bg-main-600 hover-text-white text-heading py-8 rounded-8 w-100"
        >
          Thêm vào giỏ hàng
        </button>
      </div>
    </div>
  );
}
