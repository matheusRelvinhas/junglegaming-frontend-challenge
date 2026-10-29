import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import type { ApiError, CreateOrderBody, Network, Order, Quote, QuoteBody, WalletConnection, WalletProvider } from '@/types/api'
import { axiosGet, axiosPost } from './api'

const ORDER_TIMEOUT_MS = 6000
const PENDING_ORDER_POLL_MS = 4000

export type OrderAttempt = {
  user_id: string
  idempotency_key: string
  body: CreateOrderBody
}

export function useQuote(body: QuoteBody, isEnabled: boolean) {
  return useQuery<Quote, ApiError>({
    queryKey: ['quote', body],
    queryFn: ({ signal }) => axiosPost<Quote>('quote', body, { signal }),
    enabled: isEnabled && body.items.length > 0,
    placeholderData: keepPreviousData,
  })
}

export function useConnectWallet(token: string | null) {
  return useMutation<WalletConnection, ApiError, { provider: WalletProvider; network: Network }>({
    mutationFn: (body) => axiosPost<WalletConnection>('wallet/connect', body, { token }),
  })
}

export function useCreateOrder(token: string | null) {
  return useMutation<Order, ApiError, OrderAttempt>({
    mutationFn: (attempt) =>
      axiosPost<Order>('orders', attempt.body, {
        token,
        idempotencyKey: attempt.idempotency_key,
        timeout: ORDER_TIMEOUT_MS,
      }),
    retry: (failureCount, error) => error.status === null && failureCount < 1,
  })
}

export function useOrder(token: string | null, orderId: string | undefined) {
  return useQuery<Order, ApiError>({
    queryKey: ['order', token, orderId],
    queryFn: ({ signal }) => axiosGet<Order>(`orders/${orderId}`, { signal, token }),
    enabled: token !== null && orderId !== undefined,
    retry: (failureCount, error) => error.status === null && failureCount < 2,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? PENDING_ORDER_POLL_MS : false),
  })
}
