"use client";
import React from "react";

const items: { icon: string; title: string; subtitle: string }[] = [
  // { icon: "ph ph-truck", title: "Free Shipping", subtitle: "Free shipping all over the US" },
  // { icon: "ph ph-handshake", title: "100% Satisfaction", subtitle: "Free shipping all over the US" },
  // { icon: "ph ph-credit-card", title: "Secure Payments", subtitle: "Free shipping all over the US" },
  // { icon: "ph ph-headset", title: "24/7 Support", subtitle: "Free shipping all over the US" },
];

export default function BenefitsStrip() {
  return (
    <section className="py-32" style={{ marginTop: 8, marginBottom: 8 }}>
      <div className="container container-lg">
        <div className="row g-3 g-md-4 g-lg-4">
          {items.map((it, idx) => (
            <div className="col-12 col-sm-6 col-lg-3" key={idx}>
              <div
                className="gap-12 benefit-tile d-flex align-items-center w-100"
                style={{ borderRadius: 12, padding: "18px 20px", minHeight: 92, boxShadow: "0 1px 0 rgba(0,0,0,0.02)" }}
              >
                <span
                  className="text-white icon-circle flex-center"
                  style={{ width: 40, height: 40, borderRadius: 9999, background: "#e6583e", display: "inline-flex", transition: "background-color 220ms ease, transform 220ms ease" }}
                >
                  <i className={`${it.icon}`}></i>
                </span>
                <div className="flex-grow-1">
                  <div className="fw-semibold" style={{ color: "#16203A" }}>{it.title}</div>
                  <div className="text-sm" style={{ color: "#6b7280" }}>{it.subtitle}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .benefit-tile { 
          background: #fff1ef; 
          transition: background-color 220ms ease, box-shadow 220ms ease, transform 220ms ease; 
        }
        .benefit-tile:hover { 
          background: #ffd6cf; /* stronger light-orange hover */
          box-shadow: 0 6px 18px rgba(230, 88, 62, 0.16);
        }
        .benefit-tile:hover .icon-circle {
          background: #e4533a;
          transform: translateY(-1px);
        }
      `}</style>
    </section>
  );
}
