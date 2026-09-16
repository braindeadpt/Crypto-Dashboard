# CLAREZA — P1 · Tier Pro (spec)

> **Estado:** spec — nada implementado. Depende de F1–F7 ✅ (2026-09-16).
> Referências: `docs/PLANO-CLAREZA.md` §7 (a promessa do Pro),
> `docs/VISION-tax-module.md` (o módulo fiscal — produto separado, não é P1).

## 1. A tese numa frase

O grátis fica completo e o completo fica grátis — o Pro vende
**persistência, profundidade e tempo poupado**, nunca informação.
Metodologia, leituras auditáveis, segurança e educação nunca têm paywall:
a confiança é o produto; cobrar pelo que a sustenta destrói-a.

## 2. O que é Pro (e o que nunca será)

| Superfície | Grátis | Pro |
|---|---|---|
| Desk inteiro (todas as rotas, manchete verificável, metodologia) | ✓ | ✓ |
| Watchlist local (localStorage, máx 12) | ✓ | ✓ |
| Watchlist sincronizada entre dispositivos, sem limite | — | ✓ |
| Carteira read-only (saldo + actividade, Etherscan/mempool) | ✓ | ✓ |
| Carteira profunda (Bitquery: composição, fluxos, counterparties) | — | ✓ |
| Séries: snapshots locais | ✓ | ✓ |
| Séries longas no servidor (histórico que sobrevive ao browser) | — | ✓ |
| Alertas (mudança de regime, funding extremo, dia-record ETF, watchlist) | — | ✓ |
| Exportações (CSV do briefing, série do regime, watchlist) | — | ✓ |
| Fiscalidade / motor de mais-valias / Anexo G | — | **não é P1** |

A fronteira fiscal pertence ao módulo de `docs/VISION-tax-module.md` —
outro produto, outro modelo de confiança, validação por TOC. A "carteira
profunda" do Pro é **orientação e forense** (o que há, de onde veio, com
quem interage); nunca calcula obrigações fiscais.

## 3. Princípios não-negociáveis

1. **Read-only sempre.** Nunca pedir chaves, nunca assinar mensagens,
   nunca executar transacções.
2. **Zero armazenamento de endereços no servidor.** A análise de carteira
   é efémera: browser → rota API → Bitquery → render → descarta. O que
   persiste no servidor é conta, preferências e watchlist de **moedas**
   (ids CoinGecko) — nunca endereços.
3. **Alertas ≠ sinais de trade.** Linguagem de estado ("o regime mudou
   para X", "funding acima de Y"), nunca de acção. Copy de cada alerta
   revista como copy editorial.
4. **Auth leve.** Magic link, sem password — menos dado guardado, menos
   fricção, nada para vazar.
5. **Os mesmos gates.** lint + typecheck + unit + build + e2e, mais uma
   revisão de privacidade por fase (o que o servidor passou a guardar).

## 4. Arquitectura

### 4.1 Auth — magic link via Supabase Auth (recomendado)

- O MCP `supabase` já está configurado; Supabase Auth dá magic links,
  sessões e Postgres com RLS no tier base.
- Alternativas consideradas: assinatura de wallet (rejeitada — exige
  wallet instalada e "sign this message" assusta citizens); código de
  sync local-first (rejeitado — não resolve alertas por email);
  NextAuth/Auth.js + adapter (fallback viável se se preferir Postgres
  próprio).
- Cookie de sessão httpOnly; sem password não há breach de password.
- RGPD: email + preferências = dados mínimos; precisa de política de
  privacidade e **apagar conta self-service** desde o dia 1.

### 4.2 O limite de dados (o desenho que importa)

```
servidor guarda:  email · nível de expertise · watchlist de moedas
                  · preferências de alertas
nunca guarda:     endereços de carteira · histórico de carteira
                  · seeds/keys (impossível por desenho)
```

Carteira profunda: o endereço viaja do browser para a rota API e daí para
a Bitquery; a resposta renderiza-se e o endereço não é persistido nem
registado em log. Nota honesta na UI: a Bitquery vê o endereço consultado
— divulgar, como se divulga qualquer fonte.

### 4.3 Bitquery

- MCP `https://mcp.bitquery.io` (OAuth 2.1, read-only, 40+ chains) já
  configurado em `.devin/mcp_config.json`.
- Uso **server-side apenas**, com cache curto; custo por query é a quota
  que o Pro paga.
- Cobertura útil: holdings multi-chain, fluxos de entrada/saída,
  counterparties, actividade DEX, idade/distribuição de holders.
- Etherscan continua free para o read-only simples — o endpoint PRO de
  portfólio agregado (~$199/mo) não é preciso com Bitquery no stack.

### 4.4 Billing

- Stripe Checkout + Portal quando o Pro passar a pago.
- **Inclinação: beta grátis para contas registadas** — cobrar só quando
  alertas + exportação existirem (o Pro sem eles é fino demais para pedir
  dinheiro).

## 5. Fases

| Fase | Entrega | Critério de aceite |
|---|---|---|
| **P1.0** | Conta: magic link, perfil, sync de preferências (dial + watchlist) | Login noutro dispositivo mostra a mesma lista e densidade |
| **P1.1** | Séries longas: snapshots por utilizador no servidor | Histórico sobrevive a mudança de browser/dispositivo |
| **P1.2** | Carteira profunda via Bitquery (nova superfície Pro em `/ferramentas`) | Composição + fluxos + histórico enriquecido, efémero, fonte visível, sem persistência do endereço |
| **P1.3** | Alertas por email: regime, funding extremo, dia-record ETF, movimentos da watchlist | Linguagem de estado, link directo para a métrica-fonte, opt-in granular, unsubscribe em 1 clique |
| **P1.4** | Exportações: CSV do briefing do dia, série do regime, watchlist | Ficheiro honesto — os mesmos dados, sem enfeitar |
| **P1.5** | Billing Stripe + página `/pro` | Grátis fica intocado; upgrade/downgrade self-service |

## 6. Decisões em aberto

- **Preço.** Trackers cobram $10–40/mês; o Pro da CLAREZA deve ficar
  baixo (inclinação: ~€5–9/mês — preço de café, não de terminal).
- **Beta grátis vs pago no dia 1** (inclinação: beta grátis).
- **Canal de alertas:** email vs feed in-app vs RSS privado
  (inclinação: email — é onde o ritual diário já vive).
- **Residência de dados** no Supabase (região EU).
- **Quota Bitquery** por utilizador Pro — medir custo real na beta antes
  de fixar preço.

## 7. Riscos

- Criar conta gera expectativa de "portfolio tracker" — a copy tem de ser
  clara: Pro = profundidade de leitura, não tracking de portefólio (isso
  é o módulo fiscal, outro produto).
- Alertas descambam facilmente em sinais — revisão editorial obrigatória
  de cada copy antes de activar.
- Cada fase alarga o perímetro de dados pessoais — revisão de privacidade
  por fase, delete-account sempre disponível.

## 8. O que P1 explicitamente não cobre

- Motor fiscal PT, mais-valias, Anexo G/G1/J → `docs/VISION-tax-module.md`
- Execução on-chain, custódia, gestão de chaves → nunca
- Paywall sobre informação, metodologia ou segurança → nunca
