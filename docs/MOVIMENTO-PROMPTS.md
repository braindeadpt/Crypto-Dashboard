# CLAREZA — Pacote de execução V3: movimento e visualização

Executa `docs/PLANO-MOVIMENTO.md` (direcção) e `docs/ESTUDO-VISUALIZACAO.md`
(catálogo de ideias, com o estado real dos dados).

## Como usar

- **Envia o M0 primeiro em CADA sessão nova.** Sem ele a LLM não tem contrato.
- **Um prompt por sessão, um commit por prompt.** É o que permite reverter uma
  secção sem perder a noite.
- **A ordem é obrigatória.** M1 desbloqueia dados; M2 é a fundação. Correr M3+
  antes de M2 produz widgets animados avulsos — o circo que o plano evita.

## Ordem

| # | Secção | Depende de | Duração estimada |
|---|---|---|---|
| **M1** | Desbloquear os dados (cron) | — | curta |
| **M2** | Tema + o Maestro | — | média |
| **M3** | Mapa Vivo (herói) | M2 | longa |
| **M4** | Onde Doeu (liquidações) | M2 | média |
| **M5** | As Correntes (horizon chart) | M2 | média |
| **M6** | Concordância + fita de regime | M2, M5 | média |
| **M7** | A Multidão (campo 2D) | M2 | média |
| **M8** | Propagar às outras páginas | M3–M7 | longa |
| **M9** | Limites e auditoria medida | tudo | média |

**Ponto de revisão humana recomendado: depois do M3.** Se o Mapa Vivo ficar bem,
o resto do sistema está validado. Se ficar mal, é melhor saber antes de M4–M8.

---

## M0 — Contexto (enviar primeiro, sempre)

```
Projecto: CLAREZA Crypto — observatório de mercado crypto, PT-PT/EN.
Directório: C:\Users\Braindead\Documents\Crypto_Dashboard

REGRA CRÍTICA DO REPO (AGENTS.md): esta versão do Next.js NÃO é a do teu treino.
Tem breaking changes em APIs, convenções e estrutura. ANTES de escreveres
código, lê o guia relevante em node_modules/next/dist/docs/. Não assumas APIs
de memória. Respeita avisos de deprecação.

Stack: Next.js 16.2.11 (App Router, Turbopack), React 19.2.4, TypeScript,
Tailwind v4 (tokens em src/app/globals.css via @theme inline), next-intl 4.13,
GSAP 3.15 (já instalado), lightweight-charts, Playwright, vitest.

LÊ ANTES DE COMEÇAR:
- docs/PLANO-MOVIMENTO.md — a direcção de movimento e os limites
- docs/ESTUDO-VISUALIZACAO.md — o catálogo de ideias e o estado real dos dados
- AGENTS.md — o contrato do produto
- src/app/design-system.md — tokens

REGRAS NÃO NEGOCIÁVEIS:
1. NUNCA inventes dados. Se uma fonte falha, a UI di-lo ("—", "indisponível",
   nota de amostra curta). Nunca um número fabricado. Série insuficiente =
   componente estático e assinalado, nunca animado a fingir.
2. Correlação, nunca causa: "consistente com", jamais "causado por".
3. Sem sinais de compra/venda, sem aconselhamento financeiro.
4. Toda a copy visível passa por next-intl (messages/pt.json + en.json).
   PT-PT europeu com a ortografia deste projecto: activo, transacção, direcção,
   ecrã. NUNCA: usuário, tela, senha, você, portfólio (é portefólio). EN é
   locale de primeira classe — acrescenta a chave aos DOIS ficheiros.
5. Movimento: prefers-reduced-motion desliga tudo o que é contínuo. Anima só
   transform e opacity. Nada que force layout. Pausa quando a página está
   oculta (visibilitychange).
6. GSAP em React: usa cleanup adequado (gsap.context() ou useGSAP) para as
   animações morrerem com o componente. Uma fuga aqui arrasta o site abaixo.
7. Antes de dar por concluído: npm run lint && npm run typecheck &&
   npm run test:unit && npm run build. Reporta a saída REAL, incluindo falhas.
   Se algo falhar e não conseguires resolver, diz — não escondas.
8. Um commit no fim da tarefa, com mensagem que explique o PORQUÊ.
9. Não alteres ficheiros fora do âmbito do prompt.

O TESTE QUE DECIDE SE UMA ANIMAÇÃO FICA:
"Se o mercado mudasse de estado, esta animação mudava?"
Não → é decoração, corta. Sim → é um canal de dados, fica, e documenta que
variável codifica.

Responde apenas "Contexto recebido" e espera pela tarefa.
```

