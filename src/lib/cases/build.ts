import type { CaseFile, Mover, SentimentSnapshot } from "@/lib/types";

export function buildCaseFile(
  mover: Mover,
  sentiment?: SentimentSnapshot | null,
): CaseFile {
  const up = mover.change24h >= 0;
  const abs = Math.abs(mover.change24h);

  const hypotheses = up
    ? [
        {
          labelPt: "Fluxo especulativo / narrativa de curto prazo",
          labelEn: "Speculative flow / short-term narrative",
          confidence: abs > 8 ? 0.55 : 0.4,
        },
        {
          labelPt: "Short squeeze ou funding positivo extremo",
          labelEn: "Short squeeze or extreme positive funding",
          confidence: sentiment?.funding.bias === "long" ? 0.5 : 0.3,
        },
        {
          labelPt: "Catalisador fundamental (listagem, parceria, upgrade)",
          labelEn: "Fundamental catalyst (listing, partnership, upgrade)",
          confidence: 0.25,
        },
      ]
    : [
        {
          labelPt: "Risco de mercado amplo / correlação com BTC",
          labelEn: "Broad market risk / BTC correlation",
          confidence: 0.45,
        },
        {
          labelPt: "Liquidação de longs ou funding negativo",
          labelEn: "Long liquidations or negative funding",
          confidence:
            sentiment?.liquidationWeather.bias === "long" ? 0.55 : 0.35,
        },
        {
          labelPt: "Evento específico (hack, unlock, regulação)",
          labelEn: "Idiosyncratic event (hack, unlock, regulation)",
          confidence: 0.3,
        },
      ];

  hypotheses.sort((a, b) => b.confidence - a.confidence);

  const evidence: CaseFile["evidence"] = [
    {
      id: "chg",
      label: "Variação 24h",
      labelEn: "24h change",
      value: `${up ? "+" : ""}${mover.change24h.toFixed(2)}%`,
      tone: up ? "up" : "down",
    },
    {
      id: "vol",
      label: "Volume 24h",
      labelEn: "24h volume",
      value: `$${(mover.volume24h / 1e6).toFixed(1)}M`,
      tone: "neutral",
    },
  ];

  if (sentiment) {
    evidence.push({
      id: "fng",
      label: "Medo & Ganância",
      labelEn: "Fear & Greed",
      value: String(sentiment.fearGreed.value),
      tone: "warn",
    });
    evidence.push({
      id: "fund",
      label: "Funding BTC",
      labelEn: "BTC funding",
      value: `${(sentiment.funding.rate * 100).toFixed(4)}%`,
      tone: "neutral",
    });
  }

  return {
    id: mover.caseId ?? `case-${mover.id}`,
    assetId: mover.id,
    symbol: mover.symbol,
    observationPt: `${mover.name} (${mover.symbol}) variou ${up ? "+" : ""}${mover.change24h.toFixed(2)}% nas últimas 24h, a ~$${mover.price.toLocaleString("en")}.`,
    observationEn: `${mover.name} (${mover.symbol}) moved ${up ? "+" : ""}${mover.change24h.toFixed(2)}% in the last 24h, near $${mover.price.toLocaleString("en")}.`,
    change24h: mover.change24h,
    price: mover.price,
    hypotheses,
    evidence,
    conclusionPt: `${hypotheses[0].labelPt} é a hipótese líder (${Math.round(hypotheses[0].confidence * 100)}%), mas permanece provisória até cruzar notícias e liquidez.`,
    conclusionEn: `${hypotheses[0].labelEn} leads (${Math.round(hypotheses[0].confidence * 100)}%), but stays provisional until news and liquidity are cross-checked.`,
    quiz: {
      questionPt: "O que NÃO deves fazer ao ver um movimento >8%?",
      questionEn: "What should you NOT do when seeing an >8% move?",
      optionsPt: [
        "Abrir a análise e comparar evidências",
        "Aumentar imediatamente a posição por FOMO",
        "Verificar funding e volume",
        "Ler o brief editorial do dia",
      ],
      optionsEn: [
        "Open the case analysis and compare evidence",
        "Immediately size up from FOMO",
        "Check funding and volume",
        "Read today's editorial brief",
      ],
      answerIndex: 1,
    },
    createdAt: new Date().toISOString(),
  };
}

export function buildDailyCases(
  movers: Mover[],
  sentiment?: SentimentSnapshot | null,
): CaseFile[] {
  const pool = [...movers].sort(
    (a, b) => Math.abs(b.change24h) - Math.abs(a.change24h),
  );
  return pool.slice(0, 3).map((m) => buildCaseFile(m, sentiment));
}
