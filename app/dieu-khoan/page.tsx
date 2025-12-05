"use client";

import Link from "next/link";
import FullHeader from "@/components/FullHeader";

export default function Page() {
  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />
      <main className="container container-lg py-40">
        <h1 className="h3 mb-16">Điều khoản dịch vụ</h1>
        <p className="text-muted mb-12">Cập nhật lần cuối: {new Date().toLocaleDateString()}</p>
        <div className="content" style={{ lineHeight: 1.8 }}>
          <p>
            Đây là trang điều khoản dịch vụ của Siêu Thị Vina. Nội dung chi tiết sẽ được
            cập nhật theo chính sách vận hành của hệ thống. Bằng việc sử dụng dịch vụ,
            bạn đồng ý tuân thủ các điều khoản dưới đây.
          </p>
          <h2 className="h5 mt-20">1. Tài khoản và bảo mật</h2>
          <p>
            Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động diễn ra dưới
            tài khoản của bạn.
          </p>
          <h2 className="h5 mt-20">2. Mua sắm và thanh toán</h2>
          <p>
            Các đơn hàng phải tuân thủ quy định về giá, thanh toán, vận chuyển và hoàn trả
            theo thông báo trên nền tảng.
          </p>
          <h2 className="h5 mt-20">3. Quyền và nghĩa vụ</h2>
          <p>
            Chúng tôi có quyền tạm ngưng dịch vụ nếu phát hiện hành vi vi phạm. Người dùng
            có nghĩa vụ cung cấp thông tin chính xác và hợp tác khi cần thiết.
          </p>
          <p className="mt-24">
            Xem thêm <Link href="/chinh-sach-nguoi-dung" style={{ color: "#ee4d2d" }}>Chính sách bảo mật</Link>.
          </p>
        </div>
      </main>
    </>
  );
}
