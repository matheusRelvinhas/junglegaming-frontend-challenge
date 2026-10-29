# CONTEXT.md: Kurio NFT Marketplace

> Documento-guia do projeto. Junta o enunciado ([README.md](README.md)) com a análise do layout ([figma-imgs/Frontend Challenge.png](figma-imgs/Frontend%20Challenge.png)) e as decisões já tomadas.
> **Leia antes de qualquer tarefa.** Atualize sempre que uma decisão mudar.

---

## 1. Resumo

Desafio frontend: implementar o **Kurio**, um marketplace de NFTs em React + TypeScript, fiel ao Figma, com desktop e mobile. Os fluxos cobertos são descoberta, compra e conta do colecionador. Não existe backend real: **toda API REST e todo evento em tempo real são simulados com MSW**. Isso inclui Socket.IO via `@mswjs/socket.io-binding`.

- Figma oficial: https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1
- Idioma da UI: **pt-BR**. Moeda: **ETH**, sempre como string decimal.
- Marca: **KURIO** (no texto corrido, "Kurio").
- O deploy é obrigatório (Vercel recomendada), com mocks e tempo real funcionando no build publicado.

### Andamento

| # | Passo | Status |
|---|---|---|
| 1 | Analisar README + Figma | ✅ |
| 2 | Protótipo HTML ("figma navegável") + design system | ✅ [design/prototype.html](design/prototype.html) |
| 3 | Este arquivo de contexto | ✅ |
| 4a | Base: Tailwind v4 + tema (`global.css`), Context API (`isMobile`), `layout.tsx`, alias `@/`, TS strict | ✅ |
| 4b | TanStack Router, TanStack Query, Axios (`axiosGet`/`axiosPost`), MSW, Iconify, Playwright (instalado) | ✅ |
| 4c | shadcn, Socket.IO, config do Playwright/Lighthouse | ⏳ (Socket.IO ✅: `socket.io-client` + `@mswjs/socket.io-binding`) |
| 7a | **Início**: layout mobile/desktop, busca, filtros (modal no mobile, slider de preço), ordenação (`?sort=`), catálogo paginado `list_nfts`, destaque, carrossel de banners, footer | ✅ (faltam as abas "Novos lançamentos / Em alta") |
| 7b | **Detalhe do NFT**: `nft_info`, galeria/zoom, edições com estoque, quantidade, COMPRAR (carrinho no Context), favoritar (localStorage), "Mais desta coleção", 404 | ✅ |
| 7c | **Carrinho** (`/cart`): itens do localStorage, quantidade/remoção, cupom (`KURIO10`/`EXPIRADO`), totais com `big.js`, "Colecionadores também viram" | ✅ ("Conectar e finalizar" ainda sem ação) |
| 7d | **Login e cadastro**: modal único (`?auth=login` / `?auth=signup`) em mobile e desktop, API mock com hash de senha, sessão que sobrevive ao F5, logout | ✅ |
| 5 | Tema (tokens → Tailwind) + componentes base | ⏳ |
| 6 | Camada de dados: contratos, fixtures, handlers MSW, cenários | ⏳ |
| 7 | Telas: Início → Detalhe → Carrinho → Auth → Checkout → Confirmação → Perfil/Carteiras | ⏳ |
| 7f | **Perfil** (`/account?tab=`): Dados do perfil (avatar, senha), Carteiras (usadas no pagamento), Atividade (compras), Lista de interesse (favoritos por usuário, otimista); Ofertas/Arquivos/Suporte desabilitados; mobile próprio | ✅ |
| 7e | **Pagamento + Confirmação** (`/checkout`): formulário do colecionador, cotação revalidada (`/api/quote`), carteira com conexão/recusa/desconexão, pedido idempotente (`/api/orders`), pendente/confirmado/recusado, recibo em modal | ✅ |
| 8 | Tempo real (nft.updated / order.updated) + reconciliação | ✅ (`nft.updated` e `order.updated`, com painel de dev) |
| 9 | Testes Playwright (E2E + visual) | ✅ [tests/](tests/README.md): 9 arquivos E2E por tela + regressão visual, desktop e mobile, CI no GitHub Actions |
| 10 | Lighthouse, documentação (README da solução + ARCHITECTURE.md), deploy | ⏳ (Lighthouse ✅: `npm run lighthouse`, [lighthouse/README.md](lighthouse/README.md); desktop 100 em Performance, mobile 80–84 justificado; WebP, páginas sob demanda, CLS e robots.txt corrigidos) |

> O ritmo é **um passo de cada vez, com calma**. Não adiante etapas sem o usuário pedir.

> **Estilo de código**: simples e fácil de entender, nomes que descrevem a lógica, poucos comentários (só quando o porquê não é óbvio). Laços só sobre arrays reais com `.map`/`.filter`/`.find`/`.forEach` (`range()`/`unique()` em `src/utils/array.ts` quando não há dados), sem `reduce`/`flatMap`/`Map`/`Object.fromEntries` quando houver forma mais direta. Tags semânticas mantidas onde têm função (exigência do README); `<div>`/`<span>` no resto. Detalhes no `CLAUDE.md`.

---

## 2. Stack

### Obrigatória (README §2). Cada uma precisa participar de verdade da solução.

| Responsabilidade | Tecnologia | Observação |
|---|---|---|
| UI | React 19 | já instalado |
| Linguagem | TypeScript ~5.9 | `strict` |
| Build | Vite 8 | já instalado (escolha livre) |
| Rotas | TanStack Router | rotas, search params tipados, guards |
| Estado remoto | TanStack Query | queries, mutations, cache, otimista |
| HTTP | Axios | **toda** chamada REST passa por ele |
| Tempo real | socket.io-client | os eventos **precisam** chegar pelo cliente socket |
| Estilo | Tailwind CSS (v4, `@tailwindcss/vite`) | tokens em `@theme` |
| Componentes | shadcn/ui | adaptados à identidade Kurio |
| Mocks | MSW + `@mswjs/socket.io-binding` | ativado por env, também no build de demo |
| E2E / visual | Playwright | Chromium, desktop + mobile, baselines versionadas |
| Auditoria | Lighthouse | Início e Detalhe, mobile + desktop, 3 execuções (mediana) |

### Complementares (decididas)

| Uso | Lib |
|---|---|
| Estado global de UI | **Context API**: um único `src/context/AppContext.ts` concentra o que é global (constantes, tipos, contexto, hook `useAppContext`); o provider fica em `AppProvider.tsx`. Hoje guarda `isMobile`. Dados do servidor ficam no TanStack Query, não no contexto. |
| Fonte | `@fontsource-variable/roboto-mono` (local, importada em `main.tsx`) |
| Ícones | **`@iconify/react`**, com acesso a todas as coleções de https://icon-sets.iconify.design/ (ver §5) |
| Formulários | `react-hook-form` + `zod` (+ `@hookform/resolvers`), integrados ao `Form` do shadcn |
| Decimal ETH | `big.js` ou `decimal.js-light`. **Nunca** `number` para dinheiro. |
| Toasts | `sonner` (componente do shadcn) |
| Carrossel | `embla-carousel-react` (Carousel do shadcn) |

> **Ícones locais (feito)**: `npm run icons` (`scripts/generate-icons.ts`) gera `src/constants/icon-data.json` só com os ícones do mapa `ICONS`, a partir dos pacotes `@iconify-json/*` (dev). O `main.tsx` registra com `addCollection`: o app não chama a API do Iconify (testes offline, visual estável, Lighthouse). Mudou o mapa `ICONS`? Rode `npm run icons`.
>
> Sobre ícones: **`react-icons`** e **`@iconify/react`** são bibliotecas diferentes. A escolha foi o Iconify (`<Icon icon="basil:search-outline" />`), porque dá acesso a todas as coleções do icon-sets.iconify.design. Para não depender da API do Iconify em runtime (Lighthouse e offline), registre os ícones usados localmente com `addCollection`/`addIcon`, a partir de `@iconify-json/<prefix>`, ou use o plugin `unplugin-icons`.

---

## 3. Arquivos de referência

| Arquivo | O que é |
|---|---|
| [README.md](README.md) | Enunciado completo, fonte da verdade dos **comportamentos** |
| [figma-imgs/Frontend Challenge.png](figma-imgs/Frontend%20Challenge.png) | Export de todos os frames (8000×7453, **escala 1:1** com o Figma) |
| [figma-imgs/Desktop/](figma-imgs/Desktop/) · [figma-imgs/Mobile/](figma-imgs/Mobile/) | SVGs exportados (search, shop, user, X, arrow-down, message), que definiram o estilo dos ícones |
| [design/prototype.html](design/prototype.html) | **Protótipo navegável**: as 9 telas desktop, as 6 mobile, a aba **Fundamentos** (cores, defaults, tipografia, espaçamento, raios, ícones) e a aba **Componentes** (padrões repetidos + estados propostos). Abra direto no navegador. |
| [design/assets/](design/assets/) | Artes dos NFTs recortadas do PNG (250–450 px). Para produção, **exportar do Figma em 2× (WebP/AVIF)**. |

Posições dos frames no PNG (x, y, largura): Início `0,0,1440` · Detalhe `1640,0` · Carrinho `3276,0` · Pagamento `4912,0` · Confirmação `6553,0` · Login (modal sobre Início) `0,3900` · Cadastro `1640,3900` · Perfil `3276,3900` · Carteiras `4912,3900` · Mobile (6 frames de ~414 px) a partir de `0,6553`.

---

## 4. Design tokens

Extraídos por amostragem de pixel. Viram CSS variables do tema shadcn/Tailwind.

### Cores

