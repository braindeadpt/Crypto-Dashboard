# CLAREZA — Pacote de prompts: redesign "O Observatório"

Objectivo: transformar um agregador honesto num produto **memorável** — peça de portefólio,
design nota 10, útil para o utilizador comum **e** para o profissional.

**Envia sempre o D0 primeiro numa sessão nova.** Depois um prompt de cada vez, na ordem.
Um commit por prompt.

Ordem: D0 → D1 → D2 → D3 → D4 → D5 → D6 → D7 → D8.

D1–D3 são a fundação (sistema + contexto histórico + elemento-assinatura). **Não saltar.**

---

## D0 — Contexto (enviar primeiro, sempre)

```
Projeto: CLAREZA Crypto — dashboard de mercado crypto em PT-PT/EN.
Diretório: C:\Users\Braindead\Documents\Crypto_Dashboard

REGRA CRÍTICA DO REPO (AGENTS.md): esta versão do Next.js NÃO é a do teu treino. Tem
breaking changes. ANTES de escreveres código, lê o guia relevante em
node_modules/next/dist/docs/. Não assumas APIs de memória.

Stack: Next.js 16.2.11 (App Router, Turbopack), React 19.2.4, TypeScript, Tailwind v4
(tokens em src/app/globals.css via @theme inline), next-intl 4.13 (PT-PT default + EN),
lightweight-charts 5.2, Playwright.

Estado atual: o produto está CORRECTO mas BANAL. Uma auditoria recente corrigiu dados
inventados, tornou a board live (WebSocket Binance), tirou payloads pesados do render e
recalibrou o motor de regime. O que falta é o que este pacote trata: identidade visual,
visualização de dados, arquitectura de informação e utilidade real.

Diagnóstico que motiva este trabalho (factos verificados):
- 15 rotas, mas só 1 página a sério: OperatorBoard tem 845 linhas, os outros 14 desks
  têm 53–97 linhas cada. /sentimento = 3 cartões; /memes = 1 tabela.
- Zero contexto histórico: nenhuma ocorrência de percentil, z-score ou histórico no
  código. Todos os números são "agora", sem referência.
- Visualização quase inexistente: só 3 ficheiros tocam em gráficos, e é o mesmo
  candlestick. Sem sparklines, sem treemap, sem heatmap.
- Sinais em falta: oferta de stablecoins, rotação de sectores/narrativas, altseason,
  unlocks, macro, fluxos de exchange.
- Sem personalização (watchlist) e sem razão para voltar amanhã.
- Estética: escuro + verde néon + mono = uniforme de todos os terminais crypto.

REGRAS DE TRABALHO — não negociáveis:
1. NUNCA inventes dados. Estado vazio honesto > número bonito e falso. Se uma fonte
   falha, diz. (O projeto já teve esse problema e foi corrigido — não regridas.)
2. Toda a copy passa por next-intl (messages/pt.json + en.json). PT-PT, não PT-BR
   ("actualizar", "gráfico", "líquido", "contexto"). Nunca hardcodes strings visíveis.
3. Antes de dar por concluído: npm run lint && npm run typecheck && npm run build.
   Reporta a saída real, incluindo falhas.
4. Não alteres ficheiros fora do âmbito do prompt.
5. Performance é requisito de design: sem layout shift, 60fps, sem bloquear o render.

Responde apenas "Contexto recebido" e espera pela tarefa.
```

---

## D1 — Sistema de design "O Observatório" (fundação — não saltar)

