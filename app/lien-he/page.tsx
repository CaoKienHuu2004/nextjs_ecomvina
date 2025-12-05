"use client";
import React, { useState } from "react";
import Link from "next/link";
import FullHeader from "@/components/FullHeader";
import BenefitsStrip from "@/components/BenefitsStrip";
import { APP_CONFIG } from "../../src/config/appConfig";


// config
const endpoint_routes_api_fectch_datapost_gui_lien_he_ =
  APP_CONFIG.API_BASE_URL + APP_CONFIG.API_ENDPOINTS.API_GUI_LIEN_HE;

const sodienthoai_call_lienhe_cua_web = "02862523434";
const sodienthoai_lienhe_cua_web = "+028 6252 3434";
const email_lienhe_cua_web = "caodangfpt.hcm@fpt.edu.vn";
const diachi_lienhe_cua_web = "Lô 2, đường số 1, Công viên phần mềm Quang Trung, P. Tân Chánh Hiệp, Quận 12, TP.HCM.";
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
    tieude: "",
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
    setLoading(true);
    setResponseMessage(null);

    try {
      const res = await fetch(endpoint_routes_api_fectch_datapost_gui_lien_he_, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hoten: formData.hoten,
          email: formData.email,
          sodienthoai: formData.sodienthoai,
          tieude: formData.tieude,
          noidung: formData.noidung,
          website: formData.website,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResponseMessage({
          type: "success",
          text: data.message || "Gửi thành công",
        });
        setFormData({
          hoten: "",
          email: "",
          sodienthoai: "",
          tieude: "",
          noidung: "",
          website: "",
        });
      } else {
        setResponseMessage({
          type: "error",
          text: data.message || "Có lỗi xảy ra",
        });
      }
    } catch (error) {
      setResponseMessage({ type: "error", text: "Lỗi kết nối server" });
    }

    setLoading(false);
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
                  <i className="ph ph-house"></i> Home
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

{/* value nhập form */}
{/* le van a */}
{/* testformlienhe@example.com */}
{/* 0991654321 */}
{/* Yêu cầu hướng đẫn mua hàng  */}
{/* Tôi cần webiste hướng đẫn mua hàng. vì tôi ko có rành công nghê, mong anh chi giúp đở  */}
      {/* Contact Section */}
      <section className="contact py-80">
        <div className="container container-lg">
          <div className="row gy-5">
            <div className="col-lg-8">
              <div className="contact-box border border-gray-100 rounded-16 px-24 py-40">
                <form onSubmit={handleSubmit}>
                  <h6 className="mb-32">Tùy chỉnh thực hiện yêu cầu.</h6>

                  {responseMessage && (
                    <div
                      className={`mb-4 p-3 rounded ${
                        responseMessage.type === "success"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {responseMessage.text}
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
                        placeholder="Full name"
                        value={formData.hoten}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-sm-6 col-xs-6">
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
                        placeholder="Email address"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-sm-6 col-xs-6">
                      <label
                        htmlFor="phone"
                        className="flex-align gap-4 text-sm font-heading-two text-gray-900 fw-semibold mb-4"
                      >
                        Số điện thoại<span className="text-danger text-xl line-height-1">*</span>
                      </label>
                      <input
                        type="tel"
                        className="common-input px-16"
                        id="phone"
                        name="sodienthoai"
                        placeholder="Phone Number*"
                        value={formData.sodienthoai}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-sm-6 col-xs-6">
                      <label
                        htmlFor="subject"
                        className="flex-align gap-4 text-sm font-heading-two text-gray-900 fw-semibold mb-4"
                      >
                        Tiều đề <span className="text-danger text-xl line-height-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="common-input px-16"
                        id="subject"
                        name="tieude"
                        placeholder="Subject"
                        value={formData.tieude}
                        onChange={handleChange}
                        required
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
                        placeholder="Type your message"
                        value={formData.noidung}
                        onChange={handleChange}
                        required
                      ></textarea>
                    </div>

                    {/* Honeypot field */}
                    <input
                      type="text"
                      name="website"
                      className="hidden"
                        style={{ display: "none" }}
                      aria-hidden="true"
                      autoComplete="off"
                      value={formData.website}
                      onChange={handleChange}
                    />

                    <div className="col-sm-12 mt-32">
                      <button
                        type="submit"
                        className="btn btn-main py-18 px-32 rounded-8"
                        disabled={loading}
                      >
                        {loading ? "Đang gửi..." : "Gửi Liên Hệ"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Contact Info bên phải */}
            <div className="col-lg-4">
              <div className="contact-box border border-gray-100 rounded-16 px-24 py-40">
                <h6 className="mb-48">Liện Hệ</h6>
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
                  href="#"
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
