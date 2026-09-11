/**
 * Portugal legal/educational lane — orientation only, never advice.
 * Discipline: dated, sourced, uncertain when unsure (VISION-tax-module §7).
 */

export type PortugalSource = {
  labelPt: string;
  labelEn: string;
  url: string;
};

export type PortugalExample = {
  titlePt: string;
  titleEn: string;
  bodyPt: string;
  bodyEn: string;
};

export type PortugalSection = {
  id:
    | "mica"
    | "cmvm"
    | "custody"
    | "tax"
    | "isencao"
    | "swap"
    | "anexos"
    | "declarar";
  titlePt: string;
  titleEn: string;
  /** ISO date — when this card was last reviewed for accuracy. */
  asOf: string;
  bodyPt: string;
  bodyEn: string;
  howToPt: string[];
  howToEn: string[];
  examples: PortugalExample[];
  sources: PortugalSource[];
  /** Explicit uncertainty — prefer this over a confident wrong claim. */
  uncertaintyPt?: string;
  uncertaintyEn?: string;
};

export const PORTUGAL_CONTENT = {
  disclaimerPt:
    "Orientação educativa — não é aconselhamento jurídico, fiscal nem contabilístico. Para efeitos contabilísticos ou de declaração, consulta sempre um TOC (Técnico Oficial de Contas). Confirma com fontes oficiais — as regras mudam.",
  disclaimerEn:
    "Educational orientation — not legal, tax or accounting advice. For accounting or filing purposes, always consult a certified accountant (TOC in Portugal). Verify with official sources — rules change.",
  reviewedAt: "2026-09-11",
  /** The five things a newcomer needs first — rendered as the "60 seconds" card. */
  sixtySecondsPt: [
    "MiCA já regula as plataformas de cripto na UE (CASPs autorizados) desde dezembro de 2024; em Portugal a Lei n.º 69/2025 executa o regime.",
    "Para IRS: comprar e guardar não tributa. Alienar — vender por euros, bens ou serviços — pode tributar.",
    "Cripto detido ≥365 dias: o regime prevê exclusão de tributação das mais-valias, com condições e excepções.",
    "Trocas cripto↔cripto não são, por si, a operação tributável — o custo de aquisição transporta-se (folheto AT).",
    "Guarda histórico de tudo (datas + valores em euros) — é a matéria-prima do Portal das Finanças e do teu TOC.",
  ],
  sixtySecondsEn: [
    "MiCA already regulates crypto platforms in the EU (authorised CASPs) since December 2024; Portugal's Law no. 69/2025 executes it.",
    "For IRS: buying and holding is not taxed. Disposing — selling for euros, goods or services — may be.",
    "Crypto held ≥365 days: the regime provides exclusion of capital gains, with conditions and exceptions.",
    "Crypto↔crypto swaps are not, by themselves, the taxable event — acquisition cost carries over (AT leaflet).",
    "Keep history of everything (dates + EUR values) — it's what Portal das Finanças and your accountant need.",
  ],
  faq: [
    {
      qPt: "Comprei cripto mas nunca vendi — tenho de declarar?",
      qEn: "I bought crypto but never sold — do I have to declare it?",
      aPt: "A mera aquisição e detenção não é, por si, facto tributável de mais-valia. Declaras quando existe alienação onerosa (vender por fiat/bens/serviços) ou rendimento (juros, rewards). Confirma no ano em causa.",
      aEn: "Merely buying and holding is not, by itself, a taxable capital-gains event. You declare when there is an onerous disposal (selling for fiat/goods/services) or income (interest, rewards). Confirm for the relevant year.",
    },
    {
      qPt: "Troquei BTC por ETH — é tributável?",
      qEn: "I swapped BTC for ETH — is it taxable?",
      aPt: "Segundo o folheto AT, a permuta cripto-cripto não constitui, por si, a alienação descrita para tributação; o valor de aquisição transporta-se para o activo recebido até alienação onerosa. Valida o teu caso com TOC.",
      aEn: "Per the AT leaflet, a crypto-to-crypto swap is not, by itself, the disposal described for taxation; the acquisition cost carries to the received asset until an onerous disposal. Validate your case with an accountant.",
    },
    {
      qPt: "Comprei antes de 2023 — os 365 dias contam?",
      qEn: "I bought before 2023 — do the 365 days count?",
      aPt: "O folheto AT prevê que períodos de detenção anteriores à entrada em vigor contam para a regra (contagem transitória). Confirma as datas exactas com a AT/TOC — o detalhe da transição importa.",
      aEn: "The AT leaflet provides that holding periods before entry into force count towards the rule (transitional counting). Confirm exact dates with the AT/accountant — the transitional detail matters.",
    },
    {
      qPt: "Recebo juros ou rewards de staking — como entra no IRS?",
      qEn: "I earn interest or staking rewards — how does that enter the IRS?",
      aPt: "Rendimentos deste tipo podem enquadrar-se na Categoria E (rendimentos de capitais) ou B (actividade) consoante o facto e a natureza — não resolvemos aqui a classificação; leva o histórico ao TOC.",
      aEn: "Income of this kind may fall under Category E (capital income) or B (activity) depending on the facts — we don't resolve the classification here; take the history to an accountant.",
    },
    {
      qPt: "Sou residente fiscal noutro país — esta faixa serve-me?",
      qEn: "I'm tax-resident in another country — does this lane apply to me?",
      aPt: "Esta faixa descreve o enquadramento português. Noutro país as regras são outras — procura a autoridade fiscal local. O que se mantém universal: guarda histórico e desconfia de «dicas de fiscalidade» de influencers.",
      aEn: "This lane describes the Portuguese framework. Elsewhere the rules differ — check your local tax authority. What stays universal: keep records and distrust influencer “tax tips”.",
    },
  ] as { qPt: string; qEn: string; aPt: string; aEn: string }[],
  sections: [
    {
      id: "mica",
      titlePt: "MiCA na União Europeia",
      titleEn: "MiCA in the European Union",
      asOf: "2026-07-25",
      bodyPt:
        "O Regulamento (UE) 2023/1114 (MiCA) harmoniza regras para emissores de criptoactivos e prestadores de serviços (CASPs) na UE: whitepapers, reservas (incluindo stablecoins), governação e protecção do consumidor. Entrada em vigor: 29 de junho de 2023 (JO L 150). O título relativo aos CASPs aplica-se a partir de 30 de dezembro de 2024. Em Portugal, a Lei n.º 69/2025 (22 de dezembro) assegura a execução nacional do MiCA — confirma o texto vigente no Diário da República. MiCA ≠ IRS: regulação de mercado não é fiscalidade.",
      bodyEn:
        "Regulation (EU) 2023/1114 (MiCA) harmonises rules for crypto-asset issuers and service providers (CASPs) in the EU: white papers, reserves (including stablecoins), governance and consumer protection. Entry into force: 29 June 2023 (OJ L 150). The CASP title applies from 30 December 2024. In Portugal, Law no. 69/2025 (22 December) provides national MiCA execution — confirm the in-force text in the Diário da República. MiCA ≠ tax: market regulation is not taxation.",
      howToPt: [
        "Antes de depositar fundos: verifica se a plataforma se apresenta como CASP autorizado ou em transição sob MiCA (lista/registo oficial do Estado-membro).",
        "Lê o whitepaper / documentação de risco do activo — MiCA exige transparência, não garante rentabilidade.",
        "Se a plataforma for de fora da UE, assume que o regime MiCA pode não te cobrir da mesma forma — confirma o enquadramento.",
      ],
      howToEn: [
        "Before depositing funds: check whether the platform presents as an authorised CASP or in MiCA transition (official Member State register).",
        "Read the asset white paper / risk docs — MiCA requires transparency, not returns.",
        "If the platform is outside the EU, assume MiCA may not cover you the same way — confirm the framing.",
      ],
      examples: [
        {
          titlePt: "Exemplo — escolher exchange",
          titleEn: "Example — choosing an exchange",
          bodyPt:
            "Tens duas apps: uma com autorização CASP publicada e outra sem informação clara. O procedimento prudente é preferir a primeira e guardar o comprovativo (captura da lista oficial + data).",
          bodyEn:
            "You have two apps: one with a published CASP authorisation and one with unclear info. The prudent path is to prefer the first and keep proof (screenshot of the official list + date).",
        },
      ],
      sources: [
        {
          labelPt: "EUR-Lex — Regulamento (UE) 2023/1114 (MiCA)",
          labelEn: "EUR-Lex — Regulation (EU) 2023/1114 (MiCA)",
          url: "https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32023R1114",
        },
        {
          labelPt: "Lei n.º 69/2025 — execução MiCA em Portugal (DR)",
          labelEn: "Law no. 69/2025 — MiCA execution in Portugal (DR)",
          url: "https://diariodarepublica.pt/dr/detalhe/lei/69-2025-992098939",
        },
      ],
      uncertaintyPt:
        "Calendários de transição e listas nacionais de CASPs evoluem — esta página não substitui a consulta à CMVM/autoridade do Estado-membro na data em que decides.",
      uncertaintyEn:
        "Transition calendars and national CASP lists evolve — this page does not replace checking the CMVM/Member State authority on the day you decide.",
    },
    {
      id: "cmvm",
      titlePt: "CMVM e supervisão em Portugal",
      titleEn: "CMVM and supervision in Portugal",
      asOf: "2026-07-25",
      bodyPt:
        "Em Portugal, a supervisão de criptoactivos envolve a CMVM e, em certas matérias (pagamentos / moeda electrónica / outros perímetros), o Banco de Portugal. A Lei n.º 69/2025 atribui competências de execução do MiCA entre estas autoridades — lê o articulado oficial para o teu tipo de serviço. MiCA define o quadro europeu; a supervisão nacional aplica-o. Consulta listas e comunicados oficiais antes de confiar fundos a um intermediário.",
      bodyEn:
        "In Portugal, crypto supervision involves the CMVM and, on certain matters (payments / e-money / other perimeters), Banco de Portugal. Law no. 69/2025 assigns MiCA execution powers between these authorities — read the official text for your service type. MiCA sets the EU frame; national supervisors apply it. Check official lists and notices before trusting an intermediary with funds.",
      howToPt: [
        "Abre o site da CMVM e procura a área / comunicados sobre criptoativos — confirma o estado do prestador que usas.",
        "Se o serviço parecer «pagamento» ou e-money, cruza também com o Banco de Portugal.",
        "Guarda a data da consulta: a autorização de ontem não prova a de amanhã.",
      ],
      howToEn: [
        "Open the CMVM site and find crypto-asset notices / registers — confirm the status of the provider you use.",
        "If the service looks like payments or e-money, also cross-check Banco de Portugal.",
        "Keep the date of your check: yesterday’s authorisation does not prove tomorrow’s.",
      ],
      examples: [
        {
          titlePt: "Exemplo — influencer vs lista oficial",
          titleEn: "Example — influencer vs official list",
          bodyPt:
            "Um vídeo recomenda uma «exchange nova sem KYC». O procedimento: pausa → procura o nome na informação oficial → se não aparece, trata como risco elevado e não deposites só por urgência social.",
          bodyEn:
            "A video pushes a “new exchange with no KYC”. Procedure: pause → look up the name in official info → if missing, treat as high risk and do not deposit on social urgency alone.",
        },
      ],
      sources: [
        {
          labelPt: "CMVM",
          labelEn: "CMVM",
          url: "https://www.cmvm.pt/",
        },
        {
          labelPt: "Banco de Portugal",
          labelEn: "Banco de Portugal",
          url: "https://www.bportugal.pt/",
        },
        {
          labelPt: "Lei n.º 69/2025 — execução MiCA (DR)",
          labelEn: "Law no. 69/2025 — MiCA execution (DR)",
          url: "https://diariodarepublica.pt/dr/detalhe/lei/69-2025-992098939",
        },
      ],
      uncertaintyPt:
        "A repartição exacta de competências CMVM/BdP depende do tipo de activo e serviço — se a tua situação for limítrofe, pergunta à entidade ou a um profissional; não inventamos o perímetro aqui.",
      uncertaintyEn:
        "The exact CMVM/BdP split depends on asset and service type — if your case is borderline, ask the authority or a professional; we do not invent the perimeter here.",
    },
    {
      id: "custody",
      titlePt: "Custódia e risco",
      titleEn: "Custody and risk",
      asOf: "2026-07-25",
      bodyPt:
        "«Not your keys, not your coins» continua válido — mas self-custody exige disciplina (backup, phishing, herança). Custódia num CASP regula trocar risco técnico por risco de contraparte e operacional. Nenhum dos dois é zero risco. A escolha é de gestão de risco, não de «certo vs errado».",
      bodyEn:
        "“Not your keys, not your coins” still holds — but self-custody needs discipline (backup, phishing, inheritance). Regulated CASP custody swaps technical risk for counterparty and operational risk. Neither is zero risk. The choice is risk management, not “right vs wrong”.",
      howToPt: [
        "Se usas exchange: activa 2FA, lista de allowlist de levantamentos, e testa um levantamento pequeno.",
        "Se self-custody: testa recuperação da seed num dispositivo offline de ensaio; nunca fotografes a seed para a cloud.",
        "Documenta quem herda o acesso (procedimento familiar) — risco operacional real, não só «hack».",
      ],
      howToEn: [
        "If using an exchange: enable 2FA, withdrawal allowlists, and test a small withdrawal.",
        "If self-custody: test seed recovery on an offline practice device; never photograph the seed into the cloud.",
        "Document who inherits access (family procedure) — real operational risk, not only “hacks”.",
      ],
      examples: [
        {
          titlePt: "Exemplo — montante de estudo",
          titleEn: "Example — study-size amount",
          bodyPt:
            "Antes de mover o «cofre», move um montante pequeno pelo mesmo caminho (exchange→wallet ou wallet→exchange) e confirma endereços carácter a carácter. Só depois escalas.",
          bodyEn:
            "Before moving the “vault”, move a small amount along the same path (exchange→wallet or wallet→exchange) and verify addresses character by character. Only then scale.",
        },
      ],
      sources: [
        {
          labelPt: "CMVM — informação ao investidor (consultar área criptoativos)",
          labelEn: "CMVM — investor information (see crypto-assets area)",
          url: "https://www.cmvm.pt/",
        },
      ],
    },
    {
      id: "tax",
      titlePt: "Fiscalidade (orientação, não aconselhamento)",
      titleEn: "Taxation (orientation, not advice)",
      asOf: "2026-07-25",
      bodyPt:
        "Segundo o folheto informativo da Autoridade Tributária (AT) sobre criptoactivos, o Orçamento do Estado para 2023 (Lei n.º 24-D/2022, de 30 de dezembro) introduziu o regime de tributação em IRS. Esta faixa resume orientação de alto nível a partir desse folheto — não substitui TOC, AT nem legislação posterior. Guarda histórico (datas, quantidades, contraprestação).",
      bodyEn:
        "According to the Portuguese Tax Authority (AT) leaflet on crypto-assets, the 2023 State Budget (Law no. 24-D/2022 of 30 December) introduced the IRS taxation regime. This lane summarises high-level orientation from that leaflet — it does not replace an accountant, the AT, or later law. Keep history (dates, quantities, consideration).",
      howToPt: [
        "Lê o folheto AT «Criptoativos — Conceito fiscal e tributação» (PDF oficial) antes de qualquer checklist de influencer.",
        "Exporta CSV / histórico de cada exchange e wallet — um arquivo por ano civil.",
        "Separa: (a) alienação onerosa / conversão para fiat ou bens; (b) trocas cripto-cripto; (c) yields/staking; (d) actividade profissional. O enquadramento pode diferir.",
        "Marca TOC com o histórico organizado; confirma anexos e regras do teu ano no Portal das Finanças.",
      ],
      howToEn: [
        "Read the AT leaflet “Criptoativos — Conceito fiscal e tributação” (official PDF) before any influencer checklist.",
        "Export CSV / history from every exchange and wallet — one archive per calendar year.",
        "Separate: (a) disposal / conversion to fiat or goods; (b) crypto-to-crypto swaps; (c) yields/staking; (d) professional activity. Framing may differ.",
        "Book an accountant with organised history; confirm annexes and rules for your year on Portal das Finanças.",
      ],
      examples: [
        {
          titlePt: "Exemplo educativo — troca BTC→ETH",
          titleEn: "Educational example — BTC→ETH swap",
          bodyPt:
            "O folheto AT indica que a mera conversão entre criptoactivos não constitui, por si, a operação tributável descrita para alienação — o custo transporta-se até alienação noutro activo. Isto difere de muitos modelos US. Valida o teu caso com TOC/AT; não calculamos aqui.",
          bodyEn:
            "The AT leaflet states that mere conversion between crypto-assets is not, by itself, the taxable disposal described for alienations — cost basis carries until disposal into another asset. This differs from many US models. Validate your case with an accountant/AT; we do not compute here.",
        },
        {
          titlePt: "Exemplo educativo — detenção ≥365 dias",
          titleEn: "Educational example — holding ≥365 days",
          bodyPt:
            "Segundo o mesmo folheto AT: ganhos/perdas de alienação onerosa de criptoactivos que não sejam valores mobiliários, detidos ≥365 dias, são excluídos de tributação (anexo G1 referido no folheto). Excepções e contagens transitórias existem — confirma no texto AT/Código do IRS do teu ano. Não afirmamos a tua isenção.",
          bodyEn:
            "Per the same AT leaflet: gains/losses from disposal of crypto-assets that are not securities, held ≥365 days, are excluded from taxation (annex G1 as referred in the leaflet). Exceptions and transitional counting exist — confirm in the AT text/IRS Code for your year. We do not assert your exemption.",
        },
      ],
      sources: [
        {
          labelPt: "AT — Folheto «Criptoativos» (PDF)",
          labelEn: "AT — “Criptoativos” leaflet (PDF)",
          url: "https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/Folhetos_informativos/Documents/Criptoativos.pdf",
        },
        {
          labelPt: "Portal das Finanças",
          labelEn: "Portal das Finanças",
          url: "https://www.portaldasfinancas.gov.pt/",
        },
      ],
      uncertaintyPt:
        "O folheto AT é resumo e «não dispensa a leitura da legislação em vigor». Categorias (G / E / B), anexos (G, G1, J) e excepções mudam. Se a regra exacta para o teu facto não estiver clara para nós, dizemo-lo: valida com TOC e AT do ano relevante. Esta camada é a ponte educativa para um futuro módulo fiscal — não o motor.",
      uncertaintyEn:
        "The AT leaflet is a summary and “does not replace reading the law in force”. Categories (G / E / B), annexes (G, G1, J) and exceptions change. If the exact rule for your facts is unclear to us, we say so: validate with an accountant and AT docs for the relevant year. This lane is the educational bridge to a future tax module — not the engine.",
    },
    {
      id: "isencao",
      titlePt: "A regra dos 365 dias",
      titleEn: "The 365-day rule",
      asOf: "2026-09-11",
      bodyPt:
        "Segundo o folheto AT, o saldo entre mais e menos-valias de alienação onerosa de criptoactivos (que não sejam valores mobiliários) é tributado — mas quando a detenção for ≥365 dias, o regime prevê exclusão de tributação. Contam-se os dias entre aquisição e alienação. Atenção às condições: residente fiscal em Portugal, o activo não ser valor mobiliário, e não ser rendimento de actividade profissional — e a excepções previstas (ex.: rendimento associado à alienação, situações de offshore no cadeia de valor). O período de detenção anterior a 2023 conta para a regra (transição).",
      bodyEn:
        "Per the AT leaflet, the net balance of gains/losses from onerous disposal of crypto-assets (that are not securities) is taxed — but when held ≥365 days, the regime provides exclusion from taxation. Days run from acquisition to disposal. Mind the conditions: Portuguese tax residence, the asset not being a security, and it not being professional-activity income — plus foreseen exceptions (e.g., income tied to the disposal, offshore situations in the value chain). Holding periods before 2023 count (transition).",
      howToPt: [
        "Para cada posição, regista a data de aquisição — é ela que decide se passaste os 365 dias, não o preço.",
        "Se venderes várias tranches compradas em datas diferentes, aplica a regra a cada uma separadamente.",
        "Antes de assumir isenção: confirma as condições e excepções no folheto AT do ano da declaração.",
      ],
      howToEn: [
        "For each position, record the acquisition date — it decides whether you crossed 365 days, not the price.",
        "If you sell several tranches bought on different dates, apply the rule to each separately.",
        "Before assuming exemption: confirm conditions and exceptions in the AT leaflet for the filing year.",
      ],
      examples: [
        {
          titlePt: "Exemplo — duas vendas, dois resultados",
          titleEn: "Example — two sales, two outcomes",
          bodyPt:
            "Compras 0,1 BTC a 10 jan 2024. Venda A a 20 jan 2025: ≥365 dias → o regime prevê exclusão. Venda B a 15 nov 2024: <365 dias → mais-valia potencialmente tributável. Mesmo activo, mesmo preço — a data decide.",
          bodyEn:
            "You buy 0.1 BTC on Jan 10, 2024. Sale A on Jan 20, 2025: ≥365 days → the regime provides exclusion. Sale B on Nov 15, 2024: <365 days → potentially taxable gain. Same asset, same price — the date decides.",
        },
      ],
      sources: [
        {
          labelPt: "AT — Folheto «Criptoativos» (PDF)",
          labelEn: "AT — “Criptoativos” leaflet (PDF)",
          url: "https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/Folhetos_informativos/Documents/Criptoativos.pdf",
        },
        {
          labelPt: "Código do IRS — art. 10.º (mais-valias)",
          labelEn: "IRS Code — art. 10 (capital gains)",
          url: "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs10.aspx",
        },
      ],
      uncertaintyPt:
        "A exclusão de tributação tem condições e excepções que mudam por lei — nomeadamente o que conta como «valor mobiliário» e rendimentos associados. Não afirmamos a tua isenção: confirma com a AT/TOC no ano da declaração.",
      uncertaintyEn:
        "The exclusion has conditions and exceptions that change by law — notably what counts as a “security” and associated income. We do not assert your exemption: confirm with the AT/accountant in the filing year.",
    },
    {
      id: "swap",
      titlePt: "Trocas cripto↔cripto e stablecoins",
      titleEn: "Crypto↔crypto and stablecoin swaps",
      asOf: "2026-09-11",
      bodyPt:
        "O folheto AT distingue a permuta de criptoactivos da alienação onerosa: trocar um criptoactivo por outro não é, por si, a operação descrita para tributação de mais-valias — o valor de aquisição transporta-se para o activo recebido e só se apura quando houver alienação onerosa (por fiat, bens ou serviços). Isto difere de modelos noutros países (ex.: EUA), onde a permuta já tributa.",
      bodyEn:
        "The AT leaflet distinguishes crypto-asset swaps from onerous disposal: swapping one crypto-asset for another is not, by itself, the operation described for capital-gains taxation — the acquisition cost carries to the received asset and is only computed on an onerous disposal (for fiat, goods or services). This differs from models elsewhere (e.g., the US), where the swap already taxes.",
      howToPt: [
        "Regista cada troca com data, quantidades e valor EUR à data — o custo transporta-se e vais precisar dele quando venderes.",
        "Na dúvida se uma operação é permuta ou alienação (ex.: pagar um serviço em cripto), trata-a como alienação até confirmares.",
        "Na Carteira do CLAREZA podes exportar a actividade on-chain em CSV — matéria-prima para organizar o histórico.",
      ],
      howToEn: [
        "Log every swap with date, amounts and EUR value at the time — the cost carries over and you'll need it when you sell.",
        "When unsure whether an operation is a swap or a disposal (e.g., paying for a service in crypto), treat it as a disposal until confirmed.",
        "In CLAREZA's Wallet you can export on-chain activity as CSV — raw material to organise your history.",
      ],
      examples: [
        {
          titlePt: "Exemplo — cadeia de trocas",
          titleEn: "Example — a chain of swaps",
          bodyPt:
            "EUR→BTC→ETH→EUR: só a última perna (ETH→EUR) é a alienação onerosa apurada. As pernas BTC→ETH transportam custo. O detalhe de como contam os 365 dias numa cadeia de permutas é ponto a confirmar com a AT/TOC — não inventamos aqui.",
          bodyEn:
            "EUR→BTC→ETH→EUR: only the last leg (ETH→EUR) is the computed onerous disposal. The BTC→ETH legs carry cost basis. How the 365 days count across a swap chain is a point to confirm with the AT/accountant — we don't invent it here.",
        },
      ],
      sources: [
        {
          labelPt: "AT — Folheto «Criptoativos» (PDF)",
          labelEn: "AT — “Criptoativos” leaflet (PDF)",
          url: "https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/Folhetos_informativos/Documents/Criptoativos.pdf",
        },
      ],
      uncertaintyPt:
        "Stablecoins e tokens com características de valor mobiliário podem ter enquadramento distinto. Se a tua operação mistura pagamento, rendimento ou activo atípico, valida antes de assumir o tratamento de permuta.",
      uncertaintyEn:
        "Stablecoins and tokens with security-like features may have different treatment. If your operation mixes payment, income or an atypical asset, validate before assuming swap treatment.",
    },
    {
      id: "anexos",
      titlePt: "Onde entra no IRS (categorias e anexos)",
      titleEn: "Where it lands in the IRS (categories and annexes)",
      asOf: "2026-09-11",
      bodyPt:
        "O folheto AT organiza os rendimentos de criptoactivos por natureza do facto: alienação onerosa segue para o regime de mais-valias (Categoria G, com os quadros previstos nos anexos); rendimentos tipo remuneração/juros/rewards podem seguir para a Categoria E (rendimentos de capitais); e actividade exercida a título profissional/empresarial segue para a Categoria B. A categoria decide o anexo e a tributação — não é tudo «uma taxa de cripto».",
      bodyEn:
        "The AT leaflet organises crypto-asset income by the nature of the fact: onerous disposal follows the capital-gains regime (Category G, with the annex boxes foreseen); interest/reward-type income may fall under Category E (capital income); and activity carried out professionally/business-wise follows Category B. The category decides the annex and the tax — it is not all “one crypto rate”.",
      howToPt: [
        "Classifica cada operação pela natureza: venda (G), rendimento (E possível), actividade profissional (B possível).",
        "No Portal das Finanças, o anexo e quadro exactos são os do ano da declaração — usam-se os do folheto AT como mapa, não como substituto.",
        "Se tens várias naturezas misturadas (vendas + staking + mineração), organiza-as separadamente antes de preencher.",
      ],
      howToEn: [
        "Classify each operation by nature: sale (G), yield (possibly E), professional activity (possibly B).",
        "On Portal das Finanças, the exact annex and box are the filing year's — use the AT leaflet as a map, not a substitute.",
        "If you mix several natures (sales + staking + mining), organise them separately before filing.",
      ],
      examples: [
        {
          titlePt: "Exemplo — três factos, três caminhos",
          titleEn: "Example — three facts, three paths",
          bodyPt:
            "Vender BTC por euros → potencial Cat. G. Juros de um depósito de cripto → pode ser Cat. E. Mineração como profissão → pode ser Cat. B. O mesmo portfólio pode gerar três enquadramentos distintos — separar é metade do trabalho.",
          bodyEn:
            "Selling BTC for euros → potential Cat. G. Interest from a crypto deposit → possibly Cat. E. Mining as a profession → possibly Cat. B. The same portfolio can yield three different frameworks — separating is half the work.",
        },
      ],
      sources: [
        {
          labelPt: "AT — Folheto «Criptoativos» (PDF)",
          labelEn: "AT — “Criptoativos” leaflet (PDF)",
          url: "https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/Folhetos_informativos/Documents/Criptoativos.pdf",
        },
        {
          labelPt: "Portal das Finanças — IRS",
          labelEn: "Portal das Finanças — IRS",
          url: "https://www.portaldasfinancas.gov.pt/",
        },
      ],
      uncertaintyPt:
        "A fronteira entre Categorias (sobretudo E vs B em yields/staking, e quando uma actividade passa a «profissional») é das zonas menos literais do regime. Para volume relevante, TOC obrigatório — não classificamos casos concretos.",
      uncertaintyEn:
        "The border between categories (especially E vs B in yields/staking, and when an activity becomes “professional”) is among the least literal parts of the regime. For meaningful volume, an accountant is mandatory — we don't classify concrete cases.",
    },
    {
      id: "declarar",
      titlePt: "Como declarar (passo a passo)",
      titleEn: "How to file (step by step)",
      asOf: "2026-09-11",
      bodyPt:
        "A declaração de IRS entrega-se anualmente no Portal das Finanças, em regra entre abril e junho, relativa ao ano civil anterior. Para cripto, o essencial é chegar com o histórico organizado: cada alienação com data de aquisição, data de alienação e valores em euros. Sem histórico não há declaração fiável — e o histórico constrói-se durante o ano, não em março.",
      bodyEn:
        "The IRS return is filed annually on Portal das Finanças, generally between April and June, covering the previous calendar year. For crypto, the essential is arriving with organised history: each disposal with acquisition date, disposal date and values in euros. Without history there is no reliable return — and history is built during the year, not in March.",
      howToPt: [
        "Durante o ano: exporta CSV de cada exchange/wallet a cada trimestre; na Carteira do CLAREZA exportas actividade on-chain.",
        "Em março: consolida por activo e por data; separa alienações, permutas e rendimentos.",
        "Na declaração: segue o mapa do folheto AT para anexos/quadros do ano; quando o valor for material, um TOC revê antes de submeter.",
        "Guarda o arquivo com a declaração — a AT pode pedir comprovativos anos depois.",
      ],
      howToEn: [
        "During the year: export CSV from each exchange/wallet every quarter; in CLAREZA's Wallet you export on-chain activity.",
        "In March: consolidate by asset and date; separate disposals, swaps and income.",
        "At filing: follow the AT leaflet map for the year's annexes/boxes; when the amount is material, have an accountant review before submitting.",
        "Keep the archive with the return — the AT may request proof years later.",
      ],
      examples: [
        {
          titlePt: "Exemplo — a pasta do ano",
          titleEn: "Example — the year's folder",
          bodyPt:
            "Uma pasta por ano civil: extratos de exchanges (CSV), CSV on-chain da Carteira, notas de permutas, e um ficheiro consolidado por operação. Quando chega abril, declarar é transcrever — não reconstruir o ano de memória.",
          bodyEn:
            "One folder per calendar year: exchange statements (CSV), on-chain CSV from the Wallet, swap notes, and a consolidated file per operation. When April arrives, filing is transcribing — not rebuilding the year from memory.",
        },
      ],
      sources: [
        {
          labelPt: "Portal das Finanças — entrega do IRS",
          labelEn: "Portal das Finanças — IRS filing",
          url: "https://www.portaldasfinancas.gov.pt/",
        },
        {
          labelPt: "AT — Folheto «Criptoativos» (PDF)",
          labelEn: "AT — “Criptoativos” leaflet (PDF)",
          url: "https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/Folhetos_informativos/Documents/Criptoativos.pdf",
        },
      ],
      uncertaintyPt:
        "Prazos, anexos e campos variam por ano — e situações atípicas (mudança de residência fiscal, herança, grandes volumes) saem do âmbito desta faixa. Isto é orientação de organização, não instrução de preenchimento.",
      uncertaintyEn:
        "Deadlines, annexes and fields vary by year — and atypical situations (tax-residence change, inheritance, large volumes) are beyond this lane. This is organisational orientation, not filing instructions.",
    },
  ] satisfies PortugalSection[],
  links: [
    {
      labelPt: "CMVM — Criptoativos",
      labelEn: "CMVM — Crypto-assets",
      url: "https://www.cmvm.pt/",
    },
    {
      labelPt: "Banco de Portugal",
      labelEn: "Banco de Portugal",
      url: "https://www.bportugal.pt/",
    },
    {
      labelPt: "EUR-Lex — MiCA",
      labelEn: "EUR-Lex — MiCA",
      url: "https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32023R1114",
    },
    {
      labelPt: "Portal das Finanças",
      labelEn: "Portal das Finanças",
      url: "https://www.portaldasfinancas.gov.pt/",
    },
  ],
};
