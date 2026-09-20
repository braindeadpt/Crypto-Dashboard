# Inventário factual da máquina de dados — CLAREZA

Ficheiro temporário de trabalho (só leitura do repo; zero edições de código).
Gerado por inspecção directa do código. "Render" = caminho de SSR/route handler;
"ingest" = scripts/cron fora do render. Datas e contagens medidas no checkout actual.

## 1. Fontes externas

Legenda falha: o que acontece quando a fonte falha **no caminho de render**
(na ingest, cada fonte está isolada com try/catch e não sobrescreve o snapshot bom —
`refreshHeavy.ts:33-50`, `ingest.ts:273-289`).

| Fonte | Endpoint(s) exactos | Ficheiro:função | TTL (cachedFetch / next.revalidate) | Rate limit conhecido | Em falha | API key | Onde corre |
|---|---|---|---|---|---|---|---|
| CoinGecko | `GET api.coingecko.com/api/v3/coins/markets?per_page=50&sparkline=true&price_change_percentage=1h,24h,7d` + `/global` | `src/lib/data/coingecko.ts:113 fetchMarketSnapshot` | 90s / 60s | 429 frequente no free tier (comentários `cache.ts:18-25`, `coingecko.ts:22-30`); retry backoff curto 300+600ms, máx 2 retries | fallback p/ `data/snapshots/market.json` (`coingecko.ts:152-156`); sem snapshot → throw (homepage mostra mensagem de erro, `page.tsx:38-50`) | opcional `COINGECKO_DEMO_API_KEY`/`COINGECKO_API_KEY` → header `x-cg-demo-api-key` (`coingecko.ts:7-15`) | servidor |
| CoinGecko | `/simple/price?ids=...` | `coingecko.ts:161 fetchUsdPrices` | 60s | idem | `{}` (degrada sem preço) | idem | servidor (wallet) |
| CoinGecko | `/simple/token_price/{platform}?contract_addresses=...` | `coingecko.ts:186 fetchTokenPricesUsd` | 300s | idem | `{}` | idem | servidor |
| CoinGecko | `/search/trending` | `coingecko.ts:217 fetchTrendingCoins` | 180s | idem | `{coins:[]}` | idem | servidor |
| CoinGecko | `/coins/bitcoin/market_chart?days={365|max}` | `coingecko.ts:252 fetchBtcHistoryDays` | 600s | idem | throw (caller `cycle.ts:15-16` apanha → `[]`) | idem | servidor |
| CoinGecko | `/coins/markets?ids=...` | `coingecko.ts:276 fetchMarketsByIds` | 90s | idem | `[]` | idem | servidor |
| CoinGecko | `/search?query=...` | `coingecko.ts:299 searchCoins` | 120s | idem | `[]` | idem | servidor |
| CoinGecko | `/coins/markets?category=meme-token&per_page=30` | `coingecko.ts:325 fetchMemeMarkets` | 150s | idem | `[]` | idem | servidor |
| CoinGecko | `/coins/categories?order=market_cap_desc` | `src/lib/data/sectors.ts:104 ingestSectorsSnapshot` | no-store (ingest) | idem | throw → apanhado em `refreshHeavy.ts:81-88`, snapshot anterior fica | idem | ingest |
| CoinGecko | `/coins/markets?category={id}&per_page=20` | `src/app/api/sectors/coins/route.ts:30` | no-store, por clique | idem | 502 | idem | route, on-demand |
| CoinGecko | `/coins/markets?per_page=25` + `/global` (append live) | `src/lib/history/ingest.ts:376-389 appendLivePoints` | no-store | idem | `catch → null`, ponto não é escrito | idem | ingest |
| CoinGecko | `/coins/bitcoin/market_chart?days=90` (prices+volumes) | `ingest.ts:159-235` | no-store | idem | fallback p/ Binance `api/v3/klines?BTCUSDT&1d&limit=90` (`ingest.ts:202-233`) | idem | ingest |
| Binance USD-M REST | `fapi.binance.com/fapi/v1/premiumIndex?symbol=X` | `src/lib/data/binance.ts:14 fetchFundingRate` | 60s / 30s | sem docs no código; público | throw → callers (`sentiment.ts`, `derivatives.ts`) tratam | não | servidor |
| Binance USD-M | `/fapi/v1/openInterest?symbol=X` | `binance.ts:29 fetchOpenInterest` | 60s | — | throw | não | servidor |
| Binance spot REST | `api.binance.com/api/v3/klines?symbol&interval&limit` | `binance.ts:51 fetchKlines`; tb `ingest.ts:203,305` | 60s | — | throw | não | servidor + ingest |
| Binance USD-M | `/futures/data/globalLongShortAccountRatio?symbol&period=1h&limit=1` | `src/lib/data/derivatives.ts:38 fetchLongShortRatio` | 90s | — | `null` | não | servidor |
| Binance USD-M | `/futures/data/openInterestHist?symbol&period=1h&limit=25` | `derivatives.ts:62 fetchOiChange24hPct`; tb `liquidity.ts:140` | 90s | — | `null` | não | servidor + ingest |
| Binance USD-M | `/fapi/v1/premiumIndex` (bulk, sem símbolo) | `src/lib/data/mapLayersServer.ts:20 fetchFundingMap` | 90s | — | `fetchMapLayers` apanha → `funding:{}` | não | servidor |
| Binance USD-M | `/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1000`, `openInterestHist 1d limit=90`, `globalLongShortAccountRatio 1d limit=90` | `ingest.ts:80-118, 237-254` | no-store | — | warn + mantém série anterior | não | ingest |
| Binance spot WS | `wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker/solusdt@ticker` | `src/lib/hooks/useLiveTicker.ts:28-29` | stream contínuo | — | reconnect backoff 1s→30s; pausa com tab oculto; UI fica com seed SSR | não | **browser** |
| Binance USD-M WS | `wss://fstream.binance.com/ws/!forceOrder@arr` (filtra BTC/ETH/SOL) | `src/lib/hooks/useForceLiquidations.ts:32` | janela 60min, máx 200 eventos | — | idem backoff; sem histórico servidor (`bundle.ts:154-155` marca lacuna) | não | **browser** |
| DefiLlama | `api.llama.fi/protocols`, `/v2/chains`, `/overview/fees?excludeTotalDataChart*`, `/v2/historicalChainTvl` | `refreshHeavy.ts:163-262 ingestDefi` | no-store (ingest) | — | throw → apanhado; fees/hist falham soft (`.catch→null`) | não | ingest |
| DefiLlama stables | `stablecoins.llama.fi/stablecoins?includePrices=true`, `/stablecoincharts/all` | `liquidity.ts:127-152 ingestLiquiditySnapshot`; `refreshHeavy.ts:171` | no-store | — | chart obrigatório (throw); list/ Binance soft-fail | não | ingest |
| DefiLlama yields | `yields.llama.fi/pools` (~11MB → top-80 reduzido) | `refreshHeavy.ts:105-161 ingestYields` | no-store | — | throw → apanhado, mantém snapshot | não | ingest |
| Farside Investors | `farside.co.uk/btc/` `/eth/` `/sol/` (scrape HTML de tabela) | `src/lib/data/etf.ts:44-52,223-247 scrapeAsset`; parser `parseFarsideTable:137` | no-store; timeout 12s | Cloudflare challenge possível (`etf.ts:78-80`); script usa curl (`refresh-snapshots.ts:23-43`) | ingest falha se BTC **e** ETH falharem (`etf.ts:309-313`); SOL opcional; render nunca raspa — lê `etf.json` | não (UA de browser) | ingest |
| mempool.space | `/api/v1/fees/recommended` + `/api/mempool` | `src/lib/data/mempool.ts:16 fetchMempoolFees` | 120s | — | `null` | não | servidor |
| mempool.space | `/api/address/{addr}` + `/api/address/{addr}/txs` | `mempool.ts:85 fetchBtcAddressView` | no-store | — | throw → route 502 | não | route `/api/wallet` |
| mempool.space | `/api/v1/fees/recommended` (append `fee_btc`) | `ingest.ts:386-388` | no-store | — | ponto não escrito | não | ingest |
| Alternative.me | `api.alternative.me/fng/?limit={1|30|90}` | `src/lib/data/feargreed.ts:3,24`; `ingest.ts:120-137` | 300s | — | throw no render (captured por `sentiment.ts:62` → disco/neutro); ingest mantém série | não | servidor + ingest |
| Etherscan V2 | `api.etherscan.io/v2/api?module=account&action={balance,txlist,tokentx}&chainid={1,8453,42161}` | `src/lib/data/etherscan-server.ts:37-65 call, 76 fetchWalletView` | **sem cache** (privacidade, `etherscan-server.ts:4-6`) | free tier ~5 calls/s (não documentado no código) | throw → 502; "No transactions found" → `[]` | **obrigatória** `ETHERSCAN_API_KEY` ou BYOK header `x-etherscan-key` | route `/api/wallet` |
| DexScreener | `api.dexscreener.com/token-boosts/top/v1` + `/latest/dex/tokens/{addr}` | `src/lib/data/dex.ts:43-102 fetchDexBoosts` | 120s | — | `[]` | não | servidor |
| GeckoTerminal | `api.geckoterminal.com/api/v2/networks/{solana,base,eth}/trending_pools` | `dex.ts:104 fetchGeckoTrending` | 180s | — | `[]` | não | servidor |
| OpenAI | `api.openai.com/v1/chat/completions` (model `OPENAI_MODEL`||gpt-4o-mini) | `src/app/api/brief/route.ts:59 enrichRitualProse` | rota `revalidate=120` | pago | silencioso — fica prosa determinística | `OPENAI_API_KEY` (opcional) | route |

