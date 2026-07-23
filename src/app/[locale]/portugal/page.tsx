import { PortugalDesk } from "@/components/desk/PortugalDesk";
import { setRequestLocale } from "next-intl/server";

export default async function PortugalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PortugalDesk />;
}