```
TAREFA: Criar a identidade visual e o sistema de design. Isto é a fundação de tudo o
que vem a seguir. Não avances para visualizações antes disto estar feito.

CONCEITO ORGANIZADOR: "O Observatório".
O produto não é um terminal de trading — é um instrumento de observação do mercado.
Instrumentos calibrados, leituras com escala, contexto antes de conclusão. Isto dá-lhe
autoridade editorial (tipo publicação financeira séria) em vez de cosplay de Bloomberg.
Tudo o que desenhares deve responder a: "isto parece um instrumento calibrado ou parece
mais um dashboard de SaaS?"

--- LISTA NEGRA (isto é o que faz um design parecer gerado por LLM — PROIBIDO) ---
- Verde/roxo néon sobre preto quase absoluto
- Inter como único tipo de letra, ou stack system-ui
- Grelha uniforme de cartões todos com o mesmo peso, borda de 1px e rounded-xl
- Glassmorphism, painéis com blur, gradientes "mesh", brilhos difusos
- Emoji como ícones
- Paleta default do Tailwind (slate-800, indigo-500, etc.)
- Texto de herói gigante com gradiente
- Animação decorativa sem significado
- Microcopy vazio ("Acompanha o mercado com facilidade")
- Tudo centrado em max-w-7xl mx-auto com padding igual
Se o resultado for indistinguível de qualquer dashboard genérico, falhaste.

--- TIPOGRAFIA (usar 3 famílias com papéis distintos) ---
Sugestão (podes substituir, mas justifica por escrito):
- Editorial/display: Fraunces ou Instrument Serif — dá autoridade de publicação.
  Usada em títulos, no número-herói, em momentos editoriais. É o que distingue o
  produto de um terminal.
- UI/texto: IBM Plex Sans ou Archivo — precisa, neutra, com carácter. NÃO Inter.
- Dados/números: IBM Plex Mono ou Geist Mono, SEMPRE com font-variant-numeric:
  tabular-nums. Números que mudam não podem dançar.
Escala tipográfica real, com saltos audíveis (ex.: 12 / 14 / 18 / 24 / 40 / 72). O
problema atual são 4 tamanhos a 0.04rem de distância — isso é ruído, não escala.
Contraste dramático é permitido e desejável: número enorme ao lado de rótulo minúsculo.

--- COR ---
1. Tema "papel" (claro) como assinatura E tema escuro completo. O tema claro é o
   diferenciador: 100% dos produtos crypto são escuros. Um tema claro, editorial,
   tipo papel (off-white quente, tinta profunda) é imediatamente distinto e lê como
   premium/profissional num portefólio. O escuro serve quem passa o dia a olhar.
2. Separa RIGOROSAMENTE os papéis da cor (o bug atual é uma cor a fazer cinco
   trabalhos): marca/acento ≠ direcção de preço (sobe/desce) ≠ estado de regime ≠
   foco de acessibilidade.
3. Daltonismo: verde/vermelho sozinhos são insuficientes. Acompanha SEMPRE direcção
   com glifo (▲▼), posição ou forma. Considera um par mais seguro (ex.: teal/âmbar).
4. Verifica contraste AA em todos os pares texto/fundo dos dois temas.

--- ESTRUTURA E PROFUNDIDADE ---
- Elevação deliberada em vez de bordas de 1px iguais em tudo. Poucos níveis, claros.
- Hierarquia: ~20% do ecrã domina, 80% é calmo. Um utilizador novo tem de saber em 2
  segundos onde olhar.
- Densidade é uma virtude (é um instrumento, não uma landing page) — mas densidade
  organizada, não uniforme.

--- MOVIMENTO ---
Tokens de duração/easing. Movimento só com significado: valor que muda pisca, métrica
que cruza limiar chama. Nada decorativo. Respeita prefers-reduced-motion sempre.

ENTREGA:
- Tokens em src/app/globals.css (@theme inline, Tailwind v4 — mantém a abordagem).
- Documento curto src/app/design-system.md: escala, papéis da cor, elevação, movimento,
  e as decisões que tomaste com justificação.
- Uma página /[locale]/estilo (ou rota de dev) que mostre o sistema aplicado: escala
  tipográfica, paleta com papéis, níveis de elevação, estados. Serve de referência e
  de prova para portefólio.
- Aplica os tokens ao chrome existente (header/nav/footer) para validar que funciona.
  Não refaças as páginas ainda — isso vem depois.

ACEITAÇÃO:
- Três famílias tipográficas com papéis distintos, carregadas eficientemente (next/font).
- Temas claro e escuro completos, alternáveis, com preferência do sistema respeitada.
- Acento, direcção, regime e foco são tokens DIFERENTES.
- Contraste AA verificado e reportado.
- Nada da lista negra presente.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## D2 — Motor de contexto histórico (a transformação mais barata)

```
TAREFA: Dar contexto histórico a todos os números do produto. Hoje tudo é "agora" e
por isso nada significa nada.

