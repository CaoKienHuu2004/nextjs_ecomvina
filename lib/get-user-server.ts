import { cookies } from "next/headers";
import { AuthUser } from "@/hooks/useAuth";

const API_URL = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";

export async function getUserFromServer(): Promise<AuthUser | null> {
  // 1. Đọc cookie "access_token" ngay trên server Next.js
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return null;

  try {
    // 2. Gọi API Laravel để lấy thông tin user (Server-to-Server)
    // Thêm AbortController để timeout sau 5 giây
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${API_URL}/api/v1/thong-tin-ca-nhan`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store", // Quan trọng: Không cache để dữ liệu luôn mới
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();

    // 3. Map dữ liệu từ API Laravel sang kiểu AuthUser của bạn
    // Cấu trúc API Laravel trả về: { success: true, user: { ... } }
    const rawUser = data?.user || null;

    if (!rawUser) return null;

    return {
      id: rawUser.id,
      username: rawUser.username ?? rawUser.email,
      hoten: rawUser.hoten ?? rawUser.name,
      sodienthoai: rawUser.sodienthoai ?? rawUser.phone,
      gioitinh: rawUser.gioitinh,
      ngaysinh: rawUser.ngaysinh,
      avatar: rawUser.avatar,
      danh_sach_diachi: rawUser.danh_sach_diachi,
    };
  } catch (error) {
    // Không log lỗi ồn ào khi server không khả dụng
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn("[getUserFromServer] API timeout - server may be unavailable");
    } else {
      console.warn("[getUserFromServer] Failed to fetch user:", error instanceof Error ? error.message : "Unknown error");
    }
    return null;
  }
}
