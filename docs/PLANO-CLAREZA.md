# CLAREZA — Plano de produto e design (v3)

> Data: 2026-09-16 · Estado: plano aprovado para execução faseada
> Referência de inspiração: chemistdefi.com (estética de "laboratório",
> tese signal-vs-noise, Lab de ferramentas) — inspiração, não cópia.
> v3: integra pesquisa competitiva profunda (ver §11). Escopo completo
> definido agora; execução por fases, sem pressa, padrão nota-10.

## 1. O que é

CLAREZA é um **observatório de mercado crypto em português** — o sítio onde
se percebe o mercado inteiro em segundos, sem abrir dez tabs. O nome é a
promessa: **clareza** — o que aconteceu, o que significa, o que importa.

- Público: mercado português/lusófono — do iniciado ao operador
- Bitcoin é sempre o factor principal (dominância, preço, mempool)
- Sem sinais de trading, sem hype, sem conselhos financeiros
- Nunca inventar dados — falhas mostram-se, timestamps sempre visíveis
- Bilingue PT-PT / EN, PT-PT primeiro
- Read-only declarado: "não queremos saber das tuas posições" é
  posicionamento, não ausência de feature

## 2. Posição face às alternativas

CoinGecko/CoinMarketCap = listas de preços. TradingView = gráficos para
traders. CoinGlass = posicionamento/derivados. DefiLlama = DeFi denso e
grátis. Glassnode = biblioteca de métricas on-chain. Farside = tabela nua
de ETF flows que o mundo inteiro cita. Newsletters = síntese escrita
assíncrona. FlowPulse = prova de conceito de regime, execução fraca.

CLAREZA = **a mesa de orientação**: síntese de regime decomponível +
mapa + ferramentas, em português, com honestidade sobre o que os dados
dizem (e não dizem). Nenhum produto no mundo combina: síntese honesta,
densidade adaptativa, PT-PT primário e postura read-only sem agenda.

Concorrentes conceptuais a estudar a fundo: **DefiLlama** (ethos
grátis/transparente/metodologia publicada), **CoinGlass** (camada de
posicionamento), **FlowPulse** (o que fazer melhor em regime).

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
- Tabular figures (`tnum`) em todos os valores monetários — o "sinal
  quieto" de ADN financeiro (lição Stripe)

**A camada wow:**

- **Números vivos** — tickers contam/transicionam quando mudam
  (flash up/down já existe; alargar a todos os valores-chave)
- **Treemap animado** — rectângulos que redimensionam/suavizam com dados
  novos; hover expande painel de detalhe
- **Entradas coreografadas** — hero → mapa → leituras, stagger curto,
  GSAP ou CSS; entrada só acontece uma vez por sessão
- **View transitions** entre páginas (elemento partilhado: o módulo que
  expande para a página de destino)
- **Campo ambiental reactivo** — partículas mais densas/rápidas em
  tempestade, esparsas em calmo (wow que comunica estado, não decoração).
  É a nossa metáfora visual assinatura — o equivalente ao que os blocos
  da mempool.space são para eles: reconhecível, própria, não copiável
- **Scroll reveals** discretos nas páginas longas (Aprender, Casos)

Biblioteca: **GSAP** (já há skills internas gsap-* no ambiente) ou
Motion; decisão na fase de execução — o que interessa é a disciplina:
motion sempre com significado, `prefers-reduced-motion` desliga tudo,
sem blur pesado em mobile, 60fps ou nada.

Referências de design a dissecar: **Finviz/Matrix** (breadth visual),
**Linear** (escada de superfícies escuras + hairlines — extrair
princípios, nunca a skin), **mempool.space** (metáfora assinatura),
**Stripe** (tabular figures), **Bloomberg** (conceal complexity:
densidade ≠ clutter).

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
- **Página de metodologia publicada** (`/metodologia` ou secção em
  `/aprender`) — pesos das leituras compostas, fontes por métrica,
  janelas de percentil. O modelo DefiLlama: a confiança vem de poder
  auditar como o número foi feito

