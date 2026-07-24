## Summary

-

## Test plan

- [ ] `npm run lint` e `npm run typecheck` passam
- [ ] `npm run build` passa
- [ ] `npm run test:e2e` passa (ou CI verde)
- [ ] Smoke manual no browser: Board + 1 desk alterado

## Auditoria (obrigatória se UI / copy / rotas mudarem)

- [ ] **PT-PT**: rótulos correctos (ex.: Blockchains, não “Cadeias”); sem gíria desalinhada do tom operacional
- [ ] **Estrutura**: um propósito por secção; nav coherente; sem páginas mortas no fluxo principal
- [ ] **Densidade**: board legível em desktop; overflow/scroll horizontal da nav OK em mobile
- [ ] **Estados**: loading / erro / sem dados não partem o layout
- [ ] **Fontes**: números sensíveis etiquetados (estimativa, fonte, actualização)
- [ ] **EN**: strings novas também em `messages/en.json` quando aplicável
