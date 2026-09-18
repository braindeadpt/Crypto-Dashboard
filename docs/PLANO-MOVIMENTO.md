# CLAREZA — Plano de movimento e visualização premium

> Direcção visual V3. Decide **como o produto se move**, e porquê cada movimento
> existe. Nada aqui é decoração: cada animação codifica uma variável real.
>
> Data: 2026-09-18 · Estado: plano · Execução em `docs/MOVIMENTO-PROMPTS.md`

---

## 0. Porque existe este documento

A direcção visual já mudou três vezes: terminal escuro (rejeitado por banal) →
papel editorial (V1–V2, a actual) → agora dinâmica premium. Cada inversão custa
semanas.

**Antes de executar, três decisões ficam fixas por escrito** (§6). Se uma delas
mudar outra vez, muda-se este documento primeiro — não o código.

### Contradição a resolver já

`AGENTS.md` afirma *Signature "Noite": deep blue-violet dark theme*.
O commit `e758d6a` afirma *"Papel é a assinatura — default claro"*, e a app
renderiza `data-theme="light"`.

**Duas fontes de verdade em conflito.** O primeiro acto da execução é escolher
uma e corrigir a outra (§6.1).

---

## 1. A tese

Os kits premium de mercado (AdminLTE, UI8, ThemeForest) animam todos da mesma
forma: fade-in, parallax, cartões flutuantes, brilho em gradiente. **A animação é
uma camada colada por cima dos dados** — o ecrã comporta-se igual com o mercado
parado ou a colapsar.

A inversão:

> **O movimento não é aplicado aos dados. O movimento É um dado.**

O utilizador abre a página e **sente** o estado do mercado antes de ler um
número. Isto serve directamente a pergunta que o produto existe para responder
("está a acontecer alguma coisa?") e não é copiável por um template, porque exige
a camada de dados por trás.

### O teste que separa o bom do banal

Para cada animação proposta, uma pergunta: **"se o mercado mudasse de estado,
esta animação mudava?"**

- Se **não** muda → é decoração. Cortar, ou reduzir a transição funcional.
- Se **muda** → é um canal de dados. Fica, e documenta-se que variável codifica.

---

## 2. O Maestro — um sistema, não widgets animados

O erro clássico é animar cada componente à parte: o resultado é um circo, não um
produto. Tudo subscreve **um estado de movimento global**, derivado das leituras
que já existem (`src/lib/reading/`).

```
src/lib/motion/conductor.ts   → estado de movimento derivado das leituras
src/lib/motion/useMotion.ts   → hook que qualquer componente subscreve
```

Quatro canais, cada um ligado a uma variável real:

| Canal | Codifica | Fonte | Efeito visível |
|---|---|---|---|
| **Cadência** | volatilidade realizada | `vol_realized_btc` | duração e easing de todas as transições |
| **Agitação** | leitura de Risco (0–100) | `reading.risk` | amplitude de deriva, densidade do campo |
| **Temperatura** | leitura de Direcção (−100..+100) | `reading.direction` | energia cromática, sentido da deriva |
| **Impacto** | eventos reais discretos | stream de liquidações, ticks | golpes pontuais que pontuam o ritmo |

**Regra de ouro:** nenhum componente inventa a sua própria duração. Todos leem do
Maestro. É isto que faz o produto parecer um organismo em vez de uma colecção.

**Degradação honesta:** se as leituras vierem com confiança baixa (as lacunas do
E1), o Maestro reduz a agitação ao mínimo — o ecrã não finge energia que os dados
não sustentam.

---

## 3. As três peças da entrada

### 3.1 MAPA VIVO (market heatmap)

Base: `mapLayers.ts` já existe, com camadas comutáveis (preço 1h/24h/7d, funding,
volume vs mediana, rotação sectorial). O que falta é vida.

- **Área** = capitalização · **Cor** = camada activa · **Movimento** =
  volatilidade própria de cada activo. Um canto quente do mercado **vibra
  visivelmente**.
- **Troca de camada com GSAP Flip**: as células *deslocam-se e transformam-se*
  fisicamente entre estados em vez de re-renderizarem. É o momento "wow" mais
  barato e mais impressionante do plano — e é funcional, porque a continuidade
  espacial deixa o olho seguir o mesmo activo entre camadas.
- **Tick real** → flash curto na célula (o padrão `tape-flash` já existe).
- Honestidade: o movimento codifica volatilidade medida. Activo sem série
  suficiente fica **estático e assinalado**, nunca animado a fingir.

### 3.2 ESTADO (market overview)

Reaproveita as três leituras (Direcção/Risco/Dinheiro) e o Pulso — não recomeça.

- Números com contagem animada (`AnimatedNumber` já usa GSAP) — mas a **duração
  vem do Maestro**, por isso um dia volátil conta depressa e um dia calmo conta
  devagar.
- **Campo ambiente promovido**: o `AmbientField` actual é, por confissão do
  próprio comentário, *"still decorative"*. Passa a desenhar a série real das
  últimas 24h do BTC como linha viva de fundo — deixa de ser partículas genéricas
  e passa a ser o mercado.
- O Pulso ganha transição animada entre estados de regime (a silhueta **morfa**,
  não salta).

### 3.3 TEMPERATURA (market sentiment)

**Não** mais um velocímetro de Fear & Greed — todos os sites têm um, e é o
exemplo perfeito de banal.

- **Campo de duas dimensões**: posicionamento da multidão (rácio long/short) no
  eixo X, direcção do preço no eixo Y.
- O marcador **deriva pelo campo ao longo dos últimos N dias, deixando rasto**.
  Vê-se a multidão a ficar offside antes do movimento.