## 9. Escopo completo — backlog de diferenciais

Tudo o que o produto cobre, classificado por estado. O plano cobre
tudo; a execução é faseada (§10).

### Já construído (manter e polir)

- Treemap de mercado clicável com janela de cor (1h/24h/7d) — Agora, Mercado
- Campo ambiental reactivo ao regime — Agora
- Números vivos / AnimatedNumber — valores-chave
- Leituras compostas Direcção/Risco/Dinheiro + Pulso radar — Agora
- Briefing editorial 5 slots — Agora, `/brief`
- Percentis históricos com gémeo em linguagem comum
  (`jargon.percentile`, `Regua`, `Pulso` — "mais alto que X% dos
  últimos N dias")
- Rotas temáticas IA-v2 + 308s — Mercado, Fluxos, DeFi, Cadeias,
  Casos, Aprender, Ferramentas, Mesa
- Dial Essencial/Operador/Analista (`useExpertise`/`ExpertiseGate`)
- Caso & Efeito + rotação sectorial — Casos
- Verificação de carteiras EVM/BTC — Ferramentas
- Snapshots locais para histórico e deltas

### Novo — da pesquisa competitiva (§11)

| # | Diferencial | O que é | Porquê ninguém faz |
|---|---|---|---|
| R1 | **"Desde a tua última visita"** | Diff de estado na entrada: amplitude 62%→41%, funding normalizou, F&G −14pts. Snapshot dos vitals em localStorage | Transforma observatório estático em ritual diário — o mecanismo de retenção das newsletters sem depender de email |
| R2 | **História do regime** | Sparkline/evolução do regime nos últimos 30-90d (dos snapshots locais). O estado do mercado como objecto com passado, não só presente | Glassnode tem charts de métricas; ninguém tem "história do estado" como peça de primeira classe |
| R3 | **Regime decomposto** | O Pulso/Regime mostra a contribuição de cada ingrediente (amplitude, funding, vol, ETF, F&G) — expandível, com lacunas declaradas | F&G viralizou um número sem decomposição; o nosso número explica-se a si próprio |
| R4 | **Treemap multi-camada** | A cor do mapa alterna: variação de preço, funding, volume anómalo, rotação de sector | CryptoBubbles provou o formato; ninguém o estendeu a "mapa de posicionamento" |
| R5 | **"60 segundos" verificável** | Parágrafo de síntese gerado a dados em que cada afirmação é clicável e abre a métrica-fonte | Newsletters provam o apetite por síntese; síntese ao vivo com fontes verificáveis é inédito |
| R6 | **ETF flows de primeira classe** | Streaks, cumulativo, dia-record, Δ semanal — apresentar melhor que a fonte o dado mais citado do ciclo institucional | O mundo inteiro lê uma tabela HTML nua na Farside |
| R7 | **Frescura sistemática** | Cada módulo com "actualizado há X min" + fonte + aviso explícito de stale | Queixa nº1 em todos os trackers é dado velho apresentado como fresco; transparência operacional é confiança |
| R8 | **Essencial mobile-first** | O modo Essencial desenhado para telemóvel primeiro — 5 números + 1 frase, não um desktop encolhido | Produtos data-dense são desktop-first; o mercado inteiro em segundos tem de caber num ecrã de bolso |
| R9 | **Metodologia publicada** | Pesos, fontes e janelas documentadas e linkáveis de cada leitura | Métrica composta opaca é só mais um F&G; decomponível é credibilidade |

### Descartado de propósito (commodity, não diferencia)

Tabela top-100 sem síntese · heatmap sem camada interpretativa · F&G
embedado como gadget · watchlist/portfolio tracker · alertas de preço ·
charts TradingView embedados · "AI summary" genérica de preços · feed de
notícias agregado · qualquer coisa que peça chaves ou posições.

## 10. Fases de execução

O que já saiu (ver `git log`): IA-v2 + 308s, treemap, números vivos,
campo ambiental reactivo, homepage editorial, leituras + Pulso,
percentis com gémeo, páginas temáticas.

| Fase | Entrega | Critério de aceite |
|---|---|---|
| **F1** ✅ | Fundação motion: entrada coreografada única por sessão, tickers vivos alargados, view transitions | 60fps, reduced-motion limpo, e2e verde — **entregue 2026-09-16** |
| **F2** | Frescura sistemática (R7): "há X min" + fonte por módulo, aviso de stale explícito | Nenhum número sem idade visível |
| **F3** | "Desde a tua última visita" (R1) + história do regime (R2) | Diff honesto, regime com passado de 30-90d |
| **F4** | Regime decomposto (R3) + metodologia publicada (R9) | Cada leitura auditable até à fonte |
| **F5** | Treemap multi-camada (R4) + ETF flows de primeira classe (R6) | Cor alternável, streaks/cumulativo/record |
| **F6** | "60 segundos" verificável (R5) | Cada afirmação clicável → métrica-fonte |
| **F7** | Essencial mobile-first (R8) + polish final | Nota-10 no telemóvel, não só desktop |
| **P1** | Tier Pro: auth leve, Bitquery, carteira profunda | Spec à parte |

Regras da faseada: uma fase de cada vez, gates verdes antes de avançar,
sem pressa — nível máximo de execução é o critério, não velocidade.

## 11. Pesquisa competitiva — síntese (2026-09-16)

Pesquisa profunda sobre ~30 produtos (agregadores, on-chain, regime,
editorial, educação, design). Relatório completo no histórico da
sessão; conclusões accionáveis:

**O que TODOS fazem (commodity — não perseguir):** tabela top-100,
heatmap verde/vermelho, página de activo = parede de dados, F&G como
gadget, watchlist/portfolio, charts TradingView, paywall $30-800/mês no
que interessa.

**O que ninguém faz bem (as nossas lacunas-alvo):**
1. Síntese honesta de regime em tempo real — dados existem por todo o
   lado, "o que significa agora" não existe
2. Um só ecrã para o mercado inteiro — spot/derivados/on-chain/ETF/
   mempool/DeFi vivem em 6+ tabs (Koyfin fez isto para macro tradfi;
   ninguém para crypto)
3. Read-only sem agenda comercial — CMC é da Binance, academias são
   funis de exchanges, newsletters vendem premium
4. Densidade adaptativa real — é ou Lite insultuoso ou Pro esmagador
5. PT-PT como cidadão de primeira classe — zero produtos sérios de
   dados crypto em português europeu
6. Percentis/contexto temporal sistemático — dados absolutos sem
   posição relativa
7. Síntese escrita + dashboard vivo fundidos — o "briefing que se
   actualiza" não existe
8. Explicabilidade inline — jargão traduzido ao nível do dado

**Armadilhas onde produtos morrem (mitigações já no plano):**
- Dado stale invisível → R7 frescura sistemática + regra nº1
- Fontes gratuitas frágeis (Farside é scraping, F&G muda metodologia
  sem aviso) → cache própria, fallbacks, lacuna declarada
- Overload sem hierarquia → o dial existe; o Essencial tem de ser
  radicalmente simples (R8)
- Síntese lida como "sinal" → disciplina editorial: descrevemos o que
  aconteceu, nunca previsão nem conselho; disclaimers visíveis
- Métrica composta opaca → R3/R9 decomposição + metodologia publicada
- Bear markets matam tráfego de trackers (-70-90%) → bilingue + educação
  permanente retêm nos invernos

## 12. Anti-padrões (proibido)

- Gradiente roxo de landing, glassmorphism, blob decorativo
- Cards iguais em pilha sem hierarquia
- Repetir o mesmo dado em duas caixas na mesma página
- Animação contínua que compete com a leitura (marquee, loop)
- Número sem contexto, sem timestamp ou sem fonte
- Fragmento de template como se fosse frase
- Texto de regime que possa ser lido como previsão ou conselho
- "Lite mode" que esconde dados em vez de os ordenar por profundidade
