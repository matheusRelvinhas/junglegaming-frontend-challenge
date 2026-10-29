import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/types/api'

const api = axios.create({ baseURL: '/api', timeout: 10_000 })

type RequestOptions = {
  params?: object
  signal?: AbortSignal
  token?: string | null
  idempotencyKey?: string
  timeout?: number
}

type RequestConfig = InternalAxiosRequestConfig & { isRetryAfterReconnect?: boolean }

function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return { status: null, message: 'Erro inesperado. Tente novamente.' }
  }
  if (!error.response) {
    return { status: null, message: 'Sem conexão com o servidor. Verifique sua internet.' }
  }

  const responseData = error.response.data as { message?: string; field?: string; code?: string } | string | undefined
  const isObject = typeof responseData === 'object'
  return {
    status: error.response.status,
    message: (isObject && responseData.message) || 'Não foi possível carregar os dados. Tente novamente.',
    field: isObject ? responseData.field : undefined,
    code: isObject ? responseData.code : undefined,
  }
}

function isJsonResponse(response: AxiosResponse) {
  return String(response.headers['content-type']).includes('application/json')
}

function canRetryThroughMocks(config?: RequestConfig) {
  return import.meta.env.VITE_ENABLE_MOCKS === 'true' && config !== undefined && !config.isRetryAfterReconnect
}

async function retryThroughMocks(config: RequestConfig) {
  const { reconnectMocks } = await import('@/mocks/browser')
  await reconnectMocks()
  const retryConfig: RequestConfig = { ...config, isRetryAfterReconnect: true }
  return api.request(retryConfig)
}

api.interceptors.response.use(
  (response) => {
    if (isJsonResponse(response)) return response
    if (canRetryThroughMocks(response.config)) return retryThroughMocks(response.config)

    const notJsonError = new AxiosError('Resposta não é JSON', AxiosError.ERR_BAD_RESPONSE, response.config, response.request, response)
    return Promise.reject(toApiError(notJsonError))
  },
  (error) => {
    const isEscapedResponse = axios.isAxiosError(error) && error.response && !isJsonResponse(error.response)
    if (isEscapedResponse && error.config && canRetryThroughMocks(error.config)) return retryThroughMocks(error.config)
    return Promise.reject(toApiError(error))
  },
)

function toAxiosConfig({ params, signal, token, idempotencyKey, timeout }: RequestOptions = {}) {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
  return { params, signal, headers, timeout }
}

export async function axiosGet<T>(url: string, options?: RequestOptions): Promise<T> {
  const response = await api.get<T>(url, toAxiosConfig(options))
  return response.data
}

export async function axiosPost<T>(url: string, body: object, options?: RequestOptions): Promise<T> {
  const response = await api.post<T>(url, body, toAxiosConfig(options))
  return response.data
}