---

## M1 — Desbloquear os dados (fazer primeiro)

```
TAREFA: As séries históricas nunca crescem. Corrige a causa.

DIAGNÓSTICO VERIFICADO (não precisas de reconfirmar):
- A rota /api/cron/refresh-heavy EXISTE.
- NADA a chama: não há "schedule" em .github/workflows/, não há vercel.json.
- Prova exacta: as únicas três séries paradas em 2 pontos (fee_btc, breadth,
  btc_dominance) são precisamente as três cujo bootstrap é "cron append", sem
  fonte de backfill. Todas as que têm backfill estão nos 90 pontos.
- Consequência: a história só cresce quando alguém corre snapshots:refresh à
  mão. Várias visualizações estão bloqueadas PERMANENTEMENTE, não por semanas.

FAZ:
1. Agendador. Cria um workflow do GitHub Actions com "schedule" (cron diário,
   hora a decidir — evita o pico de rate limit da CoinGecko) que chama a
   ingestão. Duas abordagens possíveis; escolhe e justifica:
   (a) o workflow corre o script de ingestão e faz commit dos snapshots;
   (b) o workflow faz POST à rota /api/cron/refresh-heavy do site publicado.
   Nota: (b) só funciona depois de haver deploy; (a) funciona já. Considera
   fazer (a) agora e deixar (b) documentado para produção.
   A rota já espera CRON_SECRET — respeita isso.
2. Robustez: se uma fonte falhar, as outras têm de continuar. Um falhanço
   parcial não pode apagar séries boas nem escrever um snapshot truncado por
   cima de um bom.
3. Backfill de sectores: verifica se a CoinGecko no plano Demo permite história
   de categorias. Se permitir, semeia. Se NÃO permitir, diz claramente e
   documenta que a Rotação (ideia 8) só fica disponível por acumulação.
4. Série horária: acrescenta ingestão de velas horárias do BTC (fetchKlines já
   existe) como nova série histórica. Desbloqueia a ideia 10 (O Relógio) e
   melhora o cálculo de volatilidade.
5. Documenta no README como se corre a ingestão à mão e como o agendador está
   configurado.

ACEITAÇÃO:
- Existe um agendador real e testável; explica como o validaste.
- Falhanço de uma fonte não corrompe o snapshot das outras. Demonstra.
- Relatório do estado do backfill de sectores (conseguido ou não, e porquê).
- Série horária a ser ingerida.
- lint, typecheck, test:unit, build passam.
```

---

## M2 — Tema de assinatura + o Maestro (a fundação)

