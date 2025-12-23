// Types cho đơn hàng - dựa trên API response

export interface OrderItem {
    id: number;
    id_bienthe: number;
    id_donhang: number;
    tensanpham?: string;
    name?: string;
    tenbienthe?: string;
    tenloaibienthe?: string;
    soluong?: number;
    quantity?: number;
    dongia?: number;
    price?: number;
    hinhanh?: string;
    deleted_at?: string | null;
    bienthe?: {
        id: number;
        id_loaibienthe: number;
        id_sanpham: number;
        giagoc: number;
        giadagiam?: number;
        soluong: number;
        luottang?: number;
        luotban?: number;
        trangthai: string;
        hinhanh?: string;
        tenloaibienthe?: string;
        deleted_at?: string | null;
        sanpham?: {
            id: number;
            id_thuonghieu?: number;
            ten: string;
            slug: string;
            mota?: string;
            xuatxu?: string;
            sanxuat?: string;
            trangthai?: string;
            giamgia?: number;
            luotxem?: number;
            hinhanh?: string;
            hinhanhsanpham?: { id?: number; hinhanh?: string }[];
            deleted_at?: string | null;
        };
        loaibienthe?: {
            id: number;
            ten: string;
            trangthai?: string;
        };
    };
}

export interface Order {
    id: number;
    id_nguoidung: number;
    id_diachinguoidung?: number;
    id_phivanchuyen?: number;
    id_phuongthuc?: number;
    id_magiamgia?: number | null;
    madon: string;
    nguoinhan?: string;
    diachinhan?: string;
    khuvucgiao?: string;
    hinhthucvanchuyen?: string;
    phigiaohang?: number;
    hinhthucthanhtoan?: string;
    sodienthoai?: string;
    mavoucher?: string | null;
    giagiam?: number;
    tamtinh?: string | number;
    thanhtien: number;
    trangthaithanhtoan?: string;
    trangthai?: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
    chitietdonhang?: OrderItem[];
    phivanchuyen?: {
        id: number;
        ten: string;
        phi: string | number;
        trangthai?: string;
    };
}

export interface OrderGroup {
    donhang?: Order[];
}

export interface DetailedOrder extends Order {
    diachigiaohang?: {
        hoten?: string;
        diachi?: string;
        sodienthoai?: string;
        tinhthanh?: string;
    };
    phuongthuc?: {
        id?: number;
        ten?: string;
        ma_phuongthuc?: string;
    };
    magiamgia?: {
        ma?: string;
        giatri?: number;
    };
}
