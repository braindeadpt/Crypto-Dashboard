/**
 * Security/custody lane — educational orientation only, never advice.
 * Same discipline as portugal.ts: dated, sourced, uncertain when unsure.
 */

export type SegurancaSource = {
  labelPt: string;
  labelEn: string;
  url: string;
};

export type SegurancaExample = {
  titlePt: string;
  titleEn: string;
  bodyPt: string;
  bodyEn: string;
};

export type SegurancaSection = {
  id: "seed" | "entropia" | "metodos" | "guardar" | "nunca" | "recuperacao";
  titlePt: string;
  titleEn: string;
  /** ISO date — when this card was last reviewed for accuracy. */
  asOf: string;
  bodyPt: string;
  bodyEn: string;
  howToPt: string[];
  howToEn: string[];
  examples: SegurancaExample[];
  sources: SegurancaSource[];
  /** Explicit uncertainty — prefer this over a confident wrong claim. */
  uncertaintyPt?: string;
  uncertaintyEn?: string;
  /** Future media slots (videos etc.) — UI renders them when populated. */
  media?: { kind: "video"; url: string; labelPt: string; labelEn: string }[];
};

export type SegurancaQuizItem = {
  id: string;
  questionPt: string;
  questionEn: string;
  optionsPt: string[];
  optionsEn: string[];
  answerIndex: number;
  explainPt: string;
  explainEn: string;
};

