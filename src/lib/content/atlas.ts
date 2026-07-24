import type { AtlasConcept } from "@/lib/types";

export const ATLAS: AtlasConcept[] = [
  {
    slug: "bitcoin",
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
    level: "beginner",
    titlePt: "Alavancagem",
    titleEn: "Leverage",
    summaryPt: "Exposição maior do que o capital depositado — amplifica ganhos e perdas.",
    summaryEn: "More exposure than deposited capital — amplifies gains and losses.",
    bodyPt:
      "10× sobre um movimento de 10% apaga a conta. Para literacia: se não consegue explicar a liquidação price, não deve usar alavancagem.",
    bodyEn:
      "10× on a 10% move can wipe the account. Literacy test: if you can't explain liquidation price, you shouldn't use leverage.",
    relatedMetrics: ["funding-rate"],
    relatedSlugs: ["liquidacao", "risco"],
  },
  {
    slug: "dominancia-btc",
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
    slug: "mica",
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
    level: "intermediate",
    titlePt: "ETF spot de Bitcoin",
    titleEn: "Bitcoin spot ETF",
    summaryPt: "Fundo cotado que detém BTC e espelha o preço no mercado tradicional.",
    summaryEn: "Listed fund holding BTC that tracks price in traditional markets.",
    bodyPt:
      "Fluxos de ETF tornaram-se um catalisador macro. Não estão no MVP de dados ao vivo da CLAREZA (fase 2), mas entram na narrativa do ciclo institucional.",
    bodyEn:
      "ETF flows became a macro catalyst. Not in CLAREZA's live MVP data (phase 2), but part of the institutional cycle narrative.",
    relatedMetrics: [],
    relatedSlugs: ["bitcoin", "ciclo-de-4-anos"],
  },
  {
    slug: "on-chain",
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
