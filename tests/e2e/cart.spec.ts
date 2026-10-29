import type { Page } from '@playwright/test'
import { addToCart, cartLink, cartSummary as summary, expect, fillLogin, openApp, summaryValue, test, USERS } from '../support/app.ts'

async function applyCoupon(page: Page, code: string) {
  await page.getByLabel('Código promocional').fill(code)
  await page.getByRole('button', { name: 'Aplicar' }).click()
}

test.describe('Carrinho', () => {
  test('altera quantidades, remove itens e recalcula o resumo', { tag: '@principal' }, async ({ page }) => {
    await addToCart(page, 1, { edition: '1/50', quantity: 2 })
    const emeraldStepper = page.getByRole('group', { name: 'Quantidade de Emerald Ape #042 (1/50)' })

    await expect(summaryValue(page, 'Subtotal')).toHaveText('2.38 ETH')
    await expect(summaryValue(page, 'Taxa de rede')).toHaveText('0.016 ETH')
    await expect(summary(page)).toContainText(/Total\s*2\.396 ETH/)
    await expect(cartLink(page)).toHaveAccessibleName('Carrinho com 2 itens')

    await emeraldStepper.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(summaryValue(page, 'Subtotal')).toHaveText('3.57 ETH')
    await emeraldStepper.getByRole('button', { name: 'Diminuir quantidade' }).click()
    await expect(summaryValue(page, 'Subtotal')).toHaveText('2.38 ETH')

    await addToCart(page, 2, { edition: '1/10' })
    await expect(summaryValue(page, 'Subtotal')).toHaveText('4.07 ETH')

    await page.getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' }).click()
    await expect(summaryValue(page, 'Subtotal')).toHaveText('1.69 ETH')
    await page.getByRole('button', { name: 'Remover Sage Nomad #009 do carrinho' }).click()
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
    await expect(cartLink(page)).toHaveAccessibleName('Carrinho com 0 itens')
  })

  test('cupom inválido, expirado, válido e remoção', { tag: '@principal' }, async ({ page }) => {
    await addToCart(page, 1, { edition: '1/50', quantity: 2 })

    await applyCoupon(page, 'NAOEXISTE')
    await expect(page.getByRole('alert').filter({ hasText: 'Cupom inválido.' })).toBeVisible()

    await applyCoupon(page, 'EXPIRADO')
    await expect(page.getByRole('alert').filter({ hasText: 'Este cupom expirou.' })).toBeVisible()

    await applyCoupon(page, 'kurio10')
    await expect(summary(page).getByText('Cupom KURIO10 (-10%)')).toBeVisible()
    await expect(summaryValue(page, 'Desconto do lançamento')).toHaveText('(-) 0.238')
    await expect(summary(page)).toContainText(/Total\s*2\.158 ETH/)

    await summary(page).getByRole('button', { name: 'Remover' }).click()
    await expect(summaryValue(page, 'Desconto do lançamento')).toHaveText('(-) 0.00')
    await expect(summary(page)).toContainText(/Total\s*2\.396 ETH/)
  })

  test('itens e cupom persistem após refresh e após o login', { tag: '@principal' }, async ({ page }) => {
    await addToCart(page, 1, { edition: '1/50', quantity: 2 })
    await applyCoupon(page, 'KURIO10')
    await expect(summary(page).getByText('Cupom KURIO10 (-10%)')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('group', { name: 'Quantidade de Emerald Ape #042 (1/50)' }).locator('output')).toHaveText('2')
    await expect(summary(page).getByText('Cupom KURIO10 (-10%)')).toBeVisible()

    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
    await fillLogin(page, USERS.nova)
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.getByRole('region', { name: 'Seus NFTs' })).toContainText('Emerald Ape #042')
    await expect(page.getByRole('region', { name: 'Seus NFTs' })).toContainText('(x 2)')
    await expect(cartLink(page)).toHaveAccessibleName('Carrinho com 2 itens')

    await openApp(page, '/cart')
    await expect(page.getByRole('link', { name: 'Finalizar' })).toBeVisible()
    await expect(summary(page).getByText('Cupom KURIO10 (-10%)')).toBeVisible()
  })
})
