"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import BenefitsStrip from "@/components/BenefitsStrip";
import FullHeader from "@/components/FullHeader";

export default function Page() {
  // Apply template-level classes to <html> to match vendor-two-details.html
  useEffect(() => {
    const cls = ["color-two", "font-exo", "header-style-two"];
    const html = document.documentElement;
    cls.forEach(c => html.classList.add(c));
    return () => {
      cls.forEach(c => html.classList.remove(c));
    };
  }, []);
  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />
      {/* ========================= Breadcrumb Start =============================== */}
      <div className="breadcrumb mb-0 py-26 bg-main-two-50">
        <div className="container container-lg">
          <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
            <h6 className="mb-0">Vendor Details</h6>
            <ul className="flex-align gap-8 flex-wrap">
              <li className="text-sm">
                <Link href="/" className="text-gray-900 flex-align gap-8 hover-text-main-600">
                  <i className="ph ph-house"></i>
                  Home
                </Link>
              </li>
              <li className="flex-align">
                <i className="ph ph-caret-right"></i>
              </li>
              <li className="text-sm text-main-600"> Vendor Details </li>
            </ul>
          </div>
        </div>
      </div>
      {/* ========================= Breadcrumb End =============================== */}

      {/* ============================== Vendor Two Details Start =============================== */}
      <section className="vendor-two-details py-80">
        <div className="container container-lg">
          <div className="vendor-two-details-wrapper d-flex flex-wrap align-items-start gap-24">
            {/* Shop Sidebar Start */}
            <div className="shop-sidebar">
              <button
                type="button"
                className="shop-sidebar__close d-lg-none d-flex w-32 h-32 flex-center border border-gray-100 rounded-circle hover-bg-main-600 bg-main-600 position-absolute inset-inline-end-0 me-10 mt-8 text-white border-main-600"
              >
                <i className="ph ph-x"></i>
              </button>
              <div className="d-flex flex-column gap-12 px-lg-0 px-3 py-lg-0 py-4">
                <div className="bg-neutral-600 rounded-8 p-24">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="w-80 h-80 flex-center bg-white rounded-8 flex-shrink-0">
                      <Image src="/assets/images/thumbs/vendors-two-icon1.png" alt="" width={64} height={64} />
                    </span>
                    <div className="d-flex flex-column gap-24">
                      <button type="button" className="text-uppercase group border border-white px-16 py-8 rounded-pill text-white text-sm hover-bg-main-two-600 hover-text-white hover-border-main-two-600 transition-2 flex-center gap-8 w-100">
                        FOLLOW
                        <span className="text-xl d-flex text-main-two-600 group-item-white transition-2">
                          <i className="ph ph-storefront"></i>
                        </span>
                      </button>
                      <button type="button" className="text-uppercase group border border-white px-16 py-8 rounded-pill text-white text-sm hover-bg-main-two-600 hover-text-white hover-border-main-two-600 transition-2 flex-center gap-8 w-100">
                        Chat Now
                        <span className="text-xl d-flex text-main-two-600 group-item-white transition-2">
                          <i className="ph ph-storefront"></i>
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-32">
                    <h6 className="text-white fw-semibold mb-12">
                      <Link href="/vendor-two-details" className="">
                        Baishakhi Plus
                      </Link>
                    </h6>
                    <span className="text-xs text-white mb-12">480589 Followers</span>
                    <div className="flex-align gap-6">
                      <div className="flex-align gap-8">
                        <span className="text-xs fw-medium text-warning-600 d-flex">
                          <i className="ph-fill ph-star"></i>
                        </span>
                        <span className="text-xs fw-medium text-warning-600 d-flex">
                          <i className="ph-fill ph-star"></i>
                        </span>
                        <span className="text-xs fw-medium text-warning-600 d-flex">
                          <i className="ph-fill ph-star"></i>
                        </span>
                        <span className="text-xs fw-medium text-warning-600 d-flex">
                          <i className="ph-fill ph-star"></i>
                        </span>
                        <span className="text-xs fw-medium text-warning-600 d-flex">
                          <i className="ph-fill ph-star"></i>
                        </span>
                      </div>
                      <span className="text-xs fw-medium text-white">4.8</span>
                      <span className="text-xs fw-medium text-white">(12K)</span>
                    </div>
                  </div>
                  <div className="mt-32 d-flex flex-column gap-8">
                    <a href="#" className="px-16 py-12 border text-white border-neutral-500 w-100 rounded-4 hover-bg-main-600 hover-border-main-600">
                      About Store
                    </a>
                    <a href="#" className="px-16 py-12 border text-white border-neutral-500 w-100 rounded-4 hover-bg-main-600 hover-border-main-600">
                      Products
                    </a>
                    <a href="#" className="px-16 py-12 border text-white border-neutral-500 w-100 rounded-4 hover-bg-main-600 hover-border-main-600">
                      Return Policy
                    </a>
                    <a href="#" className="px-16 py-12 border text-white border-neutral-500 w-100 rounded-4 hover-bg-main-600 hover-border-main-600">
                      Shipping Policy
                    </a>
                    <a href="#" className="px-16 py-12 border text-white border-neutral-500 w-100 rounded-4 hover-bg-main-600 hover-border-main-600">
                      Contact Seller
                    </a>
                  </div>
                </div>

                <div className="border border-gray-50 rounded-8 p-24">
                  <h6 className="text-xl border-bottom border-gray-100 pb-24 mb-24">Product Category</h6>
                  <ul className="max-h-540 overflow-y-auto scroll-sm">
                    {[
                      "Mobile & Accessories (12)",
                      "Laptop (12)",
                      "Electronics (12)",
                      "Smart Watch (12)",
                      "Storage (12)",
                      "Portable Devices (12)",
                      "Action Camera (12)",
                      "Smart Gadget (12)",
                      "Monitor  (12)",
                      "Smart TV (12)",
                      "Camera (12)",
                      "Monitor Stand (12)",
                      "Headphone (12)",
                    ].map((label) => (
                      <li className="mb-24" key={label}>
                        <Link href="/product-details-two" className="text-gray-900 hover-text-main-600">
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="blog-sidebar border border-gray-100 rounded-8 p-32 mb-40">
                  <h6 className="text-xl mb-32 pb-32 border-bottom border-gray-100">Best Sell Products</h6>
                  <div className="d-flex flex-column gap-24">
                    {[
                      { img: "/assets/images/thumbs/popular-img1.png", name: "Man Fashion Shoe" },
                      { img: "/assets/images/thumbs/popular-img2.png", name: "Woman Fashion Bag" },
                      { img: "/assets/images/thumbs/popular-img3.png", name: "Woman Fashion Tops" },
                      { img: "/assets/images/thumbs/popular-img4.png", name: "Woman Fashion Hat" },
                      { img: "/assets/images/thumbs/popular-img5.png", name: "Woman Fashion" },
                      { img: "/assets/images/thumbs/popular-img6.png", name: "Woman Fashion Bag" },
                    ].map((p, idx) => (
                      <div className="d-flex align-items-center flex-sm-nowrap flex-wrap gap-16" key={idx}>
                        <Link href="/blog-details" className="w-100 h-100 rounded-4 overflow-hidden w-76 h-76 flex-shrink-0 bg-color-three flex-center">
                          <Image src={p.img} alt={p.name} width={76} height={76} />
                        </Link>
                        <div className="flex-grow-1">
                          <h6 className="text-lg mb-8 fw-medium">
                            <Link href="/product-details-two" className="text-line-3">
                              {p.name}
                            </Link>
                          </h6>
                          <div className="flex-align gap-6">
                            <div className="flex-align gap-4">
                              <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                              <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                              <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                              <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                              <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                            </div>
                            <span className="text-xs fw-medium text-neutral-500">4.8</span>
                            <span className="text-xs fw-medium text-neutral-500">(12K)</span>
                          </div>
                          <h6 className="text-md mb-0 mt-4">$25</h6>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Shop Sidebar End */}

            <div className="vendor-two-details__contents">
              {/* Inner Banner Start */}
              <div
                className="inner-banner-two rounded-16 overflow-hidden position-relative"
                style={{ minHeight: 220 }}
              >
                <Image
                  src="/assets/images/thumbs/inner-banner-two-bg.png"
                  alt="Inner Banner"
                  fill
                  priority
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  style={{ objectFit: "cover", objectPosition: "right center", zIndex: 0 }}
                />
                <div className="row">
                  <div className="col-6 d-xl-block d-none"></div>
                  <div className="col-xl-6 d-xl-flex">
                    <div className="text-center py-32 position-relative" style={{ zIndex: 1 }}>
                      <h6 className="text-white">Daily Offer</h6>
                      <h3 className="my-32 text-white">SALE 48% OFF</h3>
                      <Link href="/shop" className="btn btn-main d-inline-flex align-items-center rounded-8 gap-8">
                        Shop Now
                        <span className="icon text-xl d-flex"><i className="ph ph-shopping-cart"></i></span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              {/* Inner Banner End */}

              {/* Search Filter Start */}
              <div className="d-flex align-items-center justify-content-between flex-wrap mt-40 mb-32 gap-16">
                <form action="#" className="input-group w-100 max-w-418">
                  <input type="text" className="form-control common-input rounded-start-3" placeholder="Searching..." />
                  <button type="submit" className="input-group-text border-0 bg-main-two-600 rounded-end-3 text-white text-2xl hover-bg-main-two-700 px-24">
                    <i className="ph ph-magnifying-glass"></i>
                  </button>
                </form>

                <div className="d-flex align-items-center justify-content-between justify-content-sm-end gap-16 flex-grow-1">
                  <span className="text-gray-900">Showing 1-20 of 85 result</span>
                  <div className="d-flex align-items-center gap-8 d-sm-flex d-none">
                    <button type="button" className="grid-btn text-2xl d-flex w-48 h-48 border border-neutral-100 rounded-8 justify-content-center align-items-center border-main-600 text-white bg-main-600">
                      <i className="ph ph-squares-four"></i>
                    </button>
                    <button type="button" className="list-btn text-2xl d-flex w-48 h-48 border border-neutral-100 rounded-8 justify-content-center align-items-center">
                      <i className="ph ph-list-bullets"></i>
                    </button>
                  </div>
                  <div className="flex-align gap-8">
                    <span className="text-gray-900 flex-shrink-0 d-sm-block d-none">Sort by:</span>
                    <select className="common-input form-select rounded-pill border border-gray-100 d-inline-block ps-20 pe-36 h-48 py-0 fw-medium">
                      <option value="1">Latest</option>
                      <option value="2">Old</option>
                    </select>
                  </div>
                  <button type="button" className="w-48 h-48 d-lg-none d-flex flex-center border border-gray-100 rounded-6 text-2xl sidebar-btn">
                    <i className="ph-bold ph-funnel"></i>
                  </button>
                </div>
              </div>
              {/* Search Filter End */}

              {/* Products Start */}
              <div className="list-grid-wrapper grid-cols-4">
                {[
                  { img: "/assets/images/thumbs/popular-img1.png", title: "Instax Mini 12 Instant Film Camera - Green" },
                  { img: "/assets/images/thumbs/popular-img2.png", title: "Midnight Noir Leather Jacket" },
                  { img: "/assets/images/thumbs/popular-img3.png", title: "Urban Rebel Combat Boots" },
                  { img: "/assets/images/thumbs/popular-img4.png", title: "Velvet Blossom Dress" },
                  { img: "/assets/images/thumbs/popular-img5.png", title: "Instax Mini 12 Instant Film Camera - Green" },
                  { img: "/assets/images/thumbs/popular-img6.png", title: "Midnight Noir Leather Jacket" },
                  { img: "/assets/images/thumbs/popular-img7.png", title: "Urban Rebel Combat Boots" },
                  { img: "/assets/images/thumbs/popular-img8.png", title: "Velvet Blossom Dress" },
                  { img: "/assets/images/thumbs/product-img10.png", title: "Instax Mini 12 Instant Film Camera - Green" },
                  { img: "/assets/images/thumbs/featured-product-img.png", title: "Midnight Noir Leather Jacket" },
                  { img: "/assets/images/thumbs/discount-img1.png", title: "Urban Rebel Combat Boots" },
                  { img: "/assets/images/thumbs/discount-img2.png", title: "Velvet Blossom Dress" },
                ].map((p, idx) => (
                  <div className="product-card h-100 p-16 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2" key={idx}>
                    <div className="product-card__thumb rounded-8 bg-gray-50 position-relative">
                      <Link href="/product-details-two" className="w-100 h-100 flex-center">
                        <Image src={p.img} alt={p.title} width={300} height={220} className="w-auto" />
                      </Link>
                      <div className="position-absolute inset-block-start-0 inset-inline-start-0 mt-16 ms-16 z-1 d-flex flex-column gap-8">
                        <span className="text-main-two-600 w-40 h-40 d-flex justify-content-center align-items-center bg-white rounded-circle shadow-sm text-xs fw-semibold">-29%</span>
                        <span className="text-neutral-600 w-40 h-40 d-flex justify-content-center align-items-center bg-white rounded-circle shadow-sm text-xs fw-semibold">HOT</span>
                      </div>

                      <div className="bg-white p-2 rounded-pill z-1 position-absolute inset-inline-end-0 inset-block-start-0 me-16 mt-16 shadow-sm">
                        <button type="button" className="expand-btn w-40 h-40 text-md d-flex justify-content-center align-items-center rounded-circle hover-bg-main-two-600 hover-text-white">
                          <i className="ph ph-plus"></i>
                        </button>
                        <div className="expand-icons gap-20 my-20">
                          <button type="button" className="text-neutral-600 text-xl flex-center hover-text-main-two-600 wishlist-btn">
                            <i className="ph ph-heart"></i>
                          </button>
                          <button type="button" className="text-neutral-600 text-xl flex-center hover-text-main-two-600">
                            <i className="ph ph-eye"></i>
                          </button>
                          <button type="button" className="text-neutral-600 text-xl flex-center hover-text-main-two-600">
                            <i className="ph ph-shuffle"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="product-card__content mt-16 w-100">
                      <h6 className="title text-lg fw-semibold my-16">
                        <Link href="/product-details-two" className="link text-line-2" tabIndex={0}>
                          {p.title}
                        </Link>
                      </h6>
                      <div className="flex-align gap-6">
                        <div className="flex-align gap-8">
                          <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                          <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                          <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                          <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                          <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                        </div>
                        <span className="text-xs fw-medium text-gray-500">4.8</span>
                        <span className="text-xs fw-medium text-gray-500">(12K)</span>
                      </div>

                      <span className="py-2 px-8 text-xs rounded-pill text-main-two-600 bg-main-two-50 mt-16">Fulfilled by Marketpro</span>

                      <div className="product-card__price mt-16 mb-30">
                        <span className="text-gray-400 text-md fw-semibold text-decoration-line-through"> $28.99</span>
                        <span className="text-heading text-md fw-semibold ">$14.99 <span className="text-gray-500 fw-normal">/Qty</span> </span>
                      </div>
                      <Link href="/gio-hang" className="product-card__cart btn bg-gray-50 text-heading hover-bg-main-600 hover-text-white py-11 px-24 rounded-8 flex-center gap-8 fw-medium" tabIndex={0}>
                        Add To Cart <i className="ph ph-shopping-cart"></i>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              {/* Products End */}
            </div>
          </div>
        </div>
      </section>
      {/* ============================== Vendor Two Details End =============================== */}
      {/* Benefits strip (reused from Cart page) */}
      <BenefitsStrip />
    </>
  );
}
