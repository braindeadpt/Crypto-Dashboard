---
name: crypto-info-site
description: Product rules for CLAREZA Crypto — a bilingual (PT-PT/EN) crypto market observatory for the Portuguese market, not a price tracker. Use whenever editing copy, layout, data display or adding features to this repo.
---

# CLAREZA Crypto — regras de produto

## O que é

Observatório de mercado crypto bilingue (PT-PT primário, EN secundário),
directionado ao mercado português — do iniciado ao operador. A promessa:
perceber o mercado inteiro em segundos sem abrir dez tabs. Bitcoin é
sempre o factor principal. Sem sinais de trading, sem conselhos
financeiros, sem hype. O plano-mestre vive em `docs/PLANO-CLAREZA.md`.

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

Arquitectura canónica (ver `docs/PLANO-CLAREZA.md` §3); os slugs antigos
fazem 308 para estes.

- **Agora** (`/`) — o mercado em segundos: hero BTC (manchete + preços
  live + campo ambiental), mapa do mercado (treemap), Pulso (radar de
  regime, operador+), três leituras em linguagem comum, briefing de
  5 slots. Cada dado aparece UMA vez.
- **Mercado** (`/mercado`) — o mapa completo: treemap, dominância BTC,
  movers, amplitude.
- **Fluxos** (`/fluxos`) — de onde vem o dinheiro: stablecoins, ETF,
  alavancagem, F&G.
- **DeFi** (`/defi`) — TVL, chains, protocolos, yields, bridges.
- **Cadeias** (`/cadeias`) — blockchains comparadas.
- **Casos** (`/casos`) — Causa & Efeito + rotação sectorial.
- **Aprender** (`/aprender`) — Atlas, literacia, segurança, Portugal
  (fiscal aponta sempre para TOC).
- **Ferramentas** (`/ferramentas`) — verificação de carteiras EVM/BTC e
  utilitários. Nunca pede chaves nem seed phrases.
- **Mesa** (`/mesa`) — o board denso do analista.

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
ênfase, verde/coral para direcção (sempre com glifo ▲▼). Sora para
display, IBM Plex Sans/Mono para corpo e dados. Bordas finas, radius 2px,
sem glassmorphism. Motion com significado: entradas coreografadas uma vez
por sessão, números vivos, view transitions, campo ambiental que reage ao
regime — `prefers-reduced-motion` desliga tudo, 60fps ou nada.

Anti-padrões proibidos: gradientes roxos de landing page, glassmorphism,
cards iguais em pilha, números sem contexto, copy de marketing.