O PROBLEMA: "STRESS 40" — é muito? "Funding 0,0061%" — está esticado? O utilizador não
tem como saber. Um número sem distribuição de referência é ruído com decimais.
Verificado: zero ocorrências de percentil/z-score/histórico no código.

O QUE CONSTRUIR:
1. Recolha e persistência de séries históricas (90 dias, granularidade diária ou
   horária conforme a métrica) para as métricas centrais: funding, open interest,
   amplitude (breadth), Fear&Greed, dominância BTC, TVL, fluxos ETF, volume,
   volatilidade realizada, taxas de rede.
   - Reutiliza o padrão de snapshots que já existe (src/lib/data/snapshotStore.ts) e a
     rota /api/cron/refresh-heavy. Não ponhas isto no caminho de render.
   - Onde a fonte oferece histórico directo (CoinGecko market_chart, Binance
     openInterestHist, Alternative.me fng com limit), usa-o para arrancar com série
     cheia em vez de esperar 90 dias a acumular.
2. Um módulo de estatística (src/lib/stats/) que calcule, para cada métrica:
   percentil actual na janela, z-score, mínimo/máximo/mediana da janela, e uma
   classificação legível (ex.: extremo baixo / baixo / normal / alto / extremo alto).
   - Trata janelas incompletas com honestidade: se só há 12 dias de série, diz "12 dias"
     e não finjas 90. NUNCA extrapoles.
3. Expõe isto de forma consumível por qualquer componente.

REGRA DE OURO: nenhum número importante do produto deve voltar a aparecer sozinho.
Cada um passa a ter a sua posição na distribuição.

Exemplo do salto que se pretende:
  ANTES: "Funding BTC 0,0061%"
  DEPOIS: "Funding BTC 0,0061% · percentil 92 dos últimos 90 dias — só 8% dos dias
           estiveram mais esticados"

ACEITAÇÃO:
- Séries de 90 dias persistidas e actualizadas fora do caminho de render.
- API interna que devolve {valor, percentil, zScore, min, max, mediana, classificação,
  diasDeAmostra} para cada métrica central.
- Janelas incompletas reportadas com honestidade.
- Zero impacto no tempo de render da página.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## D3 — Os dois elementos-assinatura: "A Régua" e "O Pulso"

```
TAREFA: Construir os dois componentes visuais que definem o produto. São eles que fazem
alguém tirar screenshot e partilhar.

Pré-requisitos: D1 (sistema) e D2 (contexto histórico) feitos.

--- 3.1 "A RÉGUA" (o elemento que se repete em todo o produto) ---
Um componente compacto que mostra onde o valor de hoje está na sua distribuição de 90
dias. É a linguagem visual comum do produto — aparece ao lado de TODAS as métricas
importantes.

Requisitos:
- SVG próprio, construído sobre os tokens do D1. NÃO uses defaults de biblioteca.
- Mostra: a distribuição/faixa, a posição actual, a mediana como referência, e as zonas
  de extremo. Legível a 120px de largura e a 400px.
- Acessível: não depende só de cor; tem descrição textual para leitor de ecrã.
- Estado honesto quando a amostra é curta.
- Variantes: inline (compacta, ao lado de um número) e expandida (com eixos e valores).

Este componente é o que transforma "mais um dashboard" em "instrumento calibrado".
Investe tempo nele.

--- 3.2 "O PULSO" (o herói — a imagem do dia) ---
Uma visualização composta única que mostra o ESTADO DO MERCADO num só olhar, em vez de
20 números espalhados. É a peça de assinatura, o que as pessoas partilham.

Requisitos:
- Encode 5–7 dimensões centrais, cada uma na sua posição percentil (usa o D2):
  amplitude, alavancagem, sentimento, liquidez, momentum, volatilidade.
- A FORMA resultante muda visivelmente conforme o regime — um dia calmo e um dia de
  stress têm silhuetas diferentes e reconhecíveis. É isso que a torna partilhável.
- Radial/polar é uma opção óbvia; se encontrares forma melhor, justifica. O critério é:
  reconhecível, informativa, e não parecida com um gráfico default de biblioteca.
- Interactiva: passar sobre uma dimensão explica-a em linguagem simples, com o valor,
  o percentil e a fonte.
- Animação com significado na transição entre estados. Respeita prefers-reduced-motion.
- Tem de funcionar como imagem estática (para partilha) e em ecrã pequeno.
- Acompanha SEMPRE de uma leitura textual em PT/EN — a forma não substitui a frase.

REGRA: usa os contributos reais do motor de regime já existente
(src/lib/regime/engine.ts expõe contributors com pesos). Não inventes dimensões que
não tenham dados por trás.

ACEITAÇÃO:
- A Régua usada em pelo menos 8 métricas diferentes do produto.
- O Pulso no topo da board, com leitura textual, tooltip explicativo e responsivo.
- Ambos em SVG próprio, alinhados com os tokens do D1, sem defaults de biblioteca.
- Ambos acessíveis (não dependem de cor; descrição para leitor de ecrã).
- npm run lint && npm run typecheck && npm run build passam.
```

