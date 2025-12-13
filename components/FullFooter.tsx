"use client";
import React from "react";
import Link from "next/link";

export default function FullFooter() {
  return (
    <>
      {/* Main Footer - Nền xanh cyan, chữ trắng */}
      <footer className="footer pt-40 pb-0 overflow-hidden" style={{ backgroundColor: '#009999' }}>
        <div className="container container-lg">
          <div className="footer-item-two-wrapper d-flex align-items-start flex-wrap">
            {/* Column 1: Logo & Contact */}
            <div className="footer-item max-w-275" data-aos="fade-up" data-aos-duration="200">
              <div className="footer-item__logo mb-16">
                <Link href="/">
                  <img src="/assets/images/logo/logo_amban.webp" alt="Siêu Thị Vina" />
                </Link>
              </div>
              <p className="mb-24 text-white">
                Trang thương mại điện tử Siêu Thị Vina cung cấp các sản phẩm đa dạng đến với khách hàng
              </p>
              <div className="flex-align gap-16 mb-16">
                <span className="w-32 h-32 flex-center rounded-circle border border-white text-white text-md flex-shrink-0">
                  <i className="ph-fill ph-phone-call"></i>
                </span>
                <a href="tel:+886911975996" className="text-md text-white hover-text-main-600">
                  +886 0911 975 996
                </a>
              </div>
              <div className="flex-align gap-16 mb-16">
                <span className="w-32 h-32 flex-center rounded-circle border border-white text-white text-md flex-shrink-0">
                  <i className="ph-fill ph-envelope"></i>
                </span>
                <a href="mailto:support@amban.vn" className="text-md text-white hover-text-main-600">
                  support@amban.vn
                </a>
              </div>
              <div className="flex-align gap-16 mb-16">
                <span className="w-32 h-32 flex-center rounded-circle border border-white text-white text-md flex-shrink-0">
                  <i className="ph-fill ph-map-pin"></i>
                </span>
                <span className="text-md text-white">
                  801/2A Phạm Thế Hiển, Phường Chánh Hưng, TP.HCM
                </span>
              </div>
            </div>

            {/* Column 2: Về chúng tôi */}
            <div className="footer-item" data-aos="fade-up" data-aos-duration="400">
              <h6 className="footer-item__title text-white">Về chúng tôi</h6>
              <ul className="footer-menu">
                <li className="mb-16">
                  <Link className="text-white hover-text-main-600" href="/gioi-thieu">
                    Giới thiệu về Siêu thị Vina
                  </Link>
                </li>
                <li className="mb-16">
                  <Link className="text-white hover-text-main-600" href="/lien-he">
                    Liên hệ hỗ trợ
                  </Link>
                </li>
                <li className="mb-16">
                  <Link className="text-white hover-text-main-600" href="/dieu-khoan">
                    Điều khoản sử dụng
                  </Link>
                </li>
                <li className="mb-16">
                  <Link className="text-white hover-text-main-600" href="/chinh-sach-nguoi-dung">
                    Chính sách mua hàng
                  </Link>
                </li>
                <li className="mb-16">
                  <Link className="text-white hover-text-main-600" href="/chinh-sach-nguoi-dung">
                    Chính sách người dùng
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Tài khoản */}
            <div className="footer-item" data-aos="fade-up" data-aos-duration="600">
              <h6 className="footer-item__title text-white">Tài khoản</h6>
              <ul className="footer-menu">
                <li className="mb-16">
                  <Link className="text-white hover-text-main-600" href="/tai-khoan">
                    Truy cập tài khoản
                  </Link>
                </li>
                <li className="mb-16">
                  <Link className="text-white hover-text-main-600" href="/don-hang">
                    Lịch sử đơn hàng
                  </Link>
                </li>
                <li className="mb-16">
                  <Link className="text-white hover-text-main-600" href="/yeu-thich">
                    Danh sách yêu thích
                  </Link>
                </li>
                <li className="mb-16">
                  <Link className="text-white hover-text-main-600" href="/gio-hang">
                    Giỏ hàng của bạn
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Thông tin khác */}
            <div className="footer-item" data-aos="fade-up" data-aos-duration="1000">
              <h6 className="footer-item__title text-white">Thông tin khác</h6>
              <ul className="footer-menu">
                <li className="mb-16">
                  <Link className="text-white hover-text-main-600" href="/shop">
                    Danh sách sản phẩm
                  </Link>
                </li>
                <li className="mb-16">
                  <Link className="text-white hover-text-main-600" href="/vendor-two">
                    Các cửa hàng
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 5: Kết nối & theo dõi */}
            <div className="footer-item" data-aos="fade-up" data-aos-duration="1200">
              <h6 className="footer-item__title text-white">Kết nối &amp; theo dõi</h6>
              <p className="mb-16 text-white">
                Truy cập các nền tảng mạng xã hội <br /> của chúng tôi.
              </p>
              <ul className="flex-align gap-16">
                <li>
                  <a
                    href="https://www.facebook.com"
                    className="w-44 h-44 flex-center border border-white text-white text-xl rounded-8 hover-bg-white hover-text-main-two-600"
                  >
                    <i className="ph-fill ph-facebook-logo"></i>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.twitter.com"
                    className="w-44 h-44 flex-center border border-white text-white text-xl rounded-8 hover-bg-white hover-text-main-two-600"
                  >
                    <i className="ph-fill ph-twitter-logo"></i>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com"
                    className="w-44 h-44 flex-center border border-white text-white text-xl rounded-8 hover-bg-white hover-text-main-two-600"
                  >
                    <i className="ph-fill ph-instagram-logo"></i>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com"
                    className="w-44 h-44 flex-center border border-white text-white text-xl rounded-8 hover-bg-white hover-text-main-two-600"
                  >
                    <i className="ph-fill ph-linkedin-logo"></i>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* Bottom Footer - Nền trắng, chữ xám */}
      <div className="bottom-footer py-16" style={{ backgroundColor: '#ffffff' }}>
        <div className="container container-lg">
          <div className="bottom-footer__inner flex-between flex-wrap gap-16">
            <p className="bottom-footer__text text-gray-600">Bản quyền thuộc về sieuthivina.com</p>
            <div className="flex-align gap-8 flex-wrap">
              <span className="text-gray-600 text-sm">Hỗ trợ thanh toán</span>
              <img
                src="https://sieuthivina.com/assets/client/images/thumbs/payment-method.png"
                alt="Payment methods"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
