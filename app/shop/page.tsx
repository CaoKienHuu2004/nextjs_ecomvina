"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchShopProducts, fetchHomePage, fetchSearchProducts, type ShopCategory, type ShopBrand, type ShopPriceRange, type HomeHotSaleProduct } from "@/lib/api";
import type { TopBrand } from "@/lib/api";
import FullHeader from "@/components/FullHeader";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const CATEGORY_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "suc-khoe", label: "Sức khỏe" },
  { value: "thuc-pham-chuc-nang", label: "Thực phẩm chức năng" },
  { value: "cham-soc-ca-nhan", label: "Chăm sóc cá nhân" },
  { value: "lam-dep", label: "Làm đẹp" },
  { value: "dien-may", label: "Điện máy" },
  { value: "thiet-bi-y-te", label: "Thiết bị y tế" },
  { value: "bach-hoa", label: "Bách hóa" },
  { value: "noi-that-trang-tri", label: "Nội thất - Trang trí" },
  { value: "me-va-be", label: "Mẹ & bé" },
  { value: "thoi-trang", label: "Thời trang" },
  { value: "thuc-pham-do-an", label: "Thực phẩm - đồ ăn" },
  { value: "do-uong", label: "Đồ uống" }
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CATEGORY_NAME_TO_SLUG: Record<string, string> = {
  "Bách hóa": "bach-hoa",
  "Sức khỏe": "suc-khoe",
  "Thực phẩm - đồ ăn": "thuc-pham-do-an",
  "Thiết bị y tế": "thiet-bi-y-te",
  "Làm đẹp": "lam-dep",
  "Mẹ & bé": "me-va-be",
  "Điện máy": "dien-may",
  "Nội thất - Trang trí": "noi-that-trang-tri",
  "Thời trang": "thoi-trang",
  "Đồ uống": "do-uong",
  "Chăm sóc cá nhân": "cham-soc-ca-nhan",
  "Thực phẩm chức năng": "thuc-pham-chuc-nang"
};

const PRICE_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "low100", label: "Dưới 100.000đ" },
  { value: "to200", label: "100.000đ - 200.000đ" },
  { value: "to300", label: "200.000đ - 300.000đ" },
  { value: "to500", label: "300.000đ - 500.000đ" },
  { value: "to700", label: "500.000đ - 700.000đ" },
  { value: "to1000", label: "700.000đ - 1.000.000đ" },
  { value: "high1000", label: "Trên 1.000.000đ" }
];

const BRAND_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "stv-trading", label: "STV Trading" },
  { value: "cchoi", label: "C'CHOI" },
  { value: "acaci-labs", label: "ACACI LABS" },
  { value: "global-yen-sao-nest100", label: "GLOBAL (Yến Sào NEST100)" },
  { value: "chat-viet-group", label: "CHẤT VIỆT GROUP" }
];

interface Product {
  id: number;
  name: string;
  slug?: string;
  category?: string;
  brand: string;
  brandSlug: string;
  price: number;
  rating: number;
  image: string;
  discount?: number;
  originalPrice?: number;
  sold?: number;
}

