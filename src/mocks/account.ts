import { http, HttpResponse } from 'msw'
import { STORAGE_KEYS } from '@/constants/storage'
import type { ChangePasswordBody, Profile, Wallets } from '@/types/api'
import { readStoredJson, saveStoredJson } from '@/utils/storage'
import { MIN_PASSWORD_LENGTH, validateProfileForm, validateWalletForm } from '@/utils/validation'
import { findRequestUserId, getUsers, hashPassword, saveUsers, toPublicUser, unauthorizedResponse, type StoredUser } from './auth'
import { getNfts } from './market'
import { getScenario, networkDelay } from './scenario'

const MAX_AVATAR_LENGTH = 700_000
const EMPTY_WALLETS: Wallets = { primary: null, secondary: null, secondary_same_as_primary: false }

type UserData<T> = { user_id: string; data: T }

function getUserData<T>(key: string, userId: string, fallback: T): T {
  return readStoredJson<UserData<T>[]>(key, []).find((item) => item.user_id === userId)?.data ?? fallback
}

function saveUserData<T>(key: string, userId: string, data: T) {
  const otherUsersData = readStoredJson<UserData<T>[]>(key, []).filter((item) => item.user_id !== userId)
  saveStoredJson(key, [...otherUsersData, { user_id: userId, data }])
}

function toProfile(user: StoredUser): Profile {
  return {
    name: user.name,
    email: user.email,
    username: user.username ?? '',
    ens_name: user.ens_name ?? '',
    wallet_nickname: user.wallet_nickname ?? '',
    avatar_url: user.avatar_url ?? null,
  }
}

function fieldError(field: string, message: string, status = 422) {
  return HttpResponse.json({ message, field }, { status })
}

function firstValidationError(errors: Record<string, string | undefined>, fieldPrefix = '') {
  const field = Object.keys(errors)[0]
  return field ? fieldError(`${fieldPrefix}${field}`, errors[field] ?? '') : null
}

export const accountHandlers = [
  http.get('/api/profile', async ({ request }) => {
    await networkDelay()

    const userId = findRequestUserId(request)
    const user = (await getUsers()).find((storedUser) => storedUser.id === userId)
    if (!user) return unauthorizedResponse()
    return HttpResponse.json(toProfile(user))
  }),

  http.post('/api/profile', async ({ request }) => {
    await networkDelay()

    const userId = findRequestUserId(request)
    const users = await getUsers()
    const user = users.find((storedUser) => storedUser.id === userId)
    if (!user) return unauthorizedResponse()

    const body = (await request.json()) as Profile
    const email = body.email.trim().toLowerCase()
    const validationError = firstValidationError(validateProfileForm(body))
    if (validationError) return validationError
    if (users.some((storedUser) => storedUser.email === email && storedUser.id !== user.id)) {
      return fieldError('email', 'Este e-mail já está em uso por outra conta.', 409)
    }
    if ((body.avatar_url?.length ?? 0) > MAX_AVATAR_LENGTH) return fieldError('avatar_url', 'Use uma imagem de até 500 KB.')

    const updatedUser: StoredUser = {
      ...user,
      name: body.name.trim(),
      email,
      username: body.username.trim(),
      ens_name: body.ens_name.trim(),
      wallet_nickname: body.wallet_nickname.trim(),
      avatar_url: body.avatar_url,
    }
    saveUsers(users.map((storedUser) => (storedUser.id === user.id ? updatedUser : storedUser)))
    return HttpResponse.json({ profile: toProfile(updatedUser), user: toPublicUser(updatedUser) })
  }),

  http.post('/api/profile/password', async ({ request }) => {
    await networkDelay()

    const userId = findRequestUserId(request)
    const users = await getUsers()
    const user = users.find((storedUser) => storedUser.id === userId)
    if (!user) return unauthorizedResponse()

    const body = (await request.json()) as ChangePasswordBody
    if ((await hashPassword(body.current_password)) !== user.password_hash) {
      return fieldError('current_password', 'A senha atual está incorreta.')
    }
    if (body.new_password.length < MIN_PASSWORD_LENGTH) {
      return fieldError('new_password', `A nova senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
    }

    const passwordHash = await hashPassword(body.new_password)
    saveUsers(users.map((storedUser) => (storedUser.id === user.id ? { ...storedUser, password_hash: passwordHash } : storedUser)))
    return HttpResponse.json({ ok: true })
  }),

  http.get('/api/wallets', async ({ request }) => {
    await networkDelay()

    const userId = findRequestUserId(request)
    if (!userId) return unauthorizedResponse()
    return HttpResponse.json(getUserData(STORAGE_KEYS.mockWallets, userId, EMPTY_WALLETS))
  }),

  http.post('/api/wallets', async ({ request }) => {
    await networkDelay()

    const userId = findRequestUserId(request)
    if (!userId) return unauthorizedResponse()

    const body = (await request.json()) as Wallets
    if (!body.primary) return fieldError('primary.address', 'Cadastre a carteira principal.')
    const validationError =
      firstValidationError(validateWalletForm(body.primary), 'primary.') ??
      (body.secondary && firstValidationError(validateWalletForm(body.secondary), 'secondary.'))
    if (validationError) return validationError

    const wallets: Wallets = {
      primary: body.primary,
      secondary: body.secondary_same_as_primary ? null : body.secondary,
      secondary_same_as_primary: body.secondary_same_as_primary,
    }
    saveUserData(STORAGE_KEYS.mockWallets, userId, wallets)
    return HttpResponse.json(wallets)
  }),

  http.get('/api/favorites', async ({ request }) => {
    await networkDelay()

    const userId = findRequestUserId(request)
    if (!userId) return unauthorizedResponse()
    return HttpResponse.json({ nft_ids: getUserData<number[]>(STORAGE_KEYS.mockFavorites, userId, []) })
  }),

  http.post('/api/favorites/:nftId', async ({ request, params }) => {
    await networkDelay()

    const userId = findRequestUserId(request)
    if (!userId) return unauthorizedResponse()
    if (getScenario().favorites === 'fail') {
      return HttpResponse.json({ message: 'Não foi possível atualizar seus favoritos. Tente de novo.' }, { status: 503 })
    }

    const nftId = Number(params.nftId)
    if (!getNfts().some((nft) => nft.id === nftId)) {
      return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
    }

    const body = (await request.json()) as { is_favorite: boolean }
    const otherFavorites = getUserData<number[]>(STORAGE_KEYS.mockFavorites, userId, []).filter((id) => id !== nftId)
    const favorites = body.is_favorite ? [...otherFavorites, nftId] : otherFavorites
    saveUserData(STORAGE_KEYS.mockFavorites, userId, favorites)
    return HttpResponse.json({ nft_ids: favorites })
  }),
]
