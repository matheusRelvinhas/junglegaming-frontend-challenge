import { delay, http, HttpResponse } from 'msw'
import { STORAGE_KEYS } from '@/constants/storage'
import type { LoginBody, RegisterBody, User } from '@/types/api'
import { readStoredJson } from '@/utils/storage'

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000

const SEED_USERS = [
  { id: 'user-nova', name: 'Nova Sato', email: 'nova@kurio.test', password: 'kurio123' },
  { id: 'user-leo', name: 'Leo Matsu', email: 'leo@kurio.test', password: 'kurio123' },
]

type StoredUser = User & { password_hash: string }
type StoredSession = { token: string; user_id: string; expires_at: number }

async function hashPassword(password: string) {
  const salt = import.meta.env.VITE_PASSWORD_SALT ?? ''
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function saveStoredList(key: string, list: unknown[]) {
  localStorage.setItem(key, JSON.stringify(list))
}

async function getUsers() {
  const storedUsers = readStoredJson<StoredUser[] | null>(STORAGE_KEYS.mockUsers, null)
  if (storedUsers) return storedUsers

  const seededUsers: StoredUser[] = await Promise.all(
    SEED_USERS.map(async ({ password, ...user }) => ({ ...user, password_hash: await hashPassword(password) })),
  )
  saveStoredList(STORAGE_KEYS.mockUsers, seededUsers)
  return seededUsers
}

function toPublicUser(user: StoredUser): User {
  return { id: user.id, name: user.name, email: user.email }
}

function getActiveSessions() {
  const sessions = readStoredJson<StoredSession[]>(STORAGE_KEYS.mockSessions, [])
  return sessions.filter((session) => session.expires_at > Date.now())
}

function getBearerToken(request: Request) {
  return request.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
}

export const authHandlers = [
  http.post('/api/auth/register', async ({ request }) => {
    await delay()

    const body = (await request.json()) as RegisterBody
    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    if (!name || !email || !body.password) {
      return HttpResponse.json({ message: 'Preencha todos os campos.' }, { status: 422 })
    }

    const users = await getUsers()
    if (users.some((user) => user.email === email)) {
      return HttpResponse.json({ message: 'Este e-mail já está cadastrado.', field: 'email' }, { status: 409 })
    }

    const newUser: StoredUser = { id: crypto.randomUUID(), name, email, password_hash: await hashPassword(body.password) }
    saveStoredList(STORAGE_KEYS.mockUsers, [...users, newUser])
    return HttpResponse.json({ user: toPublicUser(newUser) }, { status: 201 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    await delay()

    const body = (await request.json()) as LoginBody
    const users = await getUsers()
    const user = users.find((storedUser) => storedUser.email === body.email?.trim().toLowerCase())
    const passwordHash = await hashPassword(body.password ?? '')
    if (!user || user.password_hash !== passwordHash) {
      return HttpResponse.json({ message: 'E-mail ou senha incorretos.' }, { status: 401 })
    }

    const session: StoredSession = { token: crypto.randomUUID(), user_id: user.id, expires_at: Date.now() + SESSION_DURATION_MS }
    saveStoredList(STORAGE_KEYS.mockSessions, [...getActiveSessions(), session])
    return HttpResponse.json({ token: session.token, user: toPublicUser(user) })
  }),

  http.get('/api/auth/session', async ({ request }) => {
    await delay()

    const token = getBearerToken(request)
    const session = getActiveSessions().find((activeSession) => activeSession.token === token)
    const user = session && (await getUsers()).find((storedUser) => storedUser.id === session.user_id)
    if (!user) {
      return HttpResponse.json({ message: 'Sua sessão expirou. Entre novamente.' }, { status: 401 })
    }

    return HttpResponse.json({ user: toPublicUser(user) })
  }),

  http.post('/api/auth/logout', async ({ request }) => {
    const token = getBearerToken(request)
    saveStoredList(
      STORAGE_KEYS.mockSessions,
      getActiveSessions().filter((session) => session.token !== token),
    )
    return HttpResponse.json({ ok: true })
  }),
]
