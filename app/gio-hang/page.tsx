"use client";
import Link from 'next/link';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useCart, VoucherConditionType, Gia } from '@/hooks/useCart';
import Image from 'next/image';
import FullHeader from '@/components/FullHeader';
import { type Coupon as ApiCoupon } from '@/lib/api';

// --- HELPER FUNCTIONS ---
type PriceInput = number | Gia | undefined | null;

// Thêm type mô tả coupon trả về từ API (đơn giản, đủ trường đang dùng)
type HomeCoupon = {
  id: number;
  magiamgia?: number | string;
  dieukien?: string;
  mota?: string;
  giatri?: number;
  ngaybatdau?: string;
  ngayketthuc?: string;
  trangthai?: string;
};

// Helper format giá tiền
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(price);
};

const getPrice = (gia: PriceInput): number => {
  if (typeof gia === 'number') return gia;
  return Number((gia as any)?.current ?? 0);
};

const getOriginPrice = (gia: PriceInput): number => {
  if (typeof gia === 'object' && gia !== null) {
    return Number((gia as any).before_discount ?? 0);
  }
  return 0;
};

// Helper format ngày
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Helper lấy label điều kiện voucher
const getConditionLabel = (conditionType: VoucherConditionType, minOrderValue: number): string => {
  switch (conditionType) {
    case 'tatca':
      return 'Áp dụng tất cả đơn hàng';
    case 'don_toi_thieu':
      return `Đơn tối thiểu ${minOrderValue.toLocaleString('vi-VN')}đ`;
    case 'khachhang_moi':
      return 'Dành cho khách hàng mới';
    case 'khachhang_than_thiet':
      return 'Dành cho khách hàng thân thiết';
    case 'freeship':
      return minOrderValue > 0 ? `Freeship cho đơn từ ${minOrderValue.toLocaleString('vi-VN')}đ` : 'Miễn phí vận chuyển';
    default:
      return '';
  }
};

// Component QuantityControl với optimistic update và debounce
function QuantityControl({
  quantity,
  onUpdate,
}: {
  quantity: number;
  onUpdate: (qty: number) => void;
}) {
  const [localQty, setLocalQty] = useState(quantity);
  const debounceRef = useRef<any | null>(null);

  // Sync local state khi prop thay đổi từ bên ngoài
  useEffect(() => {
    setLocalQty(quantity);
  }, [quantity]);

  const handleQuantityChange = useCallback(
    (newQty: number) => {
      // Không cho giảm xuống dưới 1
      if (newQty < 1) {
        return;
      }

      // Cập nhật UI ngay lập tức
      setLocalQty(newQty);

      // Debounce API call
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        onUpdate(newQty);
      }, 300);
    },
    [onUpdate]
  );

  // Cleanup timeout khi unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="overflow-hidden d-flex rounded-4" style={{ transition: 'all 0.2s ease' }}>
      <button
        type="button"
        title="Giảm số lượng"
        aria-label="Giảm số lượng"
        className={`quantity__minus border border-end border-gray-100 flex-shrink-0 h-48 w-48 flex-center hover-bg-main-600 hover-text-white ${localQty <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-neutral-600'}`}
        onClick={() => handleQuantityChange(localQty - 1)}
        disabled={localQty <= 1}
      >
        <i className="ph ph-minus"></i>
      </button>
      <input
        type="number"
        className="w-32 px-4 text-center border border-gray-100 quantity__input flex-grow-1 border-start-0 border-end-0"
        value={localQty}
        min={1}
        aria-label="Số lượng sản phẩm"
        title="Số lượng"
        onChange={(e) => handleQuantityChange(parseInt(e.target.value || '1', 10) || 1)}
      />
      <button
        type="button"
        title="Tăng số lượng"
        aria-label="Tăng số lượng"
        className="flex-shrink-0 w-48 h-48 border border-gray-100 quantity__plus border-end text-neutral-600 flex-center hover-bg-main-600 hover-text-white"
        onClick={() => handleQuantityChange(localQty + 1)}
      >
        <i className="ph ph-plus"></i>
      </button>
    </div>
  );
}

