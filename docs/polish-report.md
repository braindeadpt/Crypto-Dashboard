# Acabamento — relatório AA / motion / mobile / perf

## Contraste (WCAG AA, texto normal ≥ 4.5)

Medido contra `--bg` em ambos os temas (tokens ajustados):

| Par | Light | Dark |
|-----|------:|-----:|
| ink / bg | 14.56 | 14.80 |
| muted / bg | 7.73 | 8.42 |
| faint / bg | 4.86 | 6.00 |
| up / bg | 5.57 | 9.27 |
| down / bg | 5.82 | 8.28 |
| accent / bg | 6.90 | 7.06 |

Todos ≥ 4.5. Direcção de preço acompanha sempre sinal/▲▼ (não só cor). Verificado em e2e `polish · contrast tokens`.

## prefers-reduced-motion

Desliga: enter, tape-flash, live-dot pulse, skeleton shimmer, chart-draw, pulso morph, scroll-behavior smooth, transitions em links/botões. Verificado em e2e.

## Mobile (375)

- `overflow-x: clip` no html/body; scrollers `.scroll-x` internos (tape, nav).
- Header densificado (dial E/O/A, tema L/D, tagline oculto).
- Ritual em coluna; Pulso com stage ≤ 280–320px.
- Skeletons com forma do board (ritual + tape + pulso).
- E2e: sem overflow horizontal no documento.

## Teclado / leitor

- Skip link → `#main` (Tab → Enter)
- Dial de expertise com `role="radiogroup"` + `aria-label` por opção
- Pulso com `aria-label` composto; gráfico com tabela OHLC acessível

## Performance (cold `/pt`, Playwright Chromium)

Amostras em `data/perf/latest.json` (produção via `npm start`):

| Métrica | Amostra cedo | Última (pós-acabamento) | Budget |
|---------|------------:|------------------------:|--------|
| LCP | 1544–3772 ms | **1948 ms** | < 4000 ms |
| CLS | 0.02–0.045 | **0.010** | < 0.1 |
| INP | n/d* | n/d* | < 200 ms |
| TTFB | 137–477 ms | 937 ms (varia c/ APIs) | — |

\*INP só regista com interacção prolongada; smoke clica mas o browser nem sempre expõe Event Timing no cold path.

Sem regressão de CLS material; LCP depende de dados live no cold path (board dinâmico). Fontes via `next/font` + `adjustFontFallback`. WebSockets/timers limpam no unmount.

## Gate

`npm run lint && npm run typecheck && npm run build && npm run test:e2e` — 17 e2e OK.
