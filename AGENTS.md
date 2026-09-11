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

- `/` **Agora** — today's answer: hero (headline + live prices + AmbientField),
  Pulso radar (operator+), three readings (Direcção/Risco/Dinheiro), 5-slot
  briefing, watchlist. Each datum appears **once** — the page never restates
  its own story in more cards.
- `/mundo` — Caso & Efeito case files + sector rotation.
- `/fluxos` — where money comes from: stablecoins, ETF flows, leverage, F&G.
- `/contexto` — education ground: cycle, Atlas, Segurança, Portugal.
- `/instrumento` — the analyst's full board (dense by design).
- `/carteira` — read-only wallet lookup (EVM + BTC). Never asks for keys.
- `/atlas/[slug]`, `/caso/[id]`, `/brief`, `/estilo` — article, case detail,
  ritual bookmark, living design reference.
- 16 legacy aliases 308 → canonicals (`next.config.ts`).

## Voice — PT-PT europeu

Second person (tu/imperativo), traditional orthography of this project:
activo, transacção, direcção, ecrã. Never: usuário, tela, senha, você,
portfólio (it's portefólio). Crypto loanwords only where natural (swap,
funding, staking, on-chain, halving). Generated copy must read as real
sentences — template fragments are a defect. EN is a first-class locale,
not an afterthought: add the key to both json files.

## Design system

Signature "Noite": deep blue-violet dark theme, violet accent (#9b6cff),
cyan emphasis (#22e6ff), mint/coral direction (always with ▲▼), regime
chips (--calm/--unsettled/--storm/--weird). Fraunces display, IBM Plex
Sans body, IBM Plex Mono data (`tabular-nums`). Thin borders, small
radius, no glassmorphism, no landing-page gradients. Motion is meaningful
(flash on value change), always gated by `prefers-reduced-motion`.
Tokens only — `src/app/globals.css`; living reference at `/estilo`;
canonical doc `src/app/design-system.md`.

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
- `frontend-design`, `frontend-ui-engineering`, `web-design-guidelines` —
  generic UI taste; they never override the house rules or the Noite tokens.

MCP pair (when configured in `.devin/mcp_config.json`): `coingecko` via
`npx -y @coingecko/coingecko-mcp`, `defillama` via `https://mcp.defillama.com/mcp`.

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
- `docs/VISION-tax-module.md` — future portfolio/fiscality module
- `src/app/design-system.md` — design tokens and rules
- `PLANO-*.md`/`*-PROMPTS.md` at `docs/` — July planning archives (historical)

## Boundaries

- Read-only product: never store keys, never request seed phrases,
  never execute transactions.
- Generated audit/perf output (`data/audit/`, `data/perf/`,
  `audit-shots/`, `test-results/`) is gitignored — never commit it.
- `git config` is off-limits; no force-push; no `-i` flags.
