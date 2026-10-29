import type { Page } from '@playwright/test'
import {
  addToCart,
  chooseScenarioInPanel,
  expect,
  expectLoggedIn,
  favoriteNft,
  fillLogin,
  login,
  loginButton,
  loginDialog,
  logout,
  openApp,
  test,
  TEST_WALLET_ADDRESS,
  USERS,
} from '../support/app.ts'

const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

async function openAccount(page: Page, tab = 'profile') {
  await openApp(page, `/account?tab=${tab}`)
  await login(page)
}

function saveButton(page: Page) {
  return page.getByRole('button', { name: 'Salvar', exact: true })
}

function primaryWallet(page: Page) {
  return page.getByRole('region', { name: 'Carteira principal' })
}

test.describe('Perfil do colecionador', () => {
  test('edita os dados com validação, erro da API e persistência', { tag: '@principal' }, async ({ page, isMobile }) => {
    await openAccount(page)
    await expect(page.getByLabel('Nome de exibição')).toHaveValue(USERS.nova.name)

    await saveButton(page).click()
    await expect(page.getByLabel('Nome de usuário')).toBeFocused()
    await expect(page.getByText('Use de 3 a 20 letras, números, ponto ou _.')).toBeVisible()

    await page.getByLabel('Nome de usuário').fill('nova_sato')
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(USERS.leo.email)
    await saveButton(page).click()
    await expect(page.getByText('Este e-mail já está em uso por outra conta.')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toBeFocused()

    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(USERS.nova.email)
    await page.getByLabel('Nome de exibição').fill('Nova Kurio')
    await page.getByLabel('Nome ENS').fill('nova')
    await page.getByLabel('Apelido da carteira').fill('Principal')
    await saveButton(page).click()
    await expect(page.getByRole('status').filter({ hasText: 'Perfil salvo.' })).toBeVisible()

    await page.reload()
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Nova Kurio')
    await expect(page.getByLabel('Nome de usuário')).toHaveValue('nova_sato')
    await expect(page.getByLabel('Nome ENS')).toHaveValue('nova')
    await expectLoggedIn(page, isMobile, 'Nova Kurio')
  })

  test('avatar: valida o arquivo, salva, persiste e remove', async ({ page }) => {
    await openAccount(page)
    await page.getByLabel('Nome de usuário').fill('nova_sato')
    const avatarInput = page.locator('input[type="file"]')

    await avatarInput.setInputFiles({ name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('não é imagem') })
    await expect(page.getByText('Escolha um arquivo de imagem.')).toBeVisible()

    await avatarInput.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG_1PX })
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()
    await saveButton(page).click()
    await expect(page.getByRole('status').filter({ hasText: 'Perfil salvo.' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()

    await page.getByRole('button', { name: 'Remover', exact: true }).click()
    await saveButton(page).click()
    await expect(page.getByRole('status').filter({ hasText: 'Perfil salvo.' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeHidden()
  })

  test('altera a senha com validação e entra com a nova', async ({ page }) => {
    await openAccount(page)
    const changePassword = page.getByRole('button', { name: 'Alterar senha' })

    await page.getByLabel(/^Senha atual/).fill('senha-errada')
    await page.getByLabel(/^Nova senha/).fill('123')
    await page.getByLabel(/^Confirmar nova senha/).fill('456')
    await changePassword.click()
    await expect(page.getByText('A nova senha precisa ter pelo menos 6 caracteres.')).toBeVisible()
    await expect(page.getByText('As senhas não conferem.')).toBeVisible()

    await page.getByLabel(/^Nova senha/).fill('novaSenha1')
    await page.getByLabel(/^Confirmar nova senha/).fill('novaSenha1')
    await changePassword.click()
    await expect(page.getByText('A senha atual está incorreta.')).toBeVisible()
    await expect(page.getByLabel(/^Senha atual/)).toBeFocused()

    await page.getByLabel(/^Senha atual/).fill(USERS.nova.password)
    await changePassword.click()
    await expect(page.getByRole('status').filter({ hasText: 'Senha alterada.' })).toBeVisible()

    await logout(page, false)
    await loginButton(page).click()
    await fillLogin(page, USERS.nova)
    await expect(loginDialog(page).getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
    await fillLogin(page, { email: USERS.nova.email, password: 'novaSenha1' })
    await expect(loginDialog(page)).toBeHidden()
  })

  test('cadastra carteiras com validação e o pagamento passa a usá-las', async ({ page }) => {
    await openAccount(page, 'wallets')
    const saveWallets = page.getByRole('button', { name: 'Salvar carteiras' })

    await saveWallets.click()
    await expect(primaryWallet(page).getByLabel('Apelido da carteira')).toBeFocused()
    await expect(primaryWallet(page).getByText('Use pelo menos 2 caracteres.')).toBeVisible()

    await primaryWallet(page).getByLabel('Apelido da carteira').fill('Principal')
    await primaryWallet(page).getByRole('combobox', { name: 'Rede', exact: true }).selectOption('ethereum')
    await primaryWallet(page).getByLabel('Endereço da carteira').fill('0x123')
    await primaryWallet(page).getByRole('combobox', { name: 'Tipo de carteira' }).selectOption({ index: 1 })
    await saveWallets.click()
    await expect(primaryWallet(page).getByLabel('Endereço da carteira')).toBeFocused()
    await expect(primaryWallet(page).getByText('Informe 0x seguido de 40 caracteres hexadecimais.')).toBeVisible()

    await primaryWallet(page).getByLabel('Endereço da carteira').fill(TEST_WALLET_ADDRESS)
    await page.getByRole('button', { name: 'Adicionar' }).click()
    await expect(page.getByRole('region', { name: 'Carteira secundária' }).getByLabel('Apelido da carteira')).toBeVisible()
    await page.getByLabel('Igual à carteira principal').check()
    await saveWallets.click()
    await expect(page.getByRole('status').filter({ hasText: 'Carteiras salvas.' })).toBeVisible()

    await page.reload()
    await expect(primaryWallet(page).getByLabel('Endereço da carteira')).toHaveValue(TEST_WALLET_ADDRESS)
    await expect(page.getByLabel('Igual à carteira principal')).toBeChecked()

    await addToCart(page, 1, { edition: '1/50' })
    await openApp(page, '/checkout')
    await expect(page.getByLabel('Endereço da carteira')).toHaveValue(TEST_WALLET_ADDRESS)
    await expect(page.getByRole('combobox', { name: 'Rede', exact: true })).toHaveValue('ethereum')
    await expect(page.getByLabel(/^Carteira secundária/)).toHaveValue(TEST_WALLET_ADDRESS)
  })
})

test.describe('Lista de interesse (favoritos)', () => {
  test('favoritar é otimista, persiste e aparece na lista', { tag: '@principal' }, async ({ page }) => {
    await openApp(page, '/nft/1')
    await login(page)
    await chooseScenarioInPanel(page, 'Rede', 'Lenta (+2s)')
    const savedFavorite = favoriteNft(page, 1)
    await expect(page.getByRole('button', { name: 'Favoritado' })).toBeVisible({ timeout: 1000 })
    await savedFavorite

    await chooseScenarioInPanel(page, 'Rede', 'Normal')
    await page.reload()
    await expect(page.getByRole('button', { name: 'Favoritado' })).toBeVisible()
    await openApp(page, '/account?tab=favorites')
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  })

  test('falha da mutation desfaz a mudança e a nova tentativa recupera', async ({ page }) => {
    await openApp(page, '/nft/1')
    await login(page)
    await chooseScenarioInPanel(page, 'Favoritos', 'Falha')

    await page.getByRole('button', { name: 'Favoritar' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível atualizar seus favoritos. Tente de novo.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Favoritar' })).toHaveAttribute('aria-pressed', 'false')

    await chooseScenarioInPanel(page, 'Favoritos', 'Salva')
    await favoriteNft(page, 1)
    await expect(page.getByRole('button', { name: 'Favoritado' })).toHaveAttribute('aria-pressed', 'true')

    await page.reload()
    await expect(page.getByRole('button', { name: 'Favoritado' })).toBeVisible()
  })

  test('remover da lista com falha mantém o item; sem falha, remove', async ({ page }) => {
    await openApp(page, '/nft/2')
    await login(page)
    await favoriteNft(page, 2)

    await openApp(page, '/account?tab=favorites')
    const removeButton = page.getByRole('button', { name: 'Remover Sage Nomad #009 da lista de interesse' })
    await chooseScenarioInPanel(page, 'Favoritos', 'Falha')
    await removeButton.click()
    await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível atualizar seus favoritos.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sage Nomad #009' })).toBeVisible()

    await chooseScenarioInPanel(page, 'Favoritos', 'Salva')
    await removeButton.click()
    await expect(page.getByRole('heading', { name: 'Sua lista de interesse está vazia' })).toBeVisible()
  })

  test('deslogado, favoritar abre o login', async ({ page }) => {
    await openApp(page, '/nft/1')
    await page.getByRole('button', { name: 'Favoritar' }).click()
    await expect(page).toHaveURL(/auth=login/)
    await expect(loginDialog(page)).toBeVisible()
  })
})
