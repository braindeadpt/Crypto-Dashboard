# CLAREZA Crypto — Sistema de design «O Observatório»

Instrumento de observação do mercado: calibrado, editorial, denso.  
Pergunta de teste: *parece um instrumento com escala, ou mais um dashboard SaaS?*

## Decisões (com justificação)

| Escolha | Porquê |
|--------|--------|
| **Newsreader** (serif editorial) | A voz de publicação: manchete do dia, títulos de placa, artigos do Atlas. Óptica e delicada — separa "a nossa voz" da "voz do instrumento". |
| **Sora** (display/UI) | Geométrica com autoridade — títulos de secção, número-herói, chrome. |
| **IBM Plex Sans** (UI) | Neutra, precisa, com carácter. Evita Inter / system-ui. Boa em densidade. |
| **IBM Plex Mono** (dados) | Família irmã do Plex; `tabular-nums` para números que não dançam. |
| **Placas numeradas** | Cada acto é uma placa gravada: número mono, título serif, coordenada à direita, idade da fonte. `.placa-head` + `ActHead` (prop `num`). |
| **«Noite» como default, «Papel» a um clique** | Noite (`#05070e`) é o tema de entrada desde V4 — a luz em movimento precisa de fundo escuro para se ler. «Papel» editorial quente (`#f4f1e9`) fica sempre a um clique. |
| **Acento = violeta de instrumento** | `#9b6cff` (Noite) / `#5b2bd9` (Dia). Marca, links, live. Separado de sobe/desce e de regime. |
| **Ênfase = ciano** | `--accent-2` (`#22e6ff`/`#0a7ea8`) — destaques secundários, campo ambiental. |
| **Direcção = teal / âmbar + ▲▼** | Mais seguro para daltonismo do que verde/vermelho isolados. |
| **Foco = tinta/papel invertido** | Anel de acessibilidade distinto do acento. |
| **Elevação por superfície + sombra curta** | Poucos níveis claros; sem glassmorphism / blur. |
| **Radius 2px** | Instrumento, não cartão app. |
| **Movimento só com significado** | Flash em mudança de valor; limiar; live-dot. Tokens `--dur-*` / `--ease-*`. `prefers-reduced-motion` desliga animações. |

## Escala tipográfica

| Token | px | Uso |
|-------|-----|-----|
| `--text-micro` | 10 | Proveniência, rodapés — nunca informação primária |
| `--text-label` | 12 | Chrome, rótulos mono uppercase |
| `--text-meta` / `--text-data` | 14 | Captions, figuras tabulares |
| `--text-body` | 18 | Texto corrido |
| `--text-title` | 24 | Títulos de secção (Sora) |
| `--text-display` | 40 | Momentos editoriais (Sora) |
| `--text-hero` | 72 | Número / leitura dominante |
| `.text-serif-display` | 30→54 fluido | Manchete e títulos de placa (Newsreader) |

Classes: `.text-micro`, `.text-label` … `.text-hero`, `.text-serif-display`, `.font-display`, `.font-mono`.

## Papéis da cor

| Token | Papel |
|-------|--------|
| `--accent` | Marca, links, live, acção |
| `--up` / `--down` | Direcção de preço / fluxo (sempre com glifo ▲▼) |
| `--calm` / `--unsettled` / `--storm` / `--weird` | Estado de regime |
| `--focus` | `:focus-visible` |
| `--bg` … `--surface-3` | Elevação cromática |
| `--ink` / `--muted` / `--faint` | Hierarquia de texto |

Temas: `[data-theme="dark"]` (Noite — default) e `[data-theme="light"]` (Papel).  
Preferência: `localStorage` (`clareza-theme`) → Noite.

## Elevação e superfícies

| Nível | Token / padrão |
|-------|----------------|
| 0 flat | só `--line` |
| 1 raised | `--elev-1` + `--surface` |
| 2 float | `--elev-2` + `--surface-2` |
| hero | `--elev-hero` + `.panel-hero` (~20% do ecrã) |
| placa | `.placa` — superfície gravada: hairline + aresta luminosa `.lum-hero` + numeral |
| registo | `.registo` — referência/proveniência: fundo quase plano, texto micro |

Layout: `.obs-shell` (container único) + `.section-pad` (ritmo lateral).

## Movimento

- `--dur-fast` 120ms · `--dur-med` 280ms · `--dur-slow` 480ms  
- `--ease-out` / `--ease-in-out`  
- Classes: `.tape-flash-up/down`, `.threshold-flash`, `.live-dot--on`, `.enter`

## Contraste AA (verificado)

Pares principais (aproximação WCAG sobre sRGB):

| Par | Tema claro | Tema escuro |
|-----|------------|-------------|
| ink / bg | ~14.6:1 | ~14.8:1 |
| muted / bg | ~6.2:1 | ~7.2:1 |
| accent / bg | ~6.9:1 | ~7.1:1 |
| up / bg | ~5.2:1 | ~9.3:1 |
| down / bg | ~5.1:1 | ~8.3:1 |

Faint sobre bg (~3.8:1 claro / ~4.1:1 escuro) só para chrome terciário (rótulos de instrumento). Texto operacional usa `muted` ou `ink`.

## O Maestro (movimento)

`src/lib/motion/conductor.ts` + `src/lib/motion/useMotion.tsx` — UM estado
de movimento global derivado das leituras reais. Nenhum componente inventa
a sua própria duração ou amplitude: todos subscrevem `useMotion()`.

| Canal | Fonte real | Codifica |
|---|---|---|
| `cadence` | volatilidade realizada BTC (`vol_realized_btc`) | × duração das transições |
| `agitation` | leitura de Risco (0–100, smoothstep 30→85) | amplitude/densidade do campo |
| `temperature` | leitura de Direcção (−100..+100) | energia cromática |
| `subdued` | reduced-motion, página oculta, confiança < 0.6 | repouso total |

Regras: `prefers-reduced-motion` vence sempre; `visibilitychange` pausa;
confiança fraca força `MOTION_REST` — o ecrã nunca finge energia que os
dados não sustentam. Tecto de agitação `0.85`: num crash é quando mais se
precisa de ler. Referência viva dos quatro canais em `/estilo` (secção
Movimento, com dados reais do dia).

## Ambient field

`AmbientField` (home hero) — canvas decorativo de partículas + ligações,
tingido pelos tokens `--accent`/`--accent-2`, com fade nas bordas
(`.field-fade`). Subscreve o canal Agitação do Maestro (`intensity` é o
fallback fora de provider). Regras: `aria-hidden`, `pointer-events-none`,
frame estático em repouso, nunca compete com a leitura.

## Referência viva

`/[locale]/estilo` — prova do sistema (tipografia, papéis, elevação, movimento).

## Lista negra (proibido)

Verde/roxo néon em preto absoluto · Inter · cartões iguais rounded-xl · glass/blur/mesh · emoji-ícones · paleta Tailwind default · herói com gradiente · animação decorativa · microcopy vazio · layout genérico centrado max-w-7xl.
