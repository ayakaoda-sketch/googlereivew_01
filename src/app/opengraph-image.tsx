import { ImageResponse } from "next/og";

// Link preview image (Open Graph / Twitter). A fixed design, not live numbers:
// it is generated once at build time and cached by the platforms that show it.

export const alt = "Google Review Dashboard — Wolhwa Galbi & KODOKODO, Philippines";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STAR = "M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z";

function Stars({ color, size: px }: { color: string; size: number }) {
  return (
    <div style={{ display: "flex", gap: px * 0.15 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width={px} height={px} viewBox="0 0 24 24">
          <path d={STAR} fill={color} />
        </svg>
      ))}
    </div>
  );
}

function BrandCard({ name, stores, bg, accent }: { name: string; stores: string; bg: string; accent: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        background: bg,
        border: "2px solid #e6e5e1",
        borderRadius: 24,
        padding: "28px 32px",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: 2, color: accent }}>
        {name.toUpperCase()}
      </div>
      <Stars color="#0b0b0b" size={30} />
      <div style={{ display: "flex", fontSize: 24, color: "#52514e" }}>{stores}</div>
    </div>
  );
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f6f6f4",
          padding: "64px 72px",
          fontFamily: "sans-serif",
          color: "#0b0b0b",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 4, color: "#898781" }}>
            PHILIPPINES · DAILY GOOGLE REVIEWS
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>
            Google Review Dashboard
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#52514e" }}>
            New reviews, low ratings and cumulative scores for every store, every day.
          </div>
        </div>

        <div style={{ display: "flex", gap: 28 }}>
          <BrandCard name="Wolhwa Galbi" stores="5 stores" bg="#fdf0f0" accent="#c23434" />
          <BrandCard name="KODOKODO" stores="1 store" bg="#fff3e6" accent="#b77900" />
        </div>
      </div>
    ),
    size,
  );
}