---

## D4 — Mapa de rotação de sectores (a vista "mundo crypto" que falta)

```
TAREFA: Construir a vista que responde a "o que está a acontecer no mundo crypto agora?"
— hoje inexistente, e é a pergunta central do produto.

O PROBLEMA: o produto mostra BTC/ETH/SOL e o top 25 por market cap. Não diz onde está o
dinheiro a rodar: AI? RWA? memes? L2? DeFi? gaming? Essa é a leitura que interessa e
que faz alguém abrir 8 separadores.

DADOS: a CoinGecko tem endpoint de categorias (/coins/categories) — grátis, e o
projecto já usa CoinGecko. Traz market cap por categoria, variação 24h e volume.
Verifica a documentação actual do endpoint antes de assumir campos.

O QUE CONSTRUIR:
1. Ingestão de categorias/sectores, com histórico (liga ao D2 para ter contexto).
2. Uma visualização de mapa — treemap (área = capitalização, cor = variação) é o
   candidato natural, mas avalia alternativas (bolhas, dot plot ordenado). Critério:
   perceber o dia em 2 segundos.
   - SVG próprio, tokens do D1, cor semântica com direcção redundante (não só cor).
   - Interactivo: clicar num sector mostra os seus activos.
3. A dimensão ROTAÇÃO (o que torna isto original): não mostres só "hoje". Mostra o
   movimento — que sectores ganharam/perderam força ao longo de 7/30 dias. Uma vista de
   rotação (ex.: variação relativa vs período anterior) responde a "para onde está o
   dinheiro a mover-se", que é a pergunta a sério.
4. Leitura textual automática em PT/EN a partir dos dados ("capital concentrado em X;
   Y a perder força"). Linguagem de observação, nunca de recomendação.

ACEITAÇÃO:
- Nova vista de sectores, com mapa e dimensão temporal de rotação.
- Sem afirmações causais; linguagem de observação.
- Fetch fora do caminho de render (padrão de snapshots).
- Funciona em mobile.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## D5 — Liquidez: stablecoins, fluxos e o "dinheiro a entrar"

```
TAREFA: Acrescentar os sinais de liquidez que faltam — os que explicam se está a entrar
ou a sair dinheiro do sistema. Hoje ausentes por completo.

VERIFICADO: zero ocorrências de oferta de stablecoins, fluxos de exchange ou macro no
código. O produto tem preço e alavancagem, mas não tem LIQUIDEZ — que é a causa por
trás de metade dos movimentos.

O QUE CONSTRUIR:
1. OFERTA DE STABLECOINS (prioridade 1): a série de capitalização agregada de
   stablecoins é o melhor indicador de liquidez a entrar/sair de crypto. A DefiLlama
   (já usada no projecto) tem os dados. Mostra o nível, a variação 7/30 dias, e o
   contexto histórico (D2). Emissão a subir = combustível a entrar.
2. Cruza com os fluxos de ETF que já existem: constrói uma vista única de "de onde vem
   o dinheiro" — spot institucional (ETF) vs alavancagem (derivados) vs stablecoins
   (on-chain). O projecto já tem duas destas três peças, separadas.
3. Se houver fonte gratuita fiável para fluxos de exchange (entradas/saídas), avalia.
   Se não houver com qualidade, NÃO inventes um proxy — omite e explica porquê.
4. Visualização de fluxo apropriada (área empilhada, barras divergentes). SVG próprio,
   tokens do D1.

