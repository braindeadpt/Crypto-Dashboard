# CLAREZA — Crypto Market Observatory

**O mercado inteiro em segundos. Duas línguas. Zero ruído.**

CLAREZA is not another price grid. It is a bilingual (PT-PT / EN) **crypto market observatory** for the Portuguese-speaking market: a daily orientation desk where Bitcoin leads, every page has one job, and nothing is invented. No login, no trade signals, no hype.

The full product & design plan lives in [`docs/PLANO-CLAREZA.md`](docs/PLANO-CLAREZA.md).

## Product thesis

People open CoinGecko + TradingView + Fear&Greed + Coinglass + DefiLlama + X + local news every morning. CLAREZA owns the job those tabs cannot: *see the whole market at a glance, understand what happened, and know what it means today*.

### Original mechanics

1. **Front Page** — fixed ~5‑minute briefing (Posture, Delta Desk, headline, slate, coffee lesson, anti-hype “Don’t”)
2. **Cause & Effect** — case files for top movers (hypotheses → evidence → provisional conclusion → quiz)
3. **Expertise Dial** — Citizen / Operator / Analyst density on the same product
4. **Explain This Number** — value → meaning → method → source on every metric
5. **Portugal lane** — MiCA / CMVM literacy beside the market

## Stack

- Next.js App Router + TypeScript + Tailwind CSS v4
- `next-intl` (PT-PT default + EN)
- Free data: CoinGecko, Binance Futures public, DefiLlama, Alternative.me (Fear & Greed), mempool.space (Bitcoin), Etherscan API V2 (EVM), Farside (ETF flows)
- Optional LLM brief enrichment via `OPENAI_API_KEY`

## Run locally

```bash
npm install
npx playwright install chromium
npm run dev
```

Open [http://localhost:3000/pt](http://localhost:3000/pt) (or `/en`).

### Quality gate (local)

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e   # sobe `next start` e corre smoke Playwright
```

Ou tudo: `npm run ci`.

### Snapshots DefiLlama (pesados)

`yields.llama.fi/pools` (~11MB) e `api.llama.fi/protocols` (~8MB) **não** entram no render.
Ingestão separada escreve blobs reduzidos em `data/snapshots/`:

```bash
npm run snapshots:refresh
# ou POST /api/cron/refresh-heavy  (Authorization: Bearer $CRON_SECRET)
```

**Ingestão agendada** — `.github/workflows/ingest.yml` corre o refresh todos os
dias às 05:17 UTC (hora fora do pico de rate-limit da CoinGecko) e commita os
snapshots actualizados. É o que faz crescer as séries sem backfill gratuito
(`fee_btc`, `breadth`, `btc_dominance`, história de sectores) — sem este job
ficam congeladas no comprimento do bootstrap. Accionar à mão: separador
*Actions → Ingest snapshots → Run workflow*, ou `npm run snapshots:refresh`
local. Opcional: definir o secret `COINGECKO_DEMO_API_KEY` no repositório para
reduzir 429s. Em produção, a alternativa é fazer POST a
`/api/cron/refresh-heavy` do site publicado (ver comentário no workflow).

Notas de robustez: cada fonte é isolada — um falhanço não aborta as restantes
nem escreve um snapshot truncado por cima de um bom (a escrita é por nome e só
acontece em sucesso). A história de sectores **não tem backfill possível**:
`/coins/categories` da CoinGecko só devolve o snapshot actual, não há endpoint
de histórico de categorias no plano gratuito/Demo — a Rotação acumula apenas
via cron diário.

CI no GitHub (push/PR a `master`): lint → typecheck → build → smoke E2E.  
PRs usam o template com **checklist de auditoria** (copy PT, estrutura, estados de erro, i18n).

### Optional LLM

Copy `.env.example` → `.env.local` and set `OPENAI_API_KEY` to enrich `/api/brief`. Without a key, a high-quality deterministic brief is always available.

## Routes

| Path | Role |
|------|------|
| `/[locale]` | Agora — hero + market map + Pulso + readings + briefing |
| `/[locale]/mercado` | Full market: treemap (1h/24h/7d), movers, top-40 |
| `/[locale]/fluxos` | Liquidity, ETF, leverage pulse |
| `/[locale]/defi` | TVL, protocols, stablecoins/peg, top yields |
| `/[locale]/cadeias` | Chains ranked by TVL, share, weighted Δ1d |
| `/[locale]/casos` | Case & Effect + sectors |
| `/[locale]/aprender` | Cycle, Atlas, Segurança, Portugal |
| `/[locale]/ferramentas` | Read-only wallet lookup (EVM + BTC) |
| `/[locale]/mesa` | Full tape / charts / analyst board |
| `/[locale]/caso/[id]` | Case detail |
| `/[locale]/atlas/[slug]` | Atlas article |
| `/[locale]/brief` | Ritual bookmark |
| `/[locale]/estilo` | Design system |

Legacy aliases (`/mundo`, `/contexto`, `/instrumento`, `/carteira`,
`/ciclo`, `/etf`, …) **308 →** the canonicals above (see `next.config.ts`).


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

## For AI agents

This repo is built to be worked on by multiple LLMs and platforms:

- `AGENTS.md` — the agent contract (non-negotiables, commands, boundaries)
- `.agents/skills/` — Agent Skills standard: `crypto-info-site` (house
  rules), CoinGecko/DefiLlama data-API skills, Vercel/Anthropic design
  skills
- `.devin/mcp_config.json` — optional CoinGecko + DefiLlama MCP servers
- `CLAUDE.md` → `@AGENTS.md`; `.cursor/`, `.claude/` are local-only
  junctions to `.agents/skills/`
- Canonical docs live in `docs/`; `src/app/design-system.md` is the
  design reference (mirrored live at `/estilo`)

## Roadmap (continuity)

Done: watchlist, ETF flows, Bitcoin + EVM wallet lookup, Atlas review
dates, deterministic + LLM briefs, OG images, RSS feed.
Phase 3: optional auth, public portfolio addresses, PDF brief export,
read-only portfolio + fiscality module (`docs/VISION-tax-module.md`).
