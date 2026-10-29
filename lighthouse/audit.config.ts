export const AUDIT_PORT = 4180

export const RUNS_PER_AUDIT = 3

export const AUDITED_PAGES = [
  { name: 'home', label: 'Início', path: '/' },
  { name: 'nft-detail', label: 'Detalhe do NFT', path: '/nft/1' },
]

export const AUDIT_PROFILES = [
  { name: 'mobile', label: 'Mobile' },
  { name: 'desktop', label: 'Desktop' },
] as const

export const CATEGORY_TARGETS = [
  { id: 'performance', label: 'Performance', target: 90 },
  { id: 'accessibility', label: 'Accessibility', target: 95 },
  { id: 'best-practices', label: 'Best Practices', target: 95 },
  { id: 'seo', label: 'SEO', target: 90 },
]

export const REPORTED_METRICS = [
  { id: 'largest-contentful-paint', label: 'LCP', unit: 'ms' },
  { id: 'cumulative-layout-shift', label: 'CLS', unit: '' },
  { id: 'total-blocking-time', label: 'TBT', unit: 'ms' },
]
