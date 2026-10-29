# Auditoria Lighthouse (README §10)

## Como rodar

```
npx playwright install chromium   (uma vez: é o navegador usado na auditoria)
npm run lighthouse
```

O script [`scripts/lighthouse.ts`](../scripts/lighthouse.ts):
1. gera o **build de produção** com os mocks ligados (`vite build --mode test`, variáveis em `.env.test`, cenário padrão do MSW), igual ao deploy;
2. sobe o `vite preview` na porta 4180;
3. roda o Lighthouse **3 vezes** em cada página (Início `/` e Detalhe `/nft/1`) e em cada perfil (mobile e desktop), num Chromium headless;
4. grava as medianas em [`RESULTS.md`](RESULTS.md), os dados de todas as execuções em `results.json` e os relatórios HTML/JSON da execução representativa em `reports/`.

A configuração versionada fica em [`audit.config.ts`](audit.config.ts): páginas, perfis, número de execuções, metas e métricas.

**Perfis:**
- **mobile:** padrão do Lighthouse, com rede 4G lenta simulada (RTT 150 ms, 1,6 Mbps) e CPU 4× mais lenta.
- **desktop:** preset oficial `desktop-config` (RTT 40 ms, 10 Mbps, CPU 1×).

O ambiente exato de cada execução (versões do Lighthouse, Chrome e Node, sistema, CPU e memória) é gravado em `RESULTS.md`.

Nada é simplificado para a auditoria. O site medido é o build entregue, com imagens, fontes, ícones, MSW e o Socket.IO simulado.

## Resultado

As medianas, LCP, CLS, TBT e o ambiente da última auditoria estão em [`RESULTS.md`](RESULTS.md), que é gerado pelo script. Em resumo:
- **Desktop:** 100 em Performance, Best Practices e SEO nas duas páginas; Accessibility 97 (Início) e 100 (Detalhe).
- **Mobile:** Accessibility 96–100, Best Practices 100, SEO 100. **Performance fica entre 80 e 84**, com LCP de cerca de 3,6 s e TBT de 275–415 ms, abaixo da meta de 90 (análise abaixo).
- **CLS:** perto de zero em todos os casos (até 0,015).

**Relatórios versionados:** só o HTML e o JSON da execução representativa (a de Performance mediana) de cada página e perfil vão para `reports/`. As 3 execuções são praticamente iguais, e todos os números delas estão no `RESULTS.md` e no `results.json`. Os relatórios completos das 12 execuções são gerados em `runs/`, que fica fora do Git.

## Melhorias aplicadas a partir da primeira auditoria

| Problema medido | Causa | Correção | Efeito |
| --- | --- | --- | --- |
| SEO 92 | Sem `robots.txt`: o preview devolvia o `index.html` | `public/robots.txt` | SEO 100 |
| CLS 0,104 na Início (mobile) | O banner chegava da API mais alto que o skeleton e empurrava o catálogo | Altura fixa no banner e no skeleton; título e descrição limitados a 2 e 3 linhas no mobile (mais perto do frame do Figma) | CLS 0,002 |
| CLS 0,217 no Detalhe (desktop) | Com a página ainda carregando, o rodapé aparecia na tela e depois era empurrado | `main` com altura mínima de uma tela no desktop | CLS 0,014; Performance 89 → 100 |
| LCP alto | Arte do banner (elemento de LCP) em PNG de 436 KB | Artes em WebP (`npm run images`): 436 KB → 24 KB | LCP mobile 3,70 s → 3,52 s |
| TBT alto | Todas as páginas no mesmo bundle (574 KB) | Detalhe, Carrinho, Pagamento e Perfil carregados sob demanda (`lazyRouteComponent`): bundle inicial de 337 KB | Performance mobile 76 → 81 (Início) e 82 → 84 (Detalhe) |

## Por que Performance no mobile fica abaixo de 90

O perfil mobile do Lighthouse simula uma CPU 4× mais lenta e um 4G lento. Duas causas respondem pelo restante:

1. **A camada de mocks faz parte da entrega e roda antes da primeira tela.** O README pede MSW ligado no build de demonstração. Antes de renderizar, o app registra o Service Worker do MSW e carrega o código dos mocks (MSW, handlers, servidor Socket.IO simulado e fixtures, cerca de 460 KB de JavaScript). Sem isso, as requisições escapariam do mock.
   - Essa espera atrasa o primeiro desenho (LCP) e aumenta o trabalho na thread principal (TBT).
   - Com um backend real, esse código e esse passo não existiriam.
2. **O elemento de LCP depende de dados.** A arte do banner vem da resposta de `GET /api/banners`. Por isso o download da imagem só começa depois da cadeia HTML → JS → MSW → API, mesmo com a imagem agora pequena. O mesmo vale para o Detalhe, cuja imagem vem do `nft_info`.

Próximos passos possíveis, ainda não aplicados:
- pré-renderizar o HTML da Início (SSR ou SSG);
- usar um `<link rel="preload">` para a arte do primeiro banner, desde que ele seja conhecido no build;
- reduzir o custo do MSW carregando as fixtures sob demanda.

No desktop todas as metas são atingidas, com nota 100.
