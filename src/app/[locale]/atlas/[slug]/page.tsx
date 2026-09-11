import { AtlasArticle } from "@/components/desk/AtlasArticle";
import { ATLAS, getConcept } from "@/lib/content/atlas";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

export function generateStaticParams() {
  return ATLAS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const concept = getConcept(slug);
  if (!concept) return {};
  const pt = locale === "pt";
  return {
    title: `${pt ? concept.titlePt : concept.titleEn} — CLAREZA`,
    description: pt ? concept.summaryPt : concept.summaryEn,
  };
}

export default async function AtlasSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const concept = getConcept(slug);
  const pt = locale === "pt";
  const jsonLd = concept
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: pt ? concept.titlePt : concept.titleEn,
        description: pt ? concept.summaryPt : concept.summaryEn,
        inLanguage: pt ? "pt-PT" : "en",
        isPartOf: { "@type": "WebSite", name: "CLAREZA Crypto" },
      }
    : null;
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <AtlasArticle slug={slug} />
    </>
  );
}
