# CLAREZA — Prompts de execução: reestruturação da informação

Executa `PLANO-INFORMACAO.md`. **Envia o E0 primeiro em cada sessão nova.**
Um prompt de cada vez, um commit por prompt.

> ## ESTADO
>
> **E1 — JÁ FEITO** (commit `0ea344a`). **Não repetir.** As três leituras vivem
> em `src/lib/reading/` (`buildReadingSet`, `computeDirection`, `computeRisk`,
> `computeMoney`), com contributos, lacunas nomeadas, confiança proporcional ao
> peso coberto e 9 testes em `reading.test.ts`. **Estão construídas mas ainda
> NÃO ligadas à UI** — isso é o E3.
>
> **E2 — JÁ FEITO.** `/instrumento` recebe o Nível 3 (tape, réguas, spot vs
> alavancagem, gráfico, derivados, yields, DEX, trending). A entrada ficou
> magra (ritual + Pulso + faixa + ponte + watchlist). Dial **Analista** navega
> para `/instrumento` ao seleccionar; Agora continua acessível na nav (o ritual
> e o E3 N1+N2 vivem lá).
>
> **E4 — JÁ FEITO.** Dicionário central em `src/lib/jargon/` + `messages.*.json`
> (`jargon.*`). `TermTwin` / `TermLabel` / `PercentileTwin` / `ExplainThisNumber.term`
> aplicam gémeos em Agora (Pulso/Régua), Mundo e Fluxos; Instrumento mantém
> abreviaturas com `title`/caption plain.
>
> **E5 — JÁ FEITO.** `/mundo` centrado em Caso & Efeito (`CaseEffectStage` +
> horizonte / sinais / força das hipóteses), sectores ligados aos casos.
>
> **E6 — JÁ FEITO.** `/contexto` com SVGs: fase do ciclo, série histórica BTC,
> timeline navegável, diagramas no Atlas, Portugal datado/com fonte/orientação.
>
> Ordem restante: E7 → E8. (E3 leituras na UI se ainda em falta.)
>
> Ao chegar ao E3, importar de `@/lib/reading` e usar `buildReadingSet` — não
> construir outro cálculo a competir com este.

---

## E0 — Contexto (enviar primeiro, sempre)

```
Projeto: CLAREZA Crypto — observatório de mercado crypto, PT-PT/EN.
Diretório: C:\Users\Braindead\Documents\Crypto_Dashboard

REGRA CRÍTICA DO REPO (AGENTS.md): esta versão do Next.js NÃO é a do teu treino.
Tem breaking changes. ANTES de escreveres código, lê o guia relevante em
node_modules/next/dist/docs/. Não assumas APIs de memória.

Stack: Next.js 16.2.11 (App Router, Turbopack), React 19.2.4, TypeScript,
Tailwind v4 (tokens em src/app/globals.css via @theme inline), next-intl 4.13,
lightweight-charts, Playwright.

ESTADO: o design está resolvido ("Cyber Luminoso" — escuro luminoso, Sora, luz
como significado; ver src/app/design-system.md). O que falta é ESTRUTURA DA
INFORMAÇÃO. Lê PLANO-INFORMACAO.md antes de começares — é a especificação.

Diagnóstico medido que motiva este trabalho:
- A entrada tem 105 percentagens, 15 secções, 21 SVGs. Os três destinos SOMADOS
  têm 36 percentagens e 4 SVGs. A entrada é o produto inteiro empilhado.
- /mundo aloja o Caso & Efeito (a diferenciação) e é a página mais pobre: 1445
  caracteres, 1 SVG.
- /contexto tem 5613 caracteres e ZERO visualizações.
- Preço BTC repetido 3×, stress 4×, "OI" 12×, "percentil" 15×.
- 16 rotas antigas servem as 4 novas (URLs duplicados).

REGRAS DE TRABALHO — não negociáveis:
1. NUNCA inventes dados. Estado vazio honesto > número bonito e falso. Se um
   sinal falha, a UI di-lo.
2. Toda a copy passa por next-intl (messages/pt.json + en.json). PT-PT, não
   PT-BR ("actualizar", "gráfico", "líquido"). Nunca hardcodes strings visíveis.
3. Antes de dar por concluído: npm run lint && npm run typecheck && npm run build.
   Reporta a saída real, incluindo falhas.
4. Não alteres ficheiros fora do âmbito do prompt.
5. Não regridas o design nem a performance (render frio ~5s, quente ~0.3s).

Responde apenas "Contexto recebido" e espera pela tarefa.
```

