# CLAREZA — Plano de produto e design (v2)

> Data: 2026-09-16 · Estado: plano aprovado para execução faseada
> Referência de inspiração: chemistdefi.com (estética de "laboratório",
> tese signal-vs-noise, Lab de ferramentas) — inspiração, não cópia.

## 1. O que é

CLAREZA é um **observatório de mercado crypto em português** — o sítio onde
se percebe o mercado inteiro em segundos, sem abrir dez tabs. O nome é a
promessa: **clareza** — o que aconteceu, o que significa, o que importa.

- Público: mercado português/lusófono — do iniciado ao operador
- Bitcoin é sempre o factor principal (dominância, preço, mempool)
- Sem sinais de trading, sem hype, sem conselhos financeiros
- Nunca inventar dados — falhas mostram-se, timestamps sempre visíveis
- Bilingue PT-PT / EN, PT-PT primeiro

## 2. Posição face às alternativas

CoinGecko/CoinMarketCap = listas de preços. TradingView = gráficos para
traders. ChemistDeFi = ensaios + lab pessoal. CLAREZA = **a mesa de
orientação**: síntese + mapa + ferramentas, em português, com honestidade
sobre o que os dados dizem (e não dizem).

## 3. Arquitectura de informação

Cada página tem um trabalho. O dado vive numa casa — outras páginas
linkam, não repetem.

| Rota | Nome | Trabalho |
|---|---|---|
| `/` | **Agora** | O mercado em segundos: hero BTC + mapa + vitals + briefing |
| `/mercado` | **Mercado** | O mapa completo: treemap, dominância, movers, amplitude |
| `/fluxos` | **Fluxos** | De onde vem o dinheiro: stables, ETF, alavancagem, F&G |
| `/defi` | **DeFi** | TVL, chains, protocolos, yields, bridges |
| `/cadeias` | **Cadeias** | Blockchains comparadas: TVL, fees, DEX vol, actividade |
| `/casos` | **Casos** | Causa & Efeito: movers com hipóteses + memecoins heat |
| `/aprender` | **Aprender** | Atlas, literacia financeira, segurança, Portugal |
| `/ferramentas` | **Ferramentas** | Verificação de carteiras, explicador de tx, utilitários |
| `/mesa` | **Mesa** | O board denso do analista (actual `/instrumento`) |

Migração de slugs: `/mundo`→`/casos`, `/contexto`→`/aprender`,
`/instrumento`→`/mesa`, `/carteira`→`/ferramentas` — todos 308 no
`next.config.ts`, como já se faz com os 16 aliases antigos.

### Prioridade de construção

1. **Agora** — a homepage nota-10 (é o que fica no CV)
2. **Mercado** — o treemap/mapa é a peça visual de assinatura
3. **Ferramentas** — verificação de carteiras já existe; ganha página-mãe
4. DeFi / Cadeias / Casos / Aprender — reorganização do que já existe

## 4. Homepage — anatomia

Acima da dobra, em ordem:

1. **Hero** — manchete editorial do dia + BTC em destaque (preço, Δ24h,
   dominância) + campo ambiental (já existe)
2. **Mapa do mercado** — treemap dos top activos (tamanho = market cap,
   cor = Δ24h), clicável. É a resposta visual a "como está o mercado"
   sem ler uma tabela
3. **Pulso + leituras** — radar de regime + Direcção/Risco/Dinheiro
   (como está hoje — síntese, uma vez)
4. **Briefing** — 5 slots (postura → vigiar, deltas, movimento, lição,
   anti-hype)
5. **Aprofundar** — navegação honesta para Mercado/Fluxos/Mesa

Regras: BTC sempre primeiro; cada módulo responde a uma pergunta;
densidade pelo dial (Essencial = hero + mapa + leituras).

## 5. Direcção de design — "Noite" evoluída

Mantemos a identidade (não deitar fora o que funciona):

- Fundo azul-violeta profundo, acento violeta, ciano de ênfase,
  verde/coral direccional com glifo ▲▼
- Sora (display) + IBM Plex Sans + IBM Plex Mono
- Bordas finas, radius 2px, elevação por superfície

**A camada wow (nova):**

- **Números vivos** — tickers contam/transicionam quando mudam
  (flash up/down já existe; alargar a todos os valores-chave)
- **Treemap animado** — rectângulos que redimensionam/suavizam com dados
  novos; hover expande painel de detalhe