Camada de cache: `src/lib/cache.ts` — Map em memória por processo + `unstable_cache`
(revalidate = max(30s, ttl)); em erro serve o último valor bom e estende 30s
(`cache.ts:47-54`). Chaves/TTLS: market:snapshot 90s, market:price 60s,
market:tokprice 300s, market:trending 180s, market:btc-history 600s,
market:ids 90s, market:search 120s, market:memes 150s, binance:funding/oi 60s,
binance:klines 60s, binance:ls 90s, binance:oi-chg 90s, binance:funding:all 90s,
derivs:multi 90s, btc:mempool-fees 120s, sentiment:fng(+history) 300s,
dex:frenzy 150s.

## 2. data/snapshots/

Todos commitados no repo (não gitignored). Escritores:
`refreshHeavySnapshots()` (`src/lib/data/refreshHeavy.ts:21`), chamado por
`scripts/refresh-snapshots.ts` (`npm run snapshots:refresh`) e pela rota
`POST|GET /api/cron/refresh-heavy` (`src/app/api/cron/refresh-heavy/route.ts`,
runtime nodejs, maxDuration 120s, protegida por `CRON_SECRET` **só se definido** —
`route.ts:12-18`; GET público sem secret).
Leitores: todos via `readSnapshot` em `src/lib/data/snapshotStore.ts:23`.

