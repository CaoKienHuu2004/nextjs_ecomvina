"use client";

import React, { JSX, useState, useEffect } from "react";
import Cookies from "js-cookie";
import FullHeader from "@/components/FullHeader";
import AccountShell from "@/components/AccountShell";
import BenefitsStrip from "@/components/BenefitsStrip";
import { useAuth } from "@/hooks/useAuth";

// 1. Cập nhật Type khớp với API Laravel & DOCX
type Address = {
  id: number; // Laravel ID thường là number
  ten_nguoinhan: string;
  sodienthoai: string;
  diachi: string;
  tinhthanh: string; // API nhận/trả tên tỉnh (vd: "Thành phố Đà Nẵng")
  trangthai?: string; // API trả về "Mặc định" hoặc null/khác
};

type Tinh = {
  id: number;
  ten: string;
  code?: string;
};

const PROVINCES_FALLBACK: Tinh[] = [
  { id: 1, ten: "Thành phố Hà Nội", code: "01" },
  { id: 2, ten: "Tỉnh Hà Giang", code: "02" },
  { id: 3, ten: "Tỉnh Cao Bằng", code: "04" },
  { id: 4, ten: "Tỉnh Bắc Kạn", code: "06" },
  { id: 5, ten: "Tỉnh Tuyên Quang", code: "08" },
  { id: 6, ten: "Tỉnh Lào Cai", code: "10" },
  { id: 7, ten: "Tỉnh Điện Biên", code: "11" },
  { id: 8, ten: "Tỉnh Lai Châu", code: "12" },
  { id: 9, ten: "Tỉnh Sơn La", code: "14" },
  { id: 10, ten: "Tỉnh Yên Bái", code: "15" },
  { id: 11, ten: "Tỉnh Hoà Bình", code: "17" },
  { id: 12, ten: "Tỉnh Thái Nguyên", code: "19" },
  { id: 13, ten: "Tỉnh Lạng Sơn", code: "20" },
  { id: 14, ten: "Tỉnh Quảng Ninh", code: "22" },
  { id: 15, ten: "Tỉnh Bắc Giang", code: "24" },
  { id: 16, ten: "Tỉnh Phú Thọ", code: "25" },
  { id: 17, ten: "Tỉnh Vĩnh Phúc", code: "26" },
  { id: 18, ten: "Tỉnh Bắc Ninh", code: "27" },
  { id: 19, ten: "Tỉnh Hải Dương", code: "30" },
  { id: 20, ten: "Thành phố Hải Phòng", code: "31" },
  { id: 21, ten: "Tỉnh Hưng Yên", code: "33" },
  { id: 22, ten: "Tỉnh Thái Bình", code: "34" },
  { id: 23, ten: "Tỉnh Hà Nam", code: "35" },
  { id: 24, ten: "Tỉnh Nam Định", code: "36" },
  { id: 25, ten: "Tỉnh Ninh Bình", code: "37" },
  { id: 26, ten: "Tỉnh Thanh Hóa", code: "38" },
  { id: 27, ten: "Tỉnh Nghệ An", code: "40" },
  { id: 28, ten: "Tỉnh Hà Tĩnh", code: "42" },
  { id: 29, ten: "Tỉnh Quảng Bình", code: "44" },
  { id: 30, ten: "Tỉnh Quảng Trị", code: "45" },
  { id: 31, ten: "Tỉnh Thừa Thiên Huế", code: "46" },
  { id: 32, ten: "Thành phố Đà Nẵng", code: "48" },
  { id: 33, ten: "Tỉnh Quảng Nam", code: "49" },
  { id: 34, ten: "Tỉnh Quảng Ngãi", code: "51" },
  { id: 35, ten: "Tỉnh Bình Định", code: "52" },
  { id: 36, ten: "Tỉnh Phú Yên", code: "54" },
  { id: 37, ten: "Tỉnh Khánh Hòa", code: "56" },
  { id: 38, ten: "Tỉnh Ninh Thuận", code: "58" },
  { id: 39, ten: "Tỉnh Bình Thuận", code: "60" },
  { id: 40, ten: "Tỉnh Kon Tum", code: "62" },
  { id: 41, ten: "Tỉnh Gia Lai", code: "64" },
  { id: 42, ten: "Tỉnh Đắk Lắk", code: "66" },
  { id: 43, ten: "Tỉnh Đắk Nông", code: "67" },
  { id: 44, ten: "Tỉnh Lâm Đồng", code: "68" },
  { id: 45, ten: "Tỉnh Bình Phước", code: "70" },
  { id: 46, ten: "Tỉnh Tây Ninh", code: "72" },
  { id: 47, ten: "Tỉnh Bình Dương", code: "74" },
  { id: 48, ten: "Tỉnh Đồng Nai", code: "75" },
  { id: 49, ten: "Tỉnh Bà Rịa - Vũng Tàu", code: "77" },
  { id: 50, ten: "Thành phố Hồ Chí Minh", code: "79" },
  { id: 51, ten: "Tỉnh Long An", code: "80" },
  { id: 52, ten: "Tỉnh Tiền Giang", code: "82" },
  { id: 53, ten: "Tỉnh Bến Tre", code: "83" },
  { id: 54, ten: "Tỉnh Trà Vinh", code: "84" },
  { id: 55, ten: "Tỉnh Vĩnh Long", code: "86" },
  { id: 56, ten: "Tỉnh Đồng Tháp", code: "87" },
  { id: 57, ten: "Tỉnh An Giang", code: "89" },
  { id: 58, ten: "Tỉnh Kiên Giang", code: "91" },
  { id: 59, ten: "Thành phố Cần Thơ", code: "92" },
  { id: 60, ten: "Tỉnh Hậu Giang", code: "93" },
  { id: 61, ten: "Tỉnh Sóc Trăng", code: "94" },
  { id: 62, ten: "Tỉnh Bạc Liêu", code: "95" },
  { id: 63, ten: "Tỉnh Cà Mau", code: "96" }
];

