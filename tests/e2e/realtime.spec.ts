import type { Page } from '@playwright/test'
import { MOCK_COMMANDS } from '../../src/constants/realtime.ts'
import {
  addToCart,
  changeMarket,
  confirmPurchaseButton,
  expect,
  expectSingleOrderInActivity,
  login,
  openApp,
  prepareCheckout,
  receiptDialog,
  sendMockCommand,
  summaryValue,
  test,
  waitForRealtime,
} from '../support/app.ts'

function detailPrice(page: Page) {
  return page.getByRole('region', { name: 'Emerald Ape #042' }).getByText(/^\d+\.\d+ ETH$/).first()
}

async function sendSentinelEvent(page: Page) {
  await changeMarket(page, 2, 'price-up')
  await expect(page.getByText('1.86 ETH').first()).toBeVisible()
}

test.describe('Tempo real: nft.updated', () => {
  test('preço muda no detalhe sem recarregar a página', async ({ page }) => {
    await openApp(page, '/nft/1')
    await expect(detailPrice(page)).toHaveText('1.19 ETH')

    await changeMarket(page, 1, 'price-up')
    await expect(detailPrice(page)).toHaveText('1.31 ETH')
    await expect(page.getByRole('region', { name: 'Emerald Ape #042' }).getByText('Atualizado')).toBeVisible()
  })

  test('preço muda com o carrinho aberto: aviso e resumo atualizados', async ({ page }) => {
    await addToCart(page, 1, { edition: '1/50' })
    await expect(summaryValue(page, 'Subtotal')).toHaveText('1.19 ETH')

    await changeMarket(page, 1, 'price-up')
    await expect(page.getByText('Preços atualizados')).toBeVisible()
    await expect(page.getByText(/O preço de Emerald Ape #042 mudou de 1\.19 para\s*1\.31 ETH/)).toBeVisible()
    await expect(summaryValue(page, 'Subtotal')).toHaveText('1.31 ETH')
  })

  test('preço muda durante o checkout: a compra exige nova confirmação', async ({ page }) => {
    await addToCart(page, 1, { edition: '1/50' })
    await login(page)
    await prepareCheckout(page)

    await changeMarket(page, 1, 'price-up')
    await expect(page.getByText('Os valores mudaram desde a sua revisão')).toBeVisible()
    await expect(page.getByText('Emerald Ape #042: preço de 1.19 para 1.31 ETH.')).toBeVisible()
    await expect(confirmPurchaseButton(page)).toHaveText('Confirmar com novos valores')

    await confirmPurchaseButton(page).click()
    await expect(receiptDialog(page)).toBeVisible()
    await expect(receiptDialog(page)).toContainText('1.326 ETH')
  })

  test('edição esgota durante o checkout: o item sai do pedido e a compra é bloqueada', async ({ page }) => {
    await addToCart(page, 1, { edition: '1/1' })
    await login(page)
    await prepareCheckout(page)

    await changeMarket(page, 1, 'sell-out')
    await expect(page.getByText('Emerald Ape #042 (1/1) esgotou e saiu do pedido.')).toBeVisible()
    await expect(page.getByText('Emerald Ape #042 (1/1) esgotou.', { exact: true })).toBeVisible()

    await confirmPurchaseButton(page).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Nenhum item do carrinho está disponível.' })).toBeVisible()
    await expect(receiptDialog(page)).toBeHidden()
  })
})

test.describe('Tempo real: duplicatas, eventos antigos e conexão', () => {
  test('evento duplicado (mesmo eventId) não reaplica o efeito', async ({ page }) => {
    await addToCart(page, 1, { edition: '1/50' })
    await changeMarket(page, 1, 'price-up')
    await expect(page.getByText('Preços atualizados')).toBeVisible()
    await page.getByRole('button', { name: 'Entendi' }).click()
    await expect(page.getByText('Preços atualizados')).toBeHidden()

    await sendMockCommand(page, MOCK_COMMANDS.replayLastEvent)
    await sendSentinelEvent(page)
    await expect(page.getByText('Preços atualizados')).toBeHidden()
    await expect(summaryValue(page, 'Subtotal')).toHaveText('1.31 ETH')
  })

  test('evento antigo (versão menor) não regride o estado', async ({ page }) => {
    await openApp(page, '/nft/1')
    await expect(detailPrice(page)).toHaveText('1.19 ETH')
    await changeMarket(page, 1, 'price-up')
    await expect(detailPrice(page)).toHaveText('1.31 ETH')
    await changeMarket(page, 1, 'price-up')
    await expect(detailPrice(page)).toHaveText('1.44 ETH')

    await sendMockCommand(page, MOCK_COMMANDS.sendStaleEvent)
    await sendSentinelEvent(page)
    await expect(detailPrice(page)).toHaveText('1.44 ETH')
  })

  test('queda de conexão: ao reconectar, reconcilia com a API o que perdeu', async ({ page, context }) => {
    await openApp(page, '/nft/1')
    const otherTab = await context.newPage()
    await openApp(otherTab, '/nft/1')

    await sendMockCommand(page, MOCK_COMMANDS.dropConnection)
    await waitForRealtime(page, false)
    await changeMarket(otherTab, 1, 'price-up')
    await expect(detailPrice(otherTab)).toHaveText('1.31 ETH')

    await waitForRealtime(page)
    await expect(detailPrice(page)).toHaveText('1.31 ETH')
  })

  test('pedido pendente: queda de conexão e refresh retomam o mesmo pedido', async ({ page }) => {
    await addToCart(page, 1, { edition: '1/50' })
    await login(page)
    await prepareCheckout(page)
    await confirmPurchaseButton(page).click()
    await expect(page.getByText('Pagamento pendente.')).toBeVisible()

    await sendMockCommand(page, MOCK_COMMANDS.dropConnection)
    await waitForRealtime(page, false)
    await waitForRealtime(page)
    await expect(receiptDialog(page)).toBeVisible()

    await page.reload()
    await expect(receiptDialog(page)).toBeVisible()
    await expectSingleOrderInActivity(page)
  })
})