export default function ShopPage() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("query") || "";
  const categoryParam = searchParams.get("category") || "";
  const sourceParam = searchParams.get("source") || "";

  const [allProducts, setAllProducts] = useState<Product[]>([]); // Lưu TẤT CẢ sản phẩm từ API
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;

  // State chính - trigger filtering (SẼ trigger API call)
  const [filters, setFilters] = useState({
    danhmuc: categoryParam,
    locgia: "",
    thuonghieu: "",
    rating: ""
  });

  // State tạm - chỉ lưu giá trị đang chọn, chưa áp dụng
  const [tempFilters, setTempFilters] = useState({
    danhmuc: categoryParam,
    locgia: "",
    thuonghieu: "",
    rating: ""
  });

  // Sync searchQuery khi queryParam thay đổi
  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  // Sync filters khi categoryParam thay đổi
  useEffect(() => {
    if (categoryParam) {
      // Khi URL có ?category=... → áp dụng filter danh mục tương ứng
      setFilters(prev => ({ ...prev, danhmuc: categoryParam }));
      setTempFilters(prev => ({ ...prev, danhmuc: categoryParam }));
    } else {
      // Khi URL KHÔNG còn ?category=... (ví dụ sau khi click gợi ý search)
      // → xoá filter danh mục, để search hiển thị đúng kết quả
      setFilters(prev => ({ ...prev, danhmuc: "" }));
      setTempFilters(prev => ({ ...prev, danhmuc: "" }));
    }
  }, [categoryParam]);

  // Helper function để suy luận category từ tên sản phẩm
  const inferCategory = (name: string): string => {
    const lowerName = name.toLowerCase();

    // Bách hóa - Kiểm tra TRƯỚC (vì "nước giặt", "nước rửa chén" chứa từ "nước")
    if (lowerName.includes("nước giặt") || lowerName.includes("nước rửa chén") ||
      lowerName.includes("nước rửa bát") || lowerName.includes("bột giặt") ||
      lowerName.includes("nước lau") || lowerName.includes("tẩy rửa")) {
      return "bach-hoa";
    }

    // Chăm sóc cá nhân - Kiểm tra TRƯỚC đồ uống
    if (lowerName.includes("sữa rửa mặt") || lowerName.includes("dầu gội") ||
      lowerName.includes("kem dưỡng") || lowerName.includes("son môi") ||
      lowerName.includes("nước hoa") || lowerName.includes("sữa tắm") ||
      lowerName.includes("dưỡng da") || lowerName.includes("kem body")) {
      return "cham-soc-ca-nhan";
    }

    // Sức khỏe
    if (lowerName.includes("yến") || lowerName.includes("sâm") ||
      lowerName.includes("đông trùng") || lowerName.includes("ginseng") ||
      lowerName.includes("hồng sâm") || lowerName.includes("nhân sâm") ||
      lowerName.includes("tinh dầu") || lowerName.includes("cao dược liệu")) {
      return "suc-khoe";
    }

    // Thực phẩm chức năng
    if (lowerName.includes("vitamin") || lowerName.includes("collagen") ||
      lowerName.includes("omega") || lowerName.includes("canxi") ||
      lowerName.includes("kẽm") || lowerName.includes("sắt") ||
      lowerName.includes("viên uống") || lowerName.includes("thực phẩm bảo vệ")) {
      return "thuc-pham-chuc-nang";
    }

    // Làm đẹp
    if (lowerName.includes("dưỡng mi") || lowerName.includes("serum") ||
      lowerName.includes("mặt nạ") || lowerName.includes("toner") ||
      lowerName.includes("nước tẩy trang") || lowerName.includes("tẩy trang")) {
      return "lam-dep";
    }

    // Thiết bị y tế
    if (lowerName.includes("máy xông") || lowerName.includes("máy đo") ||
      lowerName.includes("găng") || lowerName.includes("khẩu trang") ||
      lowerName.includes("tấm lót") || lowerName.includes("hũ hít")) {
      return "thiet-bi-y-te";
    }

    // Mẹ và bé
    if (lowerName.includes("sữa non") || lowerName.includes("tã") ||
      lowerName.includes("bỉm") || lowerName.includes("papamilk")) {
      return "me-va-be";
    }

    // Thực phẩm - đồ ăn
    if (lowerName.includes("gạo") || lowerName.includes("dầu ăn") ||
      lowerName.includes("nước mắm") || lowerName.includes("mì") ||
      lowerName.includes("phở") || lowerName.includes("bún") ||
      lowerName.includes("bánh") || lowerName.includes("hạt") ||
      lowerName.includes("bột") || lowerName.includes("kẹo") ||
      lowerName.includes("matcha")) {
      return "thuc-pham-do-an";
    }

    // Đồ uống - Kiểm tra CUỐI CÙNG
    if (lowerName.includes("nước") || lowerName.includes("trà") ||
      lowerName.includes("cà phê") || lowerName.includes("sữa uống") ||
      lowerName.includes("nước ép") || lowerName.includes("nước giải khát")) {
      return "do-uong";
    }

    return ""; // Không xác định
  };

  // State để lưu filters từ API
  const [apiCategories, setApiCategories] = useState<ShopCategory[]>([]);
  const [apiBrands, setApiBrands] = useState<ShopBrand[]>([]);
  const [apiPriceRanges, setApiPriceRanges] = useState<ShopPriceRange[]>([]);

  // Helper function để lấy min/max price từ locgia value (dùng fallback, không phụ thuộc apiPriceRanges để tránh loop)
  const getPriceRangeStatic = useCallback((locgia: string): { min?: number; max?: number } => {
    // Chỉ dùng fallback logic để tránh infinite loop
    switch (locgia) {
      case "low100": return { max: 100000 };
      case "to200": return { min: 100000, max: 200000 };
      case "to300": return { min: 200000, max: 300000 };
      case "to500": return { min: 300000, max: 500000 };
      case "to700": return { min: 500000, max: 700000 };
      case "to1000": return { min: 700000, max: 1000000 };
      case "high1000": return { min: 1000000 };
      default: return {};
    }
  }, []);

  // useEffect 1: Fetch products từ API sanphams-all
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let products: Product[] = [];

        // Nếu có source param (hot_sales, best_products, new_launch, most_watched) → Lấy từ trang chủ
        if (sourceParam === "hot_sales" || sourceParam === "best_products" ||
          sourceParam === "new_launch" || sourceParam === "most_watched") {

          try {
            const homeData = await fetchHomePage();
            const allProductsFromAPI: (HomeHotSaleProduct & { categoryFromAPI?: string; categoryName?: string })[] = [];

            console.log(`🔍 Shop - Đang lấy sản phẩm từ source="${sourceParam}"`);

            if (sourceParam === "hot_sales") {
              const hotSales = (homeData.data.hot_sales || [])
                .slice()
                .sort((a, b) => {
                  const soldA = parseInt(a.sold_count || "0");
                  const soldB = parseInt(b.sold_count || "0");
                  return soldB - soldA;
                });
              console.log('🔥 Shop - Hot Sales từ API:', hotSales.length, 'sản phẩm');
              hotSales.forEach((product: any) => {
                allProductsFromAPI.push({
                  ...product,
                  categoryFromAPI: inferCategory(product.ten),
                  categoryName: "Top deal • Siêu rẻ"
                });
              });
            } else if (sourceParam === "best_products") {
              const bestProducts = (homeData.data.best_products || [])
                .slice()
                .sort((a, b) => {
                  const soldA = parseInt(a.sold_count || "0");
                  const soldB = parseInt(b.sold_count || "0");
                  return soldB - soldA;
                });
              console.log('⭐ Shop - Best Products từ API:', bestProducts.length, 'sản phẩm');
              bestProducts.forEach((product: any) => {
                allProductsFromAPI.push({
                  ...product,
                  categoryFromAPI: inferCategory(product.ten),
                  categoryName: "Sản phẩm hàng đầu"
                });
              });
            } else if (sourceParam === "new_launch") {
              const newLaunch = (homeData.data.new_launch || [])
                .slice()
                .sort((a, b) => {
                  const soldA = parseInt(a.sold_count || "0");
                  const soldB = parseInt(b.sold_count || "0");
                  return soldB - soldA;
                });
              console.log('🆕 Shop - New Launch từ API:', newLaunch.length, 'sản phẩm');
              newLaunch.forEach((product: any) => {
                allProductsFromAPI.push({
                  ...product,
                  categoryFromAPI: inferCategory(product.ten),
                  categoryName: "Hàng mới chào sân",
                });
              });
            } else if (sourceParam === "most_watched") {
              const mostWatchedOnly = (homeData.data.most_watched || [])
                .slice()
                .sort((a, b) => {
                  const soldA = parseInt(a.sold_count || "0");
                  const soldB = parseInt(b.sold_count || "0");
                  return soldB - soldA;
                });
              console.log('👀 Shop - Most Watched từ API:', mostWatchedOnly.length, 'sản phẩm');
              mostWatchedOnly.forEach((product: any) => {
                allProductsFromAPI.push({
                  ...product,
                  categoryFromAPI: inferCategory(product.ten),
                  categoryName: "Được quan tâm nhiều nhất",
                });
              });
            }

            // Chuyển đổi sang định dạng Product
            products = allProductsFromAPI
              .filter((item: any) => item.hinh_anh && item.hinh_anh.trim() !== "")
              .map((item: any) => {
                const ratingValue = item.rating?.average || 0;
                const currentPrice = item.gia?.current || 0;
                const beforeDiscount = item.gia?.before_discount || 0;
                const discountPercent = item.gia?.discount_percent || 0;

                let imageUrl = item.hinh_anh || "/assets/images/thumbs/default-product.png";
                if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/assets/')) {
                  imageUrl = `/assets/images/thumbs/${imageUrl}`;
                }

                const brandName = item.thuonghieu || "Không rõ";

                return {
                  id: item.id,
                  name: item.ten,
                  slug: item.slug,
                  category: item.categoryFromAPI || "",
                  brand: brandName,
                  brandSlug: slugify(brandName || ""),
                  price: currentPrice,
                  rating: ratingValue,
                  image: imageUrl,
                  discount: discountPercent,
                  originalPrice: beforeDiscount,
                  sold: parseInt(item.sold_count || "0") || 0,
                };
              });

          } catch (err) {
            console.error("Home API error:", err);
            products = [];
          }
        } else {
          // Nếu có searchQuery → dùng fetchSearchProducts (giống gợi ý tìm kiếm)
          // Nếu không → dùng fetchShopProducts với category filter
          if (searchQuery.trim()) {
            // === TÌM KIẾM: Dùng fetchSearchProducts ===
            try {
              console.log('🔍 Shop - Searching with fetchSearchProducts:', searchQuery);

              const searchResults = await fetchSearchProducts(searchQuery.trim());

              console.log(`✅ Shop - Search found ${searchResults.length} products`);

              // Chuyển đổi từ SearchProduct sang Product format
              products = searchResults
                .filter((item) => item.hinh_anh && item.hinh_anh.trim() !== "")
                .map((item) => {
                  const ratingValue = item.rating?.average || 0;
                  const currentPrice = item.gia?.current || 0;
                  const beforeDiscount = item.gia?.before_discount || 0;
                  const discountPercent = item.gia?.discount_percent || 0;

                  let imageUrl = item.hinh_anh || "/assets/images/thumbs/default-product.png";
                  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/assets/')) {
                    imageUrl = `/assets/images/thumbs/${imageUrl}`;
                  }

                  const brandName = item.thuonghieu || "Không rõ";

                  return {
                    id: item.id,
                    name: item.ten,
                    slug: item.slug,
                    category: "",
                    brand: brandName,
                    brandSlug: slugify(brandName || ""),
                    price: currentPrice,
                    rating: ratingValue,
                    image: imageUrl,
                    discount: discountPercent,
                    originalPrice: beforeDiscount,
                    sold: item.sold || 0,
                  };
                });

              console.log(`📊 Shop - Loaded ${products.length} search results`);

            } catch (err) {
              console.error("Search API error:", err);
              products = [];
            }
          } else {
            // === KHÔNG TÌM KIẾM: Dùng fetchShopProducts với danh mục (giá + thương hiệu lọc client-side) ===
            try {
              console.log('🛒 Shop - Fetching from /api/sanphams-all');
              console.log('🏷️ Shop - Category:', filters.danhmuc || categoryParam);

              const shopData = await fetchShopProducts({
                danhmuc: filters.danhmuc || categoryParam || undefined,
              });

              console.log('✅ Shop - API Response:', shopData);
              console.log(`📊 Shop - Total products from API: ${shopData.data?.length || 0}`);

              // Lưu filters từ API
              if (shopData.filters) {
                setApiCategories(shopData.filters.danhmucs || []);
                setApiBrands(shopData.filters.thuonghieus || []);
                setApiPriceRanges(shopData.filters.price_ranges || []);
              }

              // Chuyển đổi dữ liệu từ API sang format Product
              products = (shopData.data || [])
                .filter((item) => item.hinh_anh && item.hinh_anh.trim() !== "")
                .map((item) => {
                  const ratingValue = item.rating?.average || 0;
                  const currentPrice = item.gia?.current || 0;
                  const beforeDiscount = item.gia?.before_discount || 0;
                  const discountPercent = item.gia?.discount_percent || 0;

                  let imageUrl = item.hinh_anh || "/assets/images/thumbs/default-product.png";
                  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/assets/')) {
                    imageUrl = `/assets/images/thumbs/${imageUrl}`;
                  }

                  // Lấy category từ categoryParam nếu có
                  const categorySlug = categoryParam || "";

                  return {
                    id: item.id,
                    name: item.ten,
                    slug: item.slug,
                    category: categorySlug,
                    brand: "Không rõ", // API không trả về brand trong data
                    brandSlug: "",
                    price: currentPrice,
                    rating: ratingValue,
                    image: imageUrl,
                    discount: discountPercent,
                    originalPrice: beforeDiscount,
                    sold: item.sold?.total_sold || 0,
                  };
                });

              console.log(`📊 Shop - Loaded ${products.length} products from API`);

            } catch (err) {
              console.error("Shop API error:", err);
              products = [];
            }
          }
        }

        // Lưu products vào state để filter sau
        setAllProducts(products);
      } catch (error) {
        console.error("Error fetching products:", error);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sourceParam, categoryParam, filters.danhmuc]); // Chỉ fetch lại khi search/source/category thay đổi, giá và thương hiệu lọc client-side

  // Tạo category options từ API
  const dynamicCategoryOptions = useMemo(() => {
    if (apiCategories.length > 0) {
      return [
        { value: "", label: "Tất cả" },
        ...apiCategories.map(cat => ({
          value: cat.slug,
          label: cat.ten,
          count: cat.tong_sanpham
        }))
      ];
    }
    return CATEGORY_OPTIONS;
  }, [apiCategories]);

  // Tạo brand options từ API (ưu tiên danh sách mẫu, loại trùng)
  const dynamicBrandOptions = useMemo(() => {
    const preferredBrands = [
      { value: "stv-trading", label: "STV Trading" },
      { value: "cchoi", label: "C'CHOI" },
      { value: "acaci-labs", label: "ACACI LABS" },
      { value: "global-yen-sao-nest100", label: "GLOBAL (Yến Sào NEST100)" },
      { value: "chat-viet-group", label: "CHẤT VIỆT GROUP" },
      { value: "nutri-viet-nam", label: "NUTRI VIỆT NAM" },
      { value: "ong-mat-binh-phuoc", label: "Ong Mật Bình Phước" },
      { value: "kuchen-viet-nam", label: "KUCHEN Việt Nam" },
    ];

    const map = new Map<string, { value: string; label: string }>();

    // Ưu tiên danh sách mẫu
    preferredBrands.forEach((b) => map.set(b.value, b));

    // Thêm từ API (loại trùng)
    apiBrands.forEach((brand) => {
      if (!map.has(brand.slug)) {
        map.set(brand.slug, { value: brand.slug, label: brand.ten });
      }
    });

    const merged = Array.from(map.values());

    // Sắp xếp theo thứ tự preferred trước, còn lại theo alphabet
    merged.sort((a, b) => {
      const ia = preferredBrands.findIndex((p) => p.value === a.value);
      const ib = preferredBrands.findIndex((p) => p.value === b.value);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.label.localeCompare(b.label, "vi");
    });

    return [{ value: "", label: "Tất cả" }, ...merged];
  }, [apiBrands]);

  // Tạo price range options từ API
  const dynamicPriceOptions = useMemo(() => {
    if (apiPriceRanges.length > 0) {
      return [
        { value: "", label: "Tất cả" },
        ...apiPriceRanges.map(range => ({
          value: range.value,
          label: range.label,
          min: range.min,
          max: range.max
        }))
      ];
    }
    return PRICE_OPTIONS;
  }, [apiPriceRanges]);

  // useEffect 2: Lọc client-side cho giá và thương hiệu (vì API có thể chưa hỗ trợ)
  useEffect(() => {
    let filtered = [...allProducts];

    // Lọc theo giá (client-side)
    if (filters.locgia && filters.locgia !== "") {
      const priceRange = getPriceRangeStatic(filters.locgia);
      filtered = filtered.filter(p => {
        const price = p.price;
        const minOk = priceRange.min === undefined || price >= priceRange.min;
        const maxOk = priceRange.max === undefined || price <= priceRange.max;
        return minOk && maxOk;
      });
    }

    // Lọc theo thương hiệu (client-side) - so sánh với brandSlug hoặc brand name
    if (filters.thuonghieu && filters.thuonghieu !== "") {
      filtered = filtered.filter(p =>
        p.brandSlug === filters.thuonghieu ||
        p.brand?.toLowerCase().includes(filters.thuonghieu.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [allProducts, filters.locgia, filters.thuonghieu, getPriceRangeStatic]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const formatCurrency = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "0 đ";
    return `${value.toLocaleString("vi-VN")} đ`;
  };

  const formatRating = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "0";
    const formatted = value.toFixed(1);
    return formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted;
  };

  const formatSold = (value?: number) => (value || 0).toLocaleString("vi-VN");

  const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFilters({ ...tempFilters });
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSidebarOpen(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [topBrands, setTopBrands] = useState<TopBrand[]>([]);
  const buildBrandLogo = (logo?: string) => {
    if (!logo) return "/assets/images/thumbs/placeholder.png";
    if (logo.startsWith("http://") || logo.startsWith("https://") || logo.startsWith("/")) {
      return logo;
    }

    const api = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.cloud";
    return `${api}/${logo.replace(/^\/+/g, "")}`;
  };

  return (
    <>
      <FullHeader showClassicTopBar={true} showTopNav={false} />

      <div className="breadcrumb mb-0 pt-40 bg-main-two-60">
        <div className="container container-lg">
          <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
            <h6 className="mb-0">
              {searchQuery
                ? `Kết quả tìm kiếm: "${searchQuery}"`
                : sourceParam === "hot_sales"
                  ? "Top deal • Siêu rẻ"
                  : sourceParam === "best_products"
                    ? "Sản phẩm hàng đầu"
                    : sourceParam === "new_launch"
                      ? "Hàng mới chào sân"
                      : sourceParam === "most_watched"
                        ? "Được quan tâm nhiều nhất"
                        : "Danh sách sản phẩm"}
            </h6>
            {searchQuery && (
              <p className="text-gray-600 mb-0">
                Tìm thấy <span className="fw-semibold">{filteredProducts.length}</span> sản phẩm
              </p>
            )}
          </div>
        </div>
      </div>

      <section className="shop py-40 pb-0 fix-scale-100">
        <div className="container container-lg">
          <div className="row">
            <div className="col-lg-3">
              <div className={`shop-sidebar-wrapper${isSidebarOpen ? " show" : ""}`}>
                <div
                  className={`shop-sidebar__overlay d-lg-none${isSidebarOpen ? " active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                ></div>
                <form className={`shop-sidebar${isSidebarOpen ? " open" : ""}`} onSubmit={handleFilter}>
                  <button
                    type="button"
                    title="Đóng bộ lọc"
                    onClick={() => setSidebarOpen(false)}
                    className="shop-sidebar__close d-lg-none d-flex w-32 h-32 flex-center border border-gray-100 rounded-circle hover-bg-main-600 position-absolute inset-inline-end-0 me-10 mt-8 hover-text-white hover-border-main-600"
                  >
                    <i className="ph ph-x"></i>
                  </button>

                  <div className="shop-sidebar__box border border-gray-100 rounded-8 p-26 pb-0 mb-32">
                    <h6 className="text-xl border-bottom border-gray-100 pb-16 mb-16">
                      Danh mục sản phẩm
                    </h6>
                    <ul className="max-h-540 overflow-y-auto scroll-sm">
                      {dynamicCategoryOptions.map((cat, index) => (
                        <li key={`cat-${index}-${cat.value || "all"}`} className="mb-20">
                          <div className="form-check common-check common-radio">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="danhmuc"
                              id={cat.value || "all"}
                              value={cat.value}
                              checked={tempFilters.danhmuc === cat.value}
                              onChange={(e) => setTempFilters({ ...tempFilters, danhmuc: e.target.value })}
                            />
                            <label className="form-check-label fw-semibold text-black" htmlFor={cat.value || "all"}>
                              {cat.label}{cat.value && 'count' in cat ? ` (${cat.count})` : ""}
                            </label>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="shop-sidebar__box border border-gray-100 rounded-8 p-26 pb-0 mb-32">
                    <h6 className="text-xl border-bottom border-gray-100 pb-16 mb-24">
                      Lọc theo giá tiền
                    </h6>
                    <ul className="max-h-540 overflow-y-auto scroll-sm">
                      {dynamicPriceOptions.map((price, index) => (
                        <li key={`price-${index}-${price.value || "all"}`} className="mb-24">
                          <div className="form-check common-check common-radio">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="locgia"
                              id={price.value || "all-price"}
                              value={price.value}
                              checked={tempFilters.locgia === price.value}
                              onChange={(e) => setTempFilters({ ...tempFilters, locgia: e.target.value })}
                            />
                            <label className="form-check-label fw-semibold text-black" htmlFor={price.value || "all-price"}>
                              {price.label}
                            </label>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="shop-sidebar__box border border-gray-100 rounded-8 p-26 pb-0 mb-32">
                    <h6 className="text-xl border-bottom border-gray-100 pb-16 mb-24">
                      Lọc theo thương hiệu
                    </h6>
                    <ul className="max-h-540 overflow-y-auto scroll-sm">
                      {dynamicBrandOptions.map((brand, index) => {
                        const brandId = `thuonghieu${index + 1}`;
                        return (
                          <li key={`brand-${index}-${brand.value || "all"}`} className="mb-16">
                            <div className="form-check common-check common-radio">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="thuonghieu"
                                id={brandId}
                                value={brand.value}
                                checked={tempFilters.thuonghieu === brand.value}
                                onChange={(e) => setTempFilters({ ...tempFilters, thuonghieu: e.target.value })}
                              />
                              <label className="form-check-label fw-semibold text-black" htmlFor={brandId}>
                                {brand.label}
                              </label>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="shop-sidebar__box rounded-8 flex-column flex-sm-row flex-align gap-12 gap-sm-16 mb-32">
                    <button
                      title="Lọc sản phẩm trong bộ lọc của bạn"
                      type="submit"
                      className="btn border-main-600 text-main-600 hover-bg-main-600 hover-border-main-600 hover-text-white rounded-8 px-32 py-12 w-100"
                    >
                      Lọc sản phẩm
                    </button>
                    <button
                      type="button"
                      className="btn border-gray-400 text-gray-700 hover-bg-gray-100 rounded-8 px-32 py-12 w-100"
                      onClick={() => {
                        setTempFilters({ danhmuc: "", locgia: "", thuonghieu: "", rating: "" });
                        setFilters({ danhmuc: "", locgia: "", thuonghieu: "", rating: "" });
                        setSidebarOpen(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Xóa lọc
                    </button>
                  </div>

                  <div className="shop-sidebar__box rounded-8">
                    <a href="#" target="_blank" rel="noreferrer noopener">
                      <img className="rounded-8 w-100" src="/assets/images/bg/banner6_tienluat.webp" alt="Shopee Banner" />
                    </a>
                  </div>
                  {topBrands.length > 0 && (
                    <div className="shop-sidebar__box border border-gray-100 rounded-8 p-26 pb-0 mb-32">
                      <h6 className="text-xl border-bottom border-gray-100 pb-16 mb-24">Thương hiệu hàng đầu</h6>
                      <div className="row g-12">
                        {topBrands.map((brand) => (
                          <div key={brand.id} className="col-6">
                            <a href={`/products?brand=${brand.slug}`} className="d-block p-12 border border-gray-100 rounded-8 flex-center" style={{ minHeight: 90 }}>
                              <img
                                src={buildBrandLogo(brand.logo)}
                                alt={brand.ten}
                                className="h-100"
                                style={{ objectFit: "contain", maxHeight: 60 }}
                                onError={(e) => {
                                  const img = e.currentTarget as HTMLImageElement;
                                  img.onerror = null;
                                  img.src = "/assets/images/thumbs/placeholder.png";
                                }}
                              />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>

            <div className="col-lg-9">
              <div className="flex-between gap-16 flex-wrap mb-40">
                <div className="position-relative flex-align gap-16 flex-wrap">
                  <button
                    type="button"
                    title="Mở bộ lọc"
                    aria-label="Mở bộ lọc"
                    className="w-44 h-44 d-lg-none d-flex flex-center border border-gray-100 rounded-6 text-2xl sidebar-btn"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <i className="ph-bold ph-funnel"></i>
                  </button>
                  <div>
                    <p className="mb-0 text-gray-600 text-sm">
                      Hiển thị {currentProducts.length} / {filteredProducts.length} sản phẩm
                    </p>
                    {!!searchQuery && (
                      <span className="text-xs text-gray-500">Nguồn dữ liệu tìm kiếm trực tiếp từ API</span>
                    )}
                  </div>
                </div>
              </div>
              {loading ? (
                <p className="text-center">Đang tải sản phẩm...</p>
              ) : (
                <>
                  <div className="row g-12">
                    {filteredProducts.length === 0 ? (
                      <div className="col-12">
                        <p className="text-center">Không có sản phẩm nào phù hợp với bộ lọc của bạn.</p>
                      </div>
                    ) : (
                      currentProducts.map((p) => (
                        <div key={`${p.id}-${p.category}`} className="col-xxl-3 col-xl-3 col-lg-4 col-xs-6">
                          <div className="product-card shop-product-card h-100 border border-gray-100 hover-border-main-600 rounded-6 position-relative transition-2">
                            <Link
                              href={p.slug ? `/product-details/${p.slug}` : `/product-details/${p.id}`}
                              className="flex-center rounded-8 bg-gray-50 position-relative"
                            >
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-100 rounded-top-2"
                              />
                            </Link>
                            <div className="product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex mt-10 px-10 pb-8">
                              <div>
                                <h6 className="title text-lg fw-semibold mt-2 mb-2">
                                  <Link
                                    href={p.slug ? `/product-details/${p.slug}` : `/product-details/${p.id}`}
                                    className="link text-line-2"
                                    tabIndex={0}
                                  >
                                    {p.name}
                                  </Link>
                                </h6>
                                <div className="flex-align justify-content-between mt-10">
                                  <div className="flex-align gap-6">
                                    <span className="text-xs fw-medium text-gray-500">Đánh giá</span>
                                    <span className="text-xs fw-medium text-gray-500">{formatRating(p.rating)} <i className="ph-fill ph-star text-warning-600"></i></span>
                                  </div>
                                  <div className="flex-align gap-4">
                                    <span className="text-xs fw-medium text-gray-500">{formatSold(p.sold)}</span>
                                    <span className="text-xs fw-medium text-gray-500">Đã bán</span>
                                  </div>
                                </div>
                              </div>
                              <div className="product-card__price mt-5">
                                {(p.discount ?? 0) > 0 && (p.originalPrice ?? 0) > 0 && (
                                  <div className="flex-align gap-4 text-main-two-600 discount-hahaha">
                                    <i className="ph-fill ph-seal-percent text-sm"></i> -{p.discount}%
                                    <span className="text-gray-400 text-sm fw-semibold text-decoration-line-through">
                                      {formatCurrency(p.originalPrice)}
                                    </span>
                                  </div>
                                )}
                                <span className="text-heading text-lg fw-semibold">
                                  {formatCurrency(p.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {
                    filteredProducts.length > 0 && (
                      <ul className="pagination flex-center flex-wrap gap-12 mt-40">
                        {/* Nút Previous */}
                        <li className="page-item">
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            title="Trang trước"
                          >
                            <i className="ph ph-caret-left"></i>
                          </button>
                        </li>

                        {/* Các nút số trang */}
                        {(() => {
                          const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
                          const pages = [];
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(
                              <li key={i} className={`page-item${currentPage === i ? ' active' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => {
                                    setCurrentPage(i);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  title={`Trang ${i}`}
                                >
                                  {i}
                                </button>
                              </li>
                            );
                          }
                          return pages;
                        })()}

                        {/* Nút Next */}
                        <li className="page-item">
                          <button
                            className="page-link"
                            onClick={() => {
                              const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
                              setCurrentPage(prev => Math.min(prev + 1, totalPages));
                            }}
                            disabled={currentPage === Math.ceil(filteredProducts.length / productsPerPage)}
                            title="Trang sau"
                          >
                            <i className="ph ph-caret-right"></i>
                          </button>
                        </li>
                      </ul>
                    )
                  }
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
