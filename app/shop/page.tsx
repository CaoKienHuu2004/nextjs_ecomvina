"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchSearchProducts, fetchHomePage } from "@/lib/api";
import type { SearchProduct } from "@/lib/api";
import FullHeader from "@/components/FullHeader";

interface Product {
  id: number;
  name: string;
  slug?: string;
  category?: string;
  brand: string;
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
  const [inputValue, setInputValue] = useState(queryParam); // Giá trị input tạm

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;

  // State chính - trigger filtering (KHÔNG trigger API call)
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

  // Sync inputValue khi queryParam thay đổi
  useEffect(() => {
    setInputValue(queryParam);
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

  // useEffect 1: Fetch products từ API (khi searchQuery thay đổi HOẶC khi có filters)
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let products: Product[] = [];

        // Kiểm tra xem có filter nào được áp dụng không
        const hasActiveFilters = filters.danhmuc !== "" || filters.locgia !== "" ||
          filters.thuonghieu !== "" || filters.rating !== "";

        // Nếu có filters → Luôn fetch từ shop API (bỏ qua search)
        // Nếu có search query NHƯNG KHÔNG có filters → Dùng search API
        if (searchQuery.trim() && !hasActiveFilters) {
          try {
            const searchResults = await fetchSearchProducts(searchQuery);

            // Kiểm tra nếu API trả về mảng rỗng hoặc không có data
            if (!searchResults || searchResults.length === 0) {
              products = [];
            } else {
              // Chuẩn hóa dữ liệu từ API tìm kiếm thành Product
              products = searchResults
                .filter((item: SearchProduct) => item.hinh_anh && item.hinh_anh.trim() !== "") // Lọc bỏ sản phẩm không có hình
                .map((item: SearchProduct) => {
                  // Xử lý rating - lấy average từ object
                  const ratingValue = item.rating?.average || 0;

                  // Tính giá sau giảm
                  const currentPrice = item.gia?.current || 0;
                  const beforeDiscount = item.gia?.before_discount || 0;
                  const discountPercent = item.gia?.discount_percent || 0;

                  // Normalize URL ảnh: Giữ nguyên relative path từ mock server (đã có /assets/...)
                  let imageUrl = item.hinh_anh || "/assets/images/thumbs/default-product.png";

                  // Nếu là relative path và bắt đầu bằng /assets/ -> giữ nguyên (từ mock server)
                  // Nếu là http -> giữ nguyên (từ external API)
                  // Nếu không có gì -> thêm /assets/images/thumbs/
                  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/assets/')) {
                    imageUrl = `/assets/images/thumbs/${imageUrl}`;
                  }

                  // Đoán category dựa trên tên sản phẩm và thương hiệu
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
                      lowerName.includes("mặt nạ") || lowerName.includes("toner")) {
                      return "lam-dep";
                    }

                    // Thiết bị y tế
                    if (lowerName.includes("máy xông") || lowerName.includes("máy đo") ||
                      lowerName.includes("găng tay y tế") || lowerName.includes("khẩu trang")) {
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
                      lowerName.includes("bột")) {
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

                  const product = {
                    id: item.id,
                    name: item.ten,
                    slug: (item as any).slug,
                    category: inferCategory(item.ten),
                    brand: item.thuonghieu || "Không rõ",
                    price: currentPrice, // Giá hiện tại đã giảm
                    rating: ratingValue,
                    image: imageUrl,
                    discount: discountPercent,
                    originalPrice: beforeDiscount,
                    sold: parseInt(item.sold_count) || 0,
                  };

                  return product;
                });
            }
          } catch (searchErr) {
            console.error("Search API error:", searchErr);
            products = [];
          }
        } else {
          // Nếu không có search query, tuỳ theo source để lấy dữ liệu
          try {
            const homeData = await fetchHomePage(); // Lấy dữ liệu mặc định từ API

            // Map tên danh mục tiếng Việt sang slug
            const categoryNameToSlug: { [key: string]: string } = {
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

            const allProductsFromAPI: any[] = [];
            const mostWatched = homeData.data.most_watched || [];

            // Debug: Xem API trả về bao nhiêu sản phẩm cho mỗi category
            const categoryCounts = homeData.data.top_categories?.map((c: any) => ({
              ten: c.ten,
              count: c.sanpham?.length || 0
            }));
            console.table(categoryCounts);
            console.log("Shop - Sức khỏe có:", categoryCounts?.find((c: any) => c.ten === "Sức khỏe")?.count || 0, "sản phẩm");

            // Nếu có source param (hot_sales, best_products, new_launch, most_watched)
            if (sourceParam === "hot_sales" || sourceParam === "best_products" ||
              sourceParam === "new_launch" || sourceParam === "most_watched") {

              // Nếu ĐỒNG THỜI có category filter → Lấy từ top_categories thay vì source
              if (categoryParam && categoryParam !== "") {
                console.log(`🔍 Shop - Có source="${sourceParam}" VÀ category="${categoryParam}" → Lấy từ top_categories`);

                // Lấy sản phẩm từ top_categories (đầy đủ)
                homeData.data.top_categories?.forEach((cat: any) => {
                  if (cat.sanpham && Array.isArray(cat.sanpham)) {
                    const categorySlug = categoryNameToSlug[cat.ten] || "";
                    cat.sanpham.forEach((product: any) => {
                      allProductsFromAPI.push({
                        ...product,
                        categoryFromAPI: categorySlug,
                        categoryName: cat.ten
                      });
                    });
                  }
                });
              } else {
                // Nếu chỉ có source, KHÔNG có category filter → Lấy từ source
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
                  mostWatchedOnly.forEach((product: any) => {
                    allProductsFromAPI.push({
                      ...product,
                      categoryFromAPI: inferCategory(product.ten),
                      categoryName: "Được quan tâm nhiều nhất",
                    });
                  });
                }
              }
            } else {
              // Mặc định: Lấy sản phẩm từ top_categories - ĐÚNG SỐ LƯỢNG API TRẢ VỀ
              homeData.data.top_categories?.forEach((cat: any) => {
                if (cat.sanpham && Array.isArray(cat.sanpham)) {
                  const categorySlug = categoryNameToSlug[cat.ten] || "";

                  console.log(`📦 Shop - ${cat.ten} (slug: ${categorySlug}): ${cat.sanpham.length} sản phẩm từ API`);

                  // Lấy ĐÚNG số lượng sản phẩm mà API trả về cho từng category
                  cat.sanpham.forEach((product: any) => {
                    allProductsFromAPI.push({
                      ...product,
                      categoryFromAPI: categorySlug, // Gán category từ API
                      categoryName: cat.ten
                    });
                  });
                }
              });

              console.log(`🔍 Shop - categoryParam: "${categoryParam}"`);
              console.log(`🔍 Shop - Tổng sản phẩm từ API: ${allProductsFromAPI.length}`);

              // Nếu KHÔNG có category filter, thêm sản phẩm từ các section khác
              if (!categoryParam || categoryParam === "") {
                [
                  ...(homeData.data.hot_sales || []),
                  ...(homeData.data.best_products || []),
                  ...(homeData.data.new_launch || []),
                ].forEach((product: any) => {
                  allProductsFromAPI.push({
                    ...product,
                    categoryFromAPI: "", // Các sản phẩm này sẽ không có category
                    categoryName: ""
                  });
                });
              }
            }

            // CHO PHÉP sản phẩm xuất hiện ở NHIỀU categories
            // Sử dụng "id-category" làm key để tạo bản sao riêng cho mỗi category
            const uniqueProductsMap = new Map();

            allProductsFromAPI.forEach((item: any) => {
              if (item.hinh_anh && item.hinh_anh.trim() !== "") {
                // Dùng "id-category" làm key để cho phép sản phẩm xuất hiện ở nhiều category
                const uniqueKey = `${item.id}-${item.categoryFromAPI || 'no-category'}`;

                if (!uniqueProductsMap.has(uniqueKey)) {
                  uniqueProductsMap.set(uniqueKey, item);
                }
              }
            });

            // Chuyển đổi sang định dạng Product
            products = Array.from(uniqueProductsMap.values()).map((item: any) => {
              const ratingValue = item.rating?.average || 0;
              const currentPrice = item.gia?.current || 0;
              const beforeDiscount = item.gia?.before_discount || 0;
              const discountPercent = item.gia?.discount_percent || 0;

              let imageUrl = item.hinh_anh || "/assets/images/thumbs/default-product.png";
              if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/assets/')) {
                imageUrl = `/assets/images/thumbs/${imageUrl}`;
              }

              return {
                id: item.id,
                name: item.ten,
                slug: item.slug,
                category: item.categoryFromAPI || "", // Dùng category từ API
                brand: item.thuonghieu || "Không rõ",
                price: currentPrice,
                rating: ratingValue,
                image: imageUrl,
                discount: discountPercent,
                originalPrice: beforeDiscount,
                sold: parseInt(item.sold_count) || 0,
              };
            });

            console.log(`📊 Shop - Sản phẩm sau khi map: ${products.length}`);
            console.log(`🔎 Shop - Sản phẩm có category "thuc-pham-do-an": ${products.filter(p => p.category === "thuc-pham-do-an").length}`);

            // Debug: Kiểm tra số lượng sản phẩm "Sức khỏe" sau khi xử lý
            const sucKhoeProducts = products.filter((p: any) => p.category === "suc-khoe");
            console.log("Shop - Sau khi xử lý, Sức khỏe có:", sucKhoeProducts.length, "sản phẩm");
            console.log("Shop - Sản phẩm Sức khỏe:", sucKhoeProducts.map((p: any) => ({ id: p.id, name: p.name })));
          } catch (err) {
            console.error("API error:", err);
            products = [];
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
  }, [searchQuery, filters, sourceParam]); // Fetch lại khi search query, filters HOẶC source thay đổi

