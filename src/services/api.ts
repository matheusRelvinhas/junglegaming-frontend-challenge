import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/types/api'

const api = axios.create({ baseURL: '/api', timeout: 10_000 })

type RequestOptions = {
  params?: object
  signal?: AbortSignal
  token?: string
}

type RequestConfig = InternalAxiosRequestConfig & { isRetryAfterReconnect?: boolean }

function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return { status: null, message: 'Erro inesperado. Tente novamente.' }
  }
  if (!error.response) {
    return { status: null, message: 'Sem conexão com o servidor. Verifique sua internet.' }
  }

  const responseData = error.response.data as { message?: string; field?: string } | string | undefined
  const isObject = typeof responseData === 'object'
  return {
    status: error.response.status,
    message: (isObject && responseData.message) || 'Não foi possível carregar os dados. Tente novamente.',
    field: isObject ? responseData.field : undefined,
  }
}

api.interceptors.response.use(async (response) => {
  const isJson = String(response.headers['content-type']).includes('application/json')
  if (isJson) return response

  const config: RequestConfig = response.config
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true' && !config.isRetryAfterReconnect) {
    const { reconnectMocks } = await import('@/mocks/browser')
    await reconnectMocks()
    const retryConfig: RequestConfig = { ...config, isRetryAfterReconnect: true }
    return api.request(retryConfig)
  }

  return Promise.reject(
    new AxiosError('Resposta não é JSON', AxiosError.ERR_BAD_RESPONSE, response.config, response.request, response),
  )
})

api.interceptors.response.use(undefined, (error) => Promise.reject(toApiError(error)))

function toAxiosConfig({ params, signal, token }: RequestOptions = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined
  return { params, signal, headers }
}

export async function axiosGet<T>(url: string, options?: RequestOptions): Promise<T> {
  const response = await api.get<T>(url, toAxiosConfig(options))
  return response.data
}

export async function axiosPost<T>(url: string, body: object, options?: RequestOptions): Promise<T> {
  const response = await api.post<T>(url, body, toAxiosConfig(options))
  return response.data
}
