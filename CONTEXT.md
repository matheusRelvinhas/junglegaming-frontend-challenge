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
| 4b | Restante da stack (shadcn, Router, Query, Axios, MSW, Socket.IO, Iconify, Playwright) | ⏳ |
| 5 | Tema (tokens → Tailwind) + componentes base | ⏳ |
| 6 | Camada de dados: contratos, fixtures, handlers MSW, cenários | ⏳ |
| 7 | Telas: Início → Detalhe → Carrinho → Auth → Checkout → Confirmação → Perfil/Carteiras | ⏳ |
| 8 | Tempo real (nft.updated / order.updated) + reconciliação | ⏳ |
| 9 | Testes Playwright (E2E + visual) | ⏳ |
| 10 | Lighthouse, documentação (README da solução + ARCHITECTURE.md), deploy | ⏳ |

> O ritmo é **um passo de cada vez, com calma**. Não adiante etapas sem o usuário pedir.

> **Estilo de código**: simples e fácil de entender, nomes que descrevem a lógica, poucos comentários (só quando o porquê não é óbvio).

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

## 10. Contratos (proposta inicial)

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

**Playwright**: os 12 cenários do README §9, em Chromium, desktop + mobile; regressão visual de Início, Detalhe, Carrinho e Pagamento com dados estáveis; estado isolado por teste; relógio, latência e eventos controlados; relatório HTML + traces.

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

Já existem: `src/main.tsx` (fonte + `global.css`), `src/App.tsx` (`AppProvider` › `Layout` › conteúdo provisório), `src/app/layout.tsx` (moldura de todas as páginas, com `container mx-auto px-6`), `src/context/AppContext.ts` + `AppProvider.tsx` (estado global) e `src/styles/global.css` (tema). Alias `@/` aponta para `src/`.

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
