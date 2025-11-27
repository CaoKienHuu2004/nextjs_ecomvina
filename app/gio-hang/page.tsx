"use client";
import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useCart } from '@/hooks/useCart';
import { useHomeData, HomeDataProvider } from '@/hooks/useHomeData';
import Image from 'next/image';
import FullHeader from '@/components/FullHeader';

// Helper format giá tiền
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(price);
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
  const [isUpdating, setIsUpdating] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state khi prop thay đổi từ bên ngoài
  useEffect(() => {
    setLocalQty(quantity);
  }, [quantity]);

  const handleQuantityChange = useCallback((newQty: number) => {
    // Không cho giảm xuống dưới 1
    if (newQty < 1) {
      return;
    }

    // Cập nhật UI ngay lập tức
    setLocalQty(newQty);
    setIsUpdating(true);

    // Debounce API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onUpdate(newQty);
      setIsUpdating(false);
    }, 300);
  }, [onUpdate]);

  // Cleanup timeout khi unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="d-flex rounded-4 overflow-hidden" style={{ transition: 'all 0.2s ease' }}>
      <button
        type="button"
        className={`quantity__minus border border-end border-gray-100 flex-shrink-0 h-48 w-48 flex-center hover-bg-main-600 hover-text-white ${localQty <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-neutral-600'}`}
        onClick={() => handleQuantityChange(localQty - 1)}
        disabled={localQty <= 1}
        style={{
          transition: 'all 0.15s ease',
          transform: 'scale(1)',
          opacity: localQty <= 1 ? 0.5 : 1,
        }}
        onMouseDown={(e) => localQty > 1 && (e.currentTarget.style.transform = 'scale(0.95)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <i className="ph ph-minus"></i>
      </button>
      <input
        type="number"
        className="quantity__input flex-grow-1 border border-gray-100 border-start-0 border-end-0 text-center w-32 px-4"
        value={localQty}
        min="1"
        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
        style={{
          transition: 'all 0.2s ease',
          backgroundColor: isUpdating ? '#f8f9fa' : 'white',
        }}
      />
      <button
        type="button"
        className="quantity__plus border border-end border-gray-100 flex-shrink-0 h-48 w-48 text-neutral-600 flex-center hover-bg-main-600 hover-text-white"
        onClick={() => handleQuantityChange(localQty + 1)}
        style={{
          transition: 'all 0.15s ease',
          transform: 'scale(1)',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
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
  const { items, loading, updateQuantity, removeItem, subtotal, totalItems, refreshCart, appliedVoucher, applyVoucher, removeVoucher, discountAmount, total } = useCart();
  const { data: homeData } = useHomeData();
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | string; name: string }>({
    isOpen: false,
    id: 0,
    name: '',
  });

  // Tính giảm giá từ giá gốc sản phẩm
  const productDiscount = items.reduce((sum, item) => {
    const currentPrice = Number(item.product?.gia?.current ?? 0);
    const beforePrice = Number(item.product?.gia?.before_discount ?? 0);
    if (beforePrice > currentPrice) {
      return sum + (beforePrice - currentPrice) * item.quantity;
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

      <section className="cart py-20 mb-60">
        <div className="container container-lg">
          {/* Thông báo xóa sản phẩm */}
          {deleteMessage && (
            <div
              className="bg-success-200 border border-success-600 text-success-900 fw-medium mb-20 p-10 rounded-8"
              style={{
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <div className="d-flex align-items-center gap-8">
                <i className="ph ph-check-circle text-success-600 text-xl"></i>
                {deleteMessage}
              </div>
            </div>
          )}
          <div className="row gy-4">
            <div className="col-xl-9 col-lg-8">
              <div className="cart-table border border-gray-100 rounded-8 p-30 pb-0">
                <div className="overflow-x-auto scroll-sm scroll-sm-horizontal">
                  <table className="table style-three">
                    <thead>
                      <tr className="border-bottom border-gray-500 my-10 py-10">
                        <th className="h6 mb-0 p-0 pb-10 text-lg fw-bold flex-align gap-24" colSpan={2}>
                          <div>
                            <i className="ph-bold ph-shopping-cart text-main-600 text-lg pe-6"></i>
                            Giỏ hàng ( {totalItems} sản phẩm )
                          </div>
                        </th>
                        <th className="h6 mb-0 p-0 pb-10 text-lg fw-bold">Số lượng</th>
                        <th className="h6 mb-0 p-0 pb-10 text-lg fw-bold">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="text-center py-40">
                            <div className="spinner-border text-main-600" role="status">
                              <span className="visually-hidden">Đang tải...</span>
                            </div>
                          </td>
                        </tr>
                      ) : items.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-40">
                            <div className="text-gray-500">
                              <i className="ph ph-shopping-cart text-6xl mb-16 d-block"></i>
                              <p className="mb-16">Giỏ hàng của bạn đang trống</p>
                              <Link href="/" className="btn btn-main rounded-8">
                                Tiếp tục mua sắm
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        items.map((item) => {
                          const productName = item.product?.ten || `Sản phẩm #${item.id_giohang}`;
                          const productImage = item.product?.mediaurl || '/assets/images/thumbs/product-placeholder.png';
                          const productPrice = Number(item.product?.gia?.current) || 0;
                          const itemTotal = productPrice * item.quantity;

                          return (
                            <tr key={item.id_giohang}>
                              <td className="py-20 px-5">
                                <div className="d-flex align-items-center gap-12">
                                  <button
                                    type="button"
                                    className="flex-align gap-8 hover-text-danger-600 pe-10"
                                    onClick={() => openDeleteModal(item.id_giohang, productName)}
                                  >
                                    <i className="ph ph-trash text-2xl d-flex"></i> Xóa
                                  </button>
                                  <div className="border border-gray-100 rounded-8 flex-center" style={{ maxWidth: '120px', maxHeight: '120px', width: '100%', height: '100%' }}>
                                    <Image
                                      src={productImage}
                                      alt={productName}
                                      width={120}
                                      height={120}
                                      className="w-100 rounded-8"
                                      style={{ objectFit: 'cover' }}
                                    />
                                  </div>
                                  <div className="table-product__content text-start">
                                    <h6 className="title text-lg fw-semibold mb-0">
                                      <span className="link text-line-2" title={productName} style={{ maxWidth: '350px', display: 'inline-block' }}>
                                        {productName}
                                      </span>
                                    </h6>
                                    <div className="product-card__price mb-6 mt-8">
                                      <span className="text-heading text-md fw-bold">{formatPrice(productPrice)}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-20 px-5">
                                <QuantityControl
                                  quantity={item.quantity}
                                  onUpdate={(qty) => updateQuantity(item.id_giohang, qty)}
                                />
                              </td>
                              <td className="py-20 px-5">
                                <span className="text-lg h6 mb-0 fw-semibold text-main-600">{formatPrice(itemTotal)}</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4">
              <div className="cart-sidebar border border-gray-100 rounded-8 px-24 py-30 pb-20">
                <h6 className="text-lg mb-20 flex-align gap-8"><i className="ph-bold ph-ticket text-main-600 text-xl"></i>Áp dụng Voucher</h6>

                {/* Hiển thị voucher đã áp dụng */}
                {appliedVoucher && (
                  <div className="flex-align flex-between gap-8 mt-10 border border-success-200 bg-success-50 py-10 px-12 rounded-4 mb-16">
                    <span className="flex-align gap-8 text-sm fw-medium text-success-700 pe-10">
                      <i className="ph-bold ph-check-circle text-success-600 text-2xl"></i>
                      <div className="text-sm d-flex flex-column">
                        <span className="text-sm text-success-700 w-100">
                          {appliedVoucher.mota}
                        </span>
                        <span className="text-xs text-success-600 w-100">
                          Mã: {appliedVoucher.magiamgia}
                        </span>
                      </div>
                    </span>
                    <span className="flex-align gap-8 text-xs fw-medium text-success-700">
                      <button
                        onClick={() => removeVoucher()}
                        className="btn bg-danger-100 hover-bg-danger-200 text-danger-700 p-6 rounded-4 text-xs"
                        style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Hủy
                      </button>
                    </span>
                  </div>
                )}

                {/* Danh sách voucher khả dụng */}
                <div className="mt-16">
                  {homeData?.data?.new_coupon?.filter(voucher => {
                    // Chỉ hiển thị voucher đang hoạt động
                    if (voucher.trangthai !== 'Hoạt động') return false;

                    // Bỏ qua voucher đã áp dụng
                    if (appliedVoucher && voucher.id === appliedVoucher.id) return false;

                    // Kiểm tra điều kiện đơn hàng tối thiểu
                    if (voucher.dieukien.includes('500000')) {
                      return subtotal >= 500000;
                    }

                    // Kiểm tra điều kiện "tatca" (áp dụng cho tất cả)
                    if (voucher.dieukien === 'tatca') {
                      return true;
                    }

                    // Các điều kiện khác có thể thêm vào đây
                    return false;
                  }).map((voucher) => (
                    <div key={voucher.id} className="flex-align flex-between gap-8 mt-10 border-dashed border-gray-200 py-10 px-12 rounded-4">
                      <span className="flex-align gap-8 text-sm fw-medium text-gray-900" style={{ flex: '1', minWidth: 0 }}>
                        <i className="ph-bold ph-ticket text-main-600 text-2xl" style={{ flexShrink: 0 }}></i>
                        <div className="text-sm d-flex flex-column" style={{ flex: '1', minWidth: 0 }}>
                          <span className="text-sm text-gray-900" style={{ wordBreak: 'break-word' }}>
                            {voucher.mota}
                          </span>
                          <span className="text-xs text-gray-500">
                            Mã: {voucher.magiamgia}
                          </span>
                          {voucher.dieukien.includes('500000') && (
                            <span className="text-xs text-warning-600">
                              Đơn tối thiểu 500.000đ
                            </span>
                          )}
                        </div>
                      </span>
                      <button
                        onClick={() => applyVoucher(voucher)}
                        className="btn bg-main-600 hover-bg-main-100 text-white hover-text-main-600 rounded-4 text-xs"
                        style={{
                          cursor: 'pointer',
                          padding: '8px 16px',
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                          minWidth: '60px'
                        }}
                      >
                        Chọn
                      </button>
                    </div>
                  ))}

                  {(!homeData?.data?.new_coupon || homeData.data.new_coupon.length === 0) && (
                    <p className="text-gray-500 text-sm text-center py-16">
                      Không có voucher khả dụng
                    </p>
                  )}
                </div>
              </div>
              <div className="cart-sidebar border border-gray-100 rounded-8 px-20 py-20 mt-20">
                <div className="mb-20">
                  <h6 className="text-lg mb-6 flex-align gap-4"><i className="ph-bold ph-shopping-cart text-main-600 text-xl"></i>Thông tin giỏ hàng</h6>
                  <span className="text-sm text-gray-600 flex-align gap-1 fw-medium">
                    {totalItems} sản phẩm
                  </span>
                </div>
                <div className="mb-20 flex-between gap-8">
                  <span className="text-gray-900 font-heading-two">Tạm tính:</span>
                  <span className="text-gray-900 fw-semibold">{formatPrice(subtotal)}</span>
                </div>

                {/* Hiển thị giảm giá từ giá gốc sản phẩm */}
                {productDiscount > 0 && (
                  <div className="mb-20 flex-between gap-8">
                    <span className="text-success-600 font-heading-two">Giảm giá sản phẩm:</span>
                    <span className="text-success-600 fw-semibold">
                      -{formatPrice(productDiscount)}
                    </span>
                  </div>
                )}

                {/* Hiển thị giảm giá voucher */}
                {appliedVoucher && discountAmount > 0 && (
                  <div className="mb-20 flex-between gap-8">
                    <span className="text-success-600 font-heading-two">
                      Giảm giá Voucher:
                      <span className="text-xs ms-2 text-gray-600">{appliedVoucher.magiamgia}</span>
                    </span>
                    <span className="text-success-600 fw-semibold">
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="border-top border-gray-100 my-20 pt-24">
                  <div className="flex-between gap-8">
                    <span className="text-gray-900 text-lg fw-semibold">Tổng giá trị:</span>
                    <span className="text-main-600 text-lg fw-semibold">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
                <Link
                  href="/thanh-toan"
                  className={`btn py-14 w-100 rounded-8 ${items.length === 0 ? 'disabled opacity-50' : ''}`}
                  style={{
                    pointerEvents: items.length === 0 ? 'none' : 'auto',
                    background: 'rgb(229, 57, 53)',
                    color: 'white',
                    fontWeight: '600',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(229, 57, 53, 0.4)',
                    transition: 'all 0.2s ease',
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
                  Tiến hành thanh toán
                </Link>
              </div>
              <span className="mt-20 w-100">
                <Link href="/" className="text-sm text-main-600 fw-medium flex-align d-flex flex-center transtional-2 link" style={{ cursor: 'pointer' }}>
                  <i className="ph-bold ph-arrow-fat-lines-left text-main-600 text-md pe-10"></i> <span>Tiếp tục mua hàng</span>
                </Link>
              </span>
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
  return (
    <HomeDataProvider>
      <CartPageContent />
    </HomeDataProvider>
  );
}