```
TAREFA: Resolver a contradição do tema e construir o sistema de movimento.
Nada mais se anima antes disto existir.

--- PARTE 1: a contradição do tema ---
AGENTS.md afirma: Signature "Noite": deep blue-violet dark theme.
O commit e758d6a afirma: "Papel é a assinatura — default claro".
A app renderiza data-theme="light".

Duas fontes de verdade em conflito. DECISÃO: "Noite" escuro passa a ser a
assinatura e o padrão, por três razões objectivas: (a) movimento luminoso lê-se
muito melhor sobre fundo escuro, e este é um plano de movimento; (b) sessão
longa com dados financeiros cansa menos; (c) é o que o contrato (AGENTS.md) já
determina.

FAZ: escuro por defeito, "Papel" a um clique e com a preferência guardada
localmente. Corrige o que estiver desalinhado (bootstrap de tema, tokens,
design-system.md) para que contrato, código e ecrã digam todos o mesmo. Se
encontrares mais contradições no caminho, corrige-as e lista-as.

--- PARTE 2: o Maestro ---
Já existe o esqueleto em src/lib/motion/conductor.ts. Completa-o e liga-o.

O Maestro é UM estado de movimento global derivado das leituras existentes
(src/lib/reading/). Nenhum componente inventa a sua própria duração — todos
leem daqui. É isto que faz o produto mover-se como um organismo em vez de uma
colecção de widgets.

Quatro canais, cada um ligado a uma variável REAL:
- Cadência    ← volatilidade realizada (vol_realized_btc) → duração/easing
- Agitação    ← leitura de Risco (0-100)                  → amplitude, densidade
- Temperatura ← leitura de Direcção (-100..+100)          → energia cromática
- Impacto     ← eventos discretos reais (liquidações, ticks) → golpes pontuais

A função agitationFromRisk() está deixada como TODO no ficheiro. Implementa
esta curva (smoothstep — dias calmos genuinamente calmos, stress a subir de
forma suave, sem degraus):

    const t = clamp01((risk - 30) / 55);   // 30 → 0 ; 85 → 1
    return t * t * (3 - 2 * t);            // smoothstep

Isto é um valor por defeito afinável, não sagrado. Mantém o comentário a
explicar o compromisso (dia calmo não pode parecer morto; queda de 10% não pode
ser ilegível).

FAZ ainda:
1. Um hook useMotion() que qualquer componente cliente subscreve.
2. Integração com prefers-reduced-motion (devolve MOTION_REST) e com
   visibilitychange (pausa quando a página está oculta).
3. Degradação honesta: já está no esqueleto — confiança baixa nas leituras
   força repouso. Não removas isto; é a regra que impede o ecrã de fingir
   energia que os dados não sustentam.
4. Testes unitários: curva nos limites (0, 30, 60, 100), tecto respeitado,
   reduced-motion vence sempre, confiança baixa força repouso.
5. Regista o sistema em src/app/design-system.md e mostra-o em /estilo: uma
   secção que deixa ver os quatro canais a mexer, para servir de referência.

ACEITAÇÃO:
- Escuro por defeito; "Papel" funciona e persiste; contrato/código/ecrã
  coerentes.
- useMotion() disponível; nenhum componente com durações mágicas próprias.
- Testes da curva e das regras de segurança a passar.
- /estilo mostra o sistema de movimento.
- lint, typecheck, test:unit, build passam.
```

---

## M3 — Mapa Vivo (o herói)

```
TAREFA: O treemap de mercado passa a respirar. É a peça de maior impacto
visível por unidade de esforço.

Base existente: src/lib/data/mapLayers.ts já calcula camadas comutáveis
(preço 1h/24h/7d, funding, volume vs mediana, rotação sectorial).

CONSTRÓI:
1. Área = capitalização · Cor = camada activa · MOVIMENTO = volatilidade
   própria de cada activo. Um canto agitado do mercado vibra visivelmente. A
   amplitude global vem do canal Agitação do Maestro; a frequência por célula
   vem da volatilidade daquele activo.
2. Troca de camada com GSAP Flip: as células deslocam-se e transformam-se
   fisicamente entre estados, em vez de re-renderizarem. É o momento "wow" do
   produto — e é funcional, porque a continuidade espacial deixa o olho seguir
   o mesmo activo de camada para camada.
3. Tick real → flash curto na célula (o padrão tape-flash já existe em
   globals.css; reutiliza, não inventes outro).
4. Interacção: passar o rato mostra o activo com os seus números e a fonte.
   Tocar abre o detalhe. Navegável por teclado.

HONESTIDADE (crítico): activo sem série de volatilidade suficiente fica
ESTÁTICO e assinalado — nunca animado a fingir que tem dados. Verifica isto
explicitamente e diz como o fizeste.

DESEMPENHO: é o componente mais pesado do site. Só transform e opacity. Nada
que force layout no loop. Limita o número de células animadas em simultâneo.
Pausa quando a página está oculta. Mede fps e reporta.

ACEITAÇÃO:
- Transição entre camadas é contínua (Flip), não um re-render.
- Movimento por célula codifica volatilidade real; células sem dados estáticas.
- 60fps em portátil médio — mede e reporta o número real.
- Funciona a 375px. Teclado e leitor de ecrã.
- prefers-reduced-motion: sem movimento contínuo; transições funcionais curtas
  podem ficar.
- lint, typecheck, test:unit, build passam.
```

---

