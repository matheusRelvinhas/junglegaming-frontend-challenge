import {
  addToCart,
  cartLink,
  completeCheckout,
  confirmPurchaseButton,
  connectWallet,
  expect,
  expectSingleOrderInActivity,
  fillCheckoutForm,
  fillLogin,
  login,
  openApp,
  prepareCheckout,
  purchasedOrders,
  receiptDialog,
  test,
  USERS,
} from '../support/app.ts'

test.describe('Pagamento', () => {
  test('compra completa: do catálogo ao recibo confirmado', { tag: '@principal' }, async ({ page }) => {
    await openApp(page)
    await page.locator('#catalogo').getByRole('link', { name: /Emerald Ape #042/ }).first().click()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await page.getByRole('list', { name: 'Edições' }).getByRole('button', { name: '1/50' }).click()
    await page.getByRole('button', { name: 'COMPRAR' }).click()

    await expect(page).toHaveURL(/\/cart$/)
    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
    await fillLogin(page, USERS.nova)
    await expect(page).toHaveURL(/\/checkout$/)

    await fillCheckoutForm(page)
    await connectWallet(page)
    await confirmPurchaseButton(page).click()

    await expect(page.getByText('Pagamento pendente.')).toBeVisible()
    await expect(page).toHaveURL(/order=KUR-/)
    const receipt = receiptDialog(page)
    await expect(receipt).toBeVisible()
    await expect(receipt).toContainText('Emerald Ape #042')
    await expect(receipt).toContainText('Edição 1/50')
    await expect(receipt).toContainText('0.016 ETH')
    await expect(receipt).toContainText('1.206 ETH')
    await expect(receipt).toContainText('MetaMask')
    await expect(receipt).toContainText(/ID da transação\s*0x[0-9a-f]{4}…[0-9a-f]{4}/)
    await expect(receipt).toContainText('Transação confirmada na Ethereum')

    await receipt.getByRole('button', { name: 'Fechar recibo' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(cartLink(page)).toHaveAccessibleName('Carrinho com 0 itens')

    await expectSingleOrderInActivity(page)
    await expect(purchasedOrders(page)).toContainText('Total pago1.206 ETH')
  })

  test('validação do formulário e da carteira antes do envio', async ({ page }) => {
    await addToCart(page, 1, { edition: '1/50' })
    await login(page)
    await openApp(page, '/checkout')

    await confirmPurchaseButton(page).click()
    await expect(page.getByLabel('Nome de usuário')).toBeFocused()
    await expect(page.getByLabel('Nome de usuário')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByText('Use de 3 a 20 letras, números, ponto ou _.')).toBeVisible()

    await fillCheckoutForm(page)
    await confirmPurchaseButton(page).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Conecte uma carteira para continuar.' })).toBeVisible()
  })

  test.describe('com pagamento recusado', () => {
    test.use({ scenario: { payment: 'decline' } })

    test('mostra a recusa, mantém o carrinho e permite tentar de novo', async ({ page }) => {
      await addToCart(page, 1, { edition: '1/50' })
      await login(page)
      await completeCheckout(page)

      await expect(page.getByText('Pagamento recusado.', { exact: true })).toBeVisible()
      await expect(page.getByText('A carteira recusou o pagamento. Nenhum valor foi cobrado.')).toBeVisible()
      await expect(receiptDialog(page)).toBeHidden()
      await expect(confirmPurchaseButton(page)).toHaveText('Tentar novamente')
      await expect(cartLink(page)).toHaveAccessibleName('Carrinho com 1 itens')

      await openApp(page, '/account?tab=activity')
      await expect(page.getByRole('heading', { name: 'Você ainda não comprou NFTs' })).toBeVisible()
    })
  })

  test('clique repetido em confirmar não duplica o pedido', async ({ page }) => {
    await addToCart(page, 1, { edition: '1/50' })
    await login(page)
    await prepareCheckout(page)

    await confirmPurchaseButton(page).dblclick()
    await expect(receiptDialog(page)).toBeVisible()
    await expectSingleOrderInActivity(page)
  })

  test.describe('com timeout depois de criar o pedido', () => {
    test.use({ scenario: { payment: 'timeout' } })

    test('reenvia com a mesma chave e recupera o mesmo pedido', async ({ page }) => {
      await addToCart(page, 1, { edition: '1/50' })
      await login(page)
      await completeCheckout(page)

      await expect(confirmPurchaseButton(page)).toHaveText('Sem resposta, tentando de novo…', { timeout: 15_000 })
      await expect(receiptDialog(page)).toBeVisible({ timeout: 15_000 })
      await expectSingleOrderInActivity(page)
    })
  })
})
