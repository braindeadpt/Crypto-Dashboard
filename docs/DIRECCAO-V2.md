# DIRECÇÃO V2 — CLAREZA

> Documento de direcção de produto e design. Responde às perguntas de
> estratégia antes de executar. Redige-se antes do código; executa-se por
> fatias verificáveis. Substitui a lógica incremental do PLANO-CLAREZA.

## 0. O brief original (recuperado da sessão de 16-09, 03:03)

- Frontpage = **análise de todo o mercado em segundos**: mapas, gráficos e
  informação meticulosamente escolhidos, Bitcoin sempre como factor
  principal. O utilizador não abre 10 tabs — abre esta.
- Páginas por tema: **DeFi, literacia financeira, ferramentas
  (verificação de wallets), memecoins, blockchains**.
- Referência de inspiração: **chemistdefi.com** — inspirar, não copiar.
- Direccionado ao mercado português, do iniciado ao profissional.
- Bar: design inovador, efeito wow, nota 10, portfólio pessoal.
- "O site existente é amador em quase tudo — praticamente não se aproveita
  nada."
- Futuro tier Pro pago (Bitquery MCP já identificado).

## 1. Estratégia — as perguntas respondidas

### 1.1 Quem é o utilizador? (personas e o que cada uma quer em 10s)

Contexto de mercado (fontes: BlackRock/YouGov 2024, Statista 2024):

- **Portugal é o mercado nº1 da Europa em adopção crypto entre
  investidores: 43% dos investidores portugueses detêm crypto.**
- ~12% da população (~1,25M pessoas) detém ou deteve crypto.
- Contexto fiscal único: regra dos 365 dias (28% sobre mais-valias
  <1 ano, isenção >1 ano) — nenhum produto global cobre isto.
- Não existe nenhum observatório editorial de mercado em PT-PT. Os
  portugueses leem CMC/CoinGlass em inglês ou seguem Twitter.

Personas (ordem de importância para o produto):

| Persona | Pergunta diária | O que vê em 10s | Aprofundamento |
|---|---|---|---|
| **Curioso/iniciado** (maioria) | "Está a subir ou a descer? Devo preocupar-me?" | Manchete + regime + BTC/ETH | Aprender, Caso&Efeito |
| **Holder activo** (o núcleo) | "O que mudou desde ontem? Para onde vai o dinheiro?" | Diff desde última visita, fluxos ETF/stables, rotação | Mercado, Fluxos, Mesa |
| **Degen/DeFi** | "Que narrativa está a correr? Onde está o risco?" | Sector map, funding, memecoins | DeFi, Cadeias, Casos |
| **Profissional/empresa** | "Posso citar isto? De onde vem cada número?" | Metodologia, fontes, timestamps, exportável | Metodologia, Mesa |

Regra de desenho: a entrada serve as 4 personas em camadas (Essencial →
Analista já existe — a V2 torna o corte editorial, não só densidade).

### 1.2 Porque abre a página todos os dias? (o mecanismo de retorno)

Um observatório volta a ser aberto se tiver **um ritual diário com
recompensa real**:

1. **A pergunta**: "O que mudou desde que olhei?" — `SinceLastVisit` já
   existe mas está enterrado. Na V2 é a segunda coisa no ecrã.
2. **A síntese**: manchete verificável em 60 segundos (F6 feito — falta
   torná-la visível).
