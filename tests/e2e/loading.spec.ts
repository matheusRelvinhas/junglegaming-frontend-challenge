import { STORAGE_KEYS } from '../../src/constants/storage.ts'
import { cartSummary, catalogCards, chooseScenarioInPanel, expect, openApp, test } from '../support/app.ts'

test.describe('Carregamento lento', () => {
  test.use({ scenario: { latency: 'slow' } })

  test('skeletons no catálogo, no detalhe e no resumo do carrinho', async ({ page }) => {
    await openApp(page)
    await expect(page.getByRole('list', { name: 'Carregando NFTs' })).toHaveAttribute('aria-busy', 'true')
    await expect(page.getByRole('list', { name: 'Carregando NFTs' })).toBeHidden({ timeout: 15_000 })
    await expect(catalogCards(page)).toHaveCount(9)

    await openApp(page, '/nft/1')
    await expect(page.getByLabel('Carregando NFT', { exact: true })).toHaveAttribute('aria-busy', 'true')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible({ timeout: 15_000 })

    await page.evaluate((cartKey) => {
      localStorage.setItem(cartKey, JSON.stringify([{ nft_id: 1, edition: '1-50', quantity: 1 }]))
    }, STORAGE_KEYS.cart)
    await openApp(page, '/cart')
    await expect(cartSummary(page).locator('dl')).toHaveAttribute('aria-busy', 'true')
    await expect(cartSummary(page).locator('dl')).toHaveAttribute('aria-busy', 'false', { timeout: 15_000 })
    await expect(cartSummary(page)).toContainText('1.19 ETH')
  })

  test.describe('com movimento reduzido', () => {
    test.use({ reducedMotion: 'reduce' })

    test('o shimmer dos skeletons fica parado', async ({ page }) => {
      await openApp(page)
      const skeleton = page.getByRole('list', { name: 'Carregando NFTs' }).locator('[aria-hidden]').first()
      const shimmerDuration = await skeleton.evaluate((element) => getComputedStyle(element, '::before').animationDuration)
      expect(parseFloat(shimmerDuration)).toBeLessThan(0.01)
    })
  })
})

test.describe('Falha nas leituras', () => {
  test.use({ scenario: { reads: 'fail' } })

  test('catálogo e destaques mostram o erro e se recuperam com "Tentar novamente"', async ({ page }) => {
    await openApp(page)
    const catalog = page.locator('#catalogo')
    await expect(catalog.getByRole('heading', { name: 'Não foi possível carregar os NFTs' })).toBeVisible()
    await expect(catalog.getByText('Serviço indisponível no momento. Tente novamente.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Não foi possível carregar os destaques' })).toBeVisible()

    await chooseScenarioInPanel(page, 'Leituras (catálogo, detalhe, banners)', 'Funcionam')
    await catalog.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(catalogCards(page)).toHaveCount(9)
  })

  test('detalhe mostra o erro e se recupera com "Tentar novamente"', async ({ page }) => {
    await openApp(page, '/nft/1')
    await expect(page.getByRole('heading', { name: 'Não foi possível carregar o NFT' })).toBeVisible()

    await chooseScenarioInPanel(page, 'Leituras (catálogo, detalhe, banners)', 'Funcionam')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  })
})
