# CLAREZA Crypto — Pacote de prompts para execução

Cada secção é um prompt autónomo. Copia o bloco inteiro.
**Envia sempre o P0 primeiro numa sessão nova** — os outros assumem esse contexto.

Ordem recomendada: P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9.
P1–P6 são correções objetivas. P7–P9 envolvem decisões de produto/design.

Toda a evidência abaixo foi verificada por execução real (curl aos endpoints, medição
de payloads, contagem de referências, render cronometrado) em 2026-07-24.

---

## P0 — Contexto (enviar primeiro, sempre)

```
Vais trabalhar num projeto Next.js chamado CLAREZA Crypto — um dashboard de crypto
em PT-PT/EN. Diretório: C:\Users\Braindead\Documents\Crypto_Dashboard

REGRA CRÍTICA DO REPO (está em AGENTS.md, respeita-a):
Esta versão do Next.js NÃO é a que conheces do teu treino. Tem breaking changes em
APIs, convenções e estrutura de ficheiros. ANTES de escreveres qualquer código, lê o
guia relevante em node_modules/next/dist/docs/. Respeita os avisos de deprecação.
Não assumas APIs de memória — confirma na documentação local.

Stack:
- Next.js 16.2.11 (App Router, Turbopack) + React 19.2.4 + TypeScript
- Tailwind CSS v4 (tokens em src/app/globals.css, via @theme inline)
- next-intl 4.13 (PT-PT default + EN, mensagens em messages/pt.json e messages/en.json)
- lightweight-charts 5.2 para candles
- zod 4.4, date-fns 4.4
- Playwright para smoke tests

Estrutura:
  src/app/[locale]/     rotas de UI
  src/app/api/          rotas BFF
  src/components/       board, desk, charts, layout, providers, explain
  src/lib/data/         clientes de APIs externas
  src/lib/regime/       motor de postura de mercado
  src/lib/cases/        construtor de "Caso & Efeito"
  src/lib/content/      atlas, timeline, conteúdo Portugal
  messages/             pt.json + en.json

Fontes de dados (todas gratuitas, sem chave excepto CoinGecko opcional):
CoinGecko, Binance (spot + futures público), DefiLlama, Alternative.me (Fear&Greed),
DexScreener/GeckoTerminal, mempool.space, Farside (scraping de fluxos ETF).

REGRAS DE TRABALHO — não negociáveis:
1. NUNCA inventes dados. Se uma fonte não estiver disponível, mostra estado vazio
   explícito ou remove o widget. É proibido preencher com fórmulas sintéticas
   apresentadas como se fossem dados reais. Esta regra existe porque o projeto já
   tem exactamente esse problema.
2. Toda a copy de UI passa por next-intl (messages/pt.json + en.json). Nunca
   hardcodes strings visíveis. PT-PT (não PT-BR): "actualizar", "gráfico", "líquido".
3. Antes de dares uma tarefa por concluída, corre: npm run lint && npm run typecheck
   && npm run build. Reporta a saída real, incluindo falhas.
4. O dev server arranca com `npm run dev` na porta 3000. Um render a frio demora
   ~23s (é um problema conhecido, tratado no P3); a quente ~0.4s.
5. Não alteres ficheiros fora do âmbito do prompt que recebeste.

Responde apenas "Contexto recebido" e espera pela tarefa.
```

---

## P1 — Remover o painel de liquidação fabricado

