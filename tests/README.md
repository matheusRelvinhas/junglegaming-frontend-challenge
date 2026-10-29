# Testes E2E (Playwright)

Os testes rodam contra o **build de produção com os mocks ligados** (`vite build --mode test` + `vite preview`, variáveis em `.env.test`). O REST passa pelos handlers do MSW e o tempo real pelo `socket.io-client` até o servidor Socket.IO simulado no MSW. Os testes não usam `page.route` nem mexem no cache.

## Comandos

| Comando | O que faz |
|---|---|
| `npx playwright install chromium` | Instala o navegador (uma vez) |
| `npm run test:e2e` | Faz o build, sobe o preview e roda tudo (desktop + mobile) |
| `npm run test:e2e -- --project=desktop` | Só o desktop |
| `npm run test:e2e:ui` | Modo interativo do Playwright |
| `npm run test:e2e:report` | Abre o relatório HTML (`playwright-report/`) |
| `npm run test:e2e:update-snapshots` | Regera as baselines visuais |

Traces e capturas das falhas ficam em `test-results/` (`npx playwright show-trace <arquivo>.zip`). No CI (`.github/workflows/e2e.yml`) os dois vão como artefatos.

## Projetos

- **desktop**: Chromium em 1440×900, toda a suíte.
- **mobile**: Pixel 7 (Chromium), só os testes marcados `@principal` (fluxos principais) e `@visual`.

## Estado isolado e cenários

Cada teste roda num contexto novo do navegador: o localStorage começa vazio, e o "banco" do mock volta às fixtures. O cenário do MSW é escolhido por teste com `test.use({ scenario: { ... } })`. Ele é gravado antes de a página abrir, na mesma chave que o painel de dev usa (`kurio:mock-scenario`):

| Cenário | Valores |
|---|---|
| `latency` | `normal` · `slow` (+2s em toda resposta REST) |
| `reads` | `success` · `fail` (catálogo, detalhe e banners respondem 503) |
| `catalogOrder` | `in-order` · `out-of-order` (a busca por Música demora 1,5s) |
| `payment` | `confirm` · `decline` · `timeout` (a resposta atrasa 8s depois de criar o pedido) |
| `wallet` | `approve` · `reject` |
| `favorites` | `success` · `fail` |

Os eventos em tempo real são disparados por comandos que passam pelo socket (`window.__kurioMock.sendCommand`, que só existe com os mocks ligados):
- `mock:nft-action`: preço ±10%, esgotar ou repor uma edição;
- `mock:replay-last-event`: reenvia o último evento, com o mesmo `eventId`;
- `mock:send-stale-event`: reenvia um evento com versão antiga;
- `mock:drop-connection`: o servidor derruba o socket.

Nos cenários sensíveis a tempo, a latência é a do mock (determinística) e os testes esperam respostas e requisições específicas, não tempos arbitrários.

## Cobertura do README (§9)

| # | Exigência | Arquivo |
|---|---|---|
| 1 | Busca, filtros combinados, ordenação, paginação, histórico (e respostas fora de ordem) | `e2e/catalog.spec.ts` |
| 2 | Acesso direto ao detalhe e recurso inexistente (e edição esgotada, limite de quantidade) | `e2e/nft-detail.spec.ts` |
| 3 | Cadastro, login, expiração de sessão, logout e troca de usuário | `e2e/auth.spec.ts` |
| 4 | Favoritos, falha de mutation e recuperação (otimista com rollback) | `e2e/account.spec.ts` |
| 5 | Carrinho, quantidades, remoção, cupom, persistência após refresh/login | `e2e/cart.spec.ts` |
| 6 | Compra completa, do catálogo ao recibo confirmado | `e2e/checkout.spec.ts` |
| 7 | Falha de pagamento, clique repetido, timeout com recuperação do mesmo pedido | `e2e/checkout.spec.ts` |
| 8 | Perfil, avatar, senha e carteiras com erros de validação | `e2e/account.spec.ts` |
| 9 | Preço/disponibilidade via Socket.IO durante o checkout | `e2e/realtime.spec.ts` |
| 10 | Eventos duplicados ou antigos, desconexão, retomada de pedido pendente | `e2e/realtime.spec.ts` |
| 11 | Teclado, foco de diálogos e validação de formulários | `e2e/accessibility.spec.ts` |
| 12 | Skeletons com rede lenta, falha e "Tentar novamente" | `e2e/loading.spec.ts` |
| — | Regressão visual: início, detalhe, carrinho e pagamento (desktop e mobile) | `visual/screens.spec.ts` |

## Regressão visual

As baselines ficam em `visual/__screenshots__/<projeto>/` e são versionadas. É **uma baseline só para Windows e Linux**: a comparação aceita até 3% de pixels diferentes (antialias de fonte muda entre sistemas). A tela é estabilizada antes da captura:
- dados limpos do mock;
- `reducedMotion: 'reduce'`, que para o carrossel e as animações;
- fontes e ícones locais;
- espera pelas imagens.

Mudou o layout de propósito? Rode `npm run test:e2e:update-snapshots`, confira as imagens e versione-as.

Os seletores usam papel e nome acessível (`getByRole`, `getByLabel`). Quando o teste não acha um elemento pelo nome, há um problema de acessibilidade a corrigir.
