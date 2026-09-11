# CLAREZA — Faixa Segurança: seed phrase, entropia e custódia

> Plano de execução. **Conteúdo didáctico, não dinâmico** — não compete pela
> visibilidade diária; vive em `/contexto` como faixa permanente, irmã da faixa
> Portugal. Preparado para receber vídeos mais tarde (ver §8).
>
> Data: 2026-09-11 · Estado: plano · Decisões tomadas: faixa em `/contexto`
> (não é destino próprio nem fica só no Atlas) · Instrumento de Entropia em
> modo **só demonstração**.

---

## 1. Porquê e onde

A tese do produto é literacia. Hoje não existe nada sobre *não perder o teu
dinheiro*: `custodia` no Atlas é um parágrafo; a faixa Portugal menciona seed
uma vez no `howTo`. Para um utilizador novo, a seed phrase é **o** conceito de
maior impacto — e é estático, didáctico, sempre válido. Perfil certo: fundo de
`/contexto`, não chrome diário.

**Localização:** `/contexto`, entre o Atlas e a faixa Portugal
(conceitos → como te proteges → jurisdição). Sem novo item de nav — a IA fica
5+1 como no PLANO-INFORMACAO.

**Dial:** nova `DensitySection` `"contextoSeguranca"` com `min: "operator"`
(consistente com `contextoPortugal`). **Compensação Essencial:** o conceito
`seed-phrase` entra no Atlas como `beginner`, logo aparece na tira de 6
cartões que o nível Essencial já vê — o aviso essencial chega a todos; o guia
completo fica para Operador+. Se preferires a faixa sempre visível, basta
`min: "citizen"` (ou omitir `min`).

---

## 2. Conteúdo — `src/lib/content/seguranca.ts`

Reutiliza **exactamente** o schema de `portugal.ts` (`PortugalSection`):
`id`, `titlePt/En`, `asOf` (data de revisão), `bodyPt/En`, `howToPt/En[]`,
`examples[]`, `sources[]`, `uncertaintyPt/En`. Exporta `SEGURANCA_CONTENT` com
`disclaimerPt/En` + `reviewedAt` + `sections` + `links`.

Seis secções (`id` → título):

| id | Tema | Pontos-chave do body |
|----|------|----------------------|
| `seed` | O que é uma seed phrase | BIP-39: entropia 128/256 bits + checksum → 12/24 palavras de uma lista fixa de 2048 → semente mestra → todas as chaves/endereços. **A frase é a carteira; a app é só uma janela.** Perder = perder tudo; revelar = dar tudo. |
| `entropia` | Entropia | O que é um bit de entropia; 2^128 ≈ 3,4×10³⁸ (usar `ExplainThisNumber`-style copy); **humanos são péssimos a escolher aleatório** — "escolhe tu as palavras" é carteira comprometida; CSPRNG explicado em PT comum. |
| `metodos` | Métodos de criação | (a) wallet de software — CSPRNG do SO, conveniente, exposto a malware; (b) hardware wallet — gerada offline no dispositivo, recomendado para montantes sérios; (c) dados + wordlist offline (BIP-39 manual, air-gapped) — máximo controlo, máximo cuidado; (d) moedas — equivalente lento. Nunca: sites "gera a tua seed", apps desconhecidas. |
| `guardar` | Guardar | Papel vs aço; redundância geográfica; passphrase BIP-39 ("25.ª palavra") — poder real (negação plausível, protecção contra roubo físico) **e** risco real (perder a passphrase = perder tudo); SLIP-39/Shamir; multisig para montantes maiores. |
| `nunca` | O que nunca fazer | Escrever em sites/"validadores"/formulários; foto, cloud, email, chat; DMs de "suporte" (nenhum suporte legítimo pede a seed); malware de clipboard; *address poisoning* (endereços parecidos no histórico); aprovações de tokens como vector. |
| `recuperacao` | Testar e herdar | Recovery drill num dispositivo de ensaio **antes** de depositar a sério; plano de sucessão documentado (quem, como, sem escrever a seed no testamento). |

Cada secção com `howTo` accionável (3–5 passos), ≥1 `example` prático,
`sources` reais e `uncertainty` onde a prática evolui.

**Fontes (verificar URL na escrita — regra: só links confirmados):**
- BIP-39 spec — `github.com/bitcoin/bips/blob/master/bip-0039.mediawiki`
- BIP-32 (HD wallets) — mesmo repo
- SLIP-39 (Shamir) — `github.com/satoshilabs/slips/blob/master/slip-0039.md`
- Ferramenta offline de referência (Ian Coleman BIP-39) — mencionar como
  "para uso real, offline", com aviso
- CMVM — alertas de fraude a investidores
- Folheto AT já linkado em `portugal.ts` (reuso na secção fiscal, se tocar)

**Tom:** mesmo da faixa Portugal — orientação, não aconselhamento; PT-PT;
gémeos em PT comum na linha (P3); sem promessas ("100% seguro" não existe —
diz-se o que cada método troca).

---

## 3. Componente — `src/components/desk/SegurancaDesk.tsx`

Clone estrutural de `PortugalDesk.tsx` (mesmo markup/tokens; `"use client"`,
`useLocale`/`useTranslations("seguranca")`). Diferença: bloco do Instrumento
de Entropia (§4) renderizado como secção própria no fim das secções — ou
intercalado depois de `entropia`/`metodos` (decisão de montagem; começar no
fim, mais simples).

`ContextoDesk.tsx`: montar dentro de
`<ExpertiseGate section="contextoSeguranca">` entre o bloco Atlas e o gate
`contextoPortugal`.

---

## 4. Instrumento de Entropia — só demonstração