```
TAREFA: O painel "Meteorologia de Liquidação" não mostra dados reais. Corrige isto.

EVIDÊNCIA VERIFICADA (não precisas de reconfirmar):
src/lib/data/binance.ts, função fetchForceOrders (~linha 41), chama
/fapi/v1/forceOrders. Esse endpoint é ASSINADO (USER_DATA) e requer chave de API.
Testado directamente:

  GET https://fapi.binance.com/fapi/v1/forceOrders?symbol=BTCUSDT&limit=5
  -> {"code":-2014,"msg":"API-key format invalid."}

  GET https://fapi.binance.com/fapi/v1/allForceOrders?symbol=BTCUSDT&limit=5
  -> {"code":400,"msg":"The endpoint has been out of maintenance"}

Ou seja: falha SEMPRE, o catch devolve [], e a UI mostra "Force orders $0"
permanentemente. Confirmado a correr na app.

Pior: as barras coloridas do painel não vêm de dados nenhuns. Em
src/lib/data/sentiment.ts (~linhas 27-35) as "zonas de liquidação" são geradas por
uma fórmula geométrica fixa:
    para cada alavancagem em [5,10,25,50,100]:
      preço_liq_long  = mark * (1 - 1/lev)
      preço_liq_short = mark * (1 + 1/lev)
      densidade       = max(0.15, 1 - lev/120)
Isto é uma constante desenhada, não uma estimativa. O aviso "modelo estimado" que
está na UI não torna isto aceitável.

ESCOLHE UMA DAS DUAS OPÇÕES (recomendo a A):

OPÇÃO A — Liquidações reais via WebSocket público da Binance
  Stream público e gratuito, sem chave: wss://fstream.binance.com/ws/btcusdt@forceOrder
  (também ethusdt@forceOrder, solusdt@forceOrder; podes combinar com /stream?streams=)
  Cada evento traz side, preço, quantidade e timestamp de uma liquidação real.
  - Cria um componente cliente que subscreve o stream e mantém uma janela deslizante
    (ex.: últimos 60 min) em estado.
  - Mostra: notional total de liquidações long vs short na janela, e uma lista/fita
    dos eventos maiores em tempo real.
  - Remove por completo a geração sintética de zonas em sentiment.ts.
  - Trata reconexão com backoff e limpa o socket no unmount.
  - Estado inicial vazio honesto: "à espera de liquidações…" e não zeros falsos.

OPÇÃO B — Remoção limpa
  Apaga o painel, o campo liquidationWeather do tipo em src/lib/types.ts, a geração
  de zonas em sentiment.ts, fetchForceOrders em binance.ts, e todas as chaves de
  tradução órfãs em messages/pt.json e messages/en.json.

Em qualquer das opções, remove também recentForceNotional do painel "Derivados" se
ficar sempre a zero, e forceNotionalBtc em src/lib/data/derivatives.ts se deixar de
ter uso.

ACEITAÇÃO:
- Nenhum número apresentado ao utilizador provém de uma fórmula inventada.
- Nenhuma chamada a /fapi/v1/forceOrders ou /fapi/v1/allForceOrders no código.
- Sem chaves de tradução órfãs; pt.json e en.json continuam com as mesmas chaves.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## P2 — Tornar a board genuinamente live

```
TAREFA: A UI mostra um ponto verde a pulsar e o rótulo "AO VIVO"/"LIVE" no topo da
tape, mas os dados estão congelados até o utilizador recarregar a página.

EVIDÊNCIA VERIFICADA: procura em todo o src/ por setInterval, useSWR, WebSocket,
EventSource e router.refresh no lado do cliente — não existe NENHUM mecanismo de
actualização. Só há `export const revalidate` (ISR no servidor), que não actualiza
um separador já aberto. O componente é src/components/board/OperatorBoard.tsx
(cliente), alimentado por props do servidor em src/app/[locale]/page.tsx.

O indicador "live-dot" está definido em src/app/globals.css (~linha 171) e usado no
OperatorBoard e no SiteChrome.

IMPLEMENTA:
1. Preços live via WebSocket público da Binance (gratuito, sem chave):
   wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker/solusdt@ticker
   O evento @ticker traz último preço e variação 24h — chega para BTC, ETH, SOL e
   para a tape.
2. Cria um hook cliente (ex.: src/lib/hooks/useLiveTicker.ts) que:
   - abre a ligação, faz parse dos eventos, expõe { price, change24h, lastUpdate }
   - reconecta com backoff exponencial e um tecto (ex.: 30s)
   - fecha o socket no unmount e quando document.visibilityState === "hidden"
   - arranca a partir dos valores vindos do servidor (props) para não haver flash
3. Feedback visual no tick: quando um preço muda, um flash curto verde (subida) ou
   vermelho (descida) na célula. Usa os tokens de cor existentes (--up / --down).
   Respeita prefers-reduced-motion.
4. Para o que NÃO tem WebSocket (funding, open interest, ETF, TVL, yields): faz
   revalidação periódica no cliente via router.refresh() ou fetch às rotas em
   src/app/api/, com intervalos que respeitem os rate limits das fontes.
   Sugestão: derivados 60s, DeFi/yields 5min, ETF 30min.
