import { expect, test as base, type Locator, type Page } from '@playwright/test'
import { MOCK_COMMANDS } from '../../src/constants/realtime.ts'
import { STORAGE_KEYS } from '../../src/constants/storage.ts'
import type { MarketAction } from '../../src/types/api.ts'
import type { MockScenario } from '../../src/types/mock.ts'
import { range } from '../../src/utils/array.ts'

export const USERS = {
  nova: { name: 'Nova Sato', email: 'nova@kurio.test', password: 'kurio123' },
  leo: { name: 'Leo Matsu', email: 'leo@kurio.test', password: 'kurio123' },
}

export const TEST_WALLET_ADDRESS = '0xA91F3c5E2b7D4f6A8C1e9B0d2F4a6C8E1b3DE82C'

declare global {
  interface Window {
    __kurioMock?: {
      sendCommand: (command: string, ...args: unknown[]) => void
      isRealtimeConnected: () => boolean
    }
  }
}

export const test = base.extend<{ scenario: Partial<MockScenario> }>({
  scenario: [{}, { option: true }],
  storageState: async ({ scenario, baseURL }, use) => {
    const scenarioEntry = { name: STORAGE_KEYS.mockScenario, value: JSON.stringify(scenario) }
    await use({ cookies: [], origins: [{ origin: baseURL ?? '', localStorage: [scenarioEntry] }] })
  },
})

export { expect }

export async function openApp(page: Page, path = '/') {
  await page.goto(path)
  await page.waitForFunction(() => window.__kurioMock !== undefined)
}

export async function waitForRealtime(page: Page, isConnected = true) {
  await page.waitForFunction((expected) => window.__kurioMock?.isRealtimeConnected() === expected, isConnected)
}

export async function sendMockCommand(page: Page, command: string, ...args: unknown[]) {
  await waitForRealtime(page)
  await page.evaluate((commandCall) => window.__kurioMock?.sendCommand(commandCall.command, ...commandCall.args), { command, args })
}

export async function changeMarket(page: Page, nftId: number, action: MarketAction) {
  await sendMockCommand(page, MOCK_COMMANDS.nftAction, nftId, action)
}

export async function clickInMockPanel(page: Page, buttonName: string) {
  await page.getByRole('button', { name: 'Simular tempo real (mock)' }).click()
  await page.locator('#mock-panel').getByRole('button', { name: buttonName }).click()
  await page.keyboard.press('Escape')
}

export async function chooseScenarioInPanel(page: Page, group: string, option: string) {
  await page.getByRole('button', { name: 'Simular tempo real (mock)' }).click()
  await page.getByRole('group', { name: group }).getByRole('button', { name: option }).click()
  await page.keyboard.press('Escape')
}

export async function clickTimes(locator: Locator, times: number) {
  for (const _click of range(times)) await locator.click()
}

export function loginButton(page: Page) {
  return page.getByRole('button', { name: 'Entrar', exact: true }).first()
}

export function loginDialog(page: Page) {
  return page.getByRole('dialog', { name: 'Entrar' })
}

export async function fillLogin(page: Page, user: { email: string; password: string }) {
  const dialog = loginDialog(page)
  await dialog.getByLabel('E-mail').fill(user.email)
  await dialog.getByLabel('Senha', { exact: true }).fill(user.password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
}

export async function login(page: Page, user = USERS.nova) {
  await loginButton(page).click()
  await fillLogin(page, user)
  await expect(loginDialog(page)).toBeHidden()
}

export async function logout(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByRole('button', { name: /^Conta de / }).click()
    await page.locator('#account-menu').getByRole('button', { name: 'Sair' }).click()
  } else {
    await page.getByRole('banner').getByRole('button', { name: 'Sair' }).click()
  }
  await expect(loginButton(page)).toBeVisible()
}

export async function expectLoggedIn(page: Page, isMobile: boolean, userName: string) {
  if (isMobile) await expect(page.getByRole('button', { name: `Conta de ${userName}` })).toBeVisible()
  else await expect(page.getByRole('banner').getByRole('link', { name: `Olá, ${userName.split(' ')[0]}` })).toBeVisible()
}

export async function favoriteNft(page: Page, nftId: number) {
  const savedFavorite = page.waitForResponse((response) => response.url().includes(`/api/favorites/${nftId}`) && response.ok())
  await page.getByRole('button', { name: 'Favoritar' }).click()
  await savedFavorite
}

export function catalogCards(page: Page) {
  return page.locator('#catalogo').getByRole('list').getByRole('article')
}

export function cartLink(page: Page) {
  return page.getByRole('link', { name: /^Carrinho com \d+ itens$/ }).first()
}

export function cartSummary(page: Page) {
  return page.getByRole('complementary', { name: 'Resumo da carteira' })
}

export function summaryValue(page: Page, label: string) {
  return cartSummary(page).locator('dt', { hasText: label }).locator('xpath=following-sibling::dd')
}

export async function addToCart(page: Page, nftId: number, { edition, quantity = 1 }: { edition: string; quantity?: number }) {
  await openApp(page, `/nft/${nftId}`)
  await page.getByRole('list', { name: 'Edições' }).getByRole('button', { name: edition, exact: true }).click()
  const increase = page.getByRole('group', { name: 'Quantidade', exact: true }).getByRole('button', { name: 'Aumentar quantidade' })
  await clickTimes(increase, quantity - 1)
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL(/\/cart$/)
}

export async function fillCheckoutForm(page: Page) {
  await page.getByLabel('Nome de usuário').fill('nova_sato')
  await page.getByRole('combobox', { name: 'Rede', exact: true }).selectOption('ethereum')
  await page.getByLabel('Nome do perfil').fill('Coleção Nova')
  await page.getByLabel('Tipo de carteira').selectOption({ index: 1 })
  await page.getByLabel('Nome ENS').fill('nova')
}

export async function connectWallet(page: Page, walletLabel = 'MetaMask') {
  await page.getByRole('radio', { name: walletLabel }).check()
  await page.getByRole('button', { name: `Conectar ${walletLabel}` }).click()
  await expect(page.getByText(`${walletLabel} conectada`)).toBeVisible()
}

export function confirmPurchaseButton(page: Page) {
  return page.locator('button[form="checkout-form"]')
}

export function receiptDialog(page: Page) {
  return page.getByRole('dialog', { name: 'Seus NFTs agora estão na sua carteira' })
}

export async function prepareCheckout(page: Page) {
  await openApp(page, '/checkout')
  await fillCheckoutForm(page)
  await connectWallet(page)
}

export async function completeCheckout(page: Page) {
  await prepareCheckout(page)
  await confirmPurchaseButton(page).click()
}

export function purchasedOrders(page: Page) {
  return page.getByRole('article', { name: /^Pedido KUR-/ })
}

export async function expectSingleOrderInActivity(page: Page) {
  await openApp(page, '/account?tab=activity')
  await expect(purchasedOrders(page)).toHaveCount(1)
}
