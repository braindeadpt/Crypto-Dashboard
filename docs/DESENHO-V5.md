# DESENHO V5 — A Sala

> O mercado inteiro numa só sala. Uma estação sinóptica de cripto para
> Portugal: instrumentos vivos, dados verificáveis, zero decoração.

Estado de partida: V4 (`5168f48`) é uma revista editorial-brutal em placas
que se lêem a rolar. O que se pretende agora é outra coisa: **a entrada é
uma dashboard única, viva, que cabe num ecrã** — e as páginas temáticas
são salas anexas com o mesmo rigor de instrumento. Este documento é o
contrato de execução: cada fase tem âmbito, critérios de aceitação e fecha
com commit. Substitui `DESENHO-V4.md` como direcção canónica.

---

## 0. Diagnóstico (medido — ver `docs/_inventario-dados.md`)

| Achado | Consequência |
|---|---|
| Branch por defeito no GitHub é `main` (1 commit); trabalho vive em `master` | `ingest.yml` (schedule) **nunca correu**. Séries append-only têm 3 pontos em 55 dias. |
| Sem `vercel.json`, sem deploy | Nada corre sozinho. `/api/cron/refresh-heavy` nunca é chamada. |
| `market.json`/`sentiment.json` são fixtures de 2026-07-25 | Em falha do CoinGecko o site mostra Julho como se fosse hoje (só `updatedAt` denuncia). |
| Farside = scrape HTML atrás de Cloudflare | Se endurecer, ETF congela para sempre sem aviso. |
| Rota cron pública sem `CRON_SECRET`; `GET` executa ingest | Qualquer pessoa dispara 15 MB de downloads. |
| Workflow faz `push` sem rebase; falha em silêncio | Um dia de dados perde-se sem ninguém saber. |
| Zero monitorização por fonte | Não há como saber que fonte morreu nem quando. |
| Homepage = 12 filhos, 5 placas em scroll, 2 WS, refresh RSC 60 s | Revista, não sala. Custo de render alto por utilizador. |
| Tipografia Sora + Plex; escala de 4 tamanhos parecidos em muitos sítios | Lê-se como template; sem lettering próprio. |

## 1. Tese de design

**Metáfora: a estação sinóptica.** A meteorologia já está latente no
produto (regime calmo/inquieto/tempestade, pressão, temperatura, caudal,
correntes). Uma carta sinóptica mostra um sistema inteiro num só olhar —
pressão, frentes, vento, precipitação — com símbolos de estação normalizados
e legendas mínimas. É exactamente a promessa da CLAREZA: *o mercado inteiro
em segundos*. Bitcoin é o sistema de pressão central; tudo o resto orbita.

**Uma decisão, uma sala.** A entrada `/` é um painel de instrumentos que
cabe em `100dvh` num desktop ≥ 1280 px. Sem scroll de leitura. Cada
instrumento vive, cada um responde a dados reais, todos partilham um
relógio (Maestro). Em mobile os mesmos instrumentos empilham-se, pela mesma
ordem de importância.

**O que faz isto único (e não um terminal):** não há ordens, não há
sinais, não há carteira. Há leitura. A linguagem é a de um observatório
nacional: instrumentos com nome próprio, hora de Lisboa, fontes visíveis,
estado de saúde de cada fonte à vista — o site diz sempre quando não sabe.

**Onde gastamos a ousadia:** no centro — o preço BTC colossal em Archivo
condensado, com a Corrente Viva a correr por trás e o peso da letra a
respirar com a agitação do mercado. Tudo o resto é disciplinado, fino,
silencioso.

### Anti-padrões (proibidos, verificados na auditoria visual)
- cards iguais em pilha; sombras cinza; radius > 2 px; glassmorphism; gradientes
- eyebrow em ALL CAPS por cima de cada título; " · " como separador; "→" em links
- fade-and-slide-up por secção; hover-lift; contadores a rolar sem dado novo
- números sem timestamp/fonte; cor de direcção sem ▲▼; copy de marketing

