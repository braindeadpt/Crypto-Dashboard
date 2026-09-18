# CLAREZA — Estudo de visualização: catálogo de ideias

> Pesquisa para encontrar as visualizações certas para a entrada e para as
> páginas temáticas. Método: cruzar **os dados que temos mesmo** com **formas
> visuais poderosas e pouco usadas**, e ficar só com o que responde a uma
> pergunta real.
>
> Data: 2026-09-18 · Companheiro de `docs/PLANO-MOVIMENTO.md`

---

## 1. Método

Ideias de dashboard costumam falhar por dois motivos opostos: ou são cópias
(mais um velocímetro de Fear & Greed), ou são bonitas sem dados que as
sustentem. Para evitar ambos, cada ideia deste catálogo passa por três filtros:

1. **Que pergunta responde?** Se não responde a nenhuma, sai.
2. **Temos o dado, verificado?** Cada ideia traz o seu estado real (§2).
3. **Porque é original?** Se já está no CoinGecko e no Coinglass, não diferencia.

---

## 2. Inventário verificado (o que temos mesmo)

### 2.1 O activo mais subaproveitado — 12 séries diárias alinhadas a 90 dias

`data/snapshots/history.json`, verificado:

| Série | Pontos | Série | Pontos |
|---|---|---|---|
| `price_btc` | 90 | `vol_realized_btc` | 90 |
| `funding_btc` | 90 | `stablecoin_supply` | 90 |
| `fear_greed` | 90 | `volume_btc` | 90 |
| `tvl` | 90 | `oi_btc` | 61 |
| `etf_btc_flow` | 15 | `fee_btc` | 2 |
| `breadth` | 2 | `btc_dominance` | 2 |

**Nove séries com 90 dias, alinhadas ao dia.** Hoje servem apenas para calcular
um percentil por métrica (a Régua). Séries alinhadas são exactamente o
substrato de que as visualizações comparativas precisam — está tudo lá, por
usar.

### 2.2 Fluxos ao vivo
- `useForceLiquidations` — **cada liquidação real** da Binance, em tempo real.
- `useLiveTicker` — preços ao segundo (BTC/ETH/SOL).

### 2.3 Instantâneos ricos
- **Sectores**: 24 sectores temáticos, quota e Δ24h — mas **só 2 dias de
  história**.
- **ETF**: BTC/ETH/SOL, séries por emitente, sequências (streaks) — **12 dias**.
- **DeFi**: TVL, protocolos, cadeias, stablecoins, vigilância de peg.
- **Derivados**: funding, OI e rácio long/short por símbolo.
- **Mapa**: camadas comutáveis já implementadas (`mapLayers.ts`).

### 2.4 A lacuna que bloqueia tudo — o cron nunca corre

Séries sem história utilizável: sectores (2d), ETF (12d), amplitude (2d),
dominância (2d), taxas (2d).

**Não acumulam sozinhas, e não vão acumular.** Verificado:

- A rota `/api/cron/refresh-heavy` **existe**.
- **Nada a chama**: não há `schedule` em `.github/workflows/`, não há
  `vercel.json` com `crons`.
- O padrão confirma-o de forma exacta: as únicas três séries paradas em 2 pontos
  (`fee_btc`, `breadth`, `btc_dominance`) são precisamente as três cujo
  bootstrap é *"cron append"* — sem fonte de backfill. Todas as que têm backfill
  (preço, funding, OI, F&G, TVL, volume, volatilidade, stablecoins) têm 90
  pontos, porque foram semeadas de uma vez.

Ou seja: **a história só cresce quando alguém corre `npm run snapshots:refresh` à
mão.** Isto não é um calendário — é um bloqueio permanente, e é barato de
resolver (§6).

---

## 3. As formas que encaixam (e que ninguém usa em crypto)

