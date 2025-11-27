"use client";

import Link from "next/link";
import FullHeader from "@/components/FullHeader";

export default function Page() {
  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />
      <main className="container container-lg py-40">
        <h1 className="h3 mb-16">Chính sách bảo mật</h1>
        <p className="text-muted mb-12">Cập nhật lần cuối: {new Date().toLocaleDateString()}</p>
        <div className="content" style={{ lineHeight: 1.8 }}>
          <p>
            Chúng tôi tôn trọng quyền riêng tư của bạn. Trang này mô tả cách Siêu Thị Vina
            thu thập, sử dụng và bảo vệ dữ liệu cá nhân của người dùng.
          </p>
          <h2 className="h5 mt-20">1. Dữ liệu thu thập</h2>
          <p>
            Bao gồm thông tin tài khoản, thông tin liên hệ và dữ liệu giao dịch cần thiết để
            cung cấp dịch vụ.
          </p>
          <h2 className="h5 mt-20">2. Mục đích sử dụng</h2>
          <p>
            Dùng để xử lý đơn hàng, hỗ trợ khách hàng, cải thiện trải nghiệm và đảm bảo an toàn hệ thống.
          </p>
          <h2 className="h5 mt-20">3. Bảo mật</h2>
          <p>
            Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu cá nhân.
          </p>
          <p className="mt-24">
            Xem thêm <Link href="/dieukhoan" style={{ color: "#ee4d2d" }}>Điều khoản dịch vụ</Link>.
          </p>
        </div>
      </main>
    </>
  );
}