---

## E1 — As três leituras compostas (fundação intelectual)

```
TAREFA: Transformar ~20 métricas cruas em TRÊS leituras honestas. É o trabalho
central de todo o plano — tudo o resto depende disto.

O PROBLEMA: a entrada mostra 105 percentagens. Ninguém consegue sintetizar isso
de cabeça. O produto tem de fazer a síntese, não despejar os ingredientes.

CONSTRÓI três leituras compostas, em src/lib/reading/ (ou equivalente):

1. DIRECÇÃO — para onde vai o mercado
   Ingredientes: variação BTC/ETH, amplitude (quantas do top N sobem), momentum.
   Saída: valor -100..+100, rótulo legível, e a frase em PT/EN.

2. RISCO — quão frágil está o mercado
   Ingredientes: alavancagem (OI), funding, liquidações recentes, rácio L/S,
   volatilidade realizada.
   Saída: 0..100, rótulo, frase.

3. DINHEIRO — está a entrar ou a sair do sistema
   Ingredientes: fluxos ETF spot, variação da oferta de stablecoins, TVL.
   Saída: valor com sinal, rótulo, frase.

REQUISITOS DE HONESTIDADE (críticos):
- Cada leitura expõe os seus CONTRIBUTOS (que ingrediente pesou quanto), à
  imagem do que src/lib/regime/engine.ts já faz para o stress. Reaproveita esse
  padrão — não inventes outro.
- Cada peso tem justificação escrita em comentário. Se um peso é arbitrário,
  diz que é arbitrário — não finjas rigor.
- Se um ingrediente falhar ou faltar, a leitura NÃO pode fingir que está
  completa: reduz a confiança e diz explicitamente o que falta.
- Usa o contexto histórico que já existe (src/lib/history, src/lib/stats) para
  exprimir cada leitura na sua distribuição de 90 dias, não em absoluto.
- Testes unitários para as fronteiras entre rótulos.

ACEITAÇÃO:
- Três leituras com contributos, confiança e frase em PT/EN.
- Ingrediente em falta degrada a confiança e é dito na saída.
- Pesos justificados em comentário; testes das fronteiras.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## E2 — Criar `/instrumento` e mudar-lhe o Nível 3

```
TAREFA: Dar casa própria ao detalhe, para libertar a entrada.

Hoje a página inicial carrega tudo: tape de 10 métricas, grelha de 8 réguas,
derivados por activo, gráfico com timeframes, movimentos, yields, DEX, trending.
Isso é o "Nível 3" do plano — legítimo, mas não é a porta de entrada.

FAZ:
1. Cria a rota /[locale]/instrumento.
2. MOVE para lá (não dupliques): tape completa, grelha de réguas expandida,
   painel Spot vs Alavancagem, gráfico com selector de símbolo/timeframe,
   derivados por activo, tendências retail, yields, actividade DEX.
3. Acrescenta-a à navegação como 5º destino.
4. O Dial em `Analista` oferece atalho directo (ou entra aqui por omissão —
   decide e justifica).
5. Mantém o ritmo de actos e a linguagem visual já existentes (.board-act,
   .act-head, .lum-*, tiers de painel). NÃO inventes estilo novo.

Depois deste prompt a entrada fica temporariamente magra — é esperado. O E3
reconstrói-a.

ACEITAÇÃO:
- /instrumento existe, na navegação, com o conteúdo movido (não copiado).
- A entrada deixou de ter os elementos movidos.
- Sem links partidos; i18n completo.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## E3 — Reconstruir AGORA como Nível 1 + Nível 2

