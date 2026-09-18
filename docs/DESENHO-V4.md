# CLAREZA V4 — O desenho de ponta a ponta

> O produto inteiro repensado: o que cada página é, o que mostra, como se move.
> Não é afinação do tema — é a reestruturação.
>
> Data: 2026-09-18 · Estado: desenho · Substitui a direcção de `PLANO-MOVIMENTO.md`

---

## 0. O diagnóstico que obriga a isto

Auditoria dos componentes, verificada:

| Página | Linhas | Visualizações |
|---|---|---|
| `/` | — | Hero, MarketMap, Correntes, Pulso, Concordância, FitaRegime |
| `/mercado` | 204 | MarketMap, Sparkline |
| `/fluxos` | 123 | LiveLiquidations, Multidão, OndeDoeu |
| **`/defi`** | 259 | **nenhuma** |
| **`/cadeias`** | 165 | **nenhuma** |
| `/casos` | 378 | SectorTreemap, SectorRotation |
| **`/aprender`** | 100 | **nenhuma** |
| **`/mesa`** | **824** | **uma** |

E sobre movimento: **todos os gráficos animam só à entrada** (wipe de 0,9s) e
congelam. A única contínua — vibração do treemap — estava a zero porque a
amplitude é `0.6 + vol × 2.2 × agitation` e a curva devolvia `agitation = 0`
nos dias calmos. O GSAP Flip pedido nunca foi escrito.

Três páginas sem um gráfico e a mesa do analista com uma. **Não há aqui um
problema de tema.**

---

## 1. A ideia que governa tudo

Hoje o produto está organizado como **jornal**: secções que se leem, uma a
seguir à outra. Um jornal está parado por natureza — por isso nenhuma correcção
de paleta o vai fazer parecer vivo.

A inversão:

> **O mercado é um sistema vivo. O produto é o instrumento que o observa.**

Não são páginas de gráficos: é **um organismo e os seus subsistemas**. Cada
página observa uma função vital diferente, e todas partilham a mesma linguagem
física — fluxo, pressão, temperatura, choque.

| Página | Subsistema | Pergunta |
|---|---|---|
| `/` **Agora** | sinais vitais | Como está o organismo agora? |
| `/mercado` | o corpo | Que partes estão quentes e frias? |
| `/fluxos` | a circulação | Entra ou sai sangue do sistema? |
| `/defi` | os órgãos | Que órgãos trabalham e quanto rendem? |
| `/cadeias` | o esqueleto | Que estruturas suportam o peso? |
| `/casos` | o diagnóstico | Porque é que isto se mexeu? |
| `/aprender` | a anatomia | Como funciona, e em Portugal? |
| `/mesa` | o monitor completo | Tudo, ao segundo |

Isto não é metáfora decorativa: é o que autoriza **tudo a mexer-se de forma
coerente**, porque sistemas vivos têm ritmo, fluxo e choque — e nós temos os
dados de cada um.

---

## 2. A FRONTPAGE — a dashboard brutal

Objectivo: em **5 segundos sem ler números**, saber se hoje é dia calmo ou
tenso. Em **30 segundos**, saber porquê. Em **5 minutos**, saber tudo.

### Composição (de cima para baixo)

**① A CORRENTE** — canvas full-bleed, altura ~40vh, **nunca pára**
Já construída (`CorrenteViva`). Cada tick real empurra a onda; cada liquidação
real abre um anel. Amplitude = agitação, velocidade = cadência, cor =
temperatura. É a primeira coisa que se vê e a prova imediata de que o site está
vivo.
*Falta:* fundo escuro para a luz se ver, e picos de volume a engrossar a linha.

**② O VEREDICTO** — a manchete brutal + três números colossais
Direcção / Risco / Dinheiro a `text-colossal`, com régua de cor em massa.
*Movimento:* os números **contam** ao entrar e **re-contam** quando o valor
muda ao vivo; a régua desliza para a nova posição. Nunca saltam.

**③ A CONSTELAÇÃO** — o mapa do mercado, full-bleed
Treemap: área = capitalização, cor = camada, **vibração = volatilidade real**.
*Movimento:* **GSAP Flip na troca de camada** — as células deslocam-se
fisicamente; o olho segue o mesmo activo entre vistas. É o momento "wow" que
nunca foi escrito.

