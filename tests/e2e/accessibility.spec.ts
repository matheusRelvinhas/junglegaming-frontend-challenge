import type { Locator, Page } from '@playwright/test'
import { range } from '../../src/utils/array.ts'
import { changeMarket, expect, loginDialog, openApp, test } from '../support/app.ts'

const MAX_TABS = 60

async function tabUntilFocused(page: Page, target: Locator) {
  for (const _tab of range(MAX_TABS)) {
    const isFocused = await target.evaluate((element) => element === document.activeElement)
    if (isFocused) return
    await page.keyboard.press('Tab')
  }
  throw new Error('O elemento não recebeu foco pelo teclado.')
}

async function expectVisibleFocus(target: Locator) {
  const outlineStyle = await target.evaluate((element) => getComputedStyle(element).outlineStyle)
  expect(outlineStyle).not.toBe('none')
}

async function expectFocusInside(dialog: Locator) {
  await expect(dialog.locator(':focus')).toHaveCount(1)
}

test.describe('Acessibilidade', () => {
  test('busca e abre um NFT só com o teclado, com foco visível', async ({ page }) => {
    await openApp(page)
    const searchBox = page.getByRole('searchbox', { name: 'Buscar NFTs pelo nome' })

    await tabUntilFocused(page, searchBox)
    await page.keyboard.type('Emerald')
    await expect(page).toHaveURL(/search=Emerald/)

    const card = page.locator('#catalogo').getByRole('list').getByRole('link', { name: /Emerald Ape #042/ })
    await tabUntilFocused(page, card)
    await expectVisibleFocus(card)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/nft\/1$/)
  })

  test('diálogo de login: o foco entra, fica preso e volta ao fechar', async ({ page }) => {
    await openApp(page)
    const loginButton = page.getByRole('banner').getByRole('button', { name: 'Entrar' })

    await tabUntilFocused(page, loginButton)
    await page.keyboard.press('Enter')
    const dialog = loginDialog(page)
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('E-mail')).toBeFocused()

    for (const _tab of range(10)) {
      await page.keyboard.press('Tab')
      await expectFocusInside(dialog)
    }

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page).not.toHaveURL(/auth=/)
    await expect(loginButton).toBeFocused()
  })

  test('zoom da galeria: foco no fechar e retorno ao botão de origem', async ({ page }) => {
    await openApp(page, '/nft/1')
    const zoomButton = page.getByRole('button', { name: 'Ampliar imagem' })

    await tabUntilFocused(page, zoomButton)
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Imagem ampliada: Emerald Ape #042' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Fechar imagem ampliada' })).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(zoomButton).toBeFocused()
  })

  test('filtros no tablet: bottom sheet com foco preso e retorno', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await openApp(page)
    const openFilters = page.getByRole('button', { name: 'Abrir filtros' })

    await tabUntilFocused(page, openFilters)
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Filtros' })
    await expect(dialog).toBeVisible()
    await expectFocusInside(dialog)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(openFilters).toBeFocused()
  })

  test('validação: erros ligados aos campos e foco no primeiro inválido', async ({ page }) => {
    await openApp(page, '/?auth=signup')
    const dialog = page.getByRole('dialog', { name: 'Criar perfil de colecionador' })

    await dialog.getByRole('button', { name: 'Criar conta' }).press('Enter')
    const nameInput = dialog.getByLabel('Nome de usuário')
    await expect(nameInput).toBeFocused()
    await expect(nameInput).toHaveAttribute('aria-invalid', 'true')
    await expect(nameInput).toHaveAccessibleDescription('Use pelo menos 3 caracteres no nome de usuário.')
    await expect(dialog.getByLabel('E-mail')).toHaveAccessibleDescription('Informe um e-mail válido.')
  })

  test('mudança em tempo real é anunciada para leitores de tela', async ({ page }) => {
    await openApp(page, '/nft/1')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()

    await changeMarket(page, 1, 'price-up')
    await expect(page.locator('[aria-live="polite"]').filter({ hasText: 'Preço de Emerald Ape #042 mudou de 1.19 para 1.31 ETH.' })).toHaveCount(1)
  })
})