## M4 — Onde Doeu (a diferenciação)

```
TAREFA: Visualizar liquidações REAIS, ao vivo. É a peça que justifica partilhar
o site.

PORQUÊ ISTO E NÃO O COINGLASS: o Coinglass ESTIMA onde liquidações poderão
ocorrer, assumindo níveis de alavancagem — é um modelo de previsão apresentado
como mapa. Este repositório já apagou zonas de liquidação sintéticas por serem
dados fabricados (commit P1). Copiar essa abordagem reintroduzia o erro.

Nós recebemos os eventos verdadeiros: src/lib/hooks/useForceLiquidations.ts
liga-se ao stream forceOrder da Binance.

CONSTRÓI:
1. Eixo vertical = preço; eixo horizontal = tempo da sessão. Cada liquidação
   real é um golpe plotado no seu preço, no momento em que chega.
2. Long vs short distinguidos por cor E por forma/posição (nunca só cor).
   Magnitude pelo nocional real.
3. Acumulação: ao longo das horas forma-se o mapa de onde a alavancagem partiu
   mesmo. Define e documenta a janela (ex.: sessão de 24h) e o que acontece ao
   que sai dela.
4. Movimento: cada evento chega com um golpe — o canal Impacto do Maestro.
   Curto, legível, nunca contínuo.
5. Totais ao vivo: nocional long e short liquidado na janela.
6. Estado vazio honesto: "à espera de liquidações reais…" quando ainda não
   chegou nada. Nunca zeros que pareçam dados.
7. RÓTULO OBRIGATÓRIO e visível: "observado, não previsto" (PT) /
   "observed, not predicted" (EN). A distinção face ao Coinglass é o argumento
   do produto — tem de estar no ecrã.

ROBUSTEZ: o WebSocket cai. Reconecta com backoff, mostra o estado real da
ligação (ligado / a reconectar / desligado) e nunca finges "ao vivo" sem
ligação viva. Limpa o socket ao desmontar.

ACEITAÇÃO:
- Liquidações reais aparecem e acumulam; nada é estimado.
- Rótulo "observado, não previsto" visível.
- Estado da ligação honesto; reconexão testada (corta a rede e observa).
- Sem fuga de sockets ao navegar entre páginas — demonstra que verificaste.
- lint, typecheck, test:unit, build passam.
```

---

## M5 — As Correntes (horizon chart)

```
TAREFA: Construir a peça-assinatura — nove séries de 90 dias num só olhar.

PORQUÊ ESTA FORMA: o horizon chart existe precisamente para comparar muitas
séries paralelas em pouco espaço vertical, dobrando e sobrepondo bandas.
Temos nove séries diárias alinhadas a 90 dias (verificado em
data/snapshots/history.json): price_btc, funding_btc, oi_btc, fear_greed, tvl,
volume_btc, vol_realized_btc, stablecoin_supply e etf_btc_flow. Nenhum produto
de crypto usa esta forma. Hoje estas séries só alimentam um percentil isolado.

CONSTRÓI:
1. Cada série como banda horizonte, normalizada ao DESVIO FACE À SUA PRÓPRIA
   MEDIANA — não valores absolutos — para que unidades diferentes (dólares,
   percentagens, índices) se comparem directamente.
2. Empilhadas, com rótulo legível por banda. O olho tem de encontrar a anomalia
   sem ler números: a banda escura na ponta direita é a que está esticada hoje.
3. Passar o rato numa banda dá o valor, o percentil e a fonte — reutiliza a
   Régua e o "Explain This Number" que já existem. Não construas um terceiro
   sistema a competir.
4. Camada de tradução (E4) aplicada: cada nome técnico com o gémeo em português
   comum.
5. Movimento: bandas preenchem da esquerda para a direita ao entrar (uma vez,
   não em ciclo); a aresta de hoje pulsa ao ritmo do Maestro. Com
   prefers-reduced-motion aparecem já preenchidas.
6. Séries com amostra curta (fee_btc, breadth, btc_dominance têm 2 pontos):
   mostra-as assinaladas como amostra insuficiente, ou omite-as — decide e
   justifica. NUNCA as desenhes como se tivessem história.

SVG próprio, sobre os tokens. Não uses defaults de biblioteca de gráficos.

ACEITAÇÃO:
- Nove séries legíveis em pouco espaço vertical.
- Normalização por mediana própria — verifica que séries de unidades diferentes
  se comparam de forma justa.
- Séries de amostra curta assinaladas ou omitidas, nunca fingidas.
- Acessível: alternativa textual/tabela; não depende só de cor.
- lint, typecheck, test:unit, build passam.
```

