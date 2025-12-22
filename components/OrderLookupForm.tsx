"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const OrderLookupForm = () => {
  const router = useRouter();
  const [searchMadon, setSearchMadon] = useState("");
  const [searchSodienthoai, setSearchSodienthoai] = useState("");

  const handleSearch = (ev: React.FormEvent) => {
    ev.preventDefault();
    const madon = (searchMadon || "").trim();
    const sodienthoai = (searchSodienthoai || "").trim();

    if (!madon || !sodienthoai) {
      alert("Vui lòng nhập cả mã đơn hàng và số điện thoại");
      return;
    }

    router.push(`/tra-cuu-don-hang?madon=${encodeURIComponent(madon)}&sodienthoai=${encodeURIComponent(sodienthoai)}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="gap-8 px-16 py-16 mb-20 border border-gray-200 d-flex flex-column rounded-8"
    >
      <label className="pb-2 text-lg text-gray-900 fw-semibold" htmlFor="madon">
        Tra cứu đơn hàng
      </label>

      <input
        id="madon"
        name="madon"
        value={searchMadon}
        onChange={(e) => setSearchMadon(e.target.value)}
        placeholder="Nhập mã đơn hàng (VD: STV25122151)..."
        className="px-16 py-12 text-sm text-gray-900 border-gray-300 common-input w-100 rounded-4"
        autoComplete="off"
      />
      <input
        id="sodienthoai"
        name="sodienthoai"
        value={searchSodienthoai}
        onChange={(e) => setSearchSodienthoai(e.target.value)}
        placeholder="Nhập số điện thoại (VD: 0987654321)..."
        className="px-16 py-12 text-sm text-gray-900 border-gray-300 common-input w-100 rounded-4"
        autoComplete="off"
      />

      <button
        type="submit"
        className="py-12 mt-8 text-sm btn btn-main-two w-100 rounded-4 fw-medium"
      >
        Tra cứu
      </button>
    </form>
  );
};

export default OrderLookupForm; 