| Token | Hex | Uso |
|---|---|---|
| `bg` | `#140D0A` | fundo da página |
| `surface` | `#241612` | painéis, cards, sidebar, modais, footer, linhas do carrinho |
| `surface-2` | `#2C1B14` | cards elevados (mobile) |
| `surface-3` | `#38220F` | faixa central do footer, input da newsletter, chip de carteiras |
| `border` | `#432C1A` | bordas, divisores, inputs |
| `cream` | `#F5F1EB` | texto principal |
| `sand` | `#CFB28C` | texto secundário / descrições |
| `khaki` | `#B39463` | placeholder / preço antigo |
| **`accent`** (primária) | **`#D28A4C`** | CTAs, preços, item ativo, foco, links |
| `accent-2` | `#B8733D` | fim do gradiente dos botões pill no mobile |
| `on-accent` | `#140D0A` | texto sobre a primária |
| `danger` | `#E5664A` | asterisco obrigatório, erro, recusado |
| `success` *(proposto)* | `#7FB77E` | pedido confirmado |
| `warning` *(proposto)* | `#E0B04C` | preço alterado, pedido pendente |
| `info` *(proposto)* | `#9DB8C7` | informativo |

**No código** ([src/styles/global.css](src/styles/global.css)), os nomes seguem a convenção do shadcn e viram classes Tailwind via `@theme inline`:

| Classe | Valor | Observação |
|---|---|---|
| `bg-background` / `text-foreground` | `#140D0A` / `#F5F1EB` | aplicadas no `body` |
| `bg-primary` / `text-primary` / `border-primary` | `#D28A4C` | **o laranja da marca é `primary`** |
| `text-primary-foreground` | `#140D0A` | texto sobre a primária |
| `bg-primary-dark` | `#B8733D` | fim do gradiente mobile (`from-primary to-primary-dark`) |
| `bg-surface` / `bg-surface-2` / `bg-surface-3` | `#241612` / `#2C1B14` / `#38220F` | `card`, `popover`, `muted` e `secondary` são aliases |
| `text-sand` / `text-khaki` | `#CFB28C` / `#B39463` | `text-muted-foreground` = sand |
| `text-gray` | `#9A928B` | cinza quente para dados secundários (ex.: e-mail do usuário); contraste ~5,6:1 sobre `surface` |
| `border-border` / `border-input` / `outline-ring` | `#432C1A` / `#432C1A` / primary | |
| `text-destructive` / `text-success` / `text-warning` / `text-info` | estados | |
| `bg-accent` | `#38220F` | ⚠️ no shadcn, `accent` é o **fundo de hover**, não a cor da marca |

Também no tema: `font-sans` (Roboto Mono), breakpoint único `desktop:` (1040px), raios `rounded-sm/md/lg/xl/2xl` = 4/8/12/16/24px e tipografia `text-display`, `text-h1`, `text-h2`, `text-price`, `text-h3`. **O tema é só escuro**: o Figma não tem modo claro.

### Tipografia

**Roboto Mono** em toda a UI (pesos 400/500/600/700). O zero cortado do Figma confirma essa fonte; ainda assim, vale validar no arquivo Figma. A paginação usa Roboto. Hospede as fontes localmente (`@fontsource/roboto-mono`) por performance. Letter-spacing base: `.04em`.

| Token | Spec | Exemplo |
|---|---|---|
| `display` | 44px / 70px · 700 · `.06em` · UPPER | "SEJA DONO DO FUTURO" |
| `h1` | 28px · 700 | título do NFT |
| `h2` | 26px · 700 | "Diário da Cunhagem" |
| `price-lg` | 22px · 700 · accent | preço no detalhe |
| `h3` | 18px · 600 | "Coleções", "Resumo da carteira" |
| `title` | 16–17px · 700 | títulos de card/feature |
| `body-lg` | 15–16px · 400 | nav, labels, filtros |
| `body` | 14px / 24px · 400 · sand | descrições |
| `caption` | 12px / 16px | meta do blog, "Taxa estimada" (11px) |
| `micro` | 8.5px · 700 · UPPER | chip "METAMASK • WALLETCONNECT • COINBASE" |

### Layout, espaço e raios

- Desktop: frame de 1440 → **container de 1200 px** (margens de 120). Mobile: frame de ~414 (testar em 390), gutter de 24 px.
- **Mobile first.** O estilo base (sem prefixo) é o mobile; o desktop sobrescreve com o prefixo **`desktop:`** (≥ 1040px, `--breakpoint-desktop` no `global.css`). Ex.: `text-h1 desktop:text-display`.
- **Mobile = largura < 1040px**, o mesmo corte do `desktop:`: é o `isMobile` do `useAppContext()` (`MOBILE_BREAKPOINT` em `AppContext.ts`). Use o `isMobile` só para trocar **estrutura/componentes** (Header × TabBar, Dialog × página). Ajuste visual vai em classe `desktop:`, não em ternário com `isMobile`. Tablet (768) usa o layout mobile.
- **Breakpoint único**: só existe `desktop:` (1040px, em `px`). Os breakpoints padrão do Tailwind foram removidos (`--breakpoint-*: initial`), porque misturar `px` e `rem` quebra a ordem das media queries.
- **Container**: o `Layout` usa o `container` nativo do Tailwind + `mx-auto px-6` (100% no mobile, máx. 1040px no desktop). Sem lógica de container no `global.css`.
- **Unidades**: `rem` só para tamanho de texto; espaçamento, raio, largura e breakpoint em `px`.
- Larguras de avaliação do README: **390 · 768 · 1440**. Teste em 390 com o Playwright: o Chrome headless força viewport mínima de 500px.
- Espaço base 4 px: `4 8 12 16 20 24 32 40 48 64 96`. As seções da home são separadas por ~96 px.
- Raios: `sm 4` (botões/inputs) · `md 8` (blog, thumbs) · `lg 12` (imagem do card) · `xl 16` (imagens grandes, cards mobile) · `2xl 24` (hero) · `pill` (chips, botões mobile).
- Modal: fundo `surface` + **barra inferior accent de 10 px**, X em accent, overlay `rgba(20,13,10,.55)`.
- Foco: outline 2px accent, offset 2px. Disabled: `opacity .5`.

---

## 5. Ícones (Iconify)

Os SVGs do Figma seguem o estilo **"curved"** (traço preenchido, cantos arredondados). A coleção mais fiel é a **Basil**, completada por outras. Pode misturar coleções. Todos os nomes abaixo foram **validados na API do Iconify**. O mapa também existe no protótipo (`const ICONS`) e na aba *Fundamentos*, onde dá para copiar com um clique.

| Semântico | Iconify | Semântico | Iconify |
|---|---|---|---|
| search / zoom | `basil:search-outline` | heart / heart-fill | `basil:heart-outline` / `basil:heart-solid` |
| cart (header) | `basil:shopping-cart-outline` | plus / minus (stepper) | `ic:round-plus` / `ic:round-minus` |
| cart-solid (tab bar) | `basil:shopping-cart-solid` | trash | `basil:trash-outline` |
| user / user-outline | `basil:user-solid` / `basil:user-outline` | eye-off (senha) | `basil:eye-closed-outline` |
| login / logout | `basil:login-outline` / `basil:logout-outline` | star | `basil:star-solid` |
| home | `basil:home-solid` | mail / share | `basil:envelope-outline` / `basil:share-outline` |
| x (fechar) | `basil:cross-outline` | edit / copy | `basil:edit-outline` / `basil:copy-outline` |
| chevron ↓ → ← | `basil:caret-{down,right,left}-outline` | filter | `solar:tuning-2-linear` |
| arrow-right | `basil:arrow-right-outline` | scan (FAB mobile) | `solar:scanner-linear` |
| menu / sort / more | `basil:menu-outline` / `basil:sort-outline` / `basil:other-1-outline` | refresh | `solar:refresh-linear` |
| carteiras (menu) | `basil:location-outline` | ofertas | `solar:graph-up-linear` |
| arquivos baixados | `basil:download-outline` | suporte / alerta | `solar:danger-triangle-linear` |
| avatar placeholder | `basil:image-outline` | wallet | `basil:wallet-outline` |
| cupom | `solar:sale-linear` | lock / shield | `basil:lock-outline` / `solar:shield-check-linear` |
| check / info | `basil:check-outline` / `basil:info-circle-outline` | pendente / recusado | `basil:clock-outline` / `basil:cancel-outline` |
| offline | `solar:cloud-cross-linear` | recibo | `basil:invoice-outline` |
| facebook / twitter / linkedin / youtube | `basil:{facebook,twitter,linkedin,youtube}-solid` | instagram | `basil:instagram-outline` |
| Google / Facebook (botões sociais) | `logos:google-icon` / `logos:facebook` | MetaMask / Coinbase | `token-branded:metamask` / `token-branded:coinbase` |
| WalletConnect | `simple-icons:walletconnect` | Ethereum / Polygon / Solana | `token-branded:{ethereum,polygon,solana}` |

Regra de a11y: ícone decorativo leva `aria-hidden`; botão só com ícone **sempre** tem `aria-label`.

---

## 6. Telas (inventário do Figma)

> No Figma, "Login" e "Cadastro" desktop são **modais sobre a Início** (abas "Entrar | Criar conta"); no mobile são páginas cheias. Perfil, Carteiras e Confirmação **não têm frame mobile**, mas precisam funcionar em mobile.

### Rotas propostas (TanStack Router)