5. O ponto "AO VIVO" só deve estar activo quando o socket está mesmo ligado. Se cair,
   muda o estado visual (ex.: âmbar "a reconectar…", cinzento "desligado") e mostra
   o timestamp da última actualização. Nunca mostrar "AO VIVO" sem ligação viva.

ACEITAÇÃO:
- Com a página aberta e parada, os preços de BTC/ETH/SOL mudam sozinhos.
- Desligar a rede muda o indicador para estado degradado em poucos segundos.
- Sem fugas de memória: sockets e timers fechados no unmount (verifica com
  navegação entre rotas repetida).
- npm run lint && npm run typecheck && npm run build passam.
```

---

## P3 — Eliminar ~19,5 MB de payloads e desbloquear o render

```
TAREFA: A página inicial descarrega e faz parse de ~19,5 MB de JSON por render frio,
para mostrar 6 linhas de yields e dois números de DeFi. Corrige.

EVIDÊNCIA VERIFICADA (tamanhos medidos por download real):
  https://yields.llama.fi/pools   -> 11.052.811 bytes  (~11,0 MB)
  https://api.llama.fi/protocols  ->  8.432.665 bytes  (~8,4 MB)

Ambos com { cache: "no-store" }:
  src/lib/data/yields.ts   (fetchTopYieldPools)
  src/lib/data/defillama.ts (fetchDefiSnapshot)

Ambos excedem o limite do data cache do Next. O log do próprio dev server confirma:
  "Failed to set Next.js data cache for https://yields.llama.fi/pools,
   items over 2MB can not be cached (14754635 bytes)"

Render a frio medido: 23-30 segundos. A quente: 0,39s.

PROBLEMAS A RESOLVER:

1. PAYLOADS. Reduz drasticamente o que é transferido.
   - Investiga endpoints mais leves da DefiLlama (ex.: /v2/chains já é usado e é
     pequeno; procura alternativas paginadas/filtradas para pools e protocolos).
   - Se não houver endpoint leve, isola estes fetches numa rota/serviço próprio com
     cache persistente e agenda-os fora do caminho de render (nunca no render de
     página). A página lê o resultado já reduzido, não o payload cru.
   - Nunca faças parse de 11 MB para devolver 6 linhas.

2. CACHE. src/lib/cache.ts é um Map em memória do processo (linha ~3). Em serverless
   morre a cada instância nova, logo é quase sempre cache miss em produção.
   Substitui por um cache que sobreviva entre invocações. Documenta a escolha.

3. SEQUÊNCIA. src/lib/data/bundle.ts (~linhas 48-49) faz:
       const cycle = await fetchCycleSnapshot().catch(...)
       const defi  = await fetchDefiSnapshot().catch(...)
   em série. Junta num Promise.all. Verifica o resto do ficheiro para o mesmo padrão.

4. BLOQUEIO DO RENDER. src/app/[locale]/page.tsx espera por TODAS as fontes antes de
   pintar seja o que for. Reestrutura com Suspense + streaming: o essencial (tape,
   preços, gráfico) pinta primeiro; painéis lentos (ETF, yields, DeFi) entram depois
   com skeletons. Consulta node_modules/next/dist/docs/ para a API correcta de
   streaming nesta versão do Next — não assumas.

ACEITAÇÃO:
- Nenhum fetch no caminho de render excede 2 MB.
- Não aparecem avisos "items over 2MB can not be cached" no log do dev server.
- Render a frio bem abaixo dos 23s actuais; primeira pintura útil em poucos segundos.
- Mede antes e depois e reporta os números reais.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## P4 — Corrigir dados errados (peg, yields, TVL, DEX)

