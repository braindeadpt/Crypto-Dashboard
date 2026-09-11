import { ImageResponse } from "next/og";

export const alt = "CLAREZA Crypto — Observatório de mercado";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pt = locale === "pt";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#0b1220",
          color: "#e8edf5",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 6,
            color: "#7dd3fc",
            marginBottom: 24,
          }}
        >
          CLAREZA CRYPTO
        </div>
        <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>
          {pt ? "Observatório de mercado" : "Market observatory"}
        </div>
        <div style={{ fontSize: 34, color: "#94a3b8", marginTop: 24 }}>
          {pt
            ? "O briefing diário · causas, não só preços · PT-PT"
            : "The daily briefing · causes, not just prices · PT-PT / EN"}
        </div>
      </div>
    ),
    { ...size },
  );
}