| Rota | Tela | Auth | Search params |
|---|---|---|---|
| `/` | Início (catálogo) | — | `q, collection[], network[], minPrice, maxPrice, sort, tab, page` |
| `/nft/$nftId` | Detalhe | — | `edition` |
| `/cart` | Carrinho | — (visitante pode) | — |
| `/checkout` | Pagamento | ✅ | — |
| `/orders/$orderId` | Confirmação / recibo | ✅ | — |
| `/login` · `/signup` | Auth (Dialog sobre Início no desktop; página no mobile) | — | `redirect` |
| `/account/profile` | Perfil | ✅ | — |
| `/account/wallets` | Carteiras | ✅ | — |
| `*` | 404 | — | — |

### Desktop

**Header (global)**: `KURIO` à esquerda; nav central `Início · Mercado · Criadores · Aprenda` (ativo em accent com sublinhado de 3 px); busca, carrinho com badge de contagem e botão "Entrar" (accent + ícone). Borda inferior `border`. Altura ~75 px.

**Início**
- Hero: "Bem-vindo à Kurio" + H1 "SEJA DONO DO FUTURO / DA ARTE DIGITAL" + parágrafo + botão EXPLORAR; imagem de 450×450 (raio 24) à direita; dots de carrossel.
- Catálogo: sidebar de 310 px (Coleções com contagens, Faixa de preço com slider duplo "Preço: 0,02 – 12,30 ETH" + Aplicar, Rede) + card "NFT EM DESTAQUE / OFERTA LIMITADA". Ao lado: abas `Todos os NFTs | Novos lançamentos | Em alta`, "Ordenar por: Listados recentemente ▾", **grid de 3 colunas** de NftCard e paginação `1 2 3 4 >` alinhada à direita.
- NftCard: caixa `surface` 258×300 com imagem 1:1 (raio 12), nome 16px e preço 17px/700 accent. Variantes: tag **RARO**, preço antigo riscado (khaki), **hover** com 3 ações (carrinho, favoritar, ver).
- 2 banners promocionais (imagem à esquerda, texto à direita + "Explorar →").
- "Diário da Cunhagem": 4 BlogCards. Página editorial **fora do escopo**: o link "Ler mais" não pode fingir sucesso.
- Footer: 3 features (círculos W/C/D) + newsletter; faixa `surface-3` com KURIO, slogan, e-mail e telefone; 4 colunas de links (Meu perfil, Central de ajuda, Coleções, Redes sociais + chip de carteiras); copyright.

**Detalhe**: breadcrumb; 4 thumbs de 100 px; galeria de 444 px com botão zoom; título, preço, estrelas e "19 avaliações"; "Sobre este NFT"; **chips de Edição** (1/1, 1/10, 1/50, ABERTA); **stepper** de quantidade; COMPRAR + Favoritar (outline); ID do token, coleção, atributos, compartilhar. Abas "Detalhes do NFT | Avaliações (19)"; "Mais desta coleção" (carrossel de 5 + dots outline).

**Carrinho**: tabela `NFTs | Preço | Edições | Total` com linhas `surface` de 70 px (thumb, nome, ID, stepper pequeno, total accent, lixeira). Resumo de 332 px: código promocional + Aplicar, Subtotal, Desconto do lançamento, Taxa de rede ("Taxa estimada"), **Total** accent, "Conectar e finalizar", "Continuar explorando". Rail "Colecionadores também viram".

**Pagamento**: form em 2 colunas, "Perfil do colecionador": Nome de exibição*, Nome de usuário*, Rede* (select), Nome do perfil*, Endereço da carteira* (0x) + ENS/secundária (opcional), Tipo de carteira* (select), Código de indicação*, E-mail*, Nome ENS* (.eth), radio "Usar outra carteira?" e textarea de observação (opcional). Coluna de 405 px "Seus NFTs" (linhas com `(x qtd)` e subtotal), "Tem um código promocional? Aplique aqui", totais, **Carteira e rede** (radio cards: chip, MetaMask, Coinbase Wallet) e "Confirmar compra".

**Confirmação** (modal de 578 px): ícone "THANK YOU", "Seus NFTs agora estão na sua carteira"; faixa com ID da transação · Data · Total · Carteira; detalhes da transação (NFTs, Edições, Subtotal); taxa de rede, total, nota "Transação confirmada na Ethereum…" e "Ver no Etherscan" (link simulado).

**Login / Cadastro** (modal de 500 px): abas "Entrar | Criar conta"; inputs; olho na senha; "Esqueceu a senha?" (fora do escopo, comportamento coerente); botão principal; "Ou continue com" Google/Facebook (fora do escopo: não pode aparentar sucesso).

**Perfil**: SideMenu de 310 px (Dados do perfil, Carteiras, Atividade, Lista de interesse, Ofertas, Arquivos baixados, Suporte, Sair), com item ativo marcado por barra accent de 6 px. Form: Nome de exibição*, Nome de usuário*, E-mail*, Nome ENS* (.eth + input), Apelido da carteira*, **Avatar** (Alterar / Remover), **Alterar senha** (atual, nova, confirmar), Salvar.

**Carteiras**: "Carteira principal" + "Adicionar" com o mesmo form de carteira do pagamento + "Salvar carteira"; "Carteira secundária" com estado vazio, radio "Igual à carteira principal" + Adicionar.

### Mobile (6 frames)

1. **Início**: busca pill "Explorar coleções" + botão de filtro; hero em card gradiente "SEJA DONO DA CULTURA DIGITAL"; abas; grid de 2 colunas escalonado (masonry) com favoritar no card e tag RARO; **tab bar** inferior (home, favoritos, FAB central, carrinho, perfil).
2. **Detalhe**: botões redondos (voltar, favoritar); imagem; sheet arredondado com título, rating pill "★ 4.8 (19)", descrição, edição e meta; barra inferior com Qtd + preço, "Comprar NFT" (pill gradiente) e botão de carrinho.
3. **Carrinho**: cards de 100 px (nome, edição, preço, stepper); sheet inferior com cupom pill, totais e "Conectar e finalizar".
4. **Pagamento**: "Carteira conectada" + "Trocar carteira"; cards de carteiras cadastradas (Reserva `nova.kurio.eth`/Polygon, Principal `0xA91F…E82C`/Ethereum); "Carteira e rede" (WalletConnect, MetaMask, Coinbase Wallet); Total; "Confirmar compra".
5. **Login**: KURIO grande, "Entrar", inputs, "Esqueceu a senha?", Entrar, social, "Novo na Kurio? Crie uma conta".
6. **Cadastro**: "Criar perfil de colecionador", 4 inputs, "Criar perfil", social, "Já tem uma conta? Entre".

---

## 7. Componentes reutilizáveis

Detalhe visual na aba **Componentes** do protótipo.

| Componente | Base shadcn | Onde se repete |
|---|---|---|
| Button (primary, outline, link, pill, icon, loading) | Button + cva | todas as telas |
| IconButton (quadrado no hover do card, redondo no mobile) | Button `size="icon"` | card, header, mobile |
| QuantityStepper (lg, sm, mobile) com limite por edição | composição | detalhe, carrinho |
| Field (label + * + input + erro via `aria-describedby`) | Form, Input, Label | pagamento, perfil, carteiras, auth |
| Select / EnsInput / PasswordInput (olho) | Select, Input | pagamento, carteiras, perfil, auth |
| PromoCodeInput (desktop e pill mobile) | Input + Button | carrinho, pagamento |
| Radio / RadioCard (carteira) | RadioGroup | pagamento, carteiras |
| EditionChip (selecionado / esgotado) | ToggleGroup | detalhe |
| NftCard (+ RARO, preço antigo, hover, skeleton) | composição | início, rails, mobile |
| FilterPanel (vira Sheet no mobile) | Slider, Checkbox, Sheet | início |
| Tabs underline | Tabs | início, detalhe, auth |
| Pagination / CarouselDots / Breadcrumb | Pagination, Carousel, Breadcrumb | início, detalhe, carrinho, pagamento |
| LineItem (carrinho / resumo / recibo) | composição | carrinho, pagamento, confirmação |
| PriceSummary | composição | carrinho, pagamento, confirmação |
| **PriceChangeBanner** *(proposto)* | Alert | carrinho, pagamento (nft.updated) |
| **OrderStatus** pendente/confirmado/recusado *(proposto)* | Badge | pagamento, confirmação |
| Dialog (barra accent inferior) | Dialog | auth, confirmação |
| **Toast** *(proposto)* | Sonner | mutations, tempo real, conexão |
| **Skeleton com shimmer** *(proposto)* | Skeleton | catálogo, detalhe, resumo |
| **Empty / Error state** *(proposto)* | composição | catálogo vazio, 404, carrinho vazio, falha + retry |
| Header, MobileTabBar, SideMenu, Footer, FeatureCard, PromoBanner, BlogCard | composição | layout |

Estados não desenhados seguem a mesma linguagem visual: superfície marrom, borda fina, accent e **sempre ícone + texto** (nunca só cor).

---

## 8. Dados do Figma → fixtures

| NFT | Preço (ETH) | Arte | Token |
|---|---|---|---|
| Emerald Ape #042 | 1.19 | emerald-ape | #0042 |
| Sage Nomad #009 | 1.69 | sage-nomad | #0009 |
| Neon Vessel #552 | 1.99 (antes 2.29) · RARO | ivory-baron | #0552 |
| Cosmic Bloom #118 | 1.29 | sage-nomad | #0118 |
| Violet Nomad #314 | 1.39 | sage-nomad | #0314 |
| Ivory Baron #088 | 1.79 | ivory-baron | #0088 |
| Golden Beat #207 | 0.99 | golden-beat | #0207 |
| Golden Frequency #071 | 0.59 | golden-beat | #0071 |
| Golden Signal #160 | 0.39 | golden-beat | #0160 |

- Coleção "Kurio Apes" / "Kurio Editions". Atributos: Óculos, Esmeralda, Raro. Criador citado: **Nova Sato** (5% de royalties). Contrato `0x7A42...19E8` (ERC-721).
- Edições: `1/1`, `1/10`, `1/50`, `ABERTA`, cada uma com **disponibilidade própria**.
- Facetas: Arte digital 33 · Fotografia 12 · Música 65 · Arte 3D 39 · Colecionáveis 23 · Generativa 17 · Jogos 19 · Assinaturas 13 · Utilidade 18 · Rede: Ethereum 119 · Polygon 78 · Solana 86. Preço: 0,02–12,30 ETH. Ordenação padrão: "Listados recentemente".
- Carrinho do Figma: Emerald ×2 = 2.38 · Violet ×6 = 8.34 · Ivory ×9 = 16.11 → subtotal **26.83**, desconto 00.00, taxa **0.016**, total **26.846**.
- Recibo: tx `0xA91F…E82C`, 29 Jul 2026, carteira MetaMask.
- Carteiras: Reserva `nova.kurio.eth` (Polygon) · Principal `0xA91F…E82C` (Ethereum).
- A paginação mostra 4 páginas: gerar fixtures suficientes (~40+ NFTs) para filtros e paginação fazerem sentido. Pelo menos **2 usuários** (ex.: `nova@kurio.test`, `leo@kurio.test`). Senhas nunca em claro: guardar hash no mock.

---

## 9. Regras de negócio (resumo do README)

**Catálogo**: busca, filtros, ordenação e página vivem **na URL**, sobrevivem a refresh e ao histórico. Filtros são combináveis; trocar filtro volta para a página 1. Tratar vazio, falha e **respostas fora de ordem** (descartar as obsoletas, via `signal` do Axios ou queryKey). O detalhe suporta acesso direto, NFT inexistente (404), edição indisponível e limite de quantidade. Favoritos persistem por usuário autenticado.

**Carrinho**: adicionar, alterar e remover respeitando a disponibilidade por NFT **e edição**. Persiste após refresh; o carrinho do visitante é **mesclado** ao autenticar. Cupom com aplicar/remover e tratamento de inválido e expirado. Totais **vindos da API** (cotação). Refletir `nft.updated` com o carrinho aberto.

**Dinheiro**: ETH como **string decimal** no transporte; cálculo com lib decimal; quantidades inteiras. A **cotação da API** é a referência para fechar o pedido.

**Checkout**: validar campos e permitir revisão antes do envio. Usar carteiras cadastradas, com seleção de rede e simulação de conexão, recusa e desconexão. **Revalidar** preço, disponibilidade, cupom e taxas antes de confirmar; qualquer mudança exige nova confirmação. **Idempotência**: a mesma tentativa recupera o mesmo pedido; mesma chave com corpo diferente gera 409. Sem duplicar em clique repetido ou timeout. Estados pendente, confirmado e recusado, com recuperação após refresh ou reconexão. A confirmação só aparece para pedido realmente confirmado. Em falha, manter o carrinho; no sucesso, remover **só** os itens e quantidades comprados. O recibo é um **snapshot**: mudanças no catálogo não o alteram.

**Sessão**: cadastro, login, logout e sessão recuperável após refresh. Expiração durante navegação ou checkout preserva o contexto (redirect). **Logout e troca de usuário limpam o cache privado e as subscriptions.** Checkout, perfil, carteiras, favoritos e pedidos exigem auth.

**Atualização otimista**: pelo menos uma, com rollback (sugestão: **favoritos**). Documentar a política de cache, retries e sync.

---

## 10. Contratos

### Implementado

**Camada HTTP** ([src/services/api.ts](src/services/api.ts)): `axiosGet<T>(url, { params, signal })` e `axiosPost<T>(url, body, { params, signal })`. Ambas usam `baseURL: '/api'`, devolvem `Promise<T>` com os dados e, em falha, lançam um `ApiError` (`{ status, message }`) com mensagem em pt-BR. O `signal` vem do TanStack Query e cancela respostas obsoletas. Tipos em [src/types/api.ts](src/types/api.ts).

**`GET /api/list_nfts`**: lista paginada (9 por página). Hook: `useListNfts(params)` em [src/services/nfts.ts](src/services/nfts.ts) (queryKey `['list_nfts', params]`, `keepPreviousData`).

```ts
type ListNftsResponse = {
  items: Nft[]; page: number; page_size: number; total: number; total_pages: number
  facets: { collections: Record<CollectionSlug, number>; networks: Record<Network, number>; price: { min: string; max: string } }
}
```

`facets` traz as contagens dos filtros e os limites do slider de preço (sobre o catálogo inteiro). O destaque usa `useListNfts({ top_nft: true })`.

```ts
type Nft = {
  id: number; name: string; url_img: string
  currency: { ethereum: string; polygon: string | null; solana: string | null } // string decimal
  collection: CollectionSlug // 'digital-art' | 'photography' | 'music' | '3d-art' | ...
  top_nft: boolean  // só um true → card "NFT EM DESTAQUE"
  rare_nft: boolean // tag RARO
}
```

| Query param | Regra (aplicada no mock, [src/mocks/handlers.ts](src/mocks/handlers.ts)) |
|---|---|
| `search` | nome contém o texto (sem diferenciar maiúsculas) |
| `collection` | `nft.collection === slug` |
| `network` | `ethereum` = todos; `polygon`/`solana` = só quem tem valor não-null |
| `min_price` / `max_price` | faixa sobre `currency.ethereum` (número na URL, ex.: `0.05`) |
| `sort` | `price-asc` · `price-desc` · `name` (A–Z, pt-BR); sem `sort` = "Listados recentemente" (ordem das fixtures). Select "Ordenar por:" no topo do catálogo (`SORT_OPTIONS`); trocar a ordem volta para a página 1 |
| `page` | página (padrão 1; fora do intervalo é ajustada para a última) |
| `top_nft` | `true` = só o NFT em destaque |

Os mesmos parâmetros são o estado da URL da Início (`/?search=&collection=&network=&min_price=&max_price=&page=`), validados em [src/router.tsx](src/router.tsx). Toda mudança passa por `useCatalogSearch()` ([src/hooks/useCatalogSearch.ts](src/hooks/useCatalogSearch.ts)): mudar filtro volta para a página 1, mantém o `#catalogo` e não rola a página. No menu desktop, "Início" fica marcado sem hash e "Mercado" com `#catalogo`.

**`GET /api/banners`** → `Banner[]` (`{ title, description, img_url }`, 3 itens em [src/mocks/data/banners.json](src/mocks/data/banners.json), imagens de `public/nfts`). Hook `useBanners()` em `services/nfts.ts`. O hero da Início (`HeaderMain` em [src/pages/home/HomePage.tsx](src/pages/home/HomePage.tsx)) é um carrossel: troca a cada 6s, pausa com mouse/foco em cima e com "reduzir movimento", e tem pontos clicáveis (ativo vira pílula + `aria-current`, sem depender só de cor). Todos os banners ficam no DOM (`hidden` nos inativos, imagens já carregadas); fade de entrada `animate-banner-in`. "Bem-vindo à Kurio" e EXPLORAR são fixos. O `h1` da Início é `sr-only` ("Kurio: marketplace de NFTs") e os títulos dos banners são `h2`. Skeleton no carregamento e erro com "Tentar novamente".

**Filtros**: desktop = sidebar; mobile = `<dialog>` nativo (bottom sheet) aberto pelo botão da barra superior (`isFilterOpen` no Context), com foco preso, Esc e retorno de foco. Faixa de preço = slider de dois pontos (`@radix-ui/react-slider`, dentro de [src/pages/home/FilterPanel.tsx](src/pages/home/FilterPanel.tsx)) + "Aplicar". O texto da busca fica no Context (`search`/`setSearch`, resposta imediata) e vai para a URL com debounce de 300ms; voltar no navegador ressincroniza o input. Fixtures: [src/mocks/data/nfts.json](src/mocks/data/nfts.json) (30 NFTs). Mocks ativados por `VITE_ENABLE_MOCKS=true` (`.env`).

**`GET /api/nft_info/:id`**: detalhe do NFT (`NftInfo` = `Nft` + `token_id`, `creator`, `description` (Sobre este NFT), `details[]` (aba Detalhes), `network_info`, `contract_info`, `royalties_info`, `attributes[]`, `rating`, `reviews_count`, `editions[]`, `gallery[]`). `editions` = `{ id, label, available }` para `1/1`, `1/10`, `1/50`, `ABERTA`; `available: 0` = edição esgotada. 404 `{ message }` para id inexistente/inválido. Hook `useNftInfo(id)` (sem retry em 404). Dados extras em [src/mocks/data/nft-details.json](src/mocks/data/nft-details.json) (gerado de forma determinística).

**Detalhe (`/nft/$nftId`)**: o card da lista (e o destaque) leva para a rota com o id; a página busca `nft_info` e, **depois** da resposta, `list_nfts?collection=` para "Mais desta coleção" (até 5, sem o NFT atual). No desktop "Mercado" fica marcado no detalhe (o clique leva a `/#catalogo`). Aba "Avaliações (N)" desabilitada, mostrando `reviews_count`. Galeria com miniaturas + zoom (`<dialog>`). Quantidade limitada a `available − já no carrinho`.

**Carrinho e favoritos (Context)**: `cartItems` (`{ nft_id, edition, quantity }`), `cartCount`, `addToCart`, `favoriteIds`, `toggleFavorite`, `favoriteError` em `AppContext`. O carrinho fica no localStorage (`kurio:cart`). COMPRAR adiciona ao carrinho e leva para `/cart`; o badge do header/tab bar mostra a quantidade. O Context também expõe `updateCartQuantity` e `removeFromCart`.
- **Favoritos por usuário via API** (substituiu o localStorage `kurio:favorites`): `useFavorites(token)` (`['favorites', token]`) e `useToggleFavorite` em [src/services/account.ts](src/services/account.ts). É a **atualização otimista com rollback** do README: o coração muda na hora (`onMutate`), volta ao estado anterior se a API falhar (`onError`, erro em `role="alert"`) e confirma com o servidor (refaz o GET, porque o clique pode ter cancelado a primeira busca), e no sucesso usa a lista devolvida pelo POST (sem GET extra). Deslogado, favoritar abre o login.
- Carrinho do visitante no localStorage; na etapa de carrinho/login, sincronizar com a API do carrinho e mesclar os itens do visitante.

**Limitações conhecidas do MSW v3**:
- `worker.start()` chama `registration.update()` sem `catch`; no F5 isso gera uma rejeição "Failed to update a ServiceWorker… Not found" sem impacto. Tratada em `src/main.tsx` (filtro só dessa mensagem).
- O Chrome encerra Service Workers ociosos (ex.: aba alguns minutos em segundo plano). O worker reiniciado esquece que a aba usa mock (`activeClientIds` só existe na memória dele), a requisição escapa e o Vite responde o `index.html` com 200 (GET) ou 404 vazio (POST, o que fazia login/cadastro falharem às vezes). O interceptor do Axios em `src/services/api.ts` detecta a resposta sem JSON (sucesso ou erro), chama `reconnectMocks()` ([src/mocks/browser.ts](src/mocks/browser.ts): `worker.stop()` + `start()`, uma reconexão compartilhada entre requisições simultâneas) e repete a mesma requisição uma vez. Se ainda vier HTML (ou com mocks desligados), vira `ApiError` e a tela mostra o erro com "Tentar novamente". O router tem `defaultErrorComponent` para nenhum erro de renderização derrubar a página inteira.

**Carrinho (`/cart`)**: o ícone do carrinho (header e tab bar) e o COMPRAR do detalhe levam à página. Ela tem 2 componentes:
- `CartOverview` ([src/pages/cart/CartOverview.tsx](src/pages/cart/CartOverview.tsx)): itens + "Resumo da carteira". Busca o `nft_info` de cada NFT do carrinho (`useNftInfos`, reaproveita o cache do detalhe). Quantidade limitada ao estoque da edição; se o carrinho tiver mais que o estoque, avisa e soma só o disponível. Lixeira remove. Skeleton nas linhas e no resumo.
- `CollectorsAlsoViewed` (em [CartPage.tsx](src/pages/cart/CartPage.tsx)): NFTs das coleções do carrinho, sem os que já estão nele (até 5); com o carrinho vazio, o início do catálogo. Usa o `NftRail` compartilhado (o mesmo do "Mais desta coleção").
- **Totais calculados no front** (decisão do usuário, ⚠️ desvio do README, que pede totais vindos de uma cotação da API): subtotal = Σ preço × quantidade disponível, desconto = subtotal × % do cupom, taxa de rede estimada fixa `0.016` (`ESTIMATED_NETWORK_FEE` em [src/utils/eth.ts](src/utils/eth.ts)), total = subtotal − desconto + taxa. Tudo com `big.js` e exibido por `formatEth` (mínimo 2 casas, sem perder precisão). Registrar em `ARCHITECTURE.md`.
- **`GET /api/coupon/:code`**: `200 { code, discount_percent }` · `404 { message: 'Cupom inválido.' }` · `410 { message: 'Este cupom expirou.' }`. Códigos em [src/mocks/data/coupons.json](src/mocks/data/coupons.json): `KURIO10` (10%) e `EXPIRADO`. Hook `useApplyCoupon` (mutation). O cupom aplicado fica no Context (`coupon`/`setCoupon`, persistido em `kurio:coupon`) e o formulário é o `CouponForm` compartilhado por carrinho e pagamento.
- O título "Carrinho de NFTs" na barra superior do mobile vem de `staticData.title` da rota, e "Mercado" ativo no menu desktop vem de `staticData.isMarketPage` (detalhe e carrinho). Vale para qualquer rota nova: sem listas de caminhos no header.
- "Finalizar" (logado) leva a `/checkout`; "Conectar e finalizar" (deslogado) abre `?auth=login&redirect=/checkout`.

**Login e cadastro** ([src/components/AuthDialog.tsx](src/components/AuthDialog.tsx)):
- **Modal único** para os dois modos (mesma lógica; campos e textos vêm do objeto `MODES`). Em qualquer tamanho segue o frame mobile do Figma: marca **KURIO** no topo, título e, embaixo, "Novo na Kurio? Crie uma conta" (login) / "Já tem uma conta? Entre" (cadastro). Sem abas. Mobile: tela cheia; desktop: modal de 500px com barra laranja.
- **Abre pela URL** em qualquer página: `?auth=login` ou `?auth=signup` (validado no `rootRoute`). Dá para mandar o link direto do cadastro. `useAuthModal()` ([src/hooks/useAuthModal.ts](src/hooks/useAuthModal.ts)) abre, troca e fecha; fechar ou logar mantém a página atual (retorno ao fluxo anterior). Esc e o voltar do navegador fecham.
- **Validação à mão** em [src/utils/validation.ts](src/utils/validation.ts) (`validateAuthForm`): nome ≥ 3, e-mail válido, senha ≥ 6 no cadastro, confirmação igual. Erros ligados ao campo com `aria-describedby`; foco vai para o primeiro inválido. Erros da API com `field` (ex.: 409 no e-mail) aparecem no campo; os outros, num alerta do formulário.
- Depois do cadastro, abre o login com o e-mail preenchido e o aviso "Conta criada!".
- Logado: desktop mostra "Olá, nome" + "Sair"; no mobile, o ícone de perfil abre um menu (`popover` nativo) com nome, e-mail e "Sair". Deslogado, ambos abrem o login. "Esqueceu a senha?" e login social ficam desabilitados ("Em breve").

**Contratos de auth** (mock em [src/mocks/auth.ts](src/mocks/auth.ts), hooks em [src/services/auth.ts](src/services/auth.ts)):
- `POST /api/auth/register { name, email, password }` → `201 { user }` · `409 { message, field: 'email' }` (e-mail já cadastrado) · `422` (campos vazios).
- `POST /api/auth/login { email, password }` → `200 { token, user }` · `401 { message: 'E-mail ou senha incorretos.' }`.
- `GET /api/auth/session` (header `Authorization: Bearer <token>`) → `200 { user }` · `401` (sessão expirada após 8h ou inválida).
- `POST /api/auth/logout` (Bearer) → `200 { ok: true }`.
- **Variáveis de ambiente**: o `.env` está no `.gitignore`; o `.env.example` (versionado) traz `VITE_ENABLE_MOCKS=true` e `VITE_PASSWORD_SALT`. Num checkout limpo: `cp .env.example .env`. No deploy (Vercel), cadastrar as mesmas variáveis no painel. Documentar no README da solução.
- **Senha nunca salva**: o mock guarda só `SHA-256("<VITE_PASSWORD_SALT>:<senha>")` (Web Crypto). O sal vem do `.env` (`VITE_PASSWORD_SALT`); como toda `VITE_*` é pública no bundle, é valor de demonstração.
- "Banco" do mock no localStorage: `kurio:mock-users` e `kurio:mock-sessions`. Usuários de teste (criados no primeiro acesso): **`nova@kurio.test`** e **`leo@kurio.test`**, senha **`kurio123`**.
- Front: o Context guarda só o token (`kurio:session`) e lê o usuário com `useSession` (`['session', token]`). Expõe `user`, `isCheckingSession`, `startSession`, `signOut`. O `signOut` chama o logout (`useLogout`), apaga o token e remove do cache só os dados privados (`removeQueries(['session'])`); o catálogo público continua em cache. Novas queries privadas (carrinho/favoritos/pedidos na API) devem levar o token na queryKey e ser removidas junto. Token que volta 401 é descartado automaticamente.
- **Carrinho × sessão**: o botão do resumo mostra "Conectar e finalizar" (abre `?auth=login&redirect=/checkout`) quando deslogado e "Finalizar" (link para `/checkout`) quando logado.
- **Retorno ao fluxo (`redirect`)**: `?redirect=` (só caminhos internos, validado no `rootRoute`) diz para onde ir depois do login. `useAuthModal().openAuth(mode, redirect)`; ao entrar, `finishLogin` faz `history.replace(redirect)` (a entrada do modal sai do histórico). Sem `redirect`, o modal só fecha e o usuário fica na página.

**Pagamento (`/checkout?order=`)** ([src/pages/checkout/](src/pages/checkout/), hooks em [src/services/checkout.ts](src/services/checkout.ts), mock em [src/mocks/checkout.ts](src/mocks/checkout.ts)):
- **Acesso**: exige login (deslogado vê "Entre para finalizar a compra", com login + `redirect` de volta). Carrinho vazio sem pedido mostra estado vazio. Mobile first: tudo empilhado (formulário → Seus NFTs → Carteira e rede → Confirmar); no desktop, 2 colunas (formulário | resumo de 360px). Título mobile "Pagamento com carteira" via `staticData`.
- **Formulário** "Perfil do colecionador" (campos do Figma em `PROFILE_FIELDS`, [src/constants/checkout.ts](src/constants/checkout.ts)): obrigatórios como no Figma, exceto "Endereço da carteira" e "Código de indicação" (⚠️ desvio, decisão do usuário: continuam na tela, mas opcionais; endereço vazio = paga com a carteira conectada); também opcionais: carteira secundária e observação. Nome e e-mail vêm do usuário. Validação em `validateCheckoutForm` (0x + 40 hex, ENS, username, código 4–16). Erros com `aria-describedby`, foco no primeiro inválido; erros da API com `field` caem no campo (mesmas chaves do contrato). "Usar outra carteira?" paga com a carteira secundária (passa a exigir endereço 0x).
- **Carteira e rede**: WalletConnect / MetaMask / Coinbase Wallet (radio cards) + "Conectar". Conectar exige rede escolhida; trocar rede ou carteira desconecta. Com o "Endereço da carteira" vazio, o pedido usa o endereço da carteira conectada. "Confirmar compra" pede carteira conectada.
- **Revisão e cotação**: o resumo vem de `POST /api/quote` (totais da API). A primeira cotação vira a "revisada"; se a API devolver outro `quote_id` para o mesmo carrinho (ex.: `nft.updated` invalida `['quote']`), aparece "Os valores mudaram desde a sua revisão" (preço/quantidade/cupom/total antigo → novo) e o botão vira "Confirmar com novos valores". Ao confirmar, o pedido leva o `quote_id` revisado e **quem revalida é a API**: se os valores mudaram, ela responde `409 QUOTE_CHANGED`, a página busca a cotação nova e o aviso volta. A cotação fica desligada enquanto o pedido está pendente/confirmado (o resumo passa a ser o do pedido). Mudar cupom/itens não conta como mudança (nova revisão automática).
- **Pedido idempotente**: cada tentativa gera um `Idempotency-Key` (UUID) e fica salva em `kurio:checkout-attempt` até ter resposta. Sem resposta (timeout de 6s / queda), o TanStack repete 1x com a mesma chave; se ainda falhar (ou após F5), aparece "Recuperar compra", que reenvia a mesma tentativa. Resposta → `?order=ID` na URL (`replace`).
- **Estados**: pendente (form desabilitado, "Aguardando confirmação…", aviso que dá para recarregar), recusado (motivo + "Seus itens continuam no carrinho" + "Tentar novamente" = nova tentativa) e confirmado (recibo). Recuperação após F5/reconexão por `GET /api/orders/:id` (`['order', token, id]`), atualizado pelo `order.updated` e, como rede de segurança, polling de 4s só enquanto pendente.
- **Recibo** (`OrderReceiptDialog`, modal em mobile e desktop): THANK YOU, ID da transação, data, total, carteira, itens/edições/subtotais, taxa, total, nota da rede. É o snapshot do pedido (não lê o catálogo). "Ver no Etherscan" desabilitado com aviso (transação simulada). Fechar → Início.
- **Carrinho após a compra**: `removePurchasedItems(order)` no Context tira só as quantidades compradas e limpa o cupom, uma única vez por pedido (`kurio:settled-orders`). Recusa/erro não mexe no carrinho.
- **Sessão expirada no checkout**: 401 em pedido/carteira abre `?auth=login&redirect=<url atual>` sem desmontar a página; o formulário é mantido.

**Contratos do pagamento** (mock em [src/mocks/checkout.ts](src/mocks/checkout.ts); tipos em `types/api.ts`):
- `POST /api/quote { items, coupon_code }` → `Quote { quote_id, lines[], warnings[], coupon, coupon_error, subtotal, discount, network_fee, total }`. Quantidade limitada ao estoque da edição (`requested_quantity` × `quantity`), edição esgotada sai das linhas com aviso; cupom inválido/expirado vira `coupon_error`. `quote_id` = hash do conteúdo (mesmos valores, mesmo id).
- `POST /api/wallet/connect { provider, network }` (Bearer) → `200 { provider, network, address }` (endereços em [src/mocks/data/wallets.json](src/mocks/data/wallets.json)) · `403 WALLET_REJECTED` · `401`.
- `POST /api/orders` (Bearer + `Idempotency-Key`) `{ items, coupon_code, quote_id, network, wallet_provider, profile }` → `201 Order` (pendente) · mesma chave e mesmo corpo → o pedido existente · mesma chave e outro corpo → `409 IDEMPOTENCY_CONFLICT` · cotação diferente → `409 QUOTE_CHANGED` · nada disponível → `409 AVAILABILITY_CONFLICT` · `422 { field }` (endereço inválido, NFT fora da rede) · `401 SESSION_EXPIRED`.
- `GET /api/orders/:id` (Bearer) → `Order` · `404` (inexistente ou de outro usuário).
- `Order { id, status, version, created_at, lines, subtotal, discount, network_fee, total, network, wallet_provider, wallet_address, tx_hash, decline_reason }`. O pedido é liquidado 3s depois de criado (`settle_at` salvo em `kurio:mock-orders`, reagendado ao carregar a página): confirmado baixa o estoque (`sellEditions` → `nft.updated`) e gera `tx_hash`; recusado guarda o motivo. Confirmado/recusado são terminais.
- **`order.updated`** `{ eventId, type, resource: { type: 'order', id }, version, occurredAt, data: { status, tx_hash, decline_reason } }`, entregue só às conexões do dono: o cliente envia `session:join` com o token ao conectar/reconectar e quando a sessão muda (`REALTIME_COMMANDS`); o mock guarda o usuário de cada conexão e filtra (também entre abas). O cliente ignora `eventId` repetido e `version` ≤ a do cache. Ao reconectar, refaz `quote` e `order` ativos.
- **Cenários do painel** (`kurio:mock-scenario`, [src/mocks/scenario.ts](src/mocks/scenario.ts); tipos em [src/types/mock.ts](src/types/mock.ts), sem imports, compartilhados com os testes): conexão da carteira (Aprova/Recusa), resultado do pagamento (Confirma/Recusa/Timeout: o pedido é criado e a resposta atrasa 8s, mais que o timeout do front), favoritos (Salva/Falha), **Rede** (Normal / Lenta: +2s em toda resposta REST, via `networkDelay()`), **Leituras** (Funcionam / Falham: `list_nfts`, `nft_info` e `banners` respondem 503, via `readFailureResponse()`) e "Expirar sessão no servidor". Só para testes (sem botão): `catalogOrder: 'out-of-order'` (a busca por Música demora 1,5s; o app cancela a requisição velha pelo `signal`).
- **Comandos de socket só para teste** (`MOCK_COMMANDS`): `mock:replay-last-event` (mesmo `eventId`), `mock:send-stale-event` (penúltimo evento do NFT com outro `eventId`: só a versão o barra) e `mock:drop-connection` (o servidor fecha o socket; o cliente reconecta e reconcilia). Com mocks ligados, `window.__kurioMock.sendCommand(...)` ([src/mocks/browser.ts](src/mocks/browser.ts)) manda o comando pelo `socket.io-client`, como o painel.
- ⚠️ O carrinho (`/cart`) ainda calcula os totais no front; o pagamento já usa a cotação da API. Migrar o carrinho para `useQuote` remove o desvio.

**Perfil (`/account?tab=profile|wallets|activity|favorites`)** ([src/pages/account/](src/pages/account/), hooks em [src/services/account.ts](src/services/account.ts), mock em [src/mocks/account.ts](src/mocks/account.ts)):
- **Acesso**: exige login (`LoginRequired`, o mesmo do pagamento, com `redirect` de volta). Entradas: "Olá, nome" no header desktop, "Meu perfil" no menu de conta do mobile e o coração da tab bar (abre a Lista de interesse). A aba fica na URL; aba inválida cai em "Dados do perfil".
- **Menu** (`ACCOUNT_MENU` em [src/constants/account.ts](src/constants/account.ts)): desktop = menu lateral de 310px do Figma (barra de 6px no ativo, "Sair" separado). Mobile (sem frame no Figma): cartão com avatar, nome e e-mail + faixa de abas rolável na horizontal (o grid usa `grid-cols-1`, senão a faixa estica a página). Ofertas, Arquivos baixados e Suporte ficam `aria-disabled` ("Em breve").
- **Dados do perfil**: Nome de exibição*, Nome de usuário*, E-mail* (409 se for de outra conta), Nome ENS e Apelido da carteira (opcionais), Avatar (Alterar/Remover; imagem até 500 KB salva como data URL). Salvar atualiza o perfil e o usuário da sessão (o nome do header muda). **Alterar senha** em formulário próprio (atual, nova, confirmar), conferida pelo hash no mock. Campos compartilhados em [src/components/FormField.tsx](src/components/FormField.tsx) (`TextField`, `SelectField`, `PasswordField`), também usados no pagamento.
- **Carteiras**: principal (Apelido, Rede, Endereço 0x, Tipo) e secundária ("Adicionar"/"Remover" ou "Igual à carteira principal"). Desvio: campos reduzidos em relação ao frame do Figma, que repete o formulário do pagamento. **No pagamento**, as carteiras cadastradas preenchem rede, endereço, carteira secundária e tipo quando esses campos estão vazios.
- **Atividade**: compras confirmadas do usuário (`GET /api/orders`, `['orders', token]`, atualizado pelo `order.updated`), com data, pedido, rede, transação, itens, edições, quantidades e total pago.
- **Lista de interesse**: NFTs favoritos do usuário (`nft_info` de cada id, reaproveita o cache) com "Remover" (otimista).

