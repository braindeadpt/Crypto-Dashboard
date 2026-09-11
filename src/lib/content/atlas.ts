import type { AtlasConcept } from "@/lib/types";

export const ATLAS: AtlasConcept[] = [
  {
    slug: "bitcoin",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Bitcoin",
    titleEn: "Bitcoin",
    summaryPt: "Rede peer-to-peer de dinheiro digital com oferta limitada a 21 milhões.",
    summaryEn: "Peer-to-peer digital money network with a hard cap of 21 million coins.",
    bodyPt:
      "Bitcoin (BTC) é o primeiro activo cripto. Nasce em 2009 com o whitepaper de Satoshi Nakamoto. Não tem emissor central: a emissão segue um calendário (halving ~4 anos). Para Portugal, importa perceber custódia (exchange vs self-custody) e o enquadramento MiCA para prestadores de serviços — não para o próprio BTC como 'moeda emitida'.",
    bodyEn:
      "Bitcoin (BTC) is the first crypto asset (2009, Satoshi Nakamoto). No central issuer: issuance follows a schedule (~4-year halvings). In Portugal, focus on custody (exchange vs self-custody) and MiCA rules for service providers — not BTC as an 'issued currency'.",
    relatedMetrics: ["btc-price", "dominance", "halving"],
    relatedSlugs: ["halving", "volatilidade", "custodia"],
  },
  {
    slug: "halving",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Halving",
    titleEn: "Halving",
    summaryPt: "Corte para metade da recompensa dos miners, a cada ~210 000 blocos.",
    summaryEn: "Miner reward cut in half every ~210,000 blocks.",
    bodyPt:
      "O halving reduz a oferta nova de BTC. Não garante subida de preço — altera a dinâmica de emissão. Ciclos históricos correlacionam-se com halvings, mas correlação ≠ causalidade simples. Usa o Ciclo Storyline da CLAREZA para contextualizar, não para prever.",
    bodyEn:
      "Halving reduces new BTC supply. It does not guarantee higher prices — it changes issuance dynamics. Historical cycles correlate with halvings, but correlation ≠ simple causation. Use CLAREZA's Cycle Storyline for context, not prediction.",
    relatedMetrics: ["halving-countdown", "btc-price"],
    relatedSlugs: ["bitcoin", "ciclo-de-4-anos"],
  },
  {
    slug: "ciclo-de-4-anos",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "Ciclo de 4 anos",
    titleEn: "Four-year cycle",
    summaryPt: "Padrão histórico aproximado em torno dos halvings — não uma lei física.",
    summaryEn: "Approximate historical pattern around halvings — not a physical law.",
    bodyPt:
      "O 'ciclo de 4 anos' é um modelo heurístico: acumulação → expansão → distribuição → bear. ETFs spot, juros e regulação (MiCA) alteram o regime. Trate o ciclo como mapa, não como GPS.",
    bodyEn:
      "The 'four-year cycle' is a heuristic: accumulation → expansion → distribution → bear. Spot ETFs, rates and regulation (MiCA) change the regime. Treat the cycle as a map, not GPS.",
    relatedMetrics: ["cycle-progress", "ath-distance"],
    relatedSlugs: ["halving", "medo-e-ganancia"],
  },
  {
    slug: "volatilidade",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Volatilidade",
    titleEn: "Volatility",
    summaryPt: "Amplitude dos movimentos de preço — o 'clima' do activo.",
    summaryEn: "Size of price swings — the asset's 'weather'.",
    bodyPt:
      "Alta volatilidade não é 'mau' por si: é o preço da liquidez e da descoberta. Para um cidadão, a pergunta útil é: que tamanho de posição sobrevive a um drawdown de 30–50% sem decisões emocionais?",
    bodyEn:
      "High volatility isn't 'bad' by itself: it's the cost of liquidity and price discovery. For a citizen, the useful question: what position size survives a 30–50% drawdown without emotional decisions?",
    relatedMetrics: ["btc-change-24h"],
    relatedSlugs: ["liquidacao", "risco"],
  },
  {
    slug: "medo-e-ganancia",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Índice Medo e Ganância",
    titleEn: "Fear & Greed Index",
    summaryPt: "Indicador composto de sentimento (0–100). Coincidente, não oráculo.",
    summaryEn: "Composite sentiment gauge (0–100). Coincident, not an oracle.",
    bodyPt:
      "Combina volatilidade, volume, redes sociais e inquéritos. Extremos podem persistir semanas. Na CLAREZA nunca é usado sozinho — entra na Postura com funding e preço.",
    bodyEn:
      "Combines volatility, volume, social and surveys. Extremes can persist for weeks. CLAREZA never uses it alone — it feeds Posture with funding and price.",
    relatedMetrics: ["fear-greed"],
    relatedSlugs: ["funding-rate", "volatilidade"],
  },
  {
    slug: "funding-rate",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "Funding rate",
    titleEn: "Funding rate",
    summaryPt: "Pagamento periódico entre longs e shorts em perpetuais.",
    summaryEn: "Periodic payment between longs and shorts on perpetuals.",
    bodyPt:
      "Funding positivo: longs pagam shorts (mercado long-pesado). Negativo: o inverso. Extremos alertam para overcrowding — não são sinal de entrada automático.",
    bodyEn:
      "Positive funding: longs pay shorts (long-heavy market). Negative: the reverse. Extremes flag overcrowding — not an automatic entry signal.",
    relatedMetrics: ["funding-rate"],
    relatedSlugs: ["open-interest", "liquidacao"],
  },
  {
    slug: "open-interest",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "Open interest",
    titleEn: "Open interest",
    summaryPt: "Valor nocional de posições de futuros ainda abertas.",
    summaryEn: "Notional value of still-open futures positions.",
    bodyPt:
      "OI a subir com preço a subir = dinheiro novo a perseguir o movimento. OI a cair em dump = desalavancagem. Sempre cruzar com funding.",
    bodyEn:
      "Rising OI with rising price = new money chasing the move. Falling OI into a dump = deleveraging. Always cross-check with funding.",
    relatedMetrics: ["open-interest"],
    relatedSlugs: ["funding-rate", "liquidacao"],
  },
  {
    slug: "liquidacao",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "Liquidação",
    titleEn: "Liquidation",
    summaryPt: "Fecho forçado de posição alavancada quando a margem falha.",
    summaryEn: "Forced close of a leveraged position when margin fails.",
    bodyPt:
      "Cascata de liquidações pode acelerar o preço. O 'Liquidation Weather' da CLAREZA é uma estimativa educativa (OI + funding + force orders), não um heatmap institucional.",
    bodyEn:
      "Liquidation cascades can accelerate price. CLAREZA's Liquidation Weather is an educational estimate (OI + funding + force orders), not an institutional heatmap.",
    relatedMetrics: ["liquidation-weather"],
    relatedSlugs: ["funding-rate", "alavancagem"],
  },
  {
    slug: "alavancagem",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Alavancagem",
    titleEn: "Leverage",
    summaryPt: "Exposição maior do que o capital depositado — amplifica ganhos e perdas.",
    summaryEn: "More exposure than deposited capital — amplifies gains and losses.",
    bodyPt:
      "10× sobre um movimento de 10% apaga a conta. Para literacia: se não consegue explicar o preço de liquidação, não deve usar alavancagem.",
    bodyEn:
      "10× on a 10% move can wipe the account. Literacy test: if you can't explain liquidation price, you shouldn't use leverage.",
    relatedMetrics: ["funding-rate"],
    relatedSlugs: ["liquidacao", "risco"],
  },
  {
    slug: "dominancia-btc",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "Dominância BTC",
    titleEn: "BTC dominance",
    summaryPt: "Peso do Bitcoin na capitalização total do mercado cripto.",
    summaryEn: "Bitcoin's share of total crypto market cap.",
    bodyPt:
      "Dominância a subir: capital a concentrar-se em BTC (risk-off relativo). A descer: rotação para alts. Não implica 'alts vão subir amanhã'.",
    bodyEn:
      "Rising dominance: capital concentrating in BTC (relative risk-off). Falling: rotation into alts. It does not mean 'alts pump tomorrow'.",
    relatedMetrics: ["btc-dominance"],
    relatedSlugs: ["bitcoin", "altcoins"],
  },
  {
    slug: "altcoins",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Altcoins",
    titleEn: "Altcoins",
    summaryPt: "Qualquer cripto que não seja Bitcoin.",
    summaryEn: "Any crypto asset that isn't Bitcoin.",
    bodyPt:
      "Universo heterogéneo: ETH, stablecoins, memecoins, tokens de protocolo. Liquidez e risco variam enormemente. Verifica sempre o volume e a narrativa.",
    bodyEn:
      "Heterogeneous universe: ETH, stablecoins, memecoins, protocol tokens. Liquidity and risk vary wildly. Always check volume and narrative.",
    relatedMetrics: ["top-movers"],
    relatedSlugs: ["dominancia-btc", "tvl"],
  },
  {
    slug: "ethereum",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Ethereum",
    titleEn: "Ethereum",
    summaryPt: "Plataforma de smart contracts; base de muito do DeFi e NFTs.",
    summaryEn: "Smart-contract platform; base for much of DeFi and NFTs.",
    bodyPt:
      "ETH não é só 'moeda' — é combustível (gas) e activo de staking. Comparar ETH com BTC exige perguntas diferentes (utilidade vs escassez monetária).",
    bodyEn:
      "ETH isn't just 'money' — it's fuel (gas) and a staking asset. Comparing ETH to BTC requires different questions (utility vs monetary scarcity).",
    relatedMetrics: ["eth-price"],
    relatedSlugs: ["defi", "gas", "staking"],
  },
  {
    slug: "defi",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "DeFi",
    titleEn: "DeFi",
    summaryPt: "Finanças descentralizadas: protocolos on-chain sem intermediário clássico.",
    summaryEn: "Decentralised finance: on-chain protocols without a classic intermediary.",
    bodyPt:
      "Empréstimos, exchanges (DEX), stablecoins algorítmicas/colateralizadas. Riscos: smart contract, oráculos, liquidação, UX. TVL mede capital bloqueado — não qualidade.",
    bodyEn:
      "Lending, DEXs, algorithmic/collateralised stablecoins. Risks: smart contract, oracles, liquidation, UX. TVL measures locked capital — not quality.",
    relatedMetrics: ["tvl"],
    relatedSlugs: ["tvl", "stablecoins", "dex"],
  },
  {
    slug: "tvl",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "TVL",
    titleEn: "TVL",
    summaryPt: "Total Value Locked — capital depositado em protocolos DeFi.",
    summaryEn: "Total Value Locked — capital deposited in DeFi protocols.",
    bodyPt:
      "TVL alto pode significar confiança… ou incentives temporários. Sempre cruzar com fees/revenue quando possível. DefiLlama é a referência aberta.",
    bodyEn:
      "High TVL can mean trust… or temporary incentives. Cross-check with fees/revenue when possible. DefiLlama is the open reference.",
    relatedMetrics: ["tvl"],
    relatedSlugs: ["defi", "stablecoins"],
  },
  {
    slug: "stablecoins",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Stablecoins",
    titleEn: "Stablecoins",
    summaryPt: "Tokens que tentam manter paridade (ex.: 1 USD).",
    summaryEn: "Tokens that aim to hold a peg (e.g. 1 USD).",
    bodyPt:
      "USDT, USDC, etc. Tipos: fiduciárias (reservas), cripto-colateralizadas, algorítmicas. Em MiCA, stablecoins têm regras específicas de reservas e emissão.",
    bodyEn:
      "USDT, USDC, etc. Types: fiat-backed, crypto-collateralised, algorithmic. Under MiCA, stablecoins face specific reserve and issuance rules.",
    relatedMetrics: ["stablecoin-mcap"],
    relatedSlugs: ["mica", "defi"],
  },
  {
    slug: "dex",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "DEX",
    titleEn: "DEX",
    summaryPt: "Exchange descentralizada — swaps via smart contracts.",
    summaryEn: "Decentralised exchange — swaps via smart contracts.",
    bodyPt:
      "AMMs (Uniswap, etc.) vs order books on-chain. Riscos: impermanent loss (LPs), slippage, tokens falsos. Sem KYC típico de CEX — mas com risco técnico.",
    bodyEn:
      "AMMs (Uniswap, etc.) vs on-chain order books. Risks: impermanent loss (LPs), slippage, fake tokens. Usually no CEX-style KYC — but technical risk.",
    relatedMetrics: ["tvl"],
    relatedSlugs: ["defi", "tvl"],
  },
  {
    slug: "gas",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Gas",
    titleEn: "Gas",
    summaryPt: "Taxa paga para executar transacções numa blockchain.",
    summaryEn: "Fee paid to execute transactions on a blockchain.",
    bodyPt:
      "Em Ethereum, o gas sobe com a procura. As L2s reduzem o custo. Simula sempre o custo antes de aprovar contratos.",
    bodyEn:
      "On Ethereum, gas rises with demand. L2s reduce cost. Always simulate cost before approving contracts.",
    relatedMetrics: [],
    relatedSlugs: ["ethereum", "camada-2"],
  },
  {
    slug: "camada-2",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "Camada 2 (L2)",
    titleEn: "Layer 2 (L2)",
    summaryPt: "Redes que escalam Ethereum com custos menores.",
    summaryEn: "Networks that scale Ethereum at lower cost.",
    bodyPt:
      "Optimistic e ZK rollups herdam segurança de L1 com nuances. Bridging introduz risco operacional.",
    bodyEn:
      "Optimistic and ZK rollups inherit L1 security with nuances. Bridging introduces operational risk.",
    relatedMetrics: [],
    relatedSlugs: ["ethereum", "gas"],
  },
  {
    slug: "staking",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Staking",
    titleEn: "Staking",
    summaryPt: "Bloquear tokens para validar rede / obter yield.",
    summaryEn: "Lock tokens to help secure a network / earn yield.",
    bodyPt:
      "Em ETH (PoS), staking tem riscos de slashing e liquidez (liquid staking). Yield não é 'juro sem risco'.",
    bodyEn:
      "On ETH (PoS), staking has slashing and liquidity risks (liquid staking). Yield is not 'risk-free interest'.",
    relatedMetrics: [],
    relatedSlugs: ["ethereum", "risco"],
  },
  {
    slug: "custodia",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Custódia",
    titleEn: "Custody",
    summaryPt: "Quem controla as chaves privadas controla os fundos.",
    summaryEn: "Whoever controls the private keys controls the funds.",
    bodyPt:
      "Exchange = custódia terceirizada (risco de plataforma). Self-custody = responsabilidade total. Em Portugal, escolha CASPs alinhados com MiCA/CMVM quando usar intermediários.",
    bodyEn:
      "Exchange = third-party custody (platform risk). Self-custody = full responsibility. In Portugal, prefer MiCA/CMVM-aligned CASPs when using intermediaries.",
    relatedMetrics: [],
    relatedSlugs: ["mica", "risco"],
  },
  {
    slug: "seed-phrase",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Seed phrase",
    titleEn: "Seed phrase",
    summaryPt:
      "12 ou 24 palavras que codificam todas as chaves da carteira.",
    summaryEn:
      "12 or 24 words encoding all of a wallet's keys.",
    bodyPt:
      "Segundo o BIP-39, uma seed é entropia convertida numa lista fixa de 2048 palavras, de onde derivam todas as chaves e endereços. Quem a tem, tem tudo; quem a perde, perde tudo. Papel ou aço, nunca digital — e nenhum suporte legítimo a pede. A faixa Segurança em Contexto aprofunda.",
    bodyEn:
      "Per BIP-39, a seed is entropy converted into a fixed 2048-word list, from which every key and address derives. Whoever holds it holds everything; whoever loses it loses everything. Paper or steel, never digital — and no legitimate support asks for it. The Security lane in Contexto goes deeper.",
    relatedMetrics: [],
    relatedSlugs: ["bip39", "entropia", "custodia", "hardware-wallet"],
  },
  {
    slug: "chave-privada",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Chave privada",
    titleEn: "Private key",
    summaryPt:
      "O segredo que assina transacções — a seed gera muitas.",
    summaryEn:
      "The secret that signs transactions — one seed generates many.",
    bodyPt:
      "Cada endereço tem uma chave privada que autoriza gastos. Numa carteira HD derivam todas da seed — por isso a seed é o ponto crítico, não cada chave isolada. Uma boa carteira assina sem expor a chave ao computador.",
    bodyEn:
      "Each address has a private key authorising spends. In an HD wallet they all derive from the seed — so the seed is the critical point, not each isolated key. A good wallet signs without exposing the key to the computer.",
    relatedMetrics: [],
    relatedSlugs: ["seed-phrase", "custodia", "multisig"],
  },
  {
    slug: "entropia",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "Entropia",
    titleEn: "Entropy",
    summaryPt:
      "A aleatoriedade por trás da seed — humanos são maus a gerá-la.",
    summaryEn:
      "The randomness behind a seed — humans are bad at generating it.",
    bodyPt:
      "Entropia é a fonte de aleatoriedade de onde nasce a seed. Gerada pelo sistema operativo ou por métodos manuais (dados, moedas), deve ser imprevisível e não repetível. Entropia fraca = carteira comprometida: bots varrem padrões feitos por humanos. Nunca inventes palavras 'à tua maneira'.",
    bodyEn:
      "Entropy is the randomness source a seed is born from. Generated by the OS or manual methods (dice, coins), it must be unpredictable and non-repeatable. Weak entropy = compromised wallet: bots sweep human-made patterns. Never invent words 'your way'.",
    relatedMetrics: [],
    relatedSlugs: ["seed-phrase", "bip39"],
  },
  {
    slug: "bip39",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "BIP-39",
    titleEn: "BIP-39",
    summaryPt:
      "O padrão que transforma entropia em palavras.",
    summaryEn:
      "The standard that turns entropy into words.",
    bodyPt:
      "BIP-39 define o pipeline: entropia → checksum → palavras de uma lista de 2048 → seed (PBKDF2) → chaves e endereços. É o padrão dominante, mas não universal — Electrum e SLIP-39 usam variantes. Confirma sempre o padrão da carteira antes de recuperar fundos.",
    bodyEn:
      "BIP-39 defines the pipeline: entropy → checksum → words from a 2048 list → seed (PBKDF2) → keys and addresses. It's the dominant standard but not universal — Electrum and SLIP-39 use variants. Always confirm the wallet's standard before recovering funds.",
    relatedMetrics: [],
    relatedSlugs: ["seed-phrase", "entropia", "passphrase"],
  },
  {
    slug: "passphrase",
    asOf: "2026-09-11",
    level: "advanced",
    titlePt: "Passphrase (25.ª palavra)",
    titleEn: "Passphrase (25th word)",
    summaryPt:
      "Palavra extra opcional que cria uma carteira diferente.",
    summaryEn:
      "Optional extra word that creates a different wallet.",
    bodyPt:
      "Seed + passphrase = uma carteira distinta e válida. Protege contra roubo físico da seed e permite negação plausível (decoy wallet). O preço: perder a passphrase = perder tudo, e nunca há aviso de erro — cada passphrase abre uma carteira diferente.",
    bodyEn:
      "Seed + passphrase = a distinct valid wallet. Protects against physical seed theft and enables plausible deniability (decoy wallet). The price: losing the passphrase = losing everything, and there's no error message — each passphrase opens a different wallet.",
    relatedMetrics: [],
    relatedSlugs: ["bip39", "seed-phrase", "custodia"],
  },
  {
    slug: "hardware-wallet",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Hardware wallet",
    titleEn: "Hardware wallet",
    summaryPt:
      "Dispositivo que guarda chaves offline e assina sem as expor.",
    summaryEn:
      "Device that keeps keys offline and signs without exposing them.",
    bodyPt:
      "A chave privada vive no dispositivo e nunca sai — assina transacções internamente, mesmo com o computador comprometido. Regras: compra só ao fabricante, verifica endereços no ecrã do dispositivo, e guarda a seed em papel/aço separada.",
    bodyEn:
      "The private key lives on the device and never leaves — it signs transactions internally, even with a compromised computer. Rules: buy only from the manufacturer, verify addresses on the device screen, and keep the seed on paper/steel separately.",
    relatedMetrics: [],
    relatedSlugs: ["custodia", "chave-privada", "seed-phrase"],
  },
  {
    slug: "multisig",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "Multisig",
    titleEn: "Multisig",
    summaryPt:
      "Carteira que exige m-de-n chaves para mover fundos.",
    summaryEn:
      "Wallet requiring m-of-n keys to move funds.",
    bodyPt:
      "Ex.: 2-de-3 — duas de três chaves assinam. Elimina o ponto único de falha (roubo ou perda de uma chave não é fatal), mas adiciona complexidade: perder duas = perder tudo. Usado em tesourarias e heranças estruturadas.",
    bodyEn:
      "E.g. 2-of-3 — two of three keys sign. Removes the single point of failure (theft or loss of one key isn't fatal), but adds complexity: losing two = losing everything. Used in treasuries and structured inheritance.",
    relatedMetrics: [],
    relatedSlugs: ["chave-privada", "custodia"],
  },
  {
    slug: "phishing",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Phishing",
    titleEn: "Phishing",
    summaryPt:
      "Engenharia social para te fazer assinar ou revelar a seed.",
    summaryEn:
      "Social engineering to make you sign or reveal the seed.",
    bodyPt:
      "Suporte falso, urgência fabricada, sites clonados — o objectivo é a seed ou uma assinatura cega. Defesas: desconfia de urgência, escreve URLs à mão, nunca introduzas a seed em site nenhum. É a ferramenta #1 dos golpes.",
    bodyEn:
      "Fake support, manufactured urgency, cloned sites — the goal is the seed or a blind signature. Defences: distrust urgency, type URLs by hand, never enter the seed on any site. It's scammers' tool #1.",
    relatedMetrics: [],
    relatedSlugs: ["seed-phrase", "aprovacoes", "address-poisoning"],
  },
  {
    slug: "aprovacoes",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "Aprovações de tokens",
    titleEn: "Token approvals",
    summaryPt:
      "Permissões que deste a contratos — revogáveis, mas esquecidas.",
    summaryEn:
      "Permissions you granted contracts — revocable, but forgotten.",
    bodyPt:
      "Antes de um swap, a carteira pede uma aprovação: autorização para o contrato mover o teu token. Aprovações 'ilimitadas' ficam activas para sempre — um contrato comprometido depois drena o saldo. Revê e revoga regularmente (ex.: revoke.cash) e prefere aprovações limitadas.",
    bodyEn:
      "Before a swap, the wallet asks for an approval: authorisation for the contract to move your token. 'Unlimited' approvals stay active forever — a compromised contract later drains the balance. Review and revoke regularly (e.g., revoke.cash) and prefer limited approvals.",
    relatedMetrics: [],
    relatedSlugs: ["defi", "phishing"],
  },
  {
    slug: "address-poisoning",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "Address poisoning",
    titleEn: "Address poisoning",
    summaryPt:
      "Endereços parecidos no histórico para copiares o errado.",
    summaryEn:
      "Look-alike addresses in your history so you copy the wrong one.",
    bodyPt:
      "O atacante envia uma transacção de valor nulo de um endereço com início e fim iguais ao do teu contacto. Se copiares do histórico, os fundos vão para ele. Defesa: nunca copies endereços do histórico — confirma o endereço completo, não só as pontas, ou usa address book.",
    bodyEn:
      "The attacker sends a zero-value transaction from an address with the same start and end as your contact's. If you copy from history, funds go to them. Defence: never copy addresses from history — confirm the full address, not just the ends, or use an address book.",
    relatedMetrics: [],
    relatedSlugs: ["phishing", "custodia"],
  },
  {
    slug: "mica",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "MiCA",
    titleEn: "MiCA",
    summaryPt: "Regulamento europeu de mercados de criptoactivos.",
    summaryEn: "EU Markets in Crypto-Assets regulation.",
    bodyPt:
      "MiCA harmoniza regras para emissores e CASPs na UE. Em Portugal, CMVM e Banco de Portugal partilham supervisão conforme o tipo de activo/serviço. Veja a faixa Portugal.",
    bodyEn:
      "MiCA harmonises rules for issuers and CASPs in the EU. In Portugal, CMVM and Banco de Portugal share supervision by asset/service type. See the Portugal lane.",
    relatedMetrics: [],
    relatedSlugs: ["stablecoins", "custodia"],
  },
  {
    slug: "risco",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Risco",
    titleEn: "Risk",
    summaryPt: "Possibilidade de perda permanente ou temporária de capital.",
    summaryEn: "Possibility of permanent or temporary capital loss.",
    bodyPt:
      "Tipos: mercado, liquidez, contraparte, operacional, regulatório, psicológico. A Postura CLAREZA descreve o clima — não o teu risco pessoal.",
    bodyEn:
      "Types: market, liquidity, counterparty, operational, regulatory, psychological. CLAREZA Posture describes weather — not your personal risk.",
    relatedMetrics: [],
    relatedSlugs: ["volatilidade", "alavancagem"],
  },
  {
    slug: "etf-spot",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "ETF spot de Bitcoin",
    titleEn: "Bitcoin spot ETF",
    summaryPt: "Fundo cotado que detém BTC e espelha o preço no mercado tradicional.",
    summaryEn: "Listed fund holding BTC that tracks price in traditional markets.",
    bodyPt:
      "Fluxos de ETF tornaram-se um catalisador macro. A CLAREZA mostra os fluxos diários BTC/ETH/SOL (Farside) no Fluxos — barras por dia, somas de 5 e 20 dias.",
    bodyEn:
      "ETF flows became a macro catalyst. CLAREZA shows daily BTC/ETH/SOL flows (Farside) in Fluxos — per-day bars, 5- and 20-day sums.",
    relatedMetrics: [],
    relatedSlugs: ["bitcoin", "ciclo-de-4-anos"],
  },
  {
    slug: "on-chain",
    asOf: "2026-09-11",
    level: "advanced",
    titlePt: "Dados on-chain",
    titleEn: "On-chain data",
    summaryPt: "Métricas lidas directamente da blockchain (UTXOs, exchanges, etc.).",
    summaryEn: "Metrics read directly from the blockchain (UTXOs, exchanges, etc.).",
    bodyPt:
      "Poderosos mas fáceis de mal interpretar. Glassnode/CryptoQuant são pro. A CLAREZA traduz derivados públicos; on-chain profundo fica para continuidade.",
    bodyEn:
      "Powerful but easy to misread. Glassnode/CryptoQuant are pro-grade. CLAREZA translates public derivatives; deep on-chain is roadmap.",
    relatedMetrics: [],
    relatedSlugs: ["bitcoin", "open-interest"],
  },
  {
    slug: "market-cap",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Market cap",
    titleEn: "Market cap",
    summaryPt: "Preço × oferta circulante — tamanho aproximado do activo.",
    summaryEn: "Price × circulating supply — approximate asset size.",
    bodyPt:
      "Não mede 'valor justo'. Tokens com unlocks grandes podem ter FDV enganador. Sempre olhar liquidez.",
    bodyEn:
      "Does not measure 'fair value'. Tokens with large unlocks can have misleading FDV. Always check liquidity.",
    relatedMetrics: ["total-mcap"],
    relatedSlugs: ["altcoins", "liquidez"],
  },
  {
    slug: "liquidez",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "Liquidez",
    titleEn: "Liquidity",
    summaryPt: "Facilidade de entrar/sair sem mover muito o preço.",
    summaryEn: "Ease of entering/exiting without moving price much.",
    bodyPt:
      "Baixa liquidez = spreads largos e manipulação mais fácil. Volume 24h vs market cap é um atalho grosseiro mas útil.",
    bodyEn:
      "Low liquidity = wide spreads and easier manipulation. 24h volume vs market cap is a crude but useful shortcut.",
    relatedMetrics: ["volume-24h"],
    relatedSlugs: ["market-cap", "altcoins"],
  },
  {
    slug: "ordem-de-mercado",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "Ordem de mercado vs limite",
    titleEn: "Market vs limit order",
    summaryPt: "Mercado executa já; limite espera preço.",
    summaryEn: "Market executes now; limit waits for a price.",
    bodyPt:
      "CLAREZA não executa trades — mas compreender ordens evita confusão ao usar exchanges. Slippage é o inimigo em stress.",
    bodyEn:
      "CLAREZA does not execute trades — but understanding orders avoids confusion on exchanges. Slippage is the enemy under stress.",
    relatedMetrics: [],
    relatedSlugs: ["liquidez", "volatilidade"],
  },
  {
    slug: "dyor",
    asOf: "2026-09-11",
    level: "beginner",
    titlePt: "DYOR",
    titleEn: "DYOR",
    summaryPt: "Do Your Own Research — e a análise estruturada é o método.",
    summaryEn: "Do Your Own Research — and the Case File is the method.",
    bodyPt:
      "DYOR sem método é scroll. O padrão causa e efeito força hipóteses, evidência e incerteza — a literacia que os feeds não ensinam.",
    bodyEn:
      "DYOR without method is scrolling. Cause & Effect forces hypotheses, evidence and uncertainty — literacy feeds don't teach.",
    relatedMetrics: [],
    relatedSlugs: ["risco", "medo-e-ganancia"],
  },
  {
    slug: "correlacao",
    asOf: "2026-09-11",
    level: "advanced",
    titlePt: "Correlação",
    titleEn: "Correlation",
    summaryPt: "Grau em que dois activos se movem juntos.",
    summaryEn: "Degree to which two assets move together.",
    bodyPt:
      "Em stress, correlações sobem (tudo cai). Diversificação cripto 'pura' falha nesses dias. BTC ainda ancora o regime.",
    bodyEn:
      "In stress, correlations rise (everything falls). 'Pure' crypto diversification fails on those days. BTC still anchors the regime.",
    relatedMetrics: ["btc-dominance"],
    relatedSlugs: ["bitcoin", "risco"],
  },
  {
    slug: "narrative",
    asOf: "2026-09-11",
    level: "intermediate",
    titlePt: "Narrativa de mercado",
    titleEn: "Market narrative",
    summaryPt: "História colectiva que organiza atenção e capital (AI, L2, memes…).",
    summaryEn: "Collective story organising attention and capital (AI, L2, memes…).",
    bodyPt:
      "Narrativas não são fundamentais — mas movem preços. O Brief editorial tenta nomear a história do dia sem a vender como verdade.",
    bodyEn:
      "Narratives aren't fundamentals — but they move prices. The editorial Brief tries to name the day's story without selling it as truth.",
    relatedMetrics: [],
    relatedSlugs: ["dyor", "altcoins"],
  },
];

export function getConcept(slug: string) {
  return ATLAS.find((c) => c.slug === slug);
}