## 2. Sistema visual

### 2.1 Tipografia (novo)
| Papel | Família | Eixos | Uso |
|---|---|---|---|
| Display + UI | **Archivo** (variable) | `wght` 100–900, `wdth` 62–125 | preço BTC (wdth 70, wght 700–850), títulos de instrumento, manchete, navegação, corpo |
| Dados | **Martian Mono** (variable) | `wght` 100–800, `wdth` 75–112.5 | todos os números tabulares, timestamps, coordenadas, código; `wdth 87.5` como base |
| Editorial | Newsreader (mantém) | — | só `/atlas/*` e `/aprender` corpo longo |

Regras de lettering:
- `font-variant-numeric: tabular-nums slashed-zero` em qualquer número.
- PT: milhares com espaço fino (U+202F), decimal com vírgula; EN: vírgula/ponto.
  Uma função `formatNumber(locale)` em `src/lib/format.ts` — proibido `toLocaleString` solto.
- Escala (px): 11 micro · 13 label · 15 body · 18 lead · 24 title · 40 display ·
  96 hero · **160 colossal** (só o preço BTC; `clamp(96px, 11vw, 160px)`).
- **Respiração tipográfica**: o preço BTC e os títulos de instrumento recebem
  `font-variation-settings` animada via `@property --wght` — amplitude
  ±40 de `wght` e ±4 de `wdth`, período = cadência do Maestro. Nunca em corpo.
  `prefers-reduced-motion` fixa os eixos.

### 2.2 Cor
Mantêm-se os tokens Noite (`#05070e`, `#9b6cff`, `#22e6ff`, `#00f0a8`,
`#ff4d7d`). Acrescenta-se:
- `--seam: oklch(22% 0.02 280)` — a junta entre instrumentos (1 px). Instrumentos
  não têm borda; a **grelha** tem juntas. Cards ficam proibidos na entrada.
- `--phosphor: #b6ffe0` — texto "ao vivo" (só timestamps e o ponto de ligação).
- `--stale: #c9a227` — âmbar de "desactualizado" (sempre com ◌).
- Papel mantém-se funcional (QA obrigatória) mas as decisões optimizam Noite.
  Papel é o modo de leitura de `/aprender` e `/atlas`.

### 2.3 Símbolos (novo — `src/components/brand/Glyph.tsx`)
Conjunto próprio em SVG 12/16 px, traço 1.25, sem preenchimento salvo estado:
| Glifo | Significado |
|---|---|
| `○` calmo · `◐` inquieto · `●` tempestade · `◇` estranho | regime (símbolos de estação) |
| `▲` `▼` | direcção — obrigatório junto a qualquer variação |
| `●` a pulsar (phosphor) | ligação ao vivo |
| `◌` âmbar | desactualizado / amostra curta |
| `—` | indisponível (nunca 0 inventado) |
| `⌖` | fonte / proveniência (abre a fonte) |
| `⇅` | ordenar · `⟲` actualizado há |
Sem bibliotecas de ícones. Cada glifo tem `aria-label` traduzido.

### 2.4 O instrumento (primitiva única — `src/components/instrument/Instrumento.tsx`)
```
┌─ título (Archivo 13, sentence case)      ⟲ 12:04 ⌖ ─┐
│                                                      │
│   corpo (visualização full-bleed do instrumento)     │
│                                                      │
└─ leitura em uma frase (Essencial vê isto primeiro) ──┘
```
Props: `title`, `asOf`, `source`, `state: live|ok|stale|down|short`,
`reading` (frase), `children`. Estados desenham-se sempre da mesma forma.
Um instrumento nunca tem borda nem fundo próprio — senta-se na grelha.

## 3. A entrada — A Sala (`/`)

Grelha 12 × 8, `100dvh − header(52px)`, juntas de 1 px. Desktop ≥ 1280:

