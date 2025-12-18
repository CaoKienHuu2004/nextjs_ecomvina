"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchSearchProducts, SearchProduct } from "@/lib/api";

// Định dạng dữ liệu gợi ý hiển thị
interface SuggestionItem {
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
}

interface SearchBoxWithSuggestionsProps {
    placeholder?: string;
}

const DEBOUNCE_DELAY = 300;

export default function SearchBoxWithSuggestions({ placeholder = "chẤt viỆt group...." }: SearchBoxWithSuggestionsProps) {
    const router = useRouter();
    const [inputValue, setInputValue] = useState("");
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const handleSearch = useCallback(async (keyword: string) => {
        const trimmed = keyword.trim();
        if (!trimmed) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        try {
            setLoading(true);
            const data = await fetchSearchProducts(trimmed);

            const mapped: SuggestionItem[] = (data || []).slice(0, 5).map((item: SearchProduct) => {
                const currentPrice = item.gia?.current || 0;
                const beforeDiscount = item.gia?.before_discount || 0;

                let imageUrl = item.hinh_anh || "/assets/images/thumbs/default-product.png";
                if (imageUrl && !imageUrl.startsWith("http")) {
                    imageUrl = `https://sieuthivina.cloud${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
                }

                return {
                    id: item.id,
                    name: item.ten,
                    price: currentPrice,
                    originalPrice: beforeDiscount || undefined,
                    image: imageUrl,
                };
            });

            setSuggestions(mapped);
            setShowDropdown(mapped.length > 0);
        } catch (error) {
            console.error("Search suggestions error:", error);
            setSuggestions([]);
            setShowDropdown(false);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        const newTimeout = setTimeout(() => {
            handleSearch(value);
        }, DEBOUNCE_DELAY);

        setTimeoutId(newTimeout);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        setShowDropdown(false);
        router.push(`/shop?query=${encodeURIComponent(trimmed)}`);
    };

    const handleSelect = (item: SuggestionItem) => {
        setShowDropdown(false);
        router.push(`/shop?query=${encodeURIComponent(item.name)}`);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest(".search-with-suggestions")) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    return (
        <div className="position-relative w-100 search-with-suggestions">
            <form className="position-relative w-100" onSubmit={handleSubmit}>
                <input
                    className="py-10 text-sm shadow-none form-control fw-normal placeholder-italic bg-neutral-30 placeholder-fw-normal placeholder-light ps-30 pe-60"
                    placeholder={placeholder}
                    aria-label="Tìm kiếm sản phẩm"
                    type="text"
                    value={inputValue}
                    onChange={handleChange}
                />
                <button
                    type="submit"
                    className="text-xl position-absolute top-50 translate-middle-y text-main-600 end-0 me-36 line-height-1"
                    aria-label="Tìm"
                >
                    <i className="ph-bold ph-magnifying-glass"></i>
                </button>
            </form>

            {showDropdown && suggestions.length > 0 && (
                <div
                    className="mt-2 bg-white border border-gray-100 rounded-8 shadow-sm overflow-hidden"
                    style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 99999, pointerEvents: 'auto' }}
                >
                    <div className="px-16 py-8 text-xs text-gray-500 fw-semibold border-bottom border-gray-100">
                        SẢN PHẨM GỢI Ý
                    </div>
                    <div>
                        {suggestions.map((item) => (
                            <Link
                                key={item.id}
                                href={`/shop?query=${encodeURIComponent(item.name)}`}
                                className="w-100 text-start px-16 py-10 d-flex gap-12 align-items-center hover-bg-neutral-50 text-decoration-none"
                                onClick={() => setShowDropdown(false)}
                                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                            >
                                <div
                                    className="flex-shrink-0 rounded-4 overflow-hidden bg-neutral-20"
                                    style={{ width: 48, height: 48 }}
                                >
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-100 h-100"
                                        style={{ objectFit: "cover" }}
                                    />
                                </div>
                                <div className="flex-grow-1">
                                    <div className="text-sm text-gray-900 text-line-2 mb-4">{item.name}</div>
                                    <div className="d-flex align-items-center gap-8">
                                        <span className="text-sm text-main-600 fw-semibold">
                                            {item.price.toLocaleString("vi-VN")}đ
                                        </span>
                                        {item.originalPrice && item.originalPrice > item.price && (
                                            <span className="text-xs text-gray-400 text-decoration-line-through">
                                                {item.originalPrice.toLocaleString("vi-VN")}đ
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {loading && (
                <div
                    className="mt-2 bg-white border border-gray-100 rounded-8 shadow-sm px-16 py-8 text-xs text-gray-500"
                    style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 99999 }}
                >
                    Đang tìm kiếm...
                </div>
            )}
        </div>
    );
}