**④ AS CORRENTES** — horizon chart das nove séries de 90 dias
*Movimento:* bandas desenham-se em cascata (stagger), a aresta de hoje pulsa
continuamente.

**⑤ O DIAGNÓSTICO** — Concordância + fita de regime
*Movimento:* a faixa constrói-se dia a dia; divergências acendem.

**⑥ O BRIEFING** — cinco entradas fixas
*Movimento:* entram em cascata ao chegar ao viewport (ScrollTrigger).

### Métricas que a frontpage deve conter

Sem enchimento — cada uma responde a algo:

- **Vitais**: BTC/ETH/SOL ao vivo, capitalização total, dominância, amplitude
- **Pressão**: funding, open interest, rácio long/short
- **Choque**: liquidações ao vivo (long vs short, nocional)
- **Liquidez**: oferta de stablecoins (nível + aceleração), fluxos ETF
- **Temperatura**: Fear & Greed com contexto de 90 dias
- **Estrutura**: rotação de sectores, TVL
- **Rede**: taxas BTC, mempool

---

## 3. Página a página — gráficos e animações

### `/mercado` — o corpo
**Tem:** MarketMap, Sparkline. **Falta:** profundidade.
- **Mapa full-bleed** com as quatro camadas e Flip entre elas
- **Tabela top-40** com sparklines que se desenham em cascata ao scroll
- **NOVO — Fita de força**: barra horizontal por activo, largura = volume vs
  mediana, que **pulsa a cada trade real**
- **NOVO — Dispersão**: gráfico 1h vs 24h que mostra quem acelera e quem trava

### `/fluxos` — a circulação
**Tem:** LiveLiquidations, Multidão, OndeDoeu. **Falta:** o fluxo em si.
- **NOVO — Caudal**: fluxos ETF e stablecoins como **rio animado** — largura =
  magnitude, sentido = sinal, partículas a correr no sentido do dinheiro. É a
  visualização mais literal e mais bonita do conceito.
- **Onde Doeu** ganha destaque e o rótulo *"observado, não previsto"*
- **Multidão** com rasto dos últimos dias
- **NOVO — Balança**: spot institucional vs alavancagem, como prato que inclina

### `/defi` — os órgãos · **ZERO gráficos hoje**
- **NOVO — Anel de protocolos**: TVL por protocolo em arcos concêntricos,
  **Flip ao reordenar** (por TVL, por variação, por receita)
- **NOVO — TVL no tempo**: área empilhada 90d, constrói-se ao entrar
- **NOVO — Vigilância de peg**: cada stablecoin como ponto oscilando em torno
  de 1,00; desvio real afasta o ponto e acende
- **Yields** como barras ordenáveis com transição animada

### `/cadeias` — o esqueleto · **ZERO gráficos hoje**
- **NOVO — Barras de quota** que crescem do estado anterior (não do zero)
- **NOVO — Bump chart** de posição das cadeias ao longo do tempo *(bloqueado:
  precisa de série histórica — ver §6)*
- **NOVO — Comparador**: duas cadeias lado a lado, métricas a interpolar na
  troca

### `/casos` — o diagnóstico
**Tem:** SectorTreemap, SectorRotation.
- **NOVO — Linha de evidência**: para cada movimento, os sinais acendem **pela
  ordem cronológica em que ocorreram** — vê-se a história a formar-se
- **NOVO — Balança de hipóteses**: evidência a favor vs contra como prato que
  inclina conforme a confiança
- Rotação sectorial com trajectória animada

### `/aprender` — a anatomia · **ZERO gráficos hoje**
- **NOVO — Ciclo de 4 anos**: onde estamos, com a série real e o halving
- **NOVO — Linha do tempo** navegável do Bitcoin
- **Atlas**: cada conceito com **diagrama que se constrói ao entrar no
  viewport** (ScrollTrigger) — a pedagogia é a única excepção em que o
  movimento não codifica mercado, codifica explicação
- **Portugal**: fiscalidade com exemplos visuais, datado e com fonte

### `/ferramentas` — carteira
- **NOVO — Composição**: donut animado da carteira consultada
- **NOVO — Fluxo de transacções**: entradas e saídas como timeline
- Nunca pede chaves. Só leitura.

