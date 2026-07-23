# CLAREZA — Market Orientation Desk

**Um briefing. Duas línguas. Zero ruído.**

CLAREZA is not another price grid. It is a bilingual (PT-PT / EN) daily **market orientation desk**: Front Page ritual → Desk destinations → Lab depth. Built as a portfolio-grade product for learning and daily comprehension — no login, no trade signals.

## Product thesis

People open CoinGecko + TradingView + Fear&Greed + Coinglass + DefiLlama + X + local news every morning. CLAREZA owns the job those tabs cannot: *what happened, what it means, and what to understand today*.

### Original mechanics

1. **Front Page** — fixed ~5‑minute briefing (Posture, Delta Desk, headline, slate, coffee lesson, anti-hype “Don’t”)
2. **Cause & Effect** — case files for top movers (hypotheses → evidence → provisional conclusion → quiz)
3. **Expertise Dial** — Citizen / Operator / Analyst density on the same product
4. **Explain This Number** — value → meaning → method → source on every metric
5. **Portugal lane** — MiCA / CMVM literacy beside the market

## Stack

- Next.js App Router + TypeScript + Tailwind CSS v4
- `next-intl` (PT-PT default + EN)
- Free data: CoinGecko, Binance Futures public, DefiLlama, Alternative.me
- Optional LLM brief enrichment via `OPENAI_API_KEY`

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000/pt](http://localhost:3000/pt) (or `/en`).

### Optional LLM

Copy `.env.example` → `.env.local` and set `OPENAI_API_KEY` to enrich `/api/brief`. Without a key, a high-quality deterministic brief is always available.

## Routes

| Path | Desk |
|------|------|
| `/[locale]` | Front Page ritual |
| `/[locale]/mercado` | Live market |
| `/[locale]/ciclo` | 4-year cycle + Bitcoin timeline |
| `/[locale]/sentimento` | Fear&Greed, funding, OI, liquidation weather |
| `/[locale]/defi` | TVL, protocols, stablecoins |
| `/[locale]/brief` | Editorial brief |
| `/[locale]/portugal` | MiCA / CMVM orientation |
| `/[locale]/atlas` | Concept curriculum |
| `/[locale]/caso/[id]` | Cause & Effect case file |
| `/[locale]/lab` | Analyst condensed view |

## Architecture

```
src/
  app/[locale]/     # UI routes
  app/api/          # BFF + cache boundary
  components/       # Front, desk, explain, layout
  lib/data/         # API clients + bundles
  lib/regime/       # Posture engine (documented weights)
  lib/editorial/    # Brief builder + LLM hook
  lib/content/      # Atlas, timeline, Portugal
  lib/cases/        # Case file builder
messages/           # pt.json + en.json
```

## Disclaimer

Educational market orientation only. Not financial advice. Liquidation weather is an **educational estimate** from public Binance futures data, not Coinglass-grade exchange heatmaps.

## Roadmap (continuity)

Phase 2: local watchlist / Trilho, decision journal, ETF flows, credibility dial  
Phase 3: optional auth, public portfolio addresses, PDF brief export