**Contratos do perfil** (todos com Bearer; `401` sem sessão):
- `GET /api/profile` → `Profile { name, email, username, ens_name, wallet_nickname, avatar_url }` · `POST /api/profile` (Profile) → `{ profile, user }` · `422/409 { message, field }`.
- `POST /api/profile/password { current_password, new_password }` → `{ ok }` · `422 { field: 'current_password' | 'new_password' }`.
- `GET /api/wallets` → `Wallets { primary, secondary, secondary_same_as_primary }` · `POST /api/wallets` (Wallets) → Wallets · `422 { field: 'primary.address' | 'secondary.network' … }`.
- `GET /api/orders` → `Order[]` do usuário (mais recentes primeiro).
- `GET /api/favorites` → `{ nft_ids }` · `POST /api/favorites/:nftId { is_favorite }` → `{ nft_ids }` · `503` no cenário "Favoritos: Falha" do painel · `404` NFT inexistente. (POST em vez de PUT/DELETE porque toda chamada passa por `axiosGet`/`axiosPost`.)
- "Banco" do mock: perfil e senha no próprio usuário (`kurio:mock-users`); carteiras e favoritos por usuário em `kurio:mock-wallets` e `kurio:mock-favorites`. Regras de validação são as mesmas do front (`validateProfileForm`, `validateWalletForm`, `WALLET_ADDRESS_PATTERN` de `utils/validation.ts`).
- **Logout**: toda query privada leva o token na queryKey (`session`, `profile`, `wallets`, `orders`, `order`, `favorites`), e o `signOut` remove de uma vez tudo o que tem esse token (`removeQueries({ predicate })`). Query privada nova só precisa ter o token na chave.

**Tempo real: `nft.updated`** (Socket.IO simulado no MSW):
- **Transporte**: `socket.io-client` conecta em `wss://realtime.kurio.test` (`REALTIME_URL` em [src/constants/realtime.ts](src/constants/realtime.ts)) com `transports: ['websocket']`; o MSW intercepta com `ws.link(REALTIME_URL)` + `toSocketIo` do `@mswjs/socket.io-binding` ([src/mocks/realtime.ts](src/mocks/realtime.ts)). O mock de WebSocket roda dentro da página (não depende do Service Worker).
- **Limitações do transporte** (registrar em `ARCHITECTURE.md`): (1) o binding 0.2.0 declara só MSW 2; `overrides` no `package.json` aceita o MSW 3, que funcionou em teste; (2) o `engine.io-client` guarda o `WebSocket` ao carregar, então o `socket.io-client` é importado dinamicamente depois do `worker.start()`; (3) no MSW 3, `ws.link` só casa pelo host (padrões com `/socket.io` falham), daí o host fictício exclusivo; (4) o binding anuncia ping de 25s mas não envia: o mock envia o ping do Engine.IO (`'2'`) a cada 25s, senão o cliente cai por "ping timeout" a cada 30s; (5) cada aba tem seu próprio servidor mock: os eventos chegam às outras abas por `BroadcastChannel` (`kurio:mock-realtime`).
- **Evento**: `{ eventId, type: 'nft.updated', resource: { type: 'nft', id }, version, occurredAt, data: { price, editions: [{ id, available }] } }` (`NftUpdatedEvent` em `types/api.ts`). `price` é o preço em Ethereum (o exibido na UI).
- **Estado do mock**: preço, estoque por edição e `version` de cada NFT ficam em `kurio:mock-market` ([src/mocks/market.ts](src/mocks/market.ts)); `list_nfts` e `nft_info` leem dali (REST e socket consistentes, sobrevive ao F5). `Nft` ganhou `version` (começa em 1 e só cresce, inclusive no reset).
- **Cliente** ([src/services/realtime.ts](src/services/realtime.ts), `useRealtimeUpdates` no `AppProvider`): ignora `eventId` já visto; todo evento novo invalida a `quote` (vem do servidor, não depende do cache); NFT ainda fora do cache (página carregando) → refaz o `nft_info` em vez de perder a mudança; `version` ≤ a do cache é ignorada; atualiza `nft_info` e todas as `list_nfts` no cache do TanStack Query (catálogo, destaque, rails, detalhe e carrinho mudam juntos) e marca as listas como desatualizadas (filtros de preço/facetas são refeitos na próxima exibição). Ao reconectar, refaz `list_nfts` e `nft_info` ativos. Desconecta no unmount.
- **Feedback**: preço alterado pisca (`animate-price-flash`) e ganha o selo "Atualizado" (ícone + texto) no card e no detalhe; o carrinho mostra `PriceChangeBanner` ("O preço de X mudou de A para B ETH", com "Entendi"). `aria-live` no `Layout` anuncia cada mudança. As mudanças de preço vivem no Context (`priceChanges`, `dismissPriceChanges`, `realtimeMessage`), só na memória da sessão. Edição selecionada que esgota mostra "ESGOTADO".
- **Painel de dev** ([src/mocks/MockPanel.tsx](src/mocks/MockPanel.tsx), carregado sob demanda só com `VITE_ENABLE_MOCKS=true`): botão flutuante no canto inferior esquerdo; escolhe o NFT (pré-seleciona o da página de detalhe) e dispara "Preço +10%", "Preço −10%", "Esgotar uma edição", "Repor estoque" ou "Restaurar preços e estoques". O pedido vai pelo próprio socket (`mock:nft-action`, `mock:reset-market`) e o servidor mock responde com `nft.updated`: a UI nunca altera cache ou estado direto.

**Pendências do contrato**: para as abas, sugerido `created_at` ("Novos lançamentos") e `previous_price` (preço riscado do Figma). Hoje "Listados recentemente" usa a ordem das fixtures.

### Proposta (demais recursos)

REST (prefixo `/api`; todos tipados e compartilhados entre transporte, mocks e UI):

| Recurso | Endpoints |
|---|---|
| Auth | `POST /auth/register` · `POST /auth/login` · `GET /auth/session` · `POST /auth/logout` |
| NFTs | `GET /nfts?q&collection&network&minPrice&maxPrice&sort&tab&page&pageSize` (com `facets`) · `GET /nfts/:id` |
| Favoritos | `GET /favorites` · `PUT /favorites/:nftId` · `DELETE /favorites/:nftId` |
| Carrinho | `GET /cart` · `POST /cart/items` · `PATCH /cart/items/:id` · `DELETE /cart/items/:id` · `POST /cart/merge` |
| Cotação | `POST /quote` `{ items, coupon }` → `{ quoteId, version, lines, subtotal, discount, networkFee, total, expiresAt, warnings }` |
| Pedidos | `POST /orders` (header `Idempotency-Key`) · `GET /orders/:id` (estado + recibo snapshot) |
| Perfil | `GET /profile` · `PATCH /profile` · `POST /profile/avatar` · `POST /profile/password` |
| Carteiras | `GET /wallets` · `POST /wallets` · `PATCH /wallets/:id` |

Erro padrão: `{ error: { code, message, fields? } }`, com códigos `VALIDATION_ERROR` (422) · `UNAUTHENTICATED`/`SESSION_EXPIRED` (401) · `FORBIDDEN` (403) · `NOT_FOUND` (404) · `CONFLICT` / `AVAILABILITY_CONFLICT` / `PRICE_CHANGED` / `IDEMPOTENCY_CONFLICT` / `COUPON_INVALID` / `COUPON_EXPIRED` (409/422) · `TRANSIENT` (503).

Socket.IO:

```ts
type RealtimeEvent<T> = { eventId: string; type: 'nft.updated' | 'order.updated';
  resource: { type: 'nft' | 'order'; id: string }; version: number; occurredAt: string; data: T };
// nft.updated  → { price: string; editions: { edition: string; available: number }[] }
// order.updated → { status: 'pending' | 'confirmed' | 'declined'; txHash?: string } (somente para o dono)
```

O cliente ignora `eventId` já visto e `version` ≤ a atual. Após reconectar, **refaz os GETs dos recursos ativos**. Eventos de outra sessão ou usuário são descartados. Listeners são liberados no unmount e no logout.

---

## 11. Mocks (MSW)

- Ativados por env (ex.: `VITE_ENABLE_MOCKS=true`), **também no build de demo/deploy**.
- Componentes, hooks e Axios **não** contêm dados fictícios: tudo vive nos handlers.
- Estado consistente entre catálogo, favoritos, carrinho, perfil, carteiras e pedidos, persistido em localStorage; **reset** restaura um cenário conhecido.
- Cenários selecionáveis e reproduzíveis (ex.: `?scenario=` + painel de dev): sucesso, vazio, latência variável, fora de ordem, offline, 4xx/5xx, sessão expirada, 401/403, conflito de cadastro, cupom inválido/expirado, preço alterado, edição esgotada, **timeout após criar o pedido** (recuperar por idempotência), pagamento confirmado e recusado.
- Tempo real via `@mswjs/socket.io-binding`, exercitando `socket.io-client` de verdade. **Nunca** simular evento chamando setter ou cache direto (eliminatório). Documentar o transporte e suas limitações.

---

## 12. Qualidade

**Acessibilidade**: teclado completo e foco visível; foco preso em Dialog/Sheet; labels e erros associados; `alt` em imagens relevantes; contraste; estados que não dependem só de cor; `aria-live` para mutations e eventos em tempo real; sem overflow horizontal; zoom sem perda de conteúdo.

**Skeletons com shimmer** no catálogo, no detalhe e no resumo do carrinho, preservando dimensões (CLS) e respeitando `prefers-reduced-motion`.

