# CLAREZA Crypto — Sistema de design «O Observatório»

Instrumento de observação do mercado: calibrado, editorial, denso.  
Pergunta de teste: *parece um instrumento com escala, ou mais um dashboard SaaS?*

## Decisões (com justificação)

| Escolha | Porquê |
|--------|--------|
| **Fraunces** (display) | Serif óptica com soft/opsz — autoridade de publicação financeira, não de terminal neon. Distingue títulos e o número-herói. |
| **IBM Plex Sans** (UI) | Neutra, precisa, com carácter. Evita Inter / system-ui. Boa em densidade. |
| **IBM Plex Mono** (dados) | Família irmã do Plex; `tabular-nums` para números que não dançam. |
| **Tema claro (papel) como assinatura** | ~100% dos produtos crypto são escuros. Papel *frio* de livro-razão (`#e6e9e4`), não cream+terracota genérico. |
| **Tema escuro em graphite** | Sessões longas; evita preto absoluto + verde néon (lista negra). |
| **Acento = azul de calibração** | Interacção / marca. Separado de sobe/desce e de regime. |
| **Direcção = teal / âmbar + ▲▼** | Mais seguro para daltonismo do que verde/vermelho isolados. |
| **Foco = tinta/papel invertido** | Anel de acessibilidade distinto do acento. |
| **Elevação por superfície + sombra curta** | Poucos níveis claros; sem glassmorphism / blur. |
| **Radius 2px** | Instrumento, não cartão app. |
| **Movimento só com significado** | Flash em mudança de valor; limiar; live-dot. Tokens `--dur-*` / `--ease-*`. `prefers-reduced-motion` desliga animações. |

## Escala tipográfica

| Token | px | Uso |
|-------|-----|-----|
| `--text-label` | 12 | Chrome, rótulos mono uppercase |
| `--text-meta` / `--text-data` | 14 | Captions, figuras tabulares |
| `--text-body` | 18 | Texto corrido |
| `--text-title` | 24 | Títulos de secção (Fraunces) |
| `--text-display` | 40 | Momentos editoriais |
| `--text-hero` | 72 | Número / leitura dominante |

Classes: `.text-label` … `.text-hero`, `.font-display`, `.font-mono`.

## Papéis da cor

| Token | Papel |
|-------|--------|
| `--accent` | Marca, links, live, acção |
| `--up` / `--down` | Direcção de preço / fluxo (sempre com glifo ▲▼) |
| `--calm` / `--unsettled` / `--storm` / `--weird` | Estado de regime |
| `--focus` | `:focus-visible` |
| `--bg` … `--surface-3` | Elevação cromática |
| `--ink` / `--muted` / `--faint` | Hierarquia de texto |

Temas: `[data-theme="light"]` (default do script se o sistema for claro) e `[data-theme="dark"]`.  
Preferência: `localStorage` (`clareza-theme`) → `prefers-color-scheme`.

## Elevação

| Nível | Token / padrão |
|-------|----------------|
| 0 flat | só `--line` |
| 1 raised | `--elev-1` + `--surface` |
| 2 float | `--elev-2` + `--surface-2` |
| hero | `--elev-hero` + `.panel-hero` (~20% do ecrã) |

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

## Referência viva

`/[locale]/estilo` — prova do sistema (tipografia, papéis, elevação, movimento).

## Lista negra (proibido)

Verde/roxo néon em preto absoluto · Inter · cartões iguais rounded-xl · glass/blur/mesh · emoji-ícones · paleta Tailwind default · herói com gradiente · animação decorativa · microcopy vazio · layout genérico centrado max-w-7xl.