```
┌ CLAREZA  Agora · Mercado · Fluxos · DeFi · Cadeias · Casos · Aprender · Ferramentas   ◐ Essencial|Operador|Analista  ◑  14:32 Lisboa ┐
├──────────────────────────────────────────────┬──────────────────────────────────────────────────────────────┤
│ BITCOIN                          ● ao vivo   │ MAPA DO MERCADO                        preço 24h ⇅ camadas   │
│ € 71 934   $ 77 417 ▲ 1,8 % 24h              │  treemap top-40 (área = cap.), Flip ao trocar camada,          │
│ [Corrente Viva por trás — 100% da célula]    │  vibração por volume (Maestro), tiles com preço dentro         │
│ Manchete verificável em uma frase.           │                                                                │
│ Cada afirmação abre a métrica. Regime ◐      │                                                                │
├──────────┬───────────┬───────────────────────┼─────────────────────────┬────────────────────────────────────┤
│ REGIME   │ CAUDAL    │ ALAVANCAGEM           │ DEFI                    │ O QUE OBSERVAR                     │
│ dial     │ rio ETF + │ OI · funding · L/S    │ TVL 90d área + peg      │ 3 pontos, cada um com ⌖            │
│ + fita   │ stables   │ + golpes de liquidação│ watch (pontos a oscilar)│ + concordância (barras)            │
│ 90d      │ (mini)    │ ao vivo (ticks)       │                         │                                    │
├──────────┴───────────┴───────────────────────┴─────────────────────────┴────────────────────────────────────┤
│ ● CoinGecko 14:31 · ● Binance ao vivo · ● DefiLlama 05:17 · ◌ Farside 17 Set · ● mempool 14:30 · Alternative.me 05:17  │ metodologia
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
(áreas: BTC 5×5 · Mapa 7×5 · fila baixa 2/2/3/2/3 × 2 · status 12×1)

Regras:
- **Sem scroll em desktop.** Se não cabe, o dial decide o que sai, não o scroll.
- **Cada dado aparece uma vez.** Preço BTC só no instrumento BTC; o tile do
  mapa mostra a variação, não repete o preço.
- Essencial: cada instrumento mostra a **frase** em maior; números em 13.
  Operador: números em display, frase em 13. Analista: números + contexto
  (percentil, amostra) — e o link "Mesa" acende.
- Mobile (< 900 px): empilha pela ordem BTC → Mapa (altura 56vw) → Regime →
  Caudal → Alavancagem → DeFi → Observar → Status. Cada instrumento ≥ 44 px de alvo.
- `/brief`, `/mesa` continuam a existir; a Sala **não** inclui ritual nem
  watchlist (movem-se para `/brief` e `/mesa` respectivamente — 0 duplicação).

### Coreografia de arranque (uma vez por sessão)
600 ms totais, ordem física: juntas da grelha desenham-se (0–150 ms) →
instrumentos acendem por importância BTC, Mapa, fila baixa, status (150–500 ms,
stagger 40 ms, só `opacity` + `clip-path`) → Corrente arranca (500 ms). Depois
disto **nada volta a "entrar"**: só há vida ligada a dados. Reduced-motion:
tudo presente ao primeiro paint.

### Vida contínua (sempre, modulada nunca desligada)
| Instrumento | Canal de dados → movimento |
|---|---|
| BTC | Corrente Viva (ticks WS, espessura = volume); peso da letra respira com agitação |
| Mapa | vibração de tile ∝ volume/mediana; Flip real ao trocar camada |
| Regime | agulha do dial interpola ao mudar score; fita 90d estática |
| Caudal | partículas no sentido do sinal do dia, densidade ∝ magnitude |
| Alavancagem | golpe de liquidação = tick que acende e decai (WS forceOrder) |
| DeFi | peg dots oscilam ∝ desvio real; TVL traçado uma vez |
| Observar | nada se mexe — texto é texto |
| Status | ponto ● pulsa só na fonte que acabou de actualizar |

## 4. Salas anexas (páginas temáticas)

Cada página: **um herói full-bleed animado** (o instrumento principal da sala,
≥ 60vh), uma frase de leitura, depois instrumentos secundários na mesma grelha
de juntas, depois a tabela densa (Operador+). Sem cards.

| Rota | Herói | Copy obrigatória por campo |
|---|---|---|
| `/mercado` | Mapa em ecrã inteiro com camadas + amplitude (breadth) como barra sob o mapa | cada camada tem "o que mede", "fonte", "porque importa" (tooltip ⌖) |
| `/fluxos` | Rio Caudal grande (ETF + stables + OI como terceira faixa) | por faixa: unidade, janela, último dia, lacunas (fim-de-semana ETF explícito) |
| `/defi` | Anel de protocolos + TVL 90d por trás | TVL vs fees explicado em uma frase; peg: limiar 0,5 % declarado |
| `/cadeias` | Comparador lado a lado como herói (não tabela) | quota, Δ1d ponderado (como se calcula), nº protocolos |
| `/casos` | Linha do tempo de evidência + balança de hipóteses | "consistente com", confiança em %, o que a contrariaria |
| `/aprender` | Ciclo do Bitcoin (build-on-scroll mantém — excepção pedagógica) | Papel como modo de leitura |
| `/ferramentas` | Composição da carteira (donut) + linha de actividade | "só leitura; nunca pedimos chaves" visível antes do input |
| `/brief` | Folha do dia (ritual) — herda a manchete da Sala | hora de geração, fontes usadas |
| `/mesa` | Densa, quase estática — intocada em movimento; ganha o status line | — |

**View Transitions** entre salas: o instrumento clicado na Sala expande para
herói da sala anexa (`view-transition-name` partilhado). Ver
`node_modules/next/dist/docs/` para a API desta versão antes de implementar.

## 5. Máquina de dados — correr meses sem ninguém

Arquitectura (toda gratuita):
```
GitHub Actions (cron 4×/dia) ──ingest──▶ data/snapshots/*.json + health.json ──commit──▶ master
                                                                                      │
Vercel (Hobby) ◀──deploy automático────────────────────────────────────────────────────┘
   │ render: lê snapshots do build + live cacheado (CoinGecko/Binance/Alt.me, TTL 60–600 s)
   │ browser: Binance WS (ticker + forceOrder)
   └ /api/health → estado por fonte (alimenta o status line)
```

Fase 0 — obrigatória antes de qualquer pixel:
1. **Branch por defeito → `master`** no GitHub (senão o cron não existe). `main` fica como está.
2. `ingest.yml`: cron `17 */6 * * *`; `git pull --rebase` antes do push; `if: failure()`
   abre/actualiza uma Issue "Ingest falhou" (notificação gratuita por e-mail).
3. `src/lib/data/sources.ts` — **registo único de fontes** (`id`, nome, host, TTL,
   precisa de chave, tipo live|snapshot|browser). Todos os fetchers importam daqui;
   o status line e a `/metodologia` lêem daqui. Zero endpoints hardcoded fora.
4. `data/snapshots/health.json` — por fonte: `lastOk`, `lastError`, `consecutiveFailures`,
   `points`. Escrito pelo ingest; exposto em `/api/health`; lido pelo status line.
5. Validação **zod** em toda a escrita de snapshot; nunca sobrescrever bom com vazio;
   nunca escrever série com menos pontos do que a anterior.
6. `market.json`/`sentiment.json` deixam de ser fixtures: o ingest escreve-os como
   "último bom" e o render marca `stale` quando `> 6 h`.
7. `/api/cron/refresh-heavy`: `CRON_SECRET` obrigatório (401 se ausente), só `POST`.
8. Circuit-breaker em `cachedFetch`: 3 × 429 seguidos → servir stale 5 min sem bater.
9. `.github/workflows/freshness.yml` semanal: se `NEXT_PUBLIC_SITE_URL` existir,
   bate `/api/health` e falha se alguma fonte tiver `consecutiveFailures ≥ 4`.
10. `vercel.json` mínimo (região `cdg1`, sem cron — o cron é do GitHub).
11. Remover `useBoardRefresh` (RSC refresh 60 s por utilizador) — a vida vem do WS;
    os snapshots mudam 4×/dia; `router.refresh()` só ao voltar de tab oculto > 10 min.

## 6. Área profissional (estrutura, não produto)
- `src/app/[locale]/pro/page.tsx` — "Sala Pro": página honesta do que virá
  (`docs/PLANO-P1-PRO.md`), visível só com `NEXT_PUBLIC_PRO_ENABLED=1`.
- `src/lib/pro/` — interfaces (`ProSource`, `Entitlement`) e um `sources.ts`
  espelho para Bitquery/Etherscan avançado. Nada de auth ainda.
- Todo o instrumento aceita `tier: "free" | "pro"` (default free) — a grelha
  já sabe reservar lugar.

## 7. Fases de execução (cada fase = 1 commit; gates verdes)

| Fase | Âmbito | Aceitação |
|---|---|---|
| **F0 Máquina** | §5 completo | `gh api` mostra default `master`; `gh run list` mostra ingest a correr; `health.json` existe; `/api/health` 200; unit tests para zod/sources/breaker |
| **F1 Fundação** | fontes Archivo + Martian Mono via `next/font/google`, tokens §2.2, `Glyph`, `Instrumento`, `formatNumber`, `@property --wght`, view-transition base | `/estilo` mostra tudo; contraste AA; e2e de tema/tipografia verde |
| **F2 A Sala** | §3 completo; ritual→/brief, watchlist→/mesa; remover placas V4 da entrada | sem scroll a 1280×720 e 1440×900 (`scrollHeight ≤ innerHeight`); 375 px empilha; 8 instrumentos; E8 actualizado; 0 dados repetidos |
| **F3 Salas anexas A** | `/mercado`, `/fluxos`, `/defi`, `/cadeias` conforme §4 + copy por campo | herói ≥ 60vh em cada; tooltips ⌖ com fonte em todos os campos; PT/EN |
| **F4 Salas anexas B** | `/casos`, `/aprender`, `/ferramentas`, `/brief`, `/mesa`, `/metodologia` (lê `sources.ts`), §6 Pro | view transitions Sala→sala; Pro atrás de flag |
| **F5 Auditoria** | visual ponto a ponto (2 temas × 2 locales × desktop/375 × reduced-motion), fps, memória 10 min, a11y teclado, i18n paridade; docs (`AGENTS.md`, `design-system.md`, skill `crypto-info-site`, README); apagar `_inventario-dados.md` e scripts `_*` | lint · typecheck · unit · build · e2e verdes; `docs/AUDITORIA-V5.md`; push |

Divisão de trabalho: planeamento, decisões de design, revisão de diffs e
auditoria visual final são do lead; implementação, gates e provas
(screenshots, logs) são do executor. Cada handoff cita a secção deste doc.

## 8. Copy — regras por campo (aplicam-se em F2–F4)
- Título do instrumento: substantivo, sentence case, ≤ 3 palavras ("Caudal", "Alavancagem").
- Leitura: uma frase, presente do indicativo, sujeito = o mercado ou o dado
  ("O dinheiro entra nos ETF pelo quinto dia."). Nunca "Leitura:".
- Fonte: nome próprio + hora ("DefiLlama, 05:17"). Nunca URL crua no ecrã.
- Estado: "indisponível", "desactualizado desde 17 Set", "amostra curta (13 dias)".
- Explicação (⌖): três frases — o que mede, de onde vem, porque importa. Sem
  jargão sem glossário (`src/lib/jargon`).
- EN é traduzido por sentido, não literal; mesmas regras.