```
TAREFA: Reconstruir a página inicial como resposta, não como despejo.

Pré-requisitos: E1 (leituras) e E2 (instrumento) feitos.

NÍVEL 1 — o que se vê sem scroll:
- Uma frase grande, em português comum, que diz o estado do mercado hoje.
  Ex.: "Mercado tenso. O dinheiro está a sair dos ETF e a alavancagem está alta."
  Gerada a partir das três leituras do E1 — nunca inventada.
- TRÊS números: DIRECÇÃO, RISCO, DINHEIRO. Grandes, legíveis, cada um com a sua
  frase e a sua régua. Nada mais.
- Uma coisa a vigiar hoje.
- O Pulso (já existe) como imagem do estado.
- Uma tape mínima: BTC, ETH + as duas leituras compostas. NÃO as 10 métricas.

NÍVEL 2 — um scroll abaixo, 4 a 6 cartões, UM SINAL POR CARTÃO, com o título em
forma de PERGUNTA (não em forma de métrica):
1. "O dinheiro está a entrar ou a sair?"
2. "Há risco de cascata?"
3. "A subida é ampla ou de meia dúzia?"
4. "O que se mexeu, e porquê?" → liga a /mundo
5. "Onde está o dinheiro a rodar?" → sectores
6. "Há algo partido?" → peg, taxas

CORTA as duplicações: preço BTC aparece 1× (hoje 3×), stress 1× (hoje 4×).

Dial: `Essencial` = só Nível 1 · `Operador` = 1+2 · `Analista` = 1+2 + atalho ao
Instrumento. Tem de mudar densidade a sério, não ser cosmético.

ACEITAÇÃO:
- Nível 1 cabe num ecrã de 1440×900 sem scroll.
- Contagem de percentagens na entrada abaixo de 30 (hoje 105). Mede e reporta.
- Nenhum valor duplicado na mesma página.
- Cada cartão do Nível 2 tem título em forma de pergunta.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## E4 — Camada de tradução (o que serve "pessoas normais")

```
TAREFA: Dar a todo o jargão um gémeo em português comum, NA LINHA.

Medido hoje na entrada: "OI" 12×, "percentil" 15×, "ETF" 11×, "90d" 10×,
"TVL" 9×, "funding" 4×, "L/S" 4× — quase tudo sem explicação ao lado.

REGRA: o profissional lê o número e ignora a frase; o principiante lê a frase e
ignora o número. Servem-se os dois SEM construir dois produtos.

Exemplos do que se pretende:
  Funding 0.0083%  → "Custo de manter posições alavancadas: normal" (+ número pequeno)
  p71 · 90d        → "mais alto que 71% dos últimos 90 dias"
  OI $6.94B        → "$6,94 mil M em posições abertas — o combustível de uma cascata"
  L/S 1.85         → "quase 2× mais apostas na subida do que na descida"
  TVL $75.4B       → "$75,4 mil M depositados em aplicações on-chain"
  Amplitude 28%    → "só 28 de cada 100 moedas grandes estão a subir"

FAZ:
- Um dicionário central de termos (PT/EN) em vez de frases espalhadas pelo código.
- Aplica-o em AGORA, MUNDO e FLUXOS. No INSTRUMENTO a forma técnica pode
  dominar (o público é outro), mas o termo continua a ter explicação acessível.
- Integra com o "Explain This Number" que já existe — não construas um segundo
  sistema a competir com ele.
- A frase é conteúdo, não decoração: passa por next-intl, PT-PT correcto.

ACEITAÇÃO:
- Nenhum termo técnico aparece sozinho em AGORA, MUNDO ou FLUXOS.
- Dicionário central, sem frases duplicadas pelo código.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## E5 — Engordar MUNDO (a diferenciação)

```
TAREFA: /mundo aloja o Caso & Efeito — a única coisa que nenhum concorrente faz —
e é a página MAIS POBRE do produto: 1445 caracteres, 1 SVG, 5 secções.
Isto está invertido. Corrige.

O Caso & Efeito já está bem construído por baixo (src/lib/cases/correlate.ts:
hipóteses "consistente com", evidência a favor e contra, confiança, caminho para
"não sei"). O motor é bom; a apresentação é que está esfomeada.

FAZ:
1. Promove o Caso & Efeito a peça central da página, não a um cartão.
   Para cada movimento relevante do dia: o que se mexeu, quanto, e a leitura por
   hipóteses com a evidência que a suporta E a que a contradiz.
2. Dá-lhe visualização: o movimento no tempo, os sinais que coincidiram, a força
   de cada hipótese. Usa a linguagem visual existente (.lum-*, Régua, tokens).
3. Integra o mapa de sectores como resposta a "onde está o dinheiro a rodar",
   ligado aos casos (que sector explica o movimento?).
4. Mantém a disciplina: "consistente com", nunca "causado por"; e o caminho
   explícito para "sem leitura clara nos sinais disponíveis".

ACEITAÇÃO:
- /mundo passa a ser a página mais rica em explicação do produto.
- Caso & Efeito é a peça central, com visualização.
- Nenhuma afirmação causal a partir de correlação.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## E6 — Dar visualização a CONTEXTO

```
TAREFA: /contexto tem 5613 caracteres e ZERO visualizações. É a página de
aprender e não tem uma única imagem. Ninguém lê uma parede de texto.