```
TAREFA: Quatro painéis mostram números incorrectos ou enganadores. Corrige os quatro.

--- 4.1 PEG WATCH: falso positivo permanente ---
A UI mostra "USYC +13.19%" como desvio de peg. USYC é um token de tesouraria que
acumula juros — vale acima de $1 POR DESENHO. Não está despegado.
Causa: src/lib/data/defillama.ts (~linha 88) assume que todo o activo listado como
pegged aponta a $1:
    pegDeviation = (price - 1) * 100
Isto quebra para: tokens yield-bearing/rebasing (USYC, sDAI, sUSDe...) e para
stablecoins que não são em USD (EURC, EURS mostrariam ~+8% permanente).
CORRIGE: filtra por pegType === "peggedUSD" (a API /stablecoins expõe pegType) e
exclui os yield-bearing. Se um activo tiver um alvo que não seja 1, calcula o desvio
contra o alvo certo. Um alerta de peg só deve disparar quando é mesmo um despegue.

--- 4.2 YIELDS: o painel não mostra yields ---
src/lib/data/yields.ts (~linha 41) ordena por tvlUsd descendente, não por APY.
Resultado real na board: lido/stETH 2.2%, binance-staked-eth/wBETH 2.4% — ou seja,
"as pools maiores", que não é a pergunta que o painel diz responder.
CORRIGE: ordena por APY descendente, com filtros de risco sensatos e visíveis
(TVL mínimo, exclusão de APY absurdo, distinguir apyBase de apyReward — o reward é
volátil e deve ser sinalizado). Mostra na UI a base de ordenação e os filtros
aplicados. Se o painel se chamar YIELDS, tem de mostrar os melhores yields.

--- 4.3 TVL TOTAL: valor inflacionado ---
src/lib/data/defillama.ts (~linha 71): totalTvl = soma do TVL dos top 200 protocolos.
Isto duplica staking líquido e restaking (o stETH conta na Lido e outra vez em cada
protocolo que o aceita como colateral) e trunca arbitrariamente em 200.
CORRIGE: usa o total agregado correcto. O código já faz fetch de /v2/chains — a soma
por chain é uma base bem melhor. Confirma na documentação da DefiLlama qual o
endpoint canónico para TVL total e usa esse.

--- 4.4 DEX FRENZY: sem filtro ---
O painel "Actividade DEX" (memes/frenesim on-chain) abre com "WETH eth" e "WETH base".
WETH é Ether embrulhado, não é um meme nem actividade especulativa.
Ficheiro: src/lib/data/dex.ts
CORRIGE: exclui wrapped natives (WETH, WBTC, WBNB, WSOL...), stablecoins e blue chips.
Aplica limiares mínimos de liquidez/volume para cortar ruído. Nota: a lista mostrava
também um token a +15530% — decide e documenta como tratas outliers extremos
(são frequentemente artefactos de pools sem liquidez).

ACEITAÇÃO:
- Peg watch vazio quando não há despegue real; USYC não aparece.
- Painel de yields ordenado por APY, com filtros de risco visíveis na UI.
- TVL total consistente com a fonte pública da DefiLlama (compara e reporta).
- Sem WETH/WBTC na lista de actividade DEX.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## P5 — Scraper de ETF incompatível com serverless

```
TAREFA: A ingestão de fluxos de ETF não funciona em produção serverless. Corrige.

EVIDÊNCIA: src/lib/data/etf.ts, função fetchHtml (~linha 54), invoca o binário do
sistema via child_process:
    execFile("curl.exe" | "curl", [...])
para contornar a protecção Cloudflare do farside.co.uk.

Dois problemas:
1. Não há binário curl garantido em Vercel nem na maioria dos runtimes serverless.
   Em produção isto falha, e o fallback para fetch() apanha o desafio da Cloudflare.
2. São 3 páginas (BTC/ETH/SOL) com --max-time 25 cada, dentro do caminho de render
   bloqueante. No pior caso são 75s de espera antes de a página pintar.

Além disso o parser é regex sobre HTML (parseFarsideTable, ~linha 146) — parte em
silêncio se a Farside mudar a estrutura da tabela.

RESOLVE:
- Elimina a dependência do binário curl.
- Tira o scraping do caminho de render: passa para ingestão agendada (rota de cron
  ou job) que grava um snapshot; a página lê o snapshot, nunca faz scraping ao vivo.
- Avalia fontes alternativas para fluxos de ETF spot que não exijam scraping. Se não
  houver alternativa viável, mantém a Farside mas com o scraping isolado, com timeout
  curto, e com o último snapshot bom servido quando a ingestão falha.
- Quando os dados estiverem obsoletos, a UI tem de dizer a idade explicitamente
  ("fluxos de DD/MM") em vez de apresentar números velhos como actuais.
