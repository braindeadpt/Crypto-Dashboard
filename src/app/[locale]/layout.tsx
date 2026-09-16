import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { SkipLink } from "@/components/layout/SkipLink";
import { HtmlLang } from "@/components/layout/HtmlLang";
import { EntryOnce } from "@/components/layout/EntryOnce";
import { ViewTransition } from "react";
import { ExpertiseProvider } from "@/components/expertise/ExpertiseProvider";
import { WatchlistProvider } from "@/components/watchlist/WatchlistProvider";
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
        <WatchlistProvider>
          <HtmlLang />
          <EntryOnce />
          <SkipLink />
          <div className="flex min-h-screen w-full min-w-0 flex-col">
            <SiteHeader />
            <main id="main" className="w-full min-w-0 flex-1" tabIndex={-1}>
              {/* Transições de página: nav-forward/nav-back chegam dos Links
                  marcados; refresh de dados e montagens sem tipo não animam. */}
              <ViewTransition
                enter={{
                  "nav-forward": "nav-forward",
                  "nav-back": "nav-back",
                  default: "none",
                }}
                exit={{
                  "nav-forward": "nav-forward",
                  "nav-back": "nav-back",
                  default: "none",
                }}
                default="none"
              >
                <div>{children}</div>
              </ViewTransition>
            </main>
            <SiteFooter />
          </div>
        </WatchlistProvider>
      </ExpertiseProvider>
    </NextIntlClientProvider>
  );
}
