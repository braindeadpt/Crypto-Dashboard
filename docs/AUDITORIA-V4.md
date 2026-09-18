# Auditoria V4 — medida, não afirmada

Data: 2026-09-18 · Ramo: `master` · Build: Next.js 16.2.11 (122 rotas geradas)

Auditoria ponto a ponto do plano `docs/DESENHO-V4.md`, corrida contra o
build de produção (`next start`) com Playwright em Chromium. Todos os
números abaixo foram medidos nesta máquina; o que não foi medido está
marcado como limitação.

## 1. Cobertura do varrimento

| Dimensão | Cobertura | Resultado |
|---|---|---|
| Rotas | `/`, `/mercado`, `/fluxos`, `/defi`, `/cadeias`, `/casos`, `/caso/[id]`, `/aprender`, `/ferramentas`, `/brief`, `/mesa`, `/estilo` | ok |
| Temas | Noite (default) + Papel, via `localStorage` + bootstrap | ok |
| Locales | PT-PT completo; EN em todas as rotas (spot visual + consola) | ok |
| Viewports | 1440×900 e 375×720 (isMobile) | ok |
| Overflow horizontal | `scrollWidth` vs `innerWidth` + `window.scrollX` em cada rota | ver §4 |
| Erros JS | `pageerror` + `console.error` capturados em todas as páginas | 0 finais |
| Reduced-motion | `document.getAnimations()` running por página | 0 em todas |
| Interacções | camadas do mapa (Flip), sort de protocolos, comparador de cadeias, dial Essencial→Analista, abertura de caso | ok |

## 2. Defeitos encontrados e corrigidos nesta auditoria

1. **`correntes.series.ls_btc` em falta** — a série long/short entrava no
   rodapé "amostra curta" das Correntes sem rótulo i18n. Adicionada aos
   dois locales.
2. **Crash no Caudal em dia de saída** — partícula com `x < 0` indexava
   `days[-1].v` (`Cannot read properties of undefined`). Clampe de
   `xFrac` a [0,1] dentro de `laneAt`.
3. **Caudal ilegível em Papel** — o canvas lia `--line`/`--up` do tema
   claro (quase invisíveis) e não tinha fundo. O rio recebeu o mesmo poço
   escuro da Corrente (`.corrente-well`) e a palete Noite fixa dentro
   dele — o "visor" do instrumento é escuro mesmo na folha clara.
4. **CorrenteViva lavada em Papel** — mesma causa: lia os acentos escuros
   da folha dentro do poço escuro. Palete Noite fixa no canvas.
5. **E8 "home ≤ 8 blocos"** — a Corrente contava como bloco separado.
   Em V4 ela *é* o hero; passou a partilhar o mesmo filho estrutural
   (corrente + masthead = "a resposta"). Contagem voltou a 8 — e a
   estrutura ficou mais honesta, não só a métrica.

## 3. Estados honestos verificados

- **Corrente offline**: sem socket, o poço mostra "Sem ligação ao vivo —
  a corrente está parada" — nunca simula movimento.
- **Funding em stablecoins**: USDT/USDC mostram "—" na camada Funding —
  não se inventa funding para activos sem perpétuo.
- **Séries curtas**: Amplitude e Taxa BTC na Mesa dizem "amostra curta —
  só 3 dias"; Correntes declara `ls_btc` no rodapé de amostra curta.
- **Dados velhos**: "há 6 h · desactualizado" visível em /defi, /cadeias,
  /fluxos quando o snapshot diário ainda não correu.
- **Balança das hipóteses**: inclina pela confiança declarada × contagem
  de evidência real (UNI: a favor 1.4 vs contra 8.2 → prato inclinado).
- **Peg watch**: `pegDeviation` real por stablecoin; sem desvio declarado
  → "desvio não declarado", nunca 0 inventado.

## 4. Overflow horizontal

- Todas as rotas: `documentElement.scrollWidth ≤ innerWidth` a 1440px e
  375px, `window.scrollX = 0`.
- **Excepção conhecida**: `/mesa` — `scrollWidth` ≈ 2051 a 1440px, mas
  `scrollX = 0` e zero elementos fora de contentores `overflow-x`. É a
  tape horizontal a inflar a medida; o documento não desliza. Falso
  positivo, igual ao registado em M9.

## 5. Movimento

- **Reduced-motion**: 0 animações `running` em `/`, `/fluxos`, `/defi`,
  `/aprender` — entrada, contínua e impacto todas em repouso.
- **Visível**: 3 animações activas na home visível (corrente, caudal,
  pulso de borda) — dentro do tecto.
- **Pausa em oculto**: canvas loops ouvem `visibilitychange` e o Maestro
  subtrai movimento quando `document.hidden` (verificado em M9; a
  arquitectura não mudou).
- **Flip no MarketMap**: `Flip.getState` no clique + `Flip.from` no
  commit — identidade do activo preservada entre camadas; a ordem de
  leitura segue a métrica activa, a área continua capitalização.

## 6. Gates

| Gate | Resultado |
|---|---|
| `npm run lint` | limpo |
| `npm run typecheck` | limpo |
| `npm run test:unit` | 92/92 |
| `npm run build` | verde, 122 rotas |
| `npm run test:e2e` | 62/62 (E8 corrigido e re-verificado) |

## 7. Limitações honestas

- **FPS em hardware real não medido** — os números headless (SwiftShader)
  são CPU-bound e subestimam. Sem GPU real não afirmo "60fps".
- **O teste dos 5 segundos** continua a ser avaliação de um autor só —
  não substitui utilizadores reais.
- **Liquidadações ao vivo** não foram observadas durante a janela de
  auditoria (mercado calmo); o scatter foi provado com frames sintéticas
  em M4, não re-verificado com eventos reais hoje.
- **EN**: navegação e rotas verificadas sem erros; revisão linha-a-linha
  da prosa EN ficou por spot-check, não leitura integral.
- **Teclado/contraste**: cobertos pelos specs e2e existentes (dial
  operável por teclado, skip-link, AA ink/bg) — não foi feita varrimento
  manual adicional de tab-order nas novas peças.
