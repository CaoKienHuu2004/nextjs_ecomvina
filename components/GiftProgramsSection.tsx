"use client";
import { useGiftPrograms } from "@/hooks/useGiftPrograms";
import Image from "next/image";
import Link from "next/link";

export default function GiftProgramsSection() {
    const {
        programs,
        loading,
        error,
        totalPrograms,
        activePrograms,
        expiringSoonPrograms,
    } = useGiftPrograms();

    if (loading) {
        return (
            <section className="gift-programs-section py-32">
                <div className="container">
                    <div className="text-center">
                        <div className="spinner-border text-main-600" role="status">
                            <span className="visually-hidden">Đang tải...</span>
                        </div>
                        <p className="mt-16">Đang tải chương trình quà tặng...</p>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="gift-programs-section py-32">
                <div className="container">
                    <div className="alert alert-danger">
                        <i className="ph ph-warning me-8"></i>
                        {error}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="gift-programs-section py-32">
            <div className="container">
                {/* Header */}
                <div className="section-heading mb-24">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-16">
                        <div className="d-flex align-items-center gap-16">
                            <div className="gift-icon bg-main-600 text-white rounded-circle d-flex align-items-center justify-content-center">
                                <i className="ph ph-gift text-2xl"></i>
                            </div>
                            <div>
                                <h5 className="mb-0 fw-bold">Chương Trình Quà Tặng</h5>
                                <p className="text-gray-600 mb-0 text-sm">
                                    <span className="text-main-600 fw-semibold">{totalPrograms}</span> chương trình đang diễn ra
                                    {expiringSoonPrograms.length > 0 && (
                                        <span className="text-warning ms-8">
                                            • {expiringSoonPrograms.length} sắp hết hạn
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <Link href="/qua-tang" className="btn btn-outline-main-600 btn-sm d-flex align-items-center gap-8">
                            Xem tất cả
                            <i className="ph ph-arrow-right"></i>
                        </Link>
                    </div>
                </div>

                {/* Programs Grid */}
                {programs.length === 0 ? (
                    <div className="text-center py-32">
                        <i className="ph ph-gift text-gray-300 gift-icon-large"></i>
                        <p className="text-gray-500 mt-16">Chưa có chương trình quà tặng nào</p>
                    </div>
                ) : (
                    <div className="row g-16">
                        {programs.slice(0, 4).map((program) => (
                            <div key={program.id} className="col-xl-3 col-lg-4 col-md-6">
                                <div className="gift-program-card border border-gray-100 rounded-16 overflow-hidden h-100 hover-shadow-lg transition-all">
                                    {/* Image */}
                                    <div className="position-relative gift-image-wrapper">
                                        <Image
                                            src={program.hinhanh.startsWith('http') ? program.hinhanh : `https://sieuthivina.cloud/assets/client/images/thumbs/${program.hinhanh}`}
                                            alt={program.tieude}
                                            fill
                                            className="object-fit-cover"
                                            sizes="(max-width: 768px) 100vw, 25vw"
                                        />
                                        {/* Badge thời gian còn lại */}
                                        <div className="position-absolute top-8 end-8">
                                            <span className={`badge ${program.thoigian_conlai <= 7 ? 'bg-warning' : 'bg-success'}`}>
                                                <i className="ph ph-clock me-4"></i>
                                                Còn {program.thoigian_conlai} ngày
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-16">
                                        {/* Brand */}
                                        <div className="d-flex align-items-center gap-8 mb-8">
                                            <Image
                                                src={program.thongtin_thuonghieu.logo_thuonghieu}
                                                alt={program.thongtin_thuonghieu.ten_thuonghieu}
                                                width={20}
                                                height={20}
                                                className="rounded-circle"
                                            />
                                            <span className="text-xs text-gray-600 text-truncate">
                                                {program.thongtin_thuonghieu.ten_thuonghieu}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h6 className="fw-semibold mb-8 line-clamp-2 gift-title">
                                            <Link href={`/qua-tang/${program.slug}`} className="text-gray-900 hover-text-main-600">
                                                {program.tieude}
                                            </Link>
                                        </h6>

                                        {/* Conditions */}
                                        <div className="d-flex flex-column gap-4 mb-12">
                                            <div className="d-flex align-items-center gap-8 text-sm">
                                                <i className="ph ph-shopping-cart text-main-600"></i>
                                                <span>Mua <strong>{program.dieukiensoluong}</strong> sản phẩm</span>
                                            </div>
                                            <div className="d-flex align-items-center gap-8 text-sm">
                                                <i className="ph ph-currency-circle-dollar text-main-600"></i>
                                                <span>Hoặc từ <strong>{program.dieukiengiatri.toLocaleString()}đ</strong></span>
                                            </div>
                                        </div>

                                        {/* Views */}
                                        <div className="d-flex align-items-center justify-content-between text-xs text-gray-500">
                                            <span>
                                                <i className="ph ph-eye me-4"></i>
                                                {program.luotxem} lượt xem
                                            </span>
                                            <span>
                                                {new Date(program.ngaybatdau).toLocaleDateString('vi-VN')} - {new Date(program.ngayketthuc).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary Stats */}
                <div className="mt-24 p-16 bg-gray-50 rounded-16">
                    <div className="row g-16 text-center">
                        <div className="col-md-3 col-6">
                            <div className="fw-bold text-2xl text-main-600">{totalPrograms}</div>
                            <div className="text-sm text-gray-600">Tổng chương trình</div>
                        </div>
                        <div className="col-md-3 col-6">
                            <div className="fw-bold text-2xl text-success">{activePrograms.length}</div>
                            <div className="text-sm text-gray-600">Đang hoạt động</div>
                        </div>
                        <div className="col-md-3 col-6">
                            <div className="fw-bold text-2xl text-warning">{expiringSoonPrograms.length}</div>
                            <div className="text-sm text-gray-600">Sắp hết hạn (&lt;7 ngày)</div>
                        </div>
                        <div className="col-md-3 col-6">
                            <div className="fw-bold text-2xl text-info">
                                {programs.reduce((sum, p) => sum + p.luotxem, 0).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">Tổng lượt xem</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
