import { ATLAS } from "@/lib/content/atlas";
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const LOCALES = ["pt", "en"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    { path: "", priority: 1, changeFrequency: "hourly" as const },
    { path: "/mundo", priority: 0.8, changeFrequency: "hourly" as const },
    { path: "/fluxos", priority: 0.8, changeFrequency: "hourly" as const },
    { path: "/contexto", priority: 0.7, changeFrequency: "daily" as const },
    { path: "/instrumento", priority: 0.6, changeFrequency: "hourly" as const },
    { path: "/carteira", priority: 0.6, changeFrequency: "daily" as const },
    { path: "/brief", priority: 0.6, changeFrequency: "hourly" as const },
  ];

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of LOCALES) {
    for (const p of staticPaths) {
      entries.push({
        url: `${BASE_URL}/${locale}${p.path}`,
        lastModified: new Date(),
        changeFrequency: p.changeFrequency,
        priority: p.priority,
      });
    }
    for (const concept of ATLAS) {
      entries.push({
        url: `${BASE_URL}/${locale}/atlas/${concept.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }
  return entries;
}