---

## M6 — Concordância + Há quanto tempo

```
TAREFA: Duas peças de contexto que ninguém mostra. Ambas assentam nas séries
de 90 dias.

--- PEÇA 1: "Concordância" ---
PERGUNTA: o movimento do preço tem apoio, ou está sozinho?

Para cada um dos últimos 90 dias, conta quantos sinais (funding, OI, amplitude,
volume, stablecoins, F&G) se moveram NO MESMO SENTIDO do preço nesse dia.
Desenha essa concordância como faixa contínua no tempo.

A leitura vale ouro: preço a subir com a concordância a cair é a definição
visual de um movimento sem apoio.

- Reutiliza a lógica de correlação que já existe em src/lib/cases/correlate.ts.
  NÃO construas um segundo motor a competir com ele.
- Copy obrigatoriamente em linguagem de correlação: "consistente com", jamais
  "causado por". Concordância não é causa e o ecrã tem de o dizer.
- Dias em que faltem sinais: a faixa mostra a lacuna, não interpola.

--- PEÇA 2: "Há quanto tempo" ---
PERGUNTA: isto é novo, ou já dura há semanas?

Fita fina com os últimos 90 dias coloridos pelo regime (calmo / instável /
tempestade / estranho). Todos os dashboards mostram o estado AGORA; quase
nenhum mostra a DURAÇÃO do estado.

- Usa o histórico de regime que já existe (commit d48af98 introduziu 90d de
  regime history — confirma e reutiliza).
- Ao passar o rato: a data e o regime desse dia.
- Barata de construir e dá contexto imediato. Colocação sugerida: por baixo do
  herói, como fita fina.

ACEITAÇÃO:
- Concordância calculada a partir do motor existente, não de um novo.
- Linguagem de correlação verificada em toda a copy das duas peças.
- Lacunas de dados visíveis, nunca interpoladas.
- lint, typecheck, test:unit, build passam.
```

---

## M7 — A Multidão (campo de duas dimensões)

```
TAREFA: Substituir o velocímetro de Fear & Greed por algo que diga mais.

PORQUÊ: todos os sites de crypto têm um velocímetro de F&G. É o exemplo puro de
banal, e mostra um número que toda a gente já viu. O que interessa não é o
nível de sentimento — é o DESACORDO entre a multidão e o preço.

CONSTRÓI:
1. Campo de dois eixos: posicionamento da multidão (rácio long/short, que já
   temos em derivatives.ts) no eixo X; direcção do preço no eixo Y.
2. O marcador de hoje deixa RASTO dos últimos N dias — vê-se a trajectória, a
   multidão a carregar num lado enquanto o preço vai para o outro.
3. Quadrantes nomeados em português comum, não em jargão. Ex.: "multidão
   comprada, preço a cair" é o quadrante perigoso. Usa a camada de tradução do
   E4.
4. Movimento: o rasto desenha-se no tempo; o marcador de hoje respira ao ritmo
   do Maestro.
5. Se o rácio long/short falhar, o campo di-lo — não desenha um ponto inventado.

ACEITAÇÃO:
- Nenhum velocímetro de F&G no produto depois desta tarefa (se existir um,
  remove-o e diz onde estava).
- Quadrantes explicados em linguagem comum.
- Acessível: a posição não depende só de cor; há alternativa textual.
- lint, typecheck, test:unit, build passam.
```

---

## M8 — Propagar às outras páginas

