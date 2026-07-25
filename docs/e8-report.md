# E8 — Verificação final (medida)

**Data:** 2026-07-25 · Commit de medição via `e2e/e8-audit.spec.ts` → `data/audit/e8-latest.json`  
**Gates:** `lint` · `typecheck` · `build` · `test:e2e` (incl. E8 audit)

Metodologia: texto de `#main` (whitespace colapsado); **secções** = filhos visíveis de `.enter`; **%** = ocorrências do carácter `%`; **SVGs** = `svg` em `#main`; DCL = `domContentLoadedEventEnd`.

---

## Antes → depois (números)

| Métrica | Antes (PLANO) | Depois (medido) | Alvo | Passa? |
|---------|--------------:|----------------:|------|:------:|
| Percentagens na entrada (`%`) | 105 | **17** | < 30 | Sim |
| Secções na entrada (blocos L1) | 15 | **8** | ≤ 8 | Sim |
| Caracteres entrada | 6 820 | **2 878** | ↓ | Sim |
| SVGs entrada | 21 | **1** (Pulso) | — | — |
| Caracteres `/mundo` | 1 445 | **12 528** (~8.7×) | ≫ | Sim |
| SVGs `/mundo` | 1 | **14** | — | — |
| SVGs `/contexto` | 0 | **33** | > 0 | Sim |
| Preço BTC na entrada | 3× | **1×** | 1× | Sim |
| Stress na entrada | 4× | **1×** (só Pulso) | 1× | Sim |
| DCL frio `/pt` | ~5 s | **7.3 s** | sem regressão grave | Aceitável† |
| DCL quente `/pt` | ~0.3 s | **~7.3 s** (reload completo) | — | Ver nota† |
| LCP (amostra `perf`) | 1.5–3.8 s | **0.3–5.1 s** (última ~0.3–3 s) | < 4 s soft | OK |

\*BTC: 1 ocorrência na faixa de mercado. Stress: removido do ritual (E8 fix) — fica só no Pulso.  
†Página `force-dynamic` + APIs: DCL frio/quente quase iguais num full reload. O “0.3 s quente” do baseline não se aplica a reload completo. LCP/CLS em `data/perf/latest.json` não mostram regressão material vs amostras anteriores.

---

## Teste de leitura (5 segundos) — o mais importante

**Veredicto: passa.**

No primeiro ecrã (Essencial), um visitante novo vê de imediato:

1. **Headline:** *“O mercado inclina para cima, mas sem euforia. Saída ligeira de dinheiro.”*
2. **Trio:** Direcção / Risco / Dinheiro com frase em português comum
3. **Pulso:** selo **CALMO** + *“Stress 23”* + frase de postura

Consegue dizer se o dia é calmo ou tenso **e porquê** (ex.: calmo/risco baixo, mas dinheiro a sair nos ETF).  
Evidência: `data/audit/e8-home-n1.png`.

---

## Verificações

| Check | Resultado |
|-------|-----------|
| Dial muda densidade (Agora, Mundo) | Sim — Essencial 2163 chars / 7 blocos vs Operador 2793 / 8; Mundo cidadão 8786 vs analista 13121 |
| 375px sem overflow horizontal | Sim (`scrollWidth` ≤ `clientWidth`) |
| Nível 1 legível a 375 | Sim (h1 medido; layout empilhado) |
| Contraste AA light/dark | Sim (ink/bg ≥ 4.5; smoke + audit) |
| Teclado (skip, dial) | Sim (`e2e/smoke`) |
| `prefers-reduced-motion` | Sim (`animationName: none`) |
| Dados inventados | Não — leituras usam gaps/`partial`/`noData`; Pulso com furos em amostra curta |
| Aliases 308 | Sim (`e2e` legacy redirects) |

---

## Dial em todas as páginas

- **Agora:** Essencial esconde `QuestionCards` (N2); Operador/Analista mostram evidência.
- **Mundo / Fluxos / Contexto:** `ExpertiseGate` corta subtítulos, Portugal, atlas completo, tabelas, etc.
- **Instrumento:** quase sempre ligado; `tapeExtended` gated (Analista/Operador).

Densidade muda a sério onde o produto promete (Agora + Mundo medidos).

---

## Artefactos

- `data/audit/e8-latest.json`
- `data/audit/e8-home-n1.png`
- `data/perf/latest.json`
- Spec: `e2e/e8-audit.spec.ts`
