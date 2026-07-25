# CLAREZA — Visão do módulo de portfólio e fiscalidade crypto (PT)

> **Natureza deste documento:** planeamento e visão de produto. **NÃO é aconselhamento
> fiscal nem jurídico.** Todas as referências a leis (MiCA, CMVM/BdP, regime de
> mais-valias, IRS) são orientação de alto nível para desenho de produto e **têm de ser
> validadas com um TOC/contabilista certificado e com a doutrina atual da Autoridade
> Tributária antes de qualquer implementação.** O regime fiscal cripto português mudou
> em 2023 e pode ter sido alterado em 2024/2025/2026 — nada aqui deve ser tratado como
> definitivo.
>
> Data de consolidação: 2026-07-24 · Estado: visão, não iniciada · Depende de: desk de
> mercado estável + validação por profissional.

---

## 1. A tese numa frase

O utilizador de crypto português não tem um sítio de confiança para *entender* a lei,
*ver* como se aplica à sua própria carteira, *preparar* o que tem de declarar e
*entregar* isso a um profissional. Hoje só há influencers no X a explicar mal e a vender
serviços. A CLAREZA transforma isso numa plataforma: educação + ferramentas + ponte para
o profissional.

Isto é um **segundo produto**, complementar ao desk de mercado que já existe. Não é uma
feature — tem outro modelo de confiança, outro modelo de dados e outro perfil de risco.
Os dois alimentam-se: o desk traz o público (o utilizador de crypto), o módulo fiscal
dá retenção e receita.

---

## 2. O ecossistema (as seis camadas)

1. **Desk de mercado** — *presente.* Leitura rápida do mercado. É o topo do funil: traz
   os utilizadores de crypto.
2. **Camada legal/educativa** — *a ponte, pode começar já.* Explicar MiCA/CMVM/fiscalidade,
   como se aplicam, com exemplos práticos e "como proceder". Liga o presente ao futuro e
   é parte do canal de aquisição (é como o utilizador te encontra e porque confia).
3. **Portfólio + mais-valias (B2C)** — *futuro.* Colar endereço → ver saldos, valor,
   lucros/perdas, e sinalizar posições com +365 dias para a isenção.
4. **Ferramentas para gabinetes (B2B)** — *futuro.* A camada de tradução
   blockchain → linguagem de contabilista, com gestão de vários clientes.
5. **A cola (go-to-market)** — bottom-up: o utilizador leva a ferramenta ao contabilista.
6. **A disciplina transversal** — nunca inventar dados; tudo datado, com fonte e revisto;
   disclaimer sempre presente; execução final do profissional.

---

## 3. Os dois segmentos

### B2C — a pessoa comum / individual
- **Job:** "tenho crypto, não percebo a lei, e não sei o que declarar."
- Cola um ou mais endereços públicos (**nunca** chaves privadas — nem são precisas).
- Vê portfólio, lucros/perdas e o rascunho do que tem de declarar.
- **Estrategicamente essencial** não por si só, mas porque é o canal de aquisição do B2B.

### B2B — gabinetes de contabilidade
- **Job:** "recebi um cliente com crypto e não sei ler blockchains."
- Insight central: os gabinetes PT estão na penumbra, acham que "crypto são aliens", e um
  block explorer é ilegível para quem não é do meio. **Dor aguda, específica, sem solução
  no mercado.**
- **Pode ser o negócio mais forte dos dois:** o comprador tem orçamento (SaaS recorrente
  vs consumidor uma vez por ano), e a responsabilidade resolve-se melhor (o TOC é o
  profissional que revê tudo — contorna a maior parte do risco de direito do consumidor
  B2C).
- **Valor central = a camada de tradução:** converter atividade on-chain em linguagem de
  contabilista — *"esta transação = conversão para fiat = realização tributável; esta =
  transferência entre carteiras do próprio = não é evento; esta = recompensa de staking =
  Categoria E"* — com link à fonte para o profissional verificar.

---

## 4. Go-to-market: bottom-up

