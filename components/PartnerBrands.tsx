"use client";
import React, { useState, useEffect } from 'react';

type Brand = {
  id: number;
  name: string;
  slug: string;
  logo: string;
  link: string;
};

const PartnerBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const API = (process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.cloud").replace(/\/$/, "");
  const url = `${API}/api/brands`;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (!alive) return;
        if (Array.isArray(res)) setBrands(res);
        else if (Array.isArray(res?.data)) setBrands(res.data);
        else setBrands([]);
      })
      .catch(() => {
        if (alive) setBrands([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [url]);

  if (loading) {
    return <div className="p-12 text-center">Đang tải…</div>;
  }

  if (!brands.length) {
    return <div className="p-12 text-center">Không có thương hiệu.</div>;
  }

  return (
    <section className="top-selling-products overflow-hidden mb-10 fix-scale-30">
      <div className="container container-lg px-0">
        <div className="rounded-16">
          <div className="section-heading mb-24">
            <div className="flex-between flex-wrap">
              <h6 className="mb-0">
                <i className="ph-bold ph-storefront text-main-600"></i> Thương hiệu hàng đầu
              </h6>
              <div className="border-bottom border-2 border-main-600 mb-3 mt-4" style={{ width: '70%' }}></div>
              <div className="flex-align gap-16">
                <a href="/shop" className="text-sm fw-semibold text-gray-700 hover-text-main-600 hover-text-decoration-underline">
                  Xem đầy đủ
                </a>
                <div className="flex-align gap-8">
                  <button type="button" id="top-brand-prev" className="slick-prev flex-center rounded-circle border border-gray-100 hover-border-neutral-600 text-xl hover-bg-neutral-600 hover-text-white transition-1">
                    <i className="ph ph-caret-left"></i>
                  </button>
                  <button type="button" id="top-brand-next" className="slick-next flex-center rounded-circle border border-gray-100 hover-border-neutral-600 text-xl hover-bg-neutral-600 hover-text-white transition-1">
                    <i className="ph ph-caret-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="row g-12">
            <div className="col-md-12">
              <div className="top-brand-slider arrow-style-two">
                <div className="d-flex flex-wrap gap-3">
                  {brands.map((brand) => (
                    <div key={brand.id} style={{ width: '100%', display: 'inline-block', maxWidth: '460px' }}>
                      <div className="product-card hover-card-shadows h-100 p-5 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2 bg-white justify-content-center">
                        <a href={brand.link} className="product-card__thumb flex-center rounded-8 position-relative" style={{ height: '120px' }}>
                          <img src={brand.logo} alt={brand.name} className="object-fit-cover" style={{ width: '60%' }} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnerBrands;