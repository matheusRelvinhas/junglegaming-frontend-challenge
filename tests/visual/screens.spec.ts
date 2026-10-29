import type { Page } from '@playwright/test'
import { addToCart, cartSummary, catalogCards, expect, login, openApp, test } from '../support/app.ts'

async function waitForStableScreen(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete))
}

test.describe('Regressão visual', { tag: '@visual' }, () => {
  test.use({ reducedMotion: 'reduce' })

  test('início', async ({ page }) => {
    await openApp(page)
    await expect(page.getByRole('region', { name: 'Destaques da Kurio' })).toBeVisible()
    await expect(catalogCards(page)).toHaveCount(9)
    await waitForStableScreen(page)
    await expect(page).toHaveScreenshot('home.png', { fullPage: true })
  })

  test('detalhe do NFT', async ({ page }) => {
    await openApp(page, '/nft/1')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Mais desta coleção' }).getByRole('article').first()).toBeVisible()
    await waitForStableScreen(page)
    await expect(page).toHaveScreenshot('nft-detail.png', { fullPage: true })
  })

  test('carrinho', async ({ page }) => {
    await addToCart(page, 1, { edition: '1/50', quantity: 2 })
    await addToCart(page, 2, { edition: '1/10' })
    await expect(cartSummary(page).locator('dl')).toHaveAttribute('aria-busy', 'false')
    await expect(page.getByRole('heading', { name: 'Colecionadores também viram' })).toBeVisible()
    await waitForStableScreen(page)
    await expect(page).toHaveScreenshot('cart.png', { fullPage: true })
  })

  test('pagamento', async ({ page }) => {
    await addToCart(page, 1, { edition: '1/50', quantity: 2 })
    await login(page)
    await openApp(page, '/checkout')
    await expect(page.getByRole('region', { name: 'Seus NFTs' })).toContainText('Emerald Ape #042')
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Nova Sato')
    await waitForStableScreen(page)
    await expect(page).toHaveScreenshot('checkout.png', { fullPage: true })
  })
})
