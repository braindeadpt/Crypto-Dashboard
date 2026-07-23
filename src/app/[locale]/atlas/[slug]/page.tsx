import { AtlasArticle } from "@/components/desk/AtlasArticle";
import { ATLAS } from "@/lib/content/atlas";
import { setRequestLocale } from "next-intl/server";

export function generateStaticParams() {
  return ATLAS.map((c) => ({ slug: c.slug }));
}

export default async function AtlasSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  return <AtlasArticle slug={slug} />;
}
