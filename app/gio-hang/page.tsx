"use client";
import Link from 'next/link';
import React, { useEffect, useState, useCallback } from 'react';
import { useCart, parseVoucherCondition, isVoucherInDateRange } from '@/hooks/useCart'; // Bỏ các type thừa không dùng
import { useHomeData, HomeDataProvider } from '@/hooks/useHomeData'; // Vẫn giữ để lấy voucher fallback nếu cần
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import FullHeader from '@/components/FullHeader';
import QuantityControl from '@/components/TangGiamSL';

// --- HELPER FORMAT ---
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(price);

};

// --- MODAL XÓA (Giữ nguyên giao diện đẹp của bạn) ---
function DeleteConfirmModal({
  isOpen,
  productName,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;


  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'white', borderRadius: '16px', padding: '32px',
          maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideUp 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgb(229, 57, 53)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 8px 24px rgba(229, 57, 53, 0.4)' }}>
            <i className="ph ph-trash" style={{ fontSize: '32px', color: 'white' }}></i>
          </div>
        </div>
        <h5 style={{ textAlign: 'center', marginBottom: '12px', color: '#333', fontSize: '20px', fontWeight: '600' }}>Xác nhận xóa sản phẩm</h5>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '8px', fontSize: '15px', lineHeight: '1.5' }}>Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?</p>
        <p style={{ textAlign: 'center', color: 'rgb(229, 57, 53)', fontWeight: '600', marginBottom: '28px', fontSize: '15px', padding: '8px 16px', backgroundColor: 'rgba(229, 57, 53, 0.1)', borderRadius: '8px', wordBreak: 'break-word' }}>&quot;{productName}&quot;</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '14px 24px', borderRadius: '10px', border: '2px solid #E0E0E0', backgroundColor: 'white', color: '#666', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}>Hủy bỏ</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '14px 24px', borderRadius: '10px', border: 'none', background: 'rgb(229, 57, 53)', color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(229, 57, 53, 0.4)' }}>Xác nhận xóa</button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}