  // useEffect 2: Apply filters CLIENT-SIDE (không fetch lại API)
  useEffect(() => {
    let filtered = allProducts;

    // 1. Lọc theo danh mục
    if (filters.danhmuc && filters.danhmuc !== "") {
      filtered = filtered.filter(p => p.category === filters.danhmuc);
    }

    // 2. Lọc theo giá
    if (filters.locgia && filters.locgia !== "") {
      filtered = filtered.filter(p => {
        const price = p.price;
        switch (filters.locgia) {
          case "low100": return price < 100000;
          case "to200": return price >= 100000 && price <= 200000;
          case "to300": return price >= 200000 && price <= 300000;
          case "to500": return price >= 300000 && price <= 500000;
          case "to700": return price >= 500000 && price <= 700000;
          case "to1000": return price >= 700000 && price <= 1000000;
          case "high1000": return price > 1000000;
          default: return true;
        }
      });
    }

    // 3. Lọc theo thương hiệu
    if (filters.thuonghieu && filters.thuonghieu !== "") {
      filtered = filtered.filter(p =>
        p.brand && p.brand.toLowerCase() === filters.thuonghieu.toLowerCase()
      );
    }

    // 4. Lọc theo rating
    if (filters.rating && filters.rating !== "") {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter(p => p.rating >= minRating);
    }

    setFilteredProducts(filtered);
  }, [allProducts, filters]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...tempFilters });
    setCurrentPage(1); // Reset về trang 1 khi filter
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Sử dụng FullHeader giống trang chủ */}
      <FullHeader showClassicTopBar={true} showTopNav={false} showCategoriesBar={false}/>

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
              <form className="shop-sidebar" onSubmit={handleFilter}>
                <button
                  type="button"
                  title="Đóng bộ lọc"
                  className="shop-sidebar__close d-lg-none d-flex w-32 h-32 flex-center border border-gray-100 rounded-circle hover-bg-main-600 position-absolute inset-inline-end-0 me-10 mt-8 hover-text-white hover-border-main-600"
                >
                  <i className="ph ph-x"></i>
                </button>

                <div className="shop-sidebar__box border border-gray-100 rounded-8 p-26 pb-0 mb-32">
                  <h6 className="text-xl border-bottom border-gray-100 pb-16 mb-16">
                    Danh mục sản phẩm
                  </h6>
                  <ul className="max-h-540 overflow-y-auto scroll-sm">
                    {[
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
                    ].map((cat) => (
                      <li key={cat.value} className="mb-20">
                        <div className="form-check common-check common-radio">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="danhmuc"
                            id={cat.value}
                            value={cat.value}
                            checked={tempFilters.danhmuc === cat.value}
                            onChange={(e) => setTempFilters({ ...tempFilters, danhmuc: e.target.value })}
                          />
                          <label className="form-check-label" htmlFor={cat.value}>
                            {cat.label}
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
                    {[
                      { value: "", label: "Tất cả" },
                      { value: "low100", label: "Dưới 100.000đ" },
                      { value: "to200", label: "100.000đ - 200.000đ" },
                      { value: "to300", label: "200.000đ - 300.000đ" },
                      { value: "to500", label: "300.000đ - 500.000đ" },
                      { value: "to700", label: "500.000đ - 700.000đ" },
                      { value: "to1000", label: "700.000đ - 1.000.000đ" },
                      { value: "high1000", label: "Trên 1.000.000đ" }
                    ].map((price) => (
                      <li key={price.value} className="mb-24">
                        <div className="form-check common-check common-radio">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="locgia"
                            id={price.value}
                            value={price.value}
                            checked={tempFilters.locgia === price.value}
                            onChange={(e) => setTempFilters({ ...tempFilters, locgia: e.target.value })}
                          />
                          <label className="form-check-label" htmlFor={price.value}>
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
                    {[
                      { value: "", label: "Tất cả" },
                      { value: "Trung Tâm Bán Hàng Siêu Thị Vina", label: "Trung Tâm Bán Hàng Siêu Thị Vina" },
                      { value: "C'CHOI", label: "C'CHOI" },
                      { value: "ACACI LABS", label: "ACACI LABS" }
                    ].map((brand) => (
                      <li key={brand.value} className="mb-16">
                        <div className="form-check common-check common-radio">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="thuonghieu"
                            id={`brand-${brand.value}`}
                            value={brand.value}
                            checked={tempFilters.thuonghieu === brand.value}
                            onChange={(e) => setTempFilters({ ...tempFilters, thuonghieu: e.target.value })}
                          />
                          <label className="form-check-label" htmlFor={`brand-${brand.value}`}>
                            {brand.label}
                          </label>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="shop-sidebar__box rounded-8 flex-align justify-content-between mb-32">
                  <button
                    title="Lọc sản phẩm"
                    type="submit"
                    className="btn border-main-600 text-main-600 hover-bg-main-600 hover-border-main-600 hover-text-white rounded-8 px-32 py-12"
                  >
                    Lọc sản phẩm
                  </button>
                  <button
                    type="button"
                    className="btn border-gray-400 text-gray-700 hover-bg-gray-100 rounded-8 px-32 py-12 ms-8"
                    onClick={() => {
                      setTempFilters({ danhmuc: "", locgia: "", thuonghieu: "", rating: "" });
                      setFilters({ danhmuc: "", locgia: "", thuonghieu: "", rating: "" });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Xóa lọc
                  </button>
                </div>

                <div className="shop-sidebar__box rounded-8">
                  <a href="https://shopee.tw">
                    <img className="rounded-8 w-100" src="/assets/images/bg/shoppe.jpg" alt="Shopee Banner" />
                  </a>
                </div>
              </form>
            </div>

            <div className="col-lg-9">
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
                      (() => {
                        // Tính toán sản phẩm hiển thị cho trang hiện tại
                        const indexOfLastProduct = currentPage * productsPerPage;
                        const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
                        const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

                        return currentProducts.map((p) => (
                          <div key={p.id} className="col-xxl-3 col-xl-3 col-lg-4 col-xs-6">
                            <div className="product-card h-100 border border-gray-100 hover-border-main-600 rounded-6 position-relative transition-2">
                              <Link
                                href={p.slug ? `/product-details/${p.slug}` : `/product-details/${p.id}`}
                                className="flex-center rounded-8 bg-gray-50 position-relative"
                                style={{ minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <img src={p.image} alt={p.name} className="w-100 rounded-top-2" style={{ objectFit: 'cover', maxHeight: '250px' }} />
                              </Link>
                              <div className="product-card__content w-100 h-100 align-items-stretch flex-column justify-content-between d-flex mt-10 px-10 pb-8">
                                <div>
                                  <div className="flex-align justify-content-between mt-5">
                                    <div className="flex-align gap-4 w-100">
                                      <span className="text-main-600 text-md d-flex"><i className="ph-fill ph-storefront"></i></span>
                                      <span className="text-gray-500 text-xs" title={p.brand} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", display: "inline-block" }}>
                                        {p.brand}
                                      </span>
                                    </div>
                                  </div>
                                  <h6 className="title text-lg fw-semibold mt-2 mb-2">
                                    <Link
                                      href={p.slug ? `/product-details/${p.slug}` : `/product-details/${p.id}`}
                                      className="link text-line-2"
                                      tabIndex={0}
                                    >
                                      {p.name}
                                    </Link>
                                  </h6>
                                  <div className="flex-align justify-content-between mt-2">
                                    <div className="flex-align gap-6">
                                      <span className="text-xs fw-medium text-gray-500">Đánh giá</span>
                                      <span className="text-xs fw-medium text-gray-500">
                                        {p.rating} <i className="ph-fill ph-star text-warning-600"></i>
                                      </span>
                                    </div>
                                    <div className="flex-align gap-4">
                                      <span className="text-xs fw-medium text-gray-500">{p.sold || 0}</span>
                                      <span className="text-xs fw-medium text-gray-500">Đã bán</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="product-card__price mt-5">
                                  {(p.discount ?? 0) > 0 && (p.originalPrice ?? 0) > 0 && (
                                    <div className="flex-align gap-4 text-main-two-600">
                                      <i className="ph-fill ph-seal-percent text-sm"></i> -{p.discount}%
                                      <span className="text-gray-400 text-sm fw-semibold text-decoration-line-through">
                                        {p.originalPrice!.toLocaleString()} đ
                                      </span>
                                    </div>
                                  )}
                                  <span className="text-heading text-lg fw-semibold">
                                    {p.price.toLocaleString()} đ
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ));
                      })()
                    )}
                  </div>

                  {filteredProducts.length > 0 && (
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
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
