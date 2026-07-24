import { ExpertiseProvider } from "@/components/providers/ExpertiseProvider";
import { VisitProvider } from "@/components/providers/VisitProvider";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { HtmlLang } from "@/components/layout/HtmlLang";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <ExpertiseProvider>
        <VisitProvider>
          <HtmlLang />
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </VisitProvider>
      </ExpertiseProvider>
    </NextIntlClientProvider>
  );
}
