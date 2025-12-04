"use client";
import Link from "next/link";
import React from "react";
import Image from "next/image";

export default function Header() {
  return (
    <header className="border-b border-neutral-200 py-3 bg-white">
      <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
        <nav className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center">
              <Image src="/assets/images/logo/logo_nguyenban.png" alt="Logo" width={140} height={36} style={{ height: 36, width: "auto" }} />
            </Link>
          </div>
          <form action="#" className="relative hidden md:block w-1/2">
            <input
              type="text"
              className="w-full rounded-full bg-neutral-100 py-2.5 pl-4 pr-12 outline-none"
              placeholder="Tìm kiếm sản phẩm, danh mục hoặc cửa hàng..."
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-main-600">
              <i className="ph-bold ph-magnifying-glass"></i>
            </button>
          </form>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/yeu-thich" className="inline-flex items-center gap-2">
              <i className="ph-bold ph-shopping-cart"></i>
              <span>Giỏ hàng</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
