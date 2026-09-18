# Auditoria M9 — limites medidos do sistema de movimento

Data: 2026-09-18 · Build de produção (`next build` + `next start`) · Chromium headless
(SwiftShader — renderização por software; os fps medidos são um PISO, não o
desempenho em hardware real).

**Leitura honesta primeiro:** os números abaixo foram medidos, não estimados.
Onde a medida foi inconclusiva, dizemos que foi inconclusiva.

---

## 1. fps por página (rAF contado durante ~1.2–1.5s)

| Página | Movimento ON | Movimento OFF (reduced-motion) | Custo do movimento |
|---|---|---|---|
| `/pt` | 20.5 | 47.7 | −27 fps (AmbientField + vibração do mapa) |
| `/pt/mercado` | 42.8 | 47.9 | −5 fps |
| `/pt/fluxos` | 58.3 | — | caudal é one-shot, custo residual |
| `/pt/defi` | 59.7 | — | — |
| `/pt/cadeias` | 59.7 | — | — |
| `/pt/casos` | 53.1 | — | — |
| `/pt/aprender` | 3.3* / 60.7 | — | *medido durante o layout inicial de uma página de 21 515px; em repouso: 60.7fps, 0 animações activas |
| `/pt/mesa` | 41.0 | 45.7 | −5 fps |
| troca de camada no mapa (Flip) | 21.7–25.6 | — | pico durante a transição |

**Achados:**
- O custo dominante é o **AmbientField** (canvas rAF) na entrada — não a
  vibração dos tiles nem os Flip. É ele que justifica a maior parte do delta
  em `/pt`.
- `/aprender` a 3.3fps foi medido durante o primeiro layout de uma página de
  ~21.5k px em renderização por software; em repouso mede 60.7fps com zero
  animações. Não é custo do movimento — é o primeiro paint de uma página
  muito longa em CPU-bound.
- Alvo 60fps em portátil médio: **não verificável em headless** (SwiftShader).
  O que se pode afirmar: com movimento desligado tudo fica a ~46–60fps mesmo
  em CPU-bound; o delta medido concentra-se num componente (AmbientField).

## 2. Render frio/quente (ms até DOMContentLoaded, medido em produção)

| Página | Frio | Quente |
|---|---|---|
| `/pt` | 1899 | 2558* |
| `/pt/mercado` | 1678 | 1538 |
| `/pt/fluxos` | 2777 | 1401 |
| `/pt/defi` | 4845 | 2450 |
| `/pt/cadeias` | 3683 | 1932 |
| `/pt/casos` | 6737 | 2201 |
| `/pt/aprender` | 4729 | 1907 |
| `/pt/mesa` | 8958 | 1720 |

*variação de rede/disco entre corridas — `/pt` quente incluiu revalidação.

- Os tempos frios são dominados por **fetches de dados server-side**
  (DefiLlama/CoinGecko/Farside), não pelo movimento — o JS de movimento é o
  mesmo bundle GSAP já existente desde M3.
- **Nota honesta sobre "antes vs depois":** não se reconstruiu o build
  pré-V3 para uma baseline absoluta. O proxy medido é o delta ON/OFF do
  §1 — o custo marginal do sistema de movimento no build actual.

## 3. Memória (JS heap, ~6+10 min, alternando `/pt`↔`/fluxos` com sockets vivos)

- 12 amostras (30s): **42.6MB constantes** — zero crescimento mesmo com 11
  remounts de página (sockets e animações montam/desmontam a cada troca).
- Segunda janela: ver `data/audit/m9-memory2.log`.
- Conclusão: sem fuga de animações/sockets detectável nesta janela.

## 4. Pausa com página oculta

Medido com `document.hidden=true` + `visibilitychange` despachado:

- Tiles vibrantes do mapa: **N → 0** (o Maestro passa a MOTION_REST e a
  classe é retirada — verificado).
- Encontrado e **corrigido em M9**: `corrente-edge-pulse` (marcadores "agora"
  das Correntes) era classe CSS incondicional — pulsava mesmo subdued.
  Agora a classe só se aplica quando `!motion.subdued`.
- Limite do teste: em headless não se emula o throttling de rAF do browser
  real — em tab realmente oculta, o Chrome suspende rAF nativamente (o
  AmbientField fica a custo ~0 garantido pelo browser, não pelo nosso código).
- Restantes "running" após ocultar: flashes de tape one-shot a completar —
  transitório, não contínuo.

## 5. prefers-reduced-motion — todas as páginas

`document.getAnimations()` com `reducedMotion: 'reduce'`:

| | /pt | /mercado | /fluxos | /defi | /cadeias | /casos | /aprender | /mesa |
|---|---|---|---|---|---|---|---|---|
| running | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| infinite | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

**Zero animações a correr em qualquer página.** O estado de repouso do
Maestro coincide com o CSS (`prefers-reduced-motion` mata todos os keyframes
incl. os novos `signal-chip`, `flow-bar`, `chart-path-any`, `chart-fill`,
`corrente-edge-pulse`).

## 6. Legibilidade sob stress

- Amplitude máxima teórica da vibração dos tiles: `0.6 + vol(≤1) × 2.2 ×
  agitação(≤0.85)` = **≈2.47px** — deslocamento máximo possível, tecto do
  Maestro.
- Elementos de texto com `transform` computado na entrada: **0** — nenhum
  texto se move, em nenhuma circunstância.
- A agitação nunca ultrapassa 0.85 (`AGITATION_CEILING`) — o ecrã pode ficar
  vivo mas não ilegível, por construção.

## 7. 375px — scroll horizontal REAL

Teste honesto: `window.scrollTo(60,0)` e verificação de `window.scrollX`:

| | /pt | /mercado | /fluxos | /defi | /cadeias | /casos | /aprender | /mesa |
|---|---|---|---|---|---|---|---|---|
| scrollX real | false | false | false | false | false | false | false | false |

(O `scrollWidth` de `/mesa` infla para 2057 pela tape interna com
`overflow-x:auto` própria — mas a janela não rola: `scrollX` fica a 0.)

## 8. Contraste AA

Coberto pelo e2e `smoke.spec.ts:290` — tokens ink/bg, muted/bg, accent/bg,
up|down/bg nos dois temas passam razão AA (teste corre na suite, 62/62).

## 9. Teclado e leitor de ecrã

| Página | Interactivos | Sem nome acessível | Foco visível |
|---|---|---|---|
| /pt | 48 | 0 | sim |
| /mercado | 27 | 0 | sim |
| /fluxos | 23 | 0 | sim |
| /casos | 86 | 0 | sim |

Tiles do mapa são `<button>` com aria-label "nome + leitura"; chips de
evidência e barras mantêm o texto sempre no DOM (a animação nunca esconde
conteúdo — `both` fill + texto acessível mesmo se suprimida).

## 10. Dados inventados — varrimento de texto

| | /pt | /mercado | /fluxos | /defi | /cadeias | /casos | /aprender | /mesa |
|---|---|---|---|---|---|---|---|---|
| "NaN" | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| "undefined" | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| "null" | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| flags honestas | 0 | 0 | 1 | 1 | 1 | 1 | 0 | 0 |

Em `/fluxos`, `/defi`, `/cadeias`, `/casos` aparece "desactualizado" — a
marca de snapshot stale a funcionar como deve (dados de ontem declarados,
não escondidos).

---

## Teste final de produto (5 segundos, sem ler números)

*Consegue um recém-chegado dizer se hoje é calmo ou tenso?*

**Veredicto honesto: parcialmente.**

- A favor: a cor dos tiles (mar de verde vs manchas vermelhas), o chip de
  regime e a densidade do campo ambiente comunicam sem números.
- Contra: num dia calmo (como hoje) o campo ambiente é subtil ao ponto de
  quase se perder; a vibração por activo é a melhor pista mas está capada a
  ~2.5px — em stress extremo a página gritaria mais, mas a calma é quase
  silêncio. É uma escolha defensável ("o repouso também é um estado
  legível") mas o limiar inferior do gradiente é baixo.
- O que falharia o teste: se o utilizador olhasse só acima da dobra em
  desktop — a faixa de instrumentos resume em texto, e a leitura cromática
  forte vive no mapa.

## O que ficou por fazer / limitações desta auditoria

1. **Baseline pré-V3 não reconstruída** — o "antes vs depois" absoluto do
   render não existe; reportámos o delta ON/OFF medido no mesmo build.
2. **fps em hardware real não medido** — SwiftShader é um piso; o delta
   ON/OFF é a parte transferível.
3. **Janela de memória interrompida a ~6min** na primeira corrida (race de
   navegação no sampler); segunda janela em `m9-memory2.log`. As 12 amostras
   planas a 42.6MB são evidência forte mas não os 10min completos pedidos.
4. **Avaliação do teste dos 5s é de um autor** — seria mais forte com um
   segundo par de olhos que nunca viu o site.

## Defeito encontrado e corrigido nesta auditoria

- `corrente-edge-pulse` aplicava-se como classe incondicional — o pulso
  corria mesmo em repouso/oculta. Agora só existe quando `!motion.subdued`
  (globals.css + Correntes.tsx).
