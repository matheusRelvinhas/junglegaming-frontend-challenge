import type { Page } from '@playwright/test'
import { catalogCards, expect, openApp, test } from '../support/app.ts'

function cardTitles(page: Page) {
  return catalogCards(page).getByRole('heading', { level: 3 })
}

function resultCount(page: Page) {
  return page.locator('#catalogo').getByText(/^\d+ NFTs$/)
}

async function cardPrices(page: Page) {
  const priceTexts = await catalogCards(page).getByText(/ETH$/).allTextContents()
  return priceTexts.map((priceText) => Number(priceText.replace(' ETH', '')))
}

async function toggleFilter(page: Page, isMobile: boolean, optionLabel: RegExp) {
  if (isMobile) await page.getByRole('button', { name: 'Abrir filtros' }).click()
  const filters = isMobile ? page.getByRole('dialog', { name: 'Filtros' }) : page.getByRole('complementary', { name: 'Filtros e destaque' })
  await filters.getByRole('button', { name: optionLabel }).click()
  if (isMobile) await filters.getByRole('button', { name: /^Ver \d+ resultados$/ }).click()
}

test.describe('Catálogo', () => {
  test('busca vai para a URL, filtra a lista e trata resultado vazio', { tag: '@principal' }, async ({ page }) => {
    await openApp(page)
    const searchBox = page.getByRole('searchbox', { name: 'Buscar NFTs pelo nome' })

    await searchBox.fill('Golden')
    await expect(page).toHaveURL(/search=Golden/)
    await expect(cardTitles(page)).toHaveText(['Golden Beat #207', 'Golden Frequency #071', 'Golden Signal #160'])

    await searchBox.fill('nada-com-esse-nome')
    await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros' }).click()
    await expect(page).not.toHaveURL(/search=/)
    await expect(searchBox).toHaveValue('')
    await expect(cardTitles(page)).toHaveCount(9)
  })

  test('filtros combinados reiniciam a paginação', { tag: '@principal' }, async ({ page, isMobile }) => {
    await openApp(page)
    await expect(resultCount(page)).toHaveText('30 NFTs')

    await page.getByRole('button', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')

    await toggleFilter(page, isMobile, /^Música/)
    await expect(page).toHaveURL(/collection=music/)
    await expect(page).not.toHaveURL(/page=/)
    await expect(resultCount(page)).toHaveText('5 NFTs')

    await toggleFilter(page, isMobile, /^Polygon/)
    await expect(page).toHaveURL(/collection=music/)
    await expect(page).toHaveURL(/network=polygon/)
    await expect(resultCount(page)).toHaveText('4 NFTs')
  })

  test('ordenação vai para a URL e para a API', { tag: '@principal' }, async ({ page }) => {
    await openApp(page)
    const sortSelect = page.getByLabel('Ordenar por:')
    await expect(cardTitles(page).first()).toHaveText('Emerald Ape #042')

    await sortSelect.selectOption('price-asc')
    await expect(page).toHaveURL(/sort=price-asc/)
    await expect(cardTitles(page).first()).toHaveText('Tempo Spark #188')
    const ascendingPrices = await cardPrices(page)
    expect(ascendingPrices).toEqual([...ascendingPrices].sort((first, second) => first - second))

    await sortSelect.selectOption('price-desc')
    await expect(page).toHaveURL(/sort=price-desc/)
    await expect(cardTitles(page).first()).toHaveText('Marble Duke #350')

    await sortSelect.selectOption('name')
    await expect(cardTitles(page).first()).toHaveText('Amber Echo #391')
    const names = await cardTitles(page).allTextContents()
    expect(names).toEqual([...names].sort((first, second) => first.localeCompare(second, 'pt-BR')))

    await page.getByRole('button', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/sort=name/)
    await expect(page).toHaveURL(/page=2/)
  })

  test('refresh e histórico restauram filtros, ordenação e página', { tag: '@principal' }, async ({ page, isMobile }) => {
    await openApp(page)
    const sortSelect = page.getByLabel('Ordenar por:')

    await toggleFilter(page, isMobile, /^Música/)
    await expect(resultCount(page)).toHaveText('5 NFTs')
    await sortSelect.selectOption('price-desc')
    await expect(page).toHaveURL(/collection=music/)
    await expect(page).toHaveURL(/sort=price-desc/)

    await page.reload()
    await expect(sortSelect).toHaveValue('price-desc')
    await expect(resultCount(page)).toHaveText('5 NFTs')
    await expect(cardTitles(page).first()).toHaveText('Golden Beat #207')

    await page.goBack()
    await expect(page).not.toHaveURL(/sort=/)
    await expect(sortSelect).toHaveValue('recent')
    await expect(resultCount(page)).toHaveText('5 NFTs')

    await page.goBack()
    await expect(page).not.toHaveURL(/collection=/)
    await expect(resultCount(page)).toHaveText('30 NFTs')

    await page.goForward()
    await expect(page).toHaveURL(/collection=music/)
    await expect(resultCount(page)).toHaveText('5 NFTs')
  })

  test.describe('com respostas fora de ordem', () => {
    test.use({ scenario: { catalogOrder: 'out-of-order' } })

    test('cancela a resposta antiga e mantém a última busca', async ({ page }) => {
      await openApp(page)
      await expect(resultCount(page)).toHaveText('30 NFTs')
      const filters = page.getByRole('complementary', { name: 'Filtros e destaque' })
      const isMusicRequest = (request: { url: () => string }) => request.url().includes('collection=music')
      const slowMusicRequest = page.waitForRequest(isMusicRequest)
      const cancelledMusicRequest = page.waitForEvent('requestfailed', isMusicRequest)

      await filters.getByRole('button', { name: /^Música/ }).click()
      await slowMusicRequest
      await filters.getByRole('button', { name: /^Fotografia/ }).click()
      await cancelledMusicRequest

      await expect(page).toHaveURL(/collection=photography/)
      await expect(resultCount(page)).toHaveText('3 NFTs')
      await expect(cardTitles(page).filter({ hasText: 'Golden' })).toHaveCount(0)
    })
  })
})