- **Entradas coreografadas** — hero → mapa → leituras, stagger curto,
  GSAP ou CSS; entrada só acontece uma vez por sessão
- **View transitions** entre páginas (elemento partilhado: o módulo que
  expande para a página de destino)
- **Campo ambiental reactivo** — partículas mais densas/rápidas em
  tempestade, esparsas em calmo (wow que comunica estado, não decoração)
- **Scroll reveals** discretos nas páginas longas (Aprender, Casos)

Biblioteca: **GSAP** (já há skills internas gsap-* no ambiente) ou
Motion; decisão na fase de execução — o que interessa é a disciplina:
motion sempre com significado, `prefers-reduced-motion` desliga tudo,
sem blur pesado em mobile, 60fps ou nada.

## 6. Módulos de dados por página

| Módulo | Fonte | Página |
|---|---|---|
| Treemap mercado | CoinGecko `/coins/markets` | Agora, Mercado |
| Dominância BTC | CoinGecko `/global` | Agora, Mercado |
| Movers + amplitude | CoinGecko markets | Mercado, Casos |
| Funding/OI/L/S/liqs | Binance Futures | Fluxos, Mesa |
| F&G + histórico | Alternative.me | Fluxos |
| ETF flows | Farside | Fluxos |
| Stablecoins supply | DefiLlama stables | Fluxos, DeFi |
| TVL/chains/protocols | DefiLlama | DeFi, Cadeias |
| Yields/pools | DefiLlama yields | DeFi |
| DEX volume/bridges | DefiLlama | Cadeias |
| Mempool/fees BTC | mempool.space | Agora, Mesa |
| Gas | Etherscan V2 | Cadeias, Mesa |
| Carteiras EVM/BTC | Etherscan V2 + mempool | Ferramentas |
| Trending/memecoins | CoinGecko trending + DexScreener | Casos |

Snapshots locais continuam a alimentar histórico e deltas
(`data/snapshots/` + `snapshots:refresh`).

## 7. Tier Pro (futuro) — já previsto

- **Bitquery MCP** (`https://mcp.bitquery.io`, OAuth 2.1, read-only,
  40+ chains) — analytics de carteiras, fluxos DEX, holders, OHLC
  on-chain; base para ferramentas Pro
- Pro = watchlist persistente, alertas, análise de carteira profunda,
  exportações, acesso a séries longas — sempre read-only
- Grátis continua completo; Pro acrescenta profundidade, nunca paywall
  na informação de segurança/educação

## 8. Padrão profissional (CV-grade)

- Gates: lint + typecheck + unit + build + e2e verde em cada PR
- OG images dinâmicas por rota, RSS feed, sitemap, robots
- `AGENTS.md` como contrato; skills em `.agents/skills/`; MCPs
  documentados; docs canónicos em `docs/`
- Screenshots de verificação por rota (desktop + mobile, PT + EN)
- Acessibilidade: AA nos dois temas, foco visível, skip link,
  touch targets ≥44px, reduced-motion
- Copy PT-PT revisto: zero brasileirismos, frases reais, nunca
  fragmentos de template

## 9. Fases de execução

| Fase | Entrega | Critério de aceite |
|---|---|---|
| **D1** | Fundação motion: biblioteca, entrada coreografada, tickers vivos, view transitions | 60fps, reduced-motion limpo, e2e verde |
| **D2** | Treemap do mercado (componente + dados) na Agora e Mercado | Clicável, sem overflow, mobile ok |
| **D3** | Reorganização de rotas + headers de página unificados | 308s a funcionar, nav actualizada |
| **D4** | Páginas temáticas: DeFi, Cadeias, Ferramentas (mãe), Casos | Cada página com o seu trabalho |
| **D5** | Aprender: Atlas reorganizado + literacia + Portugal | Revisão de datas, copy PT-PT |
| **D6** | Campo ambiental reactivo ao regime + polish final | Wow controlado, sem gimmick |
| **P1** | Tier Pro: auth leve, Bitquery, carteira profunda | Spec à parte |

## 10. Anti-padrões (proibido)

- Gradiente roxo de landing, glassmorphism, blob decorativo
- Cards iguais em pilha sem hierarquia
- Repetir o mesmo dado em duas caixas na mesma página
- Animação contínua que compete com a leitura (marquee, loop)
- Número sem contexto, sem timestamp ou sem fonte
- Fragmento de template como se fosse frase