ACEITAÇÃO:
- Série de oferta de stablecoins com contexto histórico.
- Vista consolidada de origem de liquidez (spot / alavancagem / stablecoins).
- Qualquer sinal sem fonte fiável é OMITIDO, não estimado.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## D6 — Reestruturar a arquitectura de informação + Dial de Expertise

```
TAREFA: Corrigir a amplitude sem profundidade e servir os dois públicos.

PROBLEMA 1 — 15 rotas, 1 página a sério:
OperatorBoard tem 845 linhas; os outros 14 desks têm 53–97 linhas cada. /sentimento são
3 cartões; /memes é uma tabela. O menu promete 10 destinos e 9 são um cabeçalho com uma
tabela. Isto é pior do que ter uma página boa: cria expectativa e quebra-a — e obriga o
utilizador a andar por 10 separadores DENTRO do produto, que era exactamente o problema
que o produto dizia resolver.

FAZ: consolida em 4–5 destinos com densidade real. Proposta (podes ajustar com
justificação):
  - AGORA (board): O Pulso, tape live, o essencial do estado actual
  - MUNDO: sectores/rotação (D4), mapa de mercado, movimentos e o seu porquê (Caso &
    Efeito já existe e é bom — dá-lhe destaque)
  - FLUXOS: liquidez, ETF, stablecoins, derivados/alavancagem (D5)
  - CONTEXTO: ciclo, histórico, Atlas/aprendizagem, Portugal/regulação
Cada destino tem de justificar existir com profundidade real, não com uma tabela.
Redirecciona as rotas antigas (não partas links). Mantém i18n coerente.

IMPORTANTE — reserva espaço para o futuro: está planeado um destino "CARTEIRA"
(portfolio tracking read-only, o utilizador cola um endereço público, zero armazenamento
no servidor) como fase seguinte do produto. NÃO o construas agora, mas desenha a
navegação e a arquitectura para que ele caiba naturalmente como 5º/6º destino, sem
obrigar a redesenhar o menu depois. Ver VISION-tax-module.md.

PROBLEMA 2 — dois públicos, um produto:
Requisito explícito: útil para o utilizador comum E para o profissional. Estas duas
pessoas querem densidades diferentes da mesma informação.

FAZ: recupera o "Dial de Expertise" (existia no projecto e foi apagado por estar
desligado — a ideia era boa, a execução é que não estava ligada a nada). Três níveis
(ex.: Essencial / Operador / Analista) que mudam a DENSIDADE REAL: quantas métricas,
quanto detalhe, quanta explicação. Não pode ser cosmético — tem de mudar o que se vê.
- Persistência local (localStorage), sem login.
- O nível Essencial explica; o Analista mostra tudo e explica pouco.
- Verifica que cada nível é coerente em todas as páginas.

ACEITAÇÃO:
- 4–5 destinos, cada um com profundidade real. Sem páginas de "cabeçalho + tabela".
- Rotas antigas redireccionadas, sem links partidos.
- Dial de Expertise a mudar densidade real, persistente, coerente em todo o produto.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## D7 — Razões para voltar: ritual diário, watchlist, partilha

```
TAREFA: Dar ao produto retenção e personalização. Hoje não tem nenhuma das duas.

--- 7.1 O RITUAL DIÁRIO ---
A tese original do projecto (está no README) era um briefing diário de ~5 minutos:
postura do mercado, o que mudou, uma lição, um aviso anti-hype. Isso ERA a
diferenciação, e foi despromovido quando o produto virou grelha de métricas.
Recupera-o, agora com dados a sério por trás (D2/D4/D5):
- Estrutura fixa e previsível (o valor de um ritual é ser sempre igual).
- "O que mudou desde ontem" — usa as séries do D2. É a pergunta nº1 de quem volta.
- Sem enchimento: se o dia não teve nada de relevante, di-lo. Um briefing honesto e
  curto vale mais que um inventado e longo.
- Se usares LLM para redigir, só pode escrever a partir de sinais já calculados —
  nunca inventar factos ou números. Sem chave, versão determinística de qualidade.

--- 7.2 WATCHLIST LOCAL ---
Hoje o produto só fala de BTC/ETH/SOL e do top 25. Quem tem ARB ou TIA não vê nada seu.
- Watchlist guardada em localStorage — sem login, sem servidor. Isto respeita a ética
  "sem custódia / não guardamos nada" do projecto e é um diferenciador, não uma
  limitação. Explica isso na UI.