O utilizador de crypto é o **campeão** que leva a ferramenta ao gabinete (o mesmo padrão
do Figma/Notion a entrarem nas empresas de baixo para cima). Isto **é a resposta** ao
ceticismo do gabinete, não um extra: vendas a frio a um gabinete que "não sabe que tem o
problema" não funcionam; um cliente de confiança a pedir funciona.

**Consequência de desenho:** o relatório que o utilizador individual gera faz **dois
trabalhos** — é a entrega ao contabilista *e* o argumento de venda ao gabinete. Portanto
tem de ser legível para um contabilista (sem jargão de blockchain), profissional, e
trazer um gancho para a versão profissional. O relatório do consumidor **é** a geração de
leads B2B.

---

## 5. Modelo de dados e privacidade

**Regra base: zero armazenamento no servidor.** O utilizador cola o endereço, a plataforma
mostra, nada é guardado **nos nossos servidores**.

**O que "zero armazenamento" significa exatamente (evitar a falsa contradição):** NÓS (o
servidor) não guardamos nada. Não quer dizer que os dados desaparecem — quer dizer que os
dados que persistem vivem **do lado do utilizador**, na máquina dele, sob controlo dele.
Nós nunca lhes tocamos.

Dois trabalhos, duas respostas:
- **Ver o portfólio (Fase 1) — efémero.** Colar endereço → navegador busca saldos/preços
  agora → mostra → fechar separador → desaparece. É só uma fotografia do momento; não
  precisa de persistir em lado nenhum.
- **Calcular mais-valias (Fase 2) — precisa de histórico.** O histórico tem de viver
  algures durante o cálculo. **Local-first (a resposta):** o cálculo acontece no navegador
  do utilizador, e o histórico fica em cache **no próprio navegador dele** (IndexedDB) ou
  num **ficheiro encriptado que ele descarrega para o disco**. Primeira visita: busca o
  histórico → calcula localmente → guarda snapshot (opcional). Visita seguinte: carrega o
  snapshot local → busca só o *delta* de transações novas → recalcula. Rápido, e o servidor
  nunca viu nada. É o modelo do rotki. (Alternativa mais simples e mais lenta: efémero puro
  — re-buscar tudo a cada visita; rebenta rate limits.)

**Consequência de arquitetura:** obriga a **computação no cliente** (no navegador), não no
servidor — se o servidor calculasse, os dados transitavam por lá (o RGPD e um utilizador
consciente importam-se com o trânsito, não só com o armazenamento). O servidor reduz-se a:
(1) alojamento estático, (2) **dados de preço** — que são **públicos**, não privados, e
portanto podem ser cacheados à vontade — e (3) talvez um proxy fininho e **sem logs** só
para chains que bloqueiam chamadas diretas do navegador (CORS). Separação-chave:
**endereço + histórico** do utilizador = dado sensível que fica **local**; **preço
histórico** = dado público de mercado servido normalmente. Nota honesta: mesmo um proxy
sem logs é um ponto onde o dado *passa* (não é guardado, mas passa) — o mais limpo é o
navegador chamar as APIs de chain diretamente onde o CORS permitir.