3. **O artefacto partilhável**: cartão diário ("Estado do mercado —
   16 Set") que o utilizador pode copiar/partilhar → cada partilha é
   marketing orgânico e prova de utilidade.
4. **A continuidade**: streak/regime history — "o mercado está em X há
   N dias" cria narrativa que acompanhas.
5. **O gancho de amanhã**: "o que observar a seguir" — 1 linha que dá
   razão para voltar.

### 1.3 Diferenciação — como marcamos a diferença

Anti-modelo: CoinGlass/CMC = terminal denso, inglês, sem voz, para
traders. O nosso espaço vazio:

- **Editorial, não terminal**: cada número chega com uma frase de
  contexto, não uma célula de tabela. (Pudding.cool prova que data-viz +
  narrativa cativa; ChemistDeFi prova que voz + craft diferencia.)
- **Auditável**: nenhum site mainstream deixa-te clicar numa afirmação e
  ver a métrica-fonte. Nós já o fazemos (F6) — torná-lo a assinatura.
- **Português de Portugal**: voz, fiscalidade, Banco de Portugal/CMVM
  context — ninguém serve este mercado com produto próprio.
- **Metáfora própria**: observatório celeste. O mercado como céu:
  AmbientField = campo de estrelas, treemap = constelações, leituras =
  instrumentos. Craft: placas numeradas, coordenadas, bordas gravadas.

### 1.4 Hierarquia de informação — ordem de grandeza na entrada

1. **Manchete** (1 frase verificável) — o que está a acontecer
2. **Diff da última visita** — o que mudou para ti
3. **Vitais** (5 números: BTC, ETH, Cap, Dom, F&G) — o estado
4. **Mapa-constelação** — a foto do mercado inteiro
5. **Leituras** (Direcção/Dinheiro/Risco) — a interpretação
6. **Fluxos resumidos** — para onde vai o dinheiro
7. **Porta de entrada para os temas** — nav clara por pergunta, não por
   nome técnico
8. **Briefing + watchlist** (Operador+) — o ritual completo

### 1.5 Ferramentas — são úteis?

- Lookup de carteira read-only: útil e diferenciador (poucos em PT).
  Precisa de UX melhor, não de mais features.
- Falta na V1 mas candidatos: conversor, "explica-me este número",
  calculadora 365-dias (orientação, não declaração fiscal — fronteira
  com VISION-tax-module).

### 1.6 O utilizador consegue interpretar? 

Problema actual: densidade sem guia. Soluções V2: cada métrica com
"explica-me isto" (ExplainThisNumber existe — generalizar), escalas
com referência ("funding 0.01% = neutro"), glossário inline no Atlas.

### 1.7 Partilha e SEO

- **Partilha**: cartões OG por rota dinâmica, "copiar leitura" no
  briefing, URLs canónicas estáveis.
- **SEO**: páginas indexáveis por tema + Atlas + casos; PT-PT keywords
  sem concorrência ("mercado crypto hoje", "dominância bitcoin",
  "etf bitcoin fluxos"); structured data (Article, Dataset); sitemap +
  feed já existem — auditar.
- **Marketing**: o artefacto diário partilhável é o motor; cada cartão
  leva marca CLAREZA + URL.

### 1.8 Trends e actualidade

- Trends: sector rotation map (já existe) + trending/narrativa via
  CoinGecko categories (já ligado). V2: superfície "a narrativa da
  semana" editorial.
- Actualidade: data-age visível em todo o lado (já existe — tornar
  parte do craft, não um disclaimer).

### 1.9 Filtragem

- Dial de expertise (já existe) = filtro principal.
- V2: nav por pergunta ("para onde vai o dinheiro?" → /fluxos) em vez
  de jargão; watchlist como filtro pessoal (Operador+).

## 2. Referências — o que aprendemos de cada uma

| Referência | O que faz bem | O que levamos | O que recusamos |
|---|---|---|---|
| **chemistdefi.com** | Craft editorial, placas numeradas, metáfora alquímica, voz, scroll narrativo, Lab de ferramentas | Estrutura em placas/capítulos, detalhe ornamental, separadores, "escrito em X, assentado em Y" | Metáfora alquímica (deles), site de autor (somos observatório, não pessoa) |
| **pudding.cool** | Data-viz como narrativa, stories numeradas, humor na craft | Numerar capítulos, tratar métricas como histórias | Formato artigo-único (somos diário) |
| **coinglass.com** | Cobertura de dados (OI, funding, liq, ETF) | Que dados um profissional espera | Tudo o resto: tabelas densas, sem voz, inglês |
| **Messari** | Research credível, screeners | Credibilidade editorial, glossário | Paywall pesado, frio corporativo |
| **Arkham** | Visual on-chain, dark craft | Grafos de fluxo (futuro wallet tracer) | Foco forense estreito |
| **Observatórios reais** (star charts, Stellarium) | Coordenadas, magnitudes, placas gravadas, legendas de campo | **A nossa metáfora**: constelações, instrumentos, céu | Skeuomorphism pesado |
| **Stellar Cartography** (Gaia/ESA, MXWLL) | 4 vistas dos mesmos 50k corpos — cada vista responde a uma pergunta; transições animadas como dispositivo explicativo; encodings consistentes entre vistas | O modelo exacto para o MarketMap multi-camada: preço/funding/volume/sector = 4 vistas do mesmo céu; transição entre camadas explica a relação | WebGL pesado (ficamos em DOM/SVG leve) |

## 3. Auditoria do produto actual

*(Swarm de 3 agentes — relatórios completos abaixo. Síntese primeiro.)*

### 3.0 Síntese — o diagnóstico real

O produto **não** está estruturalmente partido (0 links/âncoras/erros em
122 páginas) — está **sub-expresso**: tem instrumentos diferenciadores,
dados e cultura de honestidade que quase ninguém vê, embrulhados numa
superfície monótona e numa IA herdada por acréscimo.

**Os 8 problemas-raiz:**

1. **Monocromia literal**: uma família de matiz (azul-violeta), um traço
   (1px hairline), um canto (2px), quatro superfícies que diferem ~4% de
   luminosidade. "Tudo igual" é factually correcto.
2. **Dois dialectos tipográficos**: ~217 utilities Tailwind antigas em
   ~15 componentes (sem Sora, sem escala) vs 421 usos de tokens.
3. **Piso da escala violado**: ~84 tamanhos entre 9–11.2px contra o
   mínimo documentado de 12px. "Texto pequeno" está codificado.
4. **Hierarquia dramática só na home** — e mesmo aí, os números de acto
   "01–04" são comentários de código, não UI. `ActHead` não renderiza
   número. A metáfora de placas existe embrionária e nunca foi ligada.
5. **Dados ligados e mortos**: 7 desks órfãos completos (MarketDesk,
   SentimentDesk, ChartsDesk, MemesDesk, YieldsDesk, LabDesk,
   SectorsDesk), `ReadingCards` morto, `fetchMemeMarkets` sem callers,
   `change7d` de protocolos ingerido e nunca renderizado, RSS curado
   declarado e nunca buscado, `crosshair-*`/`lum-*`/`panel-*` quase
   todos mortos. O produto aparenta mais superfície do que serve.
6. **Tokens fantasma**: `text-fg`/`bg-base`/`var(--fg)` no MarketMap —
   classes que não existem, funcionam por acidente.
7. **A peça de assinatura é invisível**: claims verificáveis (¹²³) são
   marcadores minúsculos; `SinceLastVisit` é uma linha subtil; o melhor
   idioma visual (hairline editorial do HeroPanel/tape) é o menos usado.
8. **Perguntas que podíamos responder e não respondemos**: dominância de
   stables (dados já existem — é só derivar), correlações 90d,
   histórico de liquidações (o WS corre mas não persiste), sustentabilidade
   de yields (endpoint grátis não usado).

**O que é sólido e fica:** tokens por papéis, dual-theme, motion com
reduced-motion em 3 camadas, view-transitions já com nomes partilhados,
Regua/Pulso/MarketMap/Sparkline (SVG artesanal = a matéria-prima do
observatório), DataAge ubíquo, trilho de auditoria do regime,
séries históricas 90d (12 métricas), snapshots com fallbacks honestos.

## 4. Nova arquitectura de informação — página a página

Princípio: **a nav responde a perguntas, não nomeia tecnologias.**
Cada página tem UMA pergunta-mãe, declarada no topo da placa.

### 4.1 Nav primária (8 itens, de 9)

| Nav | Rota | Pergunta que responde | Mudança |
|---|---|---|---|
| Agora | `/` | "O que está a acontecer?" | reconstruída (V2) |
| Mercado | `/mercado` | "Como está o céu inteiro?" | redesign |
| Fluxos | `/fluxos` | "Para onde vai o dinheiro?" | redesign |
| Narrativas | `/casos` | "Que histórias movem o mercado?" | renomear IA: Caso&Efeito + rotação + **memecoins** + trending — o namespace `mundo` morre |
| DeFi | `/defi` | "Onde está o capital on-chain?" | absorve `/cadeias` como secção (308 `/cadeias`→`/defi#cadeias`) |
| Aprender | `/aprender` | "O que preciso de entender?" | redesign leve — já é boa |
| Ferramentas | `/ferramentas` | "O que posso verificar?" | ganhar ferramentas reais (ver 4.4) |
| Mesa | `/mesa` | "Mostra-me tudo." | fix labels; fica densa por desenho |

Footer: `/estilo`, `/metodologia`, `/brief`, feed RSS.

### 4.2 Página a página — link a link, gráfico a gráfico

**`/` Agora** — scroll narrativo em placas:

- **Placa 0 · Manchete** — frase verificável; claims ¹²³ passam a
  marcadores visíveis (chip numerado, não superscript minúsculo).
  `SinceLastVisit` promovido para logo a seguir à manchete ("o que mudou
  desde que olhaste" = a pergunta de retorno nº1).
- **Placa I · Vitais** — 5 números + tape; AmbientField como fundo do
  observatório (não canto mascarado).
- **Placa II · Constelação** — MarketMap; 4 camadas = 4 vistas do mesmo
  céu, com transição animada explicativa (lição Stellar Cartography).
  Tiles passam a abrir painel de detalhe rico (ver 4.4 — rota de activo).
- **Placa III · Instrumentos** — Pulso + RegimeHistory + 3 leituras com
  auditoria.
- **Placa IV · O ritual** — briefing 5 slots (Operador+) + artefacto
  partilhável (cartão do dia → copiar/partilhar).
- **Nav de aprofundamento** — por pergunta ("para onde vai o dinheiro?"),
  não por slug.

**`/mercado`** — a mesma constelação em detalhe: mapa + tabela.
Fix: tabela top-40 precisa de destino → liga ao painel de activo (4.4).

**`/fluxos`** — stables, ETF, alavancagem, liquidações live. Fix: parar
de chamar `getFrontPageData()` inteiro por `.sentiment` — fetch estreito.
Derivar **dominância de stables** (dados já existem).

**`/casos` → Narrativas** — Caso&Efeito (cartões com hierarquia real, não
parede de texto), rotação sectorial, **memecoins ressuscitados**
(`fetchMemeMarkets` existe, morto — ligar), trending. Fix: layout editorial
com capa por caso, não grid uniforme.

**`/defi`** — absorve `/cadeias` (ranking de cadeias vive aqui — é a
mesma pergunta). Renderizar `change7d` (ingerido, nunca mostrado).
Yields com nota de sustentabilidade (APY desc enviesa para risco —
dizer isso).

**`/aprender`** — ciclo + Atlas + segurança + Portugal. Fix: já bom;
harmonizar tipografia ao dialecto novo.

**`/ferramentas`** — wallet lookup (já forte) + novas: conversor,
"quanto falta para os 365 dias" (orientação fiscal leve — fronteira
VISION-tax-module respeitada), checksum/visualizador de endereço.
Justifica o nome no plural.

**`/mesa`** — a mesa densa fica. Fix: `yields`/`defiPulse` linkam
`/defi` (hoje apontam para `/fluxos` — promessa enganadora).

**`/metodologia`, `/estilo`, `/brief`, `/atlas/[slug]`, `/caso/[id]`** —
mantêm-se; `/estilo` actualizado para o sistema v2.

### 4.3 Correcções de IA/interacção decididas

| # | Defeito | Decisão |
|---|---|---|
| 1 | `ExpertiseDial` navega para `/mesa` ao escolher Analista | Remover o push — dial controla densidade apenas; link "Mesa" existe na nav |
| 2 | Tiles do mapa e linhas da tabela sem destino | Painel de detalhe de activo (drawer/inline) na V3; rota `/activo/[id]` candidata posterior |
| 3 | `readings` gate invertido (analyst perde explicação) | Manter — analista vê números nus por escolha; documentar |
| 4 | 5 regras de densidade mortas | Remover de `expertise.ts` |
| 5 | Fetch duplicado `getFrontPageData()` em 3 rotas | Fetchers estreitos por rota |
| 6 | 11 endpoints `/api/*` sem consumidor | Manter como API pública read-only (documentar no README) — são a porta do futuro tier Pro |
| 7 | Copy hardcoded bilingue em 8 componentes | Mover tudo para `messages/` |
| 8 | 3 namespaces i18n mortos + 7 só-de-mortos + chaves mortas | Purgar na V0 |
| 9 | 9 componentes mortos (desks órfãos + ReadingCards + ExplainTerm) | Purgar na V0 — mas reutilizar `MemesDesk`/`YieldsDesk` como base para Narrativas/DeFi |
| 10 | `text-fg`/`bg-base`/`var(--fg)` tokens fantasma no MarketMap | Corrigir na V0 |
| 11 | `font-weight:550` sem peso carregado | Fix: carregar peso variável ou usar 600 |

### 4.4 Adições de produto decididas

- **Artefacto partilhável** — cartão "Estado do mercado — {data}" (PNG
  via canvas, padrão `pulsoExport`) no fim do briefing. Motor de
  marketing orgânico + SEO social.
- **Dominância de stables** — derivação trivial dos dados existentes.
- **Painel de activo** — click no tile/linha abre detalhe (preço,
  sparkline, funding, história-90d, links caso/atlas relacionados).
- **Memecoins** — superfície real em Narrativas.
- **Persistir liquidações** — ingest server-side do stream forceOrder
  para série histórica (candidato V5; requer worker — avaliar custo).

## 5. Sistema visual v2 — "Observatório"

### 5.1 A metáfora

O mercado é um céu. CLAREZA é o observatório que o lê.

- `AmbientField` = campo de estrelas (intensidade = turbulência do
  regime — já implementado, generalizar para além do hero).
- `MarketMap` = carta celeste — activos como corpos, tamanho = massa
  (mcap), cor = comportamento na camada escolhida.
- `Pulso`/`Regua` = instrumentos de navegação (sextante, régua de
  percentis).
- Secções = **placas** gravadas — número + título + coordenada mono +
  idade dos dados.
- "Luz = significado" — o sistema `.lum-*`/`--glow-*` (hoje quase morto)
  torna-se a linguagem de ênfase: o que importa, brilha.

### 5.2 Vocabulário de superfícies (novo)

| Superfície | Uso | Aspecto |
|---|---|---|
| `campo` | fundo de placa/heróis | AmbientField enquadrado, fade radial |
| `placa` | capítulo de página | número gravado (mono, accent), título display, hairline topo+bottom — o idioma editorial do HeroPanel promovido a padrão |
| `instrumento` | viz de dados | `bg-surface` + hairline (o `.card` actual, renomeado) |
| `registo` | dados densos/tabelas | `bg-elevated` recuado, mono, linhas finas |
| `nota` | caveats/metodologia | accent-dim — já existe, manter |

Morrem: `.panel`, `.panel-tertiary`, `.panel-solid`, `.eyebrow`,
`.crosshair-*`, `.stream-row`, `.rise-in`, `.flash-once`, `.cycle-fill`.

### 5.3 Tipografia

- **Nova família editorial**: uma serif óptica para manchete e títulos
  de placa (candidata: Newsreader — óptica, grátis, self-hosted via
  next/font). Sora passa a display secundário/labels; Plex Sans corpo;
  Plex Mono dados/coordenadas. *Decisão aberta: serif vs Sora-grande —
  prototipar as duas na V1.*
- **Dialecto único**: migrar as ~217 utilities Tailwind antigas para
  tokens. Proibido `text-xs`-ad-hoc fora dos tokens.
- **Escala honesta**: mínimo absoluto 11px (`--text-micro` só para
  coordenadas/legendas); saltos de escala por página — cada rota tem um
  momento display, não só a home.
- `font-weight:550` → resolver (variável ou 600).

### 5.4 Layout

- **Um container**: `.obs-shell` (1440) para todo o produto; conteúdo
  editorial `max-w-3xl` dentro de placas quando fizer sentido.
- **Ritmo único**: `.board-act` (3.25/4.5rem) para todas as placas;
  proibido `mt-N` ad-hoc entre secções.
- **Grelhas com hierarquia**: fim do `grid-cols-N` uniforme — cada
  placa tem um protagonista (~20/80).

### 5.5 Motion

- Entrada por placa em scroll (IntersectionObserver, gatilho
  `prefers-reduced-motion` respeitado — camadas já existem).
- MarketMap: transição de camada como dispositivo explicativo (a cor
  muda, a geometria fica — o olho segue os corpos).
- Manter: flash de valores, view-transitions com nomes partilhados,
  entrada uma-vez-por-sessão.

### 5.6 Craft de detalhe (a diferença "nota 10")

- Coordenadas mono nos cantos de placa (`N 38.72° · W 9.14°` — Lisboa —
  ou epoch/altura de bloco como "coordenada" do mercado).
- Separadores ornamentais finos (✦-equivalente nosso: ◇ ou cruzeta de
  mira — recuperar a ideia `.crosshair` como ornamento, não mira).
- Drop cap no briefing diário.
- Placas numeradas reais: `PLACA I · A CONSTELAÇÃO`.

## 6. Plano de execução por fatias

Cada fatia: gates completos (`lint typecheck unit build e2e`) + shots
desktop+mobile antes/depois. Nada avança sem a fatia anterior verde.

| Fatia | Escopo | Critério de aceite |
|---|---|---|
| **V0 · Poda** | Remover 9 componentes mortos, 7+3 namespaces i18n mortos, 5 regras de densidade mortas, CSS morto, tokens fantasma, copy hardcoded → messages | Tudo verde; bundle menor; inventário real |
| **V1 · Fundação** | Tokens v2 (superfícies, escala, plate primitives), decisão serif, dialecto tipográfico único, `/estilo` actualizado, um container/ritmo | `/estilo` mostra o sistema real; zero `text-xs` ad-hoc |
| **V2 · Entrada** | Rebuild `/` em placas: manchete+claims visíveis, SinceLastVisit promovido, constelação, instrumentos, ritual+partilha, nav por pergunta | Mobile cabe quase num ecrã (Essencial); claims descobríveis; shot wow |
| **V3 · Temas** | `/mercado`, `/fluxos` (+dom stables), Narrativas (+memes, editorial), `/defi` (+cadeias, 7d, yields honestos), `/aprender`, `/ferramentas` (+2 tools), `/mesa` (fix links) | Cada página: 1 pergunta, 1 momento display, sem duplicação de métricas |
| **V4 · Partilha+SEO** | Artefacto do dia, OG cards por rota, structured data audit, sitemap/feed check | Cartão partilhável; OG válido em todas as rotas |
| **V5 · Profundidade** | Painel de activo, correlações 90d, liq history (se viável), narrativa da semana | Decidido após V3 |

**O que NÃO muda:** contrato de dados (zero inventado, fontes+timestamps),
expertise dial (sem navegação), read-only, bilingue PT-PT/EN,
reduced-motion, instrumentos Regua/Pulso/MarketMap, metodologia
publicada.
