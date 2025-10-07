﻿"use client";
import React from "react";
import Link from "next/link";
import FullHeader from "@/components/FullHeader";
import FullFooter from "@/components/FullFooter";

export default function Page() {
  return (
    <>
      {/* Header: classic style with logo/search, no topnav, no categories bar, but keep classic top bar */}
      <FullHeader showTopNav={false} showCategoriesBar={false} showClassicTopBar={true} />

      {/* Breadcrumb (match template) */}
      <div className="pt-40 mb-0 breadcrumb bg-main-two-60">
        <div className="container">
          <div className="flex-wrap gap-16 breadcrumb-wrapper flex-between">
            <h6 className="mb-0">Thông tin sản phẩm</h6>
            <ul className="flex-wrap gap-8 flex-align">
              <li className="text-sm">
                <Link href="/" className="gap-8 text-gray-900 flex-align hover-text-main-600">
                  <i className="ph ph-house"></i>
                  Trang chủ
                </Link>
              </li>
              <li className="flex-align">
                <i className="ph ph-caret-right"></i>
              </li>
              <li className="text-sm text-main-600"> &quot;ABCXYZ&quot; </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Product Details (match template) */}
      <section className="py-40 product-details">
        <div className="container">
          <div className="row gy-4">
            <div className="col-xl-9">
              <div className="row gy-4">
                <div className="col-xl-6">
                  <div className="product-details__left">
                    <div className="border border-gray-100 product-details__thumb-slider rounded-16">
                      {[1, 2, 3, 1, 2].map((n, i) => (
                        <div key={i}>
                          <div className="product-details__thumb flex-center h-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`/assets/images/thumbs/product-details-two-thumb${n}.png`} alt="" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-24">
                      <div className="product-details__images-slider">
                        {[1, 2, 3, 1, 2].map((n, i) => (
                          <div key={i}>
                            <div className="p-8 border border-gray-100 max-w-120 max-h-120 h-100 flex-center rounded-16">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={`/assets/images/thumbs/product-details-two-thumb${n}.png`} alt="" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-6">
                  <div className="product-details__content">
                    <div className="flex-wrap gap-16 px-24 py-16 mb-24 flex-center bg-color-one rounded-8 position-relative z-1 ">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/assets/images/bg/details-offer-bg.png" alt="" className="position-absolute inset-block-start-0 inset-inline-start-0 w-100 z-n1 object-fit-cover" />
                      <div className="gap-16 flex-align">
                        <span className="text-sm text-white">Special Offer:</span>
                      </div>
                      <div className="countdown" id="countdown11">
                        <ul className="flex-wrap countdown-list flex-align">
                          <li className="gap-4 p-0 text-xs border countdown-list__item text-heading flex-align fw-medium w-28 h-28 rounded-4 border-main-600 flex-center"><span className="days"></span></li>
                          <li className="gap-4 p-0 text-xs border countdown-list__item text-heading flex-align fw-medium w-28 h-28 rounded-4 border-main-600 flex-center"><span className="hours"></span></li>
                          <li className="gap-4 p-0 text-xs border countdown-list__item text-heading flex-align fw-medium w-28 h-28 rounded-4 border-main-600 flex-center"><span className="minutes"></span></li>
                          <li className="gap-4 p-0 text-xs border countdown-list__item text-heading flex-align fw-medium w-28 h-28 rounded-4 border-main-600 flex-center"><span className="seconds"></span></li>
                        </ul>
                      </div>
                      <span className="text-xs text-white">Remains untill the end of the offer</span>
                    </div>

                    <h5 className="mb-12">HP Chromebook With Intel Celeron, 4GB Memory & 64GB eMMC - Modern Gray</h5>
                    <div className="flex-wrap gap-12 flex-align">
                      <div className="flex-wrap gap-12 flex-align">
                        <div className="gap-8 flex-align">
                          <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                          <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                          <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                          <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                          <span className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                        </div>
                        <span className="text-sm fw-medium text-neutral-600">4.7 sao</span>
                        <span className="text-sm text-gray-500 fw-medium">(21,676)</span>
                      </div>
                      <span className="text-sm text-gray-500 fw-medium">|</span>
                      <a href="#" className="gap-4 text-gray-900 flex-align hover-text-main-600"><i className="ph-bold ph-storefront"></i> Apple </a>
                    </div>

                    <div className="flex-wrap gap-16 my-32 flex-align">
                      <div className="gap-8 flex-align">
                        <div className="gap-8 flex-align text-main-two-600">
                          <i className="text-xl ph-fill ph-seal-percent"></i>
                          -10%
                        </div>
                        <h6 className="mb-0">300.000 đ</h6>
                      </div>
                      <div className="gap-8 flex-align">
                        <span className="text-gray-700">Giá gốc</span>
                        <h6 className="mb-0 text-xl text-gray-400 fw-medium text-decoration-line-through">425.000 đ</h6>
                      </div>
                    </div>

                    <span className="pt-32 mt-32 text-gray-700 border-gray-100 border-top d-block"></span>

                    <div className="mt-10">
                      <h6 className="mb-16">Loại sản phẩm</h6>
                      <div className="flex-wrap gap-16 flex-between align-items-start">
                        <div>
                          <div className="flex-wrap gap-8 flex-align">
                            <a className="px-12 py-8 text-sm text-gray-900 border border-gray-200 cursor-pointer color-list__button rounded-8 hover-border-main-600 hover-text-main-600"> with offer </a>
                            <a className="px-12 py-8 text-sm text-gray-900 border border-gray-200 cursor-pointer color-list__button rounded-8 hover-border-main-600 hover-text-main-600">12th Gen Laptop</a>
                            <a className="px-12 py-8 text-sm text-gray-900 border border-gray-200 cursor-pointer color-list__button rounded-8 hover-border-main-600 hover-text-main-600">without offer</a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <span className="mt-32 text-gray-700 border-gray-100 border-top d-block"></span>

                    <a href="https://www.whatsapp.com" className="gap-8 py-16 mt-16 btn btn-black flex-center rounded-8">
                      <i className="text-lg ph ph-whatsapp-logo"></i>
                      Liên hệ với cửa hàng
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3">
              <div className="px-32 py-40 border border-gray-100 product-details__sidebar rounded-16">
                <div className="mb-32">
                  <h6 className="mb-8 text-heading fw-semibold d-block">Giỏ hàng</h6>
                  <span className="text-xl d-flex">
                    <i className="ph ph-location"></i>
                  </span>
                  <div className="overflow-hidden d-flex rounded-4">
                    <button type="button" className="flex-shrink-0 w-48 h-48 quantity__minus text-neutral-600 bg-gray-50 flex-center hover-bg-main-600 hover-text-white">
                      <i className="ph ph-minus"></i>
                    </button>
                    <input type="number" className="w-32 px-16 text-center border border-gray-100 quantity__input flex-grow-1 border-start-0 border-end-0" defaultValue={1} min={1} />
                    <button type="button" className="flex-shrink-0 w-48 h-48 quantity__plus text-neutral-600 bg-gray-50 flex-center hover-bg-main-600 hover-text-white">
                      <i className="ph ph-plus"></i>
                    </button>
                  </div>
                </div>
                <div className="mb-32">
                  <div className="flex-wrap gap-8 pb-16 mb-16 border-gray-100 flex-between border-bottom">
                    <span className="text-gray-500">Giá</span>
                    <h6 className="mb-0 text-lg"><span className="mb-0 text-sm text-gray-400 fw-medium text-decoration-line-through">425.000 đ</span> 300.000 đ</h6>
                  </div>
                </div>
                <Link href="/cart" className="gap-8 py-16 mt-48 btn btn-main flex-center rounded-8 fw-normal">
                  <i className="text-lg ph ph-shopping-cart-simple"></i>
                  Thêm vào giỏ hàng
                </Link>
                <div className="mt-32">
                  <div className="gap-24 px-16 py-8 mb-0 bg-main-50 rounded-8 flex-between">
                    <span className="flex-shrink-0 w-32 h-32 text-xl bg-white text-main-600 rounded-circle flex-center">
                      <i className="ph-fill ph-storefront"></i>
                    </span>
                    <span className="text-sm text-neutral-600">Cửa hàng:  <span className="fw-semibold">MR Distribution LLC</span> </span>
                  </div>
                </div>
                <div className="mt-32">
                  <div className="gap-8 px-32 py-16 border border-gray-100 rounded-8 flex-between">
                    <a href="#" className="d-flex text-main-600 text-28"><i className="ph-fill ph-chats-teardrop"></i></a>
                    <span className="border border-gray-100 h-26"></span>
                    <div className="dropdown on-hover-item">
                      <button className="d-flex text-main-600 text-28" type="button">
                        <i className="ph-fill ph-share-network"></i>
                      </button>
                      <div className="border-0 on-hover-dropdown common-dropdown inset-inline-start-auto inset-inline-end-0">
                        <ul className="gap-16 flex-align">
                          <li>
                            <a href="https://www.facebook.com" className="text-xl w-44 h-44 flex-center bg-main-100 text-main-600 rounded-circle hover-bg-main-600 hover-text-white">
                              <i className="ph-fill ph-facebook-logo"></i>
                            </a>
                          </li>
                          <li>
                            <a href="https://www.twitter.com" className="text-xl w-44 h-44 flex-center bg-main-100 text-main-600 rounded-circle hover-bg-main-600 hover-text-white">
                              <i className="ph-fill ph-twitter-logo"></i>
                            </a>
                          </li>
                          <li>
                            <a href="https://www.linkedin.com" className="text-xl w-44 h-44 flex-center bg-main-100 text-main-600 rounded-circle hover-bg-main-600 hover-text-white">
                              <i className="ph-fill ph-instagram-logo"></i>
                            </a>
                          </li>
                          <li>
                            <a href="https://www.pinterest.com" className="text-xl w-44 h-44 flex-center bg-main-100 text-main-600 rounded-circle hover-bg-main-600 hover-text-white">
                              <i className="ph-fill ph-linkedin-logo"></i>
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-80">
            <div className="border product-dContent rounded-24">
              <div className="flex-wrap gap-16 border-gray-100 product-dContent__header border-bottom flex-between">
                <ul className="mb-3 nav common-tab nav-pills" id="pills-tab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button className="nav-link active" id="pills-description-tab" data-bs-toggle="pill" data-bs-target="#pills-description" type="button" role="tab" aria-controls="pills-description" aria-selected="true">Mô tả sản phẩm</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="pills-reviews-tab" data-bs-toggle="pill" data-bs-target="#pills-reviews" type="button" role="tab" aria-controls="pills-reviews" aria-selected="false">Đánh giá</button>
                  </li>
                </ul>
              </div>
              <div className="product-dContent__box">
                <div className="tab-content" id="pills-tabContent">
                  <div className="tab-pane fade show active" id="pills-description" role="tabpanel" aria-labelledby="pills-description-tab" tabIndex={0}>
                    <div className="mb-40">
                      <h6 className="mb-24">Mô tả về sản phẩm</h6>
                      <p>Wherever celebrations and good times happen, the LAY&apos;S brand will be there just as it has been for more than 75 years. With flavors almost as rich as our history, we have a chip or crisp flavor guaranteed to bring a smile on your face. </p>
                      <p>Morbi ut sapien vitae odio accumsan gravida. Morbi vitae erat auctor, eleifend nunc a, lobortis neque. Praesent aliquam dignissim viverra. Maecenas lacus odio, feugiat eu nunc sit amet, maximus sagittis dolor. Vivamus nisi sapien, elementum sit amet eros sit amet, ultricies cursus ipsum. Sed consequat luctus ligula. Curabitur laoreet rhoncus blandit. Aenean vel diam ut arcu pharetra dignissim ut sed leo. Vivamus faucibus, ipsum in vestibulum vulputate, lorem orci convallis quam, sit amet consequat nulla felis pharetra lacus. Duis semper erat mauris, sed egestas purus commodo vel.</p>
                      <ul className="mt-32 list-inside ms-16">
                        <li className="mb-4 text-gray-400">8.0 oz. bag of LAY&apos;S Classic Potato Chips</li>
                        <li className="mb-4 text-gray-400">Tasty LAY&apos;s potato chips are a great snack</li>
                        <li className="mb-4 text-gray-400">Includes three ingredients: potatoes, oil, and salt</li>
                        <li className="mb-4 text-gray-400">Gluten free product</li>
                      </ul>
                      <ul className="mt-32">
                        <li className="mb-4 text-gray-400">Made in USA</li>
                        <li className="mb-4 text-gray-400">Ready To Eat.</li>
                      </ul>
                    </div>
                    <div className="mb-40">
                      <h6 className="mb-24">Product Specifications</h6>
                      <ul className="mt-32">
                        {[
                          "Product Type: Chips & Dips",
                          "Product Name: Potato Chips Classic",
                          "Brand: Lay's",
                          "FSA Eligible: No",
                          "Size/Count: 8.0oz",
                          "Item Code: 331539",
                          "Ingredients: Potatoes, Vegetable Oil, and Salt.",
                        ].map((t, i) => (
                          <li key={i} className="text-gray-400 mb-14 flex-align gap-14">
                            <span className="w-20 h-20 text-xs bg-main-50 text-main-600 flex-center rounded-circle">
                              <i className="ph ph-check"></i>
                            </span>
                            <span className="text-heading fw-medium">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mb-40">
                      <h6 className="mb-24">Nutrition Facts</h6>
                      <ul className="mt-32">
                        <li className="text-gray-400 mb-14 flex-align gap-14">
                          <span className="w-20 h-20 text-xs bg-main-50 text-main-600 flex-center rounded-circle">
                            <i className="ph ph-check"></i>
                          </span>
                          <span className="text-heading fw-medium"> Total Fat 10g 13%</span>
                        </li>
                        <li className="text-gray-400 mb-14 flex-align gap-14">
                          <span className="w-20 h-20 text-xs bg-main-50 text-main-600 flex-center rounded-circle">
                            <i className="ph ph-check"></i>
                          </span>
                          <span className="text-heading fw-medium"> Saturated Fat 1.5g 7%</span>
                        </li>
                        <li className="text-gray-400 mb-14 flex-align gap-14">
                          <span className="w-20 h-20 text-xs bg-main-50 text-main-600 flex-center rounded-circle">
                            <i className="ph ph-check"></i>
                          </span>
                          <span className="text-heading fw-medium"> Cholesterol 0mg 0%</span>
                        </li>
                        <li className="text-gray-400 mb-14 flex-align gap-14">
                          <span className="w-20 h-20 text-xs bg-main-50 text-main-600 flex-center rounded-circle">
                            <i className="ph ph-check"></i>
                          </span>
                          <span className="text-heading fw-medium"> Sodium 170mg 7%</span>
                        </li>
                        <li className="text-gray-400 mb-14 flex-align gap-14">
                          <span className="w-20 h-20 text-xs bg-main-50 text-main-600 flex-center rounded-circle">
                            <i className="ph ph-check"></i>
                          </span>
                          <span className="text-heading fw-medium"> Potassium 350mg 6%</span>
                        </li>
                      </ul>
                    </div>                  <div className="mb-0">
                      <h6 className="mb-24">More Details</h6>
                      <ul className="mt-32">
                        {[
                          "Lunarlon midsole delivers ultra-plush responsiveness",
                          "Encapsulated Air-Sole heel unit for lightweight cushioning",
                          "Colour Shown: Ale Brown/Black/Goldtone/Ale Brown",
                          "Style: 805899-202",
                        ].map((t, i) => (
                          <li key={i} className="text-gray-400 mb-14 flex-align gap-14">
                            <span className="w-20 h-20 text-xs bg-main-50 text-main-600 flex-center rounded-circle">
                              <i className="ph ph-check"></i>
                            </span>
                            <span className="text-gray-500"> {t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="tab-pane fade" id="pills-reviews" role="tabpanel" aria-labelledby="pills-reviews-tab" tabIndex={0}>
                    <div className="row g-4">
                      <div className="col-lg-6">
                        <h6 className="mb-24 title">Đánh giá về sản phẩm</h6>
                        {[1, 2].map((i) => (
                          <div key={i} className="gap-24 border-gray-100 d-flex align-items-start pb-44 border-bottom mb-44">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/assets/images/thumbs/comment-img1.png" alt="" className="flex-shrink-0 w-52 h-52 object-fit-cover rounded-circle" />
                            <div className="flex-grow-1">
                              <div className="gap-8 flex-between align-items-start ">
                                <div className="">
                                  <h6 className="mb-12 text-md">Nicolas cage</h6>
                                  <div className="gap-8 flex-align">
                                    {Array.from({ length: 5 }).map((_, k) => (<span key={k} className="text-md fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>))}
                                  </div>
                                </div>
                                <span className="text-sm text-gray-800">3 ngày trước</span>
                              </div>
                              <p className="mt-10 text-gray-700">There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour</p>
                              <div className="gap-20 mt-10 flex-align">
                                <button className="gap-12 text-gray-700 flex-align hover-text-main-600">
                                  <i className="ph-bold ph-thumbs-up"></i>
                                  Hữu ích
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="mt-56">
                          <div className="">
                            <h6 className="mb-24">Viết bài đánh giá</h6>
                            <span className="mb-8 text-heading">Bạn có hài lòng với sản phẩm này không ?</span>
                            <div className="gap-8 flex-align">
                              {Array.from({ length: 5 }).map((_, k) => (<span key={k} className="text-2xl fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>))}
                            </div>
                          </div>
                          <div className="mt-32">
                            <form action="#">
                              <div className="mb-10">
                                <label htmlFor="desc" className="mb-8 text-neutral-600">Nội dung</label>
                                <textarea className="common-input rounded-8" id="desc" placeholder="Nhập những dòng suy nghĩ của bạn..."></textarea>
                              </div>
                              <button type="submit" className="mt-20 btn btn-main rounded-pill">Đăng tải</button>
                            </form>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="ms-xxl-5">
                          <h6 className="mb-24">Đánh giá từ khách hàng</h6>
                          <div className="flex-wrap d-flex gap-44">
                            <div className="flex-shrink-0 px-40 text-center border border-gray-100 rounded-8 py-52 flex-center flex-column">
                              <h2 className="mb-6 text-main-600">4.8</h2>
                              <div className="gap-8 flex-center">
                                {Array.from({ length: 5 }).map((_, k) => (<span key={k} className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>))}
                              </div>
                              <span className="mt-16 text-gray-500">Điểm đánh giá trung bình</span>
                            </div>
                            <div className="px-24 py-40 border border-gray-100 rounded-8 flex-grow-1">
                              {[{ w: 70, c: 124, stars: [1, 1, 1, 1, 1] }, { w: 50, c: 52, stars: [1, 1, 1, 1, 0] }, { w: 35, c: 31, stars: [1, 1, 1, 0, 0] }, { w: 20, c: 5, stars: [1, 1, 0, 0, 0] }, { w: 5, c: 2, stars: [1, 0, 0, 0, 0] }].map((it, idx) => (
                                <div key={idx} className="gap-8 mb-20 flex-align">
                                  <span className="flex-shrink-0 text-gray-900">{5 - idx}</span>
                                  <div className="h-8 bg-gray-100 progress w-100 rounded-pill" role="progressbar" aria-valuenow={it.w} aria-valuemin={0} aria-valuemax={100}>
                                    <div className="progress-bar bg-main-600 rounded-pill" style={{ width: `${it.w}%` }}></div>
                                  </div>
                                  <div className="gap-4 flex-align">
                                    {it.stars.map((s, i) => (<span key={i} className={`text-xs fw-medium ${s ? "text-warning-600" : "text-gray-400"} d-flex`}><i className="ph-fill ph-star"></i></span>))}
                                  </div>
                                  <span className="flex-shrink-0 text-gray-900">{it.c}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="new-arrival pb-80">
        <div className="container">
          <div className="section-heading">
            <div className="flex-wrap gap-8 flex-between">
              <h5 className="mb-0">Có thể bạn sẽ thích</h5>
              <div className="gap-16 flex-align">
                <a href="/shop" className="text-sm text-gray-700 fw-medium hover-text-main-600 hover-text-decoration-underline">Xem đầy đủ</a>
                <div className="gap-8 flex-align">
                  <button type="button" id="new-arrival-prev" className="text-xl border border-gray-100 slick-prev slick-arrow flex-center rounded-circle hover-border-main-600 hover-bg-main-600 hover-text-white transition-1" >
                    <i className="ph ph-caret-left"></i>
                  </button>
                  <button type="button" id="new-arrival-next" className="text-xl border border-gray-100 slick-next slick-arrow flex-center rounded-circle hover-border-main-600 hover-bg-main-600 hover-text-white transition-1" >
                    <i className="ph ph-caret-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="new-arrival__slider arrow-style-two">
            {[
              { img: "/assets/images/thumbs/product-img7.png", title: "C-500 Antioxidant Protect Dietary Supplement", price: "25.000 đ", old: "50.000 đ" },
              { img: "/assets/images/thumbs/product-img8.png", title: "Marcel's Modern Pantry Almond Unsweetened", price: "25.000 đ", old: "50.000 đ", badge: "Giảm 50%" },
              { img: "/assets/images/thumbs/product-img9.png", title: "O Organics Milk, Whole, Vitamin D", price: "$14.99", old: "$28.99", note: "/Qty", badge: "Sale 50%" },
              { img: "/assets/images/thumbs/product-img10.png", title: "Whole Grains and Seeds Organic Bread", price: "$14.99", old: "$28.99", note: "/Qty", badge: "Best Sale" },
              { img: "/assets/images/thumbs/product-img11.png", title: "Lucerne Yogurt, Lowfat, Strawberry", price: "$14.99", old: "$28.99", note: "/Qty" },
              { img: "/assets/images/thumbs/product-img12.png", title: "Nature Valley Whole Grain Oats and Honey Protein", price: "$14.99", old: "$28.99", note: "/Qty", badge: "Sale 50%" },
            ].map((p, i) => (
              <div key={i}>
                <div className="p-8 border border-gray-100 product-card h-100 hover-border-main-600 rounded-16 position-relative transition-2">
                  {p.badge ? (<span className="px-8 py-4 text-sm text-white product-card__badge bg-danger-600">{p.badge}</span>) : null}
                  <a href="/product-details" className="overflow-hidden product-card__thumb flex-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.img} alt="" />
                  </a>
                  <div className="product-card__content p-sm-2 w-100">
                    <h6 className="mt-12 mb-8 text-lg title fw-semibold">
                      <a href="/product-details" className="link text-line-2">{p.title}</a>
                    </h6>
                    <div className="gap-4 flex-align">
                      <span className="text-main-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                      <span className="text-xs text-gray-500"> Lucky Supermarket</span>
                    </div>
                    <div className="mt-12 product-card__content">
                      <div className="mb-8 product-card__price">
                        <span className="text-heading text-md fw-semibold ">{p.price} {p.note ? (<span className="text-gray-500 fw-normal">{p.note}</span>) : null} </span>
                        <span className="text-gray-400 text-md fw-semibold text-decoration-line-through"> {p.old}</span>
                      </div>
                      <div className="gap-6 flex-align">
                        <span className="text-xs text-gray-600 fw-bold">4.8</span>
                        <span className="text-15 fw-bold text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                        <span className="text-xs text-gray-600 fw-bold">(17k)</span>
                      </div>
                      <a href="/cart" className="gap-8 px-24 mt-24 product-card__cart btn bg-main-50 text-main-600 hover-bg-main-600 hover-text-white py-11 rounded-pill flex-align w-100 justify-content-center">
                        Thêm giỏ hàng <i className="ph ph-shopping-cart"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <FullFooter />

    </>
  );
}