// Component Modal xác nhận xóa
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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '420px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideUp 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'rgb(229, 57, 53)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 8px 24px rgba(229, 57, 53, 0.4)',
            }}
          >
            <i className="ph ph-trash" style={{ fontSize: '32px', color: 'white' }}></i>
          </div>
        </div>

        {/* Title */}
        <h5
          style={{
            textAlign: 'center',
            marginBottom: '12px',
            color: '#333',
            fontSize: '20px',
            fontWeight: '600',
          }}
        >
          Xác nhận xóa sản phẩm
        </h5>

        {/* Message */}
        <p
          style={{
            textAlign: 'center',
            color: '#666',
            marginBottom: '8px',
            fontSize: '15px',
            lineHeight: '1.5',
          }}
        >
          Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?
        </p>

        {/* Product name */}
        <p
          style={{
            textAlign: 'center',
            color: 'rgb(229, 57, 53)',
            fontWeight: '600',
            marginBottom: '28px',
            fontSize: '15px',
            padding: '8px 16px',
            backgroundColor: 'rgba(229, 57, 53, 0.1)',
            borderRadius: '8px',
            wordBreak: 'break-word',
          }}
        >
          &quot;{productName}&quot;
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '14px 24px',
              borderRadius: '10px',
              border: '2px solid #E0E0E0',
              backgroundColor: 'white',
              color: '#666',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F5F5';
              e.currentTarget.style.borderColor = '#BDBDBD';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#E0E0E0';
            }}
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '14px 24px',
              borderRadius: '10px',
              border: 'none',
              background: 'rgb(229, 57, 53)',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(229, 57, 53, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(229, 57, 53, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(229, 57, 53, 0.4)';
            }}
          >
            Xác nhận xóa
          </button>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
    </div>
  );
}

