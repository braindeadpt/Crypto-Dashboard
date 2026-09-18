<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CLAREZA agent contract

## What CLAREZA is (non-negotiable)

| Layer | Constraint |
|---|---|
| App | Next.js App Router + TypeScript, `src/app/[locale]`, PT-PT first, EN second |
| Product | Daily market-orientation desk — briefing + synthesis, **not** a price tracker or trading terminal |
| i18n | `next-intl`; all user-facing strings live in `messages/pt.json` / `messages/en.json` |
| Data | Free APIs only: CoinGecko, mempool.space, Etherscan V2, Farside (ETF), Alternative.me, Binance, DefiLlama |
| Density | Dial Essencial/Operador/Analista via `useExpertise` + `ExpertiseGate` |
| Quality | `lint && typecheck && test:unit && build && test:e2e` — all green before commit |
| Deploy | Vercel-shaped Next.js app (dynamic server routes OK) |

An agent that ignores this invents prices, adds trade signals, writes
Brazilian Portuguese, or stacks redundant cards. Don't.

## Rule nº1 — never invent data

- Never fabricate prices, percentages, dates, flows or rankings. If a source
  fails, surface the failure (`—`, "indisponível", short-sample note) — never
  a made-up number.
- Every datum carries a visible timestamp/series date; stalled series get an
  explicit stale warning.
- Correlation language always: "consistente com", never "causado por".
- No trade signals, no financial advice, no hype. Fiscal content points to a
  TOC (contabilista certificado).

## Pages — each has one job

Target IA is in `docs/PLANO-CLAREZA.md` §3 — the thematic routes below are
the live canonical slugs. IA-v2 renames carry 308s (`mundo`→casos,
`contexto`→aprender, `instrumento`→mesa, `carteira`→ferramentas) plus the
historical aliases.

- `/` **Agora** — the market in seconds: hero (verifiable headline — each
  claim opens its source metric), vitals + live prices + regime-reactive
  AmbientField, market treemap, Pulso radar (operator+), three readings,
  5-slot briefing (operator+). Each datum appears **once**. Essencial =
  hero + map + readings only; the dial reveals briefing + watchlist.
- `/mercado` — the full market: vitals strip, MarketMap treemap with
  switchable colour layer (price 1h/24h/7d, perp funding, volume vs median,
  sector rotation), gainers/losers, top-40 table with 7d sparklines.
- `/fluxos` — where money comes from: stablecoins, ETF flows (streaks,
  sample cumulative, record days, weekly delta), leverage, F&G.
- `/defi` — global TVL, top protocols, stablecoins/peg watch, top yields.
- `/cadeias` — blockchains ranked by TVL with share bars + weighted Δ1d.
- `/casos` — Caso & Efeito case files + sector rotation.
- `/aprender` — education ground: cycle, Atlas, Segurança, Portugal.
- `/ferramentas` — read-only wallet lookup (EVM + BTC). Never asks for keys.
- `/mesa` — the analyst's full board (dense by design).
- `/atlas/[slug]`, `/caso/[id]`, `/brief`, `/estilo` — article, case detail,
  ritual bookmark, living design reference.
- 16 legacy aliases + 4 IA-v2 renames 308 → canonicals (`next.config.ts`).

## Voice — PT-PT europeu

Second person (tu/imperativo), traditional orthography of this project:
activo, transacção, direcção, ecrã. Never: usuário, tela, senha, você,
portfólio (it's portefólio). Crypto loanwords only where natural (swap,
funding, staking, on-chain, halving). Generated copy must read as real
sentences — template fragments are a defect. EN is a first-class locale,
not an afterthought: add the key to both json files.

## Design system

