import { getConcept } from "@/lib/content/atlas";
import { ImageResponse } from "next/og";

export const alt = "CLAREZA Atlas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const concept = getConcept(slug);
  const pt = locale === "pt";
  const title = concept ? (pt ? concept.titlePt : concept.titleEn) : slug;
  const summary = concept
    ? pt
      ? concept.summaryPt
      : concept.summaryEn
    : "";
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
            fontSize: 24,
            letterSpacing: 6,
            color: "#7dd3fc",
            marginBottom: 24,
          }}
        >
          CLAREZA · ATLAS
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
          {title}
        </div>
        <div
          style={{
            fontSize: 30,
            color: "#94a3b8",
            marginTop: 24,
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {summary}
        </div>
      </div>
    ),
    { ...size },
  );
}
