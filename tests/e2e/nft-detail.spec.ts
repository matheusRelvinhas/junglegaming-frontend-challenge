import { clickTimes, expect, openApp, test } from '../support/app.ts'

test.describe('Detalhe do NFT', () => {
  test('acesso direto pela URL mostra o NFT', { tag: '@principal' }, async ({ page }) => {
    await openApp(page, '/nft/1')

    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page).toHaveTitle('Emerald Ape #042 | Kurio')
    await expect(page.getByText('1.19 ETH').first()).toBeVisible()
    await expect(page.getByRole('list', { name: 'Edições' }).getByRole('button')).toHaveText(['1/1', '1/10', '1/50', 'ABERTA'])
    await expect(page.getByRole('heading', { name: 'Mais desta coleção' })).toBeVisible()
  })

  test('NFT inexistente mostra 404 e volta ao mercado', { tag: '@principal' }, async ({ page }) => {
    await openApp(page, '/nft/9999')

    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
    await page.getByRole('link', { name: 'Voltar para o mercado' }).click()
    await expect(page).toHaveURL(/\/#catalogo$/)
  })

  test('rota inexistente mostra página não encontrada', { tag: '@principal' }, async ({ page }) => {
    await openApp(page, '/rota-que-nao-existe')

    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
    await page.getByRole('link', { name: 'Voltar para o início' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('edição esgotada fica indisponível e a quantidade respeita o estoque', { tag: '@principal' }, async ({ page }) => {
    await openApp(page, '/nft/3')
    const editions = page.getByRole('list', { name: 'Edições' })
    const stepper = page.getByRole('group', { name: 'Quantidade', exact: true })

    await expect(editions.getByRole('button', { name: '1/1 (esgotada)' })).toBeDisabled()

    await editions.getByRole('button', { name: '1/10' }).click()
    await expect(page.getByText('9 disponíveis')).toBeVisible()
    await clickTimes(stepper.getByRole('button', { name: 'Aumentar quantidade' }), 8)
    await expect(stepper.locator('output')).toHaveText('9')
    await expect(stepper.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()

    await page.getByRole('button', { name: 'COMPRAR' }).click()
    await expect(page).toHaveURL(/\/cart$/)

    await page.goBack()
    await editions.getByRole('button', { name: '1/10' }).click()
    await expect(page.getByText('9 disponíveis · 9 no carrinho')).toBeVisible()
    await expect(page.getByRole('button', { name: 'LIMITE NO CARRINHO' })).toBeDisabled()
  })
})
