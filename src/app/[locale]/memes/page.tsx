import { MemesDesk } from "@/components/desk/MemesDesk";
import { fetchMemeMarkets } from "@/lib/data/coingecko";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 120;

export default async function MemesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const memes = await fetchMemeMarkets(40).catch(() => []);

  const hot = memes.filter(
    (m) => Math.abs(m.change24h) > 15 || m.volume24h > m.marketCap * 0.35,
  );
  const solish = hot.filter((m) =>
    /bonk|wif|popcat|mew|pnut|trump|fartcoin|goat|ai16z/i.test(
      `${m.id} ${m.symbol} ${m.name}`,
    ),
  ).length;

  const frenzyNote =
    locale === "pt"
      ? solish >= 2
        ? "Actividade elevada · ênfase actual em Solana (volume + nomes em destaque). Vista multichain activa, com fluxo concentrado onde há liquidez."
        : hot.length >= 2
          ? "Actividade dispersa · ordenação multichain por volume. Sem concentração dominante em Solana neste momento."
          : "Sem pico extremo · lista ordenada por volume (categoria meme CoinGecko)."
      : solish >= 2
        ? "Smart frenzy · current emphasis on Solana (volume + hot names). Multichain on, flow follows liquidity."
        : hot.length >= 2
          ? "Scattered frenzy · multichain by volume. No dominant Solana cluster right now."
          : "No extreme frenzy · list ranked by volume (CoinGecko meme category).";

  return <MemesDesk memes={memes} frenzyNote={frenzyNote} />;
}
