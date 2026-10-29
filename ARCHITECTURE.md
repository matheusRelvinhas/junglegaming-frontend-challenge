# Arquitetura: Kurio

Este documento atende ao README §12. Ele cobre os contratos REST e os eventos, a política de sessão, o estado do carrinho, a estratégia de cache, a reconciliação REST × Socket.IO, as limitações, as decisões de UX e os desvios do Figma. Para rodar o projeto, veja o [README.md](README.md).

## 1. Visão geral

```
Navegador
├── React 19 + TanStack Router (rotas, search params na URL)
│     └── páginas → hooks do TanStack Query (src/services/*) → Axios (src/services/api.ts)
│                                                                   │  HTTP /api/*
│     └── useRealtimeUpdates → socket.io-client ──── WebSocket wss://realtime.kurio.test
│                                                                   │
└── MSW (src/mocks) ── Service Worker intercepta o REST ◄──────────┘
                    └─ interceptor de WebSocket + @mswjs/socket.io-binding (servidor Socket.IO simulado)
                    └─ "banco" do mock no localStorage (kurio:mock-*)
```

| Camada | Onde | Responsabilidade |
| --- | --- | --- |
| Rotas | `src/router.tsx` | Árvore de rotas, validação dos search params (filtros, `?auth=`, `?redirect=`, `?order=`, `?tab=`), `staticData` (título mobile, "Mercado" ativo). Só a Início vai no bundle inicial; as outras páginas carregam sob demanda (`lazyRouteComponent`). |
| Estado global de UI | `src/context/AppContext.ts` + `AppProvider.tsx` | `isMobile`, busca, carrinho, cupom, favoritos, sessão (token + usuário), mudanças de preço em tempo real e a mensagem do `aria-live`. |
| Estado do servidor | `src/services/*.ts` | Hooks do TanStack Query: `nfts`, `auth`, `checkout`, `account` e o cliente de tempo real `realtime`. |
| HTTP | `src/services/api.ts` | `axiosGet` e `axiosPost`, os únicos pontos de saída REST. Normalizam o erro em `ApiError { status, message, field?, code? }`. |
| Contratos | `src/types/api.ts`, `src/types/mock.ts` | Tipos únicos usados pelo transporte, pelos mocks, pela UI e pelos testes. |
| Mocks | `src/mocks/*` | Handlers REST, servidor Socket.IO, estado persistido, cenários e painel de dev. Componentes, hooks e Axios não contêm dados fictícios. |
| Testes | `tests/` | Playwright E2E e regressão visual ([tests/README.md](tests/README.md)). |
| Auditoria | `lighthouse/`, `scripts/lighthouse.ts` | Lighthouse com mediana de 3 execuções ([lighthouse/README.md](lighthouse/README.md)). |

**Como cada tecnologia da stack obrigatória participa:**
- **TanStack Router:** rotas, search params tipados, proteção dos fluxos privados (com `LoginRequired` + `?redirect=`) e lazy loading.
- **TanStack Query:** todas as leituras e mutations, cache, otimismo e invalidação.
- **Axios:** todo o REST.
- **Socket.IO:** `socket.io-client` real, com o servidor simulado pelo MSW.
- **Tailwind v4:** todo o estilo, com tokens em `@theme`.
- **MSW:** REST e WebSocket.
- **Playwright:** E2E e testes visuais.
- **Lighthouse:** auditoria.
- **shadcn/ui:** ver Limitações (§9).

## 2. Contratos REST

Base `/api`. As rotas privadas recebem `Authorization: Bearer <token>`. Corpo de erro: `{ message, field?, code? }`. O `field` aponta o campo do formulário (as mesmas chaves do corpo enviado) e o `code` identifica o caso. Valores em ETH sempre como **string decimal**.

### Sessão e conta (`src/mocks/auth.ts`, `src/services/auth.ts`)

| Método e rota | Corpo | Respostas |
| --- | --- | --- |
| `POST /auth/register` | `{ name, email, password }` | `201 { user }` · `409 { field: 'email' }` e-mail em uso · `422` campos vazios |
| `POST /auth/login` | `{ email, password }` | `200 { token, user }` · `401` credenciais inválidas |
| `GET /auth/session` | — | `200 { user }` · `401` sessão expirada (8 h) ou inválida |
| `POST /auth/logout` | — | `200 { ok: true }` |

### Catálogo (`src/mocks/handlers.ts`, `src/services/nfts.ts`)

| Método e rota | Parâmetros | Respostas |
| --- | --- | --- |
| `GET /list_nfts` | `search`, `collection`, `network`, `min_price`, `max_price`, `sort` (`price-asc`, `price-desc`, `name`; padrão "listados recentemente"), `page` (9 por página), `top_nft` | `200 ListNftsResponse { items, page, page_size, total, total_pages, facets }` · `503` (cenário de falha) |
| `GET /nft_info/:id` | — | `200 NftInfo` (detalhe + `editions[{ id, label, available }]`) · `404` · `503` |
| `GET /banners` | — | `200 Banner[] { title, description, img_url }` · `503` |
| `GET /coupon/:code` | — | `200 { code, discount_percent }` · `404` inválido · `410` expirado |

### Cotação e pedidos (`src/mocks/checkout.ts`, `src/services/checkout.ts`)

| Método e rota | Corpo | Respostas |
| --- | --- | --- |
| `POST /quote` | `{ items[{ nft_id, edition, quantity }], coupon_code }` | `200 Quote { quote_id, lines[], warnings[], coupon, coupon_error, subtotal, discount, network_fee, total }`. A quantidade é limitada ao estoque e a edição esgotada sai das linhas com aviso. O `quote_id` é um hash do conteúdo: mesmos valores, mesmo id. |
| `POST /wallet/connect` | `{ provider, network }` | `200 { provider, network, address }` · `403 WALLET_REJECTED` · `401` |
| `POST /orders` (header `Idempotency-Key`) | `{ items, coupon_code, quote_id, network, wallet_provider, profile }` | `201 Order` (pendente) · mesma chave e mesmo corpo → `200` com o mesmo pedido · mesma chave e outro corpo → `409 IDEMPOTENCY_CONFLICT` · cotação mudou → `409 QUOTE_CHANGED` · nada disponível → `409 AVAILABILITY_CONFLICT` · `422 { field }` · `401 SESSION_EXPIRED` |
| `GET /orders` | — | `200 Order[]` do usuário |
| `GET /orders/:id` | — | `200 Order` · `404` inexistente ou de outro usuário |

`Order { id, status: 'pending'|'confirmed'|'declined', version, created_at, lines, subtotal, discount, network_fee, total, network, wallet_provider, wallet_address, tx_hash, decline_reason }`.

O pedido é um **snapshot** das linhas e dos totais da cotação: mudanças posteriores no catálogo não alteram o recibo. O mock liquida o pedido 3s depois de criado (o horário fica salvo e é reagendado após F5). Confirmado e recusado são estados terminais.

### Perfil, carteiras e favoritos (`src/mocks/account.ts`, `src/services/account.ts`)

| Método e rota | Corpo | Respostas |
| --- | --- | --- |
| `GET /profile` · `POST /profile` | `Profile { name, email, username, ens_name, wallet_nickname, avatar_url }` | `200 Profile` · `200 { profile, user }` · `422 { field }` · `409 { field: 'email' }` |
| `POST /profile/password` | `{ current_password, new_password }` | `200` · `422 { field: 'current_password' \| 'new_password' }` |
| `GET /wallets` · `POST /wallets` | `Wallets { primary, secondary, secondary_same_as_primary }` | `200 Wallets` · `422 { field: 'primary.address' … }` |
| `GET /favorites` | — | `200 { nft_ids }` |
| `POST /favorites/:nftId` | `{ is_favorite }` | `200 { nft_ids }` · `404` · `503` (cenário de falha) |

**Erros cobertos (README §5):** validação (`422`), sessão inválida (`401`), falta de permissão (`403` na carteira; pedido de outro usuário responde `404` para não revelar que existe), recurso inexistente (`404`), conflito de disponibilidade ou cotação (`409`) e falha transitória (`503`).

## 3. Eventos (Socket.IO)

**Transporte:** o `socket.io-client` conecta em `wss://realtime.kurio.test` só por WebSocket. O MSW intercepta com `ws.link()` e o `@mswjs/socket.io-binding` faz o papel de servidor (`src/mocks/realtime.ts`).

**Servidor → cliente:**

```ts
type NftUpdatedEvent = {
  eventId: string; type: 'nft.updated'; resource: { type: 'nft'; id: number }
  version: number; occurredAt: string
  data: { price: string; editions: { id: string; available: number }[] }
} // para todas as conexões

type OrderUpdatedEvent = {
  eventId: string; type: 'order.updated'; resource: { type: 'order'; id: string }
  version: number; occurredAt: string
  data: { status: 'pending' | 'confirmed' | 'declined'; tx_hash: string | null; decline_reason: string | null }
} // só para as conexões do dono do pedido
```

**Cliente → servidor:**
- `session:join(token | null)`: enviado ao conectar, ao reconectar e quando a sessão muda. O servidor associa a conexão ao usuário, e assim o `order.updated` de um usuário nunca chega a outro.
- **Comandos de demonstração e teste**, enviados pelo mesmo socket, nunca alterando a UI direto:
  - `mock:nft-action(nftId, 'price-up' | 'price-down' | 'sell-out' | 'restock')`;
  - `mock:reset-market`;
  - `mock:replay-last-event` (duplicata);
  - `mock:send-stale-event` (versão antiga);
  - `mock:drop-connection`.

**Origem dos eventos:** o estado de mercado (preço, estoque e `version` por NFT) vive em `kurio:mock-market`. Os handlers REST leem desse mesmo estado. Toda mudança (painel, compra confirmada, reset) incrementa a `version` e publica o evento. Por isso REST e socket nunca divergem.

## 4. Política de sessão

- **Login:** o mock devolve um token aleatório. O app guarda **só o token** (`kurio:session`) e lê o usuário por `useSession` (`['session', token]`, `staleTime: Infinity`, sem retry).
- **Senhas:** o mock guarda só `SHA-256("<VITE_PASSWORD_SALT>:<senha>")` (Web Crypto). Nunca em texto.
- **Sessão no F5:** o token no localStorage é revalidado no `GET /auth/session`. Uma resposta `401` (sessão expirada após 8 h, ou expirada pelo painel) descarta o token automaticamente.
- **Rotas privadas:** Pagamento e Perfil (carteiras, pedidos, favoritos) mostram `LoginRequired`. O login abre como modal pela URL (`?auth=login&redirect=<url atual>`); depois de entrar, `history.replace(redirect)` volta ao mesmo ponto do fluxo, e a entrada do modal sai do histórico.
- **Expiração no meio do pagamento:** um `401` na carteira ou no pedido abre o login **sem desmontar a página**. O formulário preenchido é mantido e a compra continua após o login.
- **Logout e troca de usuário:** chamam `POST /auth/logout`, apagam o token e removem do cache **toda query cuja chave contém o token** (sessão, perfil, carteiras, pedidos, pedido, favoritos). O socket envia `session:join(null)` e para de receber eventos privados. O catálogo público continua em cache.

## 5. Estado do carrinho

- **Onde vive:** no Context (`cartItems`, `addToCart`, `updateCartQuantity`, `removeFromCart`), persistido em `kurio:cart` como `{ nft_id, edition, quantity }[]`. Funciona para visitantes e **sobrevive ao login** (os itens do visitante continuam no mesmo navegador).
- **Disponibilidade:** o detalhe limita a quantidade a `available − já no carrinho`. No carrinho, o stepper vai até o estoque da edição. Se o estoque cair abaixo do que está no carrinho (por `nft.updated`), aparece um aviso e só o disponível entra no total.
- **Cupom:** fica no Context (`kurio:coupon`). É validado em `GET /coupon/:code` e revalidado pela cotação no pagamento.
- **Totais:**
  - **Carrinho:** calculados no front com `big.js` (subtotal, desconto, taxa estimada `0.016`).
  - **Pagamento:** vêm da cotação da API (`POST /quote`), que é a referência para criar o pedido. Ver Limitações.
- **Depois da compra:** `removePurchasedItems(order)` tira **só as quantidades compradas** e limpa o cupom, uma única vez por pedido (`kurio:settled-orders`, que impede descontar de novo após F5). Recusa ou erro não mexem no carrinho.
- **Tentativa de compra:** a chave de idempotência e o corpo ficam em `kurio:checkout-attempt` até haver resposta. Assim, depois de um timeout ou F5, "Recuperar compra" reenvia a mesma tentativa.

## 6. Estratégia de cache (TanStack Query)

**Padrão global** (`src/main.tsx`): `staleTime: 30s`, `retry: 1`, `refetchOnWindowFocus: false`.

| Query / mutation | Chave | Política |
| --- | --- | --- |
| Catálogo | `['list_nfts', params]` | `keepPreviousData` (sem piscar ao paginar ou filtrar). O `signal` do Axios cancela a requisição velha quando os filtros mudam (respostas fora de ordem são descartadas). |
| Detalhe | `['nft_info', id]` | Sem retry em `404`. Reaproveitado pelo carrinho e pela lista de interesse. |
| Banners | `['banners']` | Padrão. |
| Sessão | `['session', token]` | `staleTime: Infinity`, sem retry. `401` descarta o token. |
| Cotação | `['quote', body]` | `keepPreviousData`. Desligada enquanto há pedido pendente ou confirmado (o resumo passa a ser o do pedido). Invalidada a cada `nft.updated` novo. |
| Criar pedido | mutation | Retry **só sem resposta** (timeout ou rede), 1 vez, **com a mesma `Idempotency-Key`**. Timeout de 6s. |
| Pedido | `['order', token, id]` | Atualizado pelo `order.updated`. Polling de 4s **só enquanto pendente**, como rede de segurança. Retry só em falha de rede. |
| Pedidos (Atividade) | `['orders', token]` | Invalidado a cada `order.updated`. |
| Perfil e carteiras | `['profile', token]`, `['wallets', token]` | As mutations gravam a resposta no cache (`setQueryData`). Salvar o perfil também atualiza `['session', token]`, e o nome no header muda na hora. |
| Favoritos | `['favorites', token]` | **Atualização otimista com rollback:** `onMutate` aplica na hora; `onError` volta ao estado anterior e refaz o GET (o clique pode ter cancelado a primeira busca); `onSuccess` usa a lista devolvida pelo POST. |

- **Isolamento por usuário:** toda chave privada leva o token, e o logout remove todas elas.
- **Isolamento por parâmetros:** as chaves incluem os parâmetros da consulta.

**Retry de infraestrutura (`src/services/api.ts`):** se a resposta não for JSON, a requisição escapou do MSW (o Service Worker foi encerrado pelo navegador e o servidor devolveu HTML ou 404). Nesse caso o interceptor reconecta o MSW (`worker.stop()` + `start()`, uma reconexão compartilhada entre as requisições) e repete a requisição **uma vez**.

## 7. Reconciliação REST × Socket.IO

O cliente (`src/services/realtime.ts`, `useRealtimeUpdates` no `AppProvider`) trata cada evento assim:

1. **Duplicata:** `eventId` já visto é ignorado (efeitos não são reaplicados).
2. **`nft.updated`:**
   - Se o NFT está no cache e a `version` do evento é ≤ à do cache, o evento é ignorado. Assim um evento antigo não regride um estado mais novo.
   - Se é novo:
     - aplica preço e estoque em `['nft_info', id]` e em todas as `['list_nfts', …]`;
     - marca as listas como desatualizadas, porque filtros de preço e facetas podem mudar;
     - invalida a cotação;
     - registra a mudança de preço para o selo "Atualizado", o aviso do carrinho e o `aria-live`.
   - Se o NFT **ainda não está no cache** (página carregando), invalida `['nft_info', id]` para buscar de novo, em vez de perder a mudança.
3. **`order.updated`:** aplica `status`, `tx_hash` e `decline_reason` em `['order', …]` quando a versão é maior e invalida `['orders', …]`.
4. **Reconexão:** ao reconectar, o cliente reenvia `session:join` e invalida `list_nfts`, `nft_info`, `quote` e `order` ativos. O que mudou enquanto estava desconectado vem do REST. Um pedido pendente que foi liquidado durante a queda aparece pelo `GET /orders/:id` (e pelo polling).
5. **Ciclo de vida:** o socket é criado no `AppProvider` e desconectado no unmount. O logout troca a sessão associada ao socket.

**Entre abas:** cada aba tem seu servidor mock, e os eventos publicados numa aba chegam às outras por `BroadcastChannel('kurio:mock-realtime')`.

## 8. Mocks

- **Ativação:** `VITE_ENABLE_MOCKS=true`, inclusive no build publicado. O app só renderiza depois do `worker.start()`, para nenhuma requisição escapar.
- **"Banco" persistido no localStorage:**
  - `kurio:mock-users` e `kurio:mock-sessions`;
  - `kurio:mock-market`;
  - `kurio:mock-orders`;
  - `kurio:mock-wallets` e `kurio:mock-favorites`;
  - `kurio:mock-scenario`.
- **Fixtures** em `src/mocks/data/*.json`: 30 NFTs, detalhes, cupons, banners e endereços de carteira.
- **Cenários** (painel de dev ou `kurio:mock-scenario`):
  - carteira aprova ou recusa;
  - pagamento confirma, recusa ou dá timeout;
  - favoritos salvam ou falham;
  - rede normal ou lenta;
  - leituras funcionam ou falham (503);
  - respostas fora de ordem;
  - expirar sessão.
- **Reset:** "Restaurar preços e estoques" no painel; o reset completo apaga os dados do site (ver README).

## 9. Limitações conhecidas

| Limitação | Detalhe |
| --- | --- |
| **shadcn/ui não adotado** | A stack do README pede shadcn/ui. Os componentes foram escritos à mão com Tailwind; o slider de preço usa o `@radix-ui/react-slider` (a mesma base do Slider do shadcn) e os tokens de cor seguem a convenção do shadcn (`primary`, `accent` = fundo de hover etc.). Nenhum componente foi gerado pelo CLI do shadcn. **Pendência.** |
| Carrinho só no front | O README pede o recurso Carrinho na API (consulta, inclusão, alteração e remoção). Aqui o carrinho vive no localStorage (Context). Os itens do visitante são preservados após o login porque ficam no mesmo navegador, mas não há sincronização entre dispositivos. |
| Totais do carrinho no front | A página do carrinho calcula subtotal, desconto e taxa com `big.js`. O pagamento usa a cotação da API (`POST /quote`), que é a referência para o pedido. Migrar o carrinho para `useQuote` remove a diferença. |
| Reset completo manual | O painel restaura preços e estoques. Os demais dados (usuários, pedidos, carteiras, favoritos) voltam ao cenário das fixtures apagando os dados do site. |
| MSW e Service Worker | O Chrome encerra Service Workers ociosos, e o worker reiniciado esquece a aba. Tratado com reconexão e um retry no Axios (§6). O `worker.start()` gera uma rejeição inofensiva no F5, filtrada no `main.tsx`. |
| Socket.IO no MSW | (1) O binding 0.2.0 declara só MSW 2; um `overrides` no `package.json` aceita o MSW 3, e funcionou em teste. (2) O `engine.io-client` guarda o `WebSocket` ao carregar, então o `socket.io-client` é importado dinamicamente depois do `worker.start()`. (3) No MSW 3, o `ws.link` só casa pelo host, daí o host fictício exclusivo. (4) O binding anuncia ping de 25s mas não envia; o mock envia o ping do Engine.IO a cada 25s, senão o cliente cai por timeout. (5) Cada aba tem seu servidor; `BroadcastChannel` sincroniza. |
| Favoritos por POST | `POST /favorites/:id { is_favorite }` no lugar de `PUT`/`DELETE`, porque todo o REST passa por `axiosGet`/`axiosPost`. |
| Formato de erro | `{ message, field?, code? }`, mais simples que o `{ error: { code, message, fields } }` proposto no início do projeto. |
| Segurança de demonstração | O token fica no localStorage e o sal (`VITE_PASSWORD_SALT`) vai para o bundle. Aceitável para um mock, não para produção. |
| Lighthouse mobile | Performance de 80–84 no mobile, contra a meta de 90: a camada de mocks (~460 KB de JS e o registro do Service Worker) roda antes da primeira tela. Análise em [lighthouse/README.md](lighthouse/README.md). |
| Baselines visuais só do Windows | O Linux quebra linhas de texto de outro jeito que o Windows. As baselines são `*-win32.png`, e no CI os testes visuais rodam num job `windows-latest` (os E2E rodam no Ubuntu). Em Linux ou macOS, rode só os E2E. |
| Catálogo sem abas | "Novos lançamentos" e "Em alta" não foram implementados. "Listados recentemente" usa a ordem das fixtures (não há `created_at`), e não há preço riscado (`previous_price`). |

## 10. Decisões de UX

