"use client";
import { useState, useEffect, useCallback } from "react";

// ========================================================================
// TYPE DEFINITIONS
// ========================================================================

export interface BrandInfo {
    id_thuonghieu: number;
    ten_thuonghieu: string;
    slug_thuonghieu: string;
    logo_thuonghieu: string;
}

export interface GiftProgram {
    id: number;
    id_bienthe: number;           // ID biến thể sản phẩm được tặng
    id_chuongtrinh: number;       // ID chương trình (dùng khi addToCart)
    thongtin_thuonghieu: BrandInfo;
    dieukiensoluong: number;      // Số lượng sản phẩm cần mua
    dieukiengiatri: number;       // Giá trị đơn hàng tối thiểu
    tieude: string;               // Tiêu đề chương trình
    slug: string;
    thongtin: string;             // Mô tả chi tiết
    hinhanh: string;              // Hình ảnh banner
    luotxem: number;
    ngaybatdau: string;
    ngayketthuc: string;
    thoigian_conlai: number;      // Số ngày còn lại
    trangthai: string;            // "Hiển thị" | "Ẩn"
}

export interface GiftProgramFilters {
    popular: { label: string; param: string; value: string };
    newest: { label: string; param: string; value: string };
    expiring: { label: string; param: string; value: string };
    thuonghieus: Array<{ id: number; ten: string }>;
}

export interface GiftProgramPagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface GiftProgramsResponse {
    data: GiftProgram[];
    filters: GiftProgramFilters;
    pagination: GiftProgramPagination;
}

// ========================================================================
// HOOK
// ========================================================================

export function useGiftPrograms() {
    const [programs, setPrograms] = useState<GiftProgram[]>([]);
    const [filters, setFilters] = useState<GiftProgramFilters | null>(null);
    const [pagination, setPagination] = useState<GiftProgramPagination | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API = process.env.NEXT_PUBLIC_SERVER_API || "http://148.230.100.215";

    // Fetch all gift programs
    const fetchPrograms = useCallback(async (params?: {
        filter?: 'popular' | 'newest' | 'expiring';
        thuonghieu?: number;
        page?: number;
    }) => {
        setLoading(true);
        setError(null);

        try {
            let url = `${API}/api/quatangs-all`;
            const queryParams = new URLSearchParams();

            if (params?.filter) {
                queryParams.append('filter', params.filter);
            }
            if (params?.thuonghieu) {
                queryParams.append('thuonghieu', params.thuonghieu.toString());
            }
            if (params?.page) {
                queryParams.append('page', params.page.toString());
            }

            if (queryParams.toString()) {
                url += `?${queryParams.toString()}`;
            }

            console.log("🎁 Fetching gift programs from:", url);

            const res = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                cache: "no-store",
            });

            if (!res.ok) {
                throw new Error(`API error: ${res.status}`);
            }

            const json: GiftProgramsResponse = await res.json();
            console.log("🎁 Gift programs response:", json);

            setPrograms(json.data || []);
            setFilters(json.filters || null);
            setPagination(json.pagination || null);

            return json;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Lỗi khi tải chương trình quà tặng";
            setError(errorMessage);
            console.error("❌ Error fetching gift programs:", err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [API]);

    // Get program by id_chuongtrinh
    const getProgramById = useCallback((id_chuongtrinh: number): GiftProgram | undefined => {
        return programs.find(p => p.id_chuongtrinh === id_chuongtrinh);
    }, [programs]);

    // Get programs for a specific brand
    const getProgramsByBrand = useCallback((brandId: number): GiftProgram[] => {
        return programs.filter(p => p.thongtin_thuonghieu.id_thuonghieu === brandId);
    }, [programs]);

    // Get active programs (còn thời gian)
    const getActivePrograms = useCallback((): GiftProgram[] => {
        return programs.filter(p => p.thoigian_conlai > 0 && p.trangthai === "Hiển thị");
    }, [programs]);

    // Get expiring soon programs (< 7 days)
    const getExpiringSoonPrograms = useCallback((): GiftProgram[] => {
        return programs.filter(p => p.thoigian_conlai > 0 && p.thoigian_conlai <= 7);
    }, [programs]);

    // Check if cart qualifies for a program
    const checkQualification = useCallback((
        program: GiftProgram,
        cartItemCount: number,
        cartTotalValue: number
    ): { qualified: boolean; reason: string } => {
        const needQuantity = program.dieukiensoluong;
        const needValue = program.dieukiengiatri;

        // Kiểm tra điều kiện số lượng
        if (cartItemCount >= needQuantity) {
            return {
                qualified: true,
                reason: `Đủ điều kiện: Mua ${cartItemCount}/${needQuantity} sản phẩm`
            };
        }

        // Kiểm tra điều kiện giá trị
        if (cartTotalValue >= needValue) {
            return {
                qualified: true,
                reason: `Đủ điều kiện: Đơn hàng ${cartTotalValue.toLocaleString()}đ/${needValue.toLocaleString()}đ`
            };
        }

        // Chưa đủ điều kiện
        const remainingQuantity = needQuantity - cartItemCount;
        const remainingValue = needValue - cartTotalValue;

        return {
            qualified: false,
            reason: `Cần thêm ${remainingQuantity} sản phẩm hoặc ${remainingValue.toLocaleString()}đ để được tặng quà`
        };
    }, []);

    // Auto fetch on mount
    useEffect(() => {
        fetchPrograms();
    }, [fetchPrograms]);

    return {
        // Data
        programs,
        filters,
        pagination,
        loading,
        error,

        // Computed
        totalPrograms: programs.length,
        activePrograms: getActivePrograms(),
        expiringSoonPrograms: getExpiringSoonPrograms(),

        // Actions
        fetchPrograms,
        getProgramById,
        getProgramsByBrand,
        getActivePrograms,
        getExpiringSoonPrograms,
        checkQualification,

        // Refetch
        refetch: () => fetchPrograms(),
    };
}

export default useGiftPrograms;
