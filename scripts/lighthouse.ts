import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { chromium } from '@playwright/test'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import { build, preview } from 'vite'
import {
  AUDIT_PORT,
  AUDIT_PROFILES,
  AUDITED_PAGES,
  CATEGORY_TARGETS,
  REPORTED_METRICS,
  RUNS_PER_AUDIT,
} from '../lighthouse/audit.config.ts'
import { range } from '../src/utils/array.ts'

const BUILD_DIR = 'dist-lighthouse'
const LIGHTHOUSE_DIR = new URL('../lighthouse/', import.meta.url)
const REPORTS_DIR = new URL('reports/', LIGHTHOUSE_DIR)
const RUNS_DIR = new URL('runs/', LIGHTHOUSE_DIR)

type Measurement = { id: string; value: number }
type AuditRun = { run: number; scores: Measurement[]; metrics: Measurement[] }
type AuditSummary = {
  page: (typeof AUDITED_PAGES)[number]
  profile: (typeof AUDIT_PROFILES)[number]
  runs: AuditRun[]
  medianScores: Measurement[]
  medianMetrics: Measurement[]
  representativeRun: number
  throttling: string
}

function median(values: number[]) {
  const sortedValues = [...values].sort((first, second) => first - second)
  return sortedValues[Math.floor(sortedValues.length / 2)]
}

function medianOf(runs: AuditRun[], field: 'scores' | 'metrics', id: string) {
  return median(runs.map((auditRun) => auditRun[field].find((measurement) => measurement.id === id)?.value ?? 0))
}

function formatMetric(id: string, value: number) {
  if (id === 'cumulative-layout-shift') return value.toFixed(3)
  if (id === 'largest-contentful-paint') return `${(value / 1000).toFixed(2)} s`
  return `${Math.round(value)} ms`
}

function scoreCell(value: number, target: number) {
  return value >= target ? `${value} ✅` : `**${value}** ⚠️`
}

async function runAudit(url: string, chromePort: number, profileName: string, reportName: string) {
  const config = profileName === 'desktop' ? desktopConfig : undefined
  const result = await lighthouse(url, { port: chromePort, output: ['html', 'json'], logLevel: 'error' }, config)
  if (!result) throw new Error(`Lighthouse não retornou resultado para ${url}`)

  const [htmlReport, jsonReport] = result.report as string[]
  writeFileSync(new URL(`${reportName}.report.html`, RUNS_DIR), htmlReport)
  writeFileSync(new URL(`${reportName}.report.json`, RUNS_DIR), jsonReport)
  return result.lhr
}

function describeThrottling(settings: { formFactor?: string; throttlingMethod?: string; throttling?: Record<string, number | undefined> }) {
  const throttling = settings.throttling ?? {}
  return [
    `formFactor ${settings.formFactor}`,
    `método ${settings.throttlingMethod}`,
    `RTT ${throttling.rttMs} ms`,
    `banda ${throttling.throughputKbps} Kbps`,
    `CPU ${throttling.cpuSlowdownMultiplier}×`,
  ].join(', ')
}

function reportFileName(summary: AuditSummary) {
  return `${summary.page.name}-${summary.profile.name}`
}

// Execução representativa = a de Performance mediana; é a que vai para lighthouse/reports (versionada).
function saveRepresentativeReport(summary: AuditSummary) {
  const runName = `${reportFileName(summary)}-${summary.representativeRun}`
  copyFileSync(new URL(`${runName}.report.html`, RUNS_DIR), new URL(`${reportFileName(summary)}.report.html`, REPORTS_DIR))
  copyFileSync(new URL(`${runName}.report.json`, RUNS_DIR), new URL(`${reportFileName(summary)}.report.json`, REPORTS_DIR))
}