function CartPageContent() {
  const { items, loading, updatesoluong, removeItem, subtotal, totalItems, refreshCart, appliedVoucher, applyVoucher, removeVoucher, discountAmount, total, gifts, totalGifts, availableVouchers } = useCart();
<<<<<<< Updated upstream
  const { data: homeData } = useHomeData();
=======
>>>>>>> Stashed changes
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | string; name: string }>({
    isOpen: false,
    id: 0,
    name: '',
  });

  // fallback home coupons (an toàn)
  const couponsFromHome: HomeCoupon[] = ((homeData?.data as { new_coupon?: HomeCoupon[] } | undefined)?.new_coupon) ?? [];

  // Nếu hook useCart trả về vouchers thì ưu tiên dùng nó (map về shape HomeCoupon)
  const coupons: HomeCoupon[] = (availableVouchers && availableVouchers.length > 0)
    ? (availableVouchers as any[]).map((v) => ({
        id: (v?.id ?? 0) as number,
        magiamgia: v?.magiamgia ?? v?.code,
        dieukien: v?.dieukien,
        mota: v?.mota,
        giatri: Number(v?.giatri ?? v?.giatri ?? 0),
        ngaybatdau: v?.ngaybatdau,
        ngayketthuc: v?.ngayketthuc,
        trangthai: v?.trangthai ?? 'Hoạt động',
      }))
    : couponsFromHome;


  // Tính giảm giá từ giá gốc sản phẩm
  const productDiscount = items.reduce((sum, item) => {
    const currentPrice = Number(item.product?.gia?.current ?? 0);
    const beforePrice = Number(item.product?.gia?.before_discount ?? 0);
    if (beforePrice > currentPrice) {
      return sum + (beforePrice - currentPrice) * item.soluong;
    }
    return sum;
  }, 0);

  // Refetch khi mount
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Mở modal xác nhận xóa
  const openDeleteModal = (id: number | string, productName: string) => {
    setDeleteModal({ isOpen: true, id, name: productName });
  };

  // Đóng modal
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, id: 0, name: '' });
  };

  // Xác nhận xóa sản phẩm
  const confirmDelete = () => {
    removeItem(deleteModal.id);
    setDeleteMessage(`Đã xóa "${deleteModal.name}" khỏi giỏ hàng.`);
    closeDeleteModal();

    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
      setDeleteMessage(null);
    }, 3000);
  };

  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      <section className="py-20 cart">
        <div className="container container-lg">
          {/* Thông báo xóa sản phẩm */}
          {deleteMessage && (
            <div
              className="p-10 mb-20 border bg-success-200 border-success-600 text-success-900 fw-medium rounded-8"
              style={{
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <div className="gap-8 d-flex align-items-center">
                <i className="text-xl ph ph-check-circle text-success-600"></i>
                {deleteMessage}
              </div>
            </div>
          )}
          <div className="row gy-4">
            <div className="col-xl-9 col-lg-8">
              <div className="pb-0 border border-gray-100 cart-table rounded-8 p-30" aria-busy={loading}>
                <form>
                  <div
                    className="overflow-x-auto scroll-sm scroll-sm-horizontal"
                    style={{
                      maxHeight: items.length > 5 ? '750px' : 'none',
                      overflowY: items.length > 5 ? 'auto' : 'visible',
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
                        {loading ? (
                          <tr>
                            <td colSpan={4} className="py-20 text-center">
                              <div className="spinner-border text-main-600" role="status">
                                <span className="visually-hidden">Đang tải...</span>
                              </div>
                            </td>
                          </tr>
                        ) : items.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-20 text-center">
                              Giỏ hàng không có sản phẩm nào.
                            </td>
                          </tr>
                        ) : (
                          items.map((item) => {
                            const productName = item.product?.ten || `Sản phẩm #${item.id_giohang}`;
                            const productImage = item.product?.mediaurl || '/assets/images/thumbs/product-placeholder.png';
                            const productPrice = Number(item.product?.gia?.current) || 0;
                            const originalPrice = Number(item.product?.gia?.before_discount) || 0;
                            const discountPercent = item.product?.gia?.discount_percent || 0;
                            const itemTotal = productPrice * item.soluong;
                            const brandName = item.product?.thuonghieu || '';
                            const variantName = item.product?.loaibienthe || '';
                            const productSlug = item.product?.slug || '';

                            return (
                              <tr key={item.id_giohang}>
                                <td className="px-5 py-20">
                                  <div className="gap-12 d-flex align-items-center">
                                    <button
                                      type="button"
                                      className="gap-8 flex-align hover-text-danger-600 pe-10"
                                      onClick={() => openDeleteModal(item.id_giohang, productName)}
                                    >
                                      <i className="text-2xl ph ph-trash d-flex"></i> Xóa
                                    </button>
                                    <Link href={`/san-pham/${productSlug}`} className="border border-gray-100 rounded-8 flex-center" style={{ maxWidth: '120px', maxHeight: '120px', width: '100%', height: '100%' }}>
                                      <Image
                                        src={productImage}
                                        alt={productName}
                                        width={120}
                                        height={120}
                                        className="w-100 rounded-8"
                                        style={{ objectFit: 'cover' }}
                                      />
                                    </Link>
                                    <div className="table-product__content text-start">
                                      {/* Thương hiệu */}
                                      {brandName && (
                                        <div className="gap-16 flex-align">
                                          <div className="gap-4 mb-5 flex-align">
                                            <span className="text-main-two-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                            <span className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '250px', display: 'inline-block' }} title={brandName}>{brandName}</span>
                                          </div>
                                        </div>
                                      )}
                                      {/* Tên sản phẩm */}
                                      <h6 className="mb-0 text-lg title fw-semibold">
                                        <Link href={`/san-pham/${productSlug}`} className="link text-line-2" title={productName} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '350px', display: 'inline-block' }}>
                                          {productName}
                                        </Link>
                                      </h6>
                                      {/* Loại biến thể */}
                                      {variantName && (
                                        <div className="gap-16 mb-6 flex-align">
                                          <Link href={`/san-pham/${productSlug}`} className="gap-8 px-8 py-6 text-sm btn bg-gray-50 text-heading rounded-8 flex-center fw-medium">
                                            {variantName}
                                          </Link>
                                        </div>
                                      )}
                                      {/* Giá */}
                                      <div className="mb-6 product-card__price">
                                        {discountPercent > 0 && originalPrice > productPrice && (
                                          <div className="gap-4 text-sm flex-align text-main-two-600">
                                            <i className="text-sm ph-fill ph-seal-percent"></i> -{discountPercent}%
                                            <span className="text-xs text-gray-400 fw-semibold text-decoration-line-through">{formatPrice(originalPrice)}</span>
                                          </div>
                                        )}
                                        <span className="text-heading text-md fw-bold">{formatPrice(productPrice)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-20">
                                  <QuantityControl
                                    quantity={item.soluong}
                                    onUpdate={(qty) => updatesoluong(item.id_giohang, qty)}
                                  />
                                </td>
                                <td className="px-5 py-20">
                                  <span className="mb-0 text-lg h6 fw-semibold text-main-600">{formatPrice(itemTotal)}</span>
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

              {/* Quà tặng từ API (chỉ hiển thị khi có sản phẩm thường trong giỏ) */}
              {gifts && gifts.length > 0 && items.length > 0 && (
                <>
                  {/* Banner thông báo quà tặng */}
                  <div className="p-10 mt-20 font-semibold text-center text-yellow-800 border-2 border-yellow-500 border-dashed rounded-lg bg-yellow-50">
                    🎉 Bạn nhận được thêm {totalGifts} sản phẩm Quà Tặng miễn phí trong đơn hàng này!
                  </div>

                  {/* Bảng quà tặng */}
                  <div className="pb-0 mt-20 border border-gray-100 cart-table rounded-8 p-30">
                    <div className="overflow-x-auto scroll-sm scroll-sm-horizontal">
                      <table className="table style-three">
                        <thead>
                          <tr className="py-10 my-10 border-gray-500 border-bottom">
                            <th className="gap-6 p-0 pb-10 mb-0 text-lg h6 fw-bold flex-align" colSpan={2}>
                              <i className="text-lg ph-bold ph-gift text-main-600"></i> Quà tặng nhận được ({totalGifts} sản phẩm)
                            </th>
                            <th className="px-60"></th>
                            <th className="px-60"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {gifts.map((gift, index) => (
                            <tr key={String(gift.id_bienthe ?? index)}>
                              <td className="px-5 py-20">
                                <div className="gap-12 d-flex align-items-center">
                                  <Link
                                    href={gift.slug ? `/san-pham/${gift.slug}` : '#'}
                                    className="border border-gray-100 rounded-8 flex-center"
                                    style={{ maxWidth: '100px', maxHeight: '100px', width: '100%', height: '100%' }}
                                  >
                                    <img
                                      src={gift.hinhanh || '/assets/images/thumbs/product-placeholder.png'}
                                      alt={gift.ten_sanpham || 'Quà tặng'}
                                      className="w-100 rounded-8"
                                    />
                                  </Link>
                                  <div className="table-product__content text-start">
                                    <div className="gap-16 flex-align">
                                      <div className="gap-4 mb-5 flex-align">
                                        <span className="text-sm text-main-two-600 d-flex"><i className="ph-fill ph-storefront"></i></span>
                                        <span className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '250px', display: 'inline-block' }}>
                                          {gift.thuonghieu || 'Thương hiệu'}
                                        </span>
                                      </div>
                                    </div>
                                    <h6 className="mb-0 title text-md fw-semibold">
                                      <Link
                                        href={gift.slug ? `/san-pham/${gift.slug}` : '#'}
                                        className="link text-line-2 fw-medium"
                                        title={gift.ten_sanpham}
                                        style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '350px', display: 'inline-block' }}
                                      >
                                        {gift.ten_sanpham || 'Quà tặng'}
                                      </Link>
                                    </h6>
                                    {gift.ten_loaibienthe && (
                                      <div className="gap-16 mb-6 flex-align">
                                        <span className="gap-8 px-6 py-6 text-xs btn bg-gray-50 text-heading rounded-8 flex-center fw-medium">
                                          {gift.ten_loaibienthe}
                                        </span>
                                      </div>
                                    )}
                                    <div className="mb-6 product-card__price">
                                      <div className="gap-4 text-xs flex-align text-main-two-600">
                                        {gift.giagoc && gift.giagoc > 0 && (
                                          <span className="text-sm text-gray-400 fw-semibold text-decoration-line-through me-4">
                                            {formatPrice(gift.giagoc)}
                                          </span>
                                        )}
                                        <span className="gap-4 text-xs flex-align text-main-two-600">
                                          <i className="text-sm ph-fill ph-seal-percent"></i> Quà tặng miễn phí
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-20">
                                <div className="overflow-hidden d-flex rounded-4">
                                  <input
                                    type="text"
                                    className="w-32 px-4 py-8 text-center bg-gray-100 border quantity__input flex-grow-1 border-start-0 border-end-0"
                                    value={`x ${gift.soluong}`}
                                    readOnly
                                  />
                                </div>
                              </td>
                              <td className="px-5 py-20">
                                <span className="mb-0 text-lg h6 fw-semibold text-main-600">0 đ</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="col-xl-3 col-lg-4">
              <div className="mt-16">
                <div className="cart-sidebar border border-gray-100 rounded-8 px-24 py-30 pb-20">
                  <h6 className="text-lg mb-20 flex-align gap-8">
                    <i className="ph-bold ph-ticket text-main-600 text-xl"></i>Áp dụng Voucher
                  </h6>

            {/* Applied voucher (shows when a voucher has been applied, allows cancel) */}
            {appliedVoucher && (
              <div className="flex-align flex-between gap-8 mt-10 border-dashed border-gray-200 py-10 px-12 rounded-4">
                <span className="flex-align gap-8 text-sm fw-medium text-gray-900 pe-10">
                  <i className="ph-bold ph-ticket text-main-two-600 text-2xl"></i>
                  <div className="text-sm d-flex flex-column">
                    <span className="text-sm text-gray-900 w-100">
                      {appliedVoucher.giatri ? `Giảm ${formatPrice(Number(appliedVoucher.giatri))}` : ''}
                    </span>
                    <span className="text-xs text-gray-500 w-100">
                      {String(appliedVoucher.code ?? appliedVoucher.magiamgia ?? '')}
                    </span>
                  </div>
<<<<<<< Updated upstream
                </span>
                <span className="flex-align gap-8 text-xs fw-medium text-gray-900">
                  <button
                    type="button"
                    onClick={() =>  removeVoucher()}
                    className="btn border-danger-600 text-danger-600 hover-bg-danger-600 hover-text-white hover-border-danger-600 p-6 rounded-4 text-xs"
                  >
                    Hủy
                  </button>
                </span>
=======
                )}

                {/* Danh sách voucher khả dụng - từ API đã lọc theo điều kiện giỏ hàng */}
                <div className="mt-16">
                  {availableVouchers
                    .filter(voucher => {
                      // Bỏ qua voucher đã áp dụng
                      if (appliedVoucher && voucher.id === appliedVoucher.id) return false;
                      return true;
                    })
                    .map((voucher) => {
                      const conditionLabel = getConditionLabel(voucher.condition_type || 'don_toi_thieu', voucher.min_order_value || 0);

                      return (
                        <div key={voucher.id} className="gap-8 px-12 py-10 mt-10 border-dashed flex-align flex-between rounded-4 border-gray-200">
                          <span className="gap-8 text-sm text-gray-900 flex-align fw-medium" style={{ flex: '1', minWidth: 0 }}>
                            <i className="text-2xl ph-bold ph-ticket text-main-600" style={{ flexShrink: 0 }}></i>
                            <div className="text-sm d-flex flex-column" style={{ flex: '1', minWidth: 0 }}>
                              <span className="text-sm text-gray-900" style={{ wordBreak: 'break-word' }}>
                                {voucher.mota}
                              </span>
                              <span className="text-xs text-gray-500">
                                Mã: {voucher.code}
                              </span>
                              {conditionLabel && (
                                <span className="text-xs text-success-600">
                                  {conditionLabel}
                                </span>
                              )}
                              {voucher.ngayketthuc && (
                                <span className="text-xs text-gray-400">
                                  HSD: {formatDate(voucher.ngayketthuc)}
                                </span>
                              )}
                            </div>
                          </span>
                          <button
                            onClick={() => {
                              applyVoucher(voucher);
                            }}
                            className="text-xs btn rounded-4 text-white bg-main-600 hover-bg-main-100 hover-text-main-600"
                          >
                            Chọn
                          </button>
                        </div>
                      )
                    })}

                  {/* Hiển thị thông báo khi không có voucher nào */}
                  {availableVouchers.filter(v => !appliedVoucher || v.id !== appliedVoucher.id).length === 0 && !appliedVoucher && (
                    <div className="gap-8 px-12 py-10 mt-10 flex-align flex-center rounded-4">
                      <span className="gap-8 text-sm text-gray-900 flex-align fw-medium pe-10">
                        <div className="text-sm d-flex flex-column">
                          <span className="text-sm text-gray-900 w-100">Chưa có voucher nào phù hợp !</span>
                          <span className="text-xs text-gray-500">Thêm sản phẩm để mở khóa voucher</span>
                        </div>
                      </span>
                    </div>
                  )}
                </div>
>>>>>>> Stashed changes
              </div>
            )}

            {/* Vouchers list (existing logic preserved) */}
            {coupons
              .filter((voucher: HomeCoupon) => {
                if (!voucher) return false;
                if (voucher.trangthai !== 'Hoạt động') return false;
                if (appliedVoucher && voucher.id === appliedVoucher.id) return false;
                if (!isVoucherInDateRange(voucher.ngaybatdau, voucher.ngayketthuc)) return false;

                const { type, minOrderValue } = parseVoucherCondition(voucher.dieukien, voucher.mota);

                switch (type) {
                  case 'tatca':
                    return true;
                  case 'don_toi_thieu':
                  case 'freeship':
                    return subtotal >= minOrderValue;
                  case 'khachhang_moi':
                  case 'khachhang_than_thiet':
                    return items.length > 0;
                  default:
                    return true;
                }
              })
              .map((voucher: HomeCoupon) => {
                const { type, minOrderValue } = parseVoucherCondition(voucher.dieukien, voucher.mota);
                const isEligible =
                  type === 'tatca' ||
                  type === 'khachhang_moi' ||
                  type === 'khachhang_than_thiet' ||
                  subtotal >= minOrderValue;

                return (
                  <div key={voucher.id} className={`gap-8 px-12 py-10 mt-10 border-dashed flex-align flex-between rounded-4 ${isEligible ? 'border-gray-200' : 'border-warning-300 bg-warning-50'}`}>
                    <span className="gap-8 text-sm text-gray-900 flex-align fw-medium" style={{ flex: '1', minWidth: 0 }}>
                      <i className="text-2xl ph-bold ph-ticket text-main-600" style={{ flexShrink: 0 }}></i>
                      <div className="text-sm d-flex flex-column" style={{ flex: '1', minWidth: 0 }}>
                        <span className="text-sm text-gray-900 w-100">{voucher.giatri ? `Giảm ${formatPrice(Number(voucher.giatri))}` : ''}</span>
                        <span className="text-xs text-gray-500 w-100">{String(voucher.magiamgia ?? '')}</span>
                      </div>
                    </span>

                    <button
                      onClick={() => {
                        if (!isEligible) {
                          alert(`Đơn hàng chưa đạt giá trị tối thiểu ${minOrderValue.toLocaleString('vi-VN')}đ`);
                          return;
                        }
                        applyVoucher({
                          id: voucher.id,
                          code: String(voucher.magiamgia),
                          giatri: Number(voucher.giatri ?? 0),
                          mota: voucher.mota,
                          min_order_value: minOrderValue,
                          dieukien: voucher.dieukien,
                          condition_type: type,
                          ngaybatdau: voucher.ngaybatdau,
                          ngayketthuc: voucher.ngayketthuc
                        });
                      }}
                      disabled={!isEligible}
                      className={`text-xs btn rounded-4 ${isEligible ? 'text-white bg-main-600 hover-bg-main-100 hover-text-main-600' : 'text-gray-500 bg-gray-200 cursor-not-allowed'}`}
                    >
                      {isEligible ? 'Chọn' : 'Chưa đủ ĐK'}
                    </button>
                  </div>
                );
              })}

            {/* Fallback "no vouchers" block (matches your sample) */}
            {coupons.filter((v) => {
              if (!v) return false;
              if (v.trangthai !== 'Hoạt động') return false;
              if (appliedVoucher && v.id === appliedVoucher.id) return false;
              if (!isVoucherInDateRange(v.ngaybatdau, v.ngayketthuc)) return false;
              const { type, minOrderValue } = parseVoucherCondition(v.dieukien, v.mota);
              switch (type) {
                case 'tatca':
                  return true;
                case 'don_toi_thieu':
                case 'freeship':
                  return subtotal >= minOrderValue;
                case 'khachhang_moi':
                case 'khachhang_than_thiet':
                  return items.length > 0;
                default:
                  return true;
              }
            }).length === 0 && !appliedVoucher && (
              <div className="flex-align flex-center gap-8 mt-10 py-10 px-12 rounded-4">
                <span className="flex-align gap-8 text-sm fw-medium text-gray-900 pe-10">
                  <div className="text-sm d-flex flex-column">
                    <span className="text-sm text-gray-900 w-100">Chưa có voucher nào phù hợp !</span>
                  </div>
                </span>
              </div>
            )}
            </div>
              <div className="px-20 py-20 mt-20 border border-gray-100 cart-sidebar rounded-8">
                <div className="mb-20">
                  <h6 className="gap-4 mb-6 text-lg flex-align"><i className="text-xl ph-bold ph-shopping-cart text-main-600"></i> Thông tin giỏ hàng</h6>
                  <span className="gap-1 text-sm text-gray-600 flex-align fw-medium">
                    {totalItems} sản phẩm
                  </span>
                </div>
                <div className="gap-8 mb-20 flex-between">
                  <span className="text-gray-900 font-heading-two">Tạm tính:</span>
                  <span className="text-gray-900 fw-semibold">{formatPrice(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="gap-8 flex-between">
                    <span className="text-gray-900 font-heading-two">Giảm giá Voucher:</span>
                    <span className="text-success-600 fw-semibold">-{formatPrice(Number(discountAmount ?? 0))}</span>
                  </div>
                )}

                <div className="pt-24 my-20 border-gray-100 border-top">
                  <div className="gap-8 flex-between">
                    <span className="text-lg text-gray-900 fw-semibold">Tổng giá trị:</span>
                    <span className="text-lg text-main-600 fw-semibold">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <div className="gap-8 mt-6 text-end">
                    <span className="text-sm text-success-600 fw-normal">Tiết kiệm:</span>
                    <span className="text-sm text-success-600 fw-normal ms-2">{formatPrice(productDiscount + (discountAmount ?? 0))}</span>
                  </div>
                </div>
                <Link
                  href="/thanh-toan"
                  className={`btn btn-main py-14 w-100 rounded-8 ${items.length === 0 ? 'disabled opacity-50' : ''}`}
                  style={{
                    pointerEvents: items.length === 0 ? 'none' : 'auto',
                  }}
                >
                  Tiến hành thanh toán
                </Link>
              </div>
              <span className="mt-20 w-100 d-block">
                <Link href="/shop" className="text-sm text-main-600 fw-medium flex-align d-flex flex-center">
                  <i className="ph-bold ph-arrow-fat-lines-left text-main-600 text-md pe-10"></i> <span>Tiếp tục mua hàng</span>
                </Link>
              </span>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Modal xác nhận xóa */}
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
  return <CartPageContent />;
}