```
TAREFA: Estender a linguagem de movimento às páginas temáticas. Cada página
herda o Maestro; NENHUMA inventa linguagem nova.

Faz uma página de cada vez, verificando entre elas. Se o tempo não chegar para
todas, faz menos e melhor — e diz quais ficaram por fazer.

- /mercado    Mapa Vivo em ecrã inteiro + tabela top-40 com sparklines
              animadas. Codifica: volatilidade por activo.
- /fluxos     Fluxos ETF e stablecoins como CAUDAL: largura = magnitude,
              sentido = sinal. Codifica: entrada/saída de dinheiro.
- /defi       TVL por protocolo com transição Flip entre ordenações.
              Codifica: quota e variação.
- /cadeias    Barras de quota que crescem a partir do estado anterior.
              Codifica: Δ1d ponderado.
- /casos      Linha temporal do movimento com os sinais a acender pela ordem em
              que ocorreram. Codifica: sequência de evidência.
- /aprender   Diagramas que se constroem ao entrar no viewport (ScrollTrigger).
              Codifica: pedagogia, não mercado — é a excepção deliberada.
- /mesa       DENSA E QUASE ESTÁTICA POR DESENHO. Não animes esta página.
              Quem lê números ao segundo não quer o ecrã a respirar. Não é
              inconsistência: é a mesma regra (movimento serve leitura)
              aplicada a um leitor diferente.

Para CADA animação que acrescentares, aplica o teste: "se o mercado mudasse de
estado, esta animação mudava?" Se não, não a acrescentes.

ACEITAÇÃO:
- Nenhuma página com durações ou easings próprios fora do Maestro.
- /mesa permanece sóbria — verifica que não lhe acrescentaste movimento.
- Lista explícita do que ficou por fazer, se algo ficou.
- lint, typecheck, test:unit, build passam.
```

---

## M9 — Limites e auditoria medida

```
TAREFA: Provar que o movimento não tornou o produto pior. MEDIR, não afirmar.

Esta é a tarefa que separa "impressionante na demo" de "utilizável todos os
dias". Um ecrã mal calibrado é pior precisamente no dia em que mais se precisa
de o ler.

MEDE E REPORTA COM NÚMEROS REAIS:
1. Desempenho: fps durante a interacção mais pesada (troca de camada no Mapa
   Vivo, chegada de liquidações). Alvo 60fps em portátil médio.
2. Render frio e quente de todas as páginas, antes vs depois. NÃO podem
   regredir. Se regrediram, corrige ou diz claramente.
3. Memória ao longo de 10 minutos com a página aberta — procura crescimento
   contínuo (fuga de animações ou sockets).
4. Bateria/CPU: confirma que tudo pausa com a página oculta.

VERIFICA:
5. prefers-reduced-motion: percorre TODAS as páginas com a preferência activa.
   Nada contínuo pode mexer. Reporta página a página.
6. Legibilidade sob stress: força agitação máxima e confirma que o texto
   permanece estável e legível. Um crash é quando mais se precisa de ler.
7. 375px: todas as páginas, sem scroll horizontal do body.
8. Contraste AA nos dois temas.
9. Teclado e leitor de ecrã nas vistas principais.
10. Nenhum dado inventado: percorre o produto e confirma que séries curtas
    aparecem assinaladas e que fontes falhadas aparecem como falha.

TESTE FINAL DE PRODUTO (o mais importante):
Alguém que nunca viu o site consegue, nos primeiros 5 segundos e SEM LER
NÚMEROS, dizer se hoje é um dia calmo ou tenso? Se não consegue, o sistema de
movimento falhou o seu objectivo — diz isso em vez de dar por concluído.

ACEITAÇÃO:
- Todas as métricas medidas e reportadas com números reais, antes vs depois.
- Qualquer regressão dita claramente, mesmo que não a consigas corrigir.
- lint, typecheck, test:unit, build, test:e2e passam.
```

---

## Notas finais para quem executa

- **Se uma tarefa for maior do que a sessão**, faz menos e melhor, e diz
  exactamente o que ficou por fazer. Trabalho a meio anunciado como completo é
  pior do que trabalho incompleto anunciado com honestidade.
- **Nunca desactives um teste para passar o portão.** Se um teste falha, ou o
  código está mal ou o teste está mal — diz qual, com evidência.
- **A regra que atravessa tudo:** nenhum dado inventado, nenhum movimento sem
  significado. Um ecrã vivo e bonito convence mesmo quando os dados por baixo
  estão fracos — é precisamente por isso que a energia do ecrã nunca pode
  exceder a qualidade dos dados.