- **Login e cadastro num só modal, aberto pela URL** (`?auth=login|signup`) em qualquer página e tamanho. Fechar ou entrar mantém o usuário no ponto do fluxo; com `?redirect=`, leva ao destino. Login social e "Esqueceu a senha?" ficam desabilitados ("Em breve"), sem simular sucesso.
- **Pagamento:**
  - **Revisão:** a primeira cotação é a "revisada". Se o preço, o estoque ou o cupom mudarem, um aviso mostra o valor antigo e o novo, e o botão vira "Confirmar com novos valores".
  - **Estados:** pendente (formulário bloqueado, "Pode recarregar a página"), recusado (motivo + "Seus itens continuam no carrinho" + "Tentar novamente") e confirmado (recibo em modal).
  - **Sem resposta:** "Recuperar compra" reenvia a mesma tentativa.
  - **Campos opcionais:** "Endereço da carteira" e "Código de indicação" ficaram opcionais. Com o endereço vazio, o pedido usa a carteira conectada. As carteiras cadastradas no perfil preenchem o formulário.
- **Tempo real visível e acessível:** o preço alterado pisca e ganha o selo "Atualizado" (ícone + texto); o carrinho mostra "O preço de X mudou de A para B ETH"; um `aria-live` anuncia cada mudança. A edição que esgota mostra "ESGOTADO".
- **Favoritos exigem conta:** deslogado, o coração abre o login. Com sessão, a mudança é otimista e volta com mensagem de erro se a API falhar.
- **Carrossel de banners:** troca a cada 6s, pausa com mouse ou foco em cima e não troca sozinho com "reduzir movimento". Os pontos são clicáveis, e o ativo vira pílula (não depende só da cor).
- **Acessibilidade:**
  - foco preso nos diálogos (Tab circula dentro deles) e devolvido ao botão de origem;
  - erros ligados aos campos (`aria-describedby`) e foco no primeiro campo inválido;
  - skeletons com `aria-busy` e shimmer que respeita "reduzir movimento";
  - estados sempre com ícone + texto.
- **Fora do escopo com comportamento coerente:** Criadores, Aprenda, newsletter, Ofertas, Arquivos baixados e Suporte ficam desabilitados com "Em breve". "Ver no Etherscan" fica desabilitado com o aviso de transação simulada.
- **Painel de dev** (só com mocks): dispara eventos e escolhe cenários, para demonstrar à mão tudo o que os testes cobrem.

## 11. Desvios do Figma

| Desvio | Motivo |
| --- | --- |
| Ícones do Iconify (Basil, Solar, logos, token-branded, simple-icons) no lugar dos SVGs soltos | Mesmo estilo "curved"; registrados localmente a partir de `@iconify-json/*` (sem chamar a API) |
| Fonte Roboto Mono | Deduzida do render (zero cortado); hospedada localmente (`@fontsource-variable`) |
| Cores de sucesso, aviso e info | Não existem no Figma; propostas no mesmo tom, para os estados não desenhados |
| Artes recortadas do PNG do Figma, servidas em WebP | Não havia export dos assets; o WebP reduz o peso (banner de 436 KB → 24 KB) |
| Login e cadastro sem abas, com o layout do frame mobile também no desktop | Um só componente e fluxo pela URL; o desktop mantém o modal de 500px com a barra laranja |
| Banner da Início no mobile com título e descrição limitados (reticências) | Altura fixa (sem deslocar o catálogo, CLS) e mais perto do card compacto do frame mobile |
| `h1` da Início só para leitores de tela | O título visível do banner troca a cada 6s; os títulos dos banners são `h2` |
| "Ordenar por" como `select` | Comportamento acessível e padrão do navegador; as abas do catálogo ficaram de fora (§9) |
| Pagamento: campos "Endereço da carteira" e "Código de indicação" opcionais | Decisão de produto: o endereço vem da carteira conectada; o código de indicação não é necessário para comprar |
| Carteiras com campos reduzidos (apelido, rede, endereço, tipo) | O frame repete o formulário inteiro do pagamento |
| Perfil, Carteiras e Confirmação no mobile | Sem frame no Figma: no perfil, um cartão com avatar + abas roláveis; a confirmação é o mesmo modal do desktop, adaptado |
| Card do grid sem nome no Figma | Recebeu "Golden Frequency #071 · 0.59 ETH", tirado do frame de login |
| Rótulo da newsletter "E-mail para a newsletter" (oculto) | Evita dois campos com o mesmo nome acessível "E-mail" na mesma página |