Pesquisa de formas: [Horizon chart](https://www.visualizing.org/horizon-chart) ·
[FlowingData](https://flowingdata.com/chart-types/) ·
[Vega-Lite gallery](https://vega.github.io/vega-lite/examples/)

**Horizon chart** — comprime muitas séries paralelas em pouco espaço vertical,
dobrando e sobrepondo bandas. Indicado para *"comparar 10+ séries e detectar
anomalias em fluxos paralelos"*. É **exactamente** a nossa situação (§2.1) e
não se vê em nenhum site de crypto.

**Bump chart** — posição no ranking ao longo do tempo. Serve quando *"interessa
quem está à frente e quem escorregou, mais do que os valores exactos"*. É a
forma natural para rotação de sectores.

**Connected scatterplot** — trajectória de duas variáveis no tempo, com rasto.
Mostra *relações*, não níveis.

---

## 4. Catálogo de ideias

Estado dos dados: **A** = construível já · **B** = precisa de acumulação ·
**C** = precisa de nova ingestão.

---

### IDEIA 1 — "As Correntes" · horizon chart de 9 séries · **A**

**Pergunta:** *o que está fora do normal hoje, de tudo o que move o mercado?*

Nove séries de 90 dias empilhadas como bandas horizonte, em poucas linhas de
altura. Cada banda mostra desvio face à sua própria mediana — não valores
absolutos — por isso comparam-se directamente apesar de unidades diferentes
(dólares, percentagens, índices).

O olho encontra a anomalia sem ler um número: a banda que está escura na ponta
direita é a que está esticada hoje.

**Original porque:** nenhum produto de crypto usa horizonte. Todos mostram um
gráfico grande de cada vez, e obrigam a comparar de memória.
**Movimento:** bandas preenchem da esquerda para a direita ao entrar; a aresta
de hoje pulsa ao ritmo do Maestro.
**Nota:** é candidata a peça-assinatura da entrada — densa, bonita e informativa
ao mesmo tempo.

---

### IDEIA 2 — "Concordância" · quantos sinais concordam com o preço · **A**

**Pergunta:** *o movimento tem apoio, ou está sozinho?*

Para cada um dos últimos 90 dias, conta quantos sinais (funding, OI, amplitude,
volume, stablecoins, F&G) se moveram **no mesmo sentido do preço**. Desenha
essa concordância como faixa contínua.

A leitura é imediata e vale ouro: **preço a subir com concordância a cair** é a
definição visual de um movimento sem apoio. Quando o preço sobe e a faixa
esvazia, alguém está a ficar offside.

**Original porque:** é a coisa que os analistas fazem de cabeça, e que nenhum
site mostra. É o motor de Caso & Efeito (que já existe, `correlate.ts`)
transformado em imagem e estendido no tempo.
**Movimento:** a faixa desenha-se dia a dia; divergências acendem.
**Cuidado:** concordância não é causa. A copy usa "consistente com", como manda
a Regra nº1.

---

### IDEIA 3 — "Onde Doeu" · liquidações reais, não estimadas · **A**

**Pergunta:** *onde é que a alavancagem partiu mesmo hoje?*

O [Coinglass](https://www.coinglass.com/pro/futures/LiquidationHeatMap)
**estima** onde liquidações *poderão* ocorrer, assumindo níveis de alavancagem
— é um modelo de previsão. Este projecto já apagou zonas sintéticas por serem
dados fabricados (P1).

Nós recebemos **os eventos verdadeiros**. Plotar cada liquidação real no eixo
do preço, acumulando durante a sessão: long e short por cor, magnitude pelo
nocional. Ao fim de horas tem-se o mapa do que aconteceu, não do que se supõe.

**Original porque:** mais honesto que a referência do mercado, e ninguém
apresenta bem o stream real. Rótulo obrigatório: *"observado, não previsto"*.
**Movimento:** cada liquidação chega com um golpe — o canal *Impacto* do
Maestro. É a peça que se partilha.

---

### IDEIA 4 — "A Multidão" · connected scatterplot com rasto · **A**

**Pergunta:** *a multidão está posicionada contra o preço?*

Campo de dois eixos: posicionamento (rácio long/short) contra direcção do
preço. O marcador de hoje deixa **rasto** dos últimos dias, por isso vê-se a
trajectória — a multidão a carregar num lado enquanto o preço vai para o outro.

Quadrantes nomeados em português comum, não em jargão ("multidão comprada,
preço a cair" = o quadrante perigoso).

**Original porque:** substitui o velocímetro de Fear & Greed que todos os sites
têm. Mostra **desacordo**, que é a informação; o velocímetro mostra um número
que já toda a gente viu.

---

### IDEIA 5 — "Há quanto tempo" · fita de regime a 90 dias · **A**

**Pergunta:** *isto é novo, ou já dura há semanas?*

Fita fina com os últimos 90 dias coloridos pelo regime (calmo/instável/
tempestade/estranho). Responde à pergunta que nenhum dashboard responde: se o
estado de hoje é excepcional ou se é o normal deste mês.

**Original porque:** todos mostram o estado **agora**; quase ninguém mostra a
**duração** do estado. Barato de construir e dá contexto imediato.

---

### IDEIA 6 — "Mapa Vivo" · treemap que respira · **A**

**Pergunta:** *como está o mercado, todo, de uma vez?*

Área = capitalização, cor = camada activa (preço 1h/24h/7d, funding, volume vs
mediana, sector — `mapLayers.ts` já as tem). **Movimento = volatilidade própria
de cada activo**: um canto agitado do mercado vibra visivelmente.

Troca de camada com GSAP Flip: as células deslocam-se fisicamente entre estados
em vez de re-renderizarem, e o olho segue o mesmo activo de camada para camada.

**Original porque:** o treemap é comum; o treemap que **codifica volatilidade no
movimento** e morfa entre camadas não é. Activo sem série suficiente fica
estático e assinalado — nunca a fingir.

---

### IDEIA 7 — "Combustível" · oferta de stablecoins como indicador avançado · **A**

**Pergunta:** *está a chegar dinheiro novo, e a que velocidade?*

Temos 90 dias de oferta de stablecoins. Mostrar não só o nível mas a
**aceleração** (a segunda derivada): emitir stables é o passo anterior a
comprar, por isso a velocidade a que a oferta cresce antecipa procura.

Sobrepor ao preço mostra os desfasamentos.

**Original porque:** a maioria dos sites mostra a capitalização das stablecoins
como número estático. A **velocidade** é que é sinal.

---

### IDEIA 8 — "Rotação" · bump chart de sectores · **B**

**Pergunta:** *que narrativa está a ganhar e qual está a perder?*

Ranking dos 24 sectores ao longo do tempo: linhas que sobem e descem de
posição. A forma natural para rotação — *"quem está à frente, quem escorregou"*.

**Estado: bloqueado por dados.** A história de sectores tem **2 dias**
(verificado). Precisa de ~3 semanas de acumulação do cron diário, ou de um
backfill. **Não prometer esta peça na entrada antes de a série existir.**

---

### IDEIA 9 — "Sequências ETF" · calendário de fluxos · **B**

**Pergunta:** *há quantos dias seguidos entra (ou sai) dinheiro institucional?*

Calendário-heatmap por dia, com as sequências visíveis. O snapshot já calcula
`streakDays`. **12 dias de história** — utilizável mas curto; melhora sozinho.

---

### IDEIA 10 — "O Relógio" · em que sessão aconteceu · **C**

**Pergunta:** *o movimento de hoje veio da Ásia, da Europa ou dos EUA?*

Crypto negoceia 24/7, mas tem ritmos. Mapa hora × dia mostrando onde se
concentram os movimentos e o volume.

**Estado: precisa de nova ingestão.** `fetchKlines` já traz velas horárias, mas
não são guardadas historicamente. É acrescentar uma série ao ingest.
**Original porque:** quase ninguém mostra a estrutura horária do mercado, e
explica muita coisa ("a queda foi toda no fecho dos EUA").

---

## 5. Recomendação para a entrada

Uma entrada com dez visualizações volta ao problema dos 105 números. Proposta —
**três camadas, quatro peças**:

| Posição | Peça | Porquê |
|---|---|---|
| **Herói** | Mapa Vivo (6) | Legível em 2 segundos, todo o mercado de uma vez, e o movimento dá o "wow" imediato |
| **Assinatura** | As Correntes (1) | Densa e bonita; é a peça que mostra competência e que nenhum concorrente tem |
| **Diferenciação** | Onde Doeu (3) | Ao vivo, dramática, honesta — a que se partilha |
| **Contexto** | Há quanto tempo (5) | Uma fita fina; responde à pergunta que ninguém responde |

Concordância (2) e A Multidão (4) vão para `/mercado` e `/fluxos`, onde há
espaço para respirarem. Rotação (8) e O Relógio (10) entram **quando os dados
existirem** — e não antes.

---

## 6. O que fazer primeiro nos dados

Para desbloquear as ideias B e C, por ordem de retorno:

1. **Ligar um agendador ao cron — é o mais urgente de todo o projecto.**
   A rota existe e nunca é chamada (§2.4), por isso metade das séries está
   congelada em 2 pontos desde sempre. Duas opções: `schedule` num workflow do
   GitHub Actions, ou `crons` no `vercel.json` quando for para produção.
   Enquanto isto não existir, **todas as ideias B ficam bloqueadas para sempre**,
   não por três semanas. É meia hora de trabalho que desbloqueia meio catálogo.

2. **Backfill de sectores**, se a CoinGecko o permitir no plano Demo — troca
   semanas de espera por uma chamada, e desbloqueia a Rotação (8) de imediato.

3. **Acrescentar série horária** (`fetchKlines` → ingest) — desbloqueia O
   Relógio (10) e melhora o cálculo de volatilidade.

**Consequência de calendário:** mesmo ligando o cron hoje, a Rotação (8) só fica
apresentável dentro de semanas, a menos que o backfill resulte. Vale a pena
saber isso antes de a prometer numa maquete.

---

## 7. O que deliberadamente NÃO proponho

- **Velocímetro de Fear & Greed** — todos têm; é o exemplo puro de banal.
- **Heatmap de liquidações estimadas** (estilo Coinglass) — é modelo
  apresentado como observação, e viola a Regra nº1.
- **Previsões de preço, sinais de compra/venda** — fora do contrato do produto.
- **Gráfico de velas grande na entrada** — é a página do analista (`/mesa`),
  não a porta de entrada.
