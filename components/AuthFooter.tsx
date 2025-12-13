import Link from "next/link";
import Image from "next/image";

export default function AuthFooter() {
  return (
    <footer className="overflow-hidden border-top" style={{ background: "#f7f7f7", borderTopColor: "#e6e6e6" }}>
      <div className="container container-lg py-40">
        <div className="auth-footer__grid">
          {/* Cột trái: Logo + intro + liên hệ + mạng xã hội */}
          <div className="footer-item" style={{ minWidth: 0 }}>
            <div className="footer-item__logo mb-12">
              <Link href="/">
                <Image src="/assets/images/logo/logo_nguyenban.png" alt="Siêu Thị Vina" width={180} height={60} style={{ height: "auto", width: "auto" }} />
              </Link>
            </div>
            <p className="mb-20">
              Trang thương mại điện tử Siêu Thị Vina cung cấp các sản phẩm đa dạng đến với khách hàng và đăng ký đối tác với các cửa hàng.
            </p>
            <div className="flex-align gap-12 mb-10">
              <span className="w-32 h-32 flex-center rounded-circle border border-gray-100 text-main-two-600 text-md flex-shrink-0">
                <i className="ph-fill ph-phone-call"></i>
              </span>
              <a href="tel:+884911975996" className="text-md text-gray-900 hover-text-main-600">+884 0911 975 996</a>
            </div>
            <div className="flex-align gap-12 mb-10">
              <span className="w-32 h-32 flex-center rounded-circle border border-gray-100 text-main-two-600 text-md flex-shrink-0">
                <i className="ph-fill ph-envelope"></i>
              </span>
              <a href="mailto:hotro@amban.vn" className="text-md text-gray-900 hover-text-main-600">hotro@amban.vn</a>
            </div>
            <div className="flex-align gap-12 mb-16">
              <span className="w-32 h-32 flex-center rounded-circle border border-gray-100 text-main-two-600 text-md flex-shrink-0">
                <i className="ph-fill ph-map-pin"></i>
              </span>
              <span className="text-md text-gray-900">No.XXXX Fengshi.rd, Shigang - Taichung, Taiwan</span>
            </div>
          </div>

          {/* Cột 2: Về chúng tôi */}
          <div className="footer-item" style={{ minWidth: 0 }}>
            <h6 className="footer-item__title text-heading fw-semibold">Về chúng tôi</h6>
            <ul className="footer-menu" style={{ listStyle: "none", paddingLeft: 0 }}>
              <li className="mb-10"><Link href="/gioithieu" className="text-gray-600 hover-text-main-600">Giới thiệu về Siêu thị Vina</Link></li>
              <li className="mb-10"><Link href="/lienhe" className="text-gray-600 hover-text-main-600">Liên hệ hỗ trợ</Link></li>
              <li className="mb-10"><Link href="/dieu-khoan" className="text-gray-600 hover-text-main-600">Điều khoản sử dụng</Link></li>
              <li className="mb-10"><Link href="/chinh-sach-mua-hang" className="text-gray-600 hover-text-main-600">Chính sách mua hàng</Link></li>
              <li className="mb-10"><Link href="/chinh-sach-nguoi-dung" className="text-gray-600 hover-text-main-600">Chính sách người dùng</Link></li>
              <li className="mb-10"><Link href="/chinh-sach-cua-hang" className="text-gray-600 hover-text-main-600">Chính sách cửa hàng</Link></li>
            </ul>
          </div>

          {/* Cột 3: Tài khoản */}
          <div className="footer-item" style={{ minWidth: 0 }}>
            <h6 className="footer-item__title text-heading fw-semibold">Tài khoản</h6>
            <ul className="footer-menu" style={{ listStyle: "none", paddingLeft: 0 }}>
              <li className="mb-10"><Link href="/dang-nhap" className="text-gray-600 hover-text-main-600">Truy cập tài khoản</Link></li>
              <li className="mb-10"><Link href="/yeu-thich" className="text-gray-600 hover-text-main-600">Danh sách yêu thích</Link></li>
            </ul>
          </div>

          {/* Cột 4: Thông tin khác */}
          <div className="footer-item" style={{ minWidth: 0 }}>
            <h6 className="footer-item__title text-heading fw-semibold">Thông tin khác</h6>
            <ul className="footer-menu" style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              <li className="mb-10"><Link href="/san-pham" className="text-gray-600 hover-text-main-600">Danh sách sản phẩm</Link></li>
              <li className="mb-10"><Link href="/cua-hang" className="text-gray-600 hover-text-main-600">Các cửa hàng</Link></li>
            </ul>
          </div>

          {/* Cột 5: Kết nối & theo dõi (đặt ở cột phải) */}
          <div className="footer-item" style={{ minWidth: 0 }}>
            <h6 className="footer-item__title text-heading fw-semibold" style={{ marginTop: 0 }}>Kết nối & theo dõi</h6>
            <p className="mb-14 text-gray-600">Truy cập các nền tảng mạng xã hội của chúng tôi.</p>
            <ul className="flex-align gap-12">
              <li><a href="https://www.facebook.com" className="w-36 h-36 flex-center rounded-8" style={{ background: "#ffe5e0", color: "#ee4d2d" }}><i className="ph-fill ph-facebook-logo"></i></a></li>
              <li><a href="https://www.twitter.com" className="w-36 h-36 flex-center rounded-8" style={{ background: "#ffe5e0", color: "#ee4d2d" }}><i className="ph-fill ph-twitter-logo"></i></a></li>
              <li><a href="https://www.instagram.com" className="w-36 h-36 flex-center rounded-8" style={{ background: "#ffe5e0", color: "#ee4d2d" }}><i className="ph-fill ph-instagram-logo"></i></a></li>
              <li><a href="https://www.linkedin.com" className="w-36 h-36 flex-center rounded-8" style={{ background: "#ffe5e0", color: "#ee4d2d" }}><i className="ph-fill ph-linkedin-logo"></i></a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ background: "#ececec", borderTop: "1px solid #e2e2e2" }}>
        <div className="container container-lg py-12 d-flex flex-wrap justify-content-center align-items-center gap-16" style={{ columnGap: 28 }}>
          <div className="text-sm text-gray-700" style={{ opacity: 0.9 }}>
            Siêu Thị Vina © {new Date().getFullYear()}. All Rights Reserved
          </div>
          <div className="text-sm fw-semibold" style={{ color: "#2d3a8c" }}>Chấp nhận thanh toán</div>
          <div className="d-flex flex-align" style={{ gap: 12 }}>
            <Image
              src="/assets/images/thumbs/payment-method.png"
              alt="Payment methods"
              width={220}
              height={28}
              style={{ width: '220px', height: '28px' }}
            />
          </div>
        </div>
      </div>
      <style jsx>{`
        .auth-footer__grid {
          display: grid;
          grid-template-columns: minmax(260px, 1.2fr) repeat(4, minmax(140px, 1fr));
          column-gap: 40px;
          row-gap: 24px;
          align-items: start;
        }
        .auth-footer__grid > .footer-item { min-width: 0; }
        .pay-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          font-size: 11px;
          line-height: 1;
          color: #fff;
          background: #111;
          border-radius: 6px;
          box-shadow: 0 1px 0 rgba(0,0,0,0.15);
        }
        @media (max-width: 1024px) {
          .auth-footer__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
    </footer>
  );
}