function writeResults(summaries: AuditSummary[], environment: { label: string; value: string }[]) {
  const header = `| Página | Perfil | ${CATEGORY_TARGETS.map((category) => `${category.label} (≥ ${category.target})`).join(' | ')} | ${REPORTED_METRICS.map((metric) => metric.label).join(' | ')} | Relatório (execução representativa) |`
  const separator = `|${' --- |'.repeat(3 + CATEGORY_TARGETS.length + REPORTED_METRICS.length)}`

  const medianRows = summaries.map((summary) => {
    const scores = CATEGORY_TARGETS.map((category) => {
      const value = summary.medianScores.find((score) => score.id === category.id)?.value ?? 0
      return scoreCell(value, category.target)
    })
    const metrics = REPORTED_METRICS.map((metric) => {
      const value = summary.medianMetrics.find((measurement) => measurement.id === metric.id)?.value ?? 0
      return formatMetric(metric.id, value)
    })
    const reportName = reportFileName(summary)
    const reportLinks = `[HTML](reports/${reportName}.report.html) · [JSON](reports/${reportName}.report.json) (execução ${summary.representativeRun})`
    return `| ${summary.page.label} | ${summary.profile.label} | ${scores.join(' | ')} | ${metrics.join(' | ')} | ${reportLinks} |`
  })

  const runRows: string[] = []
  summaries.forEach((summary) => {
    summary.runs.forEach((auditRun) => {
      const scores = auditRun.scores.map((score) => score.value)
      const metrics = auditRun.metrics.map((measurement) => formatMetric(measurement.id, measurement.value))
      runRows.push(`| ${summary.page.label} | ${summary.profile.label} | ${auditRun.run} | ${scores.join(' | ')} | ${metrics.join(' | ')} |`)
    })
  })

  const markdown = [
    '# Resultados do Lighthouse',
    '',
    '> Gerado por `npm run lighthouse` (scripts/lighthouse.ts). Não edite à mão: rode de novo. A análise fica em [README.md](README.md).',
    '',
    '## Medianas (3 execuções por página e perfil)',
    '',
    header,
    separator,
    ...medianRows,
    '',
    '## Ambiente e condições',
    '',
    '| Item | Valor |',
    '| --- | --- |',
    ...environment.map((item) => `| ${item.label} | ${item.value} |`),
    ...summaries
      .filter((summary) => summary.page.name === AUDITED_PAGES[0].name)
      .map((summary) => `| Throttling (${summary.profile.label}) | ${summary.throttling} |`),
    '',
    '## Execuções individuais',
    '',
    '> Os relatórios de todas as execuções ficam em `lighthouse/runs/` (gerados localmente, fora do Git).',
    '',
    `| Página | Perfil | Execução | ${CATEGORY_TARGETS.map((category) => category.label).join(' | ')} | ${REPORTED_METRICS.map((metric) => metric.label).join(' | ')} |`,
    `|${' --- |'.repeat(3 + CATEGORY_TARGETS.length + REPORTED_METRICS.length)}`,
    ...runRows,
    '',
  ].join('\n')

  writeFileSync(new URL('RESULTS.md', LIGHTHOUSE_DIR), markdown)
  writeFileSync(new URL('results.json', LIGHTHOUSE_DIR), `${JSON.stringify({ environment, summaries }, null, 2)}\n`)
}

rmSync(REPORTS_DIR, { recursive: true, force: true })
rmSync(RUNS_DIR, { recursive: true, force: true })
mkdirSync(REPORTS_DIR, { recursive: true })
mkdirSync(RUNS_DIR, { recursive: true })

console.log('Build de produção com os mocks (.env.test)…')
await build({ mode: 'test', logLevel: 'warn', build: { outDir: BUILD_DIR, emptyOutDir: true } })
const server = await preview({ mode: 'test', build: { outDir: BUILD_DIR }, preview: { port: AUDIT_PORT, strictPort: true } })
const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--no-sandbox'] })

const summaries: AuditSummary[] = []
let lighthouseVersion = ''
let userAgent = ''

try {
  for (const page of AUDITED_PAGES) {
    for (const profile of AUDIT_PROFILES) {
      const runs: AuditRun[] = []
      let throttling = ''
      for (const run of range(RUNS_PER_AUDIT)) {
        console.log(`${page.label} · ${profile.label} · execução ${run}/${RUNS_PER_AUDIT}`)
        const lhr = await runAudit(`http://localhost:${AUDIT_PORT}${page.path}`, chrome.port, profile.name, `${page.name}-${profile.name}-${run}`)
        lighthouseVersion = lhr.lighthouseVersion
        userAgent = lhr.environment.hostUserAgent
        throttling = describeThrottling(lhr.configSettings)
        runs.push({
          run,
          scores: CATEGORY_TARGETS.map((category) => ({ id: category.id, value: Math.round((lhr.categories[category.id]?.score ?? 0) * 100) })),
          metrics: REPORTED_METRICS.map((metric) => ({ id: metric.id, value: lhr.audits[metric.id]?.numericValue ?? 0 })),
        })
      }
      const medianScores = CATEGORY_TARGETS.map((category) => ({ id: category.id, value: medianOf(runs, 'scores', category.id) }))
      const medianPerformance = medianScores.find((score) => score.id === 'performance')?.value
      const representativeRun = runs.find((auditRun) => auditRun.scores.find((score) => score.id === 'performance')?.value === medianPerformance)
      const summary: AuditSummary = {
        page,
        profile,
        runs,
        throttling,
        medianScores,
        medianMetrics: REPORTED_METRICS.map((metric) => ({ id: metric.id, value: medianOf(runs, 'metrics', metric.id) })),
        representativeRun: representativeRun?.run ?? 1,
      }
      saveRepresentativeReport(summary)
      summaries.push(summary)
    }
  }
} finally {
  chrome.kill()
  server.httpServer.close()
}

const environment = [
  { label: 'Data', value: new Date().toISOString() },
  { label: 'Lighthouse', value: lighthouseVersion },
  { label: 'Navegador', value: userAgent.match(/(HeadlessChrome|Chrome)\/[\d.]+/)?.[0] ?? userAgent },
  { label: 'Node.js', value: process.version },
  { label: 'Sistema', value: `${os.type()} ${os.release()} (${os.arch()})` },
  { label: 'CPU', value: `${os.cpus()[0]?.model ?? 'desconhecida'} · ${os.cpus().length} núcleos` },
  { label: 'Memória', value: `${Math.round(os.totalmem() / 1024 ** 3)} GB` },
  { label: 'Build', value: 'vite build --mode test (produção, mocks MSW ligados, cenário padrão) + vite preview' },
]

writeResults(summaries, environment)
console.log('Pronto: lighthouse/RESULTS.md, lighthouse/results.json e lighthouse/reports/')