- Torna o parser defensivo: se não encontrar a tabela ou as colunas esperadas, falha
  de forma explícita e registada, não silenciosamente.

ACEITAÇÃO:
- Zero uso de child_process em src/lib/data/.
- O render da página nunca espera por um pedido à Farside.
- Falha de ingestão degrada para snapshot anterior com idade visível na UI.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## P6 — Apagar código morto e corrigir erros de i18n

```
TAREFA: Limpeza. Há ~800 linhas de código órfão e erros a inundar o log.

VERIFICADO por contagem de referências:

1. src/components/landing/ INTEIRO está órfão (~800 linhas).
   LandingPage.tsx tem ZERO referências no projeto. Os 9 subcomponentes
   (HeroCommand, DashboardPreview, LiveStatsBar, CaseStudy, Integrations, Security,
   Workflows, AccessCta, CrosshairCursor, AnimatedNumber) só são referenciados pelo
   próprio LandingPage, que ninguém importa. A rota src/app/[locale]/page.tsx
   renderiza OperatorBoard, não LandingPage.
   -> Apaga a pasta inteira, depois de confirmares tu próprio a contagem de
      referências de cada ficheiro. Se algum for usado noutro sítio, preserva-o.

2. src/components/layout/ExpertiseDial.tsx tem ZERO referências, mas o
   ExpertiseProvider continua a embrulhar a app em src/app/[locale]/layout.tsx.
   -> Decide: ou reintroduzes o controlo na UI (é uma das ideias originais do
      produto — ver README), ou removes o dial E o provider. Não deixes um provider
      sem consumidor. Diz qual escolheste e porquê.

3. src/lib/data/bundle.ts (~linha 54): getFullDesk() é apenas
   `const front = await getFrontPageData(); return front;` — um alias sem valor.
   -> Remove e actualiza quem o chame.

4. ERROS DE i18n a repetir no log do dev server:
   "Failed to call `useTranslations` because the context from `NextIntlClientProvider`
    was not found."
   -> Localiza a origem (um componente cliente a chamar useTranslations fora do
      provider, ou um Server Component que falhou o render e caiu para o cliente).
      Corrige a causa, não o sintoma. Confirma que o log fica limpo.

5. Aviso no log: `scroll-behavior: smooth` no <html> sem data-scroll-behavior.
   -> Aplica a correcção indicada pelo Next.

6. Depois de tudo apagado: remove chaves órfãs em messages/pt.json e messages/en.json
   e quaisquer imports/tokens CSS que tenham ficado sem uso (ex.: a classe .scan-line
   em globals.css está definida e não é usada — confirma antes de remover).

ACEITAÇÃO:
- Nenhum ficheiro em src/ sem referências (excepto pontos de entrada do Next).
- pt.json e en.json com exactamente o mesmo conjunto de chaves, sem órfãs.
- Log do dev server limpo de erros de useTranslations num carregamento completo.
- npm run lint && npm run typecheck && npm run build passam.
- Faz commit separado para a remoção, para ser fácil reverter.
```

---

## P7 — Recalibrar o motor de regime

