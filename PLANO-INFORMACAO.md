# CLAREZA — Plano estrutural completo

> Análise total do produto, não da página inicial. Decide **o que existe, onde
> vive, quem o vê e o que se corta** — para parar de remendar.
>
> Data: 2026-07-25 · Estado: plano · Execução em `ESTRUTURA-PROMPTS.md`

---

## 1. Levantamento medido (todas as páginas)

Auditoria automática de todas as rotas (`/pt`, nível Operador, 1440px):

| Rota | Caracteres | % no ecrã | Secções | SVGs | Tabelas |
|---|---|---|---|---|---|
| **/** (Agora) | **6 820** | **105** | 15 | 21 | 3 |
| /mundo | 1 445 | 24 | 5 | 1 | 0 |
| /fluxos | 3 713 | 10 | 11 | 3 | 2 |
| /contexto | 5 613 | 2 | 7 | **0** | 0 |
| /estilo | 1 438 | 2 | 4 | 0 | 0 |

**Aliases** (16 rotas antigas que servem as 4 novas):
`/sectores`, `/memes`, `/caso`, `/mercado` → **/mundo** ·
`/liquidez`, `/sentimento`, `/defi`, `/yields`, `/etf` → **/fluxos** ·
`/lab`, `/atlas`, `/ciclo`, `/portugal` → **/contexto** ·
`/graficos` → **/instrumento**
(E7: redirects permanentes 308 em `next.config.ts`.)


### Os cinco problemas estruturais

**1. A entrada faz o trabalho de toda a gente.**
A página inicial tem 105 percentagens; os três destinos **somados** têm 36.
Tem 21 SVGs; os destinos somados têm 4. A entrada não é uma porta — é o produto
inteiro empilhado, e os destinos são salas vazias.

**2. A diferenciação está esfomeada.**
`/mundo` aloja o **Caso & Efeito** — a única coisa que nenhum concorrente faz — e
é a página **mais pobre do produto**: 1 445 caracteres, 1 SVG. O que nos torna
únicos ocupa 20% do espaço do que nos torna genéricos.

**3. `/contexto` é uma parede de texto.**
5 613 caracteres, **zero visualizações**, 2 percentagens. É a página de aprender e
não tem uma única imagem. Ninguém lê isto.

**4. Organização por fonte de dados, não por pergunta.**
Derivados, DeFi, ETF, DEX, yields são o desenho das **APIs que consumimos**.
Ninguém acorda a perguntar "qual é o funding rate?".

**5. 16 URLs duplicados.**
Conteúdo idêntico servido em 4-5 endereços diferentes. Mau para manutenção, mau
para SEO (conteúdo duplicado), e sinal de que a consolidação ficou a meio.

---

## 2. Os quatro princípios

**P1 — Uma pergunta por ecrã.** Se uma vista responde a três perguntas, são três
vistas.

**P2 — Regra do "e depois?".** Todo o número tem de mudar o que o leitor pensa ou
faz. Se não muda, sai da entrada. Sem excepção — nem para dados de que gostamos.

**P3 — Nenhum termo técnico sozinho.** Todo o jargão traz o gémeo em português
comum **na linha**, não em tooltip.

**P4 — Revelação progressiva.** O detalhe não desaparece: muda de nível. O Dial
de Expertise passa a ser a espinha da arquitectura, não um enfeite.

---

## 3. Estrutura-alvo: 5 destinos + 1 futuro

| Destino | Pergunta que responde | Hoje | Passa a ter |
|---|---|---|---|
| **AGORA** `/` | *Está a acontecer alguma coisa?* | tudo (6 820) | Nível 1 + 2. **Perde ~60%** |
| **MUNDO** `/mundo` | *O que se mexeu e porquê?* | 1 445 | **Cresce 3×**. É a joia. |
| **FLUXOS** `/fluxos` | *O dinheiro entra ou sai?* | 3 713 | Reorganizado por pergunta |
| **CONTEXTO** `/contexto` | *Como funciona? E em Portugal?* | parede de texto | **Ganha visualização** |
| **INSTRUMENTO** `/instrumento` | *Quero ver tudo* | — (está na entrada) | **Novo.** Recebe o excesso |
| CARTEIRA `/carteira` | *Quanto tenho?* | "em breve" | Futuro (ver VISION) |

**O movimento central:** o Nível 3 sai da entrada e passa a ter casa própria em
`/instrumento`. A entrada fica respirável sem perder nada — o profissional tem
tudo a um clique, e o Dial em `Analista` pode levá-lo lá por omissão.

---

## 4. Os três níveis (dentro de AGORA)

### Nível 1 — A RESPOSTA (sem scroll)
- **Uma frase grande** em português comum:
  *"Mercado tenso. O dinheiro está a sair dos ETF e a alavancagem está alta."*