**O que é:** componente client-side que torna o pipeline BIP-39 visível —
entropia → bits → checksum → grupos de 11 bits → índice → palavra.

**Fontes de entropia na UI:**
- **Vector de teste oficial BIP-39** (default): entropia a zeros →
  `abandon … about`. Determinístico, verificável, **seguro por definição**
  (está publicado).
- **Dados físicos**: o utilizador lança dados em casa e digita os resultados;
  a UI mostra bits a acumular (~2,58 bits/lançamento → ~50 lançamentos para
  128 bits).
- **Moedas**: 1 bit por lançamento.
- **`crypto.getRandomValues`**: mostra o CSPRNG do browser a trabalhar.

**Aviso permanente na UI (i18n):** *"Demonstração. Uma seed gerada num
browser ligado à internet não deve guardar fundos reais — para isso: hardware
wallet ou método offline. Nada sai do teu navegador."* Sem botão "usar esta
seed". Estado não persistido; botão "limpar" zera tudo.

**Ficheiros:**
- `src/lib/seguranca/wordlist-en.ts` — wordlist BIP-39 inglesa (2048 palavras,
  ~16 KB; necessária para mapear índice→palavra).
- `src/lib/seguranca/entropy.ts` — funções puras: `diceToBits`, `coinsToBits`,
  `split11`, `indicesFromBits`; checksum SHA-256 via Web Crypto (async).
- `src/lib/seguranca/entropy.test.ts` — vectores oficiais BIP-39 (128 e 256
  bits). **Acrescentar ao script `test:unit` do `package.json`** (a lista é
  explícita).
- `src/components/seguranca/EntropyInstrument.tsx` — `"use client"`, sem
  deps novas (Web Crypto basta; SHA-256 é nativo).

---

## 5. Atlas — conceitos novos

Entradas `AtlasConcept` em `src/lib/content/atlas.ts`, `relatedSlugs` a ligar
a `custodia` e entre si. Corpos no estilo actual (1 parágrafo denso).

| slug | level | nota |
|------|-------|------|
| `seed-phrase` | beginner | **Tem de aparecer na tira Essencial** — o aviso universal. |
| `chave-privada` | beginner | seed phrase ≠ private key; relação árvore. |
| `entropia` | intermediate | aponta para o instrumento. |
| `bip39` | intermediate | o padrão por trás das palavras. |
| `passphrase` | intermediate | 25.ª palavra: poder + risco. |
| `hardware-wallet` | beginner | porquê gerar offline. |
| `multisig` | intermediate | m-de-n; não é para todos. |
| `phishing` | beginner | suporte falso, sites clone, "validadores". |
| `aprovacoes` | intermediate | token allowances — vector silencioso. |
| `address-poisoning` | beginner | endereços parecidos no histórico. |

(Escopo mínimo se quiseres menos: `seed-phrase`, `hardware-wallet`,
`phishing`, `address-poisoning`.)

---

## 6. i18n e gate

- `messages/pt.json` + `en.json`: namespace `seguranca` espelhando `portugal`
  (`title`, `subtitle`, ids de secção, `howTo`, `examples`, `sources`,
  `uncertainty`, `reviewedAt`, `asOf`, `links`, `orientationBadge`) +
  `entropy.*` para o instrumento (labels de fontes, aviso, limpar).
- `src/lib/expertise.ts`: `"contextoSeguranca"` em `DensitySection` + regra
  `{ min: "operator" }` (decisão §1).
- PT-PT não PT-BR: "actualizar", "guardar", "frase de recuperação" quando
  mais claro que "seed phrase" — manter o termo técnico + gémeo na linha (P3).

---

## 7. Ordem de execução

1. `seguranca.ts` (conteúdo completo, fontes verificadas)
2. `SegurancaDesk.tsx` + mount em `ContextoDesk` + `DensitySection` + i18n
3. Conceitos Atlas (§5)
4. `entropy.ts` + wordlist + teste com vectores oficiais
5. `EntropyInstrument.tsx` + integração na faixa
6. Gates: `lint` → `typecheck` → `build` → `test:unit` → `test:e2e`
   (verificar se `e8-audit.spec.ts` mede `/contexto` e ajustar alvo se a faixa
   mexer nas métricas)

**Antes de código (AGENTS.md):** ler `node_modules/next/dist/docs/` —
provável tocar: metadata de página (não precisa, a faixa não é rota própria),
client components (padrão já usado), nada estrutural.

---

## 8. Futuro já preparado

- **Vídeos:** schema aceita depois `media?: { kind: "video"; url; labelPt/En }[]`
  por secção — adicionar campo opcional quando houver conteúdo, sem refactor.
- **Quiz:** reusar o padrão `CaseFile.quiz` num "consegues detectar o
  phishing?" — fase 2.
- **Se crescer** (guias por perfil, simulador de phishing, checklists
  interactivos): promover a faixa a destino `/aprender` ou `/seguranca`.
  Até lá, não.

---

## 9. Riscos / honestidade

- **Padrão-scam:** "gera a tua seed aqui" é literalmente um vector de roubo.
  O instrumento nunca pode parecer uma ferramenta de produção — aviso fixo,
  default = vector de teste publicado, zero persistência. Para uso real a copy
  aponta para hardware wallet / ferramenta offline.
- **Copy sem promessas:** "isto é 100% seguro" está proibido; cada método diz
  o que troca (conveniência vs exposição).
- **Fontes reais ou nada:** cada `sources[]` verificado na escrita; sem link
  confirmado, a secção entra sem ele — nunca URL inventado.
- **Não é aconselhamento:** mesmo disclaimer pattern da faixa Portugal.
