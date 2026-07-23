import { AtlasIndex } from "@/components/desk/AtlasIndex";
import { setRequestLocale } from "next-intl/server";

export default async function AtlasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AtlasIndex />;
}