- **Três números, não 154** — leituras compostas, não métricas cruas:
  - **DIRECÇÃO** (preço + amplitude)
  - **RISCO** (alavancagem + liquidações + funding)
  - **DINHEIRO** (ETF + stablecoins)
- **Uma coisa a vigiar hoje.**
- **O Pulso** como imagem do estado (já feito).

### Nível 2 — A EVIDÊNCIA (um scroll)
4–6 cartões, **um sinal por cartão**, título em forma de pergunta:
1. O dinheiro está a entrar ou a sair?
2. Há risco de cascata?
3. A subida/queda é ampla ou de meia dúzia?
4. O que se mexeu, e porquê? *(→ leva a MUNDO)*
5. Onde está o dinheiro a rodar? *(sectores)*
6. Há algo partido? *(peg, taxas)*

### Nível 3 — O INSTRUMENTO (`/instrumento`)
Praticamente a board de hoje: tape completa, grelha de réguas, derivados por
activo, gráfico com timeframes, yields, DEX, trending.

**Dial:** `Essencial` = N1 · `Operador` = N1+N2 · `Analista` = N1+N2 + atalho
directo ao Instrumento.

---

## 5. O que sai da entrada (lista de cortes)

| Elemento | Vai para | Porquê |
|---|---|---|
| Tendências retail | Instrumento | O próprio cartão diz *"Atenção ≠ liquidez"*. Se admitimos que não é sinal, não pode estar na entrada. |
| Yields / APY | Página própria | Não responde a "o que se passa". É outra tarefa: procurar rendimento. |
| Actividade DEX | Mundo (nicho) | Interessa a quem caça memecoins, não a quem quer orientação. |
| Grelha de 8 réguas | Instrumento | 21 réguas num ecrã anulam-se. No N1-2 a régua acompanha *o número que importa*. |
| Preço BTC (3×) | 1× | Aparece na tape, na faixa e no ritual. Escolher um sítio. |
| Stress (4×) | 1× | Idem: tape, Pulso, ritual, painel de derivados. |
| Tape de 10 métricas | 4 na entrada | BTC, ETH + as duas leituras compostas. O resto no Instrumento. |
| Spot vs Alavancagem | Fluxos | É exactamente a pergunta de FLUXOS. Está no sítio errado. |

**Nada é apagado. Tudo muda de nível.**

---

## 6. A camada de tradução (serve normais *e* profissionais)

| Hoje | Passa a ser |
|---|---|
| `Funding 0.0083%` | *"Custo de manter posições alavancadas: normal"* + número pequeno |
| `p71 · 90d` | *"mais alto que 71% dos últimos 90 dias"* |
| `OI $6.94B` | *"$6,94 mil M em posições abertas — o combustível de uma cascata"* |
| `L/S 1.85` | *"quase 2× mais apostas na subida do que na descida"* |
| `TVL $75.4B` | *"$75,4 mil M depositados em aplicações on-chain"* |
| `Amplitude 28%` | *"só 28 de cada 100 moedas grandes estão a subir"* |

**O profissional lê o número e ignora a frase; o principiante lê a frase e ignora
o número.** Servem-se os dois sem construir dois produtos.

---

## 7. Critério permanente (o travão)

Antes de acrescentar seja o que for a AGORA, tem de passar nos cinco:

1. Responde a uma das quatro perguntas do leitor? Se não → Instrumento.
2. Muda o que o leitor pensa ou faz? Se não → fora.
3. Já está dito noutro sítio? Se sim → escolher um.
4. Um principiante percebe em 5 segundos? Se não → falta tradução (P3).
5. Temos o dado com qualidade? Se não → **omitir**. Nunca estimar e apresentar
   como facto. *(Regra herdada, não negociável.)*

---

## 8. Ordem de execução

1. **Leituras compostas** (Direcção / Risco / Dinheiro) — o trabalho intelectual
   central: ~20 métricas → 3 leituras honestas, pesos documentados.
2. **Criar `/instrumento`** e mover-lhe o Nível 3.
3. **Reconstruir AGORA** como N1 + N2.
4. **Camada de tradução** em todo o jargão.
5. **Engordar MUNDO** — promover o Caso & Efeito à peça central.
6. **Dar visualização a CONTEXTO.**
7. **Resolver os 16 aliases** (canónicos + redirects permanentes).
8. Só depois: mais polimento visual.

---

## 9. Riscos

**O profissional pode sentir perda ao abrir.** Mitigação: o Dial guarda a
preferência localmente — quem escolhe `Analista` entra sempre no Instrumento. A
simplificação é o **padrão**, não uma imposição.

**A tentação de reencher.** Daqui a três meses vai haver um painel "que também é
útil". O §7 existe para travar isso.

**Não regredir na honestidade.** Nenhuma leitura composta pode esconder que um
dos seus ingredientes falhou. Se falta um sinal, a leitura di-lo.