export const SEGURANCA_CONTENT = {
  disclaimerPt:
    "Orientação educativa — não é aconselhamento de segurança, jurídico nem fiscal. Práticas e ferramentas evoluem; confirma sempre na documentação oficial da wallet que usas.",
  disclaimerEn:
    "Educational orientation — not security, legal or tax advice. Practices and tools evolve; always confirm in the official documentation of the wallet you use.",
  reviewedAt: "2026-09-11",
  sections: [
    {
      id: "seed",
      titlePt: "O que é uma seed phrase",
      titleEn: "What a seed phrase is",
      asOf: "2026-09-11",
      bodyPt:
        "Uma seed phrase (ou frase de recuperação) são 12 ou 24 palavras tiradas de uma lista fixa de 2048, definida pelo padrão BIP-39. Não é uma password: é a representação legível de um número muito grande — a entropia — de onde derivam todas as chaves privadas e endereços da carteira (árvore HD, BIP-32). A app ou o dispositivo são só janelas: a frase é a carteira. Quem a tem, tem os fundos; quem a perde, perde o acesso — não existe «recuperar password» nem suporte que a restaure.",
      bodyEn:
        "A seed phrase (or recovery phrase) is 12 or 24 words drawn from a fixed 2048-word list defined by the BIP-39 standard. It is not a password: it is the human-readable encoding of a very large number — the entropy — from which all of the wallet's private keys and addresses derive (HD tree, BIP-32). The app or device is just a window: the phrase is the wallet. Whoever holds it holds the funds; whoever loses it loses access — there is no “forgot password” and no support that can restore it.",
      howToPt: [
        "Ao criar uma carteira, escreve a frase em papel (ou aço) — nunca em formato digital.",
        "Confere palavra a palavra contra a lista oficial BIP-39; uma palavra trocada muda a carteira.",
        "Testa a recuperação num segundo dispositivo antes de depositar montantes sérios (ver «Testar e herdar»).",
        "Trata a frase como o bem mais sensível que tens: nem foto, nem cloud, nem email, nem chat.",
      ],
      howToEn: [
        "When creating a wallet, write the phrase on paper (or steel) — never in digital form.",
        "Check word by word against the official BIP-39 list; one swapped word means a different wallet.",
        "Test recovery on a second device before depositing serious amounts (see “Test and inherit”).",
        "Treat the phrase as the most sensitive asset you own: no photo, no cloud, no email, no chat.",
      ],
      examples: [
        {
          titlePt: "Exemplo — mudar de telemóvel",
          titleEn: "Example — changing phones",
          bodyPt:
            "Instalas a app no telemóvel novo, escolhes «restaurar» e digitas as 12 palavras: aparecem exactamente os mesmos endereços e saldos. Isto prova o ponto central — a seed é a carteira; o aparelho é substituível.",
          bodyEn:
            "You install the app on a new phone, choose “restore” and type the 12 words: the exact same addresses and balances appear. This proves the core point — the seed is the wallet; the device is replaceable.",
        },
      ],
      sources: [
        {
          labelPt: "BIP-39 — especificação oficial",
          labelEn: "BIP-39 — official specification",
          url: "https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki",
        },
        {
          labelPt: "BIP-32 — carteiras HD",
          labelEn: "BIP-32 — HD wallets",
          url: "https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki",
        },
      ],
      uncertaintyPt:
        "BIP-39 é o padrão dominante mas não universal: algumas wallets usam esquemas próprios (ex.: Electrum) ou SLIP-39/Shamir (família Trezor). Confirma o formato da tua wallet antes de assumir compatibilidade.",
      uncertaintyEn:
        "BIP-39 is the dominant standard but not universal: some wallets use their own schemes (e.g. Electrum) or SLIP-39/Shamir (Trezor family). Confirm your wallet's format before assuming compatibility.",
    },
    {
      id: "entropia",
      titlePt: "Entropia: o número por trás das palavras",
      titleEn: "Entropy: the number behind the words",
      asOf: "2026-09-11",
      bodyPt:
        "Cada palavra codifica 11 bits. Doze palavras = 128 bits de entropia mais 4 de checksum; vinte e quatro = 256 mais 8. Com 128 bits há cerca de 3,4×10³⁸ combinações — adivinhar por força bruta não é realista. O risco real está na geração: humanos são péssimos a produzir aleatoriedade (repetimos padrões, datas, palavras «óbvias»). A fonte correcta é um CSPRNG — um gerador de aleatoriedade criptográfica do sistema operativo ou do hardware da wallet.",
      bodyEn:
        "Each word encodes 11 bits. Twelve words = 128 bits of entropy plus 4 checksum bits; twenty-four = 256 plus 8. With 128 bits there are about 3.4×10³⁸ combinations — brute-force guessing is not realistic. The real risk is generation: humans are terrible at producing randomness (we repeat patterns, dates, “obvious” words). The right source is a CSPRNG — a cryptographic randomness generator from the operating system or the wallet hardware.",
      howToPt: [
        "Nunca inventes palavras nem uses «truques» humanos (datas, letras de músicas, padrões de teclado).",
        "Gera a seed dentro de uma wallet conhecida — software reputado ou hardware wallet.",
        "Se quiseres controlo máximo, usa o método de dados/moedas num computador offline (ver «Métodos»).",
        "Desconfia de qualquer site ou app que «gere uma seed por ti» online — esse é um padrão de roubo.",
      ],
      howToEn: [
        "Never invent words or use human “tricks” (dates, song lyrics, keyboard patterns).",
        "Generate the seed inside a known wallet — reputable software or a hardware wallet.",
        "For maximum control, use the dice/coin method on an offline computer (see “Methods”).",
        "Distrust any site or app that “generates a seed for you” online — that is a theft pattern.",
      ],
      examples: [
        {
          titlePt: "Exemplo — brainwallets",
          titleEn: "Example — brainwallets",
          bodyPt:
            "Frases «memoráveis» escolhidas por pessoas foram sistematicamente varridas por bots e esvaziadas. A lição: o que um humano acha aleatório, um computador encontra em segundos.",
          bodyEn:
            "“Memorable” phrases chosen by people were systematically scanned by bots and drained. The lesson: what a human finds random, a computer finds in seconds.",
        },
      ],
      sources: [
        {
          labelPt: "BIP-39 — wordlist e checksum",
          labelEn: "BIP-39 — wordlist and checksum",
          url: "https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki",
        },
      ],
      uncertaintyPt:
        "«Impossível de adivinhar» assume boa geração — já houve wallets reais com bugs de aleatoriedade (entropia fraca em implementações más). Daí preferir software e hardware auditados e estabelecidos.",
      uncertaintyEn:
        "“Impossible to guess” assumes good generation — real wallets have had randomness bugs (weak entropy in bad implementations). Hence preferring audited, established software and hardware.",
    },
    {
      id: "metodos",
      titlePt: "Métodos de criação",
      titleEn: "Generation methods",
      asOf: "2026-09-11",
      bodyPt:
        "Quatro caminhos honestos, do mais conveniente ao mais controlado. (a) Wallet de software: usa o CSPRNG do sistema operativo — rápida e gratuita, mas exposta a malware e a um ecrã comprometido. (b) Hardware wallet: a seed é gerada dentro do dispositivo e nunca sai dele — recomendada para montantes sérios. (c) Dados físicos + wordlist: ~50 lançamentos de um dado dão ~128 bits; converte-se para binário, aplica-se o checksum SHA-256 e mapeia-se para palavras — tudo num computador offline, sem rede. (d) Moedas: o mesmo princípio, 128/256 lançamentos, mais lento. Os métodos offline dão controlo total — e total responsabilidade por erros.",
      bodyEn:
        "Four honest paths, from most convenient to most controlled. (a) Software wallet: uses the operating system's CSPRNG — fast and free, but exposed to malware and a compromised screen. (b) Hardware wallet: the seed is generated inside the device and never leaves it — recommended for serious amounts. (c) Physical dice + wordlist: ~50 rolls of a die give ~128 bits; you convert to binary, apply the SHA-256 checksum and map to words — all on an offline computer, no network. (d) Coins: same principle, 128/256 flips, slower. Offline methods give total control — and total responsibility for mistakes.",
      howToPt: [
        "Montante sério → hardware wallet de marca estabelecida, comprada ao fabricante (nunca em revenda).",
        "Para aprender o mecanismo → usa o Instrumento de Entropia desta página (demonstração).",
        "Para controlo máximo → dados/moedas num computador air-gapped com ferramenta verificável (ex.: a página BIP-39 de Ian Coleman, descarregada e corrida offline).",
        "Qualquer que seja o método: a seed nunca toca num dispositivo ligado à internet depois de criada.",
      ],
      howToEn: [
        "Serious amount → established-brand hardware wallet, bought from the manufacturer (never resellers).",
        "To learn the mechanism → use the Entropy Instrument on this page (demonstration).",
        "For maximum control → dice/coins on an air-gapped computer with a verifiable tool (e.g. Ian Coleman's BIP-39 page, downloaded and run offline).",
        "Whatever the method: once created, the seed never touches an internet-connected device.",
      ],
      examples: [
        {
          titlePt: "Exemplo — o montante muda o método",
          titleEn: "Example — the amount changes the method",
          bodyPt:
            "€500 para aprender: uma software wallet conhecida chega. €50 000 de poupança: justifica hardware wallet, backup em aço e talvez multisig. Não há resposta única — há proporcionalidade.",
          bodyEn:
            "€500 to learn: a known software wallet is fine. €50,000 of savings: justifies a hardware wallet, steel backup and maybe multisig. There is no single answer — there is proportionality.",
        },
      ],
      sources: [
        {
          labelPt: "BIP-39 — processo de geração",
          labelEn: "BIP-39 — generation process",
          url: "https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki",
        },
        {
          labelPt: "Ian Coleman — ferramenta BIP-39 (usar offline)",
          labelEn: "Ian Coleman — BIP-39 tool (use offline)",
          url: "https://iancoleman.io/bip39/",
        },
      ],
      uncertaintyPt:
        "Nenhum método é «100% seguro» — cada um troca conveniência por exposição. O instrumento nesta página é didáctico: seeds geradas num browser ligado à internet não são para uso real.",
      uncertaintyEn:
        "No method is “100% safe” — each trades convenience for exposure. The instrument on this page is didactic: seeds generated in an internet-connected browser are not for real use.",
    },
    {
      id: "guardar",
      titlePt: "Guardar a frase",
      titleEn: "Storing the phrase",
      asOf: "2026-09-11",
      bodyPt:
        "Papel: barato e simples, mas morre com fogo, água e tempo. Aço/metal: grava-se ou estampa-se, resiste a desastres — o padrão quando o montante justifica. Memória: não é backup, é um ponto único de falha. Redundância geográfica (duas cópias em locais separados) protege mais do que uma cópia «muito bem escondida». A passphrase BIP-39 — a «25.ª palavra» — cria uma carteira completamente diferente sobre a mesma seed: protege contra roubo físico e dá negação plausível, mas perdê-la significa perder tudo; é para quem entende o trade-off. Para montantes maiores: SLIP-39/Shamir (partes m-de-n da frase) ou multisig (m-de-n chaves independentes).",
      bodyEn:
        "Paper: cheap and simple, but dies with fire, water and time. Steel/metal: stamped or engraved, survives disasters — the standard when the amount justifies it. Memory: not a backup, a single point of failure. Geographic redundancy (two copies in separate places) protects more than one “very well hidden” copy. The BIP-39 passphrase — the “25th word” — creates a completely different wallet on top of the same seed: it protects against physical theft and gives plausible deniability, but losing it means losing everything; it is for those who understand the trade-off. For larger amounts: SLIP-39/Shamir (m-of-n shares of the phrase) or multisig (m-of-n independent keys).",
      howToPt: [
        "Começa em papel; passa para aço quando o montante justificar o custo.",
        "Duplica geograficamente — duas cópias em locais separados > uma escondida.",
        "Nunca «guardes» a seed em ficheiro, app de notas ou gestor de passwords online.",
        "Passphrase só se conseguires explicar a outra pessoa o que acontece se a perderes.",
        "Multisig/Shamir quando um ponto único de falha já não é aceitável para o montante.",
      ],
      howToEn: [
        "Start on paper; move to steel when the amount justifies the cost.",
        "Duplicate geographically — two copies in separate places > one hidden.",
        "Never “store” the seed in a file, notes app or online password manager.",
        "Passphrase only if you can explain to someone else what happens if you lose it.",
        "Multisig/Shamir when a single point of failure is no longer acceptable for the amount.",
      ],
      examples: [
        {
          titlePt: "Exemplo — desastre físico",
          titleEn: "Example — physical disaster",
          bodyPt:
            "Incêndio ou inundação: a cópia em papel desaparece, a de aço sobrevive. Há casos reais documentados de fortunas perdidas em papel, discos e telemóveis — o backup é parte da carteira, não um extra.",
          bodyEn:
            "Fire or flood: the paper copy is gone, the steel one survives. There are documented real cases of fortunes lost on paper, hard drives and phones — the backup is part of the wallet, not an extra.",
        },
      ],
      sources: [
        {
          labelPt: "SLIP-39 — Shamir backup",
          labelEn: "SLIP-39 — Shamir backup",
          url: "https://github.com/satoshilabs/slips/blob/master/slip-0039.md",
        },
        {
          labelPt: "BIP-39 — passphrase",
          labelEn: "BIP-39 — passphrase",
          url: "https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki",
        },
      ],
      uncertaintyPt:
        "Seed única vs Shamir vs multisig: a escolha «certa» depende do montante, da tua disciplina e de quem precisa de herdar o acesso. Não há resposta universal — há análise de risco pessoal.",
      uncertaintyEn:
        "Single seed vs Shamir vs multisig: the “right” choice depends on the amount, your discipline and who needs to inherit access. There is no universal answer — there is personal risk analysis.",
    },
    {
      id: "nunca",
      titlePt: "O que nunca fazer",
      titleEn: "What never to do",
      asOf: "2026-09-11",
      bodyPt:
        "Regra absoluta: nenhum site, app, «validador», «sincronização» ou suporte legítimo pede a tua seed — quem pede está a roubar. Fotografias, cloud, email e chats entregam-na. Malware de clipboard troca endereços quando colas — confirma sempre os primeiros e últimos caracteres no ecrã do dispositivo. Address poisoning: golpistas enviam transações de valor zero a partir de endereços parecidos com os teus para poluírem o histórico e te fazerem copiar o errado. Aprovações de tokens (allowances) ilimitadas dão a contratos o poder de mover os teus fundos — revê e revoga regularmente.",
      bodyEn:
        "Absolute rule: no legitimate site, app, “validator”, “sync” or support asks for your seed — whoever asks is stealing. Photos, cloud, email and chats hand it over. Clipboard malware swaps addresses when you paste — always confirm the first and last characters on the device screen. Address poisoning: scammers send zero-value transactions from lookalike addresses to pollute your history and make you copy the wrong one. Unlimited token approvals (allowances) give contracts the power to move your funds — review and revoke regularly.",
      howToPt: [
        "A seed só entra num dispositivo durante recuperação de wallet — em mais nada, nunca.",
        "Ignora DMs e popups de «suporte»: suporte real nunca inicia contacto a pedir credenciais.",
        "Ao colar endereços, confirma início e fim — idealmente no ecrã da hardware wallet.",
        "Não copies destinos a partir do histórico de transações — escreve ou usa address book.",
        "Revê allowances periodicamente (ex.: revoke.cash) e revoga o que não usas.",
      ],
      howToEn: [
        "The seed only ever enters a device during wallet recovery — nothing else, ever.",
        "Ignore DMs and “support” popups: real support never reaches out asking for credentials.",
        "When pasting addresses, confirm start and end — ideally on the hardware wallet screen.",
        "Don't copy destinations from transaction history — type them or use an address book.",
        "Review allowances periodically (e.g. revoke.cash) and revoke what you don't use.",
      ],
      examples: [
        {
          titlePt: "Exemplo — «valida a tua wallet»",
          titleEn: "Example — “validate your wallet”",
          bodyPt:
            "Um site clone pede a seed para «sincronizar» ou «validar» a carteira. Quem cai vê os fundos esvaziados em minutos — a transacção é irreversível e anónima.",
          bodyEn:
            "A clone site asks for the seed to “sync” or “validate” the wallet. Those who fall see funds drained within minutes — the transaction is irreversible and anonymous.",
        },
      ],
      sources: [
        {
          labelPt: "CMVM — alertas a investidores",
          labelEn: "CMVM — investor alerts",
          url: "https://www.cmvm.pt/",
        },
        {
          labelPt: "revoke.cash — rever aprovações de tokens",
          labelEn: "revoke.cash — review token approvals",
          url: "https://revoke.cash/",
        },
      ],
    },
    {
      id: "recuperacao",
      titlePt: "Testar e herdar",
      titleEn: "Test and inherit",
      asOf: "2026-09-11",
      bodyPt:
        "O único teste que conta é restaurar: antes de depositar a sério, recupera a seed num segundo dispositivo ou app compatível e confirma que aparecem os mesmos endereços. Um backup nunca testado é uma esperança, não um plano. Herança: sem plano, os fundos morrem contigo — mas a seed não pode ir escrita num testamento nem num documento digital. O padrão é instruções seladas sobre onde está o backup e como o usar, sem revelar a frase em si.",
      bodyEn:
        "The only test that counts is restoring: before depositing serious amounts, recover the seed on a second compatible device or app and confirm the same addresses appear. An untested backup is a hope, not a plan. Inheritance: without a plan, funds die with you — but the seed cannot be written in a will or a digital document. The pattern is sealed instructions about where the backup is and how to use it, without revealing the phrase itself.",
      howToPt: [
        "Recovery drill: restaura num dispositivo de ensaio com montante pequeno antes de confiar.",
        "Documenta para a família onde está o backup e como o usar — sem incluir a frase no documento.",
        "Para património sério: considera multisig com co-signatários ou serviços dedicados de herança.",
        "Reve o plano uma vez por ano — wallets, contactos e circunstâncias mudam.",
      ],
      howToEn: [
        "Recovery drill: restore on a practice device with a small amount before trusting it.",
        "Document for family where the backup is and how to use it — without including the phrase.",
        "For serious wealth: consider multisig with co-signers or dedicated inheritance services.",
        "Review the plan once a year — wallets, contacts and circumstances change.",
      ],
      examples: [
        {
          titlePt: "Exemplo — duas famílias",
          titleEn: "Example — two families",
          bodyPt:
            "Família A sabe que existe aço no cofre X e instruções seladas na gaveta Y. Família B só sabe que «ele tinha bitcoins». A diferença entre recuperar e perder tudo é este documento — não a tecnologia.",
          bodyEn:
            "Family A knows there is steel in safe X and sealed instructions in drawer Y. Family B only knows “he had bitcoins”. The difference between recovering and losing everything is this document — not the technology.",
        },
      ],
      sources: [
        {
          labelPt: "BIP-39 — recuperação de wallet",
          labelEn: "BIP-39 — wallet recovery",
          url: "https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki",
        },
      ],
      uncertaintyPt:
        "Soluções de herança cripto evoluem depressa e a legislação sucessória varia — valida a abordagem actual com um profissional antes de a considerar fechada.",
      uncertaintyEn:
        "Crypto inheritance solutions evolve fast and succession law varies — validate the current approach with a professional before considering it settled.",
    },
  ] satisfies SegurancaSection[],
  quiz: [
    {
      id: "support-dm",
      questionPt: "Recebes uma DM do «suporte» da tua wallet: para resolver um problema precisam que envies a tua seed phrase.",
      questionEn: "You get a DM from your wallet's “support”: to fix an issue they need you to send your seed phrase.",
      optionsPt: [
        "Envio — se é o suporte oficial, precisam dela",
        "Nunca envio — suporte legítimo não pede a seed",
        "Envio só as primeiras 6 palavras, por segurança",
      ],
      optionsEn: [
        "Send it — official support needs it",
        "Never send it — legitimate support doesn't ask for the seed",
        "Send only the first 6 words, to be safe",
      ],
      answerIndex: 1,
      explainPt:
        "Nenhum suporte legítimo pede a seed — nem parcial. Quem a recebe controla a carteira inteira; seis palavras já revelam parte do segredo.",
      explainEn:
        "No legitimate support asks for the seed — not even partially. Whoever receives it controls the whole wallet; six words already leak part of the secret.",
    },
    {
      id: "history-copy",
      questionPt: "Vês no histórico uma transacção de um endereço quase igual ao da tua exchange habitual. Como envias o próximo depósito?",
      questionEn: "Your history shows a transaction from an address almost identical to your usual exchange. How do you send the next deposit?",
      optionsPt: [
        "Copio do histórico — é o mesmo contacto",
        "Confirmo só os primeiros e últimos caracteres",
        "Verifico o endereço completo ou uso o address book — nunca copio do histórico",
      ],
      optionsEn: [
        "Copy it from history — it's the same contact",
        "Check only the first and last characters",
        "Verify the full address or use the address book — never copy from history",
      ],
      answerIndex: 2,
      explainPt:
        "Address poisoning: golpistas enviam transacções de valor zero de endereços com pontas iguais às do teu contacto real. As pontas não chegam — confirma o meio.",
      explainEn:
        "Address poisoning: scammers send zero-value transactions from addresses whose ends match your real contact. The ends aren't enough — check the middle.",
    },
    {
      id: "airdrop-sync",
      questionPt: "Um site pede a seed phrase para «sincronizar» a carteira antes de um airdrop que expira em 10 minutos.",
      questionEn: "A site asks for the seed phrase to “sync” your wallet before an airdrop that expires in 10 minutes.",
      optionsPt: [
        "Introduzo — o airdrop expira e não quero perder",
        "Recuso — a seed nunca entra em sites",
        "Introduzo, mas num browser separado",
      ],
      optionsEn: [
        "Enter it — the airdrop expires and I don't want to miss out",
        "Refuse — the seed never goes into websites",
        "Enter it, but in a separate browser",
      ],
      answerIndex: 1,
      explainPt:
        "A urgência é a ferramenta do golpista. Nenhum airdrop ou sincronização precisa da seed — assinaturas de wallet bastam, e mesmo essas pedem leitura cuidada.",
      explainEn:
        "Urgency is the scammer's tool. No airdrop or sync needs the seed — wallet signatures suffice, and even those deserve careful reading.",
    },
    {
      id: "store-seed",
      questionPt: "Qual é a forma correcta de guardar uma seed phrase de longo prazo?",
      questionEn: "What's the correct way to store a seed phrase long term?",
      optionsPt: [
        "Fotografia guardada na cloud, bem organizada",
        "Ficheiro encriptado no computador",
        "Papel ou aço, em dois locais físicos separados",
      ],
      optionsEn: [
        "A well-organised photo in the cloud",
        "An encrypted file on the computer",
        "Paper or steel, in two separate physical locations",
      ],
      answerIndex: 2,
      explainPt:
        "Formato digital = superfície de ataque (cloud leaks, malware, backups esquecidos). Papel/aço offline em dois locais resiste a desastre e a hack.",
      explainEn:
        "Digital format = attack surface (cloud leaks, malware, forgotten backups). Offline paper/steel in two places survives disaster and hacking.",
    },
  ] satisfies SegurancaQuizItem[],
  links: [
    {
      labelPt: "BIP-39 — especificação",
      labelEn: "BIP-39 — specification",
      url: "https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki",
    },
    {
      labelPt: "SLIP-39 — Shamir",
      labelEn: "SLIP-39 — Shamir",
      url: "https://github.com/satoshilabs/slips/blob/master/slip-0039.md",
    },
    {
      labelPt: "Ian Coleman — ferramenta BIP-39 (offline)",
      labelEn: "Ian Coleman — BIP-39 tool (offline)",
      url: "https://iancoleman.io/bip39/",
    },
    {
      labelPt: "CMVM",
      labelEn: "CMVM",
      url: "https://www.cmvm.pt/",
    },
  ],
};
