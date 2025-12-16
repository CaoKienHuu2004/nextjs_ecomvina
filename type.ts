// Feature (danh mục tròn dưới banner)
const feature = $(".feature-item-wrapper");
if (feature.length && !feature.hasClass("slick-initialized") && feature.slick) {
  feature.slick({
    slidesToShow: 10,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: document.documentElement.getAttribute("dir") === "rtl",
    speed: 700,
    infinite: true,
    nextArrow: "#feature-item-wrapper-next",
    prevArrow: "#feature-item-wrapper-prev",
    responsive: [
      { breakpoint: 1599, settings: { slidesToShow: 9, arrows: false } },
      { breakpoint: 1399, settings: { slidesToShow: 8, arrows: false } },
      { breakpoint: 1199, settings: { slidesToShow: 7, arrows: false } },
      { breakpoint: 991,  settings: { slidesToShow: 6, arrows: false } },
      { breakpoint: 767,  settings: { slidesToShow: 5, arrows: false } },
      { breakpoint: 575,  settings: { slidesToShow: 4, arrows: false } },
      { breakpoint: 424,  settings: { slidesToShow: 3, arrows: false } },
      { breakpoint: 359,  settings: { slidesToShow: 2, arrows: false } },
    ],
  } as Record<string, unknown>);
}
