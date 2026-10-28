# Kurio: NFT Marketplace (desafio frontend)

O contexto completo do projeto (stack, tokens, ícones, telas, regras, contratos, roadmap) fica em CONTEXT.md:

@CONTEXT.md

## Estilo de código
- **Código simples**, fácil de entender. Prefira a solução direta à "esperta".
- **Nomes que descrevem a lógica** (`isMobile`, `subscribeToMobileChange`, `cartTotal`), nunca genéricos (`data`, `handle`, `temp`).
- **Poucos comentários**: só quando o código sozinho não explica o porquê. Nada de comentário que repete o código.

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
- Dados fictícios só em `src/mocks/` (MSW); eventos só via `socket.io-client`.
- UI e textos em pt-BR.
