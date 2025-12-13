"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import FullHeader from "@/components/FullHeader";
import BenefitsStrip from "@/components/BenefitsStrip";

export default function Page() {
  // Apply template-level classes to html to match vendor-two.html
  useEffect(() => {
    const cls = ["color-two", "font-exo", "header-style-two"];
    const html = document.documentElement;
    cls.forEach(c => html.classList.add(c));
    return () => { cls.forEach(c => html.classList.remove(c)); };
  }, []);

  const vendors = [
    { ten: "e-Mart Shop", followers: "480589", rating: "4.8", phone: "083 308 1888" },
    { ten: "Baishakhi", followers: "480589", rating: "4.8", phone: "083 308 1888" },
    { ten: "e-zone Shop", followers: "480589", rating: "4.8", phone: "083 308 1888" },
    { ten: "Cloth & Fashion Shop", followers: "480589", rating: "4.8", phone: "083 308 1888" },
    { ten: "New Market Shop", followers: "480589", rating: "4.8", phone: "083 308 1888" },
    { ten: "Zeilla Shop", followers: "480589", rating: "4.8", phone: "083 308 1888" },
    { ten: "Ever Green Shop", followers: "480589", rating: "4.8", phone: "083 308 1888" },
    { ten: "Maple Shop", followers: "480589", rating: "4.8", phone: "083 308 1888" },
    { ten: "New Mart", followers: "480589", rating: "4.8", phone: "083 308 1888" },
  ];

  return (
    <React.Fragment>
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      <div className="breadcrumb mb-0 py-26 bg-main-two-50">
        <div className="container container-lg">
          <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
            <h6 className="mb-0">All Vendors</h6>
            <ul className="flex-align gap-8 flex-wrap">
              <li className="text-sm">
                <Link href="/" className="text-gray-900 flex-align gap-8 hover-text-main-600">
                  <i className="ph ph-house"></i>
                  Home
                </Link>
              </li>
              <li className="flex-align"><i className="ph ph-caret-right"></i></li>
              <li className="text-sm text-main-600"> Vendors </li>
            </ul>
          </div>
        </div>
      </div>

      <section className="vendor-two py-80">
        <div className="container container-lg">
          <div className="d-flex align-items-center justify-content-between flex-wrap mb-48 gap-16">
            <form action="#" className="input-group w-100 max-w-418">
              <input type="text" className="form-control common-input rounded-start-3" placeholder="Searching..." />
              <button type="submit" className="input-group-text border-0 bg-main-two-600 rounded-end-3 text-white text-2xl hover-bg-main-two-700 px-24">
                <i className="ph ph-magnifying-glass"></i>
              </button>
            </form>
            <div className="d-flex align-items-center justify-content-between justify-content-sm-end gap-16 flex-grow-1">
              <div className="text-gray-600 text-md flex-shrink-0"><span className="text-neutral-900 fw-semibold">52</span> Results Found</div>
              <div className="d-flex align-items-center gap-8 d-sm-flex d-none">
                <button type="button" className="grid-btn text-2xl d-flex w-48 h-48 border border-neutral-100 rounded-8 justify-content-center align-items-center border-main-600 text-white bg-main-600"><i className="ph ph-squares-four"></i></button>
                <button type="button" className="list-btn text-2xl d-flex w-48 h-48 border border-neutral-100 rounded-8 justify-content-center align-items-center"><i className="ph ph-list-bullets"></i></button>
              </div>
              <button type="button" className="w-48 h-48 d-lg-none d-flex flex-center border border-gray-100 rounded-6 text-2xl sidebar-btn"><i className="ph-bold ph-funnel"></i></button>
            </div>
          </div>

          <div className="row">
            <div className="col-xl-3 col-lg-4">
              <div className="shop-sidebar">
                <button type="button" className="shop-sidebar__close d-lg-none d-flex w-32 h-32 flex-center border border-gray-100 rounded-circle hover-bg-main-600 position-absolute inset-inline-end-0 me-10 mt-8 hover-text-white hover-border-main-600">
                  <i className="ph ph-x"></i>
                </button>
                <div className="d-flex flex-column gap-12 px-lg-0 px-3 py-lg-0 py-4">
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
                      ].map((c) => (
                        <li className="mb-24" key={c}>
                          <Link href="/product-details-two" className="text-gray-900 hover-text-main-600">{c}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="shop-sidebar__box border border-gray-100 rounded-8 p-32 mb-32">
                    <h6 className="text-xl border-bottom border-gray-100 pb-24 mb-24">Filter by Rating</h6>
                    {[70, 50, 35, 20, 5].map((w, i) => (
                      <div className={`flex-align gap-8 position-relative ${i < 4 ? "mb-20" : "mb-0"}`} key={i}>
                        <label className="position-absolute w-100 h-100 cursor-pointer" htmlFor={`rating${5 - i}`}> </label>
                        <div className="common-check common-radio mb-0">
                          <input className="form-check-input" type="radio" name="flexRadioDefault" id={`rating${5 - i}`} />
                        </div>
                        <div className="progress w-100 bg-gray-100 rounded-pill h-8" role="progressbar" aria-valuenow={w} aria-valuemin={0} aria-valuemax={100}>
                          <div className="progress-bar bg-main-600 rounded-pill" style={{ width: `${w}%` }}></div>
                        </div>
                        <div className="flex-align gap-4">
                          {[...Array(5)].map((_, s) => (
                            <span key={s} className={`text-xs fw-medium ${s < 5 - i ? "text-warning-600" : "text-gray-400"} d-flex`}><i className="ph-fill ph-star"></i></span>
                          ))}
                        </div>
                        <span className="text-gray-900 flex-shrink-0">{[124, 52, 12, 5, 2][i]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border border-gray-50 rounded-8 p-24">
                    <h6 className="text-xl border-bottom border-gray-100 pb-24 mb-24">Filter by Location</h6>
                    <div className="d-flex flex-column gap-8">
                      <select className="common-input form-select" defaultValue="">
                        <option value="" disabled>Country</option>
                        <option>Bangladesh</option>
                        <option>Pakistan</option>
                        <option>Vutan</option>
                        <option>Nepal</option>
                      </select>
                      <select className="common-input form-select" defaultValue="">
                        <option value="" disabled>State</option>
                        <option>California</option>
                        <option>Washington</option>
                        <option>Florida</option>
                        <option>Texas</option>
                      </select>
                      <select className="common-input form-select" defaultValue="">
                        <option value="" disabled>City</option>
                        <option>New York</option>
                        <option>San Francisco</option>
                        <option>Oklahoma City</option>
                        <option>Chicago</option>
                      </select>
                      <input type="text" className="common-input" placeholder="Zip" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-9 col-lg-8">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 24 }}>
                {vendors.map((v, idx) => (
                  <div className="vendors-two-item rounded-12 overflow-hidden bg-color-three border border-neutral-50 hover-border-main-two-600 transition-2" key={idx} style={{ width: "100%", minWidth: 0 }}>
                    <div className="vendors-two-item__top bg-overlay style-two position-relative">
                      <div className="vendors-two-item__thumbs" style={{ height: 210, position: "relative" }}>
                        <Image src="/assets/images/thumbs/vendors-two-img1.png" alt="Vendor cover" fill sizes="(max-width: 1200px) 100vw, 400px" style={{ objectFit: "cover" }} />
                      </div>
                      <div className="position-absolute top-0 start-0 w-100 h-100 p-24 z-1 d-flex flex-column justify-content-between">
                        <span className="w-80 h-80 flex-center bg-white rounded-circle flex-shrink-0">
                          <Image src="/assets/images/thumbs/vendors-two-icon1.png" alt="Vendor logo" width={56} height={56} />
                        </span>
                        <button type="button" className="text-uppercase border border-white px-16 py-8 rounded-pill text-white text-sm hover-bg-main-two-600 hover-text-white hover-border-main-two-600 transition-2">FOLLOW</button>
                      </div>
                      <div className="mt-16">
                        <h6 className="text-white fw-semibold mb-12">
                          <Link href="/vendor-two-details" className="">{v.ten}</Link>
                        </h6>
                        <div className="flex-align gap-6">
                          <div className="flex-align gap-8">
                            {[...Array(5)].map((_, s) => (
                              <span key={s} className="text-xs fw-medium text-warning-600 d-flex"><i className="ph-fill ph-star"></i></span>
                            ))}
                          </div>
                          <span className="text-xs fw-medium text-white">{v.rating}</span>
                          <span className="text-xs fw-medium text-white">(12K)</span>
                        </div>
                      </div>
                    </div>
                    <div className="vendors-two-item__content p-24 flex-grow-1">
                      <div className="d-flex flex-column gap-14">
                        <div className="flex-align gap-8">
                          <span className="flex-center text-main-two-600 text-2xl flex-shrink-0"><i className="ph ph-map-pin-line"></i></span>
                          <p className="text-md text-gray-900">6391 Elgin St. Celina, Delaware 10299</p>
                        </div>
                        <div className="flex-align gap-8">
                          <span className="flex-center text-main-two-600 text-2xl flex-shrink-0"><i className="ph ph-envelope-simple"></i></span>
                          <Link href="mailto:info@watch.com" className="text-md text-gray-900 hover-text-main-600">info@watch.com</Link>
                        </div>
                        <div className="flex-align gap-8">
                          <span className="flex-center text-main-two-600 text-2xl flex-shrink-0"><i className="ph ph-phone"></i></span>
                          <Link href="tel:0833081888" className="text-md text-gray-900 hover-text-main-600">083 308 1888</Link>
                        </div>
                      </div>
                      <Link href="/vendor-two-details" className="btn bg-neutral-600 hover-bg-neutral-700 text-white py-12 px-24 rounded-8 flex-center gap-8 fw-medium mt-24">
                        Visit Store
                        <span className="text-xl d-flex text-main-two-600"><i className="ph ph-storefront"></i></span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Pagination */}
          <div className="d-flex justify-content-center mt-40">
            <nav aria-label="Page navigation example">
              <ul className="pagination gap-12">
                <li className="page-item">
                  <a className="page-link w-48 h-48 flex-center rounded-12 text-gray-900 border-gray-100 bg-gray-50 hover-bg-main-600 hover-text-white" href="#" aria-label="Previous">
                    <i className="ph ph-caret-left"></i>
                  </a>
                </li>
                <li className="page-item"><a className="page-link w-48 h-48 flex-center rounded-12 text-white border-main-600 bg-main-600" href="#">01</a></li>
                <li className="page-item"><a className="page-link w-48 h-48 flex-center rounded-12 text-gray-900 border-gray-100 bg-gray-50 hover-bg-main-600 hover-text-white" href="#">02</a></li>
                <li className="page-item"><a className="page-link w-48 h-48 flex-center rounded-12 text-gray-900 border-gray-100 bg-gray-50 hover-bg-main-600 hover-text-white" href="#">03</a></li>
                <li className="page-item"><a className="page-link w-48 h-48 flex-center rounded-12 text-gray-900 border-gray-100 bg-gray-50 hover-bg-main-600 hover-text-white" href="#">04</a></li>
                <li className="page-item"><a className="page-link w-48 h-48 flex-center rounded-12 text-gray-900 border-gray-100 bg-gray-50 hover-bg-main-600 hover-text-white" href="#">05</a></li>
                <li className="page-item"><a className="page-link w-48 h-48 flex-center rounded-12 text-gray-900 border-gray-100 bg-gray-50 hover-bg-main-600 hover-text-white" href="#">06</a></li>
                <li className="page-item"><a className="page-link w-48 h-48 flex-center rounded-12 text-gray-900 border-gray-100 bg-gray-50 hover-bg-main-600 hover-text-white" href="#">07</a></li>
                <li className="page-item">
                  <a className="page-link w-48 h-48 flex-center rounded-12 text-gray-900 border-gray-100 bg-gray-50 hover-bg-main-600 hover-text-white" href="#" aria-label="Next">
                    <i className="ph ph-caret-right"></i>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </section>
      <BenefitsStrip />
    </React.Fragment>
  );
}