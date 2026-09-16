import { ATLAS } from "@/lib/content/atlas";
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const LOCALES = ["pt", "en"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    { path: "", priority: 1, changeFrequency: "hourly" as const },
    { path: "/mercado", priority: 0.9, changeFrequency: "hourly" as const },
    { path: "/casos", priority: 0.8, changeFrequency: "hourly" as const },
    { path: "/fluxos", priority: 0.8, changeFrequency: "hourly" as const },
    { path: "/defi", priority: 0.7, changeFrequency: "hourly" as const },
    { path: "/cadeias", priority: 0.7, changeFrequency: "hourly" as const },
    { path: "/aprender", priority: 0.7, changeFrequency: "daily" as const },
    { path: "/mesa", priority: 0.6, changeFrequency: "hourly" as const },
    { path: "/ferramentas", priority: 0.6, changeFrequency: "daily" as const },
    { path: "/brief", priority: 0.6, changeFrequency: "hourly" as const },
    { path: "/metodologia", priority: 0.4, changeFrequency: "monthly" as const },
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