**Playwright** (feito, detalhes em [tests/README.md](tests/README.md)): os 12 cenários do README §9 + regressão visual de Início, Detalhe, Carrinho e Pagamento.
- **Servidor**: `playwright.config.ts` sobe `vite build --mode test` (`.env.test`, versionado, mocks ligados) + `vite preview` na porta 4173, igual ao deploy.
- **Projetos**: `desktop` (Chromium 1440×900, tudo) e `mobile` (Pixel 7, só `@principal` e `@visual`).
- **Organização**: um arquivo por tela, nomes em inglês (`tests/e2e/catalog|nft-detail|auth|cart|checkout|account|realtime|accessibility|loading.spec.ts`, `tests/visual/screens.spec.ts`), helpers em `tests/support/app.ts`. Títulos dos testes em pt-BR.
- **Seletores** por papel/nome acessível. Estado isolado por contexto; cenário do MSW por teste (`test.use({ scenario })`); eventos pelo socket (`window.__kurioMock`).
- **Visual**: baselines do Windows (`tests/visual/__screenshots__/<projeto>/<tela>-win32.png`). O Linux quebra linhas de outro jeito e a página muda de altura, então no CI os visuais rodam num job `windows-latest` e os E2E no Ubuntu (`--grep-invert "@visual"`). Tolerância de 1%, `reducedMotion: 'reduce'`, fontes e ícones locais.
- **Relatório e CI**: HTML (`playwright-report/`), traces e capturas só das falhas (`test-results/`). CI em `.github/workflows/e2e.yml` (typecheck, lint, E2E, artefatos).
- **Melhorias feitas a partir dos testes**: foco preso no `ModalDialog` (Tab/Shift+Tab circulam dentro do diálogo), `aria-busy` nas linhas e no resumo do carrinho, e o cliente de tempo real não perde eventos sem cache (ver Tempo real).

**Lighthouse** (Início e Detalhe, mobile e desktop, build otimizado, 3 execuções, mediana): Performance ≥ 90 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 90. Registrar LCP, CLS e TBT. Imagens em WebP/AVIF com `width`/`height`; fontes locais; code-splitting por rota.

---

## 13. Avaliação

| Critério | Pts |
|---|---:|
| Fidelidade visual e responsividade | 20 |
| Fluxos e experiência | 20 |
| Integração e estado | 15 |
| Tempo real | 10 |
| Mocking | 10 |
| Testes | 10 |
| Acessibilidade | 5 |
| Performance | 5 |
| Arquitetura e documentação | 5 |

**Eliminatórios**: stack obrigatória sem uso efetivo · fluxos só visuais · compra confirmada sem resposta da simulação · dados vazando entre usuários · eventos simulados direto na UI · ausência de testes E2E executáveis.

**Entrega**: código, lockfile, assets, mocks, fixtures, testes, config do Lighthouse; **deploy público**; README da solução (setup, env, credenciais fictícias, cenários, reset, comandos, como reproduzir falhas); **ARCHITECTURE.md** (contratos, eventos, sessão, carrinho, cache, reconciliação REST × Socket, limitações, desvios do Figma). Scripts: dev com mocks, build, preview, typecheck, lint, test (Playwright), lighthouse.

---

## 14. Estrutura de pastas (proposta)

Já existem (26 arquivos em `src/`):
- `src/main.tsx`: fonte, `global.css`, QueryClient, MSW e render do RouterProvider.
- `src/router.tsx`: rotas (raiz = `AppProvider` › `Layout` › `Outlet`; `/` = Início; `/nft/$nftId` = Detalhe; 404).
- `src/app/layout.tsx`: escolhe `MobileTopBar` + `MobileTabBar` (mobile, sticky) ou `DesktopHeader` + `Footer` (desktop) pelo `isMobile`.
- `src/components/layout/Navigation.tsx`: DesktopHeader, MobileTopBar, MobileTabBar (+ SearchInput e CartButton internos). `Footer.tsx` à parte.
- `src/components/`: NftCard (+ NftCardSkeleton), Skeleton (shimmer), StateMessage (vazio/erro, `onRetry`), ModalDialog (`<dialog>` com foco/Esc), QuantityStepper.
- `src/pages/NotFoundPage.tsx`: 404 reutilizável (rota inexistente e NFT inexistente).
- `src/pages/home/`: HomePage (+ HeaderMain), NftCatalog (+ FeaturedNft, Pagination), FilterPanel (+ FilterDialog e slider Radix).
- `src/pages/nft-detail/`: NftDetailPage (+ abas e "Mais desta coleção"), NftGallery, NftPurchasePanel.
- `src/pages/cart/`: CartPage (+ CollectorsAlsoViewed), CartOverview (+ CartLineItem e CartSummary).
- `src/components/AuthDialog.tsx`: modal de login/cadastro (+ AuthForm e AuthInput). `src/hooks/useAuthModal.ts`: `?auth=` na URL.
- `src/services/auth.ts`: useSession, useLogin, useRegister, logoutRequest. `src/mocks/auth.ts`: handlers de auth com hash de senha.
- `src/utils/validation.ts`: `validateAuthForm`. `src/constants/storage.ts`: todas as chaves do localStorage (app e mock). `src/utils/storage.ts`: `readStoredJson`.
- `src/components/Breadcrumb.tsx` (Início / Mercado / atual), `ModalDialog.tsx` também exporta `DialogCloseButton` (X de todos os modais). `src/hooks/useCartNfts.ts`: `nft_info` dos NFTs do carrinho (fonte única para itens e recomendações).
- `src/components/NftRail.tsx`: lista horizontal de NFTs (mobile) / grid de 5 (desktop), com skeleton, erro e vazio.
- `src/utils/`: `array.ts` (`range`, `unique`), `eth.ts` (`formatEth`, `ESTIMATED_NETWORK_FEE`).
- `src/hooks/useCatalogSearch.ts`: leitura e atualização dos filtros/página na URL (também usado pelo Context para a busca).
- `src/services/`: `api.ts` (axiosGet/axiosPost), `nfts.ts` (useListNfts, useNftInfo).
- `src/types/api.ts`: tipos da API.
- `src/constants/`: `catalog.ts` (coleções, redes e IDs de elementos), `icons.ts` (ICONS).
- `src/mocks/`: `handlers.ts`, `data/nfts.json`, `data/nft-details.json`, `browser.ts` (worker do MSW: `startMocks`, chamado pelo `main.tsx`, e `reconnectMocks`), `market.ts` (preço/estoque/versão persistidos), `realtime.ts` (servidor Socket.IO simulado), `MockPanel.tsx` (painel de dev).
- `src/pages/account/`: AccountPage (menu + abas), ProfileTab (perfil + senha), WalletsTab, ActivityTab, FavoritesTab. `src/services/account.ts`, `src/constants/account.ts`, `src/mocks/account.ts`. `src/components/FormField.tsx` (`TextField`, `SelectField`, `PasswordField`, `FormAlert`, `SubmitRow`) e `src/components/LoginRequired.tsx` (compartilhados). `src/utils/date.ts` (`formatShortDate`), `src/utils/form.ts` (`focusFirstError`).
- `src/pages/checkout/`: CheckoutPage (orquestra cotação, carteira, pedido e estados), CollectorProfileForm, CheckoutSummary (+ QuoteChangedBanner), WalletPicker, OrderReceiptDialog. `src/services/checkout.ts`: useQuote, useConnectWallet, useCreateOrder, useOrder. `src/constants/checkout.ts`: carteiras, campos do formulário. `src/components/CouponForm.tsx`. `src/mocks/checkout.ts` (cupom, cotação, carteira, pedidos), `src/mocks/scenario.ts`, `src/mocks/data/wallets.json`.
- `src/services/realtime.ts`: `useRealtimeUpdates(sessionToken)` (cliente Socket.IO: `nft.updated`, `order.updated`, `session:join` + cache) e `emitToRealtime`. `src/components/PriceUpdate.tsx`: `PriceUpdatedTag` e `PriceChangeBanner`. `src/constants/realtime.ts`: `REALTIME_URL` e `MOCK_COMMANDS`.

Alias `@/` aponta para `src/`. Itens de telas ainda não construídas (carrinho, favoritos, perfil, Entrar, Criadores, Aprenda, newsletter) ficam desabilitados com "Em breve".

```
src/
  app/            # layout.tsx (moldura global); depois providers (QueryClient, Router, Socket)
  context/        # AppContext.ts (estado global, arquivo único de exports) + AppProvider.tsx
  routes/         # TanStack Router (file-based)
  features/       # catalog, nft, cart, checkout, orders, auth, account, favorites
    <feature>/api.ts · queries.ts · components/ · schemas.ts
  components/ui/  # shadcn adaptados
  components/     # compartilhados (NftCard, PriceSummary, Header...)
  lib/            # axios, socket, decimal, query-keys, icons (mapa ICONS)
  contracts/      # tipos REST + eventos (fonte única)
  mocks/          # MSW: handlers, db (estado), fixtures, scenarios, socket
  styles/         # tailwind + tokens
tests/            # Playwright (e2e, visual, fixtures)
lighthouse/       # config + relatórios
design/           # protótipo + assets de referência
```

---

## 15. Decisões e desvios registrados

1. **Ícones**: Iconify (Basil + Solar + logos + token-branded + simple-icons) no lugar dos SVGs soltos do Figma, mantendo o estilo "curved".
2. **Fonte**: Roboto Mono, deduzida do render (zero cortado). Confirmar no Figma.
3. **Cores de estado** (success, warning, info) **propostas**: não existem no Figma. Danger reaproveita o tom do asterisco.
4. **Artes**: recortadas do PNG em baixa resolução. Substituir por export 2× do Figma antes do Lighthouse.
5. **Login/Cadastro**: Dialog no desktop (como no Figma) e página no mobile, sob as mesmas rotas `/login` e `/signup`.
6. **Card sem nome na Início**: o card do grid sem nome no Figma (linha 3, coluna 2) recebeu "Golden Frequency #071 · 0.59 ETH", tirado do frame de login.
7. **Fora de escopo com comportamento coerente**: Criadores, Aprenda, blog, suporte, atividade, ofertas, downloads, login social e "Esqueceu a senha?" ficam desabilitados ou com aviso "em breve". Nunca simular sucesso.