```
TAREFA: O motor que decide a "Postura" do mercado ignora sinais que a própria app já
calcula, e os pesos são arbitrários.

EVIDÊNCIA OBSERVADA na app a correr: STRESS 14, postura "Calmo" — ao mesmo tempo que
Fear&Greed estava em 28 (medo), amplitude de mercado em 36% (só 36% dos top 25 em
alta) e BTC a -1,5%. "Calmo" está errado nessas condições.

Ficheiro: src/lib/regime/engine.ts (computeRegime)

PROBLEMAS:
1. A amplitude (breadth) é calculada em src/components/board/OperatorBoard.tsx
   (~linha 62) e NUNCA é passada ao motor. É um dos melhores sinais de risco
   disponíveis e está a ser desperdiçado.
2. Os pesos são uma escada de if/else com constantes à mão (fng<=25 -> +28,
   absBtc>=8 -> +30, etc.) sem qualquer calibração ou justificação.
3. Só olha para BTC. Ignora ETH, SOL e a dispersão entre eles.
4. Os fluxos de ETF e o L/S ratio já existem na app e também não entram.

FAZ:
- Passa a amplitude para o motor (move o cálculo para o lado do servidor, junto dos
  dados, em vez de estar no componente).
- Integra os sinais que já existem e não são usados: fluxos ETF, L/S ratio,
  variação de open interest em vários activos, desvio de peg de stables.
- Documenta cada peso com uma justificação escrita. Se um peso for arbitrário,
  diz que é arbitrário no comentário — não finjas rigor que não existe.
- Faz backtest informal contra dias históricos conhecidos (ex.: um dia de queda
  forte, um dia lateral, um dia de euforia) e mostra que a postura resultante é
  sensata. Reporta os resultados.
- Adiciona testes unitários para as fronteiras entre posturas
  (calm/unsettled/storm/weird).
- A UI deve poder mostrar QUAIS os sinais que mais contribuíram para a pontuação —
  não só o número final. Um score sem explicação não é útil.

ACEITAÇÃO:
- Com F&G 28 + amplitude 36% + BTC negativo, a postura NÃO é "Calmo".
- Cada peso tem justificação em comentário.
- Testes unitários a cobrir as transições de postura.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## P8 — Refazer a hierarquia visual

```
TAREFA: A interface é competente tecnicamente mas não tem hierarquia visual. Redesenha.

DIAGNÓSTICO CONCRETO (não é opinião vaga — são factos do código):

1. QUATRO tamanhos de letra quase idênticos espalhados pela UI: 0.58rem, 0.62rem,
   0.65rem, 0.66rem. Isto não é uma escala tipográfica, é ruído. Ver
   src/components/board/OperatorBoard.tsx e src/components/layout/SiteChrome.tsx.

2. Todos os painéis têm exactamente o mesmo peso visual: mesma borda de 1px, mesmo
   fundo, mesmo radius de 2px. O preço do BTC tem a mesma prioridade visual que a
   lista de yields e que o trending. Nada diz ao olho para onde ir primeiro.

3. UMA cor a fazer CINCO trabalhos. Em src/app/globals.css (~linhas 15-25):
   --accent, --up, --calm, --focus e --crosshair são TODOS #3dffa8.
   Quando o mesmo verde significa "clicável", "a subir", "mercado calmo" e "tens o
   foco aqui", deixa de significar seja o que for.

4. Sem profundidade e sem movimento com significado. Radius 2px em tudo, sem camadas.
   A única animação real é um ponto a pulsar. A classe .scan-line está definida em
   globals.css e nem sequer é usada.

FAZ:
- Define uma escala tipográfica real com passos distinguíveis (sugestão: 3 níveis de
  dados + 2 de rótulo, com saltos claros, não 4 valores a 0.04rem de distância).
  Aplica-a de forma consistente em toda a app.
- Separa os tokens de cor: --accent (interacção) tem de ser diferente de --up
  (direcção de preço), de --calm (estado de regime) e de --focus (acessibilidade).
  Mantém --up/--down legíveis e verifica contraste AA.
  Nota: garante que a paleta funciona para daltonismo (verde/vermelho sozinhos não
  chegam — acompanha com sinal, seta ou posição).
- Estabelece hierarquia de layout: uma zona "herói" que domine (o estado do mercado
  agora), painéis secundários visivelmente subordinados, e detalhe terciário recolhido
  até ser pedido. Regra: ~20% do ecrã grita, 80% fica calmo.
- Introduz profundidade deliberada (elevação/camadas) para separar níveis, em vez de
  bordas de 1px iguais em tudo.
- Movimento com significado: valores que mudam piscam; métricas que cruzam um limiar
  chamam a atenção. Nada de animação decorativa. Respeita prefers-reduced-motion.
- Remove CSS morto (.scan-line e afins) depois de confirmar que não é usado.

RESTRIÇÕES:
- Tailwind v4 com tokens via @theme inline em globals.css — mantém essa abordagem.
- Não introduzas bibliotecas de componentes novas sem justificar.
- Mantém a densidade de informação: o objectivo é um terminal legível, não um
  dashboard arejado de marketing. Hierarquia não é espaço em branco a mais.

ACEITAÇÃO:
- Escala tipográfica documentada e aplicada de forma consistente.
- --accent, --up, --calm e --focus são valores distintos.
- Um utilizador novo consegue dizer em 2 segundos qual é a informação mais importante
  do ecrã.