| Ficheiro | Tamanho | Conteúdo | Escritor | Leitores | updatedAt actual |
|---|---|---|---|---|---|
| `defi.json` | 4,9 KB | totalTvl, top15 protocolos, 12 chains, 10 stablecoins, pegWatch, fees24h | `refreshHeavy.ts:260` | `defillama.ts:22` → `/defi`, `/cadeias`, bundle, `api/defi` | 2026-09-18T04:14Z |
| `etf.json` | 9,1 KB | fluxos diários BTC/ETH/SOL (13 dias cada, últ. 2026-09-17), streak, sums, signal | `etf.ts:325` ou curl seed `refresh-snapshots.ts:137` | `etf.ts:336` → `/fluxos`, mesa, `api/etf`; `liquidity.ts:208`; `ingest.ts:258` | 2026-09-18T04:14Z (source: "curl seed script") |
| `history.json` | 53 KB | séries diárias 90d + `price_btc_1h` 720h — ver tabela abaixo | `ingest.ts:339`, `liquidity.ts:350` (merge stables) | `history/context.ts:55`, `deltas.ts:137`, `correntes.ts:123`, `concordancia.ts:100`, `multidao.server.ts:11`, `points.ts:14`, `regime/history.ts:127` | 2026-09-18T06:17Z |
| `liquidity.json` | 6,0 KB | stables (série 90d, últ. 2026-09-18), spot ETF, leverage Binance, reading | `liquidity.ts:317` | `liquidity.ts:442` → `/fluxos`, `api/liquidity`, bundle | 2026-09-18T04:14Z |
| `market.json` | 10,6 KB | fixture MarketSnapshot (BTC/ETH/top40/movers) | **só commit manual** — ninguém escreve em runtime | `coingecko.ts:153` (fallback do render) | **2026-07-25** — fixture de Jul, source="fixture" |
| `sectors.json` | 27,8 KB | thematic top24 + mega, history **3 dias** (últ. 2026-09-18), rotation, readings | `sectors.ts:161` | `sectors.ts:323` → `/casos`, `api/sectors`, `mapLayersServer.ts:48` | 2026-09-18T04:14Z |
| `sentiment.json` | 0,3 KB | fixture SentimentSnapshot | só commit manual | `sentiment.ts:19` (fallback) | **2026-07-25** — fixture |
| `yields.json` | 16 KB | top-80 pools (tvl≥1M, 0<apy<500) | `refreshHeavy.ts:147` | `yields.ts:36` → `/defi`, mesa | 2026-09-18T04:14Z |