- Os quadrantes têm nomes em português comum ("multidão comprada, preço a cair" =
  o quadrante perigoso), com a tradução de jargão que o E4 já montou.
- Original porque mostra **desacordo**, que é a informação; o F&G mostra um número
  que toda a gente já viu.

---

## 4. A quarta peça — a diferenciação real

### ONDE DOEU (liquidações)

O [Coinglass](https://www.coinglass.com/pro/futures/LiquidationHeatMap) **estima**
onde liquidações *poderão* ocorrer, assumindo níveis de alavancagem. É um modelo
de previsão apresentado como mapa.

Este projecto já removeu uma vez zonas de liquidação sintéticas por serem dados
fabricados (P1). **Copiar o Coinglass seria reintroduzir esse erro.**

A alternativa, que já temos e que ninguém apresenta bem:

- `useForceLiquidations` recebe **cada liquidação real** da Binance, ao vivo.
- Plotar os **eventos verdadeiros** no eixo do preço, acumulando ao longo da
  sessão. Cada liquidação chega com um golpe animado (canal *Impacto*).
- Ao fim de horas tem-se o mapa de **onde a dor aconteceu mesmo** — observação,
  não previsão.
- Long vs short separados por cor, magnitude pelo nocional real.

**Isto é mais honesto que o Coinglass e mais original.** É a peça que justifica
partilhar o site.

Rótulo obrigatório: *"observado, não previsto"* — a distinção é o argumento.

---

## 5. Aplicação às outras páginas

Cada página herda o Maestro; nenhuma inventa linguagem nova.

| Página | Peça com movimento | Codifica |
|---|---|---|
| `/mercado` | Mapa Vivo em ecrã inteiro + tabela com sparklines animadas | volatilidade por activo |
| `/fluxos` | Fluxo ETF/stablecoins como **caudal** (largura = magnitude, sentido = sinal) | entrada/saída de dinheiro |
| `/defi` | TVL por protocolo com transição Flip entre ordenações | quota e variação |
| `/cadeias` | Barras de quota que **crescem** a partir do estado anterior | Δ1d ponderado |
| `/casos` | Linha temporal do movimento com os sinais a acender pela ordem em que ocorreram | sequência de evidência |
| `/aprender` | Diagramas que se constroem ao entrar no viewport (ScrollTrigger) | pedagogia, não mercado |
| `/mesa` | Densa e **quase estática** por desenho — o analista quer estabilidade | — |

**Nota deliberada sobre `/mesa`:** a página do analista é o único sítio onde o
movimento se reduz ao mínimo. Quem lê números ao segundo não quer o ecrã a
respirar. Não é inconsistência — é a mesma regra (movimento serve leitura)
aplicada a um leitor diferente.

---

## 6. As três decisões fixas

### 6.1 Tema de assinatura

Resolver a contradição `AGENTS.md` vs commits. **Recomendação: "Noite" escuro
como assinatura**, por três razões objectivas: (a) o movimento luminoso lê-se
muito melhor sobre fundo escuro; (b) dados financeiros em sessão longa cansam
menos; (c) é o que o `AGENTS.md` — o contrato — já determina. O "Papel" fica como
alternativa a um clique.

### 6.2 Tecnologia de movimento

**GSAP** (já instalado, 3.15). Não introduzir Framer Motion nem outra — duas
bibliotecas de animação no mesmo produto é dívida garantida. Flip e ScrollTrigger
são os plugins que fazem o trabalho pesado.

### 6.3 Limite de movimento

Ver §7 — é uma decisão de produto, não técnica, e fica por definir pelo dono.

---

## 7. Os limites (o que impede isto de ser insuportável)

Movimento mal calibrado não é premium — é enjoativo, e é pior precisamente no dia
em que mais se precisa de ler o ecrã.

1. **`prefers-reduced-motion` desliga tudo o que é contínuo.** Não é opcional e já
   é lei no projecto. Transições funcionais curtas podem ficar.
2. **Tecto de agitação.** Mesmo em stress máximo, o texto tem de permanecer
   legível e estável. Um crash é quando o utilizador mais precisa de ler.
3. **Orçamento de desempenho.** 60fps em portátil médio. `transform` e `opacity`
   apenas; nada que force layout. Canvas/SVG com contagem de nós limitada. Render
   frio e quente não podem regredir.
4. **Nunca animar dados em falta.** Série insuficiente = estático + assinalado.
5. **Bateria e separador oculto.** Pausar tudo quando a página não está visível.

---

## 8. Ordem de execução

1. **Resolver a contradição do tema** (§6.1) — uma linha de decisão, muitas de
   consequência.
2. **Construir o Maestro** (§2) — nada se anima antes disto existir.
3. **Mapa Vivo** (§3.1) — maior impacto visível por unidade de esforço.
4. **Onde Doeu** (§4) — a peça original, a que se partilha.
5. **Estado** e **Temperatura** (§3.2, §3.3).
6. **Propagar às outras páginas** (§5), uma de cada vez.
7. **Auditoria de limites** (§7) — medida, não afirmada.

---

## 9. Riscos

**O maior risco não é técnico — é a 4ª inversão de direcção.** Mitigação: o §6
fixa as decisões por escrito, e o teste do §1 dá um critério objectivo para
aceitar ou rejeitar cada animação sem discussão de gosto.

**Segundo risco: movimento a mascarar dados fracos.** Um ecrã bonito e vivo
convence mesmo quando os dados por baixo estão incompletos. Por isso o Maestro
degrada com a confiança das leituras (§2) — a energia do ecrã não pode exceder a
qualidade dos dados.
