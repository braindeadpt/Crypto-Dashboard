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
  id: "mica" | "cmvm" | "custody" | "tax";
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
    "Orientação educativa — não é aconselhamento jurídico nem fiscal. Confirma sempre com fontes oficiais e, quando relevante, com um TOC/jurista. Regras mudam.",
  disclaimerEn:
    "Educational orientation — not legal or tax advice. Always verify with official sources and, when relevant, an accountant/lawyer. Rules change.",
  reviewedAt: "2026-07-25",
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