Conteúdo actual: ciclo de 4 anos, linha do tempo do Bitcoin, Atlas de conceitos,
Portugal/regulação (MiCA, CMVM, fiscalidade).

FAZ:
1. Visualiza o ciclo: onde estamos no ciclo de 4 anos, com a série histórica.
2. Visualiza a linha do tempo: eventos do Bitcoin numa linha navegável.
3. Atlas: cada conceito com um diagrama simples, não só prosa.
4. Portugal: a secção legal é fina (4 cartões de orientação). Aprofunda com
   exemplos práticos e "como proceder" — MAS mantém a disciplina: conteúdo legal
   tem de ser DATADO, com FONTE, e marcado como orientação e não aconselhamento.
   Se não tiveres a certeza de uma regra, di-lo em vez de afirmar.
   (Ver VISION-tax-module.md §7 — esta camada é a ponte para o futuro módulo.)

ACEITAÇÃO:
- /contexto deixa de ter zero SVGs.
- Conteúdo legal datado, com fonte, marcado como orientação.
- npm run lint && npm run typecheck && npm run build passam.
```

---

## E7 — Resolver os 16 URLs duplicados

```
TAREFA: 16 rotas antigas servem conteúdo idêntico às 4 novas. Conteúdo duplicado
em vários endereços é mau para manutenção e para SEO.

Mapeamento medido:
  /sectores, /memes, /caso            → mesmo conteúdo de /mundo
  /liquidez, /sentimento, /defi, /yields → mesmo conteúdo de /fluxos
  /lab, /atlas, /ciclo, /portugal     → mesmo conteúdo de /contexto
  /mercado, /graficos, /etf           → confirmar destino

FAZ:
1. Confirma tu próprio o mapeamento antes de mexer.
2. Define o URL canónico de cada destino.
3. Converte os antigos em REDIRECTS permanentes (não páginas que renderizam o
   mesmo). Consulta node_modules/next/dist/docs/ para a forma correcta nesta
   versão.
4. Excepção: se algum antigo tiver conteúdo próprio que se perdeu na
   consolidação, diz qual antes de o eliminares — não apagues em silêncio.
5. Verifica que nenhum link interno aponta para um URL morto.

ACEITAÇÃO:
- Um URL canónico por destino; antigos redireccionam.
- Zero links internos partidos (verifica a sério, percorrendo as páginas).
- npm run lint && npm run typecheck && npm run build passam.
```

---

## E8 — Verificação final

```
TAREFA: Provar que a reestruturação atingiu o objectivo. Medir, não afirmar.

MEDE E REPORTA, antes vs depois:
- Percentagens na entrada: 105 → alvo < 30
- Secções na entrada: 15 → alvo ≤ 8
- Valores duplicados na entrada (preço BTC 3×, stress 4×) → alvo 1× cada
- Caracteres em /mundo: 1445 → deve ter crescido substancialmente
- SVGs em /contexto: 0 → deve ser > 0
- Render frio e quente: não podem regredir (base ~5s / ~0.3s)

VERIFICA:
- Os três níveis do Dial mudam densidade a sério em todas as páginas.
- 375px: sem scroll horizontal do body; Nível 1 legível.
- Contraste AA nos dois temas.
- Teclado e leitor de ecrã nas vistas principais.
- prefers-reduced-motion respeitado.
- Nenhum dado inventado; sinais em falta ditos explicitamente.

TESTE DE LEITURA (o mais importante):
Alguém que nunca viu o produto consegue, em 5 segundos na entrada, dizer se hoje
é um dia calmo ou tenso, e porquê? Se não consegue, o Nível 1 falhou —
diz-me isso em vez de dar por concluído.

ACEITAÇÃO:
- Todas as métricas medidas e reportadas com números reais.
- npm run lint && npm run typecheck && npm run build && npm run test:e2e passam.
```

---

## Notas para quem executa

- **Um prompt de cada vez, um commit por prompt.** São dependentes na ordem.
- **E1 e E2 são a fundação.** Saltá-los produz outro remendo.
- Regra transversal: **nunca apresentar dados inventados como reais.** Estado
  vazio honesto > número bonito e falso.
- Critério final de cada entrega: *"isto responde a uma pergunta do leitor, ou só
  mostra um dado que temos?"*
