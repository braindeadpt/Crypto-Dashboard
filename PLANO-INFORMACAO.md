# CLAREZA — Plano de reestruturação da informação

> O design encontrou o caminho. A informação ainda não. Este documento decide
> **o que se mostra, a quem, e por que ordem** — e, sobretudo, **o que se corta**.
>
> Data: 2026-07-25 · Estado: plano, por executar

---

## 1. O diagnóstico, medido

Auditoria da página inicial (`/pt`, nível Operador, 1440px):

| Métrica | Valor |
|---|---|
| Percentagens no ecrã | **105** |
| Valores em dólares | 28 |
| Réguas de percentil | 21 |
| Secções | 15 |
| Links internos | 21 |
| Preço do BTC repetido | 3× |
| "OI" | 12× · "percentil" 15× · "ETF" 11× · "90d" 10× · "TVL" 9× |

**~154 números num só ecrã.** Um utilizador experiente perde-se; um utilizador
comum nem tenta. O problema não é a quantidade de dados que temos — é não termos
decidido o que merece o ecrã de entrada.

### A causa-raiz

**O produto está organizado por FONTE DE DADOS, não por PERGUNTA.**

As secções de hoje — derivados, DeFi, ETF, DEX, yields, trending — são o desenho
das APIs que consumimos. Ninguém acorda a perguntar "qual é o funding rate?".
As perguntas reais, por ordem:

1. *Está a acontecer alguma coisa que eu deva saber?* — 5 segundos
2. *O quê, e porquê?* — 30 segundos
3. *O que é que isso significa para mim?* — 2 minutos
4. *Quero ver tudo* — 5+ minutos

Enquanto a estrutura não espelhar isto, mais polimento não resolve.

---

## 2. Os quatro princípios

**P1 — Uma pergunta por ecrã.** Cada vista responde a UMA pergunta. Se responde
a três, são três vistas.

**P2 — Regra do "e depois?".** Todo o número tem de mudar o que o leitor pensa ou
faz. Se não muda, sai do ecrã de entrada. Sem excepção — nem para dados de que
gostamos.

**P3 — Nenhum termo técnico sozinho.** Todo o jargão traz o seu gémeo em
português comum, **na linha**, não escondido num tooltip. O número técnico fica
para quem o sabe ler; a frase fica para quem não sabe.

**P4 — Revelação progressiva.** O detalhe não desaparece — muda de sítio. O
Dial de Expertise deixa de ser cosmético e passa a ser a espinha da arquitectura.

---

## 3. A nova estrutura: três níveis

### Nível 1 — A RESPOSTA (é o que se vê ao abrir)

Um ecrã. Sem scroll. Responde a *"está a acontecer alguma coisa?"*.

- **Uma frase grande** — o estado do mercado hoje, em português comum.
  Ex.: *"Mercado tenso. O dinheiro está a sair dos ETF e a alavancagem está alta."*
- **Três números. Não 154.**
  - **Direcção** — para onde vai o preço (BTC + amplitude do mercado numa só leitura)
  - **Risco** — quão frágil está (alavancagem + liquidações numa só leitura)
  - **Dinheiro** — está a entrar ou a sair (ETF + stablecoins numa só leitura)
- **Uma coisa a vigiar hoje** — a única acção de atenção que se justifica.
- **O Pulso** como imagem do estado (já feito, e é a peça partilhável).

Se um utilizador comum só vir isto, já ficou mais informado do que com 8 tabs.

### Nível 2 — A EVIDÊNCIA (um scroll ou um clique)

Responde a *"o quê e porquê?"*. Quatro a seis cartões, **um sinal por cartão**,
cada um com: pergunta em título · resposta em linguagem simples · número · régua.

1. **O dinheiro está a entrar ou a sair?** — ETF spot + oferta de stablecoins
2. **Há risco de cascata?** — alavancagem, funding, liquidações ao vivo
3. **A subida/queda é ampla ou de meia dúzia?** — amplitude
4. **O que se mexeu, e porquê?** — Caso & Efeito (já construído, é o melhor que temos)
5. **Onde está o dinheiro a rodar?** — sectores/narrativas
6. **Há algo partido?** — peg de stablecoins, taxas de rede

### Nível 3 — O INSTRUMENTO (o profissional)

Responde a *"quero ver tudo"*. É praticamente a board de hoje — tape completa,
grelha de réguas, derivados por activo, gráfico com timeframes, yields, DEX.
**Não desaparece. Deixa de ser a porta de entrada.**