export default function Page(): JSX.Element {
  const { user } = useAuth(); // Lấy thông tin user để truyền vào AccountShell
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editing, setEditing] = useState<Address | null>(null);

  // State tạm để lưu ID tỉnh đang chọn trong form (vì Address chỉ lưu tên)
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | string>("");

  const [provinces, setProvinces] = useState<Tinh[]>([]);
  useEffect(() => {
    let mounted = true;
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://sieuthivina.com";
    const PROVINCES_PATH = process.env.NEXT_PUBLIC_PROVINCES_PATH || "/api/v1/provinces";

    (async () => {
      try {
        const res = await fetch(`${API_BASE}${PROVINCES_PATH}`, { headers: { Accept: "application/json" } });
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          const data = Array.isArray(json) ? json : (json.data || []);
          setProvinces(data);
        } else {
          setProvinces(PROVINCES_FALLBACK);
        }
      } catch {
        if (mounted) setProvinces(PROVINCES_FALLBACK);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Hàm lấy token
  const getToken = () => Cookies.get("access_token");

  // 2. FETCH: Lấy danh sách địa chỉ từ API Laravel
  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch("https://sieuthivina.com/api/v1/dia-chi", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      if (res.ok) {
        const json = await res.json();
        // API có thể trả về { data: [...] } hoặc [...]
        const data = Array.isArray(json) ? json : (json.data || []);
        setAddresses(data);
      }
    } catch (e) {
      console.error("Lỗi tải địa chỉ:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // 3. DELETE: Xóa địa chỉ theo API mới
  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa địa chỉ này không?")) return;

    try {
      const res = await fetch(`https://sieuthivina.com/api/v1/dia-chi/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${getToken()}`,
          "Accept": "application/json"
        }
      });

      if (res.ok) {
        // Cập nhật UI ngay lập tức bằng cách lọc bỏ item đã xóa
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert("Không thể xóa địa chỉ này.");
      }
    } catch (e) {
      console.error("Lỗi xóa địa chỉ:", e);
      alert("Đã có lỗi xảy ra.");
    }
  };

  // 4. SET DEFAULT: Đặt mặc định
  const handleSetDefault = async (id: number) => {
    try {
      const res = await fetch(`https://sieuthivina.com/api/v1/dia-chi/macdinh/${id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${getToken()}`,
          "Accept": "application/json"
        }
      });

      if (res.ok) {
        // Reload lại để server cập nhật trạng thái các địa chỉ khác thành không mặc định
        fetchAddresses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Chuẩn bị form Thêm mới
  const handleAdd = () => {
    setEditing({
      id: 0, // ID 0 đánh dấu là thêm mới
      ten_nguoinhan: user?.hoten || "",
      sodienthoai: user?.sodienthoai || "",
      diachi: "",
      tinhthanh: "",
      trangthai: ""
    });
    setSelectedProvinceId("");
  };

  // Chuẩn bị form Chỉnh sửa
  const handleEdit = (a: Address) => {
    setEditing({ ...a });
    // Tìm ID tỉnh dựa vào tên tỉnh (reverse lookup) để hiển thị đúng trên Select
    const list = provinces.length ? provinces : PROVINCES_FALLBACK;
    const foundProvince = list.find(p => p.ten === a.tinhthanh);
    setSelectedProvinceId(foundProvince ? foundProvince.id : "");
  };

  // 5. SAVE: Lưu (Thêm hoặc Sửa)
  const handleSaveEdit = async () => {
    if (!editing) return;

    // Validate cơ bản
    if (!editing.ten_nguoinhan || !editing.sodienthoai || !editing.diachi || !editing.tinhthanh) {
      alert("Vui lòng điền đầy đủ thông tin (bao gồm Tỉnh/Thành)");
      return;
    }

    const isEdit = editing.id !== 0;
    const url = isEdit
      ? `https://sieuthivina.com/api/v1/dia-chi/${editing.id}`
      : `https://sieuthivina.com/api/v1/dia-chi`;

    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${getToken()}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          hoten: editing.ten_nguoinhan,
          sodienthoai: editing.sodienthoai,
          diachi: editing.diachi,
          tinhthanh: editing.tinhthanh,
          trangthai: editing.trangthai || "Khác"
          // Nếu thêm mới, có thể gửi kèm trạng thái nếu user muốn (tuỳ logic UI)
        })
      });

      if (res.ok) {
        setEditing(null);
        fetchAddresses();
      } else {
        alert("Lỗi khi lưu địa chỉ. Vui lòng thử lại.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      <AccountShell title="Sổ địa chỉ" current="addresses">
        {!editing && (
          <>
            <div className="flex-wrap gap-16 mb-20 flex-between ">
              <h6 className="mb-0 text-gray-900">Sổ địa chỉ</h6>
              <div className="flex-wrap gap-16 position-relative flex-align">
                <button type="button" className="text-2xl border border-gray-100 w-44 h-44 d-lg-none d-flex flex-center rounded-6 sidebar-btn">
                  <i className="ph-bold ph-folder-user" />
                </button>
              </div>
            </div>

            <div className="p-16 border border-gray-100 rounded-8">
              <a
                role="button"
                onClick={handleAdd}
                className="px-20 py-12 mb-10 border-2 border-dashed w-100 border-info-300 bg-info-50 hover-bg-info-100 text-main-900 rounded-4 d-flex justify-content-center align-items-center"
              >
                <div className="text-center">
                  <div className="gap-12 flex-align flex-center">
                    <i className="text-xl ph-bold ph-plus fw-bold text-info-600" />
                    <span className="pb-0 mb-0 fw-medium text-info-600 text-md pe-10">Thêm địa chỉ giao hàng</span>
                  </div>
                </div>
              </a>

              {/* danh sách địa chỉ (ẩn khi đang editing) */}
              {!editing && (
                <div className="row gy-2">
                  {loading ? (
                    <div className="py-20 text-center col-12">Đang tải...</div>
                  ) : addresses.length === 0 ? (
                    <div className="py-24 text-center col-12 text-muted">
                      Chưa có địa chỉ. Thêm địa chỉ giao hàng để sử dụng khi đặt hàng.
                    </div>
                  ) : (
                    addresses
                      .sort((a, b) => (a.trangthai === "Mặc định" ? -1 : 1))
                      .map((a) => {
                        const isDefault = a.trangthai === "Mặc định";
                        return (
                          <div key={a.id} className="col-lg-12 col-xl-12">
                            <div className="px-20 py-16 mb-10 border border-gray-200 box-shadow-sm text-main-900 rounded-4">
                              <div className="gap-24 d-flex flex-align flex-between">
                                <div className="gap-12 flex-align">
                                  <div>
                                    <div className="text-gray-900 fw-semibold text-md">{a.ten_nguoinhan}</div>
                                    <div className="text-gray-900 fw-semibold text-md">{a.sodienthoai}</div>
                                  </div>
                                  {isDefault && (
                                    <span className="gap-8 px-6 py-2 text-xs fw-medium text-success-700 bg-success-100 rounded-4 flex-align">
                                      Mặc định
                                    </span>
                                  )}
                                </div>

                                <div className="gap-24 pt-10 d-flex flex-align">
                                  <div className="gap-4 flex-align">
                                    <i className="ph-bold ph-pencil-simple text-main-600" />
                                    <a role="button" onClick={() => handleEdit(a)} className="gap-8 py-6 text-sm text-main-600 rounded-4 w-100 transition-1">
                                      Chỉnh sửa
                                    </a>
                                  </div>

                                  <div className={`flex-align gap-4 ${isDefault ? "opacity-50" : ""}`}>
                                    <i className="ph-bold ph-trash text-main-600" />
                                    <span role="button" onClick={() => !isDefault && handleDelete(a.id)} className="gap-8 py-6 text-sm text-main-600 rounded-4 w-100 transition-1">
                                      Xóa
                                    </span>
                                  </div>

                                  {!isDefault && (
                                    <div className="gap-4 flex-align">
                                      <i className="ph-bold ph-check text-main-600" />
                                      <a role="button" onClick={() => handleSetDefault(a.id)} className="gap-8 py-6 text-sm text-main-600 rounded-4 w-100 transition-1">
                                        Thiết lập mặc định
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="gap-24 pt-10 d-flex flex-align">
                                <div className="gap-12 flex-align">
                                  <span className="text-sm text-gray-900 fw-medium">Địa chỉ: {a.diachi}</span>
                                </div>
                              </div>

                              <div className="gap-24 pt-10 d-flex flex-align">
                                <div className="gap-4 flex-align opacity-70">
                                  <i className="ph-bold ph-map-pin-area text-main-600" />
                                  <span className="text-sm text-gray-900">{a.tinhthanh}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Form Sửa / Thêm (Modal hoặc Drawer) */}
        {editing && (
          <div> {/*  className="p-16 mb-16 border border-gray-100 rounded-8" */}
            <div className="flex-wrap gap-16 mb-12 flex-between">
              <h6 className="mb-0 text-gray-900">{editing.id === 0 ? "Thêm địa chỉ giao hàng" : "Cập nhật địa chỉ"}</h6>
              <div className="flex-wrap gap-16 position-relative flex-align">
                <button
                  type="button"
                  className="text-2xl border border-gray-100 w-44 h-44 d-lg-none d-flex flex-center rounded-6 sidebar-btn"
                  onClick={() => setEditing(null)}
                >
                  <i className="ph-bold ph-x" />
                </button>
              </div>
            </div>

            <div className="p-16 border border-gray-100 rounded-8">
              <div className="row">
                <div className="mb-24 col-md-6">
                  <label className="mb-8 text-neutral-900 text-md fw-medium">Họ và tên <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="py-12 text-sm placeholder-italic px-18 common-input"
                    value={editing.ten_nguoinhan}
                    onChange={(e) => setEditing({ ...editing, ten_nguoinhan: e.target.value })}
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div className="mb-24 col-md-6">
                  <label className="mb-8 text-neutral-900 text-md fw-medium">Số điện thoại <span className="text-danger">*</span></label>
                  <input
                    type="tel"
                    className="py-12 text-sm placeholder-italic px-18 common-input"
                    value={editing.sodienthoai}
                    onChange={(e) => setEditing({ ...editing, sodienthoai: e.target.value })}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

              <div className="row">
                <div className="mb-24 col-md-6">
                  <label className="mb-8 text-neutral-900 text-md fw-medium">Địa chỉ <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="py-12 text-sm placeholder-italic px-18 common-input"
                    value={editing.diachi}
                    onChange={(e) => setEditing({ ...editing, diachi: e.target.value })}
                    placeholder="Nhập địa chỉ giao hàng"
                  />
                </div>
                <div className="mb-24 col-md-6">
                  <label className="mb-8 text-neutral-900 text-md fw-medium">Tỉnh thành <span className="text-danger">*</span></label>
                  <select
                    className="text-sm placeholder-italic common-input py-11 px-14"
                    value={selectedProvinceId || ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSelectedProvinceId(val);
                      const province = PROVINCES_FALLBACK.find(p => p.id === val);
                      setEditing({ ...editing, tinhthanh: province ? province.ten : "" });
                    }}
                  >
                    <option value="">-- Chọn Tỉnh/Thành --</option>
                    {(provinces.length ? provinces : PROVINCES_FALLBACK).map((t) => (
                      <option key={t.id} value={t.id}>{t.ten}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="mb-24 col-md-6">
                  <div className="form-check common-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="defaultInline"
                      checked={editing.trangthai === "Mặc định"}
                      onChange={(e) => setEditing({ ...editing, trangthai: e.target.checked ? "Mặc định" : "" })}
                    />
                    <label className="form-check-label flex-grow-1" htmlFor="defaultInline">
                      Đặt địa chỉ làm mặc định <span className="text-xs text-gray-600 fst-italic fw-normal">(Địa chỉ sẽ được đặt mặc định cho việc thanh toán và giao hàng của bạn)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="mb-24 col-md-6">
                  <div className="gap-12 d-flex">
                    <button
                      type="button"
                      onClick={() => { handleSaveEdit(); }}
                      className="px-32 btn btn-main py-14"
                    >
                      {editing.id === 0 ? "Thêm địa chỉ mới" : "Lưu thay đổi"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="px-24 btn btn-outline-secondary py-14"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AccountShell>

      <BenefitsStrip />
    </>
  );
}