Two themes, both always one click away and persisted via `clareza-theme`:
**"Papel"** — warm editorial paper (`#f4f1e9`), the publication voice,
default for new visitors — and **"Noite"** — deep blue-violet dark
(`#05070e`), the instrument theme. Violet accent (#9b6cff / darker on
Papel), cyan emphasis (#22e6ff), mint/coral direction (always with ▲▼),
regime chips (--calm/--unsettled/--storm/--weird). Newsreader serif for
editorial voice, Sora display, IBM Plex Sans body, IBM Plex Mono data
(`tabular-nums`). Thin borders, small radius, engraved rules, no
glassmorphism, no landing-page gradients. Motion is meaningful and
conducted by the Maestro (`src/lib/motion/`) — channels derived from real
readings, always gated by `prefers-reduced-motion`, page visibility and
reading confidence. Tokens only — `src/app/globals.css`; living reference
at `/estilo`; canonical doc `src/app/design-system.md`.

## Skills

Canonical home is `.agents/skills/` (Agent Skills standard) — same files
serve Claude, Cursor, Devin, Grok, Copilot, etc. `.claude/skills`,
`.cursor/skills`, `.devin/skills`, `.grok/skills`, `.github/skills` are
local junctions, gitignored and recreated automatically by the
`postinstall` hook (`scripts/setup-agent-links.mjs`) on `npm install`.

- `crypto-info-site` — house skill: product rules, page jobs, voice, tokens.
- `coingecko`, `defi-data`, `defi-market-overview`, `token-research`,
  `protocol-deep-dive`, `chain-ecosystem`, `yield-strategies`,
  `market-analysis`, `institutional-crypto`, `risk-assessment`,
  `flows-and-events`, `defillama-setup` — data-API skills (endpoints,
  rate limits, correct calls).
- `etherscan`, `etherscan-flow`, `etherscan-contract-review`,
  `etherscan-transaction-debugger` — official Etherscan "Build with AI"
  skills (API V2, MCP, CLI, forensics) for the `/carteira` surface.
- `frontend-design`, `frontend-ui-engineering`, `web-design-guidelines` —
  generic UI taste; they never override the house rules or the Noite tokens.

MCP servers in `.devin/mcp_config.json`: `coingecko` (npx stdio),
`defillama` (HTTP, OAuth), `etherscan` (HTTP, bearer `ETHERSCAN_API_KEY` —
the only official endpoint is `mcp.etherscan.io/mcp`; never use
lookalikes), `bitquery` (HTTP, OAuth 2.1 — 40+ chains on-chain data,
reserved for the future Pro tier).

## Commands

```bash
npm install && npx playwright install chromium
npm run dev            # http://localhost:3000/pt
npm run lint && npm run typecheck
npm run test:unit      # vitest
npm run build
npm run test:e2e       # playwright smoke (starts next start)
npm run ci             # all gates
npm run snapshots:refresh   # heavy DefiLlama blobs → data/snapshots/
```

Env (`.env.example`): `COINGECKO_DEMO_API_KEY`/`COINGECKO_API_KEY`,
`ETHERSCAN_API_KEY` (carteira), `OPENAI_API_KEY` (optional LLM brief),
`CRON_SECRET` (POST /api/cron/refresh-heavy), `NEXT_PUBLIC_SITE_URL`
(sitemap/robots/feed).

CI: `.github/workflows/ci.yml` — lint → typecheck → build → smoke E2E on
push/PR to `master`. Wallet E2E hits real Bitcoin + EVM APIs.

## Canonical docs

- `README.md` — product thesis, routes, run instructions
- `docs/PLANO-INFORMACAO.md` — structural plan (what exists, where, for whom)
- `docs/PLANO-SEGURANCA.md` — security plan
- `docs/PLANO-P1-PRO.md` — Pro tier spec (auth, Bitquery, deep wallet)
- `docs/VISION-tax-module.md` — future portfolio/fiscality module
- `src/app/design-system.md` — design tokens and rules
- `PLANO-*.md`/`*-PROMPTS.md` at `docs/` — July planning archives (historical)

## Boundaries

- Read-only product: never store keys, never request seed phrases,
  never execute transactions.
- Generated audit/perf output (`data/audit/`, `data/perf/`,
  `audit-shots/`, `test-results/`) is gitignored — never commit it.
- `git config` is off-limits; no force-push; no `-i` flags.
