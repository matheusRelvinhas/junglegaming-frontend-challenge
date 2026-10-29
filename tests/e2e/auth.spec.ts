import {
  clickInMockPanel,
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
  USERS,
} from '../support/app.ts'

test.describe('Conta e sessão', () => {
  test('cadastro valida os campos e trata e-mail já cadastrado', { tag: '@principal' }, async ({ page, isMobile }) => {
    await openApp(page, '/?auth=signup')
    const signup = page.getByRole('dialog', { name: 'Criar perfil de colecionador' })

    await signup.getByRole('button', { name: 'Criar conta' }).click()
    await expect(signup.getByText('Use pelo menos 3 caracteres no nome de usuário.')).toBeVisible()
    await expect(signup.getByText('Informe um e-mail válido.')).toBeVisible()
    await expect(signup.getByLabel('Nome de usuário')).toBeFocused()

    await signup.getByLabel('Nome de usuário').fill('Colecionador Teste')
    await signup.getByLabel('E-mail').fill(USERS.nova.email)
    await signup.getByLabel('Senha', { exact: true }).fill('segredo1')
    await signup.getByLabel('Confirmar senha', { exact: true }).fill('outra-senha')
    await signup.getByRole('button', { name: 'Criar conta' }).click()
    await expect(signup.getByText('As senhas não conferem.')).toBeVisible()

    await signup.getByLabel('Confirmar senha', { exact: true }).fill('segredo1')
    await signup.getByRole('button', { name: 'Criar conta' }).click()
    await expect(signup.getByText('Este e-mail já está cadastrado.')).toBeVisible()
    await expect(signup.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')

    await signup.getByLabel('E-mail').fill('teste@kurio.test')
    await signup.getByRole('button', { name: 'Criar conta' }).click()
    await expect(loginDialog(page).getByText('Conta criada! Entre com seu e-mail e senha.')).toBeVisible()
    await expect(loginDialog(page).getByLabel('E-mail')).toHaveValue('teste@kurio.test')

    await fillLogin(page, { email: 'teste@kurio.test', password: 'segredo1' })
    await expect(loginDialog(page)).toBeHidden()
    await expectLoggedIn(page, isMobile, 'Colecionador Teste')
  })

  test('login com erro, sessão que sobrevive ao refresh e logout', { tag: '@principal' }, async ({ page, isMobile }) => {
    await openApp(page)
    await loginButton(page).click()

    await fillLogin(page, { email: USERS.nova.email, password: 'senha-errada' })
    await expect(loginDialog(page).getByRole('alert')).toHaveText('E-mail ou senha incorretos.')

    await fillLogin(page, USERS.nova)
    await expect(loginDialog(page)).toBeHidden()
    await expectLoggedIn(page, isMobile, USERS.nova.name)

    await page.reload()
    await expectLoggedIn(page, isMobile, USERS.nova.name)

    await logout(page, isMobile)
    await page.reload()
    await expect(loginButton(page)).toBeVisible()
  })

  test('sessão expirada pede login e volta para a mesma tela', async ({ page }) => {
    await openApp(page, '/account?tab=wallets')
    await login(page)
    await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()

    await clickInMockPanel(page, 'Expirar sessão no servidor')
    await page.reload()

    await expect(page.getByRole('heading', { name: 'Entre para ver seu perfil' })).toBeVisible()
    await page.getByRole('main').getByRole('button', { name: 'Entrar' }).click()
    await fillLogin(page, USERS.nova)

    await expect(page).toHaveURL(/\/account\?tab=wallets$/)
    await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
  })

  test('troca de usuário não mostra dados privados do anterior', async ({ page }) => {
    await openApp(page, '/nft/1')
    await login(page, USERS.nova)
    await favoriteNft(page, 1)

    await openApp(page, '/account?tab=favorites')
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()

    await logout(page, false)
    await login(page, USERS.leo)
    await openApp(page, '/account?tab=favorites')
    await expect(page.getByRole('heading', { name: 'Sua lista de interesse está vazia' })).toBeVisible()

    await openApp(page, '/account')
    await expect(page.getByLabel('Nome de exibição')).toHaveValue(USERS.leo.name)
  })
})