### history.json — séries (medido no ficheiro actual)

| Métrica | nº pontos | primeiro | último | fonte |
|---|---|---|---|---|
| funding_btc | 90 | 2026-06-21 | 2026-09-18 | Binance fundingRate |
| oi_btc | 63 | 2026-06-26 | 2026-09-18 | Binance openInterestHist 1d |
| fear_greed | 90 | 2026-06-21 | 2026-09-18 | Alternative.me |
| tvl | 90 | 2026-06-21 | 2026-09-18 | DefiLlama historicalChainTvl |
| price_btc | 90 | 2026-06-21 | 2026-09-18 | CoinGecko market_chart |
| volume_btc | 90 | 2026-06-21 | 2026-09-18 | CoinGecko market_chart |
| vol_realized_btc | 90 | 2026-06-21 | 2026-09-18 | derivado de CG prices |
| stablecoin_supply | 90 | 2026-06-21 | 2026-09-18 | DefiLlama stablecoincharts |
| ls_btc | 31 | 2026-08-19 | 2026-09-18 | Binance longShort 1d |
| etf_btc_flow | 29 | 2026-07-06 | 2026-09-17 | Farside (via etf.json) |
| price_btc_1h | 720 (horas) | 2026-08-19T07 | 2026-09-18T06 | Binance 1h klines |
| **fee_btc** | **3** | 2026-07-25 | 2026-09-18 | append-only mempool.space |
| **breadth** | **3** | 2026-07-25 | 2026-09-18 | append-only CG top |
| **btc_dominance** | **3** | 2026-07-25 | 2026-09-18 | append-only CG global |

Séries paradas/curtas: `fee_btc`, `breadth`, `btc_dominance` têm **3 pontos em
~55 dias** — append-only dependente do cron diário; `sectors.history` 3 dias;
`etf.*.history` 13 dias; `ls_btc` 31d; `oi_btc` 63d. Fixtures `market.json` e
`sentiment.json` datam de 2026-07-25.

## 3. Cron / automação

| Item | O quê | Quando | Pode partir |
|---|---|---|---|
| `.github/workflows/ingest.yml` | `npm ci` + `npm run snapshots:refresh` (refreshHeavySnapshots + curl seed ETF) → `git add data/snapshots/` + commit+push "data: daily snapshot ingest" | cron `17 5 * * *` UTC; manual; timeout 15min | depende de GitHub Actions free em repo; secrets `COINGECKO_*`; CG 429 faz falhar tarefas (isoladas, mas append-only perde o dia); conflito de push se master avançar entre checkout e push (não há rebase no workflow); falha silenciosa — ninguém é notificado. **No histórico git local não existe nenhum commit "data: daily snapshot ingest"** (0 matches) — append-only com 3 pontos corrobora |
| `.github/workflows/ci.yml` | lint → typecheck → test:unit → build → playwright smoke | push/PR a `master` | E2E bate APIs reais (429 CoinGecko / Cloudflare Farside fora do render) |
| `src/app/api/cron/refresh-heavy/route.ts` | POST/GET → `refreshHeavySnapshots()` | externo (Vercel cron não configurado — **não há `vercel.json`**) | sem `CRON_SECRET` a rota é pública (GET incluído); `maxDuration=120` pode não chegar para ~15MB de ingest + scrape; em serverless efémero `process.cwd()/data/snapshots` não persiste (`snapshotStore.ts:11-13` assume disco ou cron) |
| `useBoardRefresh` (`src/lib/hooks/useBoardRefresh.ts`) | `router.refresh()` a cada 60s no cliente | por sessão | re-executa todo o RSC render (getFrontPageData) por utilizador activo |

## 4. Rotas de página `src/app/[locale]/**/page.tsx`

Todas `export const dynamic = "force-dynamic"` (SSR por pedido). Loaders
servidor→disco não batem rede; loaders "live" batem CoinGecko/Binance/Alt.me.

