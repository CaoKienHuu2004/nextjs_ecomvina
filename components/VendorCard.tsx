"use client";
import Link from "next/link";
import React from "react";

export default function VendorCard({
  href = "/vendor-two-details",
  title,
  productsText = "120 sản phẩm",
  cover = "/assets/images/thumbs/product-two-img1.png",
}: {
  href?: string;
  title: string;
  productsText?: string;
  cover?: string;
}) {

  return (
    <div className="border border-gray-100 rounded-12 p-16 h-100 d-flex flex-column">
      <Link href={href} className="d-block rounded-8 overflow-hidden border border-gray-100">
        <img src={cover} alt={title} style={{ width: "100%", height: 160, objectFit: "cover" }} />
      </Link>
      <h6 className="mt-12 mb-4">{title}</h6>
      <div className="mt-auto d-flex align-items-center justify-content-between">
        <span className="text-gray-700">{productsText}</span>
        <Link href={href} className="btn btn-main-two rounded-8 px-16 py-6">Xem</Link>
      </div>
    </div>
  );
}
