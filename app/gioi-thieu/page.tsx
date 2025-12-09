"use client";

import { useEffect, useState } from "react";
import FullHeader from "@/components/FullHeader";
// import { APP_CONFIG } from "@/config/appConfig"; // nhớ import
import { APP_CONFIG } from "../../src/config/appConfig"; // dùng này vì tôi sợ cấu hình tsconfig khác mấy ông thì rối lắm

export default function Page() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  // Ghép endpoint từ config
  const endpoint =
    APP_CONFIG.API_BASE_URL + APP_CONFIG.API_ENDPOINTS.TRANG_GIOI_THIEU;

  useEffect(() => {
    fetch(endpoint)
      .then((res) => res.json())
      .then((res) => {
        if (res?.data?.length > 0) {
          setContent(res.data[0].mota);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      <main className="container container-lg py-40">
        <h1 className="h3 mb-16">Giới thiệu về chúng tôi</h1>

        {loading ? (
          <p className="text-center text-muted">Đang tải nội dung...</p>
        ) : (
          <div
            className="content"
            style={{ lineHeight: 1.8, maxWidth: 900, margin: "auto" }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </main>
    </>
  );
}