| Rota | revalidate | Loaders | Componente(s) de topo |
|---|---|---|---|
| `/` `page.tsx` | 60 | `getFrontPageData()` (= regimeBundle completo: market live + sentiment live + etf/disc + derivs live + defi/disc + liquidity/disc + vol/disc + deltas + regimeHistory + mapLayers + cases + ritual + cycle[CG history]), `getCorrentes()`, `getConcordancia()` | `OperatorBoard`, `OnboardingHint` |
| `/mercado` | 60 | `fetchMarketSnapshot`, `fetchMapLayers`, `getRegimeBundle` | `MercadoDesk` |
| `/fluxos` | 60 | `fetchLiquiditySnapshot` (disco), `fetchEtfSnapshot` (disco) | `FluxosDesk` |
| `/defi` | 60 | `fetchDefiSnapshot`, `fetchTopYieldPools`, `getRegimeBundle`, série tvl | `DefiDesk` |
| `/cadeias` | 60 | `fetchDefiSnapshot`, `getRegimeBundle` | `CadeiasDesk` |
| `/casos` | 60 | `fetchSectorsSnapshot` (disco), `fetchMarketSnapshot` (live) | `MundoDesk` |
| `/caso/[id]` | 60 | `getRegimeBundle` | `CaseDesk` |
| `/aprender` | 120 | `fetchCycleSnapshot` (CG live) | `ContextoDesk` |
| `/ferramentas` | — | nenhum (cliente chama `/api/wallet`) | `CarteiraDesk` |
| `/mesa` | 60 | `fetchTopYieldPools`, `fetchDerivativesSnapshot`, `fetchTrendingCoins`, `fetchMempoolFees`, `fetchEtfSnapshot`, `fetchDexFrenzy` | `InstrumentDesk` |
| `/brief` | 120 | `getFrontPageData` | `DailyRitualCard`, `JournalCard` |
| `/atlas/[slug]` | — | conteúdo estático `lib/content/atlas` (`generateStaticParams`) | `AtlasArticle` |
| `/estilo` | — | `getRegimeBundle` | `StyleGuide`, `MotionChannels` |
| `/metodologia` | — | nenhum (estática) | — |

Nota: `force-dynamic` + `revalidate` definido em simultâneo — revalidate é
inerte com force-dynamic (todas as páginas de dados).

APIs (`src/app/api/*`): brief `revalidate=120` (+OpenAI opcional), cases 60,
chart 60 (Binance klines), cycle 300, defi 120, etf 1800, front 60,
history/context force-dynamic nodejs (só disco), liquidity force-dynamic nodejs,
market 60, market/quotes force-dynamic+60, regime 60, sectors force-dynamic
nodejs, sectors/coins force-dynamic (CG live por clique), sentiment 60,
wallet stateless no-store, cron/refresh-heavy nodejs maxDuration 120.
`feed.xml`, `sitemap.ts`, `robots.ts` usam `NEXT_PUBLIC_SITE_URL`.

## 5. Homepage — OperatorBoard + Maestro

`src/components/board/OperatorBoard.tsx` (256 linhas, client). Recebe tudo por
props de `getFrontPageData`; hooks: `useLiveTicker` (WS Binance spot),
`useBoardRefresh` (refresh 60s), `useHistoryContexts` (fetch `/api/history/context`),
`useExpertise`.

Filhos directos e dados consumidos:

| Componente | Dados | Gate |
|---|---|---|
| `CorrenteViva` | quotes live WS (BTC/ETH/SOL) | sempre |
| `HeroPanel` | readings, regime.score/posture, market (preços seed, vitals, sparkline7d), live conn, asOf | sempre |
| `FitaRegime` | regimeHistory.days (90d) | sempre |
| `Concordancia` | concordancia (history.json) | level≠citizen |
| `SinceLastVisit` | visitVitals vs localStorage | sempre |
| `MarketMap` | market.top40 + mapLayers (funding bulk + sectores) + liveTicks | sempre |
| `Correntes` | correntes — 9 séries de history.json | level≠citizen |
| `Pulso` | regime + hist contexts | level≠citizen |
| `RegimeHistory` | regimeHistory | level≠citizen |
| `DailyRitualCard` | ritual (deltas + cases + market) | `show("boardSecondary")` |
| `WatchlistPanel` | localStorage watchlist + `/api/market/quotes` | `show("boardSecondary")` |
| nav "aprofundar" | links | sempre |

