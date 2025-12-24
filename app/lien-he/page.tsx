"use client";
import React, { useState } from "react";
import Link from "next/link";
import FullHeader from "@/components/FullHeader";
import BenefitsStrip from "@/components/BenefitsStrip";

// config - sử dụng endpoint đúng
const endpoint_routes_api_fectch_datapost_gui_lien_he_ = "https://sieuthivina.com/api/v1/lien-he";

const sodienthoai_call_lienhe_cua_web = "8860911975996";
const sodienthoai_lienhe_cua_web = "+886 0911 975 996";
const email_lienhe_cua_web = "hotro@sieuthivina.com";
const diachi_lienhe_cua_web = "801/2A Phạm Thế Hiển, Phường 4, Quận 8, TP.HCM.";
// config

type ResponseMessage = {
  type: "success" | "error";
  text: string;
} | null;

export default function Page() {
  const [formData, setFormData] = useState({
    hoten: "",
    email: "",
    sodienthoai: "",
    noidung: "",
    website: "", // honeypot
  });

  const [responseMessage, setResponseMessage] = useState<ResponseMessage>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Kiểm tra honeypot - chặn spam bot
    if (formData.website) {
      console.log("Spam bot detected");
      return;
    }

    setLoading(true);
    setResponseMessage(null);

    try {
      console.log("🚀 Sending request to:", endpoint_routes_api_fectch_datapost_gui_lien_he_);
      console.log("📦 Request body:", {
        hoten: formData.hoten,
        email: formData.email,
        sodienthoai: formData.sodienthoai,
        noidung: formData.noidung,
      });

      const res = await fetch(endpoint_routes_api_fectch_datapost_gui_lien_he_, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          hoten: formData.hoten,
          email: formData.email,
          sodienthoai: formData.sodienthoai,
          noidung: formData.noidung,
        }),
      });

      console.log("📡 Response status:", res.status);
      console.log("📡 Response ok:", res.ok);

      // Kiểm tra content-type trước khi parse JSON
      const contentType = res.headers.get("content-type");
      console.log("📄 Content-Type:", contentType);

      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("❌ Non-JSON response:", text.substring(0, 200));
        throw new Error("Server trả về định dạng không đúng (không phải JSON)");
      }

      const data = await res.json();
      console.log("✅ Response data:", data);

      if (res.ok && data.status === 200) {
        setResponseMessage({
          type: "success",
          text: data.message || "Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.",
        });
        // Reset form
        setFormData({
          hoten: "",
          email: "",
          sodienthoai: "",
          noidung: "",
          website: "",
        });

        // Tự động ẩn thông báo sau 5 giây
        setTimeout(() => {
          setResponseMessage(null);
        }, 5000);
      } else {
        setResponseMessage({
          type: "error",
          text: data.message || `Lỗi: ${res.status} - ${res.statusText}`,
        });
      }
    } catch (error) {
      console.error("❌ Contact form error:", error);
      setResponseMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Lỗi kết nối server. Vui lòng thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      {/* Breadcrumb */}
      <div className="breadcrumb mb-0 py-26 bg-main-two-50">
        <div className="container container-lg">
          <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
            <h6 className="mb-0">Liên Hệ</h6>
            <ul className="flex-align gap-8 flex-wrap">
              <li className="text-sm">
                <Link
                  href="/"
                  className="text-gray-900 flex-align gap-8 hover-text-main-600"
                >
                  <i className="ph ph-house"></i> Trang chủ
                </Link>
              </li>
              <li className="flex-align">
                <i className="ph ph-caret-right"></i>
              </li>
              <li className="text-sm text-main-600"> Liên Hệ </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <section className="contact py-80">
        <div className="container container-lg">
          <div className="row gy-5">
            <div className="col-lg-8">
              <div className="contact-box border border-gray-100 rounded-16 px-24 py-40">
                <form onSubmit={handleSubmit}>
                  <h6 className="mb-32">Gửi yêu cầu hỗ trợ</h6>

                  {responseMessage && (
                    <div
                      className={`mb-4 p-3 rounded ${responseMessage.type === "success"
                        ? "bg-success-50 text-success-600 border border-success-600"
                        : "bg-danger-50 text-danger-600 border border-danger-600"
                        }`}
                      role="alert"
                    >
                      <div className="flex-align gap-8">
                        <i
                          className={`ph-bold ${responseMessage.type === "success"
                            ? "ph-check-circle"
                            : "ph-warning-circle"
                            } text-xl`}
                        ></i>
                        <span>{responseMessage.text}</span>
                      </div>
                    </div>
                  )}

                  <div className="row gy-4">
                    <div className="col-sm-6 col-xs-6">
                      <label
                        htmlFor="name"
                        className="flex-align gap-4 text-sm font-heading-two text-gray-900 fw-semibold mb-4"
                      >
                        Họ tên <span className="text-danger text-xl line-height-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="common-input px-16"
                        id="name"
                        name="hoten"
                        placeholder="Nhập họ tên của bạn"
                        value={formData.hoten}
                        onChange={handleChange}
                        required
                        minLength={2}
                        maxLength={100}
                      />
                    </div>

                    <div className="col-sm-6 col-xs-6">
                      <label
                        htmlFor="phone"
                        className="flex-align gap-4 text-sm font-heading-two text-gray-900 fw-semibold mb-4"
                      >
                        Số điện thoại <span className="text-danger text-xl line-height-1">*</span>
                      </label>
                      <input
                        type="tel"
                        className="common-input px-16"
                        id="phone"
                        name="sodienthoai"
                        placeholder="0xxxxxxxxx"
                        value={formData.sodienthoai}
                        onChange={handleChange}
                        required
                        pattern="[0-9]{10,11}"
                        title="Vui lòng nhập số điện thoại hợp lệ (10-11 số)"
                      />
                    </div>

                    <div className="col-sm-12">
                      <label
                        htmlFor="email"
                        className="flex-align gap-4 text-sm font-heading-two text-gray-900 fw-semibold mb-4"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        className="common-input px-16"
                        id="email"
                        name="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-sm-12">
                      <label
                        htmlFor="message"
                        className="flex-align gap-4 text-sm font-heading-two text-gray-900 fw-semibold mb-4"
                      >
                        Nội dung <span className="text-danger text-xl line-height-1">*</span>
                      </label>
                      <textarea
                        className="common-input px-16"
                        id="message"
                        name="noidung"
                        placeholder="Nhập nội dung chi tiết bạn muốn liên hệ..."
                        value={formData.noidung}
                        onChange={handleChange}
                        required
                        minLength={10}
                        rows={6}
                      ></textarea>
                    </div>

                    {/* Honeypot field - ẩn khỏi người dùng thật */}
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.website}
                      onChange={handleChange}
                      style={{
                        position: "absolute",
                        left: "-9999px",
                        width: "1px",
                        height: "1px",
                      }}
                      aria-hidden="true"
                    />

                    <div className="col-sm-12 mt-32">
                      <button
                        type="submit"
                        className="btn btn-main py-18 px-32 rounded-8"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <i className="ph ph-paper-plane-tilt me-2"></i>
                            Gửi Liên Hệ
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Contact Info bên phải */}
            <div className="col-lg-4">
              <div className="contact-box border border-gray-100 rounded-16 px-24 py-40">
                <h6 className="mb-48">Thông tin liên hệ</h6>
                <div className="flex-align gap-16 mb-16">
                  <span className="w-40 h-40 flex-center rounded-circle border border-gray-100 text-main-two-600 text-2xl flex-shrink-0">
                    <i className="ph-fill ph-phone-call"></i>
                  </span>
                  <a
                    href={`tel:+${sodienthoai_call_lienhe_cua_web}`}
                    className="text-md text-gray-900 hover-text-main-600"
                  >
                    {sodienthoai_lienhe_cua_web}
                  </a>
                </div>
                <div className="flex-align gap-16 mb-16">
                  <span className="w-40 h-40 flex-center rounded-circle border border-gray-100 text-main-two-600 text-2xl flex-shrink-0">
                    <i className="ph-fill ph-envelope"></i>
                  </span>
                  <a
                    href={`mailto:${email_lienhe_cua_web}`}
                    className="text-md text-gray-900 hover-text-main-600"
                  >
                    {email_lienhe_cua_web}
                  </a>
                </div>
                <div className="flex-align gap-16 mb-0">
                  <span className="w-40 h-40 flex-center rounded-circle border border-gray-100 text-main-two-600 text-2xl flex-shrink-0">
                    <i className="ph-fill ph-map-pin"></i>
                  </span>
                  <span className="text-md text-gray-900 ">
                    {diachi_lienhe_cua_web}
                  </span>
                </div>
              </div>
              <div className="mt-24 flex-align flex-wrap gap-16">
                <a
                  href={`tel:+${sodienthoai_call_lienhe_cua_web}`}
                  className="bg-neutral-600 hover-bg-main-600 rounded-8 p-10 px-16 flex-between flex-wrap gap-8 flex-grow-1"
                >
                  <span className="text-white fw-medium">Nhận hỗ trợ khi gọi</span>
                  <span className="w-36 h-36 bg-main-600 rounded-8 flex-center text-xl text-white">
                    <i className="ph ph-headset"></i>
                  </span>
                </a>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=801%2F2A+Ph%E1%BA%A1m+Th%E1%BA%BF+Hi%E1%BB%83n%2C+Ph%C6%B0%E1%BB%9Dng+4%2C+Qu%E1%BA%ADn+8%2C+TP.HCM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-neutral-600 hover-bg-main-600 rounded-8 p-10 px-16 flex-between flex-wrap gap-8 flex-grow-1"
                >
                  <span className="text-white fw-medium">Nhận chỉ đường</span>
                  <span className="w-36 h-36 bg-main-600 rounded-8 flex-center text-xl text-white">
                    <i className="ph ph-map-pin"></i>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BenefitsStrip />
    </>
  );
}