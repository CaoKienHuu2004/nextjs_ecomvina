"use client";
import React from "react";

export default function DiscountStrip() {
  const pinkBg = "#ffefed"; // Preset B background
  const dashed = "#f1b7b0"; // Preset B dashed border
  const text = "#c74635"; // text color
  return (
    <section style={{ padding: "12px 0 28px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
        <div
          style={{
            background: pinkBg,
            border: `1px dashed ${dashed}`,
            color: text,
            borderRadius: 14,
            padding: "12px 20px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* Left text (centered) */}
            <div style={{ textAlign: "center", fontSize: 14, opacity: 0.95 }}>
              Super discount for your {" "}
              <a href="#" style={{ color: text, fontWeight: 700, textDecoration: "underline" }}>first purchase</a>
            </div>

            {/* Middle code pill */}
            <button
              type="button"
              style={{
                justifySelf: "center",
                background: "#e4533a",
                color: "#fff",
                border: 0,
                borderRadius: 9999,
                padding: "9px 18px",
                fontWeight: 700,
                letterSpacing: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
              onClick={() => navigator.clipboard?.writeText("FREE25BAC").catch(() => { })}
              aria-label="Copy discount code"
              title="Copy discount code"
            >
              FREE25BAC
              {/* small clipboard icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M9 6h6a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8a2 2 0 012-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 4h6v2H9V4z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Right helper text (right aligned) */}
            <div style={{ textAlign: "right", fontSize: 14, opacity: 0.9 }}>
              Use discount code to get <strong>20%</strong> discount for any item
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