**A UI tem de explicar onde vivem os dados** ("fica no teu navegador / no teu disco, nunca
nos nossos servidores") — senão "zero armazenamento" parece uma contradição.

**Tensão B2B por resolver:** zero armazenamento serve o consumidor, mas **não** o fluxo de
um gabinete — uma firma com muitos clientes precisa de persistência, registos, comparação
ano a ano. Saída que preserva a filosofia: **local-first do lado da firma** ("rotki para
contabilistas") — a firma guarda os dados dela na infraestrutura dela; a plataforma
continua sem guardar nem ver.

**Um endereço ≠ retrato fiscal completo.** Para mais-valias corretas precisas de **todos**
os endereços do utilizador; transferências entre carteiras próprias **não são
realizações** e, com um só endereço à vista, parecem vendas. A UI da parte fiscal tem de
permitir juntar vários endereços e marcar transferências internas.

---

## 6. Modelo de responsabilidade

- A plataforma **ajuda e simplifica** — vai até ao fim (calcular, sinalizar +365 dias,
  preparar rascunho do Anexo G/G1). **Não corta features** em nome do "deixa ao
  profissional".
- **Nunca submete** e **nunca é responsável** pela declaração entregue ao Fisco.
- Revisão por profissional é **recomendação, sempre disponível, nunca obrigatória pela
  ferramenta**. Se o utilizador faz sozinho, assume o risco.
- **Disclaimer geral a todos os utilizadores:** *"esta informação deve ser sempre entregue
  e revista por um profissional."* Mostrado sempre — coerente com o zero-armazenamento (é
  propriedade do produto, não consentimento guardado por utilizador). Sugestão de
  implementação: um aceite ativo no cliente ("compreendi") é mais forte que um banner
  passivo e continua a não guardar nada.
- **Reparo honesto (não decisão, aviso):** em B2C na UE/PT, o direito do consumidor pode
  invalidar cláusulas que excluam totalmente a responsabilidade — um disclaimer **reduz**,
  não zera. A proteção real é **técnica**: cálculo correto, auditável, rastreável à fonte,
  e o "não consigo determinar isto, confirma manualmente" honesto. A posição B2B reforça
  isto (ferramenta para profissional vs aconselhamento a leigo).

---

## 7. A camada legal/educativa (a ponte — pode começar já)

**Já existe uma semente no código** (não é do zero): `src/lib/content/portugal.ts` +
`src/components/desk/PortugalDesk.tsx` — cartões de MiCA, CMVM, custódia e fiscalidade,
com links oficiais (CMVM, Banco de Portugal, EUR-Lex).

**Mas é fino:** 4 cartões curtos, nível de orientação, sem "como se aplica", sem exemplos,
sem passo-a-passo. O índice existe; falta o livro.

- **Pode ser construída agora, em paralelo com as correções do desk, com risco baixo** —
  é conteúdo educativo, não precisa de dados de carteira nem do motor fiscal validado.
- **Precisão importa:** MiCA (regulação de mercado/CASPs na UE) ≠ CMVM/BdP (supervisão
  nacional) ≠ IRS (fiscalidade). São regimes distintos; o conteúdo atual já os separa bem.
  Parte do valor é **destrinçar qual se aplica** à situação do utilizador.
- **Mesma disciplina de sempre:** datado, com fonte, versionado, revisto por TOC/jurista.
  O cartão de fiscalidade já diz "orientação, não aconselhamento" (bom); mas o de MiCA
  afirma "em 2026 o regime está operacional" sem data nem fonte — corrigir. Conteúdo legal
  errado ou desatualizado envenena a confiança em tudo o resto.

---

## 8. A realidade do modelo fiscal PT (o ponto crítico do motor)

**Aviso: validar tudo isto com um TOC e com a doutrina atual da AT. Pode ter mudado.**

Pelo regime introduzido em 2023 (Lei 24-D/2022, OE 2023), tal como o entendo:

- **Cripto-para-cripto NÃO é evento tributável em Portugal.** Trocar BTC por ETH não
  realiza mais-valia; o valor de aquisição transporta-se (rollover). Só a **conversão para
  fiat (ou bens/serviços)** realiza. **Isto é o oposto do modelo americano**, onde cada
  swap é um evento tributável.
- Isenção para detenção **≥365 dias** — exceto cripto que sejam "valores mobiliários"
  (security-like), sempre tributáveis.
- Categorias: **G** (mais-valias <365 dias, ~28%), **E** (rendimentos passivos tipo
  staking), **B** (atividade profissional/mining). **Anexo G** (tributável) / **G1**
  (isento a reportar) / **J** (contas/exchanges estrangeiras).

**Consequência para a escolha de motor:** um motor US-FIFO (ex.: RP2) trata *cada swap*
como realização — para um utilizador português isso **inflaciona dramaticamente** os
eventos tributáveis e conta mal o período de detenção. A mecânica de matching e cost-basis
aproveita-se; o **modelo de realização** (a alma da correção fiscal em PT) tem de ser
construído de raiz. Estimar a poupança de reaproveitamento em **~10–20%, não 30–40%.**

---

## 9. Open source e licenças

| Projeto | Licença | Uso |
|---|---|---|
| **rotki** | AGPLv3 | Copyleft — uso em rede dispara obrigação de publicar código; existe licença comercial. **Usar só como inspiração de arquitetura (local-first encriptado), não copiar código.** |
| **RP2** (eprbell/rp2) | Apache 2.0 | Permissiva. Motor de cálculo fiscal, **US-centric, em Python.** Aproveitar mecânica FIFO/cost-basis, **não** o modelo de realização. |
| **DaLI** (eprbell/dali-rp2) | Apache 2.0 | Carregador de dados multi-fonte que alimenta o RP2. Padrão para a ingestão multi-chain. |

**Verificar o ficheiro LICENSE no commit atual antes de comprometer arquitetura** —
licenças mudam. Nota: funcionalidade não é protegida por copyright, *código/expressão* é;
podes reimplementar conceitos, não copiar código AGPL.

**Mismatch de stack:** RP2/DaLI são Python; a CLAREZA é Next.js/TypeScript. "Usar como
motor" significa ou correr um serviço Python ao lado, ou reescrever em TS. Como o modelo
de realização PT tem de ser escrito à mão de qualquer forma, **reimplementar o motor em
TypeScript pode acabar por ser mais limpo** do que arrastar um runtime Python para
reaproveitar ~15%. Se rotki/RP2 não servirem, procurar outros OSS.

---

## 10. Roteiro faseado

Desenhado para limitar responsabilidade cedo e só aumentar exposição quando a correção
estiver provada.

- **Decisão de topo (antes de tudo):** local-first (recomendado) confirmado; falta decidir
  a **porta de entrada B2B vs B2C** — provavelmente B2C-como-funil-do-B2B (ver §4).
- **Fase 0 — Validação (sem código).** Sentar com um TOC e escrever o *modelo de
  realização português* num documento. É a especificação do motor. Sem ele, código é
  adivinhação.
- **Camada legal (paralela, já):** aprofundar a Portugal lane — explicações, exemplos,
  "como proceder" — datada e com fonte. Baixo risco, alto valor de confiança/SEO.
- **Fase 1 — Vista de portfólio read-only, stateless, multi-chain.** Colar endereço → ver
  saldos e valor, com o "não guardamos nada" explícito. Útil por si só, sem risco legal.
  O problema difícil aqui é o **preço histórico no timestamp de cada transação** e
  distinguir transações reais de spam. Começar por 2–3 chains (Ethereum, Solana, uma L2),
  não "todas".
- **Fase 2 — Motor fiscal PT.** Implementar o modelo da Fase 0. Output: mais-valias
  tributáveis, ganhos isentos para o G1, e o **identificador de posições que cruzam o ano**
  (a feature que o utilizador sente como mágica — a melhor hook de marketing).
- **Fase 3 — Assistente de declaração.** Gerar rascunho do Anexo G/G1/J para revisão.
  **Não** auto-submeter à AT.
- **Fase 4 — B2B + camadas de valor.** Workspace multi-cliente para gabinetes (local-first
  do lado da firma), a camada de tradução, notícias legais, alertas ("faltam X dias para
  esta posição ficar isenta").

---

## 11. Regras não-negociáveis

1. **Nunca apresentar dados inventados como reais.** Em fiscalidade, "não consigo
   determinar o valor de aquisição, confirma manualmente" é a resposta correta; um número
   bonito e errado é passivo legal. (É a mesma falha do painel de liquidações fabricado no
   desk.)
2. **Tudo datado, com fonte, versionado** — dados e conteúdo legal.
3. **Disclaimer sempre presente**; execução final do profissional sempre recomendada.
4. **Zero armazenamento no servidor** (B2C); local-first do lado da firma (B2B).
5. **Validação por TOC/jurista** antes de qualquer motor fiscal ou conteúdo legal
   publicado.

---

## 12. Decisões em aberto

- Porta de entrada: B2C-como-funil vs B2B-first (inclinação: B2C-como-funil).
- Motor: reaproveitar RP2 (Python, serviço ao lado) vs reimplementar em TypeScript
  (inclinação: TS-nativo, dada a necessidade de reescrever o modelo de realização).
- Chains de arranque da Fase 1.
- Acesso a um TOC para a Fase 0 e para a revisão do conteúdo legal.

---

## 13. O que já existe hoje no código (ponto de partida)

- `src/lib/content/portugal.ts` + `src/components/desk/PortugalDesk.tsx` — a semente da
  camada legal (§7).
- `src/lib/content/atlas.ts` — currículo de conceitos (base para exemplos educativos).
- O desk de mercado inteiro — o topo do funil que traz o público.

Tudo o resto (portfólio, motor fiscal, B2B) é a construir, pela ordem do §10.

---

## Apêndice A — Panorama OSS e fornecedores de dados

> **Ideia-chave:** o trabalho não está no motor fiscal (parte pequena, PT-específica, escrita
> à mão de qualquer forma) — está em **ler as chains**. Organiza a decisão por camada. Todas
> as licenças abaixo são **a confirmar no LICENSE do commit atual** antes de comprometer nada.

### Camada 1 — Motor fiscal (reuso ~10–20%, só estrutura)
Todos são de outra jurisdição; nenhum modela a realização portuguesa (§8). Servem como
referência de arquitetura, não de lógica.

| Projeto | Licença (confirmar) | Nota |
|---|---|---|
| rotki | AGPLv3 | O mais maduro. Inspiração de arquitetura, **não copiar código**. |
| RP2 / DaLI (eprbell) | Apache 2.0 | US (form 8949), Python. Mecânica FIFO/cost-basis. |
| axelbase/crypto-gains-calculator | confirmar | **Client-side puro no browser** — padrão local-first útil. US, FIFO. |
| CoinTaxman | confirmar | Focado na Alemanha — exemplo de motor adaptado a país europeu. |
| staketaxcsv | confirmar | Exporta transações de staking para CSV (staking = Cat E em PT). |

### Camada 2 — Leitura das chains (**onde está a poupança real, ~30–40%**)
Não clonar um explorer. Usar **APIs de dados que já devolvem o histórico descodificado** —
substituem "um parser por chain" por "uma chamada de API".

| Fornecedor | Cobertura | Nota |
|---|---|---|
| Covalent / GoldRush | Muitas chains EVM | Histórico + saldos descodificados. Verificar tier gratuito/preço. |
| Moralis | Multi-chain EVM | Wallet history API. |
| Alchemy | EVM (forte) | `getAssetTransfers` e enhanced APIs. |
| Helius | Solana | Transações enriquecidas/etiquetadas. |
| Família Etherscan | Por chain | Cru e barato. |
| Blockscout | Self-host (OSS) | Correr o próprio explorer — **mais** trabalho, não menos. |
| ethers.js / viem / @solana/web3.js | MIT | Acesso cru à chain (quando se quer RPC direto). |

**Atenção — categoria errada:** os "wallet SDKs" (multichain-crypto-wallet, OKX js-wallet-sdk,
ChainGate, etc.) são para **criar/assinar** transações. Não servem — precisamos de **leitura
read-only**, que é o mundo das APIs de dados acima.

### Camada 3 — Preços históricos
Dado **público** (não privado) — servir e cachear normalmente no servidor.
CoinGecko (já em uso), CryptoCompare, etc.

### Tensão de privacidade (decisão de produto)
Se o browser chama Covalent/Moralis com o endereço do utilizador, **esse fornecedor vê o
endereço** — não passa por nós (mantém-se o "zero armazenamento"), mas é um terceiro que vê o
que foi consultado. Para um produto privacy-first:
- **Divulgar** claramente que se usam fornecedores de dados terceiros; e/ou
- Oferecer um **modo self-RPC** (o utilizador liga o próprio nó/RPC) para o maximalista de
  privacidade — é o que o rotki faz. Convença (API pronta) vs privacidade máxima (RPC próprio):
  dar as duas.

### O problema genuinamente difícil
**Classificar transações** (swap? LP? bridge? transferência interna? recompensa de staking?)
é o problema generico onde o rotki investiu anos. As APIs de dados fazem parte; o resto é
lógica própria. Estudar a abordagem de descodificação do rotki como **referência** (não código,
por causa da AGPL). Em PT isto é crítico porque a classificação **transferência interna vs
venda** decide se há realização (§5, §8).

### Sem OSS para reaproveitar
Camada legal/educativa (§7): conteúdo original + validação por TOC/jurista. Não há atalho.