Maestro (`src/lib/motion/`): `conduct(readings,{reduced,realizedVolPct})→MotionState`
(`conductor.ts:83`) devolve `{cadence, agitation, temperature, subdued}`;
constantes `MOTION_REST`, `MIN_CONFIDENCE_FOR_MOTION=0.6`, `AGITATION_CEILING=0.85`,
`AGITATION_FLOOR=0.3`, `agitationFromRisk()`; `MotionProvider`/`useMotion`
(`useMotion.tsx:30,81`); `useViewportBuild` (`useViewportBuild.ts:16`);
`src/lib/motion.ts` exporta `entryBootstrapScript` (sessionStorage + reduced-motion).

## 6. Contagens (medido)

- Linhas por pasta: `src/app` 1.914 · `src/components` 15.105 · `src/lib` 15.370
  · `src/i18n` 28 · **total src 32.426** (inclui 1.288 de `*.test.ts`).
- `messages/pt.json` = **823** chaves; `messages/en.json` = **823** chaves;
  **desacordo = 0** (conjuntos idênticos, comparação por flatten recursivo).
- Ficheiros page.tsx: 14; API routes: 18; snapshots: 8.

## 7. Riscos observados para "correr meses sem intervenção"

1. **Snapshots dependem de disco + commit.** Em serverless (Vercel) o FS é
   efémero — sem cron externo a bater `/api/cron/refresh-heavy` e sem persistência,
   os renders leem o que o build trouxe no repo. O mecanismo assumido
   (`snapshotStore.ts:11-13`) não está ligado: não há `vercel.json` nem cron
   configurado para a rota.
2. **Séries append-only já demonstram falha de ingest**: `fee_btc`, `breadth`,
   `btc_dominance` têm 3 pontos desde 2026-07-25; `sectors.history` 3 dias.
   Zero commits "data: daily snapshot ingest" no histórico local → o workflow
   diário não está a produzir commits (ou corre noutra branch/remoto).
3. **Fallbacks de render são fixtures velhos**: `market.json` e `sentiment.json`
   de 2026-07-25 servem quando CoinGecko/Binance falham — dados reais mas com
   ~2 meses; stale é assinalado em alguns leitores mas o fallback de `market`
   (`coingecko.ts:152`) não marca staleness para lá do `updatedAt`.
4. **Farside é scrape HTML atrás de Cloudflare** — fetch falha com challenge;
   só o script com `curl` do sistema contorna (`refresh-snapshots.ts:23`).
   BTC+ETH obrigatórios: se a CF endurecer, `etf_btc_flow` e o bloco "spot"
   de liquidity congelam para sempre.
5. **`/api/cron/refresh-heavy` é pública por defeito** (auth só se `CRON_SECRET`
   existir; `GET` também corre o ingest, `route.ts:31-33`) — qualquer um pode
   disparar o download de ~15MB.
6. **Rate-limit CoinGecko sem chave**: quase todo o render live (market,
   sentiment via Binance+Alt.me, cycle, trending, dex) passa por CG/Binance;
   429 sustentado degrada para fixtures/stale. Não há circuit-breaker global.
7. **Ponto único de escrita**: só `refreshHeavySnapshots` + o script alimentam
   os snapshots; se o workflow do GitHub parar (mudança de plano, secrets
   expirados, push rejeitado), nada local o substitui e nenhuma falha é
   notificada.
8. **`git push` do workflow sem rebase** (`ingest.yml:50-58`): se master
   receber commits entre checkout e push, o push falha e o ingest do dia
   perde-se silenciosamente.
9. **Dependência de Node único no cliente**: liquidations só existem via WS no
   browser (`useForceLiquidations`) — o servidor marca a lacuna
   (`bundle.ts:154-155`), mas o painel depende 100% da Binance WS no device.
10. **Chaves/constantes hardcoded**: halving `NEXT_HALVING_ESTIMATE="2028-04-15"`
    e `LAST_HALVING` em `cycle.ts:9-10`; UA Chrome/120 fixo; endpoints
    hardcoded em 7+ ficheiros sem módulo comum de fontes.
11. **`history.json` cresce só por commits** — cada ingest é um commit no repo;
    o repositório acumula ruído de dados e um clone carrega sempre a série.
12. **Sem monitorização**: falhas de ingest são `console.warn`; nenhum
    artefacto de status (último ok por fonte) existe para detectar fonte morta.
