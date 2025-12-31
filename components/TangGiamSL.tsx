"use client";
import React, { useState, useEffect, useRef } from 'react';

interface QuantityControlProps {
  quantity: number;
  stock: number; // [MỚI] Thêm prop tồn kho
  onUpdate: (newQty: number) => void;
  disabled?: boolean;
}

export default function QuantityControl({ quantity, stock, onUpdate, disabled }: QuantityControlProps) {
  // State nội bộ để hiển thị số trên ô input ngay lập tức
  const [localQty, setLocalQty] = useState<string | number>(quantity);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Đồng bộ khi quantity từ server thay đổi (ví dụ load xong giỏ hàng)
  useEffect(() => {
    setLocalQty(quantity);
  }, [quantity]);

  // --- HÀM 1: LOGIC CHỐT SỐ LIỆU VÀ GỌI API ---
  const commitQuantity = (val: number) => {
    let finalVal = val;

    // Validate số âm
    if (finalVal < 1) finalVal = 1;

    // [QUAN TRỌNG] Validate tồn kho
    // Nếu tồn kho > 0 và khách chọn lớn hơn tồn kho
    if (stock > 0 && finalVal > stock) {
      alert(`Số lượng hiện có trong kho chỉ còn ${stock}. Nếu bạn muốn mua nhiều hơn, vui lòng liên hệ quản trị viên.`);
      finalVal = stock;
    }

    // Cập nhật lại số hiển thị (để khớp với logic sửa số ở trên)
    setLocalQty(finalVal);

    // Gọi hàm update của cha (để gọi API)
    if (finalVal !== quantity) {
      onUpdate(finalVal);
    }
  };

  // --- HÀM 2: XỬ LÝ KHI NGƯỜI DÙNG NHẬP TAY (INPUT) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Cho phép người dùng gõ thoải mái số, chưa gọi API vội
    setLocalQty(e.target.value);
  };

  const handleInputBlur = () => {
    // Chỉ chốt số liệu khi người dùng click ra ngoài (onBlur)
    const val = parseInt(String(localQty)) || 1;
    commitQuantity(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Chốt số liệu khi nhấn Enter
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Trigger onBlur
    }
  };

  // --- HÀM 3: XỬ LÝ KHI BẤM NÚT TĂNG/GIẢM ---
  const handleButtonClick = (delta: number) => {
    const currentVal = Number(localQty) || 0;
    const newVal = currentVal + delta;

    if (newVal < 1) return;

    // Chặn ngay tại UI nếu vượt quá tồn kho để không cần đợi API
    if (stock > 0 && newVal > stock) {
      alert(`Đã đạt giới hạn tồn kho (${stock}).`);
      return;
    }

    // Cập nhật UI ngay lập tức cho mượt
    setLocalQty(newVal);

    // Debounce gọi API (để tránh spam click liên tục)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate(newVal);
    }, 500); // Giảm xuống 0.5s cho cảm giác nhanh hơn chút
  };

  return (
    <div className="overflow-hidden border border-gray-100 d-flex rounded-4 w-100" style={{width: 'fit-content'}}>
      <button
        type="button"
        disabled={disabled || Number(localQty) <= 1}
        onClick={() => handleButtonClick(-1)}
        className="flex-shrink-0 w-40 h-40 border-gray-100 quantity__minus border-end flex-center hover-bg-main-600 hover-text-white transition-1"
      >
        <i className="ph ph-minus"></i>
      </button>
      
      <input
        type="number"
        className="w-32 px-2 text-center bg-white border-0 quantity__input flex-grow-1"
        value={localQty}
        onChange={handleInputChange} 
        onBlur={handleInputBlur}     // [MỚI] Xử lý khi click ra ngoài
        onKeyDown={handleKeyDown}    // [MỚI] Xử lý khi enter
        disabled={disabled}
      />
      
      <button
        type="button"
        // [MỚI] Disable nút tăng nếu đã chạm trần tồn kho
        disabled={disabled || (stock > 0 && Number(localQty) >= stock)}
        onClick={() => handleButtonClick(1)}
        className="flex-shrink-0 w-40 h-40 border-gray-100 quantity__plus border-start flex-center hover-bg-main-600 hover-text-white transition-1"
      >
        <i className="ph ph-plus"></i>
      </button>
    </div>
  );
};