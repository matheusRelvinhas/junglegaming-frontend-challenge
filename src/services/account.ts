import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiError, ChangePasswordBody, FavoritesResponse, Order, Profile, ProfileResponse, Wallets } from '@/types/api'
import { axiosGet, axiosPost } from './api'

export function useProfile(token: string | null) {
  return useQuery<Profile, ApiError>({
    queryKey: ['profile', token],
    queryFn: ({ signal }) => axiosGet<Profile>('profile', { signal, token }),
    enabled: token !== null,
  })
}

export function useUpdateProfile(token: string | null) {
  const queryClient = useQueryClient()
  return useMutation<ProfileResponse, ApiError, Profile>({
    mutationFn: (profile) => axiosPost<ProfileResponse>('profile', profile, { token }),
    onSuccess: (response) => {
      queryClient.setQueryData(['profile', token], response.profile)
      queryClient.setQueryData(['session', token], { user: response.user })
    },
  })
}

export function useChangePassword(token: string | null) {
  return useMutation<unknown, ApiError, ChangePasswordBody>({
    mutationFn: (body) => axiosPost('profile/password', body, { token }),
  })
}

export function useWallets(token: string | null) {
  return useQuery<Wallets, ApiError>({
    queryKey: ['wallets', token],
    queryFn: ({ signal }) => axiosGet<Wallets>('wallets', { signal, token }),
    enabled: token !== null,
  })
}

export function useSaveWallets(token: string | null) {
  const queryClient = useQueryClient()
  return useMutation<Wallets, ApiError, Wallets>({
    mutationFn: (wallets) => axiosPost<Wallets>('wallets', wallets, { token }),
    onSuccess: (wallets) => queryClient.setQueryData(['wallets', token], wallets),
  })
}

export function useOrders(token: string | null) {
  return useQuery<Order[], ApiError>({
    queryKey: ['orders', token],
    queryFn: ({ signal }) => axiosGet<Order[]>('orders', { signal, token }),
    enabled: token !== null,
  })
}

export function useFavorites(token: string | null) {
  return useQuery<FavoritesResponse, ApiError>({
    queryKey: ['favorites', token],
    queryFn: ({ signal }) => axiosGet<FavoritesResponse>('favorites', { signal, token }),
    enabled: token !== null,
  })
}

type ToggleFavoriteVariables = { nftId: number; isFavorite: boolean }

export function useToggleFavorite(token: string | null) {
  const queryClient = useQueryClient()
  const queryKey = ['favorites', token]

  return useMutation<FavoritesResponse, ApiError, ToggleFavoriteVariables, { previous?: FavoritesResponse }>({
    mutationFn: ({ nftId, isFavorite }) =>
      axiosPost<FavoritesResponse>(`favorites/${nftId}`, { is_favorite: isFavorite }, { token }),
    onMutate: async ({ nftId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<FavoritesResponse>(queryKey)
      const otherIds = (previous?.nft_ids ?? []).filter((id) => id !== nftId)
      queryClient.setQueryData<FavoritesResponse>(queryKey, { nft_ids: isFavorite ? [...otherIds, nftId] : otherIds })
      return { previous }
    },
    onSuccess: (favorites) => queryClient.setQueryData(queryKey, favorites),
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
