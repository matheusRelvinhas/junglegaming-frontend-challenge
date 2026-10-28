import axios from 'axios'
import type { ApiError } from '@/types/api'

const api = axios.create({ baseURL: '/api', timeout: 10_000 })

type RequestOptions = {
  params?: object
  signal?: AbortSignal
}

function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return { status: null, message: 'Erro inesperado. Tente novamente.' }
  }
  if (!error.response) {
    return { status: null, message: 'Sem conexão com o servidor. Verifique sua internet.' }
  }

  const serverMessage = (error.response.data as { message?: string } | undefined)?.message
  return {
    status: error.response.status,
    message: serverMessage ?? 'Não foi possível carregar os dados. Tente novamente.',
  }
}

export async function axiosGet<T>(url: string, options?: RequestOptions): Promise<T> {
  try {
    const response = await api.get<T>(url, options)
    return response.data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function axiosPost<T>(url: string, body: object, options?: RequestOptions): Promise<T> {
  try {
    const response = await api.post<T>(url, body, options)
    return response.data
  } catch (error) {
    throw toApiError(error)
  }
}
