"use client";
import React, { useState, useEffect, useRef } from 'react';

interface QuantityControlProps {
  quantity: number;
  onUpdate: (newQty: number) => void;
  disabled?: boolean;
}

export default function QuantityControl({ quantity, onUpdate, disabled }: QuantityControlProps) {
  const [localQty, setLocalQty] = useState(quantity);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalQty(quantity);
  }, [quantity]);

  const handleChange = (val: number) => {
    if (val < 1) return;
    setLocalQty(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(() => {
      if (val !== quantity) {
        onUpdate(val);
      }
    }, 700); // người dùng bấm tăng giảm xong 0.7s mới gọi cập nhật
  };

  return (
    <div className="overflow-hidden border border-gray-100 d-flex rounded-4 w-100" style={{width: 'fit-content'}}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleChange(localQty - 1)}
        className="flex-shrink-0 w-40 h-40 border-gray-100 quantity__minus border-end flex-center hover-bg-main-600 hover-text-white transition-1"
      >
        <i className="ph ph-minus"></i>
      </button>
      
      <input
        type="number"
        className="w-32 px-2 text-center bg-white border-0 quantity__input flex-grow-1"
        value={localQty}
        onChange={(e) => handleChange(parseInt(e.target.value) || 1)}
        disabled={disabled}
      />
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleChange(localQty + 1)}
        className="flex-shrink-0 w-40 h-40 border-gray-100 quantity__plus border-start flex-center hover-bg-main-600 hover-text-white transition-1"
      >
        <i className="ph ph-plus"></i>
      </button>
    </div>
  );
};