- Contraste AA verificado nos pares texto/fundo principais.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## P9 — Aprofundar a mecânica original ("Caso & Efeito")

```
TAREFA: Construir a funcionalidade que diferencia este produto. Esta é a mais
importante a longo prazo — as anteriores só põem a casa em ordem.

CONTEXTO: Na forma actual, a página inicial é um CoinGecko pior + um Coinglass pior
+ um DefiLlama pior, empilhados. Não há razão para alguém a preferir aos originais.
As ideias originais do produto (descritas no README: Postura, Caso & Efeito,
Explain This Number, Expertise Dial) foram despromovidas da homepage por um pivot
anterior para a "operator board".

A mecânica com mais potencial é o CASO & EFEITO: responder a "porque é que isto se
mexeu?". Essa é a pergunta que faz uma pessoa abrir 8 separadores de manhã, e que
NENHUM dashboard mainstream responde. É aí que está a diferenciação.

ESTADO ACTUAL: existe src/lib/cases/build.ts e src/components/desk/CaseDesk.tsx, mas
a "causa" é gerada por uma função inferCause() em src/lib/data/coingecko.ts (~linha
70) que é só uma escada de if sobre a variação percentual:
    variação > 8%  -> "Subida forte: confirma volume, notícias e funding"
    variação < -8% -> "Queda acentuada: possível liquidação, unlock ou risco"
Isto não explica nada. É um template genérico disfarçado de análise, e cai na mesma
armadilha do painel de liquidações: aparentar informação onde não há.

CONSTRÓI a versão a sério:
1. Correlação real de sinais. Quando um activo se move de forma significativa,
   cruza automaticamente o que a app JÁ tem: funding, variação de open interest,
   L/S ratio, liquidações (se o P1 tiver sido feito com WebSocket), fluxos de ETF,
   amplitude de mercado, actividade DEX, mudanças de TVL. A pergunta a responder é
   "este movimento foi alavancagem, foi spot, foi específico do activo ou foi macro?"
   — e isso é derivável dos dados existentes.
2. Distingue explicitamente CORRELAÇÃO de CAUSA. Nunca afirmes causalidade a partir
   de coincidência temporal. Linguagem do tipo "consistente com X" e não "causado
   por X". Mostra a evidência que suporta cada hipótese e a que a contradiz.
3. Confiança calibrada. Quando os sinais não chegam para uma leitura, di-lo:
   "sem explicação clara nos dados disponíveis" é uma resposta legítima e mais
   valiosa que um template.
4. Estrutura por hipóteses: hipótese -> evidência a favor -> evidência contra ->
   conclusão provisória, com os números concretos que a sustentam e link para a
   fonte de cada um.
5. Se usares LLM para redigir (há um gancho opcional para OPENAI_API_KEY em
   src/lib/editorial/), o LLM só pode redigir a partir de sinais já calculados —
   nunca inventar factos, números ou notícias. Sem chave, tem de haver sempre uma
   versão determinística de qualidade. Documenta essa fronteira no código.
6. Promove isto na navegação: deve ser uma razão para voltar todos os dias, não uma
   subpágina escondida.

ACEITAÇÃO:
- inferCause() em coingecko.ts eliminada ou substituída por análise real de sinais.
- Cada afirmação na UI é rastreável a um número concreto e à sua fonte.
- Existe um caminho explícito para "não sei" quando os dados não suportam conclusão.
- Nenhuma afirmação de causalidade a partir de correlação.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## Notas finais para quem executar

- **Um prompt de cada vez.** São interdependentes na ordem indicada (o P7 fica melhor
  depois do P1; o P9 depois do P1 e do P4).
- **Um commit por prompt**, para ser fácil reverter.
- A regra que atravessa tudo o pacote: **nunca apresentar dados inventados como
  reais**. Foi o problema principal encontrado na auditoria (painel de liquidação,
  causas genéricas, rótulo "AO VIVO" sem ligação live). Um estado vazio honesto vale
  mais do que um número bonito e falso.
- Antes de dar qualquer tarefa por concluída: `npm run lint && npm run typecheck &&
  npm run build`, e reportar a saída real — incluindo falhas.