O Dial passa a comandar isto de verdade:
`Essencial` = Nível 1 · `Operador` = 1+2 · `Analista` = 1+2+3.

---

## 4. O que sai do ecrã de entrada (e porquê)

Aplicando o P2 sem sentimentalismo:

| Elemento | Decisão | Porquê |
|---|---|---|
| **Tendências retail** | Fora → Nível 3 | O próprio cartão diz "Atenção ≠ liquidez". Se admitimos que não é sinal, não pode estar na entrada. |
| **Yields / APY** | Fora → página própria | Não responde a "o que está a acontecer no mercado". É uma tarefa diferente (procurar rendimento). |
| **Actividade DEX** | Fora → Nível 3 | Nicho. Interessa a quem caça memecoins, não a quem quer orientação. |
| **Grelha de 8 réguas** | Fora → Nível 3 | 21 réguas num ecrã anulam-se. No Nível 1-2, a régua acompanha *o número que importa*, não todos. |
| **Preço BTC (3×)** | 1× | Aparece na tape, na faixa de preço e no ritual. Escolher um sítio. |
| **Stress (4×)** | 1× | Idem: tape, Pulso, ritual, painel de derivados. |
| **Tape de 10 métricas** | 4 no Nível 1 | BTC, ETH, e as duas leituras compostas (risco, dinheiro). O resto no Nível 3. |

**Nada disto é apagado.** Tudo continua a existir — noutro nível ou noutra página.
A diferença é que deixa de competir com o essencial pelo mesmo pixel.

---

## 5. A camada de tradução (o que serve "pessoas normais")

Cada termo técnico ganha um gémeo em português comum. **Na linha, não em tooltip.**

| Hoje | Passa a ser |
|---|---|
| `Funding 0.0083%` | *"Custo de manter posições alavancadas: normal"* (+ número em pequeno) |
| `p71 · 90d` | *"mais alto que 71% dos últimos 90 dias"* |
| `OI $6.94B` | *"$6,94 mil M em posições abertas — o combustível de uma cascata"* |
| `L/S 1.85` | *"há quase 2× mais apostas na subida do que na descida"* |
| `TVL $75.4B` | *"$75,4 mil M depositados em aplicações on-chain"* |
| `Peg watch` | *"stablecoins a valer o que deviam?"* |
| `Amplitude 28%` | *"só 28 de cada 100 moedas grandes estão a subir"* |

Regra: **o profissional lê o número e ignora a frase; o principiante lê a frase e
ignora o número.** Servem-se os dois sem construir dois produtos.

---

## 6. Como escolher o que entra (critério permanente)

Antes de acrescentar seja o que for ao Nível 1 ou 2, tem de passar nos cinco:

1. **Responde a uma das quatro perguntas?** Se não, é Nível 3.
2. **Muda o que o leitor pensa ou faz?** Se não, fora.
3. **Já está dito noutro sítio?** Se sim, escolher um.
4. **Um principiante percebe em 5 segundos?** Se não, falta a tradução (P3).
5. **Temos o dado com qualidade?** Se não, **omitir** — nunca estimar e apresentar
   como facto. (Regra herdada, não negociável.)

---

## 7. Ordem de execução

1. **Definir as três leituras compostas** — Direcção, Risco, Dinheiro. É o
   trabalho intelectual central: transformar ~20 métricas em 3 leituras honestas,
   com pesos documentados. Reaproveita o motor de regime, que já faz isto para o
   stress.
2. **Construir o Nível 1** e pô-lo como entrada.
3. **Camada de tradução** aplicada a todo o jargão (§5).
4. **Reorganizar em Nível 2** — cartões por pergunta, não por fonte.
5. **Mover o resto para Nível 3** e ligar o Dial a sério.
6. **Cortar as duplicações** (§4).
7. Só depois: mais polimento visual.

---

## 8. O risco desta mudança

Ser honesto sobre o que se perde: um utilizador profissional pode sentir que o
produto "ficou mais pobre" ao abrir. Mitigação: o Dial guarda a preferência
localmente — quem escolhe `Analista` uma vez, entra sempre no instrumento
completo. A simplificação é o **padrão**, não uma imposição.

E um aviso: a tentação, daqui a três meses, vai ser voltar a acrescentar painéis
à entrada porque "também é útil". O §6 existe para travar isso.