function CartPageContent() {
  const {
    items,
    loading,
    updatesoluong,
    removeItem,
    subtotal,
    totalItems,
    refreshCart,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
    discountAmount,
    total,
    savedAmount, // Sử dụng biến này thay cho việc tự tính
    gifts,
    totalGifts,
    availableVouchers
  } = useCart();

  const { data: homeData } = useHomeData();
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | string; name: string }>({
    isOpen: false, id: 0, name: '',
  });

  // --- LOGIC VOUCHER ---
  // Kết hợp voucher từ API giỏ hàng (ưu tiên) và trang chủ
  // API Giỏ hàng đã filter sẵn theo điều kiện tiền, nhưng ta vẫn giữ logic filter FE để hiển thị trạng thái "Chưa đủ ĐK"
  const cartCoupons = (availableVouchers && availableVouchers.length > 0) ? availableVouchers : [];
  const homeCoupons = ((homeData?.data as any)?.new_coupon) || [];

  // Nếu API giỏ hàng chưa trả về voucher (ví dụ chưa load xong), dùng tạm của home
  const displayCoupons = cartCoupons.length > 0 ? cartCoupons : homeCoupons;

  // Refetch khi mount để đảm bảo số liệu mới nhất

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);


  // --- DELETE HANDLERS ---
  const openDeleteModal = (id: number | string, productName: string) => {
    setDeleteModal({ isOpen: true, id, name: productName });
  };


  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, id: 0, name: '' });

  };

  const confirmDelete = () => {
    removeItem(deleteModal.id);
    setDeleteMessage(`Đã xóa "${deleteModal.name}" khỏi giỏ hàng.`);
    closeDeleteModal();
    setTimeout(() => setDeleteMessage(null), 3000);

  };

  // --- DEV: Import Helper (Updated for New Hook Structure) ---
  const importGuestFromFile = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      const res = await fetch('/giohang-noauth.json');
      if (!res.ok) throw new Error('File not found');
      const json = await res.json();
      const rawItems = Array.isArray(json?.data?.items) ? json.data.items : (Array.isArray(json) ? json : []);

      const mapped = rawItems.map((it: any, idx: number) => {
        // Map data từ file json mẫu sang cấu trúc LocalStorage
        const id_bienthe = it.bienthe?.id ?? it.id_bienthe ?? it.id;
        return {
          id_giohang: `local_${id_bienthe}`, // Format ID khớp với hook mới
          id_bienthe: Number(id_bienthe),
          soluong: Number(it.soluong ?? 1),
          product: {
            ten: it.bienthe?.sanpham?.ten || it.ten_sp || "SP Mẫu",
            mediaurl: it.bienthe?.sanpham?.hinhanhsanpham?.[0]?.hinhanh || "",
            gia: { current: it.bienthe?.giadagiam || 0 }
          }
        };
      });


      // 1. Lưu full object để hiển thị ngay (Optimistic)
      localStorage.setItem('marketpro_cart', JSON.stringify(mapped));

      // 2. [QUAN TRỌNG] Lưu payload rút gọn để Hook gửi lên API tính toán
      const payload = {
        cart_local: mapped.map((m: any) => ({ id_bienthe: m.id_bienthe, soluong: m.soluong }))

      };
      localStorage.setItem('marketpro_cart_payload', JSON.stringify(payload));

      refreshCart(); // Gọi hook load lại
      alert('Đã import sample cart. Reload trang nếu số liệu chưa khớp.');
    } catch (e: any) {
      console.error(e);
      alert('Lỗi import: ' + e.message);

    }
  }, [refreshCart]);


  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      <section className="py-20 cart mb-60">

        <div className="container container-lg">
          {/* Thông báo xóa */}
          {deleteMessage && (
            <div className="p-10 mb-20 border bg-success-200 border-success-600 text-success-900 fw-medium rounded-8" style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="gap-8 d-flex align-items-center">
                <i className="text-xl ph ph-check-circle text-success-600"></i> {deleteMessage}
              </div>
            </div>
          )}


          {/* Dev Button */}
          {/* <div className="mb-12">
            <button type="button" className="btn btn-sm btn-outline" onClick={importGuestFromFile} style={{ padding: '8px 12px' }}>
              Dev: Import Sample Data
            </button>
          </div> */}

          <div className="row gy-4">
            <div className="col-xl-9 col-lg-8">
              <div className="pb-0 border border-gray-100 cart-table rounded-8 p-30">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div
                    className="overflow-x-auto scroll-sm scroll-sm-horizontal"
                    style={{
                      maxHeight: items.length > 5 ? '750px' : 'none',
                      overflowY: items.length > 5 ? 'auto' : 'visible',
                      opacity: loading ? 0.5 : 1, // Hiệu ứng mờ khi đang sync
                      pointerEvents: loading ? 'none' : 'auto',
                      transition: 'opacity 0.2s',
                    }}

                  >
                    <table className="table style-three">
                      <thead>
                        <tr className="py-10 my-10 border-gray-500 border-bottom">
                          <th className="gap-24 p-0 pb-10 mb-0 text-lg h6 fw-bold flex-align" colSpan={2}>
                            <div>
                              <i className="text-lg ph-bold ph-shopping-cart text-main-600 pe-6"></i>
                              Giỏ hàng ( {totalItems} sản phẩm )
                            </div>
                          </th>
                          <th className="p-0 pb-10 mb-0 text-lg h6 fw-bold">Số lượng</th>
                          <th className="p-0 pb-10 mb-0 text-lg h6 fw-bold">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr><td colSpan={4} className="py-20 text-center">Giỏ hàng trống.</td></tr>
                        ) : (
                          items.map((item, idx) => {
                            // Hook đã map dữ liệu chuẩn, ta chỉ việc dùng
                            const product = item.product || {};
                            const currentPrice = Number(product.gia?.current || 0);
                            const originalPrice = Number(product.gia?.before_discount || 0);
                            const itemTotal = item.thanhtien ?? (currentPrice * item.soluong); // Ưu tiên thành tiền từ BE

                            const reactKey = `${String(item.id_giohang ?? `local_${item.id_bienthe}`)}_${idx}`;

                            return (
                              <tr key={reactKey}>
                                <td className="px-5 py-20">
                                  <div className="gap-12 d-flex align-items-center">
                                    <button
                                      type="button"
                                      className="gap-8 flex-align hover-text-danger-600 pe-10"
                                      onClick={() => openDeleteModal(item.id_giohang, product.ten || "Sản phẩm")}
                                    >
                                      <i className="text-2xl ph ph-trash d-flex"></i> Xóa
                                    </button>
                                    <Link href={`/san-pham/${product.slug}`} className="border border-gray-100 rounded-8 flex-center" style={{ width: '100px', height: '100px', flexShrink: 0 }}>
                                      <Image
                                        src={product.mediaurl || '/assets/images/thumbs/product-placeholder.png'}
                                        alt={product.ten || 'Product'}
                                        width={100} height={100}
                                        className="w-100 rounded-8"
                                        style={{ objectFit: 'contain' }}
                                      />
                                    </Link>
                                    <div className="table-product__content text-start">
                                      {product.thuonghieu && (
                                        <div className="gap-4 mb-5 flex-align">
                                          <span className="text-main-two-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                          <span className="text-xs text-gray-500">{product.thuonghieu}</span>
                                        </div>
                                      )}
                                      <h6 className="mb-0 text-lg title fw-semibold">
                                        <Link href={`/san-pham/${product.slug}`} className="link text-line-2" title={product.ten}>
                                          {product.ten}
                                        </Link>
                                      </h6>
                                      {product.loaibienthe && (
                                        <div className="px-8 py-4 mt-2 text-sm text-gray-500 bg-gray-50 d-inline-block rounded-4">
                                          Phân loại: {product.loaibienthe}
                                        </div>
                                      )}
                                      <div className="mt-6 product-card__price">
                                        {originalPrice > currentPrice && (
                                          <span className="text-sm text-gray-400 fw-semibold text-decoration-line-through me-8">
                                            {formatPrice(originalPrice)}
                                          </span>
                                        )}
                                        <span className="text-heading text-md fw-bold">{formatPrice(currentPrice)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-20">
                                  {/* Component Tăng Giảm đã có sẵn */}
                                  <QuantityControl
                                    quantity={item.soluong}
                                    stock={item.product?.tonkho ?? 30}
                                    onUpdate={(newQty) => updatesoluong(item.id_giohang, newQty)}
                                    // disabled={loading}
                                  />
                                </td>
                                <td className="px-5 py-20">
                                  <span className="mb-0 text-lg h6 fw-semibold text-main-600">{formatPrice(itemTotal)}</span>
                                  {loading && <div className="text-xs text-gray-400">Đang tính...</div>}
                                </td>
                              </tr>
                            );
                          })

                        )}
                      </tbody>
                    </table>

                  </div>
                </form>
              </div>

              {/* QUÀ TẶNG (Logic từ BE, FE chỉ render) */}
              {gifts && gifts.length > 0 && (
                <>
                  <div className="p-10 mt-20 font-semibold text-center text-yellow-800 border-2 border-yellow-500 border-dashed rounded-lg bg-yellow-50">
                    🎉 Chúc mừng! Bạn nhận được {totalGifts} quà tặng miễn phí.

                  </div>
                  <div className="pb-0 mt-20 border border-gray-100 cart-table rounded-8 p-30">
                    <table className="table style-three">
                      <thead>
                        <tr>
                          <th className="text-lg h6 fw-bold"><i className="ph-bold ph-gift text-main-600"></i> Danh sách quà tặng</th>
                          <th>Số lượng</th>
                          <th>Giá trị</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gifts.map((gift, idx) => (
                          <tr key={`gift-${idx}`}>
                            <td className="px-5 py-10">
                              <div className="gap-12 d-flex align-items-center">
                                <div style={{ width: '60px', height: '60px' }} className="p-1 border rounded-8">
                                  <img src={gift.hinhanh} alt="Gift" className="w-100 h-100 object-fit-contain" />
                                </div>
                                <div>
                                  <div className="text-sm fw-bold text-line-1" title={gift.ten_sanpham}>{gift.ten_sanpham}</div>
                                  <div className="text-xs text-gray-500">{gift.ten_loaibienthe}</div>
                                  <div className="text-xs text-main-two-600 fw-bold">QUÀ TẶNG 0đ</div>
                                </div>

                              </div>
                            </td>
                            <td className="px-5 py-10 text-center fw-bold">x{gift.soluong}</td>
                            <td className="px-5 py-10 text-main-600 fw-bold">Miễn phí</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                  </div>
                </>
              )}
            </div>

            <div className="col-xl-3 col-lg-4">
              <div className="mt-16">
                {/* VOUCHER SIDEBAR */}
                <div className="px-24 pb-20 border border-gray-100 cart-sidebar rounded-8 py-30">
                  <h6 className="gap-8 mb-20 text-lg flex-align">
                    <i className="text-xl ph-bold ph-ticket text-main-600"></i>Mã giảm giá
                  </h6>


                  {/* 1. Voucher Đã áp dụng */}
                  {appliedVoucher && (
                    <div className="gap-8 px-12 py-10 mt-10 border border-main-600 bg-main-50 flex-align flex-between rounded-4">
                      <div className="overflow-hidden text-sm d-flex flex-column">
                        <span className="text-main-600 fw-bold">Đang dùng: {appliedVoucher.code}</span>
                        <span className="text-xs text-gray-600 text-line-1">Giảm {formatPrice(Number(appliedVoucher.giatri))}</span>
                      </div>
                      <button onClick={removeVoucher} className="text-xs text-danger-600 fw-bold hover-text-danger-700">
                        Bỏ chọn
                      </button>

                    </div>

                  )}

                  {/* 2. Danh sách Voucher khả dụng */}
                  <div className="gap-10 mt-10 d-flex flex-column" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {displayCoupons.map((voucher: any) => {
                      // Filter cơ bản ở FE để hiển thị UI (ẩn voucher hết hạn)
                      if (!isVoucherInDateRange(voucher.ngaybatdau, voucher.ngayketthuc)) return null;
                      if (appliedVoucher && voucher.id === appliedVoucher.id) return null; // Ẩn cái đang chọn

                      const { type, minOrderValue } = parseVoucherCondition(voucher.dieukien, voucher.mota);
                      const isEligible = subtotal >= minOrderValue; // Logic check đơn giản

                      return (
                        <div key={voucher.id} className={`p-10 border border-dashed rounded-4 ${isEligible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 opacity-75'}`}>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex flex-column" style={{ flex: 1, overflow: 'hidden' }}>
                              <span className="text-sm text-gray-900 fw-bold">{voucher.magiamgia || voucher.code}</span>
                              <span className="text-xs text-gray-500">Giảm {formatPrice(Number(voucher.giatri))}</span>
                              {!isEligible && <span className="text-xs text-warning-600">Đơn từ {formatPrice(minOrderValue)}</span>}
                            </div>
                            <button
                              onClick={() => applyVoucher(voucher)}
                              disabled={!isEligible}
                              className={`btn btn-sm px-10 py-4 text-xs rounded-4 ${isEligible ? 'btn-main' : 'btn-gray text-gray-500'}`}
                            >
                              {isEligible ? 'Dùng' : 'Chưa đủ'}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {displayCoupons.length === 0 && !appliedVoucher && (
                      <div className="py-10 text-sm text-center text-gray-500">Chưa có mã giảm giá phù hợp.</div>
                    )}
                  </div>

                </div>

                {/* TỔNG TIỀN */}
                <div className="px-20 py-20 mt-20 border border-gray-100 cart-sidebar rounded-8">
                  <div className="mb-20">
                    <h6 className="gap-4 mb-6 text-lg flex-align"><i className="text-xl ph-bold ph-shopping-cart text-main-600"></i> Thông tin thanh toán</h6>
                  </div>

                  <div className="gap-8 mb-20 flex-between">
                    <span className="text-gray-900 font-heading-two">Tạm tính:</span>
                    <span className="text-gray-900 fw-semibold">{formatPrice(subtotal)}</span>
                  </div>



                  {discountAmount > 0 && (
                    <div className="gap-8 mb-20 flex-between">
                      <span className="text-gray-900 font-heading-two">Voucher giảm:</span>
                      <span className="text-success-600 fw-semibold">-{formatPrice(discountAmount)}</span>

                    </div>
                  )}


                  <div className="pt-24 my-20 border-gray-100 border-top">
                    <div className="gap-8 flex-between">
                      <span className="text-lg text-gray-900 fw-semibold">Tổng cộng:</span>
                      <span className="text-xl text-main-600 fw-bold">{formatPrice(total)}</span>

                    </div>
                    {savedAmount > 0 && (
                      <div className="gap-8 mt-6 text-end">
                        <span className="text-sm text-success-600 fst-italic">
                          (Bạn đã tiết kiệm được {formatPrice(savedAmount)})
                        </span>
                      </div>
                    )}

                  </div>

                  <Link
                    href="/thanh-toan"
                    className={`btn btn-main py-14 w-100 rounded-8 ${items.length === 0 || loading ? 'disabled opacity-50' : ''}`}
                    style={{ pointerEvents: (items.length === 0 || loading) ? 'none' : 'auto' }}
                  >
                    {loading ? 'Đang tính toán...' : 'Tiến hành thanh toán'}
                  </Link>
                </div>

                <span className="mt-20 text-center w-100 d-block">
                  <Link href="/shop" className="text-sm text-main-600 fw-medium">
                    <i className="ph-bold ph-arrow-left pe-4"></i> Tiếp tục mua sắm
                  </Link>
                </span>

              </div>
            </div>
          </div>
        </div>
      </section>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        productName={deleteModal.name}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />
    </>
  );
}

export default function CartPage() {
  return (
    <HomeDataProvider>
      <CartPageContent />
    </HomeDataProvider>

  );
}