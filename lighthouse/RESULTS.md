# Resultados do Lighthouse

> Gerado por `npm run lighthouse` (scripts/lighthouse.ts). Não edite à mão: rode de novo. A análise fica em [README.md](README.md).

## Medianas (3 execuções por página e perfil)

| Página | Perfil | Performance (≥ 90) | Accessibility (≥ 95) | Best Practices (≥ 95) | SEO (≥ 90) | LCP | CLS | TBT | Relatório (execução representativa) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Início | Mobile | **80** ⚠️ | 96 ✅ | 100 ✅ | 100 ✅ | 3.56 s | 0.000 | 427 ms | [HTML](reports/home-mobile.report.html) · [JSON](reports/home-mobile.report.json) (execução 2) |
| Início | Desktop | 100 ✅ | 97 ✅ | 100 ✅ | 100 ✅ | 0.79 s | 0.003 | 11 ms | [HTML](reports/home-desktop.report.html) · [JSON](reports/home-desktop.report.json) (execução 1) |
| Detalhe do NFT | Mobile | **83** ⚠️ | 100 ✅ | 100 ✅ | 100 ✅ | 3.64 s | 0.000 | 305 ms | [HTML](reports/nft-detail-mobile.report.html) · [JSON](reports/nft-detail-mobile.report.json) (execução 1) |
| Detalhe do NFT | Desktop | 100 ✅ | 100 ✅ | 100 ✅ | 100 ✅ | 0.82 s | 0.015 | 0 ms | [HTML](reports/nft-detail-desktop.report.html) · [JSON](reports/nft-detail-desktop.report.json) (execução 2) |

## Ambiente e condições

| Item | Valor |
| --- | --- |
| Data | 2026-10-29T15:50:16.110Z |
| Lighthouse | 13.6.0 |
| Navegador | HeadlessChrome/156.0.0.0 |
| Node.js | v24.22.1 |
| Sistema | Windows_NT 10.0.19045 (x64) |
| CPU | Intel(R) Xeon(R) CPU E5-2670 v3 @ 2.30GHz · 24 núcleos |
| Memória | 24 GB |
| Build | vite build --mode test (produção, mocks MSW ligados, cenário padrão) + vite preview |
| Throttling (Mobile) | formFactor mobile, método simulate, RTT 150 ms, banda 1638.4 Kbps, CPU 4× |
| Throttling (Desktop) | formFactor desktop, método simulate, RTT 40 ms, banda 10240 Kbps, CPU 1× |

## Execuções individuais

> Os relatórios de todas as execuções ficam em `lighthouse/runs/` (gerados localmente, fora do Git).

| Página | Perfil | Execução | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Início | Mobile | 1 | 79 | 96 | 100 | 100 | 3.56 s | 0.000 | 460 ms |
| Início | Mobile | 2 | 80 | 96 | 100 | 100 | 3.51 s | 0.000 | 422 ms |
| Início | Mobile | 3 | 80 | 96 | 100 | 100 | 3.57 s | 0.004 | 427 ms |
| Início | Desktop | 1 | 100 | 97 | 100 | 100 | 0.79 s | 0.003 | 16 ms |
| Início | Desktop | 2 | 100 | 97 | 100 | 100 | 0.79 s | 0.003 | 11 ms |
| Início | Desktop | 3 | 100 | 97 | 100 | 100 | 0.82 s | 0.003 | 10 ms |
| Detalhe do NFT | Mobile | 1 | 83 | 100 | 100 | 100 | 3.65 s | 0.000 | 305 ms |
| Detalhe do NFT | Mobile | 2 | 83 | 100 | 100 | 100 | 3.64 s | 0.000 | 304 ms |
| Detalhe do NFT | Mobile | 3 | 82 | 100 | 100 | 100 | 3.58 s | 0.000 | 369 ms |
| Detalhe do NFT | Desktop | 1 | 99 | 100 | 100 | 100 | 0.82 s | 0.015 | 0 ms |
| Detalhe do NFT | Desktop | 2 | 100 | 100 | 100 | 100 | 0.82 s | 0.015 | 0 ms |
| Detalhe do NFT | Desktop | 3 | 100 | 100 | 100 | 100 | 0.78 s | 0.015 | 0 ms |
