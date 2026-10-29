# Kurio: NFT Marketplace (desafio frontend)

O contexto completo do projeto (stack, tokens, ícones, telas, regras, contratos, roadmap) fica em CONTEXT.md:

@CONTEXT.md

## Estilo de código
- **Código simples**, fácil de entender. Prefira a solução direta à "esperta".
- **Nomes que descrevem a lógica** (`isMobile`, `subscribeToMobileChange`, `cartTotal`), nunca genéricos (`data`, `handle`, `temp`).
- **Poucos comentários**: só quando o código sozinho não explica o porquê. Nada de comentário que repete o código.
- **Laços só sobre arrays de verdade**, com os métodos padrão (`.map`, `.filter`, `.find`, `.some`, `.forEach`). Nada de `Array.from({ length })`: para listas sem dados (skeletons, páginas, estrelas) use `range(n)` de `src/utils/array.ts`; para remover repetidos, `unique()`.
- **Sintaxe legível de júnior a sênior**: prefira `forEach` com acumulador a `reduce`; `.map().filter()` + `.find()` a `flatMap`/`Map`/`Object.fromEntries`; objetos `{ label, value }` a tuplas; quebre ternários múltiplos em variáveis com nome.
- **Tags semânticas** (decisão alinhada ao README): `button`, `a`/`Link`, `input`/`label`/`form`, `img`, `dialog`, títulos `h1–h3`, listas `ul/li` e marcos `header/nav/main/footer/section/aside` continuam onde têm função. `<div>`/`<span>` para o resto do layout.

## Regras de trabalho
- Avançar **um passo do roadmap por vez** (CONTEXT.md §1); não adiantar etapas sem pedido.
- **Mobile first**: escreva o estilo do mobile sem prefixo e sobrescreva o desktop com `desktop:` (≥ 1040px). `isMobile` serve só para trocar estrutura/componentes, não para estilo.
- Estado global de UI só via Context API: novas variáveis/funções globais entram em `src/context/AppContext.ts` (arquivo único) e são expostas pelo `AppProvider`. Mobile = `isMobile` do `useAppContext()` (largura < 1040px).
- Toda página é renderizada dentro de `Layout` (`src/app/layout.tsx`), que usa o `container` nativo do Tailwind com `mx-auto px-6`. Não recriar lógica do Tailwind no `global.css`.
- Só existe o breakpoint `desktop:`; os padrões do Tailwind (`sm`, `md`, `lg`…) foram removidos.
- Cores e tipografia só pelas classes do tema (`bg-primary`, `text-sand`, `text-display`…) definidas em `src/styles/global.css`; nada de hex solto nos componentes.
- **Unidades**: `rem` só para tamanho de texto; todo o resto (espaçamento, raio, largura, breakpoint) em `px`.
- Fidelidade visual: conferir contra `design/prototype.html` e `figma-imgs/Frontend Challenge.png` (escala 1:1).
- Ícones sempre via o mapa semântico `ICONS` (Iconify), nunca SVG solto.
- Dinheiro em ETH como string decimal; nada de `number` para valores.
- Chamadas REST só via `axiosGet`/`axiosPost` (`src/services/api.ts`) dentro de hooks do TanStack Query; tipos da API em `src/types/api.ts`.
- Sessão: o Context guarda só o token (`kurio:session`) e expõe `user`, `startSession`, `signOut`. Modais de login/cadastro abrem pela URL (`?auth=login|signup`) via `useAuthModal()`. Senhas só como hash no mock (sal em `VITE_PASSWORD_SALT`). Usuários de teste: `nova@kurio.test` / `leo@kurio.test`, senha `kurio123`.
- Diálogos: sempre `ModalDialog` + `DialogCloseButton`; para focar um campo ao abrir, use `data-autofocus` (o React não escreve `autofocus`).
- Informação de rota (título mobile, "Mercado" ativo) vai em `staticData` da rota, não em listas de caminhos nos componentes. Breadcrumb via `<Breadcrumb current="..." />`.
- No `AppProvider`, funções simples (sem `useCallback`/`useMemo`); o objeto do contexto é montado direto no `<AppContext value={...}>`.
- Carrinho (`cartItems`/`addToCart`) e favoritos (`favoriteIds`/`toggleFavorite`) vivem no Context e são persistidos no localStorage (`kurio:cart`, `kurio:favorites`).
- Busca, filtros, ordenação e paginação vivem na URL (search params do TanStack Router) e são enviados à API; o texto da busca é exposto pelo Context.
- Dados fictícios só em `src/mocks/` (MSW, fixtures em JSON com arrays/objetos); eventos só via `socket.io-client`.
- UI e textos em pt-BR.