### `/mesa` — o monitor completo · 824 linhas, **1 gráfico**
A página do analista tem de ser **a mais densa e a mais estática**: quem lê
números ao segundo não quer o ecrã a respirar.
- Grelha densa de todos os instrumentos
- **Movimento reduzido ao mínimo**: só flash no valor que muda
- É a excepção deliberada — a mesma regra (movimento serve leitura) aplicada a
  um leitor diferente

---

## 4. O sistema de animação — quatro famílias

Tudo o que se mexe cai numa destas. Nada fora delas.

**① ENTRADA** — a peça constrói-se ao chegar ao viewport
Linhas desenham-se, barras crescem, bandas fazem wipe em cascata. ScrollTrigger.
*Acontece uma vez.*

**② CONTÍNUA** — a peça nunca pára
A Corrente, a vibração do mapa, a aresta pulsante, as partículas do campo.
Amplitude e velocidade vêm do Maestro. **É esta família que faltava por
completo — é ela que faz o site parecer vivo.**

**③ TRANSIÇÃO** — a peça transforma-se entre estados
GSAP **Flip**: trocar camada do mapa, reordenar protocolos, mudar janela
temporal. As coisas **movem-se** de A para B; nunca re-renderizam.

**④ IMPACTO** — um evento real bate no ecrã
Liquidação abre um anel. Tick faz flash. Métrica cruza limiar e chama.
*Curto, legível, nunca contínuo.*

### Regras invioláveis
- `prefers-reduced-motion` desliga ①②④; ③ fica em corte seco
- `AGITATION_CEILING` — uma queda de 10% tem de continuar legível
- Pausa com página oculta
- 60fps: só `transform` e `opacity`; canvas com nós limitados
- **Série insuficiente = peça estática e assinalada.** Nunca animar o que não
  tem dados

---

## 5. Amador e profissional — o mesmo produto

O Dial deixa de ser cosmético e passa a governar **três coisas ao mesmo tempo**:

| | Essencial | Operador | Analista |
|---|---|---|---|
| **Quantidade** | Corrente + veredicto + mapa | + correntes, concordância, briefing | tudo |
| **Linguagem** | frase em português comum primeiro | frase + número | número primeiro, sigla |
| **Movimento** | generoso — é o wow | equilibrado | mínimo — estabilidade |

O amador lê *"há quase 2× mais apostas na subida"*; o profissional lê
*"L/S 1,85"*. **Mesma peça, mesma verdade, densidade diferente.** É isto que
evita construir dois produtos.

---

## 6. O que está bloqueado por dados

Honestidade antes de prometer maquetes:

- **Bump charts** (sectores, cadeias) precisam de série histórica. Sectores tem
  **2 dias**. Bloqueado até o agendador acumular ou haver backfill.
- **O Relógio** (estrutura horária) precisa de ingestão de velas horárias.
- Tudo o resto nesta lista é construível **hoje**.

---

## 7. O que faz isto premium

O premium não está no efeito — está no detalhe que quase ninguém faz:

1. **Nada salta.** Todo o valor que muda transiciona.
2. **Nada aparece do nada.** Tudo entra com intenção.
3. **Nada mente.** Série curta assinalada, fonte falhada dita, "observado" nunca
   confundido com "previsto".
4. **Nada cansa.** Tecto de agitação, movimento que serve a leitura.
5. **Tudo tem idade.** Cada dado carrega o seu timestamp real.
6. **Funciona a 375px** e com teclado.

---

## 8. Ordem de execução

1. **Tema escuro como padrão** — a luz em movimento precisa dele; está provado
   pela Corrente lavada sobre creme
2. **Família ② (contínua)** nas peças existentes — é a que falta e a que muda
   a percepção
3. **Família ③ (Flip)** no mapa — o momento wow que nunca foi escrito
4. **`/defi`, `/cadeias`, `/aprender`** — as três páginas sem um único gráfico
5. **Caudal** em `/fluxos` — a peça mais bonita do conceito
6. **`/casos`** — linha de evidência
7. **Dial a governar linguagem e movimento**, não só quantidade
8. **Auditoria medida** — fps, reduced-motion página a página, 375px
