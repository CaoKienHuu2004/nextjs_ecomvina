# Tính năng Giỏ hàng không cần Đăng nhập

## 📋 Tổng quan

Đã cập nhật hệ thống giỏ hàng để cho phép người dùng thêm sản phẩm vào giỏ **TRƯỚC KHI ĐĂNG NHẬP**. Chỉ yêu cầu đăng nhập khi thanh toán.

## ✨ Các thay đổi chính

### 1. **Hook mới: `hooks/useCart.tsx`**
- Quản lý giỏ hàng thống nhất cho cả trạng thái đăng nhập và chưa đăng nhập
- Lưu giỏ hàng vào **localStorage** khi chưa đăng nhập
- Tự động **sync** giỏ hàng local lên server khi người dùng đăng nhập
- Cung cấp các hàm: `addItem`, `updateQuantity`, `removeItem`, `clearCart`

### 2. **Cập nhật `utils/gio-hangClient.ts`**
- Kiểm tra trạng thái đăng nhập trước khi thêm vào giỏ
- Nếu **chưa đăng nhập**: lưu vào localStorage
- Nếu **đã đăng nhập**: gọi API server như cũ

### 3. **Cập nhật `components/FullHeader.tsx`**
- Hiển thị số lượng sản phẩm từ localStorage khi chưa đăng nhập
- Hiển thị số lượng từ server khi đã đăng nhập
- Tự động cập nhật khi có sự thay đổi

### 4. **Cập nhật `app/gio-hang/page.tsx`**
- Sử dụng `useCart` hook thay vì logic cũ
- Hiển thị giỏ hàng cho cả người đã/chưa đăng nhập
- Cho phép chỉnh sửa giỏ hàng trước khi đăng nhập

### 5. **Cập nhật `app/thanh-toan/page.tsx`**
- **YÊU CẦU đăng nhập** khi vào trang thanh toán
- Tự động redirect về trang đăng nhập nếu chưa đăng nhập
- Lưu URL để redirect về checkout sau khi đăng nhập thành công

## 🔄 Flow hoạt động

### Khi chưa đăng nhập:
1. User thêm sản phẩm vào giỏ → Lưu vào **localStorage**
2. User xem giỏ hàng → Đọc từ **localStorage**
3. User chỉnh sửa số lượng → Cập nhật **localStorage**

### Khi vừa đăng nhập:
1. Hook `useCart` phát hiện trạng thái đăng nhập
2. Tự động **merge** giỏ hàng từ localStorage lên server
3. Xóa localStorage sau khi sync thành công
4. Hiển thị giỏ hàng từ server

### Khi thanh toán:
1. User click "Thanh toán"
2. Hệ thống kiểm tra đăng nhập
3. Nếu **chưa đăng nhập**: redirect về `/dang-nhap?redirect=/thanh-toan`
4. Sau khi đăng nhập: giỏ hàng được merge và redirect về checkout

## 🗄️ Cấu trúc dữ liệu localStorage

**Key:** `marketpro_cart`

**Format:**
```json
[
  {
    "id_bienthesp": 123,
    "quantity": 2
  },
  {
    "id_bienthesp": 456,
    "quantity": 1
  }
]
```

## 🎯 Lợi ích

✅ **UX tốt hơn**: User không bị gián đoạn khi mua sắm  
✅ **Tăng conversion**: Giảm friction trong quá trình mua hàng  
✅ **Dữ liệu không mất**: Giỏ hàng được lưu trữ local  
✅ **Đồng bộ tự động**: Khi đăng nhập, giỏ hàng được merge  
✅ **Bảo mật**: Chỉ yêu cầu đăng nhập khi thanh toán  

## 🧪 Test cases

### Test 1: Thêm vào giỏ khi chưa đăng nhập
1. Chưa đăng nhập
2. Thêm sản phẩm vào giỏ
3. Kiểm tra localStorage có dữ liệu
4. Kiểm tra số lượng hiển thị trên header

### Test 2: Xem giỏ hàng khi chưa đăng nhập
1. Có sản phẩm trong localStorage
2. Vào trang `/gio-hang`
3. Kiểm tra hiển thị đầy đủ thông tin (có thể thiếu ảnh/giá)

### Test 3: Đăng nhập với giỏ hàng có sẵn
1. Có 2 sản phẩm trong localStorage
2. Đăng nhập
3. Kiểm tra giỏ hàng trên server có 2 sản phẩm
4. Kiểm tra localStorage đã bị xóa

### Test 4: Thanh toán khi chưa đăng nhập
1. Có sản phẩm trong giỏ
2. Click "Thanh toán"
3. Redirect về `/dang-nhap?redirect=/thanh-toan`
4. Đăng nhập
5. Redirect về `/thanh-toan`
6. Giỏ hàng vẫn còn

## 📝 Lưu ý quan trọng

⚠️ **Hiển thị sản phẩm trong giỏ local:**  
Khi chưa đăng nhập, giỏ hàng chỉ lưu `id_bienthesp` và `quantity`. Để hiển thị đầy đủ thông tin (tên, ảnh, giá), bạn cần:
- Fetch thông tin sản phẩm từ API public (không cần auth)
- Hoặc cache thông tin sản phẩm khi thêm vào giỏ

⚠️ **Cookie authentication:**  
Hàm `isUserLoggedIn()` trong `cartClient.ts` hiện check cookie `authToken`. Nếu hệ thống dùng cách khác, cần cập nhật.

⚠️ **Số lượng tồn kho:**  
LocalStorage không validate số lượng tồn kho. Cần validate khi thanh toán.

## 🚀 Các cải tiến có thể thêm

1. **Lưu thông tin sản phẩm đầy đủ vào localStorage**
2. **Expire giỏ hàng sau X ngày**
3. **Sync giỏ hàng qua devices** (nếu có account)
4. **Thông báo khi sản phẩm hết hàng**
5. **Gợi ý đăng nhập** với benefits rõ ràng

## 📞 Hỗ trợ

Nếu có vấn đề, kiểm tra:
- Console log có lỗi gì không
- LocalStorage có key `marketpro_cart` không
- API `/api/v1/gio-hang` hoạt động bình thường không
- Event `cart:updated` có được trigger không