- NOTA DE ARQUITECTURA: esta watchlist é o ensaio técnico do futuro módulo de CARTEIRA
  (portfolio tracking com endereços públicos, zero armazenamento). Mesmo padrão:
  persistência local, import/export, e a explicação na UI de ONDE vivem os dados
  ("fica no teu navegador, nunca nos nossos servidores"). Constrói a camada de
  persistência local genérica e reutilizável, não amarrada só a símbolos de moedas.
- Os activos da watchlist aparecem na tape, nos movimentos e têm contexto histórico
  (D2) e Caso & Efeito quando se mexem.
- Importar/exportar a watchlist como ficheiro, para o utilizador não a perder.

--- 7.3 PARTILHA ---
O Pulso (D3) é a imagem do dia. Torna-o partilhável: exportação como imagem, com data,
leitura textual e marca discreta. Isto é distribuição orgânica — a comunidade partilha
o que é bonito e informativo.

ACEITAÇÃO:
- Briefing diário com "o que mudou", estrutura fixa, sem enchimento.
- Watchlist local funcional, com import/export, integrada nas vistas principais.
- Exportação de imagem do Pulso.
- Nada disto envia dados para o servidor. Verifica e afirma-o.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## D8 — Polimento: movimento, mobile, acessibilidade, performance

```
TAREFA: O acabamento que separa "bom projecto" de "peça de portefólio". Não é opcional
— é o que se nota primeiro e o que falha em 90% dos projectos.

--- MOVIMENTO ---
- Transições de estado coerentes em todo o produto (tokens do D1).
- Valores que mudam: flash de direcção, subtil, nunca irritante.
- Entradas de página e de dados sem "salto" (zero layout shift).
- Estados de carregamento como skeletons que correspondem à forma final, não spinners.
- prefers-reduced-motion respeitado em TUDO. Verifica.

--- MOBILE (crítico) ---
A maioria do consumo de crypto é no telemóvel, e este layout é denso. Não encolhas —
repensa: o que é essencial em 375px? O Pulso e a tape têm de funcionar lá.
Testa a 375, 768, 1280 e 1920. Nada de scroll horizontal no body (conteúdo largo
scrolla dentro do seu contentor).

--- ACESSIBILIDADE ---
- Contraste AA nos dois temas, verificado e reportado.
- Navegação completa por teclado; foco visível (token próprio, não o default).
- Gráficos com alternativa textual/tabela acessível.
- Nenhuma informação transmitida só por cor.
- Testa com leitor de ecrã ao menos nas vistas principais.

--- PERFORMANCE ---
- Mede e reporta: LCP, CLS, INP. Sem regressões vs antes.
- Fontes com next/font, sem FOUT violento.
- SVGs próprios em vez de bibliotecas pesadas onde possível.
- Verifica que os WebSockets e timers são limpos ao navegar (sem fugas).
- Render frio não deve piorar. Mede antes/depois.

--- COERÊNCIA FINAL ---
Percorre o produto inteiro e verifica: mesma linguagem visual, mesmos espaçamentos,
mesma voz na copy, PT-PT correcto, sem restos de placeholder, sem inconsistências entre
páginas. Um portefólio julga-se pelo detalhe mais fraco.

ACEITAÇÃO:
- Métricas de performance medidas e reportadas (antes/depois).
- Funciona bem a 375px. Sem scroll horizontal.
- AA verificado nos dois temas; teclado e leitor de ecrã testados.
- prefers-reduced-motion respeitado em todo o lado.
- npm run lint && npm run typecheck && npm run build && npm run test:e2e passam.
```

---

## Notas para quem executa

- **Um prompt de cada vez, um commit por prompt.** São dependentes na ordem dada.
- **D1, D2 e D3 são a fundação.** Saltá-los produz exactamente o resultado banal que
  este pacote existe para evitar.
- A regra transversal continua: **nunca apresentar dados inventados como reais.** Estado
  vazio honesto > número bonito e falso.
- Critério final, a aplicar a cada entrega: *"isto parece um instrumento calibrado e
  desenhado por alguém com ponto de vista, ou parece mais um dashboard genérico?"*
