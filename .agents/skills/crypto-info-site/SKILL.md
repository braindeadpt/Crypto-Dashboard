---
name: crypto-info-site
description: Product rules for CLAREZA Crypto — a bilingual (PT-PT/EN) daily market-orientation desk, not a price tracker. Use whenever editing copy, layout, data display or adding features to this repo.
---

# CLAREZA Crypto — regras de produto

## O que é

Observatório de mercado bilingue (PT-PT primário, EN secundário). Não é um
agregador de preços nem um tracker: é um briefing diário de ~5 minutos que
diz o que mudou, porque importa e o que não fazer. Sem sinais de trading,
sem conselhos financeiros, sem hype.

## Regra nº1 — nunca inventar dados

- Nunca inventar preços, percentagens, datas, fluxos ou rankings. Se a fonte
  falha, mostra-se a falha ("—", "indisponível", amostra curta) — nunca um
  número fabricado.
- Todo o dado leva timestamp ou data de série visível; séries paradas
  recebem aviso explícito ("Séries paradas em {date}").
- Linguagem de correlação, sempre: «consistente com», nunca «causado por».
- Um ingrediente em falta contribui zero e regista-se como lacuna — a
  confiança das leituras desce em proporção ao peso por cobrir.

## Páginas e o trabalho de cada uma

- **Agora** (`/`) — a resposta de hoje: hero (manchete + preços live +
  campo ambiental), Pulso (radar de regime, operador+) e as três leituras
  em linguagem comum (Direcção / Risco / Dinheiro), briefing de 5 slots.
  Cada dado aparece UMA vez — a página não re-diz a história em cards.
- **Mundo** (`/mundo`) — Caso & Efeito: o que se mexeu, quanto, hipóteses
  ranqueadas com evidência a favor e contra; rotação sectorial.
- **Fluxos** (`/fluxos`) — de onde vem o dinheiro: oferta de stablecoins,
  fluxos ETF spot, alavancagem (funding, OI, liquidações), F&G histórico.
- **Contexto** (`/contexto`) — educação e terreno: ciclo, Atlas de
  conceitos, Segurança (seed/entropia/custódia/phishing), Portugal
  (regulação e orientação fiscal — com referência a TOC), fontes.
- **Instrumento** (`/instrumento`) — a mesa completa do analista: tape,
  réguas com histórico, spot vs alavancagem, gráfico, derivados, yields,
  actividade DEX. Denso por desenho.
- **Carteira** (`/carteira`) — consulta read-only de endereços EVM e
  Bitcoin. Nunca pede chaves privadas nem seed phrases. Explica os dados
  do explorer em linguagem comum; exporta CSV; agrega endereços locais.

## Voz e idioma

- PT-PT europeu, informal segunda pessoa (tu/imperativo). Ortografia
  tradicional do projecto: activo, transacção, direcção, excepção,
  actualização, ecrã. Nunca: usuário, tela, registro, senha, você,
  celular, portfólio (é portefólio).
- Loanwords só onde naturais em cripto: swap, funding, staking,
  on-chain, halving. De resto, português.
- Texto gerado tem de ler como frases reais — nunca fragmentos de
  template ("Leitura líder: Consistente com…" é o anti-padrão).
- Frases honestas sobre incerteza são feature, não defeito.

## Densidade (dial Essencial / Operador / Analista)

O dial no header controla profundidade. Essencial = só a resposta.
Operador = + evidência e instrumentos. Analista = tudo. Ao adicionar
conteúdo, decide em que nível vive (ExpertiseGate / useExpertise).

## Stack

- Next.js + TypeScript + `next-intl` (messages/pt.json, messages/en.json)
- Tailwind v4 com tokens em `globals.css` (`--bg`, `--surface`,
  `--accent`, `--up/--down`, `--calm/--unsettled/--storm/--weird`,
  escalas tipográficas `--text-*`). Usa os tokens — nunca cores ad hoc.
- Dados: CoinGecko (preços/fiat), mempool.space (Bitcoin), Etherscan V2
  (EVM), Farside (ETF), Alternative.me (F&G), Binance (derivados),
  DefiLlama (DeFi).
- E2E: Playwright em `e2e/`; gates: `npm run lint && typecheck &&
  test:unit && build && test:e2e`.

## Design

Assinatura "Noite": fundo escuro azul-violeta, acento violeta, ciano de
ênfase, verde/coral para direcção (sempre com glifo ▲▼). Fraunces para
display, IBM Plex Sans/Mono para corpo e dados. Bordas finas, sem
border-radius grande, motion subtil com `prefers-reduced-motion`
respeitado. "Luz" carrega significado (glow = valor extremo), nunca é
decorativa em chrome.

Anti-padrões proibidos: gradientes roxos de landing page, glassmorphism,
cards iguais em pilha, números sem contexto, copy de marketing.
